// extension/src/popup/pages/ComposePage.jsx
// Lets user write a brand new email from scratch — no thread needed.
// User fills in: To, Subject, and a brief prompt.
// AI generates the full email. User reviews, edits, and sends.

import { useCallback, useState } from "react"
import { generateCompose, sendNewEmail } from "../../lib/api"

// ─── Design tokens ────────────────────────────────────────────
const C = {
  bg0: "#FFFFFF", bg1: "#F8F7F4", bg2: "#F2F0EB",
  t0: "#1A1A18",  t1: "#6B6A65",  t2: "#A8A7A1",
  b0: "#F0EEE8",  b1: "#E8E6E0",
  accent: "#185FA5", accentHover: "#0C447C",
  accentBg: "#E6F1FB", accentText: "#0C447C",
  ok: "#1D9E75", okBg: "#E1F5EE",
  err: "#E24B4A", errBg: "#FCEBEB", errText: "#791F1F",
}
const FONT = "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"

// ─── Prompt examples shown as placeholder hints ───────────────
const PROMPT_HINTS = [
  "Follow up on last week's call and ask if they've reviewed the proposal",
  "Introduce myself and ask if they'd be open to a 15-min call",
  "Thank them for the meeting and share next steps",
  "Check in on the project timeline and ask if they need anything",
]

// ─── Sub-components ───────────────────────────────────────────

function Spinner({ size = 14, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: "spin 0.75s linear infinite", flexShrink: 0 }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5"
        strokeDasharray="40 20" strokeLinecap="round"/>
    </svg>
  )
}

function FieldLabel({ text, required }) {
  return (
    <p style={{
      fontSize: 9, fontWeight: 500, color: C.t1, fontFamily: FONT,
      margin: "0 0 4px", letterSpacing: "0.04em",
    }}>
      {text}
      {required && <span style={{ color: C.err, marginLeft: 2 }}>*</span>}
    </p>
  )
}

function TextInput({ value, onChange, placeholder, type = "text", error }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%", height: 34, padding: "0 10px",
        fontSize: 12, fontFamily: FONT, color: C.t0,
        background: C.bg0,
        border: `0.5px solid ${error ? C.err : focused ? C.accent : C.b1}`,
        borderRadius: 8, outline: "none",
        transition: "border-color 0.15s",
      }}
    />
  )
}

function TextArea({ value, onChange, placeholder, rows = 3, error }) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%", padding: "8px 10px",
        fontSize: 12, fontFamily: FONT, color: C.t0, lineHeight: 1.6,
        background: C.bg0,
        border: `0.5px solid ${error ? C.err : focused ? C.accent : C.b1}`,
        borderRadius: 8, outline: "none", resize: "none",
        transition: "border-color 0.15s",
      }}
    />
  )
}

function ErrorMsg({ text }) {
  if (!text) return null
  return (
    <p style={{
      fontSize: 10, color: C.err, fontFamily: FONT,
      margin: "3px 0 0", lineHeight: 1.4,
    }}>
      {text}
    </p>
  )
}

// ─── Step 1 — Compose form ────────────────────────────────────

