// Five-step skippable focus-trapped modal tour component.
import { useState, type ReactElement, type RefObject } from 'react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { TOUR_STEPS } from './tourSteps.js';

/** Props for GuidedTour component. */
export interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
}

/**
 * 5-step interactive guided tour walking users through application capabilities.
 *
 * @param props - Visibility state, closure handler, and trigger element reference.
 * @returns React component element or null.
 */
export function GuidedTour({ isOpen, onClose, triggerRef }: GuidedTourProps): ReactElement | null {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const currentStep = TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0];
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  const handleClose = (): void => {
    setStepIndex(0);
    onClose();
  };

  const handleNext = (): void => {
    if (isLast) {
      handleClose();
    } else {
      setStepIndex((prev) => Math.min(TOUR_STEPS.length - 1, prev + 1));
    }
  };

  const handlePrev = (): void => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      triggerRef={triggerRef}
      title={currentStep.title}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          <span className="uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
            {currentStep.category}
          </span>
          <span aria-live="polite">
            Step {stepIndex + 1} of {TOUR_STEPS.length}
          </span>
        </div>

        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed min-h-[60px]">
          {currentStep.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Skip Tour
          </Button>

          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev}>
                Previous
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={handleNext}>
              {isLast ? 'Finish Tour' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
