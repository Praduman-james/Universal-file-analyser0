import React, { useState, useRef } from "react";
import { Upload, FileText, Image, Video, AlertCircle, RefreshCw, Camera, GitCompare, Layers, ShieldCheck, Lock, Globe } from "lucide-react";
import { AnalysisMode, LanguageOption } from "../types";
import { parseDocx, parsePptx, parseSpreadsheet, parseZipArchive, auditFileHealth, detectLocalPii } from "../utils/fileParsers";

interface FileUploaderProps {
  onFileLoaded: (fileData: {
    name: string;
    size: number;
    type: string;
    content: string;
    base64Data?: string;
    isImage: boolean;
    isVideo: boolean;
    isPdf?: boolean;
    isOffice?: boolean;
    isZip?: boolean;
    pageCount?: number;
    docMode: AnalysisMode;
    language: LanguageOption;
  }) => void;
  isAnalyzing: boolean;
  selectedDocMode: AnalysisMode;
  onDocModeChange: (mode: AnalysisMode) => void;
  selectedLanguage: LanguageOption;
  onLanguageChange: (lang: LanguageOption) => void;
  isPrivateMode: boolean;
  onTogglePrivateMode: () => void;
  onOpenScanner: () => void;
  onOpenPdfTools: () => void;
  onOpenComparison: () => void;
  existingFiles: { id: string; name: string; size: number }[];
}