function ComposeForm({ onGenerate, onBack }) {
  const [to,       setTo]       = useState("")
  const [subject,  setSubject]  = useState("")
  const [prompt,   setPrompt]   = useState("")
  const [loading,  setLoading]  = useState(false)
  const [errors,   setErrors]   = useState({})

  const randomHint = PROMPT_HINTS[Math.floor(Math.random() * PROMPT_HINTS.length)]

  function validate() {
    const e = {}
    if (!to.trim())      e.to      = "Recipient email is required"
    if (to.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim()))
                         e.to      = "Enter a valid email address"
    if (!subject.trim()) e.subject = "Subject is required"
    if (!prompt.trim())  e.prompt  = "Tell the AI what to write"
    return e
  }

  const handleGenerate = useCallback(async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    setLoading(true)
    setErrors({})

    try {
      const draft = await generateCompose({
        to:      to.trim(),
        subject: subject.trim(),
        prompt:  prompt.trim(),
      })
      onGenerate({ ...draft, to: to.trim(), subject: subject.trim(), prompt: prompt.trim() })
    } catch (err) {
      setErrors({ api: err.message || "Failed to generate. Try again." })
    } finally {
      setLoading(false)
    }
  }, [to, subject, prompt, onGenerate])

  return (
    <div style={{ fontFamily: FONT, background: C.bg0 }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "10px 14px", borderBottom: `0.5px solid ${C.b0}`,
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", cursor: "pointer",
          color: C.t1, display: "flex", padding: 2, borderRadius: 6,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div>
          <p style={{ fontSize: 12, fontWeight: 500, color: C.t0, fontFamily: FONT, margin: 0 }}>
            New email
          </p>
          <p style={{ fontSize: 10, color: C.t1, fontFamily: FONT, margin: 0 }}>
            AI writes the full email from your prompt
          </p>
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: "12px 13px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* To field */}
        <div>
          <FieldLabel text="TO" required />
          <TextInput
            type="email"
            value={to}
            onChange={e => { setTo(e.target.value); setErrors(prev => ({ ...prev, to: null })) }}
            placeholder="recipient@email.com"
            error={errors.to}
          />
          <ErrorMsg text={errors.to} />
        </div>

        {/* Subject field */}
        <div>
          <FieldLabel text="SUBJECT" required />
          <TextInput
            value={subject}
            onChange={e => { setSubject(e.target.value); setErrors(prev => ({ ...prev, subject: null })) }}
            placeholder="What's the email about?"
            error={errors.subject}
          />
          <ErrorMsg text={errors.subject} />
        </div>

        {/* Prompt field */}
        <div>
          <FieldLabel text="WHAT SHOULD THE EMAIL SAY?" required />
          <TextArea
            value={prompt}
            onChange={e => { setPrompt(e.target.value); setErrors(prev => ({ ...prev, prompt: null })) }}
            placeholder={randomHint}
            rows={3}
            error={errors.prompt}
          />
          <p style={{ fontSize: 9, color: C.t2, fontFamily: FONT, margin: "3px 0 0", lineHeight: 1.4 }}>
            Brief is fine — AI expands this into a full professional email
          </p>
          <ErrorMsg text={errors.prompt} />
        </div>

        {/* API error */}
        {errors.api && (
          <div style={{
            background: C.errBg, border: `0.5px solid #F7C1C1`,
            borderRadius: 8, padding: "8px 10px",
            fontSize: 10, color: C.errText, fontFamily: FONT,
          }}>
            {errors.api}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            width: "100%", padding: "9px 14px",
            background: loading ? C.accentHover : C.accent,
            color: "#fff", fontSize: 12, fontWeight: 500,
            border: "none", borderRadius: 9, fontFamily: FONT,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 1px 3px rgba(24,95,165,0.25)",
          }}
        >
          {loading ? (
            <Spinner size={13} color="rgba(255,255,255,0.8)" />
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {loading ? "Generating email..." : "Generate email"}
        </button>

      </div>
    </div>
  )
}

// ─── Step 2 — Draft review ────────────────────────────────────

function DraftReview({ draft, onBack, onSent }) {
  const [text,        setText]        = useState(draft.text || "")
  const [sending,     setSending]     = useState(false)
  const [regenerating,setRegenerating]= useState(false)
  const [error,       setError]       = useState(null)
  const [isNew,       setIsNew]       = useState(true)

  const handleSend = useCallback(async () => {
    setSending(true)
    setError(null)
    try {
      await sendNewEmail({
        draftId: draft.draftId || draft.id,
        to:      draft.to,
        subject: draft.subject,
        body:    text,
      })
      onSent({ to: draft.to, subject: draft.subject })
    } catch (err) {
      setError(err.message || "Send failed. Your draft is safe — try again.")
      setSending(false)
    }
  }, [draft, text, onSent])

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true)
    setError(null)
    setIsNew(false)
    try {
      const { generateCompose } = await import("../../lib/api")
      const result = await generateCompose({
        to:      draft.to,
        subject: draft.subject,
        prompt:  draft.prompt,
      })
      setText(result.text)
      setIsNew(true)
    } catch (err) {
      setError("Regeneration failed. Original kept.")
    } finally {
      setRegenerating(false)
    }
  }, [draft])

  return (
    <div style={{ fontFamily: FONT, background: C.bg0 }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "10px 14px", borderBottom: `0.5px solid ${C.b0}`,
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", cursor: "pointer",
          color: C.t1, display: "flex", padding: 2, borderRadius: 6,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 12, fontWeight: 500, color: C.t0, fontFamily: FONT, margin: 0,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {draft.to}
          </p>
          <p style={{ fontSize: 10, color: C.t1, fontFamily: FONT, margin: 0 }}>
            {draft.subject}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          margin: "8px 12px 0",
          padding: "8px 10px",
          background: C.errBg, border: `0.5px solid #F7C1C1`,
          borderRadius: 8, fontSize: 10, color: C.errText, fontFamily: FONT,
        }}>
          {error}
        </div>
      )}

      {/* Draft */}
      <div style={{ padding: "10px 12px 4px" }}>
        {regenerating ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, height: 120,
            background: C.bg1, border: `0.5px dashed ${C.b1}`,
            borderRadius: 8,
          }}>
            <Spinner size={15} color={C.accent} />
            <span style={{ fontSize: 11, color: C.t1, fontFamily: FONT }}>
              Writing new version...
            </span>
          </div>
        ) : (
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setIsNew(false) }}
            disabled={sending}
            rows={7}
            style={{
              width: "100%", padding: "10px 11px", resize: "none",
              fontSize: 12, fontFamily: FONT, color: C.t0, lineHeight: 1.65,
              background: isNew ? "#FAFCFF" : C.bg0,
              border: `0.5px solid ${isNew ? "#85B7EB" : C.b1}`,
              borderRadius: 8, outline: "none",
              opacity: sending ? 0.5 : 1,
              transition: "border-color 0.2s, background 0.2s",
            }}
          />
        )}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginTop: 4,
        }}>
          {isNew && !regenerating
            ? <span style={{ fontSize: 9, color: C.accent, fontFamily: FONT }}>✦ Generated</span>
            : <span />
          }
          <span style={{ fontSize: 9, color: C.t2, fontFamily: FONT }}>
            {regenerating ? "—" : `${text.length} chars`}
          </span>
        </div>
      </div>

      {/* Regenerate */}
      <div style={{ padding: "2px 12px 8px" }}>
        <button
          onClick={handleRegenerate}
          disabled={regenerating || sending}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 500, fontFamily: FONT,
            padding: "4px 9px", borderRadius: 7,
            background: "transparent", border: "none",
            color: regenerating ? C.t2 : C.t1,
            cursor: regenerating || sending ? "not-allowed" : "pointer",
            opacity: sending ? 0.4 : 1,
          }}
        >
          {regenerating
            ? <Spinner size={11} color={C.t2} />
            : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
          }
          {regenerating ? "Writing..." : "Regenerate"}
        </button>
      </div>

      <div style={{ height: "0.5px", background: C.b0 }} />

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, padding: "10px 12px 12px" }}>
        <button onClick={onBack} disabled={sending} style={{
          fontSize: 11, fontWeight: 500, fontFamily: FONT,
          padding: "7px 14px", borderRadius: 8, flexShrink: 0,
          background: C.bg1, color: C.t0, border: `0.5px solid ${C.b1}`,
          cursor: sending ? "not-allowed" : "pointer",
          opacity: sending ? 0.4 : 1,
        }}>
          Discard
        </button>
        <button onClick={handleSend} disabled={sending || regenerating || !text.trim()} style={{
          flex: 1, fontSize: 11, fontWeight: 500, fontFamily: FONT,
          padding: "7px 14px", borderRadius: 8,
          background: C.accent, color: "#fff", border: "none",
          cursor: sending || regenerating ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          boxShadow: "0 1px 3px rgba(24,95,165,0.25)",
          opacity: !text.trim() ? 0.5 : 1,
        }}>
          {sending
            ? <Spinner size={12} color="rgba(255,255,255,0.8)" />
            : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
          }
          {sending ? "Sending..." : "Send email"}
        </button>
      </div>
    </div>
  )
}

