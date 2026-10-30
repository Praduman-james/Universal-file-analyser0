import React, { useState } from "react";
import { UploadedFile, PiiEntity } from "../types";
import { redactText } from "../utils/fileParsers";
import { ShieldCheck, ShieldAlert, X, Copy, Download, Check, Eye, EyeOff } from "lucide-react";

interface PiiRedactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: UploadedFile;
  onUpdateFile: (updated: UploadedFile) => void;
}

export default function PiiRedactionModal({ isOpen, onClose, file, onUpdateFile }: PiiRedactionModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  if (!isOpen) return null;

  const piiList: PiiEntity[] = file.analysis?.piiDetected || [];
  const baseContent = file.content || file.analysis?.ocrText || "";
  const redactedContent = file.redactedContent || redactText(baseContent, piiList);

  const handleApplyRedaction = () => {
    const updated: UploadedFile = {
      ...file,
      redactedContent,
    };
    onUpdateFile(updated);
  };

  const handleCopyRedacted = () => {
    navigator.clipboard.writeText(redactedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSanitized = () => {
    const blob = new Blob([redactedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Sanitized_Redacted_${file.name.replace(/\.[^/.]+$/, "")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Sensitive Information & Redaction</h3>
              <p className="text-xs text-slate-400">
                Audit Aadhaar, PAN, SSN, Credit Cards, Bank Accounts & apply data masking
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Status summary */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  piiList.length > 0 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {piiList.length > 0 ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {piiList.length > 0
                    ? `${piiList.length} Sensitive Information Tokens Detected`
                    : "No High-Risk PII Detected"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {piiList.length > 0
                    ? "Tokens are mapped to secure redaction placeholders before sharing."
                    : "Document appears clean of standard Aadhaar, PAN, and card numbers."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyRedacted}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy Redacted"}
              </button>

              <button
                type="button"
                onClick={handleDownloadSanitized}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {downloaded ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                {downloaded ? "Downloaded" : "Export Sanitized"}
              </button>
            </div>
          </div>

          {/* Detected List */}
          {piiList.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                Detected Identifiers & Credentials
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {piiList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-slate-200">{item.type}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            item.riskLevel === "High"
                              ? "bg-red-500/15 text-red-400"
                              : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {item.riskLevel} Risk
                        </span>
                      </div>
                      <div className="font-mono text-xs text-emerald-400 truncate">
                        {item.maskedValue}
                      </div>
                    </div>
                    {item.pageOrLocation && (
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {item.pageOrLocation}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {showOriginal ? "Original Text" : "Sanitized / Redacted Output Preview"}
              </span>
              <button
                type="button"
                onClick={() => setShowOriginal(!showOriginal)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {showOriginal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showOriginal ? "Show Redacted" : "Show Original"}
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
              {showOriginal ? baseContent || "No text available." : redactedContent || "No text available."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
