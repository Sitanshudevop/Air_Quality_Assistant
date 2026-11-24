// Profile onboarding wizard modal for managing user preferences and safe reset.
import { useState, useEffect, type ReactElement, type RefObject, type FormEvent } from 'react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { getProfile, saveProfile, clearProfile, DEFAULT_PROFILE } from '../../services/profile.js';
import type { StoredProfile } from '../../services/profile.types.js';
import { ProfileFormFields } from './ProfileFormFields.js';
import { ClearDataDialog } from './ClearDataDialog.js';

/** Props for ProfileWizard component. */
export interface ProfileWizardProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
  onProfileUpdated?: (profile: StoredProfile) => void;
}

/**
 * Onboarding wizard dialog managing household profile persistence and safe data wiping.
 *
 * @param props - Dialog controls and profile update callbacks.
 * @returns React component element or null.
 */
export function ProfileWizard({
  isOpen,
  onClose,
  triggerRef,
  onProfileUpdated,
}: ProfileWizardProps): ReactElement | null {
  const [formData, setFormData] = useState<StoredProfile>(DEFAULT_PROFILE);
  const [isConfirmClear, setIsConfirmClear] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setFormData(getProfile());
      setStatusMessage('');
    }
  }, [isOpen]);

  const handleChange = <K extends keyof StoredProfile>(field: K, value: StoredProfile[K]): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: FormEvent): void => {
    e.preventDefault();
    const saved = saveProfile(formData);
    onProfileUpdated?.(saved);
    setStatusMessage('Profile saved successfully.');
    setTimeout(() => onClose(), 600);
  };

  const handleClearConfirmed = (): void => {
    clearProfile();
    setFormData(DEFAULT_PROFILE);
    onProfileUpdated?.(DEFAULT_PROFILE);
    setIsConfirmClear(false);
    setStatusMessage('Data cleared. Defaults restored.');
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} triggerRef={triggerRef} title="Family Smog Profile">
        <form onSubmit={handleSave} className="space-y-4">
          <ProfileFormFields formData={formData} onChange={handleChange} />

          {statusMessage && (
            <p role="status" className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {statusMessage}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <Button variant="ghost" size="sm" onClick={() => setIsConfirmClear(true)}>
              Clear my data
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Profile
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      <ClearDataDialog
        isOpen={isConfirmClear}
        onCancel={() => setIsConfirmClear(false)}
        onConfirm={handleClearConfirmed}
      />
    </>
  );
}
