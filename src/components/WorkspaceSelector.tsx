import React, { useState } from "react";
import { ClientWorkspace } from "../types";
import {
  Briefcase,
  Users,
  Building,
  Plus,
  ChevronDown,
  Check,
  FolderOpen,
  FolderPlus,
  Sparkles,
  X,
} from "lucide-react";

interface WorkspaceSelectorProps {
  workspaces: ClientWorkspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: (workspace: ClientWorkspace) => void;
}

export default function WorkspaceSelector({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
}: WorkspaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newType, setNewType] = useState<"client" | "team" | "personal">("client");

  const active = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    const ws: ClientWorkspace = {
      id: "ws-" + Date.now(),
      name: newWorkspaceName,
      clientName: newClientName || newWorkspaceName,
      type: newType,
      color: newType === "client" ? "#06b6d4" : newType === "team" ? "#8b5cf6" : "#10b981",
    };

    onCreateWorkspace(ws);
    onSelectWorkspace(ws.id);
    setIsModalOpen(false);
    setNewWorkspaceName("");
    setNewClientName("");
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs transition-colors cursor-pointer group"
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: active?.color || "#10b981" }}
        />
        <div className="text-left">
          <span className="text-[10px] text-slate-400 block leading-tight font-mono uppercase">
            {active?.type === "client" ? "Client Workspace" : active?.type === "team" ? "Team Folder" : "Personal"}
          </span>
          <span className="font-semibold text-slate-100 max-w-[130px] truncate block">
            {active?.name}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 ml-1 transition-transform" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1.5 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
              <span>Workspaces & Clients</span>
              <span className="text-slate-500">{workspaces.length} active</span>
            </div>

            <div className="py-1 max-h-56 overflow-y-auto space-y-1">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    onSelectWorkspace(ws.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    ws.id === activeWorkspaceId
                      ? "bg-slate-800 text-slate-100 font-semibold"
                      : "text-slate-300 hover:bg-slate-850 hover:text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: ws.color || "#10b981" }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-slate-100">{ws.name}</p>
                      {ws.clientName && ws.clientName !== ws.name && (
                        <p className="text-[10px] text-slate-400 truncate">{ws.clientName}</p>
                      )}
                    </div>
                  </div>
                  {ws.id === activeWorkspaceId && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="pt-1.5 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full py-1.5 px-2 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Client / Team Workspace</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* New Workspace Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-slate-100">Create New Workspace</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Workspace Type</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setNewType("client")}
                    className={`py-1 rounded-lg text-center font-medium cursor-pointer ${
                      newType === "client" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType("team")}
                    className={`py-1 rounded-lg text-center font-medium cursor-pointer ${
                      newType === "team" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Team
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType("personal")}
                    className={`py-1 rounded-lg text-center font-medium cursor-pointer ${
                      newType === "personal" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Personal
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Workspace / Project Name</label>
                <input
                  type="text"
                  required
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="e.g. Acme Legal Contracts or Audit 2026"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {newType === "client" && (
                <div>
                  <label className="text-slate-400 block mb-1">Client Name / Organization</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Acme Corporation Pvt Ltd"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
