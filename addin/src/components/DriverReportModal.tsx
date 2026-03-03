import React, { useState } from "react";
import { CloseIcon, CheckIcon } from "./SvgIcons";

interface DriverReportModalProps {
  onClose: () => void;
}

const BEFORE_CONFIDENCE = 68;
const AFTER_CONFIDENCE = 84;
const BINS_SAMPLE = [
  { id: "B-101", name: "Queen St @ Spadina", fill: 72 },
  { id: "B-204", name: "King St W @ Bathurst", fill: 45 },
  { id: "B-318", name: "Dundas @ University", fill: 88 },
];

const ConfidenceMeter: React.FC<{ value: number; label: string; color: string }> = ({
  value,
  label,
  color,
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold" style={{ color }}>{value}%</span>
    </div>
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

const DriverReportModal: React.FC<DriverReportModalProps> = ({ onClose }) => {
  const [selectedBin, setSelectedBin] = useState(BINS_SAMPLE[0].id);
  const [reportedFill, setReportedFill] = useState(70);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => setSubmitted(true);

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="bg-card rounded-2xl shadow-2xl w-full mx-4 overflow-hidden"
        style={{ maxWidth: 720 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div>
            <h2 className="text-base font-extrabold text-foreground">Driver Data Reporting</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              See how driver-submitted data improves prediction accuracy
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition">
            <CloseIcon size={16} color="hsl(210, 15%, 50%)" />
          </button>
        </div>

        <div className="flex gap-0 divide-x divide-border">
          {/* Left — phone mockup */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/20">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Driver Mobile Interface (Mockup)
            </p>

            {/* Phone frame */}
            <div
              className="relative rounded-[2.5rem] border-[6px] border-foreground/10 shadow-2xl overflow-hidden"
              style={{ width: 200, height: 380, background: "#f8fafc" }}
            >
              {/* Screen */}
              <div className="absolute inset-0 p-4 flex flex-col gap-3 overflow-hidden">
                <div className="text-center">
                  <div className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
                    SmartRoute
                  </div>
                  <div className="text-[9px] text-muted-foreground">Report Bin Status</div>
                </div>

                {submitted ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckIcon size={22} color="#16a34a" />
                    </div>
                    <p className="text-[10px] text-green-700 font-bold text-center">
                      Report submitted!
                    </p>
                    <p className="text-[9px] text-muted-foreground text-center">
                      Prediction model updated
                    </p>
                    <button
                      onClick={() => { setSubmitted(false); setNote(""); }}
                      className="text-[9px] text-primary underline"
                    >
                      Submit another
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Bin selector */}
                    <div>
                      <div className="text-[9px] font-bold text-foreground mb-1">Select Bin</div>
                      <div className="flex flex-col gap-1">
                        {BINS_SAMPLE.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => setSelectedBin(b.id)}
                            className={`text-left px-2 py-1.5 rounded-lg text-[9px] transition border ${
                              selectedBin === b.id
                                ? "border-primary bg-primary/10 font-bold text-primary"
                                : "border-border bg-white text-foreground"
                            }`}
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fill level */}
                    <div>
                      <div className="flex justify-between text-[9px] font-bold text-foreground mb-1">
                        <span>Fill Level</span>
                        <span className="text-primary">{reportedFill}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={reportedFill}
                        onChange={(e) => setReportedFill(Number(e.target.value))}
                        className="w-full h-1.5 rounded-full accent-primary"
                        style={{
                          background: `linear-gradient(to right, hsl(200,65%,44%) ${reportedFill}%, hsl(200,18%,88%) ${reportedFill}%)`,
                        }}
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <div className="text-[9px] font-bold text-foreground mb-1">Notes</div>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Any issues?"
                        rows={2}
                        className="w-full text-[9px] px-2 py-1.5 rounded-lg border border-border bg-white resize-none outline-none"
                      />
                    </div>

                    <button
                      onClick={handleSubmit}
                      className="w-full py-2 bg-primary text-white text-[10px] font-bold rounded-lg"
                    >
                      Submit Report
                    </button>
                  </>
                )}
              </div>

              {/* Notch */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground/10 rounded-b-2xl"
              />
            </div>
          </div>

          {/* Right — impact panel */}
          <div className="flex-1 p-6 flex flex-col gap-5">
            <div>
              <h3 className="text-sm font-extrabold text-foreground mb-1">
                Prediction Confidence Impact
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Combining IoT sensor data with real-time driver reports improves
                fill-level accuracy, leading to smarter route decisions.
              </p>
            </div>

            {/* Before / After */}
            <div className="bg-muted/30 rounded-xl p-4 space-y-4">
              <ConfidenceMeter
                value={BEFORE_CONFIDENCE}
                label="Sensor-only baseline"
                color="hsl(200, 40%, 60%)"
              />
              <ConfidenceMeter
                value={AFTER_CONFIDENCE}
                label="Sensor + driver reports"
                color="hsl(200, 65%, 44%)"
              />
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xl font-extrabold text-primary">+{AFTER_CONFIDENCE - BEFORE_CONFIDENCE}%</span>
                <span className="text-xs text-muted-foreground">accuracy improvement</span>
              </div>
            </div>

            {/* How it works */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">
                How it works
              </h4>
              {[
                { icon: "📡", label: "IoT sensors", desc: "Continuous fill-level telemetry from bin sensors" },
                { icon: "🚛", label: "Driver reports", desc: "Visual confirmations submitted on pickup" },
                { icon: "🧠", label: "Predictive model", desc: "Fused data improves forecast accuracy by ~23%" },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="text-base leading-none mt-0.5">{icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-foreground">{label}</div>
                    <div className="text-[11px] text-muted-foreground">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto p-3 bg-primary/5 border border-primary/20 rounded-lg text-[11px] text-foreground leading-relaxed">
              <strong className="text-primary">Note:</strong> SmartRoute does not mandate a driver-facing UI — driver data
              can be collected via any existing channel (app, radio dispatch, or paper logs). This
              mockup shows the potential UX and its measurable impact on prediction confidence.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverReportModal;
