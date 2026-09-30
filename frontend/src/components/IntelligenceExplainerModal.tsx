"use client";

import React from "react";
import { Modal } from "./ui/Modal";
import {
  Activity,
  Award,
  BookOpen,
  Calculator,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Info,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
} from "lucide-react";

interface IntelligenceExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IntelligenceExplainerModal({
  isOpen,
  onClose,
}: IntelligenceExplainerModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Explainable Hybrid Early-Warning Intelligence Architecture"
      subtitle="Transparent deterministic progress health, calibrated ML early-warning signals, and SHAP explainability"
      size="xl"
    >
      <div className="space-y-6 text-slate-700 text-xs">
        {/* Notice Header */}
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Info size={16} />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-blue-950">
              Explainable Hybrid Early-Warning Architecture
            </h4>
            <p className="text-xs text-blue-900/90 mt-1 leading-relaxed">
              EduIntern combines a <strong>deterministic progress health baseline</strong> (derived from verified milestone records) with an <strong>ML early-warning model</strong> and <strong>SHAP feature attributions</strong> to flag subtle disengagement signals before deadlines are missed. The ML model is a demonstration model trained on synthetic data; faculty mentors maintain full human review authority, with deterministic fallback whenever ML is unavailable.
            </p>
          </div>
        </div>

        {/* 1. Progress Attention Formula */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Calculator size={16} className="text-blue-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              1. Progress Analysis Scoring Formula
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            The overall Progress Score (0–100%) is calculated as a linear weighted combination of four academic indicators:
          </p>

          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm overflow-x-auto mb-4 border border-slate-800">
            <code>
              Progress Score = (Consistency &times; 0.30) + (Task Completion &times; 0.30) + (Report Submission &times; 0.20) + (Mentor Feedback &times; 0.20)
            </code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Activity size={13} className="text-blue-600" /> Progress Consistency
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800">
                  Weight: 30%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Harmonized balance between ongoing weekly submission regularity and deliverable velocity.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600" /> Task Completion
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                  Weight: 30%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Ratio of verified completed milestone tasks relative to total assigned curriculum deliverables.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <FileText size={13} className="text-purple-600" /> Report Submission
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800">
                  Weight: 20%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Count of submitted weekly activity logbooks compared against expected active academic weeks.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <UserCheck size={13} className="text-amber-600" /> Mentor Feedback
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800">
                  Weight: 20%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Average assessment score (0–100) awarded across evaluated reports by the assigned faculty supervisor.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Status Thresholds */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Scale size={16} className="text-purple-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              2. Monitoring Status Categorization
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Scores are deterministically mapped to 3 clear monitoring statuses:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 mb-1 inline-block">
                Score &ge; 75%
              </span>
              <h4 className="text-sm font-black text-emerald-900">On Track</h4>
              <p className="text-[11px] text-emerald-800 mt-1 leading-normal">
                Intern is meeting or exceeding all expected milestones and submission timelines.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 mb-1 inline-block">
                Score 50% &ndash; 74%
              </span>
              <h4 className="text-sm font-black text-amber-900">Monitor</h4>
              <p className="text-[11px] text-amber-800 mt-1 leading-normal">
                Moderate delays or pending submissions identified; routine academic follow-up advised.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 mb-1 inline-block">
                Score &lt; 50%
              </span>
              <h4 className="text-sm font-black text-rose-900">Needs Attention</h4>
              <p className="text-[11px] text-rose-800 mt-1 leading-normal">
                Significant milestone deficits; faculty review and 1-on-1 intervention recommended.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Skill Gap Analysis Formula */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              3. Skill Gap Analysis Logic
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Compares verified student competencies against placement prerequisites using case-insensitive set algebra:
          </p>

          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm overflow-x-auto mb-3 border border-slate-800">
            <code>
              Skill Match % = (|Acquired Skills &cap; Required Skills| / |Required Skills|) &times; 100
            </code>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            Missing competencies (<code>Required Skills \ Acquired Skills</code>) generate rule-based, transparent curriculum recommendations without external generative AI APIs.
          </p>
        </div>

        {/* 4. ML Early-Warning & SHAP Explainability */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-indigo-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              4. ML Early-Warning &amp; SHAP Explainability
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-2">
            To catch subtle disengagement patterns before deliverables are missed, a demonstration Random Forest classifier evaluates temporal features (velocity, cadence, recency) to predict risk probabilities:
          </p>
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/70 mb-3">
            <p className="text-[11px] text-indigo-950 font-medium">
              <strong>Local SHAP Feature Attributions:</strong> Every prediction is deconstructed via TreeSHAP into top risk drivers and protective factors, showing faculty exactly why a student received an elevated risk score.
            </p>
            <p className="text-[10px] text-indigo-900/80 mt-1 italic">
              Disclaimer: Prototype model trained on synthetic demonstration data. Evaluated for algorithmic behavior, not validated for real-world institutional certainty.
            </p>
          </div>
        </div>

        {/* 5. Hybrid Guardrails & Deterministic Fallback */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              5. Hybrid Institutional Guardrails &amp; Fallbacks
            </h3>
          </div>
          <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-slate-600">
            <li><strong>Deterministic Baseline:</strong> Verified milestones and report grades form the ground-truth health baseline.</li>
            <li><strong>Severe Inactivity Override:</strong> Inactivity &gt; 21 days forces monitoring status regardless of ML probabilities.</li>
            <li><strong>Early-Warning Escalation:</strong> High ML risk (&ge; 65%) on an on-track student triggers proactive check-in recommendations.</li>
            <li><strong>Deterministic Fallback:</strong> If the ML model artifact is unavailable, the system transparently defaults to pure deterministic scoring.</li>
          </ul>
        </div>

        {/* Footer info */}
        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>EduIntern Explainable Hybrid Intelligence Architecture v3.0</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all"
          >
            Close Information Panel
          </button>
        </div>
      </div>
    </Modal>
  );
}
