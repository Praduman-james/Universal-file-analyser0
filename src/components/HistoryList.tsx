import React from "react";
import { UploadedFile } from "../types";
import { FileText, Image as ImageIcon, Video, Trash2, Clock, CheckCircle, FileSpreadsheet } from "lucide-react";

interface HistoryListProps {
  files: UploadedFile[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onDeleteFile: (id: string) => void;
  onClearAll: () => void;
}

export default function HistoryList({
  files,
  activeFileId,
  onSelectFile,
  onDeleteFile,
  onClearAll,
}: HistoryListProps) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-700/80 rounded-xl bg-slate-900/40" id="empty-history">
        <Clock className="w-8 h-8 text-slate-500 mb-2" />
        <p className="text-sm font-medium text-slate-400">No upload history</p>
        <p className="text-xs text-slate-500 mt-1">Uploaded files will appear here for easy switching.</p>
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileBadge = (file: UploadedFile) => {
    const ext = file.name.split(".").pop()?.toUpperCase() || "";
    const isExcel = file.isExcel || ext === "XLSX" || ext === "XLS" || file.type.includes("spreadsheet");
    const isPdf = file.isPdf || file.type === "application/pdf" || ext === "PDF";
    const isJpg = ext === "JPG" || ext === "JPEG" || file.type === "image/jpeg";
    const isPng = ext === "PNG" || file.type === "image/png";

    if (isExcel) {
      return {
        icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" />,
        bg: "bg-emerald-500/10",
        label: "XLSX",
      };
    }
    if (isPdf) {
      return {
        icon: <FileText className="w-4 h-4 text-rose-400" />,
        bg: "bg-rose-500/10",
        label: "PDF",
      };
    }
    if (isJpg) {
      return {
        icon: <ImageIcon className="w-4 h-4 text-amber-400" />,
        bg: "bg-amber-500/10",
        label: "JPG",
      };
    }
    if (isPng) {
      return {
        icon: <ImageIcon className="w-4 h-4 text-cyan-400" />,
        bg: "bg-cyan-500/10",
        label: "PNG",
      };
    }
    if (file.isImage) {
      return {
        icon: <ImageIcon className="w-4 h-4 text-emerald-400" />,
        bg: "bg-emerald-500/10",
        label: "IMG",
      };
    }
    if (file.isVideo) {
      return {
        icon: <Video className="w-4 h-4 text-cyan-400" />,
        bg: "bg-cyan-500/10",
        label: "VID",
      };
    }
    return {
      icon: <FileText className="w-4 h-4 text-slate-400" />,
      bg: "bg-slate-800",
      label: ext || "TXT",
    };
  };

  return (
    <div className="flex flex-col h-full" id="history-container">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-300 tracking-wider uppercase flex items-center gap-1.5 font-mono">
          <Clock className="w-3.5 h-3.5 text-emerald-500" /> Files ({files.length})
        </h3>
        <button
          onClick={onClearAll}
          className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 hover:underline cursor-pointer"
          id="btn-clear-history"
        >
          Clear All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[300px] lg:max-h-none scrollbar-thin scrollbar-thumb-slate-800" id="history-list">
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const badge = getFileBadge(file);

          return (
            <div
              key={file.id}
              className={`group flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 border cursor-pointer ${
                isActive
                  ? "bg-slate-800 border-slate-600 shadow-md shadow-emerald-950/20"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
              }`}
              onClick={() => onSelectFile(file.id)}
              id={`history-item-${file.id}`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={`p-2 rounded-lg ${badge.bg} shrink-0`}>
                  {badge.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-200 truncate group-hover:text-slate-100 transition-colors">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400 font-mono">
                    <span className="font-semibold text-slate-300">{badge.label}</span>
                    <span>•</span>
                    <span>{formatSize(file.size)}</span>
                    {file.analysis && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-emerald-400 font-medium text-[10px]">
                          <CheckCircle className="w-3 h-3 inline" /> Done
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFile(file.id);
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                aria-label="Delete history entry"
                id={`btn-delete-${file.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
