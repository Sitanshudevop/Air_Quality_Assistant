// Accessible confirmation dialog for clearing stored profile data.
import type { ReactElement } from 'react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';

/** Props for ClearDataDialog component. */
export interface ClearDataDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation dialog prompting user before deleting local storage and stored preferences.
 *
 * @param props - State and confirmation callback handlers.
 * @returns React component element or null.
 */
export function ClearDataDialog({
  isOpen,
  onCancel,
  onConfirm,
}: ClearDataDialogProps): ReactElement | null {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Clear all stored data?"
      description="This will reset your household profile, location preferences, and cached session data."
    >
      <div className="space-y-4 pt-2">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Are you sure? This action cannot be undone. Default demo settings will be restored.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            Yes, Clear My Data
          </Button>
        </div>
      </div>
    </Modal>
  );
}
