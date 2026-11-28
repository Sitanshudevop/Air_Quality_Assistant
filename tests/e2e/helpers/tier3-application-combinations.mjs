/**
 * Tier 3 Application Combinations Tests (Tests 3.9 to 3.16)
 * Validates cross-feature interactions and invariant preservation across subsystems.
 */
import { it } from 'node:test';
import assert from 'node:assert/strict';

import {
  loadModuleSafe
} from './contract-prober.mjs';

export function registerTier3ApplicationCombinations(options = {}) {
  const harness = options.harness || null;

  // -------------------------------------------------------------------------
  // Test 3.9: AQI Calculator (F1) x Profile (F14) -> Daily Routine Rules (F4)
  // -------------------------------------------------------------------------
  it('Test 3.9: AQI Calculator (F1) x Profile (F14) -> Daily Routine Rules (F4)', async (t) => {
    const aqiMod = await loadModuleSafe('src/domain/aqi.ts');
    const routineMod = await loadModuleSafe('src/domain/routine.ts');

    if (!aqiMod || !routineMod || !aqiMod.calculateAqi || !routineMod.generateRoutine) {
      t.skip('Pending implementation of src/domain/aqi.ts or src/domain/routine.ts');
      return;
    }

    const aqi = aqiMod.calculateAqi(380);
    const profile = { vulnerabilities: ['child', 'asthmatic'], personaId: 'toddler_grandparent' };
    const routine = routineMod.generateRoutine(aqi.category, profile);

    assert.ok(Array.isArray(routine) && routine.length >= 5);
    for (const item of routine) {
      assert.ok(!item.action.toLowerCase().includes('outdoor exercise'), 'Severe + Asthmatic must never have outdoor exercise');
    }
  });

  // -------------------------------------------------------------------------
  // Test 3.10: Inhaled Dose Model (F2) x Alternatives Engine (F6) -> "What-If" Explainer (F26)
  // -------------------------------------------------------------------------
  it('Test 3.10: Inhaled Dose Model (F2) x Alternatives Engine (F6) -> "What-If" Explainer (F26)', async (t) => {
    const exposureMod = await loadModuleSafe('src/domain/exposure.ts');
    const altMod = await loadModuleSafe('src/domain/alternatives.ts');

    if (!exposureMod || !altMod || !exposureMod.calculateRelativeDose || !altMod.compareAlternatives) {
      t.skip('Pending implementation of src/domain/exposure.ts or src/domain/alternatives.ts');
      return;
    }

    const baseline = { id: 'tw', title: 'Two-Wheeler', mode: 'two_wheeler_petrol', maskType: 'none', distanceKm: 15 };
    const metroOpt = { id: 'metro', title: 'Metro', mode: 'metro', maskType: 'none', distanceKm: 15 };
    const comp = altMod.compareAlternatives(baseline, [metroOpt], 250);

    assert.ok(comp[0].relativeDoseChangePct < 0, 'Metro must reduce exposure relative to two-wheeler');
    assert.ok(comp[0].co2eDeltaGrams < 0, 'Metro must yield carbon savings relative to two-wheeler');
    assert.ok(Array.isArray(comp[0].doseUncertaintyRangeUg));
  });

  // -------------------------------------------------------------------------
  // Test 3.11: Live AQ Failure (F7) x Manual Entry Fallback (F11) -> Today Dashboard (F16)
  // -------------------------------------------------------------------------
  it('Test 3.11: Live AQ Failure (F7) x Manual Entry Fallback (F11) -> Today Dashboard (F16)', async (t) => {
    const fallbackMod = await loadModuleSafe('src/services/manualReading.ts');

    if (!fallbackMod || !fallbackMod.createManualReading) {
      t.skip('Pending implementation of src/services/manualReading.ts in M2');
      return;
    }

    const reading = fallbackMod.createManualReading({ aqi: 310 });
    assert.strictEqual(reading.sourceLabel, 'user-entered reading');
    assert.strictEqual(reading.aqi, 310);
  });

  // -------------------------------------------------------------------------
  // Test 3.12: Numeric Grounding (F20) x Domain Facts (F1, F2, F3) -> Proxy Hallucination Defense
  // -------------------------------------------------------------------------
  it('Test 3.12: Numeric Grounding (F20) x Domain Facts (F1, F2, F3) -> Proxy Hallucination Defense', async (t) => {
    const groundingMod = await loadModuleSafe('server/grounding.ts');

    if (!groundingMod || !groundingMod.verifyNumericGrounding) {
      t.skip('Pending implementation of server/grounding.ts in M4');
      return;
    }

    const valid = groundingMod.verifyNumericGrounding({
      text: 'Estimated AQI is 425 and PM2.5 is 380.',
      facts: ['AQI: 425', 'PM2.5: 380']
    });
    assert.strictEqual(valid, true);

    const invalid = groundingMod.verifyNumericGrounding({
      text: 'AQI is 999 with 5000 casualties.',
      facts: ['AQI: 425', 'PM2.5: 380']
    });
    assert.strictEqual(invalid, false);
  });

  // -------------------------------------------------------------------------
  // Test 3.13: Safety & Red-Flag Triage (F22) x Assistant Chat (F27)
  // -------------------------------------------------------------------------
  it('Test 3.13: Safety & Red-Flag Triage (F22) x Assistant Chat (F27)', async (t) => {
    const safetyMod = await loadModuleSafe('server/safety.ts');

    if (!safetyMod || !safetyMod.triageSafety) {
      t.skip('Pending implementation of server/safety.ts in M4');
      return;
    }

    const triage = safetyMod.triageSafety('Severe chest pain and difficulty breathing in winter smog');
    assert.strictEqual(triage.isEmergency, true);
  });

  // -------------------------------------------------------------------------
  // Test 3.14: Dual Mode (F13) x Frozen Demo Snapshots (F12) -> Immutability
  // -------------------------------------------------------------------------
  it('Test 3.14: Dual Mode (F13) x Frozen Demo Snapshots (F12) -> Immutability', async (t) => {
    const constMod = await loadModuleSafe('src/constants/index.ts');
    if (!constMod || !constMod.DEMO_SNAPSHOTS || !constMod.DEMO_SNAPSHOTS.delhi || !constMod.DEMO_SNAPSHOTS.lucknow) {
      t.skip('Pending implementation of DEMO_SNAPSHOTS in src/constants/index.ts');
      return;
    }

    const delhi = constMod.DEMO_SNAPSHOTS.delhi;
    const lucknow = constMod.DEMO_SNAPSHOTS.lucknow;

    assert.strictEqual(delhi.category, 'Severe');
    assert.strictEqual(lucknow.category, 'Poor');
    assert.ok(delhi.aqi > lucknow.aqi);
    assert.ok(delhi.pollutants.pm2_5 > lucknow.pollutants.pm2_5);
  });

  // -------------------------------------------------------------------------
  // Test 3.15: Hindi Query Fallback (F29) x Community Smog Action Kit (F28)
  // -------------------------------------------------------------------------
  it('Test 3.15: Hindi Query Fallback (F29) x Grounded Commute Context (F26)', async () => {
    const fallbackMod = await loadModuleSafe('src/domain/chatFallback.ts');
    const reply = fallbackMod.buildSmartChatFallback({ city: 'Delhi', aqi: 420, userText: 'आज की हवा कैसी है?' });
    assert.ok(reply.reply.includes('420'));
  });

  // -------------------------------------------------------------------------
  // Test 3.16: User Profile Storage (F14) x Indoor CADR Calculator (F5, F25)
  // -------------------------------------------------------------------------
  it('Test 3.16: User Profile Storage (F14) x Indoor CADR Calculator (F5, F25)', async (t) => {
    const indoorMod = await loadModuleSafe('src/domain/indoor.ts');
    const cadrFn = indoorMod?.calculateCadrRequirement || indoorMod?.calculateCadr;

    if (!indoorMod || !cadrFn) {
      t.skip('Pending implementation of calculateCadrRequirement in src/domain/indoor.ts');
      return;
    }

    // Bedroom: 200 sqft, 9ft ceiling -> 1800 cu ft * 5 ACH / 60 = 150 CFM
    const cadr = cadrFn(200, 9, 5);
    assert.strictEqual(cadr, 150);
  });
}
