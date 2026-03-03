import React, { useState, useEffect, useMemo } from "react";
import type { AlgoMetrics } from "@/services/algorithm";
import type { LoadedRoute, OptimizedResult } from "@/hooks/useSmartRoute";
import { CheckIcon, CloseIcon } from "./SvgIcons";

interface OptimizedRouteEntry {
  route: LoadedRoute;
  opt: OptimizedResult;
  key: string;        // routeId or "routeId::dateISO" for week mode
  dayLabel?: string;  // "Monday", etc.
}

interface OptimizeReviewModalProps {
  optimizedRoutes: OptimizedRouteEntry[];
  onAccept: (routeKey: string) => Promise<string | null>;
  onDiscard: (routeKey: string) => void;
  onClose: () => void;
  /** Called whenever the viewed route changes — parent can zoom the map */
  onRouteChange?: (routeId: string) => void;
}

const CONFIDENCE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high:   { bg: "bg-green-100", text: "text-green-700", label: "High confidence" },
  medium: { bg: "bg-amber-100", text: "text-amber-700", label: "Medium confidence" },
  low:    { bg: "bg-red-100",   text: "text-red-700",   label: "Low confidence" },
};

const MetricRow: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={`text-sm font-bold ${highlight ? "text-primary" : "text-foreground"}`}>
      {value}
    </span>
  </div>
);

