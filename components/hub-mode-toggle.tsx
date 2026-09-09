"use client";

import { useHubMode } from "@/components/providers/hub-mode-provider";
import { Badge } from "@/components/ui/badge";

/**
 * Hub Mode Toggle
 *
 * A switch/toggle that lets users switch between:
 * - Legacy mode: Stellar native AMM (existing)
 * - Hub mode: Zyrachain Protocol Hub contracts
 *
 * Shows availability status and explains the difference.
 */
export function HubModeToggle() {
  const { hubMode, hubAvailable, toggleHubMode } = useHubMode();

  if (!hubAvailable) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="opacity-50">
          Legacy AMM
        </Badge>
        <span>Hub not available</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleHubMode}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${hubMode ? "bg-emerald-500" : "bg-gray-600"}
        `}
        aria-label={`Switch to ${hubMode ? "legacy" : "Hub"} mode`}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${hubMode ? "translate-x-6" : "translate-x-1"}
          `}
        />
      </button>
      <div className="flex items-center gap-1.5">
        <Badge
          variant={hubMode ? "default" : "outline"}
          className={hubMode ? "bg-emerald-500" : ""}
        >
          {hubMode ? "Hub" : "Legacy"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {hubMode ? "Zyrachain Protocol" : "Stellar AMM"}
        </span>
      </div>
    </div>
  );
}
