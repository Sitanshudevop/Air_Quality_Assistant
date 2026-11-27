// Accessible focus-trapped welcome modal introducing Saans demo and onboarding actions.
import type { ReactElement, RefObject } from 'react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';

/** Props for WelcomeModal component. */
export interface WelcomeModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onLaunchDemo: () => void;
  readonly onOpenProfile: () => void;
  readonly onStartTour: () => void;
  readonly triggerRef?: RefObject<HTMLElement | null>;
}

/**
 * Accessible modal introducing first-time users to Saans demo mode, profile, and tour.
 *
 * @param props - Visibility state, action callbacks, and focus return reference.
 * @returns Focus-trapped Modal dialog element or null.
 */
export function WelcomeModal({
  isOpen,
  onClose,
  onLaunchDemo,
  onOpenProfile,
  onStartTour,
  triggerRef,
}: WelcomeModalProps): ReactElement | null {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      triggerRef={triggerRef}
      title="Welcome to Saans (सांस)"
      description="Science-backed urban winter smog guidance for households and communities."
    >
      <div className="space-y-4">
        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          Start immediately with curated demo snapshots or configure your household profile for
          personalized exposure, routine, and indoor air quality actions.
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            variant="primary"
            onClick={() => {
              onLaunchDemo();
              onClose();
            }}
          >
            1-Click Demo Launch
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              onOpenProfile();
            }}
          >
            Set Up Family Profile
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              onStartTour();
            }}
          >
            Guided Tour
          </Button>
        </div>
      </div>
    </Modal>
  );
}
