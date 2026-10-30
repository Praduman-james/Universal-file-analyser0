import React, { useState } from "react";
import { FileAnalysis, Insight, UploadedFile } from "../types";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Code2,
  Database,
  HelpCircle,
  Video as VideoIcon,
  Volume2,
  Eye,
  Scale,
  DollarSign,
  FileCheck,
  ShieldAlert,
  Table,
  Download,
  GitCompare,
  BookmarkCheck,
  Globe,
  Languages,
  BookOpen,
  HelpCircle as QuestionIcon,
  MessageSquare,
} from "lucide-react";
import { motion } from "motion/react";
import StructuredDataView from "./StructuredDataView";
import SpecializedIntelligenceView from "./SpecializedIntelligenceView";
import ExplainTextModal from "./ExplainTextModal";
import { exportOcrToWord, exportFieldsToExcel, exportFieldsToCsv } from "../utils/exportUtils";
import { FileCheck2, FileSpreadsheet, LayoutTemplate, FileText } from "lucide-react";

interface AnalysisDashboardProps {
  analysis: FileAnalysis;
  file: UploadedFile;
  onSelectPrompt: (prompt: string) => void;
  onOpenHealthModal: () => void;
  onOpenPiiModal: () => void;
  onOpenComparisonModal: () => void;
  onOpenESignModal?: () => void;
  onOpenTemplatesModal?: () => void;
}

export default function AnalysisDashboard({
  analysis,
  file,
  onSelectPrompt,
  onOpenHealthModal,
  onOpenPiiModal,
  onOpenComparisonModal,
  onOpenESignModal,
  onOpenTemplatesModal,
}: AnalysisDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"insights" | "tables">("insights");
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [selectedTextForExplain, setSelectedTextForExplain] = useState("");
  const [isTranslatingSummary, setIsTranslatingSummary] = useState(false);
  const [translatedSummary, setTranslatedSummary] = useState<string | null>(null);
  const [showHindiSummary, setShowHindiSummary] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Get category colors and icons
  const getInsightStyle = (category: string) => {
    switch (category) {
      case "Legal":
      case "Obligation":
        return {
          bg: "bg-indigo-500/10 border-indigo-500/20",
          text: "text-indigo-400",
          icon: <Scale className="w-4 h-4 text-indigo-400" />,
        };
      case "Financial":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20",
          text: "text-emerald-400",
          icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
        };
      case "Compliance":
        return {
          bg: "bg-teal-500/10 border-teal-500/20",
          text: "text-teal-400",
          icon: <FileCheck className="w-4 h-4 text-teal-400" />,
        };
      case "Video":
        return {
          bg: "bg-cyan-500/10 border-cyan-500/20",
          text: "text-cyan-400",
          icon: <VideoIcon className="w-4 h-4 text-cyan-400" />,
        };
      case "Audio":
        return {
          bg: "bg-purple-500/10 border-purple-500/20",
          text: "text-purple-400",
          icon: <Volume2 className="w-4 h-4 text-purple-400" />,
        };
      case "Visual":
        return {
          bg: "bg-teal-500/10 border-teal-500/20",
          text: "text-teal-400",
          icon: <Eye className="w-4 h-4 text-teal-400" />,
        };
      case "Quality":
        return {
          bg: "bg-blue-500/10 border-blue-500/20",
          text: "text-blue-400",
          icon: <ShieldCheck className="w-4 h-4 text-blue-400" />,
        };
      case "Optimization":
        return {
          bg: "bg-amber-500/10 border-amber-500/20",
          text: "text-amber-400",
          icon: <Cpu className="w-4 h-4 text-amber-400" />,
        };
      case "Anomaly":
        return {
          bg: "bg-red-500/10 border-red-500/20",
          text: "text-red-400",
          icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
        };
      case "Structure":
        return {
          bg: "bg-purple-500/10 border-purple-500/20",
          text: "text-purple-400",
          icon: <Code2 className="w-4 h-4 text-purple-400" />,
        };
      case "Content":
      default:
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20",
          text: "text-emerald-400",
          icon: <Database className="w-4 h-4 text-emerald-400" />,
        };
    }
  };

  const piiCount = analysis.piiDetected?.length || 0;
  const tablesCount = analysis.extractedTables?.length || 0;
  const healthScore = analysis.healthAudit?.securityScore ?? 95;

  const handleTranslateSummary = async () => {
    if (translatedSummary) {
      setShowHindiSummary(!showHindiSummary);
      return;
    }
    setIsTranslatingSummary(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: analysis.summary,
          targetLanguage: "hi",
        }),
      });
      if (!res.ok) throw new Error("Translation failed");
      const data = await res.json();
      setTranslatedSummary(data.translatedText);
      setShowHindiSummary(true);
    } catch {
      // fallback
    } finally {
      setIsTranslatingSummary(false);
    }
  };

  const openExplainModalWithText = (text: string) => {
    setSelectedTextForExplain(text);
    setIsExplainModalOpen(true);
  };

  const exportFullReport = () => {
    const report = `# AI Analysis Report: ${file.name}
Date: ${new Date().toLocaleString()}
Document Signature: ${analysis.fileTypeDetails}
Detected Language: ${analysis.detectedLanguage || "English"}
Mode: ${analysis.detectedDocMode || "General"}

## Executive Summary
${analysis.summary}

## Key Metrics
${analysis.quickStats.map((s) => `* **${s.label}**: ${s.value} ${s.unit || ""}`).join("\n")}

## Primary Findings & Citations
${analysis.primaryInsights
  .map(
    (ins) =>
      `### [${ins.category}] ${ins.title} ${ins.citation ? `(${ins.citation})` : ""}\n${ins.description}`
  )
  .join("\n\n")}

