import React, { useState } from "react";
import { FileAnalysis, Insight } from "../types";
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
  Palette,
  FileText,
  ScanText,
  Copy,
  Check,
  Layers,
  FileSpreadsheet,
  Calculator,
  AlertCircle,
  Table,
} from "lucide-react";
import { motion } from "motion/react";

interface AnalysisDashboardProps {
  analysis: FileAnalysis;
  onSelectPrompt: (prompt: string) => void;
}

export default function AnalysisDashboard({ analysis, onSelectPrompt }: AnalysisDashboardProps) {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const handleCopyFormula = (formula: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormula(formula);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  // Get category colors and icons
  const getInsightStyle = (category: string) => {
    switch (category) {
      case "Spreadsheet":
      case "Financial":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20",
          text: "text-emerald-400",
          icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" />,
        };
      case "Formula":
        return {
          bg: "bg-cyan-500/10 border-cyan-500/20",
          text: "text-cyan-400",
          icon: <Calculator className="w-4 h-4 text-cyan-400" />,
        };
      case "Document":
        return {
          bg: "bg-rose-500/10 border-rose-500/20",
          text: "text-rose-400",
          icon: <FileText className="w-4 h-4 text-rose-400" />,
        };
      case "OCR":
        return {
          bg: "bg-amber-500/10 border-amber-500/20",
          text: "text-amber-400",
          icon: <ScanText className="w-4 h-4 text-amber-400" />,
        };
      case "Palette":
        return {
          bg: "bg-fuchsia-500/10 border-fuchsia-500/20",
          text: "text-fuchsia-400",
          icon: <Palette className="w-4 h-4 text-fuchsia-400" />,
        };
      case "Video":
        return {
          bg: "bg-cyan-500/10 border-cyan-500/20",
          text: "text-cyan-400",
          icon: <VideoIcon className="w-4 h-4 text-cyan-400" />,
        };
      case "Audio":
        return {
          bg: "bg-indigo-500/10 border-indigo-500/20",
          text: "text-indigo-400",
          icon: <Volume2 className="w-4 h-4 text-indigo-400" />,
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 12, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  const isExcel =
    analysis.excelSheetSummaries && analysis.excelSheetSummaries.length > 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-5"
      id="analysis-dashboard-root"
    >
      {/* Narrative Summary Box */}
      <motion.div
        variants={itemVariants}
        className="relative bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-emerald-950/20 border border-emerald-500/20 p-5 rounded-2xl overflow-hidden shadow-lg"
        id="analysis-summary-card"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2 text-emerald-400">
            <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
            <h3 className="text-xs font-semibold tracking-wider uppercase font-mono">
              Gemini Executive Summary
            </h3>
          </div>
          {analysis.documentType && (
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold">
              {analysis.documentType}
            </span>
          )}
          {isExcel && (
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
              {analysis.excelSheetSummaries?.length} Worksheet(s)
            </span>
          )}
        </div>

        <p className="text-sm font-medium text-slate-100 leading-relaxed">
          {analysis.summary}
        </p>

        <div className="mt-3.5 pt-3.5 border-t border-slate-800/60 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] text-slate-500 font-mono">Analyzed Signature:</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
            {analysis.fileTypeDetails}
          </span>
        </div>
      </motion.div>

      {/* Multi-Sheet Breakdown Strip (Excel) */}
      {analysis.excelSheetSummaries && analysis.excelSheetSummaries.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl space-y-3"
          id="analysis-excel-sheets"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Table className="w-3.5 h-3.5 text-emerald-400" />
              Workbook Sheets Overview ({analysis.excelSheetSummaries.length})
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Sheet schema</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {analysis.excelSheetSummaries.map((sheet, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    {sheet.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {sheet.rowCount} rows × {sheet.colCount} cols
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{sheet.summary}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Key Calculated Formulas & Financial KPIs (Excel) */}
      {analysis.keyFormulasOrMetrics && analysis.keyFormulasOrMetrics.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl space-y-3"
          id="analysis-kpis-strip"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              Calculated KPIs & Suggested Excel Formulas
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Click formula to copy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {analysis.keyFormulasOrMetrics.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 font-mono truncate">{item.label}</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
                    {item.value}
                  </span>
                </div>
                {item.formula && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-850 font-mono text-[11px]">
                    <code className="text-cyan-400 truncate max-w-[180px]">{item.formula}</code>
                    <button
                      onClick={() => handleCopyFormula(item.formula!)}
                      className="text-slate-500 hover:text-emerald-400 transition cursor-pointer p-0.5"
                      title="Copy Excel formula"
                    >
                      {copiedFormula === item.formula ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Data Anomalies or Discrepancies (Excel & Data) */}
      {analysis.dataAnomalies && analysis.dataAnomalies.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl space-y-2"
          id="analysis-anomalies-strip"
        >
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-mono font-semibold uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            Detected Data Anomalies & Discrepancies
          </div>
          <ul className="space-y-1 text-xs text-slate-300">
            {analysis.dataAnomalies.map((anomaly, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>{anomaly}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Dominant Color Swatches Strip (Images - JPG / PNG) */}
      {analysis.dominantColors && analysis.dominantColors.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex flex-col gap-2.5"
          id="analysis-color-strip"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              Extracted Color Harmony
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Click hex to copy</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {analysis.dominantColors.map((color, idx) => (
              <button
                key={idx}
                onClick={() => handleCopyHex(color.hex)}
                className="flex items-center gap-2 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-lg cursor-pointer transition group"
                title={`${color.name} (${color.percentage || ""})`}
              >
                <div
                  className="w-4 h-4 rounded-md border border-white/20 shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-xs font-mono text-slate-300 group-hover:text-emerald-400">
                  {color.hex}
                </span>
                {color.percentage && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {color.percentage}
                  </span>
                )}
                {copiedHex === color.hex && (
                  <Check className="w-3 h-3 text-emerald-400" />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Metrics Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3.5"
        id="analysis-metrics-grid"
      >
        {analysis.quickStats.map((stat, i) => (
          <div
            key={i}
            className="bg-slate-900/40 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between"
            id={`metric-item-${i}`}
          >
            <p className="text-xs text-slate-400 font-medium font-mono">{stat.label}</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-100 tracking-tight truncate">
                {stat.value}
              </span>
              {stat.unit && (
                <span className="text-[10px] font-semibold text-slate-400 font-mono uppercase">
                  {stat.unit}
                </span>
              )}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Primary Observations & Insights */}
      <motion.div variants={itemVariants} className="space-y-3" id="analysis-insights-container">
        <h3 className="text-xs font-semibold text-slate-300 tracking-wider uppercase flex items-center gap-1.5 font-mono">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> Key Insights & Observations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5" id="analysis-insights-grid">
          {analysis.primaryInsights.map((insight, i) => {
            const style = getInsightStyle(insight.category);
            return (
              <div
                key={i}
                className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700 transition duration-200"
                id={`insight-item-${i}`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`p-1.5 rounded-lg ${style.bg}`}>
                      {style.icon}
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-400">
                      {insight.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200 mb-1.5">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Suggested Follow-ups */}
      {analysis.suggestedPrompts && analysis.suggestedPrompts.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-2.5 pt-1" id="analysis-suggestions-container">
          <h3 className="text-xs font-semibold text-slate-300 tracking-wider uppercase flex items-center gap-1.5 font-mono">
            <HelpCircle className="w-4 h-4 text-emerald-400" /> Suggested Inquiries
          </h3>
          <div className="flex flex-wrap gap-2" id="analysis-suggestions-list">
            {analysis.suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => onSelectPrompt(prompt)}
                className="text-xs text-slate-300 hover:text-emerald-300 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-xl px-3.5 py-2 text-left transition duration-200 cursor-pointer w-full md:w-auto"
                id={`suggestion-btn-${i}`}
              >
                {prompt}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
