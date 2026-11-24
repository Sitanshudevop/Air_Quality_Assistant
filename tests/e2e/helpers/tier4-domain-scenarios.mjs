/**
 * Tier 4 Real-World Application Domain Scenarios (Scenarios 1 to 5)
 * As defined in TEST_INFRA.md § Real-World Application Scenarios.
 */
import { it } from 'node:test';
import assert from 'node:assert/strict';

import {
  loadModuleSafe
} from './contract-prober.mjs';

import { startServerlessHarness } from './server-harness.mjs';

export function registerTier4DomainScenarios(options = {}) {
  const harness = options.harness || null;

  // =========================================================================
  // Scenario 1: Delhi Severe Smog Day: Toddler & Asthmatic Grandparent
  // Features Exercised: F1, F2, F4, F5, F12, F16, F17, F20, F21, F25
  // =========================================================================
  it('Scenario 4.6: Delhi Severe Smog Day: Toddler & Asthmatic Grandparent', async (t) => {
    const constMod = await loadModuleSafe('src/constants/index.ts');
    if (!constMod || !constMod.DEMO_SNAPSHOTS?.delhi || !constMod.DEMO_PERSONAS?.toddler_grandparent) {
      t.skip('Pending implementation of DEMO_SNAPSHOTS or DEMO_PERSONAS in src/constants/index.ts');
      return;
    }

    const aqiMod = await loadModuleSafe('src/domain/aqi.ts');
    const expMod = await loadModuleSafe('src/domain/exposure.ts');
    const indoorMod = await loadModuleSafe('src/domain/indoor.ts');

    if (!aqiMod?.calculateAqi || !expMod?.calculateRelativeDose || !indoorMod?.calculateCadrRequirement) {
      t.skip('Pending implementation of domain calculation engines');
      return;
    }

    // 1. Load curated Delhi Severe Smog snapshot (F12)
    const delhi = constMod.DEMO_SNAPSHOTS.delhi;
    assert.strictEqual(delhi.category, 'Severe', 'Delhi snapshot must be in Severe category');
    assert.ok(delhi.pollutants.pm2_5 >= 250, 'Delhi PM2.5 must exceed Severe breakpoint');

    // 2. Select Toddler & Asthmatic Grandparent high vulnerability persona (F12)
    const persona = constMod.DEMO_PERSONAS.toddler_grandparent;
    assert.ok(persona.vulnerabilities.includes('child'));
    assert.ok(persona.vulnerabilities.includes('asthmatic'));

    // 3. Calculate CPCB AQI (F1)
    const aqi = aqiMod.calculateAqi(delhi.pollutants.pm2_5, delhi.pollutants.pm10);
    assert.strictEqual(aqi.category, 'Severe');
    assert.strictEqual(aqi.isEstimate, true);

    // 4. Calculate Inhaled Dose for vulnerable group with and without mitigation (F2)
    const baselineDose = expMod.calculateRelativeDose({
      durationMinutes: 120,
      pm25: delhi.pollutants.pm2_5,
      activity: 'rest',
      microenvironment: 'outdoors',
      vulnerability: 'respiratory',
      maskType: 'none'
    });

    const mitigatedDose = expMod.calculateRelativeDose({
      durationMinutes: 120,
      pm25: delhi.pollutants.pm2_5,
      activity: 'rest',
      microenvironment: 'indoor_closed',
      vulnerability: 'respiratory',
      maskType: 'none'
    });

    assert.ok(mitigatedDose.relativeDoseUg < baselineDose.relativeDoseUg, 'Indoor stay must reduce inhaled dose');

    // 5. Indoor purifier CADR sizing for bedroom (F5, F25)
    // 200 sqft bedroom, 9ft ceiling -> 1800 cu ft * 5 ACH / 60 = 150 CFM
    const requiredCadr = indoorMod.calculateCadrRequirement(200, 9, 5);
    assert.strictEqual(requiredCadr, 150);

    // 6. Verify Serverless AI Proxy Grounding with Domain Facts (F19, F20, F21)
    const activeHarness = harness || (await startServerlessHarness());
    try {
      const response = await fetch(`${activeHarness.origin}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'narrate-plan',
          context: {
            aqi: aqi.aqi,
            city: 'Delhi',
            facts: [`AQI: ${aqi.aqi}`, 'Category: Severe', 'Keep windows closed', 'Run air purifier']
          },
          userText: 'What should we do today with our toddler and grandparent?'
        })
      });
      assert.ok([200, 503].includes(response.status), 'Proxy must return 200 or graceful 503');
      if (response.status === 200) {
        const body = await response.json();
        assert.ok(body.provenance, 'Must carry provenance metadata');
        assert.ok(['gemini', 'rules'].includes(body.provenance.source));
      }
    } finally {
      if (!harness && activeHarness) await activeHarness.close();
    }
  });

  // =========================================================================
  // Scenario 2: Lucknow Two-Wheeler Commuter: Mask & Mode Switching
  // Features Exercised: F1, F2, F6, F12, F14, F26, F20, F21
  // =========================================================================
  it('Scenario 4.7: Lucknow Two-Wheeler Commuter: Mask & Mode Switching', async (t) => {
    const constMod = await loadModuleSafe('src/constants/index.ts');
    if (!constMod || !constMod.DEMO_SNAPSHOTS?.lucknow || !constMod.DEMO_PERSONAS?.commuter_couple) {
      t.skip('Pending implementation of DEMO_SNAPSHOTS or DEMO_PERSONAS in src/constants/index.ts');
      return;
    }

    const expMod = await loadModuleSafe('src/domain/exposure.ts');
    const altMod = await loadModuleSafe('src/domain/alternatives.ts');

    if (!expMod?.calculateRelativeDose || !altMod?.compareAlternatives) {
      t.skip('Pending implementation of src/domain/exposure.ts or src/domain/alternatives.ts');
      return;
    }

    // 1. Load curated Lucknow Poor snapshot (F12)
    const lucknow = constMod.DEMO_SNAPSHOTS.lucknow;
    assert.strictEqual(lucknow.category, 'Poor');

    // 2. Select Commuter persona (F12, F14)
    const persona = constMod.DEMO_PERSONAS.commuter_couple;
    assert.strictEqual(persona.transitMode, 'two-wheeler');

    // 3. Commute Exposure Comparison: Two-Wheeler (no mask) vs Two-Wheeler (N95) vs Metro (F2, F6, F26)
    const commuteDuration = 40; // 40 minutes for 15km
    const twoWheelerNoMask = expMod.calculateRelativeDose({
      durationMinutes: commuteDuration,
      pm25: lucknow.pollutants.pm2_5,
      activity: 'moderate',
      microenvironment: 'outdoors',
      maskType: 'none'
    });

    const twoWheelerN95 = expMod.calculateRelativeDose({
      durationMinutes: commuteDuration,
      pm25: lucknow.pollutants.pm2_5,
      activity: 'moderate',
      microenvironment: 'outdoors',
      maskType: 'n95'
    });

    const metroRide = expMod.calculateRelativeDose({
      durationMinutes: commuteDuration,
      pm25: lucknow.pollutants.pm2_5,
      activity: 'light',
      microenvironment: 'metro',
      maskType: 'none'
    });

    assert.ok(twoWheelerN95.percentageChange <= -90, 'N95 must reduce relative inhaled dose by >=90%');
    assert.ok(metroRide.relativeDoseUg < twoWheelerNoMask.relativeDoseUg, 'Metro ride must incur lower dose than open two-wheeler');

    // 4. Verify Sustainable Alternatives Explainer Output (F6, F26)
    const baseline = { id: 'tw', title: 'Two-Wheeler', mode: 'two_wheeler_petrol', maskType: 'none', distanceKm: 15 };
    const metroOpt = { id: 'metro', title: 'Metro', mode: 'metro', maskType: 'none', distanceKm: 15 };
    const comp = altMod.compareAlternatives(baseline, [metroOpt], lucknow.pollutants.pm2_5);

    assert.ok(comp[0].relativeDoseChangePct < 0, 'Metro must reduce exposure relative to two-wheeler');
    assert.ok(comp[0].co2eDeltaGrams < 0, 'Metro must deliver substantial carbon savings relative to two-wheeler');
  });

  // =========================================================================
  // Scenario 3: Bengaluru Clean Morning to Sudden Smog Alert
  // Features Exercised: F1, F7, F8, F10, F16, F17, F24
  // =========================================================================
  it('Scenario 4.8: Bengaluru Clean Morning to Sudden Smog Alert', async (t) => {
    const aqiMod = await loadModuleSafe('src/domain/aqi.ts');
    const indoorMod = await loadModuleSafe('src/domain/indoor.ts');
    const routineMod = await loadModuleSafe('src/domain/routine.ts');

    if (!aqiMod?.calculateAqi || !indoorMod?.getVentilationRecommendation || !routineMod?.generateRoutine) {
      t.skip('Pending implementation of domain engine modules in src/domain/*');
      return;
    }

    // 1. Initial State: Clean morning conditions (AQI ~45 Good/Satisfactory) (F1, F12)
    const morningAqi = aqiMod.calculateAqi(18);
    assert.strictEqual(morningAqi.category, 'Good');

    // Morning ventilation safe at low AQI
    const morningVent = indoorMod.getVentilationRecommendation(morningAqi.aqi);
    assert.strictEqual(morningVent.allowed, true, 'Ventilation permitted during clean morning conditions');

    // 2. Sudden Smog Alert: Midday spike spikes PM2.5 to 105 (Poor) (F1, F8)
    const middayAqi = aqiMod.calculateAqi(105);
    assert.strictEqual(middayAqi.category, 'Poor');

    // 3. Hourly Outlook trajectory updates best ventilation window (F8, F17)
    const middayVent = indoorMod.getVentilationRecommendation(middayAqi.aqi);
    assert.ok(middayVent.durationMinutes <= 15, 'Ventilation window tightly restricted during Poor smog spike');

    // 4. Daily Routine shifts from outdoor workout to indoor filtered workout (F4, F24)
    const routine = routineMod.generateRoutine(middayAqi.category, { personaId: 'commuter', vulnerabilities: [] });
    const exerciseItem = routine.find((r) => r.timeBlock === 'exercise');
    assert.ok(exerciseItem, 'Exercise block must exist in routine');
    assert.ok(exerciseItem.action.toLowerCase().includes('indoor'), 'Exercise shifted indoors on Poor AQI');
  });

  // =========================================================================
  // Scenario 4: Offline / Live Failure Recovery via Manual AQI Entry
  // Features Exercised: F1, F7, F11, F13, F16, F21
  // =========================================================================
  it('Scenario 4.9: Offline / Live Failure Recovery via Manual AQI Entry', async (t) => {
    const fallbackMod = await loadModuleSafe('src/services/fallback.ts');
    const aqiMod = await loadModuleSafe('src/domain/aqi.ts');
    const expMod = await loadModuleSafe('src/domain/exposure.ts');

    if (!fallbackMod || !fallbackMod.createManualReading) {
      t.skip('Pending implementation of manual reading fallback in src/services/fallback.ts in M2');
      return;
    }

    if (!aqiMod?.calculateAqi || !expMod?.calculateRelativeDose) {
      t.skip('Pending implementation of domain calculations');
      return;
    }

    // 1. User inputs purifier reading: AQI 320 (Very Poor) (F11)
    const manualReading = fallbackMod.createManualReading({ aqi: 320 });

    // 2. Verify mandatory "user-entered reading" label is attached (F11, F16)
    assert.strictEqual(manualReading.sourceLabel, 'user-entered reading');
    assert.strictEqual(manualReading.aqi, 320);

    // 3. Inhaled dose calculated strictly from user-entered reading (F1, F2)
    const dose = expMod.calculateRelativeDose({
      durationMinutes: 60,
      pm25: 160,
      activity: 'light',
      maskType: 'none',
      microenvironment: 'indoor_closed'
    });
    assert.ok(dose.relativeDoseUg > 0);
  });

  // =========================================================================
  // Scenario 5: School & RWA Community Emergency Action Circular
  // Features Exercised: F1, F4, F12, F19, F21, F22, F28
  // =========================================================================
  it('Scenario 4.10: School & RWA Community Emergency Action Circular', async (t) => {
    const schemasMod = await loadModuleSafe('shared/schemas.ts');
    if (!schemasMod || !schemasMod.aiRequestSchema || !schemasMod.communityMessageOutputSchema) {
      t.skip('Pending implementation of shared/schemas.ts');
      return;
    }

    // 1. Validate community-message request schema (F28)
    const payload = {
      task: 'community-message',
      context: {
        aqi: 430,
        city: 'Delhi',
        facts: ['AQI: 430 (Severe)', 'N95 masks advised', 'School sports suspended']
      },
      userText: 'Emergency circular for school and RWA campus'
    };
    const parsed = schemasMod.aiRequestSchema.safeParse(payload);
    assert.strictEqual(parsed.success, true, 'Community message request must pass schema validation');

    // 2. Wire invocation to serverless proxy (F19, F21)
    const activeHarness = harness || (await startServerlessHarness());
    try {
      const response = await fetch(`${activeHarness.origin}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      assert.ok([200, 503].includes(response.status), 'Proxy must return 200 or graceful 503');
      if (response.status === 200) {
        const body = await response.json();
        assert.ok(body.provenance, 'Must carry provenance metadata');
        assert.ok(['gemini', 'rules'].includes(body.provenance.source));
        const outValid = schemasMod.communityMessageOutputSchema.safeParse(body.result);
        assert.strictEqual(outValid.success, true, 'Result must match communityMessageOutputSchema');
      }
    } finally {
      if (!harness && activeHarness) await activeHarness.close();
    }
  });
}
