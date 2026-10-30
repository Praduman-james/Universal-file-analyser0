import React, { useState } from "react";
import { ClientWorkspace, UploadedFile } from "../types";
import {
  Building2,
  X,
  Plus,
  Check,
  FolderOpen,
  Briefcase,
  Users,
  FileText,
  DollarSign,
  Trash2,
} from "lucide-react";

interface ClientWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: ClientWorkspace[];
  activeWorkspaceId: string | null;
  onSelectWorkspace: (id: string | null) => void;
  onCreateWorkspace: (workspace: ClientWorkspace) => void;
  onDeleteWorkspace: (id: string) => void;
  onOpenClearModal?: () => void;
  files: UploadedFile[];
}

export default function ClientWorkspaceModal({
  isOpen,
  onClose,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  onOpenClearModal,
  files,
}: ClientWorkspaceModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [clientCode, setClientCode] = useState("");
  const [industry, setIndustry] = useState("Enterprise Tech");
  const [color, setColor] = useState("#3b82f6");

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!name.trim()) return;
    const newWs: ClientWorkspace = {
      id: `client-${Date.now()}`,
      name: name.trim(),
      clientCode: clientCode.trim() || name.slice(0, 3).toUpperCase() + "-01",
      industry,
      color,
      createdAt: new Date().toISOString(),
    };
    onCreateWorkspace(newWs);
    onSelectWorkspace(newWs.id);
    setName("");
    setClientCode("");
    setIsCreating(false);
  };

  const getClientFileCount = (wsId: string | null) => {
    if (!wsId) return files.length;
    return files.filter((f) => f.clientWorkspaceId === wsId).length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Client-Wise Workspaces
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                  Multi-Tenant Partition
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Segment contracts, invoices, and folders cleanly by enterprise client or department
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Global / All Clients Tile */}
          <div
            onClick={() => {
              onSelectWorkspace(null);
              onClose();
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              activeWorkspaceId === null
                ? "bg-blue-500/15 border-blue-500/50 text-slate-100 shadow-md"
                : "bg-slate-950/60 border-slate-850 text-slate-300 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block">All Documents & Workspaces</span>
                <span className="text-slate-500 text-[11px]">Unfiltered aggregate overview</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-850 text-slate-300">
                {files.length} total files
              </span>
              {activeWorkspaceId === null && <Check className="w-5 h-5 text-blue-400" />}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Client Partitions ({workspaces.length})
            </span>
            <div className="flex items-center gap-3">
              {onOpenClearModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenClearModal();
                  }}
                  className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 cursor-pointer hover:underline text-[11px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Options</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCreating(!isCreating)}
                className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isCreating ? "Cancel" : "Add Client"}</span>
              </button>
            </div>
          </div>

          {/* Create new client form */}
          {isCreating && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-150">
              <h4 className="font-semibold text-slate-200">Register New Client Workspace</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Client / Company Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tata Consultancy Services"
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Client Code</label>
                  <input
                    type="text"
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value)}
                    placeholder="e.g. TCS-IN"
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
                  >
                    <option value="Enterprise Tech">Enterprise Tech</option>
                    <option value="Manufacturing & Auto">Manufacturing & Auto</option>
                    <option value="BFSI & Banking">BFSI & Banking</option>
                    <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                    <option value="Retail & FMCG">Retail & FMCG</option>
                    <option value="Legal & Advisory">Legal & Advisory</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Theme Accent Color</label>
                  <div className="flex items-center gap-2 pt-1">
                    {["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          color === c ? "scale-125 ring-2 ring-white" : ""
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Save Workspace
                </button>
              </div>
            </div>
          )}

          {/* List of Client Workspaces */}
          <div className="space-y-2">
            {workspaces.map((ws) => {
              const fileCount = getClientFileCount(ws.id);
              const isSelected = activeWorkspaceId === ws.id;

              return (
                <div
                  key={ws.id}
                  onClick={() => {
                    onSelectWorkspace(ws.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-blue-500/15 border-blue-500/50 text-slate-100 shadow-md"
                      : "bg-slate-950/60 border-slate-850 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm"
                      style={{ backgroundColor: ws.color || "#3b82f6" }}
                    >
                      {ws.clientCode?.slice(0, 3) || ws.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 text-sm">{ws.name}</span>
                        {ws.clientCode && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {ws.clientCode}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">{ws.industry || "General"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-850 text-slate-300">
                      {fileCount} files
                    </span>
                    {isSelected && <Check className="w-5 h-5 text-blue-400" />}
                    {workspaces.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteWorkspace(ws.id);
                        }}
                        className="text-slate-600 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
