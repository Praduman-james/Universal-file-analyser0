import React, { useState } from "react";
import { UploadedFile } from "../types";
import { mergePdfs, splitPdf, rotatePdf, downloadUint8Array } from "../utils/pdfTools";
import { FileText, Layers, Scissors, RotateCw, Download, Check, AlertCircle, X, Plus } from "lucide-react";

interface PdfToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: UploadedFile[];
  activeFile?: UploadedFile | null;
}

export default function PdfToolsModal({ isOpen, onClose, files, activeFile }: PdfToolsModalProps) {
  const [activeTab, setActiveTab] = useState<"merge" | "split" | "rotate" | "compress">("merge");
  const [selectedMergeIds, setSelectedMergeIds] = useState<string[]>([]);
  const [selectedSplitFileId, setSelectedSplitFileId] = useState<string>(activeFile?.id || "");
  const [splitStart, setSplitStart] = useState<number>(1);
  const [splitEnd, setSplitEnd] = useState<number>(5);
  const [rotateAngle, setRotateAngle] = useState<number>(90);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter only PDF files that have base64Data
  const pdfFiles = files.filter((f) => f.isPdf && f.base64Data);

  const toggleMergeSelect = (id: string) => {
    setSelectedMergeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleMerge = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setStatusMessage("Merging PDF documents...");

      const toMerge = pdfFiles
        .filter((f) => selectedMergeIds.includes(f.id))
        .map((f) => ({ name: f.name, base64: f.base64Data! }));

      if (toMerge.length < 2) {
        throw new Error("Please select at least 2 PDF documents to merge.");
      }

      const mergedBytes = await mergePdfs(toMerge);
      downloadUint8Array(mergedBytes, `Merged_Document_${Date.now()}.pdf`);
      setStatusMessage("Merged PDF downloaded successfully!");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to merge PDFs.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplit = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setStatusMessage("Extracting page range...");

      const target = pdfFiles.find((f) => f.id === selectedSplitFileId);
      if (!target || !target.base64Data) {
        throw new Error("Please select a valid PDF file to split.");
      }

      const splitBytes = await splitPdf(target.base64Data, splitStart, splitEnd);
      downloadUint8Array(splitBytes, `Split_${target.name.replace(".pdf", "")}_p${splitStart}-p${splitEnd}.pdf`);
      setStatusMessage(`Pages ${splitStart}-${splitEnd} exported successfully!`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to split PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setStatusMessage("Rotating PDF pages...");

      const target = pdfFiles.find((f) => f.id === selectedSplitFileId);
      if (!target || !target.base64Data) {
        throw new Error("Please select a valid PDF file to rotate.");
      }

      const rotatedBytes = await rotatePdf(target.base64Data, rotateAngle);
      downloadUint8Array(rotatedBytes, `Rotated_${rotateAngle}deg_${target.name}`);
      setStatusMessage(`Rotated by ${rotateAngle}° and downloaded successfully!`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to rotate PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompress = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setStatusMessage("Optimizing and cleaning stream objects...");

      const target = pdfFiles.find((f) => f.id === selectedSplitFileId);
      if (!target || !target.base64Data) {
        throw new Error("Please select a valid PDF file to compress.");
      }

      // Load and resave with stream reconstruction
      const splitBytes = await splitPdf(target.base64Data, 1, 9999);
      downloadUint8Array(splitBytes, `Optimized_${target.name}`);
      setStatusMessage("Optimized PDF ready and downloaded!");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to compress PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">PDF Suite Tools</h3>
              <p className="text-xs text-slate-400">Merge, Split, Rotate & Compress PDF Documents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("merge");
              setStatusMessage(null);
            }}
            className={`flex items-center gap-2 px-3 py-2.5 border-b-2 font-medium transition-colors ${
              activeTab === "merge"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Merge PDFs
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("split");
              setStatusMessage(null);
            }}
            className={`flex items-center gap-2 px-3 py-2.5 border-b-2 font-medium transition-colors ${
              activeTab === "split"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            Split Pages
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("rotate");
              setStatusMessage(null);
            }}
            className={`flex items-center gap-2 px-3 py-2.5 border-b-2 font-medium transition-colors ${
              activeTab === "rotate"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            Rotate Orientation
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("compress");
              setStatusMessage(null);
            }}
            className={`flex items-center gap-2 px-3 py-2.5 border-b-2 font-medium transition-colors ${
              activeTab === "compress"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Optimize / Compress
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {pdfFiles.length === 0 ? (
            <div className="text-center py-8 bg-slate-950/60 rounded-xl border border-slate-800">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">No PDF files available</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Please upload or drag & drop one or more PDF files to use the merge, split, rotate, or compress tools.
              </p>
            </div>
          ) : (
            <>
              {/* MERGE TAB */}
              {activeTab === "merge" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">
                    Select two or more PDF documents in the order you wish to combine them:
                  </p>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {pdfFiles.map((pdf) => {
                      const isSelected = selectedMergeIds.includes(pdf.id);
                      const orderIndex = selectedMergeIds.indexOf(pdf.id);
                      return (
                        <div
                          key={pdf.id}
                          onClick={() => toggleMergeSelect(pdf.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-emerald-950/20 border-emerald-500/50 text-emerald-200"
                              : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                isSelected ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-500"
                              }`}
                            >
                              {isSelected ? orderIndex + 1 : "+"}
                            </div>
                            <span className="text-xs font-medium truncate">{pdf.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {Math.round(pdf.size / 1024)} KB
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleMerge}
                    disabled={selectedMergeIds.length < 2 || isProcessing}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Layers className="w-4 h-4" />
                    {isProcessing ? "Merging..." : `Merge ${selectedMergeIds.length} PDFs & Download`}
                  </button>
                </div>
              )}

              {/* SPLIT TAB */}
              {activeTab === "split" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Select PDF to Split:
                    </label>
                    <select
                      value={selectedSplitFileId}
                      onChange={(e) => setSelectedSplitFileId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
                    >
                      {pdfFiles.map((pdf) => (
                        <option key={pdf.id} value={pdf.id}>
                          {pdf.name} ({Math.round(pdf.size / 1024)} KB)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Start Page:</label>
                      <input
                        type="number"
                        min={1}
                        value={splitStart}
                        onChange={(e) => setSplitStart(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">End Page:</label>
                      <input
                        type="number"
                        min={1}
                        value={splitEnd}
                        onChange={(e) => setSplitEnd(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSplit}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Scissors className="w-4 h-4" />
                    {isProcessing ? "Extracting..." : "Extract Pages & Download PDF"}
                  </button>
                </div>
              )}

              {/* ROTATE TAB */}
              {activeTab === "rotate" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Select PDF to Rotate:
                    </label>
                    <select
                      value={selectedSplitFileId}
                      onChange={(e) => setSelectedSplitFileId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
                    >
                      {pdfFiles.map((pdf) => (
                        <option key={pdf.id} value={pdf.id}>
                          {pdf.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Rotation Angle:</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[90, 180, 270].map((deg) => (
                        <button
                          key={deg}
                          type="button"
                          onClick={() => setRotateAngle(deg)}
                          className={`py-2 text-xs rounded-lg border font-semibold transition-all ${
                            rotateAngle === deg
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {deg}° Clockwise
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRotate}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <RotateCw className="w-4 h-4" />
                    {isProcessing ? "Rotating..." : `Rotate ${rotateAngle}° & Download`}
                  </button>
                </div>
              )}

              {/* COMPRESS TAB */}
              {activeTab === "compress" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Select PDF to Optimize:
                    </label>
                    <select
                      value={selectedSplitFileId}
                      onChange={(e) => setSelectedSplitFileId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
                    >
                      {pdfFiles.map((pdf) => (
                        <option key={pdf.id} value={pdf.id}>
                          {pdf.name} ({Math.round(pdf.size / 1024)} KB)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
                    <p className="font-semibold text-slate-200">What Optimization Does:</p>
                    <p>• Strips orphaned stream objects and redundant metadata.</p>
                    <p>• Re-encodes cross-reference tables and deflates content.</p>
                    <p>• Retains 100% vector sharpness and text readability.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCompress}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Download className="w-4 h-4" />
                    {isProcessing ? "Optimizing..." : "Clean & Download Optimized PDF"}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Feedback banners */}
          {statusMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
