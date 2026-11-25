// Dynamic window ventilation recommendation and countdown timer with severe-smog seal lock.
import { useEffect, useState, type ReactElement } from 'react';
import { getVentilationRecommendation } from '../../domain/indoor.js';
import { Button } from '../../components/ui/Button.js';

/** Props for VentilationTimer component. */
export interface VentilationTimerProps {
  readonly aqi: number;
}

/** Formats remaining seconds as MM:SS clock text. */
function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Displays outdoor-AQI-calibrated ventilation window and interactive flush countdown timer.
 *
 * @param props - Current outdoor AQI.
 * @returns Ventilation advisory and countdown widget element.
 */
export function VentilationTimer({ aqi }: VentilationTimerProps): ReactElement {
  const vent = getVentilationRecommendation(aqi);
  const isSealed = aqi > 400 || vent.durationMinutes <= 0;
  const initialSeconds = Math.max(0, vent.durationMinutes * 60);
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const [running, setRunning] = useState<boolean>(false);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setRunning(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, secondsLeft]);

  return (
    <div className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
          Ventilation Window Timer
        </h3>
        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Window: {vent.window}
        </span>
      </div>

      {isSealed ? (
        <div role="alert" className="p-3 rounded-lg border border-rose-400 bg-rose-50 text-rose-950 dark:bg-rose-950/50 dark:text-rose-100 dark:border-rose-700 text-xs font-semibold">
          Keep Windows Sealed — {vent.advice}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-neutral-700 dark:text-neutral-300">{vent.advice}</p>
          <div className="flex flex-wrap items-center gap-3">
            <span aria-live="polite" className="font-mono text-lg font-bold text-sky-800 dark:text-sky-300">
              {secondsLeft === 0 ? 'Expired — Close Windows' : formatSeconds(secondsLeft)}
            </span>
            <Button size="sm" variant="primary" disabled={secondsLeft === 0} onClick={() => setRunning((r) => !r)}>
              {running ? 'Pause' : 'Start Flush Timer'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setRunning(false);
                setSecondsLeft(initialSeconds);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