export default function FileUploader({
  onFileLoaded,
  isAnalyzing,
  selectedDocMode,
  onDocModeChange,
  selectedLanguage,
  onLanguageChange,
  isPrivateMode,
  onTogglePrivateMode,
  onOpenScanner,
  onOpenPdfTools,
  onOpenComparison,
  existingFiles,
}: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsingStatus, setParsingStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isAnalyzing) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processFile = async (file: File) => {
    setError(null);
    setParsingStatus(null);

    // Limit maximum file size to 35MB for inline video/document analysis
    const maxSizeBytes = 35 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError("File is too large. Please upload a file smaller than 35MB.");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isPdf = file.type === "application/pdf" || ext === "pdf";
    const isDocx = ext === "docx" || file.type.includes("wordprocessingml");
    const isPptx = ext === "pptx" || file.type.includes("presentationml");
    const isSpreadsheet = ["xlsx", "xls", "csv"].includes(ext) || file.type.includes("spreadsheetml");
    const isZip = ext === "zip" || file.type.includes("zip");
    const isImage = file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "svg", "bmp"].includes(ext);
    const isVideo = file.type.startsWith("video/") || ["mp4", "webm", "mov", "avi", "mkv", "m4v"].includes(ext);

    try {
      // 1. PDF HANDLING
      if (isPdf) {
        setParsingStatus("Loading PDF document stream...");
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const base64Data = result.split(",")[1];
          onFileLoaded({
            name: file.name,
            size: file.size,
            type: "application/pdf",
            content: `[Binary PDF Document: ${file.name}]`,
            base64Data,
            isImage: false,
            isVideo: false,
            isPdf: true,
            docMode: selectedDocMode,
            language: selectedLanguage,
          });
        };
        reader.onerror = () => setError("Failed to read PDF document.");
        reader.readAsDataURL(file);
        return;
      }

      // 2. DOCX HANDLING
      if (isDocx) {
        setParsingStatus("Extracting paragraphs and tables from DOCX...");
        const text = await parseDocx(file);
        onFileLoaded({
          name: file.name,
          size: file.size,
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          content: text,
          isImage: false,
          isVideo: false,
          isOffice: true,
          docMode: selectedDocMode,
          language: selectedLanguage,
        });
        return;
      }

      // 3. PPTX HANDLING
      if (isPptx) {
        setParsingStatus("Extracting slides from PowerPoint presentation...");
        const text = await parsePptx(file);
        onFileLoaded({
          name: file.name,
          size: file.size,
          type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          content: text,
          isImage: false,
          isVideo: false,
          isOffice: true,
          docMode: selectedDocMode,
          language: selectedLanguage,
        });
        return;
      }

      // 4. SPREADSHEET (XLSX, XLS, CSV)
      if (isSpreadsheet && ext !== "csv") {
        setParsingStatus("Parsing Excel sheets and formulas...");
        const { textSummary, firstSheetCsv } = await parseSpreadsheet(file);
        onFileLoaded({
          name: file.name,
          size: file.size,
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          content: firstSheetCsv || textSummary,
          isImage: false,
          isVideo: false,
          isOffice: true,
          docMode: selectedDocMode,
          language: selectedLanguage,
        });
        return;
      }

      // 5. ZIP ARCHIVE
      if (isZip) {
        setParsingStatus("Extracting directory tree and contents...");
        const { treeSummary } = await parseZipArchive(file);
        onFileLoaded({
          name: file.name,
          size: file.size,
          type: "application/zip",
          content: treeSummary,
          isImage: false,
          isVideo: false,
          isZip: true,
          docMode: selectedDocMode,
          language: selectedLanguage,
        });
        return;
      }

      // 6. VIDEO HANDLING
      if (isVideo) {
        setParsingStatus("Processing video stream...");
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const base64Data = result.split(",")[1];
          onFileLoaded({
            name: file.name,
            size: file.size,
            type: file.type || "video/mp4",
            content: "",
            base64Data,
            isImage: false,
            isVideo: true,
            docMode: selectedDocMode,
            language: selectedLanguage,
          });
        };
        reader.onerror = () => setError("Failed to read the video file.");
        reader.readAsDataURL(file);
        return;
      }

      // 7. IMAGE HANDLING
      if (isImage) {
        setParsingStatus("Encoding image for high-resolution OCR...");
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const base64Data = result.split(",")[1];
          onFileLoaded({
            name: file.name,
            size: file.size,
            type: file.type || "image/png",
            content: "",
            base64Data,
            isImage: true,
            isVideo: false,
            docMode: selectedDocMode,
            language: selectedLanguage,
          });
        };
        reader.onerror = () => setError("Failed to read the image file.");
        reader.readAsDataURL(file);
        return;
      }

      // 8. TEXT, CSV, JSON, CODE
      setParsingStatus("Reading textual data...");
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileLoaded({
          name: file.name,
          size: file.size,
          type: file.type || "text/plain",
          content,
          isImage: false,
          isVideo: false,
          docMode: selectedDocMode,
          language: selectedLanguage,
        });
      };
      reader.onerror = () => setError("Failed to read the text file.");
      reader.readAsText(file);
    } catch (err: any) {
      console.error("File processing error", err);
      setError(err.message || "Failed to process file format.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isAnalyzing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    if (!isAnalyzing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full space-y-3" id="uploader-container">
      {/* Control Bar: Mode, Language & Privacy */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/90 border border-slate-800 p-2.5 px-3.5 rounded-2xl text-xs">
        {/* Document Analysis Mode */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Mode:</span>
          <select
            value={selectedDocMode}
            onChange={(e) => onDocModeChange(e.target.value as AnalysisMode)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="auto">⚡ Auto Detect</option>
            <option value="contract">📜 Contract & Agreement</option>
            <option value="invoice">🧾 GST / Tax Invoice</option>
            <option value="receipt">🏷️ Expense Receipt</option>
            <option value="resume">💼 Resume / CV</option>
            <option value="bank_statement">🏦 Bank Statement</option>
            <option value="legal_notice">⚖️ Legal Notice</option>
            <option value="general">📄 General Document</option>
          </select>
        </div>

        {/* Language Selection */}
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value as LanguageOption)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="en">English (US/UK)</option>
            <option value="hi">हिंदी (Hindi Devanagari)</option>
            <option value="hinglish">Hinglish (Hindi+English)</option>
            <option value="regional">Regional OCR (मराठी, தமிழ், etc.)</option>
          </select>
        </div>

        {/* Quick Tools & Offline Mode */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={onOpenScanner}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Scan physical bill, invoice or ID card using your camera"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Camera</span>
          </button>

          <button
            type="button"
            onClick={onOpenPdfTools}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="PDF Merge, Split, Rotate & Compress"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>PDF Suite</span>
          </button>

          <button
            type="button"
            onClick={onOpenComparison}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Side-by-side comparison of 2 documents"
          >
            <GitCompare className="w-3.5 h-3.5 text-amber-400" />
            <span>Compare</span>
          </button>

          <button
            type="button"
            onClick={onTogglePrivateMode}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isPrivateMode
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title="Private Mode masks personal identifiers before processing"
          >
            {isPrivateMode ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>{isPrivateMode ? "Private Mode: ON" : "Private"}</span>
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        className={`relative flex flex-col items-center justify-center p-6 lg:p-7 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
          isAnalyzing
            ? "bg-slate-900/30 border-slate-800 cursor-not-allowed opacity-75"
            : isDragOver
            ? "border-emerald-400 bg-emerald-950/20 shadow-lg shadow-emerald-500/10"
            : "border-slate-700 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/60"
        }`}
        id="uploader-drop-zone"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf,.pdf,.docx,.xlsx,.xls,.pptx,.zip,image/*,video/*,text/*,application/json,text/csv,text/markdown"
          className="hidden"
          disabled={isAnalyzing}
          id="file-input-element"
        />

        {isAnalyzing ? (
          <div className="flex flex-col items-center text-center py-2" id="uploader-analyzing">
            <RefreshCw className="w-9 h-9 text-emerald-400 animate-spin mb-2.5" />
            <p className="text-sm font-semibold text-slate-100">
              {parsingStatus || "Analyzing document with Gemini AI..."}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Performing OCR, exact clause citations, table extraction, PII audit, and summary synthesis.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-slate-800/80 text-emerald-400 rounded-2xl mb-2.5 border border-slate-700 shadow-inner">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-100">
              Drag & drop any file here, or <span className="text-emerald-400 hover:underline">browse files</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-md leading-relaxed">
              Supports <strong className="text-slate-200 font-medium">PDF</strong>, <strong className="text-slate-200 font-medium">DOCX</strong>, <strong className="text-slate-200 font-medium">XLSX</strong>, <strong className="text-slate-200 font-medium">PPTX</strong>, <strong className="text-slate-200 font-medium">ZIP</strong>, <strong className="text-slate-200 font-medium">JPG/PNG</strong>, <strong className="text-slate-200 font-medium">MP4</strong>, <strong className="text-slate-200 font-medium">CSV</strong> & <strong className="text-slate-200 font-medium">JSON</strong>. Max 35MB.
            </p>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-[10px] text-slate-400">
              <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-red-400 font-mono">
                PDF & OCR
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-blue-400 font-mono">
                DOCX / XLSX / PPTX
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 font-mono">
                Hindi / Regional OCR
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-amber-400 font-mono">
                Auto Citations
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 font-mono">
                Table to CSV
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute bottom-2 left-3 right-3 flex items-center gap-2 p-2 bg-red-500/15 border border-red-500/30 rounded-xl text-red-200 text-xs" id="uploader-error">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
