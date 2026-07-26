"use client";

import { useTransition } from "react";
import { advanceStage } from "@/app/actions/events";
import { EVENT_STAGES, EVENT_STAGE_LABEL, EVENT_STAGE_COLOR } from "@/lib/constants";

export function StageControl({
  eventId,
  current,
  canEdit,
}: {
  eventId: string;
  current: string;
  canEdit: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {EVENT_STAGES.map((s) => {
        const active = s === current;
        return (
          <button
            key={s}
            disabled={!canEdit || pending || active}
            onClick={() => start(() => void advanceStage(eventId, s))}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:cursor-default"
            style={
              active
                ? { backgroundColor: `${EVENT_STAGE_COLOR[s]}26`, color: EVENT_STAGE_COLOR[s], boxShadow: `inset 0 0 0 1px ${EVENT_STAGE_COLOR[s]}` }
                : { backgroundColor: "var(--bg-elev)", color: "var(--text-dim)", opacity: canEdit ? 1 : 0.6 }
            }
          >
            {EVENT_STAGE_LABEL[s]}
          </button>
        );
      })}
    </div>
  );
}
