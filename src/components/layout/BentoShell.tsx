// BentoShell: viewport-locked desktop shell with stationary hover-expanding sidebar and scrollable main content.
import type { ReactElement } from 'react';
import type { FeatureTabId } from './FeatureTabs.js';
import { BentoSidebar } from './BentoSidebar.js';
import { BentoHeader, type BentoHeaderProps } from './BentoHeader.js';
import { BottomNav } from './BottomNav.js';

/** Props for BentoShell component. */
export interface BentoShellProps {
  readonly activeTab: FeatureTabId;
  readonly onSelectTab: (tab: FeatureTabId) => void;
  readonly isDark: boolean;
  readonly onToggleTheme: () => void;
  readonly onToggleLang: () => void;
  readonly onOpenTour: () => void;
  readonly onOpenProfile: () => void;
  readonly headerProps: BentoHeaderProps;
  readonly children: ReactElement;
}

/**
 * Responsive Bento dashboard shell with viewport-locked sidebar on desktop and bottom nav on mobile.
 *
 * @param props - Layout state, utility callbacks, header props, and child content.
 * @returns React element.
 */
export function BentoShell({
  activeTab, onSelectTab, isDark, onToggleTheme, onToggleLang,
  onOpenTour, onOpenProfile, headerProps, children,
}: BentoShellProps): ReactElement {
  return (
    <div className="min-h-dvh overflow-x-clip md:h-dvh md:overflow-hidden bg-bento-canvas dark:bg-neutral-950 p-0 md:p-4 pb-24 md:pb-4 font-sans transition-colors">
      <div className="max-w-[1600px] mx-auto flex items-stretch gap-4 min-w-0 md:h-full">
        <BentoSidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          onToggleLang={onToggleLang}
          onOpenTour={onOpenTour}
          onOpenProfile={onOpenProfile}
        />

        <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-neutral-900 rounded-none md:rounded-3xl shadow-sm md:h-full md:overflow-hidden">
          <BentoHeader
            {...headerProps}
            isDark={isDark}
            onToggleTheme={onToggleTheme}
            onToggleLang={onToggleLang}
            onOpenTour={onOpenTour}
            onOpenProfile={onOpenProfile}
          />
          <div className="flex-1 min-w-0 md:overflow-y-auto px-3.5 sm:px-6 pb-6">
            {children}
          </div>
        </div>
      </div>

      <BottomNav activeTab={activeTab} onSelectTab={onSelectTab} />
    </div>
  );
}
