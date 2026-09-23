import type { ReactNode } from 'react';

/** Main action for the screen, pinned to the bottom of the pane for one-handed reach. */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 mt-auto border-t border-rule bg-surface/95 px-4 py-3 backdrop-blur">
      <div className="flex gap-3 [&>*]:flex-1">{children}</div>
    </div>
  );
}
