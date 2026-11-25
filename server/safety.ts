// Pre-model safety triage for emergencies, medical queries, prompt injections, and off-topic input.
import type { AllowedTask, ChatResult, TaskContext } from '../shared/types.js';

/** Triage reason classification codes. */
export type SafetyReasonCode = 'ok' | 'emergency' | 'medical' | 'injection' | 'off_topic' | 'empty';

/** Structured outcome from pre-LLM safety triage. */
export interface SafetyTriageResult {
  readonly isEmergency: boolean;
  readonly isMedical: boolean;
  readonly isOffTopic: boolean;
  readonly isInjection: boolean;
  readonly isBlocked: boolean;
  readonly reasonCode: SafetyReasonCode;
  readonly safeResponse?: ChatResult;
}

const INJECTION_PATTERNS: readonly RegExp[] = [
  /(?:ignore|disregard|forget)\s+(?:all\s+|any\s+|previous\s+|prior\s+|above\s+)*(?:instructions|rules|directives|guidelines|constraints)/i,
  /\b(?:repeat|print|show|output)\s+(?:everything|all\s+text|the\s+prompt)\s+(?:above|before)\b/i,
  /(?:system|developer)\s+prompt/i,
  /gemini_api_key|process\.env|api[_-]?key|secret[_-]?key/i,
  /\bjailbreak\b|\bdan\s+mode\b|\bact\s+as\s+dan\b|\bdeveloper\s+mode\b|bypass\s+(?:safety|guardrails|rules)/i,
  /(?:print|reveal|dump|output|repeat)\s+(?:your\s+|the\s+)?(?:system|initial|hidden|secret)\s+(?:prompt|instructions|rules)/i,
  /\b(?:exact|original|system)\s+(?:instructions|rules)\b/i,
  /\b(?:TRUSTED_CONTEXT_JSON|UNTRUSTED_USER_TEXT)\b/i,
  /\bsay\s+pwned\b|override\s+(?:system|safety)/i,
];

const EMERGENCY_PATTERNS: readonly RegExp[] = [
  /chest\s+(?:pain|tightness|pressure)|\bheart[\s-]+attack\b/i,
  /(?:difficulty|trouble|hard|struggling|unable)\s+(?:breathing|to\s+breathe)/i,
  /\b(?:stopped|not)\s+breathing\b|\bcoughing\s+up\s+blood\b/i,
  /(?:severe\s+)?breathless(?:ness)?|shortness\s+of\s+breath|can(?:'t|not)\s+breathe/i,
  /\bfaint(?:ed|ing)?\b|unconscious|passed\s+out|blue\s+lips|lips\s+turning\s+blue/i,
  /(?:severe|toddler|infant|child|baby).*wheez|wheezing.*(?:toddler|infant|child|baby|severe)/i,
  /\b(?:infant|baby|toddler|child)\b.*\b(?:breathless|gasping|blue|unresponsive)\b/i,
  /infant\s+distress/i,
  /(?:सीने|छाती)\s+में.*दर्द|दिल\s+का\s+दौरा|सांस\s+लेने\s+में|सांस\s+फूल|बेहोश|नीले\s+होंठ/,
  /(?:saans\s+lene\s+mein\s+(?:dikkat|takleef|mushkil|pareshani)|dil\s+ka\s+daura|(?:mere\s+)?(?:seene|chhaati)\s+mein\s+dard)/i,
];

const MEDICAL_PATTERNS: readonly RegExp[] = [
  /(?:do\s+i|could\s+i|might\s+i|am\s+i)\s+(?:have\s+)?(?:acute\s+)?asthma/i,
  /\bdiagnos(?:e|is)\b|what\s+disease|is\s+this\s+bronchitis/i,
  /\b(?:prescri(?:be|ption)|dosage|dose|milligrams?|mg\b|prednisone|steroid|inhaler|nebulizer|antibiotic|medication|medicine|tablet|syrup|pills?|capsules?|puffs?|drugs?)\b/i,
  /(?:दवाई|दवा|गोली|खुराक|इनहेलर)|क्या\s+मुझे.*(?:अस्थमा|दमा|ब्रोंकाइटिस)/,
  /\b(?:dawai|dawa|goli|khurak|paracetamol|cetirizine|ibuprofen|azithromycin|montelukast|salbutamol)\b/i,
];

const OFF_TOPIC_PATTERNS: readonly RegExp[] = [
  /\b(?:https?:\/\/|www\.)\S+/i,
  /\b(?:bitcoin|crypto|ethereum|stock\s+price|cricket|world\s+cup|football|ipl|score|recipe|biryani|python|javascript|coding|algorithm|movie|celebrity|horoscope|homework|capital\s+of)\b/i,
];

const SAFE_RESPONSES: Record<Exclude<SafetyReasonCode, 'ok' | 'empty'>, ChatResult> = {
  emergency: {
    reply: 'Seek immediate medical care. Call 112 or visit the nearest hospital emergency room right away, especially for breathing difficulty, chest pain, or blue lips.',
    suggestedActions: ['Call 112 emergency services', 'Visit nearest emergency room', 'Move to clean indoor air while waiting'],
  },
  medical: {
    reply: 'I cannot diagnose medical conditions or recommend medication or inhaler dosages. Please consult a qualified physician for personalized medical guidance.',
    suggestedActions: ['Consult a qualified doctor', 'Check indoor air tips', 'Review N95 mask guidance'],
  },
  injection: {
    reply: 'I can only assist with urban air quality and smog protection. I cannot change my instructions or reveal internal configuration.',
    suggestedActions: ['Check daily smog routine', 'View indoor air tips', 'Compare commute options'],
  },
  off_topic: {
    reply: 'I am Saans, an urban air quality assistant, so I cannot help with external links or unrelated topics. I can help you plan around local air pollution and reduce smog exposure.',
    suggestedActions: ['Get daily smog routine', 'View indoor air tips', 'Compare commute exposure'],
  },
};

/** Applies common leetspeak character substitutions for injection detection. */
function applyLeetspeak(text: string): string {
  return text
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/!/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/\$/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a');
}

/** Normalizes leetspeak and decodes inline base64 payloads for injection detection. */
function normalizeSecurityText(clean: string): string {
  const decodedParts: string[] = [clean, applyLeetspeak(clean)];
  const b64Tokens = clean.match(/[A-Za-z0-9+/]{8,}={0,2}/g) ?? [];
  for (const token of b64Tokens) {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      if (/^[\x20-\x7E\s]+$/.test(decoded)) {
        decodedParts.push(decoded, applyLeetspeak(decoded));
      }
    } catch {
      // Ignore invalid base64 fragments
    }
  }
  return decodedParts.join(' ');
}

