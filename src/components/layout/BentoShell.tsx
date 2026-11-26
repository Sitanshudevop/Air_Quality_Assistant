// BentoShell: outer app layout with sidebar, header, and bento grid content area.
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
  readonly headerProps: Omit<BentoHeaderProps, never>;
  readonly children: ReactElement;
}

/**
 * Outer Bento dashboard shell: left sidebar, top header, and main content area.
 *
 * @param props - Layout state and child content.
 * @returns React element.
 */
export function BentoShell({
  activeTab, onSelectTab, isDark, onToggleTheme, onToggleLang,
  onOpenTour, onOpenProfile, headerProps, children,
}: BentoShellProps): ReactElement {
  return (
    <div className="min-h-screen bg-bento-canvas dark:bg-neutral-950 p-2 sm:p-4 pb-20 md:pb-4 font-sans transition-colors">
      <div className="max-w-[1360px] mx-auto flex gap-3 min-h-[calc(100vh-2rem)]">
        <BentoSidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          onToggleLang={onToggleLang}
          onOpenTour={onOpenTour}
          onOpenProfile={onOpenProfile}
        />

        <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-neutral-900 rounded-3xl shadow-sm overflow-hidden">
          <BentoHeader {...headerProps} />
          <div className="flex-1 overflow-auto px-5 pb-5">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav (< lg screens, sidebar hidden) */}
      <BottomNav activeTab={activeTab} onSelectTab={onSelectTab} />
    </div>
  );
}
