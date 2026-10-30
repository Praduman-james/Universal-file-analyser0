import React, { useState } from "react";
import { UploadedFile, FileComparisonResult, LanguageOption } from "../types";
import { GitCompare, X, RefreshCw, AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert, FileText, Download } from "lucide-react";

interface FileComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: UploadedFile[];
  initialFile1Id?: string;
  language: LanguageOption;
}

export default function FileComparisonModal({
  isOpen,
  onClose,
  files,
  initialFile1Id,
  language,
}: FileComparisonModalProps) {
  const [file1Id, setFile1Id] = useState<string>(initialFile1Id || files[0]?.id || "");
  const [file2Id, setFile2Id] = useState<string>(files[1]?.id || files[0]?.id || "");
  const [comparisonType, setComparisonType] = useState<string>("auto");
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [result, setResult] = useState<FileComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"audit" | "clauses" | "side_by_side" | "financial">("audit");

  if (!isOpen) return null;

  const file1 = files.find((f) => f.id === file1Id);
  const file2 = files.find((f) => f.id === file2Id);

  const runComparison = async () => {
    if (!file1 || !file2) {
      setError("Please select two documents to compare.");
      return;
    }

    if (file1.id === file2.id) {
      setError("Please choose two different documents to compare.");
      return;
    }

    setIsComparing(true);
    setError(null);

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file1: {
            name: file1.name,
            type: file1.type,
            summary: file1.analysis?.summary,
            content: file1.content || file1.analysis?.ocrText || "",
          },
          file2: {
            name: file2.name,
            type: file2.type,
            summary: file2.analysis?.summary,
            content: file2.content || file2.analysis?.ocrText || "",
          },
          comparisonType,
          language,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to compare documents");
      }

      const comparisonData: FileComparisonResult = await response.json();
      setResult(comparisonData);
    } catch (err: any) {
      setError(err.message || "Comparison failed. Please try again.");
    } finally {
      setIsComparing(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const markdown = `# Document Comparison Report: ${result.file1Name} vs ${result.file2Name}
Generated: ${new Date().toLocaleString()}
Similarity Score: ${result.similarityScore}%

## Executive Summary
${result.executiveSummary}

## Recommendation / Verdict
${result.verdict}

## Major Differences
${result.majorDifferences
  .map(
    (d) => `### [${d.type.toUpperCase()}] ${d.title}
${d.description}
* Citation Doc 1: ${d.citation1 || "N/A"}
* Citation Doc 2: ${d.citation2 || "N/A"}`
  )
  .join("\n\n")}

${
  result.financialShifts && result.financialShifts.length > 0
    ? `## Financial Shifts
| Item | ${result.file1Name} | ${result.file2Name} | Difference |
|---|---|---|---|
${result.financialShifts.map((f) => `| ${f.item} | ${f.file1Value} | ${f.file2Value} | ${f.difference} |`).join("\n")}`
    : ""
}

${
  result.clauseChanges && result.clauseChanges.length > 0
    ? `## Clause Alterations
${result.clauseChanges
  .map(
    (c) => `### ${c.clauseName}
* Before: ${c.file1Text}
* After: ${c.file2Text}
* Impact: ${c.impact}`
  )
  .join("\n\n")}`
    : ""
}
`;

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Comparison_${result.file1Name}_vs_${result.file2Name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Side-by-Side File Comparison & Audit</h3>
              <p className="text-xs text-slate-400">
                Compare two contracts, invoices, resumes, or statements for clause diffs and price changes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Selectors */}
        <div className="p-6 bg-slate-950/60 border-b border-slate-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block mb-1.5">
                Baseline Document (Version 1 / Origin)
              </span>
              <select
                value={file1Id}
                onChange={(e) => setFile1Id(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
              >
                {files.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1.5">
                Revised Document (Version 2 / Counterpart)
              </span>
              <select
                value={file2Id}
                onChange={(e) => setFile2Id(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
              >
                {files.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Comparison Mode:</span>
              <select
                value={comparisonType}
                onChange={(e) => setComparisonType(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
              >
                <option value="auto">Auto Detect Context</option>
                <option value="contract">Contracts (Clauses, Liabilities, Dates)</option>
                <option value="invoice">Invoices & Bills (Prices, Quantities, Taxes)</option>
                <option value="resume">Resumes (Skills, Experience, Career)</option>
                <option value="financial">Financial Statements (Balances, Line items)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={runComparison}
              disabled={isComparing || !file1 || !file2}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-cyan-500/15 flex items-center gap-2"
            >
              {isComparing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Analyzing Differences...
                </>
              ) : (
                <>
                  <GitCompare className="w-3.5 h-3.5" />
                  Compare Documents
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!result && !isComparing && (
            <div className="text-center py-12">
              <GitCompare className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">Ready to audit differences</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Select two files above and click &ldquo;Compare Documents&rdquo; to analyze clause alterations, price revisions, and risk factors.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Executive Summary & Score */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
                    <span>{result.file1Name}</span>
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                    <span>{result.file2Name}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-100 mb-1">Executive Summary</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{result.executiveSummary}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center px-4 py-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                      Similarity
                    </span>
                    <span
                      className={`text-xl font-bold font-mono ${
                        result.similarityScore > 80
                          ? "text-emerald-400"
                          : result.similarityScore > 50
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {result.similarityScore}%
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={downloadReport}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                    title="Export Markdown Report"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </div>
              </div>

              {/* Tab Navigation for Comparative Views */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("audit")}
                  className={`px-3 py-1.5 rounded-xl font-medium text-xs transition-colors cursor-pointer ${
                    activeTab === "audit"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Summary & Major Differences ({result.majorDifferences.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("clauses")}
                  className={`px-3 py-1.5 rounded-xl font-medium text-xs transition-colors cursor-pointer ${
                    activeTab === "clauses"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Contract Clause Comparison ({result.clauseChanges?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("side_by_side")}
                  className={`px-3 py-1.5 rounded-xl font-medium text-xs transition-colors cursor-pointer ${
                    activeTab === "side_by_side"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Side-by-Side Dual Document View
                </button>
                {result.financialShifts && result.financialShifts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("financial")}
                    className={`px-3 py-1.5 rounded-xl font-medium text-xs transition-colors cursor-pointer ${
                      activeTab === "financial"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Financial Variance ({result.financialShifts.length})
                  </button>
                )}
              </div>

              {/* 1. AUDIT & MAJOR DIFFERENCES TAB */}
              {activeTab === "audit" && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Verdict Banner */}
                  <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Legal / Strategic Verdict
                    </div>
                    <p className="text-xs text-emerald-200/90 leading-relaxed">{result.verdict}</p>
                  </div>

                  {/* Major Differences */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                      Major Alterations & Discoveries ({result.majorDifferences.length})
                    </h4>
                    <div className="space-y-2.5">
                      {result.majorDifferences.map((diff, idx) => {
                        const badge =
                          diff.type === "added"
                            ? { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Added" }
                            : diff.type === "removed"
                            ? { bg: "bg-red-500/10 text-red-400 border-red-500/20", label: "Removed" }
                            : diff.type === "risk"
                            ? { bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Risk Flag" }
                            : { bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "Modified" };

                        return (
                          <div
                            key={idx}
                            className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-xs font-semibold text-slate-200">{diff.title}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-2">{diff.description}</p>
                            {(diff.citation1 || diff.citation2) && (
                              <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-500">
                                {diff.citation1 && <span>Doc 1: {diff.citation1}</span>}
                                {diff.citation1 && diff.citation2 && <span>•</span>}
                                {diff.citation2 && <span>Doc 2: {diff.citation2}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. CONTRACT CLAUSE COMPARISON TAB */}
              {activeTab === "clauses" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Contract Clause Comparison & Liability Impact
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {result.clauseChanges?.length || 0} Clauses Analyzed
                    </span>
                  </div>

                  {result.clauseChanges && result.clauseChanges.length > 0 ? (
                    <div className="space-y-3">
                      {result.clauseChanges.map((c, idx) => (
                        <div key={idx} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                              <span>§</span> {c.clauseName}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                              Clause Review
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                              <span className="text-[10px] text-cyan-400 block mb-1 font-mono font-semibold">
                                Baseline: {result.file1Name}
                              </span>
                              <p className="text-slate-300 leading-relaxed font-sans">{c.file1Text}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                              <span className="text-[10px] text-emerald-400 block mb-1 font-mono font-semibold">
                                Revised: {result.file2Name}
                              </span>
                              <p className="text-slate-300 leading-relaxed font-sans">{c.file2Text}</p>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                            <div>
                              <span className="font-semibold">Legal & Operational Impact: </span>
                              <span>{c.impact}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-xl">
                      No discrete contract clause alterations detected between these two files.
                    </div>
                  )}
                </div>
              )}

              {/* 3. SIDE-BY-SIDE DUAL DOCUMENT VIEW */}
              {activeTab === "side_by_side" && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Synchronized Side-by-Side Dual Pane View:</span>
                    <span className="font-mono text-[11px] text-slate-500">Live Text Inspection</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Pane: Doc 1 */}
                    <div className="bg-slate-950 rounded-2xl border border-cyan-500/30 overflow-hidden flex flex-col h-[400px]">
                      <div className="p-3 bg-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between">
                        <span className="font-semibold text-cyan-300 truncate text-xs" title={file1?.name}>
                          {file1?.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">
                          Doc 1
                        </span>
                      </div>
                      <div className="p-4 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed flex-1 select-text">
                        {file1?.content || file1?.analysis?.ocrText || file1?.analysis?.summary || "No preview content available."}
                      </div>
                    </div>

                    {/* Right Pane: Doc 2 */}
                    <div className="bg-slate-950 rounded-2xl border border-emerald-500/30 overflow-hidden flex flex-col h-[400px]">
                      <div className="p-3 bg-emerald-950/40 border-b border-emerald-500/20 flex items-center justify-between">
                        <span className="font-semibold text-emerald-300 truncate text-xs" title={file2?.name}>
                          {file2?.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                          Doc 2
                        </span>
                      </div>
                      <div className="p-4 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed flex-1 select-text">
                        {file2?.content || file2?.analysis?.ocrText || file2?.analysis?.summary || "No preview content available."}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. FINANCIAL SHIFTS TAB */}
              {activeTab === "financial" && result.financialShifts && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Financial & Numerical Variance
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                        <tr>
                          <th className="p-3">Item / Metric</th>
                          <th className="p-3">{result.file1Name}</th>
                          <th className="p-3">{result.file2Name}</th>
                          <th className="p-3">Variance / Delta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                        {result.financialShifts.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="p-3 font-medium text-slate-200">{row.item}</td>
                            <td className="p-3 font-mono text-slate-300">{row.file1Value}</td>
                            <td className="p-3 font-mono text-slate-300">{row.file2Value}</td>
                            <td className="p-3 font-mono font-semibold text-amber-400">{row.difference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