${
  analysis.piiDetected && analysis.piiDetected.length > 0
    ? `## Detected Sensitive Entities (PII)\n${analysis.piiDetected
        .map((p) => `* **${p.type}**: ${p.maskedValue} (${p.riskLevel} Risk)`)
        .join("\n")}`
    : ""
}

## Security & Health Check
* Security Health Score: ${analysis.healthAudit?.securityScore ?? 100}/100
* File Integrity: ${analysis.healthAudit?.isCorrupted ? "Corrupted" : "Intact"}
* Warnings: ${analysis.healthAudit?.warnings?.join(", ") || "None"}
`;

    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name.replace(/\.[^/.]+$/, "")}_AI_Analysis_Report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
      id="analysis-dashboard-root"
    >
      {/* Quick Action & Audit Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Health Check Button */}
          <button
            type="button"
            onClick={onOpenHealthModal}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Health Check:</span>
            <span className="font-mono font-bold text-emerald-400">{healthScore}%</span>
          </button>

          {/* PII & Redaction Button */}
          <button
            type="button"
            onClick={onOpenPiiModal}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
              piiCount > 0
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
          >
            {piiCount > 0 ? (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>PII Redaction:</span>
            <span className="font-mono font-semibold">{piiCount} items</span>
          </button>

          {/* Explain Difficult Text / Clause Explainer Button */}
          <button
            type="button"
            onClick={() => openExplainModalWithText("")}
            className="px-2.5 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
            title="Explain difficult legal clauses, technical jargon, or dense sentences"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Explain Difficult Text</span>
          </button>

          {/* Extracted Tables Toggle */}
          {tablesCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveSubTab(activeSubTab === "tables" ? "insights" : "tables")}
              className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSubTab === "tables"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              <Table className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tables:</span>
              <span className="font-mono font-semibold">{tablesCount} found</span>
            </button>
          )}
          {/* Digital E-Sign Button */}
          {onOpenESignModal && (
            <button
              type="button"
              onClick={onOpenESignModal}
              className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-medium ${
                file.signatureAudit
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30"
              }`}
              title="Add cryptographic digital signature and generate certificate"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{file.signatureAudit ? "Signed & Sealed" : "Digital E-Sign"}</span>
            </button>
          )}

          {/* Custom Templates Button */}
          {onOpenTemplatesModal && (
            <button
              type="button"
              onClick={onOpenTemplatesModal}
              className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
              title="Apply custom schema extraction template"
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-amber-400" />
              <span>Templates</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto relative">
          {/* Compare Button */}
          <button
            type="button"
            onClick={onOpenComparisonModal}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <GitCompare className="w-3.5 h-3.5 text-amber-400" />
            <span>Compare</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-30 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
                  Export Document & Data
                </div>
                <button
                  type="button"
                  onClick={() => {
                    exportOcrToWord(file);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="font-medium block">Export OCR to Word (.doc)</span>
                    <span className="text-[10px] text-slate-400 block">Full text & formatted report</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exportFieldsToExcel(file);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-medium block">Export Fields to Excel (.xlsx)</span>
                    <span className="text-[10px] text-slate-400 block">Tables, metrics & specialized fields</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exportFieldsToCsv(file);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Table className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="font-medium block">Export Fields to CSV</span>
                    <span className="text-[10px] text-slate-400 block">Spreadsheet raw data format</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exportFullReport();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer border-t border-slate-800"
                >
                  <Download className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="font-medium block">Executive Report (.txt)</span>
                    <span className="text-[10px] text-slate-400 block">Plain text summary & insights</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Narrative Summary Box with Bilingual Translate Switch */}
      <div
        className="relative bg-gradient-to-r from-slate-900/70 to-emerald-950/25 border border-emerald-500/20 p-5 rounded-2xl overflow-hidden shadow-lg"
        id="analysis-summary-card"
      >
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 text-emerald-400">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold tracking-wider uppercase font-mono">
              AI Document Synthesis & Findings
            </h3>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono">
            {/* Translate to Hindi Toggle Button */}
            <button
              type="button"
              onClick={handleTranslateSummary}
              disabled={isTranslatingSummary}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
              title="Translate summary to Hindi"
            >
              <Languages className="w-3 h-3 text-emerald-400" />
              <span>
                {isTranslatingSummary
                  ? "Translating..."
                  : showHindiSummary
                  ? "Show Original English"
                  : "हिंदी में पढ़ें (Hindi)"}
              </span>
            </button>

            {analysis.detectedLanguage && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700">
                <Globe className="w-3 h-3 text-cyan-400" />
                {analysis.detectedLanguage}
              </span>
            )}
            {analysis.detectedDocMode && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                {analysis.detectedDocMode} Mode
              </span>
            )}
          </div>
        </div>

        <p className="text-sm font-medium text-slate-100 leading-relaxed whitespace-pre-wrap">
          {showHindiSummary && translatedSummary ? translatedSummary : analysis.summary}
        </p>

        <div className="mt-3.5 pt-3.5 border-t border-slate-800/60 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">Classification:</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
              {analysis.fileTypeDetails}
            </span>
          </div>

          <button
            type="button"
            onClick={() => openExplainModalWithText(analysis.summary.slice(0, 300))}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            <BookOpen className="w-3 h-3" />
            <span>Explain Difficult Concepts in this Summary</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5" id="analysis-metrics-grid">
        {analysis.quickStats.map((stat, i) => (
          <div
            key={i}
            className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-colors"
            id={`metric-item-${i}`}
          >
            <p className="text-xs text-slate-400 font-medium font-mono">{stat.label}</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-100 tracking-tight">{stat.value}</span>
              {stat.unit && (
                <span className="text-[10px] font-semibold text-slate-400 font-mono uppercase">
                  {stat.unit}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* SPECIALIZED INTELLIGENCE VIEW (Contract, Invoice, Receipt, Resume, Bank Statement, Dataset, Image) */}
      <SpecializedIntelligenceView
        contractDetails={analysis.contractDetails}
        invoiceDetails={analysis.invoiceDetails}
        receiptDetails={analysis.receiptDetails}
        resumeDetails={analysis.resumeDetails}
        bankStatementDetails={analysis.bankStatementDetails}
        datasetDetails={analysis.datasetDetails}
        imageDetails={analysis.imageDetails}
        onSelectPrompt={onSelectPrompt}
      />

      {/* Extracted Tables Section (if toggle is on) */}
      {activeSubTab === "tables" && analysis.extractedTables && (
        <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Table className="w-4 h-4 text-emerald-400" /> Extracted Structured Tables ({analysis.extractedTables.length})
            </h3>
            <button
              type="button"
              onClick={() => setActiveSubTab("insights")}
              className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Back to Insights
            </button>
          </div>
          <StructuredDataView tables={analysis.extractedTables} />
        </div>
      )}

      {/* Primary Observations & Insights with Citations */}
      {activeSubTab === "insights" && (
        <div className="space-y-3" id="analysis-insights-container">
          <h3 className="text-xs font-semibold text-slate-300 tracking-wider uppercase flex items-center gap-1.5 font-mono">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Key Insights & Exact Citations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="analysis-insights-grid">
            {analysis.primaryInsights.map((insight, i) => {
              const style = getInsightStyle(insight.category);
              return (
                <div
                  key={i}
                  className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition duration-200 group"
                  id={`insight-item-${i}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg ${style.bg}`}>{style.icon}</span>
                        <span className="text-xs font-mono font-medium text-slate-400">
                          {insight.category}
                        </span>
                      </div>
                      {insight.citation && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-emerald-400 flex items-center gap-1 shrink-0">
                          <BookmarkCheck className="w-3 h-3 text-emerald-400" />
                          {insight.citation}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-slate-200 mb-1.5 group-hover:text-emerald-300 transition-colors">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {insight.description}
                    </p>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => openExplainModalWithText(insight.description)}
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Explain this clause</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectPrompt(`Can you elaborate more on this finding: "${insight.title}"?`)}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Ask in Chat</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggested Follow-ups & Questions */}
      {analysis.suggestedPrompts && analysis.suggestedPrompts.length > 0 && (
        <div className="space-y-3 pt-2" id="analysis-suggestions-container">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 tracking-wider uppercase flex items-center gap-1.5 font-mono">
              <QuestionIcon className="w-4 h-4 text-emerald-400" /> Ask Questions & Inquiries
            </h3>
            <span className="text-[11px] text-slate-500">Click to ask directly</span>
          </div>
          <div className="flex flex-wrap gap-2.5" id="analysis-suggestions-list">
            {analysis.suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectPrompt(prompt)}
                className="text-xs text-slate-300 hover:text-emerald-300 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-xl px-3.5 py-2.5 text-left transition duration-200 cursor-pointer w-full md:w-auto flex items-center gap-2 group"
                id={`suggestion-btn-${i}`}
              >
                <span className="text-emerald-400 font-mono text-[10px]">Q{i + 1}:</span>
                <span className="group-hover:translate-x-0.5 transition-transform">{prompt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Difficult Text Explainer & Translation Modal */}
      <ExplainTextModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        documentSnippet={selectedTextForExplain || file.content?.slice(0, 500) || ""}
        fileName={file.name}
        onAskInChat={(prompt) => {
          onSelectPrompt(prompt);
        }}
      />
    </motion.div>
  );
}
