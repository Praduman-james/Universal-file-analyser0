import React, { useState } from "react";
import { UploadedFile, AnalysisMode, LanguageOption } from "../types";
import {
  X,
  Upload,
  Files,
  CheckCircle2,
  AlertCircle,
  Download,
  FileText,
  DollarSign,
  Scale,
  Building,
  RefreshCw,
  FolderPlus,
  Play,
  FileSpreadsheet,
} from "lucide-react";

interface BatchItem {
  id: string;
  name: string;
  size: number;
  type: string;
  fileObj: File;
  status: "queued" | "processing" | "completed" | "error";
  error?: string;
  category?: string;
  entityName?: string;
  keyAmount?: string;
  keyDate?: string;
  summary?: string;
  uploadedFile?: UploadedFile;
}

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchCompleted: (files: UploadedFile[]) => void;
  language: LanguageOption;
  defaultDocMode: AnalysisMode;
}

export default function BatchUploadModal({
  isOpen,
  onClose,
  onBatchCompleted,
  language,
  defaultDocMode,
}: BatchUploadModalProps) {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: BatchItem[] = Array.from(files).map((f) => ({
      id: "batch-" + Math.random().toString(36).substring(2, 9),
      name: f.name,
      size: f.size,
      type: f.type || "application/octet-stream",
      fileObj: f,
      status: "queued",
    }));

    setBatchItems((prev) => [...prev, ...newItems]);
  };

  const removeItem = (id: string) => {
    setBatchItems((prev) => prev.filter((item) => item.id !== id));
  };

  const processSingleItem = async (item: BatchItem): Promise<BatchItem> => {
    try {
      const isImage = item.type.startsWith("image/");
      const isPdf = item.type.includes("pdf") || item.name.toLowerCase().endsWith(".pdf");
      const isVideo = item.type.startsWith("video/");

      let base64Data: string | undefined;
      let textContent = "";

      if (isPdf || isImage || isVideo) {
        base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result as string;
            resolve(res.split(",")[1] || "");
          };
          reader.readAsDataURL(item.fileObj);
        });
      } else {
        textContent = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || "");
          reader.readAsText(item.fileObj);
        });
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: item.name,
          fileType: item.type,
          fileContent: textContent,
          isImage,
          isVideo,
          isPdf,
          base64Data,
          docMode: defaultDocMode,
          language,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to analyze file");
      }

      const analysisData = await res.json();

      // Extract high-level summary fields for the batch table
      let category = analysisData.detectedDocMode || "Document";
      let entityName = "N/A";
      let keyAmount = "N/A";
      let keyDate = new Date().toLocaleDateString();

      if (analysisData.contractDetails?.parties?.length) {
        entityName = analysisData.contractDetails.parties.join(", ");
        category = "Contract";
        if (analysisData.contractDetails.dates?.effective) {
          keyDate = analysisData.contractDetails.dates.effective;
        }
      } else if (analysisData.invoiceDetails?.vendor) {
        entityName = analysisData.invoiceDetails.vendor;
        keyAmount = analysisData.invoiceDetails.total || "₹0";
        category = "Invoice";
        if (analysisData.invoiceDetails.date) keyDate = analysisData.invoiceDetails.date;
      } else if (analysisData.receiptDetails?.merchant) {
        entityName = analysisData.receiptDetails.merchant;
        keyAmount = analysisData.receiptDetails.amount || "₹0";
        category = "Receipt";
        if (analysisData.receiptDetails.date) keyDate = analysisData.receiptDetails.date;
      } else if (analysisData.resumeDetails?.skills?.length) {
        entityName = analysisData.resumeDetails.skills.slice(0, 3).join(", ");
        category = "Resume";
      } else if (analysisData.bankStatementDetails?.income) {
        entityName = "Inflow: " + analysisData.bankStatementDetails.income;
        keyAmount = "Outflow: " + (analysisData.bankStatementDetails.expenses || "N/A");
        category = "Bank Statement";
      } else if (analysisData.quickStats?.[0]) {
        keyAmount = `${analysisData.quickStats[0].label}: ${analysisData.quickStats[0].value}`;
      }

      const completedFile: UploadedFile = {
        id: "file-" + Math.random().toString(36).substring(2, 9),
        name: item.name,
        size: item.size,
        type: item.type,
        content: textContent,
        base64Data,
        isImage,
        isVideo,
        isPdf,
        uploadedAt: new Date().toISOString(),
        analysis: analysisData,
        chatHistory: [],
        docMode: defaultDocMode,
        language,
      };

      return {
        ...item,
        status: "completed",
        category,
        entityName,
        keyAmount,
        keyDate,
        summary: analysisData.summary,
        uploadedFile: completedFile,
      };
    } catch (err: any) {
      return {
        ...item,
        status: "error",
        error: err.message || "Extraction failed",
      };
    }
  };

  const processAll = async () => {
    setIsProcessingAll(true);
    const updated = [...batchItems];

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status !== "completed") {
        updated[i] = { ...updated[i], status: "processing" };
        setBatchItems([...updated]);
        const result = await processSingleItem(updated[i]);
        updated[i] = result;
        setBatchItems([...updated]);
      }
    }

    setIsProcessingAll(false);
  };

  const exportBatchToCsv = () => {
    const headers = ["File Name", "Size (Bytes)", "Category", "Entity / Parties", "Amount / Metrics", "Key Date", "Summary"];
    const rows = batchItems.map((item) => [
      `"${item.name.replace(/"/g, '""')}"`,
      item.size,
      `"${(item.category || "General").replace(/"/g, '""')}"`,
      `"${(item.entityName || "N/A").replace(/"/g, '""')}"`,
      `"${(item.keyAmount || "N/A").replace(/"/g, '""')}"`,
      `"${(item.keyDate || "N/A").replace(/"/g, '""')}"`,
      `"${(item.summary || "").replace(/"/g, '""').substring(0, 150)}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Batch_Extraction_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddAllToWorkspace = () => {
    const completed = batchItems
      .filter((i) => i.status === "completed" && i.uploadedFile)
      .map((i) => i.uploadedFile as UploadedFile);

    if (completed.length > 0) {
      onBatchCompleted(completed);
      onClose();
    }
  };

  const completedCount = batchItems.filter((i) => i.status === "completed").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Files className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Batch Upload & Automated Extraction
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  Multi-File
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload multiple documents, contracts, or invoices for automated mass extraction
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Multi-file drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileSelect(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isDragging
                ? "border-cyan-500 bg-cyan-500/10"
                : "border-slate-800 hover:border-slate-700 bg-slate-950/60"
            }`}
          >
            <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
            <p className="text-slate-200 font-semibold text-sm">
              Drag & drop multiple files here, or{" "}
              <label className="text-cyan-400 hover:underline cursor-pointer">
                browse files
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </label>
            </p>
            <p className="text-slate-500 text-[11px] mt-1">
              Supports bulk PDFs, Word docs, Excel spreadsheets, Images, and Invoices
            </p>
          </div>

          {/* Batch items table */}
          {batchItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">
                  Files in Batch ({batchItems.length}) • {completedCount} Processed
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={processAll}
                    disabled={isProcessingAll || batchItems.length === 0}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isProcessingAll ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing Batch...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Extraction</span>
                      </>
                    )}
                  </button>

                  {completedCount > 0 && (
                    <button
                      type="button"
                      onClick={exportBatchToCsv}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      title="Export all extracted batch data to Excel/CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <tr>
                      <th className="p-2.5">File Name</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Entity / Parties</th>
                      <th className="p-2.5">Key Metrics</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {batchItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-2.5 font-medium max-w-[180px] truncate">{item.name}</td>
                        <td className="p-2.5">
                          {item.status === "queued" && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                              Queued
                            </span>
                          )}
                          {item.status === "processing" && (
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] flex items-center gap-1 w-fit">
                              <RefreshCw className="w-3 h-3 animate-spin" /> Extracting...
                            </span>
                          )}
                          {item.status === "completed" && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                          )}
                          {item.status === "error" && (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono text-[10px]">
                              Error
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-cyan-300">{item.category || "—"}</td>
                        <td className="p-2.5 max-w-[180px] truncate text-slate-300">{item.entityName || "—"}</td>
                        <td className="p-2.5 font-mono text-emerald-400">{item.keyAmount || "—"}</td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {completedCount > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {completedCount} of {batchItems.length} files processed and ready for workspace.
            </span>
            <button
              type="button"
              onClick={handleAddAllToWorkspace}
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Add Processed Files to Workspace</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
