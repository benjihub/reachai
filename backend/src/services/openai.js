/**
 * OpenAI service for all GPT-4o calls
 * All prompts are in backend/src/lib/prompts.js
 */

import OpenAI from 'openai';
import { OPENAI_CONFIG } from '../lib/constants.js';
import { COMPOSE_SYSTEM_PROMPT, DRAFTS_SYSTEM_PROMPT } from '../lib/prompts.js';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableOpenAIError = (error) => {
  const status = error?.status || error?.code;
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
};

const formatThreadForPrompt = (messages = [], platform = 'gmail') => {
  const normalized = messages
    .filter(Boolean)
    .map((message) => {
      if (typeof message === 'string') {
        return message.trim();
      }

      const sender = message.sender || message.from || message.author || 'Unknown';
      const text = message.text || message.body || message.content || '';
      return `${sender}: ${text}`.trim();
    })
    .filter(Boolean)
    .slice(-12);

  return [
    `Platform: ${platform}`,
    'Conversation:',
    normalized.length ? normalized.join('\n\n') : 'No readable conversation text was found.'
  ].join('\n');
};

export const generateDraft = async (messages, platform) => {
  const prompt = formatThreadForPrompt(messages, platform);
  let lastError;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const completion = await client.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages: [
          { role: 'system', content: DRAFTS_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: OPENAI_CONFIG.maxTokens.draft,
        temperature: OPENAI_CONFIG.temperature.draft
      });

      const text = completion.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new Error('OpenAI returned an empty draft.');
      }

      return text;
    } catch (error) {
      lastError = error;
      if (!isRetryableOpenAIError(error) || attempt === 2) {
        break;
      }

      await sleep(500 * (2 ** attempt));
    }
  }

  throw lastError;
};

export const generateComposeEmail = async ({ to, subject, prompt, senderName }) => {
  let lastError;
  const userPrompt = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `Prompt: ${prompt}`,
    senderName ? `Sender name: ${senderName}` : null
  ].filter(Boolean).join('\n');

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const completion = await client.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages: [
          { role: 'system', content: COMPOSE_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: OPENAI_CONFIG.maxTokens.draft,
        temperature: OPENAI_CONFIG.temperature.draft
      });

      const text = completion.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new Error('OpenAI returned an empty compose draft.');
      }

      return text;
    } catch (error) {
      lastError = error;
      if (!isRetryableOpenAIError(error) || attempt === 2) {
        break;
      }

      await sleep(500 * (2 ** attempt));
    }
  }

  throw lastError;
};

export const categorizeThread = async (messages) => {
  // Stub for F5
  throw new Error('Not implemented yet');
};