/** Detects Latin gibberish (including in mixed-script inputs) or number-only noise without fusing acronyms. */
function isGibberishInput(clean: string): boolean {
  const hasDevanagari = /[\u0900-\u097F]/.test(clean);
  const words = clean.split(/[^a-zA-Z]+/).filter((w) => w.length > 0);
  if (words.length === 0) return !hasDevanagari;
  if (/([a-zA-Z])\1{4,}/i.test(clean)) return true;
  if (words.some((w) => /[bcdfghjklmnpqrstvwxz]{6,}/i.test(w))) return true;
  const substantive = words.filter((w) => w.length >= 5 || /[aeiouy]/i.test(w)).join('');
  const vowels = substantive.match(/[aeiouy]/gi)?.length ?? 0;
  return substantive.length >= 8 && vowels / substantive.length < 0.18;
}

/** Constructs a standardized SafetyTriageResult object. */
function makeResult(reasonCode: SafetyReasonCode): SafetyTriageResult {
  const isBlocked = reasonCode !== 'ok' && reasonCode !== 'empty';
  return {
    isEmergency: reasonCode === 'emergency',
    isMedical: reasonCode === 'medical',
    isOffTopic: reasonCode === 'off_topic',
    isInjection: reasonCode === 'injection',
    isBlocked,
    reasonCode,
    safeResponse: isBlocked ? SAFE_RESPONSES[reasonCode] : undefined,
  };
}

/**
 * Classifies user input for prompt injection, medical emergencies, medical dosing/diagnosis, or off-topic content.
 *
 * @param userText - Optional untrusted user message text.
 * @returns Structured safety triage assessment.
 */
export function triageSafety(userText?: string): SafetyTriageResult {
  const trimmed = (userText ?? '').trim();
  const clean = trimmed.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  if (!clean) return makeResult('empty');

  const securityText = normalizeSecurityText(clean);
  if (INJECTION_PATTERNS.some((rx) => rx.test(securityText))) return makeResult('injection');
  if (EMERGENCY_PATTERNS.some((rx) => rx.test(clean))) return makeResult('emergency');
  if (MEDICAL_PATTERNS.some((rx) => rx.test(clean))) return makeResult('medical');
  if (OFF_TOPIC_PATTERNS.some((rx) => rx.test(clean)) || isGibberishInput(clean)) {
    return makeResult('off_topic');
  }
  return makeResult('ok');
}

/**
 * Maps a blocked safety triage response into the schema shape expected by the requested task.
 *
 * @param task - Requested allow-listed task.
 * @param triage - Blocked safety triage outcome.
 * @param context - Request air-quality context.
 * @returns Schema-valid task payload.
 */
export function buildSafetyTaskResult(
  task: AllowedTask,
  triage: SafetyTriageResult,
  context: TaskContext
): unknown {
  const base = triage.safeResponse ?? SAFE_RESPONSES.off_topic;
  const actions = base.suggestedActions ?? ['Check indoor air tips'];
  if (task === 'chat') return base;
  if (task === 'indoor-tips') {
    return { tips: [base.reply, ...actions.slice(0, 2)], urgency: triage.isEmergency ? 'high' : 'medium' };
  }
  if (task === 'narrate-plan') return { narrative: base.reply, recommendations: actions.slice(0, 3) };
  if (task === 'explain-impact') return { explanation: base.reply, healthAdvice: actions[0] };
  return { message: `${context.city}: ${base.reply}`, urgency: triage.isEmergency ? 'high' : 'medium' };
}
