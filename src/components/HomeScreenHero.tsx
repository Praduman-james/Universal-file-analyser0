import React from "react";
import { UserPersonaMode } from "../types";
import {
  FileSearch,
  Camera,
  MessageSquareText,
  FileCode2,
  Scale,
  Calculator,
  Globe2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Files,
  Layers,
  BookOpen,
} from "lucide-react";

interface HomeScreenHeroProps {
  onActionAnalyze: () => void;
  onActionScan: () => void;
  onActionAskAi: () => void;
  onActionConvertOrOrganize: () => void;
  personaMode: UserPersonaMode;
  onPersonaModeChange: (mode: UserPersonaMode) => void;
  onOpenTemplates: () => void;
  onOpenBatch: () => void;
}

export default function HomeScreenHero({
  onActionAnalyze,
  onActionScan,
  onActionAskAi,
  onActionConvertOrOrganize,
  personaMode,
  onPersonaModeChange,
  onOpenTemplates,
  onOpenBatch,
}: HomeScreenHeroProps) {
  return (
    <div className="space-y-6 py-2 animate-in fade-in duration-300">
      {/* Top Banner with Persona Selector */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/30 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Universal Intelligence Hub
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Bilingual (English & हिंदी)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Universal Document & Media AI
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
            Contract analysis, GST invoices, receipts, resumes, spreadsheets, and video intelligence with verifiable page citations.
          </p>
        </div>

        {/* Persona Mode Switcher: General vs Lawyer vs Accountant */}
        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPersonaModeChange("general")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              personaMode === "general"
                ? "bg-slate-800 text-slate-100 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="General Intelligence Mode"
          >
            <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>General</span>
          </button>

          <button
            type="button"
            onClick={() => onPersonaModeChange("lawyer")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              personaMode === "lawyer"
                ? "bg-indigo-600 text-white shadow shadow-indigo-950/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Lawyer Mode: Focus on liabilities, indemnities, clauses, and legal risks"
          >
            <Scale className="w-3.5 h-3.5 text-amber-300" />
            <span className="font-semibold">Lawyer Mode</span>
          </button>

          <button
            type="button"
            onClick={() => onPersonaModeChange("accountant")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              personaMode === "accountant"
                ? "bg-emerald-600 text-white shadow shadow-emerald-950/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Accountant Mode: Focus on GSTIN verification, tax arithmetic, and ledgers"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-200" />
            <span className="font-semibold">Accountant Mode</span>
          </button>
        </div>
      </div>

      {/* THE FOUR BIG ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. ANALYZE FILE */}
        <div
          onClick={onActionAnalyze}
          className="group relative bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden hover:scale-[1.01]"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <FileSearch className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <h2 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                Analyze File
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload PDF, DOCX, XLSX, Images, or Videos for deep OCR, exact clause citations, and entity extraction.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>फाइल विश्लेषण करें</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 2. SCAN DOCUMENT */}
        <div
          onClick={onActionScan}
          className="group relative bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-cyan-500/50 p-5 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden hover:scale-[1.01]"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all pointer-events-none" />
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <h2 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                Scan Document
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Capture physical contracts, bills, or receipts with your camera. Auto-crops, cleans contrast, and extracts text.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-cyan-400 font-medium">
            <span>दस्तावेज़ स्कैन करें</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 3. ASK AI */}
        <div
          onClick={onActionAskAi}
          className="group relative bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden hover:scale-[1.01]"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all pointer-events-none" />
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <MessageSquareText className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <h2 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                Ask AI
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Query your documents in conversational English or हिंदी. Get instant legal advice, mathematical sums, and clause breakdowns.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-medium">
            <span>AI से पूछें (Bilingual)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 4. CONVERT OR ORGANIZE */}
        <div
          onClick={onActionConvertOrOrganize}
          className="group relative bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-amber-500/50 p-5 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden hover:scale-[1.01]"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
              <FileCode2 className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <h2 className="text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                Convert or Organize
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Merge, split, rotate, and compress PDFs. Manage batch queues, export to Word / Excel, and organize team folders.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-medium">
            <span>कन्वर्ट और व्यवस्थित करें</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Quick Access Badges & Template Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/60 border border-slate-900 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono text-[11px]">Quick Tools:</span>
          <button
            type="button"
            onClick={onOpenBatch}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Files className="w-3.5 h-3.5 text-cyan-400" />
            <span>Batch Upload & Extraction</span>
          </button>
          <button
            type="button"
            onClick={onOpenTemplates}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Custom Templates</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> PII Masking Ready
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Multi-Tier Model Resilience
          </span>
        </div>
      </div>
    </div>
  );
}
