import React, { useState } from "react";
import { Trash2, AlertTriangle, X, CheckCircle2, RotateCcw, FolderX, FileX2 } from "lucide-react";
import { ClientWorkspace, UploadedFile } from "../types";

export type ClearScope = "active_workspace" | "all_history" | "all_reset";

interface ClearWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWorkspace: ClientWorkspace | null;
  totalFilesCount: number;
  workspaceFilesCount: number;
  onClearHistory: (scope: ClearScope) => void;
}

export default function ClearWorkspaceModal({
  isOpen,
  onClose,
  activeWorkspace,
  totalFilesCount,
  workspaceFilesCount,
  onClearHistory,
}: ClearWorkspaceModalProps) {
  const [selectedScope, setSelectedScope] = useState<ClearScope>(
    activeWorkspace ? "active_workspace" : "all_history"
  );
  const [confirmationInput, setConfirmationInput] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const requiresTyping = selectedScope === "all_reset";
  const canProceed = !requiresTyping || confirmationInput.trim().toUpperCase() === "CLEAR";

  const handleExecute = () => {
    if (!canProceed) return;
    onClearHistory(selectedScope);
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      setConfirmationInput("");
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-500/15 text-red-400 border border-red-500/30">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Clear Workspace & History
              </h2>
              <p className="text-xs text-slate-400">
                Purge processed files, extracted records, and cached workspace analyses
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

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-300">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold block text-amber-200">Irreversible Action</span>
              Cleared files and their associated extracted tables, OCR transcriptions, and chat conversations cannot be recovered from local browser storage.
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Choose Scope to Clear:
            </span>

            {/* Option 1: Current Workspace only (if workspace selected) */}
            {activeWorkspace && (
              <label
                onClick={() => setSelectedScope("active_workspace")}
                className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                  selectedScope === "active_workspace"
                    ? "bg-red-500/10 border-red-500/50 text-slate-100"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="clear_scope"
                  checked={selectedScope === "active_workspace"}
                  onChange={() => setSelectedScope("active_workspace")}
                  className="mt-0.5 text-red-500 focus:ring-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">
                      Clear "{activeWorkspace.name}" Only
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {workspaceFilesCount} files
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Deletes only documents and data assigned to {activeWorkspace.name}. Keeps your other client files intact.
                  </p>
                </div>
              </label>
            )}

            {/* Option 2: Clear All File History */}
            <label
              onClick={() => setSelectedScope("all_history")}
              className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                selectedScope === "all_history"
                  ? "bg-red-500/10 border-red-500/50 text-slate-100"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <input
                type="radio"
                name="clear_scope"
                checked={selectedScope === "all_history"}
                onChange={() => setSelectedScope("all_history")}
                className="mt-0.5 text-red-500 focus:ring-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileX2 className="w-4 h-4 text-rose-400" />
                  <span className="font-semibold text-slate-200">
                    Clear All Document Records ({totalFilesCount})
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Removes all uploaded files, parsed tables, audit reports, and chat logs across all clients. Preserves custom workspaces and templates.
                </p>
              </div>
            </label>

            {/* Option 3: Complete Factory Reset */}
            <label
              onClick={() => setSelectedScope("all_reset")}
              className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                selectedScope === "all_reset"
                  ? "bg-red-500/15 border-red-500/60 text-slate-100"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <input
                type="radio"
                name="clear_scope"
                checked={selectedScope === "all_reset"}
                onChange={() => setSelectedScope("all_reset")}
                className="mt-0.5 text-red-500 focus:ring-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FolderX className="w-4 h-4 text-red-400" />
                  <span className="font-semibold text-slate-200">
                    Total Factory Reset (Files + Custom Workspaces)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Completely wipes browser storage: all files, custom client workspaces, team folders, and custom extraction templates.
                </p>
              </div>
            </label>
          </div>

          {/* Typing confirmation if total reset */}
          {requiresTyping && (
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-red-500/30 space-y-2 animate-in fade-in duration-150">
              <span className="text-[11px] text-slate-300 font-medium block">
                Type <span className="font-mono text-red-400 font-bold">CLEAR</span> to confirm total factory wipeout:
              </span>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="CLEAR"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono tracking-widest text-center text-sm focus:outline-none focus:border-red-500"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer text-xs font-medium"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={!canProceed || confirmed}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-red-950/50 transition-all cursor-pointer text-xs"
          >
            {confirmed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Cleared Successfully!</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>
                  {selectedScope === "active_workspace"
                    ? `Clear Workspace (${workspaceFilesCount} Files)`
                    : selectedScope === "all_history"
                    ? `Clear All History (${totalFilesCount} Files)`
                    : "Wipe & Factory Reset"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