// ─── Step 3 — Success ─────────────────────────────────────────

function ComposeSuccess({ result, onBack, onComposeAnother }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "48px 24px",
      background: C.bg0, textAlign: "center", fontFamily: FONT,
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: "50%",
        background: C.okBg, border: `0.5px solid ${C.ok}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 12,
        animation: "pop 0.3s cubic-bezier(0.175,0.885,0.32,1.275)",
      }}>
        <style>{`@keyframes pop{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.ok} strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: C.t0, margin: "0 0 4px" }}>
        Sent!
      </p>
      <p style={{ fontSize: 12, color: C.t1, margin: "0 0 3px" }}>
        Email sent to {result?.to}
      </p>
      <p style={{ fontSize: 10, color: C.t2, margin: "0 0 22px" }}>
        {result?.subject}
      </p>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onBack} style={{
          fontSize: 11, fontWeight: 500, fontFamily: FONT,
          padding: "6px 14px", borderRadius: 8,
          background: C.bg1, color: C.t0,
          border: `0.5px solid ${C.b1}`, cursor: "pointer",
        }}>
          Back to drafts
        </button>
        <button onClick={onComposeAnother} style={{
          fontSize: 11, fontWeight: 500, fontFamily: FONT,
          padding: "6px 14px", borderRadius: 8,
          background: C.accent, color: "#fff",
          border: "none", cursor: "pointer",
        }}>
          New email
        </button>
      </div>
    </div>
  )
}

