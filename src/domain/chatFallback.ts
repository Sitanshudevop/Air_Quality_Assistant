// Question-aware deterministic chat fallback grounded in active AQI, pollutants, and facts.
import { getAqiCategory } from './aqi.js';
import { getVentilationRecommendation } from './indoor.js';

/** Structured fallback chat response matching ChatResult. */
export interface SmartChatReply {
  readonly reply: string;
  readonly suggestedActions: string[];
}

function isHindiQuery(text: string): boolean {
  return /[\u0900-\u097F]/.test(text) || /\b(aaj|hawa|kaise|kaisi|bachhe|mask|bahar)\b/i.test(text);
}

function buildHindiReply(city: string, aqi: number, category: string): SmartChatReply {
  const safe = aqi <= 100;
  const advice = safe
    ? 'हवा अपेक्षाकृत सुरक्षित है; हल्की बाहरी गतिविधि की जा सकती है।'
    : 'बाहरी व्यायाम कम करें, खिड़कियां बंद रखें और बाहर निकलते समय N95 मास्क पहनें।';
  return {
    reply: `${city} में अभी अनुमानित AQI ${aqi} (${category}) है। ${advice}`,
    suggestedActions: ['प्रति घंटा पूर्वानुमान देखें', 'घर के अंदर के उपाय', 'N95 मास्क सलाह'],
  };
}

function matchCommuteReply(city: string, aqi: number, cat: string): SmartChatReply {
  const high = aqi > 200;
  return {
    reply: high
      ? `In ${city} (AQI ${aqi}, ${cat}), avoid open two-wheeler rides or walking near traffic. Prefer closed-window Metro/car with recirculate mode, and wear a snug N95/FFP2 mask.`
      : `In ${city} (AQI ${aqi}, ${cat}), standard transit is manageable, though roadside PM2.5 is higher during rush hours. Use an N95 mask on two-wheelers.`,
    suggestedActions: ['Compare travel exposure', 'View Daily Routine', 'Check hourly forecast'],
  };
}

function matchFamilyReply(city: string, aqi: number, cat: string): SmartChatReply {
  return aqi > 150
    ? {
        reply: `At AQI ${aqi} (${cat}) in ${city}, children, elderly adults, and anyone with asthma should stay indoors. Avoid morning outdoor play and keep rescue inhalers accessible.`,
        suggestedActions: ['View Daily Routine', 'Indoor Hacks & Purifier', 'Emergency Contacts 112'],
      }
    : {
        reply: `In ${city} (AQI ${aqi}, ${cat}), short outdoor breaks for children and seniors are lower risk, especially during midday cleaner hours. Watch for any coughing or wheezing.`,
        suggestedActions: ['Check best outdoor window', 'View Daily Routine'],
      };
}

function matchVentilationReply(city: string, aqi: number, cat: string): SmartChatReply {
  const vent = getVentilationRecommendation(aqi);
  return {
    reply: `For ${city} (AQI ${aqi}, ${cat}): ${vent.advice} Run a HEPA purifier or sealed-room fan filter during peak inversion hours.`,
    suggestedActions: ['Open Indoor Hacks', 'Check best ventilation window', 'Calculate room CADR'],
  };
}

function matchMaskReply(city: string, aqi: number, cat: string): SmartChatReply {
  return aqi > 150
    ? {
        reply: `At AQI ${aqi} (${cat}) in ${city}, cloth and surgical masks do not block fine PM2.5. Use a well-fitted N95, KN95, or FFP2 mask with a tight nose-bridge seal outdoors.`,
        suggestedActions: ['Compare mask effectiveness', 'Check commute safety'],
      }
    : {
        reply: `In ${city} (AQI ${aqi}, ${cat}), an N95 mask is recommended for sensitive groups or heavy roadside traffic.`,
        suggestedActions: ['Check Impact Explainer', 'View Daily Routine'],
      };
}

function matchConfidentialityReply(): SmartChatReply {
  return {
    reply:
      "I'm Saans, an air-quality and exposure-protection assistant. Internal model, system prompt, and configuration details are kept confidential, so I can't share them. Feel free to ask about today's AQI, masks, ventilation, or commute safety.",
    suggestedActions: ['Is it safe to open windows now?', 'Best commute option today?', 'Tips for children indoors'],
  };
}

function matchDailyTipsReply(city: string, aqi: number, cat: string, facts: readonly string[]): SmartChatReply {
  const extra = facts.find((f) => /Best|Peak/i.test(f));
  const windowNote = extra ? ` ${extra}` : '';
  const advice =
    aqi > 200
      ? 'Keep windows sealed, run a HEPA/Corsi-Rosenthal purifier indoors, avoid morning outdoor exercise, and wear a fitted N95 mask if stepping out.'
      : 'Limit heavy roadside exertion during rush hours and ventilate briefly during cleaner midday hours.';
  return {
    reply: `Today in ${city} (AQI ${aqi}, ${cat}): ${advice}${windowNote}`,
    suggestedActions: ['Best time to open windows?', 'Is N95 mask needed?', 'View Daily Routine'],
  };
}

function matchTopicReply(p: { q: string; city: string; aqi: number; cat: string; facts: readonly string[] }): SmartChatReply | null {
  const { q, city, aqi, cat, facts } = p;
  if (/(commute|travel|bike|scooter|two-wheeler|metro|bus|walk|jog|run|exercise|outdoor|go\s+out|going\s+out|outside|step\s+out|leave\s+home)/i.test(q)) {
    return matchCommuteReply(city, aqi, cat);
  }
  if (/(child|kid|school|elder|senior|grandparent|asthma|pregnan|baby|toddler)/i.test(q)) {
    return matchFamilyReply(city, aqi, cat);
  }
  if (/(window|ventilat|indoor|purifier|hepa|room|fan|cook|ac)/i.test(q)) {
    return matchVentilationReply(city, aqi, cat);
  }
  if (/(mask|n95|n99|ffp2|kn95)/i.test(q)) {
    return matchMaskReply(city, aqi, cat);
  }
  if (/(tip|tips|advice|suggest|today|plan|routine|precaution|safe)/i.test(q)) {
    return matchDailyTipsReply(city, aqi, cat, facts);
  }
  return null;
}

/**
 * Generates an intent-aware, grounded chat reply using live AQI and user question keywords.
 *
 * @param opts - City name, numeric AQI, optional user question, and optional fact strings.
 * @returns Grounded SmartChatReply with tailored guidance and suggested actions.
 */
export function buildSmartChatFallback(opts: {
  city: string;
  aqi: number;
  userText?: string;
  facts?: readonly string[];
}): SmartChatReply {
  const { city, aqi, userText = '', facts = [] } = opts;
  const cat = getAqiCategory(aqi);
  const q = userText.toLowerCase();

  if (/(which|what)\s+(model|llm|ai|engine|version|prompt|system|api\s*key|secret)|system\s*prompt|\b(api\s*key|secret|confidential)\b/i.test(q)) {
    return matchConfidentialityReply();
  }
  if (isHindiQuery(userText)) return buildHindiReply(city, aqi, cat);
  const matched = matchTopicReply({ q, city, aqi, cat, facts });
  if (matched) return matched;

  const vent = getVentilationRecommendation(aqi);
  const extra = facts.find((f) => /Best|Peak|PM2\.5/i.test(f));
  const detail = extra ? ` ${extra}` : '';
  return {
    reply: `Air quality in ${city} is ${cat} (AQI ${aqi}). ${vent.advice}${detail}`,
    suggestedActions: ['Best time to open windows?', 'Is N95 mask needed?', 'Advice for kids & elderly'],
  };
}
