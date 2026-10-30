import React, { useState } from "react";
import { UploadedFile, AnalysisMode, LanguageOption } from "../types";
import {
  Layers,
  X,
  Upload,
  Play,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Building,
  RefreshCw,
  FolderOpen,
  Filter,
} from "lucide-react";
import { exportBatchToExcel } from "../utils/exportUtils";

interface BatchProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: UploadedFile[];
  onBatchAnalyze: (filesToProcess: UploadedFile[]) => Promise<void>;
  onSelectFile: (id: string) => void;
  currentClientWorkspaceName?: string;
}

export default function BatchProcessingModal({
  isOpen,
  onClose,
  files,
  onBatchAnalyze,
  onSelectFile,
  currentClientWorkspaceName,
}: BatchProcessingModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(files.map((f) => f.id));
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterMode, setFilterMode] = useState<string>("all");

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedIds.length === files.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(files.map((f) => f.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedFiles = files.filter((f) => selectedIds.includes(f.id));

  const handleRunBatch = async () => {
    if (selectedFiles.length === 0) return;
    setIsProcessing(true);
    try {
      await onBatchAnalyze(selectedFiles);
    } catch {
      // Handled
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportExcel = () => {
    if (selectedFiles.length === 0) return;
    exportBatchToExcel(selectedFiles, currentClientWorkspaceName);
  };

  const filteredList = files.filter((f) => {
    if (filterMode === "all") return true;
    if (filterMode === "analyzed") return Boolean(f.analysis);
    if (filterMode === "pending") return !f.analysis;
    if (filterMode === "contract") return f.analysis?.detectedDocMode === "contract" || f.analysis?.contractDetails;
    if (filterMode === "invoice") return f.analysis?.detectedDocMode === "invoice" || f.analysis?.invoiceDetails;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Batch Document Upload & Extraction Engine
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  Multi-File Pipeline
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Extract data across multiple files simultaneously and export consolidated Excel / CSV
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Filter Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
            >
              {selectedIds.length === files.length ? "Deselect All" : "Select All"} ({selectedIds.length}/{files.length})
            </button>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 ml-2 border-l border-slate-800 pl-3">
              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              {[
                { id: "all", label: "All" },
                { id: "analyzed", label: "Analyzed" },
                { id: "pending", label: "Pending" },
                { id: "contract", label: "Contracts" },
                { id: "invoice", label: "Invoices" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterMode(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer ${
                    filterMode === f.id
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Run Batch Extraction */}
            <button
              type="button"
              onClick={handleRunBatch}
              disabled={isProcessing || selectedFiles.length === 0}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Batch Extraction ({selectedIds.length})</span>
                </>
              )}
            </button>

            {/* Export Batch to Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={selectedFiles.length === 0}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Batch to Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Batch Table List */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <FolderOpen className="w-10 h-10 mx-auto text-slate-600" />
              <p className="font-semibold text-slate-400">No documents found in this filter.</p>
              <p className="text-[11px]">Upload documents from the main screen to run batch extraction.</p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-inner bg-slate-950/60">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === files.length && files.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded accent-cyan-500"
                      />
                    </th>
                    <th className="p-3">Document Name</th>
                    <th className="p-3">Mode / Classification</th>
                    <th className="p-3">Primary Entity / Parties</th>
                    <th className="p-3">Total / Key Metric</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Health / PII</th>
                    <th className="p-3 text-right">Status & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredList.map((file) => {
                    const isSelected = selectedIds.includes(file.id);
                    const analysis = file.analysis;

                    let primaryEntity = "—";
                    let keyMetric = "—";
                    let docDate = "—";

                    if (analysis?.invoiceDetails) {
                      primaryEntity = analysis.invoiceDetails.vendor || "—";
                      keyMetric = analysis.invoiceDetails.total || "—";
                      docDate = analysis.invoiceDetails.dueDate || analysis.invoiceDetails.date || "—";
                    } else if (analysis?.receiptDetails) {
                      primaryEntity = analysis.receiptDetails.merchant || "—";
                      keyMetric = analysis.receiptDetails.amount || "—";
                      docDate = analysis.receiptDetails.date || "—";
                    } else if (analysis?.contractDetails) {
                      primaryEntity = analysis.contractDetails.parties?.slice(0, 2).join(", ") || "—";
                      keyMetric = analysis.contractDetails.paymentTerms || "Contract";
                      docDate = analysis.contractDetails.dates?.effective || "—";
                    } else if (analysis?.quickStats?.[0]) {
                      keyMetric = `${analysis.quickStats[0].value} ${analysis.quickStats[0].unit || ""}`;
                    }

                    return (
                      <tr
                        key={file.id}
                        className={`hover:bg-slate-900/50 transition-colors ${
                          isSelected ? "bg-cyan-950/15" : ""
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(file.id)}
                            className="rounded accent-cyan-500"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-200 truncate max-w-[200px]" title={file.name}>
                            {file.name}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                            {analysis?.detectedDocMode || file.docMode || "General"}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-300 truncate max-w-[160px] block" title={primaryEntity}>
                            {primaryEntity}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-medium text-emerald-400">
                          {keyMetric}
                        </td>
                        <td className="p-3 font-mono text-slate-400 text-[11px]">
                          {docDate}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-mono text-[10px]">
                            <span className="text-emerald-400">
                              {analysis?.healthAudit?.securityScore ?? 100}%
                            </span>
                            {analysis?.piiDetected && analysis.piiDetected.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {analysis.piiDetected.length} PII
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {analysis ? (
                              <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Extracted
                              </span>
                            ) : (
                              <span className="text-amber-400/80 font-medium text-[11px] flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Pending
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                onSelectFile(file.id);
                                onClose();
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
                            >
                              Inspect
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
