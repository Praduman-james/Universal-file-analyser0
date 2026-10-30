import React, { useState, useMemo } from "react";
import { UploadedFile } from "../types";
import {
  FileCode,
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Eye,
  Image as ImageIcon,
  Video as VideoIcon,
  Film,
  FileText,
  FolderArchive,
  BookOpen,
  Copy,
  Check,
  ShieldCheck,
  ZoomIn,
} from "lucide-react";

interface FileViewerProps {
  file: UploadedFile;
}

export default function FileViewer({ file }: FileViewerProps) {
  const [csvSearchQuery, setCsvSearchQuery] = useState("");
  const [csvPage, setCsvPage] = useState(0);
  const [videoDuration, setVideoDuration] = useState<string | null>(null);
  const [videoResolution, setVideoResolution] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<"visual" | "ocr" | "redacted">("visual");
  const [copiedOcr, setCopiedOcr] = useState(false);
  const csvRowsPerPage = 10;

  // Compute file details
  const fileExtension = useMemo(() => {
    const parts = file.name.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "TXT";
  }, [file.name]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // CSV Parsing
  const parsedCsv = useMemo(() => {
    if (file.isImage || file.isVideo || file.isPdf || !file.content) return null;
    const isCsv = file.name.endsWith(".csv") || file.type === "text/csv";
    if (!isCsv) return null;

    try {
      const lines = file.content.split(/\r?\n/);
      if (lines.length === 0 || lines[0].trim() === "") return null;

      const parseCsvLine = (line: string) => {
        const result = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            result.push(cur.trim());
            cur = "";
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const headers = parseCsvLine(lines[0]);
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === "") continue;
        const cells = parseCsvLine(lines[i]);
        while (cells.length < headers.length) cells.push("");
        rows.push(cells.slice(0, headers.length));
      }

      return { headers, rows };
    } catch (e) {
      console.error("Failed to parse CSV", e);
      return null;
    }
  }, [file.content, file.name, file.isImage, file.isVideo, file.isPdf]);

  // JSON Parsing
  const parsedJson = useMemo(() => {
    if (file.isImage || file.isVideo || file.isPdf || !file.content) return null;
    const isJson = file.name.endsWith(".json") || file.type === "application/json";
    if (!isJson) return null;

    try {
      return JSON.parse(file.content);
    } catch (e) {
      return null;
    }
  }, [file.content, file.name, file.isImage, file.isVideo, file.isPdf]);

  // Filtered CSV rows
  const filteredCsvRows = useMemo(() => {
    if (!parsedCsv) return [];
    if (!csvSearchQuery) return parsedCsv.rows;

    const query = csvSearchQuery.toLowerCase();
    return parsedCsv.rows.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(query))
    );
  }, [parsedCsv, csvSearchQuery]);

  // Paginated CSV rows
  const paginatedCsvRows = useMemo(() => {
    const start = csvPage * csvRowsPerPage;
    return filteredCsvRows.slice(start, start + csvRowsPerPage);
  }, [filteredCsvRows, csvPage]);

  const maxCsvPages = Math.ceil(filteredCsvRows.length / csvRowsPerPage);

  const copyOcrText = () => {
    if (file.analysis?.ocrText) {
      navigator.clipboard.writeText(file.analysis.ocrText);
      setCopiedOcr(true);
      setTimeout(() => setCopiedOcr(false), 2000);
    }
  };

  const renderContent = () => {
    // OCR Layer Display (if selected)
    if (activeLayer === "ocr" && file.analysis?.ocrText) {
      return (
        <div className="flex flex-col h-full space-y-3">
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold">Searchable OCR Text Layer (English + Regional)</span>
            </div>
            <button
              type="button"
              onClick={copyOcrText}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              {copiedOcr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedOcr ? "Copied" : "Copy OCR Text"}
            </button>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed max-h-[380px] overflow-y-auto whitespace-pre-wrap select-all">
            {file.analysis.ocrText}
          </div>
        </div>
      );
    }

    // Redacted Layer Display (if selected)
    if (activeLayer === "redacted" && file.redactedContent) {
      return (
        <div className="flex flex-col h-full space-y-3">
          <div className="flex items-center justify-between bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/30">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Masked / Redacted Sanitized View</span>
            </div>
            <span className="text-[10px] text-emerald-300 font-mono">PII Scrubbed</span>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed max-h-[380px] overflow-y-auto whitespace-pre-wrap select-all">
            {file.redactedContent}
          </div>
        </div>
      );
    }

    // 1. PDF DOCUMENT RENDERING
    if (file.isPdf && file.base64Data) {
      const dataUri = `data:application/pdf;base64,${file.base64Data}`;
      return (
        <div className="flex flex-col h-full space-y-2">
          <div className="relative w-full h-[420px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
            <object
              data={dataUri}
              type="application/pdf"
              className="w-full h-full rounded-xl"
            >
              <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-slate-400">
                <FileText className="w-10 h-10 text-slate-600 mb-2" />
                <p className="font-semibold text-slate-200">PDF Preview Embed</p>
                <p className="mt-1 max-w-xs">
                  Your browser can open this PDF directly or view through our OCR text layer.
                </p>
                <a
                  href={dataUri}
                  download={file.name}
                  className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium inline-block"
                >
                  Download PDF
                </a>
              </div>
            </object>
          </div>
        </div>
      );
    }

    // 2. VIDEO RENDERING
    if (file.isVideo && file.base64Data) {
      const mimeType = file.type || "video/mp4";
      return (
        <div className="flex flex-col items-center justify-center p-3 bg-slate-900/40 rounded-xl border border-slate-800" id="viewer-video">
          <div className="relative group overflow-hidden rounded-lg w-full max-h-[340px] bg-black flex items-center justify-center">
            <video
              src={`data:${mimeType};base64,${file.base64Data}`}
              controls
              playsInline
              onLoadedMetadata={(e) => {
                const vid = e.currentTarget;
                if (vid.duration && !isNaN(vid.duration)) {
                  const mins = Math.floor(vid.duration / 60);
                  const secs = Math.floor(vid.duration % 60);
                  setVideoDuration(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
                }
                if (vid.videoWidth && vid.videoHeight) {
                  setVideoResolution(`${vid.videoWidth}x${vid.videoHeight}`);
                }
              }}
              className="max-h-[340px] w-full object-contain rounded-lg shadow-2xl"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Film className="w-3.5 h-3.5 text-emerald-400" />
              Format: {fileExtension}
            </span>
            <span>•</span>
            <span>Size: {formatSize(file.size)}</span>
            {videoDuration && (
              <>
                <span>•</span>
                <span>Length: {videoDuration}</span>
              </>
            )}
            {videoResolution && (
              <>
                <span>•</span>
                <span>Res: {videoResolution}</span>
              </>
            )}
          </div>
        </div>
      );
    }

    // 3. IMAGE RENDERING
    if (file.isImage && file.base64Data) {
      const mimeType = file.type || "image/png";
      return (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-900/30 rounded-xl border border-slate-800" id="viewer-image">
          <div className="relative group overflow-hidden rounded-lg max-h-[350px] max-w-full">
            <img
              src={`data:${mimeType};base64,${file.base64Data}`}
              alt={file.name}
              referrerPolicy="no-referrer"
              className="object-contain max-h-[350px] rounded-lg shadow-xl"
            />
          </div>
          <div className="mt-4 flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>Format: {fileExtension}</span>
            <span>•</span>
            <span>Size: {formatSize(file.size)}</span>
          </div>
        </div>
      );
    }

    // 4. CSV TABLE RENDERING
    if (parsedCsv) {
      return (
        <div className="flex flex-col h-full space-y-4" id="viewer-csv">
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-slate-900/40 p-3 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search rows..."
                value={csvSearchQuery}
                onChange={(e) => {
                  setCsvSearchQuery(e.target.value);
                  setCsvPage(0);
                }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Rows: {filteredCsvRows.length} of {parsedCsv.rows.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950 max-h-[320px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 text-slate-300 font-semibold sticky top-0 border-b border-slate-800">
                <tr>
                  {parsedCsv.headers.map((header, i) => (
                    <th key={i} className="px-4 py-3 font-mono text-slate-400 uppercase tracking-wider min-w-[120px]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300">
                {paginatedCsvRows.length === 0 ? (
                  <tr>
                    <td colSpan={parsedCsv.headers.length} className="text-center py-8 text-slate-500">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  paginatedCsvRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-slate-900/40 transition-colors">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2.5 truncate max-w-xs font-mono text-slate-400 border-r border-slate-900/50">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {maxCsvPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-slate-400 font-mono">
                Page {csvPage + 1} of {maxCsvPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={csvPage === 0}
                  onClick={() => setCsvPage((p) => Math.max(0, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 transition text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={csvPage >= maxCsvPages - 1}
                  onClick={() => setCsvPage((p) => Math.min(maxCsvPages - 1, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 transition text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 5. JSON DOCUMENT RENDERING
    if (parsedJson) {
      return (
        <div className="border border-slate-800 rounded-xl bg-slate-950 p-4 font-mono text-xs overflow-auto max-h-[360px] scrollbar-thin scrollbar-thumb-slate-800" id="viewer-json">
          <pre className="text-emerald-400">
            {JSON.stringify(parsedJson, null, 2)}
          </pre>
        </div>
      );
    }

    // 6. OFFICE DOCX / PPTX / ZIP / TEXT RENDERER
    const lines = (file.content || "").split(/\r?\n/);
    const displayedLines = lines.slice(0, 1000);
    const isTruncated = lines.length > 1000;

    return (
      <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden font-mono text-xs" id="viewer-text">
        <div className="flex items-center justify-between bg-slate-900/60 px-4 py-2 border-b border-slate-800">
          <span className="text-[10px] text-slate-500 font-mono">
            Lines: {lines.length} {isTruncated && "(Showing first 1000 lines)"}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{fileExtension} Document</span>
        </div>
        <div className="overflow-y-auto max-h-[360px] p-4 scrollbar-thin scrollbar-thumb-slate-800 flex">
          {/* Line Numbers */}
          <div className="text-slate-600 select-none text-right pr-4 border-r border-slate-900 font-mono text-xs shrink-0">
            {displayedLines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          {/* Content */}
          <pre className="pl-4 text-slate-300 overflow-x-auto whitespace-pre-wrap font-sans text-xs flex-1 leading-relaxed">
            {displayedLines.join("\n")}
            {isTruncated && "\n... [Remaining content hidden in reader view] ..."}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-2xl border border-slate-800/80 p-5" id={`viewer-${file.id}`}>
      {/* Viewer Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/60 pb-3 mb-4 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            {file.isVideo ? (
              <VideoIcon className="w-4 h-4" />
            ) : file.isImage ? (
              <ImageIcon className="w-4 h-4" />
            ) : file.isPdf ? (
              <FileText className="w-4 h-4 text-red-400" />
            ) : file.isZip ? (
              <FolderArchive className="w-4 h-4 text-amber-400" />
            ) : (
              <FileCode className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-100 truncate flex items-center gap-1.5">
              {file.name}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {formatSize(file.size)} • {file.type || "Document"}
            </p>
          </div>
        </div>

        {/* Layer View Switcher (Visual vs OCR vs Redacted) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveLayer("visual")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeLayer === "visual"
                ? "bg-slate-800 text-white font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Visual Preview
          </button>

          {file.analysis?.ocrText && (
            <button
              type="button"
              onClick={() => setActiveLayer("ocr")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeLayer === "ocr"
                  ? "bg-emerald-600 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              OCR Layer
            </button>
          )}

          {file.redactedContent && (
            <button
              type="button"
              onClick={() => setActiveLayer("redacted")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeLayer === "redacted"
                  ? "bg-emerald-600 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Redacted
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {renderContent()}
      </div>
    </div>
  );
}
