import React, { useState } from "react";
import { TeamFolder, UploadedFile } from "../types";
import {
  Users2,
  X,
  Plus,
  FolderPlus,
  Shield,
  Check,
  Trash2,
  FolderOpen,
  ArrowRight,
  MoveRight,
} from "lucide-react";

interface TeamFoldersModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamFolders: TeamFolder[];
  activeFile?: UploadedFile;
  onSelectTeamFolder: (folderId: string | null) => void;
  onCreateTeamFolder: (folder: TeamFolder) => void;
  onAssignFileToTeamFolder: (fileId: string, folderId: string | undefined) => void;
  onDeleteTeamFolder: (folderId: string) => void;
}

export default function TeamFoldersModal({
  isOpen,
  onClose,
  teamFolders,
  activeFile,
  onSelectTeamFolder,
  onCreateTeamFolder,
  onAssignFileToTeamFolder,
  onDeleteTeamFolder,
}: TeamFoldersModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [teamName, setTeamName] = useState("Legal & Compliance");
  const [permission, setPermission] = useState<"Admin" | "Editor" | "Viewer">("Editor");
  const [membersInput, setMembersInput] = useState("legal@company.com, audit@company.com");
  const [folderColor, setFolderColor] = useState("#8b5cf6");

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!folderName.trim()) return;
    const members = membersInput
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

    const newFolder: TeamFolder = {
      id: `team-folder-${Date.now()}`,
      name: folderName.trim(),
      team: teamName,
      permission,
      members: members.length > 0 ? members : ["team@company.com"],
      color: folderColor,
    };

    onCreateTeamFolder(newFolder);
    setFolderName("");
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Team Folders & Role Permissions
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  RBAC Enabled
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Collaborative departmental folders with member access controls and file routing
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
          {/* Active file quick assignment banner */}
          {activeFile && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Active File:</span>
                <span className="font-semibold text-slate-200">{activeFile.name}</span>
                <span className="text-[10px] text-purple-400 block font-mono">
                  Current Folder: {teamFolders.find((f) => f.id === activeFile.teamFolderId)?.name || "Unassigned"}
                </span>
              </div>
              {activeFile.teamFolderId && (
                <button
                  type="button"
                  onClick={() => onAssignFileToTeamFolder(activeFile.id, undefined)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                >
                  Unassign
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Departmental Team Folders ({teamFolders.length})
            </span>
            <button
              type="button"
              onClick={() => setIsCreating(!isCreating)}
              className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreating ? "Cancel" : "New Team Folder"}</span>
            </button>
          </div>

          {/* Create new team folder form */}
          {isCreating && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-150">
              <h4 className="font-semibold text-slate-200">Create New Team Folder</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Folder Name</label>
                  <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="e.g. Master Services & NDAs"
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Assigned Department</label>
                  <select
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
                  >
                    <option value="Legal & Compliance">Legal & Compliance</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="HR & Operations">HR & Operations</option>
                    <option value="Auditing & Risk">Auditing & Risk</option>
                    <option value="Executive Management">Executive Management</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Access Role Permission</label>
                  <select
                    value={permission}
                    onChange={(e) => setPermission(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
                  >
                    <option value="Admin">Admin (Full Control)</option>
                    <option value="Editor">Editor (Upload & Analyze)</option>
                    <option value="Viewer">Viewer (Read-only)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Member Emails (comma-separated)</label>
                  <input
                    type="text"
                    value={membersInput}
                    onChange={(e) => setMembersInput(e.target.value)}
                    placeholder="user1@org.com, user2@org.com"
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!folderName.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Save Team Folder
                </button>
              </div>
            </div>
          )}

          {/* List of Team Folders */}
          <div className="space-y-2">
            {teamFolders.map((tf) => {
              const isAssigned = activeFile?.teamFolderId === tf.id;

              return (
                <div
                  key={tf.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isAssigned
                      ? "bg-purple-500/15 border-purple-500/50 text-slate-100 shadow-md"
                      : "bg-slate-950/60 border-slate-850 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm"
                      style={{ backgroundColor: tf.color || "#8b5cf6" }}
                    >
                      <FolderOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 text-sm">{tf.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-purple-300 border border-purple-500/30 font-mono">
                          {tf.team}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-emerald-400" /> {tf.permission} Access
                        </span>
                        <span>•</span>
                        <span>{tf.members.length} members</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeFile && (
                      <button
                        type="button"
                        onClick={() => {
                          onAssignFileToTeamFolder(activeFile.id, tf.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-colors cursor-pointer text-xs ${
                          isAssigned
                            ? "bg-purple-600 text-white"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                        }`}
                      >
                        {isAssigned ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Assigned</span>
                          </>
                        ) : (
                          <>
                            <MoveRight className="w-3.5 h-3.5 text-purple-400" />
                            <span>Move File Here</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteTeamFolder(tf.id)}
                      className="text-slate-600 hover:text-red-400 p-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
