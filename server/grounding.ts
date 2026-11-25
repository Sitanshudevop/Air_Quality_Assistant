// Server-side numeric grounding verification against domain context facts.

/** Input payload for numeric grounding check. */
export interface GroundingInput {
  readonly text: string;
  readonly facts: readonly string[];
  readonly extraAllowedNumbers?: readonly (string | number)[];
}

const IDENTIFIER_PATTERN =
  /(?:\b(?:PM2\.5|PM10|PM1|NO2|SO2|O3|CO2e?|N95|N99|FFP2|FFP3)\b|(?<=\d|\b)m3(?:\/hr)?\b|(?:ug|µg|mg)\/m3\b)/gi;
const NUMBER_PATTERN = /(?:^|[\s(:,[\]"'`~])(-\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)/g;

/** Normalizes Devanagari digits [०-९] to ASCII [0-9]. */
function normalizeDevanagariDigits(text: string): string {
  return text.replace(/[०-९]/g, (ch) => String(ch.charCodeAt(0) - 0x0966));
}

/** Extracts normalized numeric values from text after stripping standard chemical/filter tokens. */
function extractNumbers(raw: string): number[] {
  const ascii = normalizeDevanagariDigits(raw).replace(/(\d),(?=(?:\d{2,3},)*\d{3}\b)/g, '$1');
  const sanitized = ascii.replace(IDENTIFIER_PATTERN, ' ');
  const numbers: number[] = [];

  for (const match of sanitized.matchAll(NUMBER_PATTERN)) {
    const token = match[1] ?? match[2];
    if (token !== undefined) {
      const parsed = Number(token);
      if (Number.isFinite(parsed)) {
        numbers.push(parsed);
      }
    }
  }
  return numbers;
}

/** Collects string leaves from an arbitrary task output object for grounding inspection. */
function collectStrings(value: unknown, out: string[], depth: number): void {
  if (depth > 3 || value === null || value === undefined) return;
  if (typeof value === 'string') {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out, depth + 1);
    return;
  }
  if (typeof value === 'object') {
    for (const val of Object.values(value)) collectStrings(val, out, depth + 1);
  }
}

/**
 * Extracts all textual content from a structured task result for grounding checks.
 *
 * @param result - Validated task output payload.
 * @returns Combined text string.
 */
export function extractTextForGrounding(result: unknown): string {
  const chunks: string[] = [];
  collectStrings(result, chunks, 0);
  return chunks.join(' ');
}

/**
 * Verifies that every numeric value present in model output exists in provided facts or context numbers.
 *
 * @param input - Model text, context facts, and optional extra allowed numeric values.
 * @returns True when text has zero numbers or all numbers match allowed context facts.
 */
export function verifyNumericGrounding(input: GroundingInput): boolean {
  const textNumbers = extractNumbers(input.text);
  if (textNumbers.length === 0) {
    return true;
  }

  const allowed = new Set<number>();
  for (const fact of input.facts) {
    for (const num of extractNumbers(fact)) {
      allowed.add(num);
    }
  }
  for (const extra of input.extraAllowedNumbers ?? []) {
    const parsed = Number(normalizeDevanagariDigits(String(extra)));
    if (Number.isFinite(parsed)) {
      allowed.add(parsed);
    }
  }

  return textNumbers.every((num) => allowed.has(num));
}