// ─── Main ComposePage ─────────────────────────────────────────

export default function ComposePage({ onBack }) {
  // step: "form" | "review" | "success"
  const [step,   setStep]   = useState("form")
  const [draft,  setDraft]  = useState(null)
  const [result, setResult] = useState(null)

  function handleGenerated(draftData) {
    const queueDraft = {
      ...draftData,
      platform: "gmail",
      contact: draftData.to,
      contactEmail: draftData.to,
      thread: draftData.subject,
      label: draftData.label || "all",
      status: "draft",
    }

    chrome.runtime.sendMessage({ type: "DRAFT_READY", draft: queueDraft }, () => {
      if (chrome.runtime.lastError) {
        console.warn("Could not store compose draft:", chrome.runtime.lastError.message)
      }
    })

    setDraft(queueDraft)
    setStep("review")
  }

  function handleSent(sentResult) {
    const sentDraft = {
      ...draft,
      status: "sent",
      sentAt: Date.now(),
    }

    chrome.runtime.sendMessage({ type: "DRAFT_READY", draft: sentDraft }, () => {
      if (chrome.runtime.lastError) {
        console.warn("Could not update compose draft status:", chrome.runtime.lastError.message)
      }
    })

    setResult(sentResult)
    setStep("success")
  }

  if (step === "form") {
    return (
      <ComposeForm
        onGenerate={handleGenerated}
        onBack={onBack}
      />
    )
  }

  if (step === "review") {
    return (
      <DraftReview
        draft={draft}
        onBack={() => setStep("form")}
        onSent={handleSent}
      />
    )
  }

  return (
    <ComposeSuccess
      result={result}
      onBack={onBack}
      onComposeAnother={() => setStep("form")}
    />
  )
}
