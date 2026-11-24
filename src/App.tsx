// Root application component for Saans Urban Air Quality Assistant.
import { useEffect, useState, type ReactElement } from 'react';
import { Badge } from './components/ui/Badge.js';
import type { Provenance } from '../shared/types.js';

const initialProvenance: Provenance = {
  source: 'rules',
  model: 'rules-v1',
  cached: false,
};

/**
 * Root application component.
 *
 * @returns Rendered application UI.
 */
export function App(): ReactElement {
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/ai-status')
      .then((res) => (res.ok ? res.json() : { configured: false }))
      .then((data: { configured: boolean }) => setConfigured(data.configured))
      .catch(() => setConfigured(false));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50 font-sans p-6">
      <header className="max-w-3xl mx-auto mb-8 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <h1 className="text-3xl font-semibold tracking-tight">Saans (सांस)</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Urban Air Quality Assistant for North Indian Winter Smog
        </p>
      </header>

      <main className="max-w-3xl mx-auto space-y-6">
        <section aria-labelledby="status-heading" className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <h2 id="status-heading" className="text-lg font-medium mb-2">Service Status</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            AI Assistant Service:{' '}
            <span className="font-semibold" data-testid="ai-status">
              {configured === null ? 'Checking...' : configured ? 'Ready' : 'Offline (Rules Active)'}
            </span>
          </p>
        </section>

        <section aria-labelledby="tips-heading" className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="tips-heading" className="text-lg font-medium">Daily Indoor Protection Tips</h2>
            <Badge provenance={initialProvenance} />
          </div>
          <ul className="list-disc list-inside text-sm text-neutral-700 dark:text-neutral-300 space-y-1">
            <li>Keep windows sealed between 6:00 AM and 10:00 AM during peak inversion.</li>
            <li>Use damp mop instead of sweeping to avoid aerosolizing settled particulate matter.</li>
            <li>Run air purifier on medium/high speed in living spaces.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