const RouteCard: React.FC<{
  route: LoadedRoute;
  opt: OptimizedResult;
  metrics: AlgoMetrics;
  accepted: boolean;
  accepting: boolean;
  assignedVehicle: string | null;
  onAccept: () => void;
  onDiscard: () => void;
}> = ({ route, opt, metrics, accepted, accepting, assignedVehicle, onAccept, onDiscard }) => {
  // Compute overall confidence from per-bin confidences
  const overallConfidence = useMemo(() => {
    if (!opt.confidences || opt.confidences.length === 0) return null;
    const counts = { high: 0, medium: 0, low: 0 };
    for (const c of opt.confidences) counts[c.confidence]++;
    if (counts.high >= counts.medium && counts.high >= counts.low) return "high";
    if (counts.medium >= counts.low) return "medium";
    return "low";
  }, [opt.confidences]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: route.color }} />
        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-foreground leading-tight">{route.name}</h3>
          {assignedVehicle && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Assigned to: <span className="font-semibold text-foreground">{assignedVehicle}</span> (nearest to depot)
            </div>
          )}
          {opt.forecastDate && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Forecast for: <span className="font-semibold">{opt.forecastDate}</span>
              {opt.dayLabel && <> ({opt.dayLabel})</>}
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground ml-auto shrink-0">{route.bins.length} stops</span>
      </div>

      {/* Confidence badge */}
      {overallConfidence && (
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold ${CONFIDENCE_STYLES[overallConfidence].bg} ${CONFIDENCE_STYLES[overallConfidence].text}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {CONFIDENCE_STYLES[overallConfidence].label} — based on historical fill patterns
        </div>
      )}

      <div className="bg-muted/40 rounded-xl p-4">
        <MetricRow label="Hours saved" value={`${metrics.hoursSaved.toFixed(1)} hrs`} highlight />
        <MetricRow label="Fuel saved" value={`${metrics.fuelSavedL.toFixed(1)} L`} highlight />
        <MetricRow label="CO₂ avoided" value={`${metrics.co2AvoidedKg.toFixed(1)} kg`} highlight />
        <MetricRow label="Stops skipped" value={String(metrics.stopsSkipped)} />
        <MetricRow label="Distance saved" value={`${metrics.kmSaved.toFixed(1)} km`} />
      </div>

      {accepted ? (
        <div className="flex items-center gap-2 py-2 px-3 bg-green-50 rounded-lg text-green-700 font-semibold text-sm">
          <CheckIcon size={15} color="#15803d" />
          Saved to Geotab
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            disabled={accepting}
            className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {accepting ? (
              <span className="text-xs">Saving…</span>
            ) : (
              <>
                <CheckIcon size={14} color="white" />
                Accept &amp; Save
              </>
            )}
          </button>
          <button
            onClick={onDiscard}
            className="flex-1 py-2.5 bg-muted hover:bg-muted/70 text-muted-foreground font-bold text-sm rounded-lg transition"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
};

const OptimizeReviewModal: React.FC<OptimizeReviewModalProps> = ({
  optimizedRoutes,
  onAccept,
  onDiscard,
  onClose,
  onRouteChange,
}) => {
  const [idx, setIdx] = useState(0);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [accepting, setAccepting] = useState(false);

  // Determine if this is week mode (has day labels)
  const dayLabels = useMemo(() => {
    const days = [...new Set(optimizedRoutes.map((r) => r.dayLabel).filter(Boolean))] as string[];
    return days.length > 0 ? days : null;
  }, [optimizedRoutes]);

  const [activeDay, setActiveDay] = useState<string | null>(dayLabels?.[0] ?? null);

  // Reset active day when dayLabels change
  useEffect(() => {
    if (dayLabels) setActiveDay(dayLabels[0]);
    else setActiveDay(null);
  }, [dayLabels]);

  // Filter routes by active day (or show all if not week mode)
  const visibleRoutes = useMemo(() => {
    if (!activeDay || !dayLabels) return optimizedRoutes;
    return optimizedRoutes.filter((r) => r.dayLabel === activeDay);
  }, [optimizedRoutes, activeDay, dayLabels]);

  // Reset index when day tab changes
  useEffect(() => {
    setIdx(0);
  }, [activeDay]);

  const current = visibleRoutes[idx];
  const total = visibleRoutes.length;

  // Notify parent whenever route changes so map can zoom
  useEffect(() => {
    if (current) {
      const routeId = current.key.includes("::") ? current.key.split("::")[0] : current.key;
      onRouteChange?.(routeId);
    }
  }, [idx, activeDay]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return null;

  const handleAccept = async () => {
    setAccepting(true);
    await onAccept(current.key);
    setAccepted((prev) => ({ ...prev, [current.key]: true }));
    setAccepting(false);
    // Auto-advance after a moment
    if (idx < total - 1) {
      setTimeout(() => setIdx((i) => i + 1), 800);
    }
  };

  const handleDiscard = () => {
    onDiscard(current.key);
    if (idx < total - 1) setIdx((i) => i + 1);
  };

  const isCurrentAccepted = accepted[current.key] || current.opt.accepted;

  const allDone = visibleRoutes.every(
    (r) => accepted[r.key] || r.opt.accepted,
  );

  return (
    /* Panel — no backdrop; parent places this in the right column */
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">
            {dayLabels ? "Week Optimization" : "Optimized Routes"}
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Review and accept each route
          </p>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-full transition">
          <CloseIcon size={14} color="hsl(210, 15%, 50%)" />
        </button>
      </div>

      {/* Day tabs (only in week mode) */}
      {dayLabels && (
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {dayLabels.map((day) => {
            const dayRoutes = optimizedRoutes.filter((r) => r.dayLabel === day);
            const allAcceptedForDay = dayRoutes.every((r) => accepted[r.key] || r.opt.accepted);
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  activeDay === day
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {day.substring(0, 3)}
                {allAcceptedForDay && " \u2713"}
              </button>
            );
          })}
        </div>
      )}

      {/* Progress dots + bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {idx + 1} of {total}
          </span>
          <div className="flex gap-1">
            {visibleRoutes.map((r, i) => (
              <button
                key={r.key}
                onClick={() => setIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === idx ? 16 : 8,
                  height: 8,
                  background: i === idx ? r.route.color : "hsl(200, 18%, 85%)",
                }}
              />
            ))}
          </div>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${((idx + 1) / total) * 100}%`,
              background: current.route.color,
            }}
          />
        </div>
      </div>

      {/* Route card */}
      <div className="flex-1 overflow-y-auto">
        <RouteCard
          route={current.route}
          opt={current.opt}
          metrics={current.opt.result.metrics}
          accepted={isCurrentAccepted}
          accepting={accepting}
          assignedVehicle={current.opt.assignedVehicle}
          onAccept={handleAccept}
          onDiscard={handleDiscard}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="text-xs font-semibold text-primary hover:underline disabled:opacity-30 disabled:no-underline"
        >
          &larr; Prev
        </button>

        {allDone ? (
          <button
            onClick={onClose}
            className="text-xs font-semibold text-green-600 hover:underline"
          >
            All done &check;
          </button>
        ) : idx < total - 1 ? (
          <button
            onClick={() => setIdx((i) => i + 1)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Next &rarr;
          </button>
        ) : (
          <button
            onClick={onClose}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};

export default OptimizeReviewModal;
