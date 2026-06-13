"use client";

import { useEffect, useRef, useState } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react";

interface Step {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    id: "upload",
    label: "Upload CV",
    description: "Sending file to secure storage",
    icon: <Upload className="h-5 w-5" strokeWidth={3} />,
  },
  {
    id: "parse",
    label: "Parse Text",
    description: "Extracting content from PDF / DOCX",
    icon: <FileText className="h-5 w-5" strokeWidth={3} />,
  },
  {
    id: "analyze",
    label: "AI Analysis",
    description: "Scoring and generating recommendations",
    icon: <Sparkles className="h-5 w-5" strokeWidth={3} />,
  },
];

interface ProgressStepsProps {
  isActive: boolean;
}

export default function ProgressSteps({ isActive }: ProgressStepsProps) {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimings = useRef({ parse: 800, analyze: 2500 });

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(0);
      setActiveStep(0);
      setCompletedSteps(new Set());
      return;
    }

    const startTime = Date.now();
    const totalDuration = 300_000; // 5 min max bar (NVIDIA can take 3–5 min)

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / totalDuration) * 100, 95);
      setProgress(pct);

      const completed = new Set<string>();

      if (elapsed >= stepTimings.current.analyze) {
        completed.add("upload");
        completed.add("parse");
        setActiveStep(2);
      } else if (elapsed >= stepTimings.current.parse) {
        completed.add("upload");
        setActiveStep(1);
      } else {
        setActiveStep(0);
      }
      setCompletedSteps(completed);
    }, 200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="mt-6 rounded-xl border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_#000000]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-black uppercase tracking-wider text-black">
          Processing your CV
        </p>
        <p className="text-xs font-bold text-gray-500">
          {Math.round(progress)}%
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-4 w-full overflow-hidden rounded-lg border-3 border-black bg-gray-100">
        <div
          className="h-full rounded-lg border-r-2 border-black bg-yellow-400 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = activeStep === index;

          return (
            <div key={step.id} className="flex items-start gap-3">
              {/* Icon bubble */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-3 border-black shadow-[2px_2px_0px_0px_#000000] transition-all duration-300 ${
                  isCompleted
                    ? "bg-green-400 text-black"
                    : isCurrent
                      ? "bg-yellow-300 text-black"
                      : "bg-gray-100 text-gray-400"
                } ${isCurrent && !isCompleted ? "animate-pulse" : ""}`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" strokeWidth={3} />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 animate-spin" strokeWidth={3} />
                ) : (
                  step.icon
                )}
              </div>

              {/* Text */}
              <div className="flex-1">
                <p
                  className={`text-sm font-black transition-colors ${
                    isCompleted
                      ? "text-green-700"
                      : isCurrent
                        ? "text-black"
                        : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs font-medium text-gray-500">
                  {isCompleted
                    ? "Done"
                    : isCurrent
                      ? step.description
                      : "Waiting..."}
                </p>
                {isCurrent && step.id === "analyze" && (
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-orange-500">
                    This may take 10 seconds – 5 minutes depending on AI provider
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connecting dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full border border-black transition-colors duration-300 ${
              i <= activeStep ? "bg-yellow-400" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
