import React, { useState } from "react";
import { UploadedFile, Folder } from "../types";
import {
  FileText,
  Image,
  Video,
  Trash2,
  Clock,
  CheckCircle,
  Folder as FolderIcon,
  Plus,
  Star,
  Edit2,
  Check,
  Search,
  Tag,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface HistoryListProps {
  files: UploadedFile[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onDeleteFile: (id: string) => void;
  onClearAll: () => void;
  onRenameFile: (id: string, newName: string) => void;
  onMoveFile: (id: string, folderId: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddTag: (id: string, tag: string) => void;
}

const DEFAULT_FOLDERS: Folder[] = [
  { id: "all", name: "All Documents" },
  { id: "contracts", name: "Contracts" },
  { id: "invoices", name: "Invoices & Bills" },
  { id: "resumes", name: "Resumes & HR" },
  { id: "legal", name: "Legal Notices" },
  { id: "media", name: "Media & Scans" },
];

export type FileTypeFilter = "all" | "documents" | "images" | "videos";

export default function HistoryList({
  files,
  activeFileId,
  onSelectFile,
  onDeleteFile,
  onClearAll,
  onRenameFile,
  onMoveFile,
  onToggleFavorite,
  onAddTag,
}: HistoryListProps) {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<FileTypeFilter>("all");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [newNameInput, setNewNameInput] = useState<string>("");
  const [tagInputFileId, setTagInputFileId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState<string>("");

  // Category counts
  const docCount = files.filter((f) => !f.isImage && !f.isVideo).length;
  const imageCount = files.filter((f) => f.isImage).length;
  const videoCount = files.filter((f) => f.isVideo).length;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Filter files by Type + Folder + Search
  const filteredFiles = files.filter((f) => {
    // 1. File Type category filter
    if (selectedTypeFilter === "documents" && (f.isImage || f.isVideo)) return false;
    if (selectedTypeFilter === "images" && !f.isImage) return false;
    if (selectedTypeFilter === "videos" && !f.isVideo) return false;

    // 2. Folder check
    if (selectedFolderId !== "all") {
      if (selectedFolderId === "media" && !f.isVideo && !f.isImage) return false;
      if (selectedFolderId !== "media" && f.folderId !== selectedFolderId) {
        // heuristic auto-categorize if no explicit folder
        const ext = f.name.toLowerCase();
        if (selectedFolderId === "contracts" && !ext.includes("contract") && !ext.includes("agreement")) return false;
        if (selectedFolderId === "invoices" && !ext.includes("invoice") && !ext.includes("bill") && !ext.includes("receipt")) return false;
        if (selectedFolderId === "resumes" && !ext.includes("resume") && !ext.includes("cv")) return false;
        if (selectedFolderId === "legal" && !ext.includes("legal") && !ext.includes("notice")) return false;
      }
    }

    // 3. Search check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.name.toLowerCase().includes(q);
      const matchTag = (f.tags || []).some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchTag) return false;
    }

    return true;
  });

  const handleStartRename = (file: UploadedFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFileId(file.id);
    setNewNameInput(file.name);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (newNameInput.trim()) {
      onRenameFile(id, newNameInput.trim());
    }
    setEditingFileId(null);
  };

  const handleAddTagSubmit = (id: string, e: React.KeyboardEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (newTagInput.trim()) {
      onAddTag(id, newTagInput.trim());
      setNewTagInput("");
      setTagInputFileId(null);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3" id="history-container">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 tracking-wider uppercase flex items-center gap-1.5 font-mono">
          <FolderIcon className="w-3.5 h-3.5 text-emerald-500" /> Workspace Files ({files.length})
        </h3>
        {files.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] text-red-400 hover:text-red-300 transition-colors cursor-pointer hover:underline flex items-center gap-1 font-medium bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2 py-0.5 rounded-lg"
            id="btn-clear-history"
            title="Clear workspace or history files"
          >
            <Trash2 className="w-3 h-3 text-red-400" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter files or tags..."
          className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {/* File Type Filter Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/90 border border-slate-800/80 rounded-xl">
        <button
          type="button"
          onClick={() => setSelectedTypeFilter("all")}
          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            selectedTypeFilter === "all"
              ? "bg-slate-800 text-slate-100 shadow-sm border border-slate-700 font-semibold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
          title="Show all files"
        >
          <span>All</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono leading-none ${
              selectedTypeFilter === "all"
                ? "bg-slate-700 text-slate-200"
                : "bg-slate-900 text-slate-500"
            }`}
          >
            {files.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTypeFilter("documents")}
          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            selectedTypeFilter === "documents"
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
          title="Show Documents (PDF, Word, Excel, Text, etc.)"
        >
          <FileText className="w-3 h-3 shrink-0" />
          <span className="truncate">Docs</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono leading-none ${
              selectedTypeFilter === "documents"
                ? "bg-indigo-500/30 text-indigo-200"
                : "bg-slate-900 text-slate-500"
            }`}
          >
            {docCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTypeFilter("images")}
          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            selectedTypeFilter === "images"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
          title="Show Images (JPG, PNG, WebP)"
        >
          <Image className="w-3 h-3 shrink-0" />
          <span className="truncate">Images</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono leading-none ${
              selectedTypeFilter === "images"
                ? "bg-amber-500/30 text-amber-200"
                : "bg-slate-900 text-slate-500"
            }`}
          >
            {imageCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTypeFilter("videos")}
          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            selectedTypeFilter === "videos"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
          title="Show Videos (MP4, WebM)"
        >
          <Video className="w-3 h-3 shrink-0" />
          <span className="truncate">Videos</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono leading-none ${
              selectedTypeFilter === "videos"
                ? "bg-rose-500/30 text-rose-200"
                : "bg-slate-900 text-slate-500"
            }`}
          >
            {videoCount}
          </span>
        </button>
      </div>

      {/* Folder Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        {DEFAULT_FOLDERS.map((folder) => (
          <button
            key={folder.id}
            type="button"
            onClick={() => setSelectedFolderId(folder.id)}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              selectedFolderId === folder.id
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium"
                : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
            }`}
          >
            {folder.name}
          </button>
        ))}
      </div>

      {/* File List */}
      <div
        className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px] lg:max-h-none scrollbar-thin scrollbar-thumb-slate-800"
        id="history-list"
      >
        {filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/60 p-4 space-y-2">
            <p className="text-slate-400">
              {selectedTypeFilter !== "all"
                ? `No ${selectedTypeFilter} found in this category.`
                : selectedFolderId !== "all"
                ? `No files in "${DEFAULT_FOLDERS.find((f) => f.id === selectedFolderId)?.name}"`
                : "No files match your search criteria."}
            </p>
            {(selectedTypeFilter !== "all" || selectedFolderId !== "all" || searchQuery.trim()) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTypeFilter("all");
                  setSelectedFolderId("all");
                  setSearchQuery("");
                }}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              >
                Reset filters & show all
              </button>
            )}
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isActive = file.id === activeFileId;
            const isEditing = editingFileId === file.id;

            return (
              <div
                key={file.id}
                className={`group relative flex flex-col p-3 rounded-xl transition-all duration-200 border cursor-pointer ${
                  isActive
                    ? "bg-slate-800 border-slate-600 shadow-md shadow-emerald-950/20"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                }`}
                onClick={() => onSelectFile(file.id)}
                id={`history-item-${file.id}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {file.isVideo ? (
                        <Video className="w-4 h-4" />
                      ) : file.isImage ? (
                        <Image className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={newNameInput}
                            onChange={(e) => setNewNameInput(e.target.value)}
                            className="bg-slate-950 border border-emerald-500 text-slate-200 text-xs rounded px-1.5 py-0.5 w-full font-mono"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={(e) => handleSaveRename(file.id, e)}
                            className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-slate-100 transition-colors">
                          {file.name}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>{formatSize(file.size)}</span>
                        <span>•</span>
                        {file.analysis ? (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle className="w-2.5 h-2.5" /> Ready
                          </span>
                        ) : (
                          <span className="text-amber-400">Processing...</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(file.id);
                      }}
                      className={`p-1 rounded hover:bg-slate-700 ${
                        file.isFavorite ? "text-amber-400" : "text-slate-400 hover:text-amber-300"
                      }`}
                      title="Mark as Favorite"
                    >
                      <Star className="w-3.5 h-3.5" fill={file.isFavorite ? "currentColor" : "none"} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleStartRename(file, e)}
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(file.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Tags and Folder pill */}
                <div className="flex flex-wrap items-center gap-1 mt-2">
                  {/* Move to folder quick select */}
                  <select
                    value={file.folderId || "all"}
                    onChange={(e) => {
                      e.stopPropagation();
                      onMoveFile(file.id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-950 border border-slate-800 text-[10px] text-slate-400 rounded px-1 py-0.5 focus:outline-none"
                  >
                    <option value="contracts">Contracts</option>
                    <option value="invoices">Invoices</option>
                    <option value="resumes">Resumes</option>
                    <option value="legal">Legal</option>
                    <option value="other">General</option>
                  </select>

                  {/* Custom Tags */}
                  {(file.tags || []).map((t, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-mono text-slate-300 border border-slate-700"
                    >
                      #{t}
                    </span>
                  ))}

                  {/* Add Tag prompt */}
                  {tagInputFileId === file.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddTagSubmit(file.id, e)}
                        placeholder="tag..."
                        className="bg-slate-950 border border-slate-700 text-[10px] text-slate-200 rounded px-1 py-0.5 w-16"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={(e) => handleAddTagSubmit(file.id, e)}
                        className="text-emerald-400 hover:underline text-[10px]"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTagInputFileId(file.id);
                      }}
                      className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" /> Tag
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
