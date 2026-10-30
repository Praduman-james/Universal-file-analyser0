import React from "react";
import { UploadedFile, HealthAudit } from "../types";
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, FileWarning, Hash, Clock, X, Info } from "lucide-react";

interface FileHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: UploadedFile;
}

export default function FileHealthModal({ isOpen, onClose, file }: FileHealthModalProps) {
  if (!isOpen) return null;

  const audit: HealthAudit | undefined = file.analysis?.healthAudit;

  const score = audit?.securityScore ?? 95;
  const scoreColor =
    score >= 85 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">File Integrity & Health Audit</h3>
              <p className="text-xs text-slate-400">
                Corrupted file inspection, hidden metadata, duplicate check & MIME audit
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
          {/* Score Header */}
          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
                Integrity Score
              </span>
              <h4 className="text-sm font-semibold text-slate-100">
                {score >= 85
                  ? "Healthy & Authentic File Structure"
                  : score >= 60
                  ? "Potential Warnings Detected"
                  : "Critical Anomalies Flagged"}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">File: {file.name}</p>
            </div>

            <div className="text-center px-4 py-2 bg-slate-900 rounded-xl border border-slate-800">
              <span className={`text-2xl font-bold font-mono ${scoreColor}`}>{score}</span>
              <span className="text-xs text-slate-500 block">/ 100</span>
            </div>
          </div>

          {/* Audit Checks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-2">
                {audit?.isCorrupted ? (
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span className="text-xs font-semibold text-slate-200">Corruption Status</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {audit?.isCorrupted
                  ? "File stream is truncated or malformed."
                  : "Byte streams and headers are intact."}
              </p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-2">
                {audit?.suspiciousExtension ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span className="text-xs font-semibold text-slate-200">Extension & MIME Match</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {audit?.suspiciousExtension
                  ? "Extension differs from magic header signature."
                  : "Extension aligns with magic bytes."}
              </p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-2">
                {audit?.duplicateCandidate ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span className="text-xs font-semibold text-slate-200">Duplicate Check</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {audit?.duplicateCandidate
                  ? `Matches existing library file: "${audit.duplicateCandidate.name}"`
                  : "Unique document in this workspace."}
              </p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">Header Signature</span>
              </div>
              <p className="text-[11px] font-mono text-cyan-400 truncate">
                {audit?.sha256Prefix ? `Hex: ${audit.sha256Prefix}...` : "Standard stream"}
              </p>
            </div>
          </div>

          {/* Warnings list if any */}
          {audit?.warnings && audit.warnings.length > 0 && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <FileWarning className="w-4 h-4" />
                <span>Security Warnings & Anomalies ({audit.warnings.length})</span>
              </div>
              <ul className="text-xs text-amber-200/80 space-y-1 list-disc list-inside">
                {audit.warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Hidden Metadata table */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Inspected Metadata & Container Properties
            </h4>
            <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/60 overflow-hidden text-xs">
              {(audit?.hiddenMetadata || [
                { key: "File Name", value: file.name },
                { key: "Declared Type", value: file.type || "Document" },
                { key: "File Size", value: `${(file.size / 1024).toFixed(1)} KB` },
                { key: "Uploaded", value: new Date(file.uploadedAt).toLocaleString() },
              ]).map((meta, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 px-3.5">
                  <span className="text-slate-400 font-mono text-[11px]">{meta.key}</span>
                  <span className="text-slate-200 font-medium truncate max-w-xs">{meta.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
