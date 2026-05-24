import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const stripUndefined = (value) => {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  );
};

const toDraftText = (draft = {}) => {
  return draft.text || draft.draftText || draft.body || draft.message || '';
};

const toDraftThreadId = (draft = {}, fallback = {}) => {
  return draft.threadId || draft.thread_id || draft.id || fallback.threadId || `draft-${Date.now()}`;
};

export const normalizeDraftRow = (row = {}) => {
  const createdAt = row.created_at || row.createdAt || Date.now();
  const updatedAt = row.updated_at || row.updatedAt || createdAt;

  return {
    id: row.id,
    draftId: row.id,
    threadId: row.thread_id || row.threadId || row.id,
    userId: row.user_id || row.userId || null,
    contact: row.contact_name || row.contact || row.name || row.sender || 'Unknown contact',
    contactEmail: row.contact_email || row.email || row.from_email || null,
    platform: row.platform || 'gmail',
    thread: row.thread || row.subject || row.title || 'Draft thread',
    subject: row.subject || row.thread || row.title || 'Draft thread',
    text: row.draft_text || row.text || row.body || row.message || '',
    label: row.label || row.category || 'all',
    status: row.status || 'draft',
    createdAt,
    updatedAt,
    sentAt: row.sent_at || row.sentAt || null,
    messages: row.messages || [],
    raw: row
  };
};

const buildDraftPayloadVariants = (draft = {}, fallback = {}, status = 'draft') => {
  const threadId = toDraftThreadId(draft, fallback);
  const base = {
    user_id: draft.userId || fallback.userId || null,
    platform: draft.platform || fallback.platform || 'gmail',
    thread_id: threadId,
    contact_name: draft.contact || draft.contactName || draft.name || draft.sender || fallback.contact || fallback.contactName || null,
    contact_email: draft.contactEmail || draft.email || fallback.contactEmail || fallback.email || null,
    subject: draft.subject || draft.thread || draft.title || fallback.subject || fallback.thread || null,
    status
  };

  const text = toDraftText(draft);
  const sentAt = status === 'sent' ? new Date().toISOString() : undefined;

  return [
    stripUndefined({ ...base, draft_text: text, sent_at: sentAt }),
    stripUndefined({ ...base, text, sent_at: sentAt }),
    stripUndefined({ ...base, draft_text: text }),
    stripUndefined({ ...base, text })
  ];
};

const tryWriteDraftRecord = async (operation, payloadVariants) => {
  let lastError = null;

  for (const payload of payloadVariants) {
    const query = operation(payload);
    const { data, error } = await query.select('*').single();

    if (!error && data) {
      return { data, error: null };
    }

    lastError = error;
  }

  return { data: null, error: lastError };
};

/**
 * Get or create user in Supabase
 */
export const upsertUser = async (googleId, email, name, avatar) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          google_id: googleId,
          email,
          name,
          avatar_url: avatar,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'google_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('upsertUser error:', error);
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('getUser error:', error);
    throw error;
  }
};

/**
 * Update a user's billing plan
 */
export const updateUserPlan = async (userId, plan) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        plan,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('updateUserPlan error:', error);
    throw error;
  }
};

/**
 * Get drafts for user
 */
export const getDraftsForUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('getDraftsForUser error:', error);
    throw error;
  }
};

export const saveDraftForUser = async (userId, draft, fallback = {}) => {
  const payloadVariants = buildDraftPayloadVariants(
    { ...draft, userId },
    { ...fallback, userId },
    draft.status || fallback.status || 'draft'
  );

  const threadId = toDraftThreadId(draft, fallback);
  const platform = draft.platform || fallback.platform || 'gmail';

  try {
    const { data: existing, error: existingError } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', userId)
      .eq('thread_id', threadId)
      .eq('platform', platform)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing?.id) {
      const updateVariants = payloadVariants.map((payload) => ({
        ...payload,
        user_id: userId,
        thread_id: threadId,
        platform
      }));

      let lastError = null;

      for (const payload of updateVariants) {
        const { data, error } = await supabase
          .from('drafts')
          .update(payload)
          .eq('id', existing.id)
          .select('*')
          .single();

        if (!error && data) {
          return data;
        }

        lastError = error;
      }

      throw lastError || new Error('Failed to update existing draft record.');
    }

    const { data, error } = await tryWriteDraftRecord(
      (payload) => supabase.from('drafts').insert(payload),
      payloadVariants
    );

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('saveDraftForUser error:', error);
    throw error;
  }
};

export const updateDraftForUser = async (userId, draftId, changes = {}) => {
  try {
    const payloadVariants = [
      stripUndefined({
        ...changes,
        sent_at: changes.status === 'sent' ? new Date().toISOString() : changes.sent_at
      }),
      stripUndefined({
        status: changes.status
      })
    ];

    let lastError = null;

    for (const payload of payloadVariants) {
      const { data, error } = await supabase
        .from('drafts')
        .update(payload)
        .eq('id', draftId)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (!error && data) {
        return data;
      }

      lastError = error;
    }

    throw lastError || new Error('Failed to update draft.');
  } catch (error) {
    console.error('updateDraftForUser error:', error);
    throw error;
  }
};

export const mapDraftRowsToApiDrafts = (rows = []) => {
  return rows.map((row) => normalizeDraftRow(row));
};

export default supabase;
