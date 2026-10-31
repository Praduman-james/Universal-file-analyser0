import React, { useState, useRef } from "react";
import { Upload, FileText, Image as ImageIcon, Video, AlertCircle, RefreshCw, Sparkles, FileSpreadsheet, Table } from "lucide-react";
import * as XLSX from "xlsx";
import { getSamplePdfBase64, generateSamplePng, generateSampleJpg, generateSampleExcel } from "../utils/sampleFiles";
import { ExcelSheetData } from "../types";

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
    isExcel?: boolean;
    excelSheets?: ExcelSheetData[];
    imageDimensions?: { width: number; height: number };
  }) => void;
  isAnalyzing: boolean;
}

export default function FileUploader({ onFileLoaded, isAnalyzing }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const processFile = (file: File) => {
    setError(null);

    // Limit maximum file size to 45MB
    const maxSizeBytes = 45 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError("File is too large. Please upload a file smaller than 45MB.");
      return;
    }

    const isExcel =
      /\.(xlsx|xls)$/i.test(file.name) ||
      file.type.includes("spreadsheet") ||
      file.type.includes("excel") ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel";
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|svg|bmp)$/i.test(file.name);
    const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|avi|mkv|m4v|ogv)$/i.test(file.name);

    const reader = new FileReader();

    if (isExcel) {
      // 1. EXCEL WORKBOOK INGESTION (.xlsx, .xls)
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
          const sheets: ExcelSheetData[] = [];
          let contentString = `EXCEL WORKBOOK: "${file.name}"\nTotal Sheets: ${wb.SheetNames.length}\n\n`;

          wb.SheetNames.forEach((name) => {
            const ws = wb.Sheets[name];
            const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
            if (data && data.length > 0) {
              const headers = (data[0] || []).map((h: any, idx: number) => String(h || `Column ${idx + 1}`).trim());
              const rows = data.slice(1);
              sheets.push({
                name,
                headers,
                rows,
                rowCount: rows.length,
                colCount: headers.length,
              });

              contentString += `### SHEET: "${name}" (${rows.length} rows, ${headers.length} columns)\n`;
              contentString += headers.join(" | ") + "\n";
              contentString += headers.map(() => "---").join(" | ") + "\n";
              // Append up to 150 rows per sheet for AI context
              rows.slice(0, 150).forEach((r) => {
                const rowCells = headers.map((_, colIdx) => String(r[colIdx] ?? ""));
                contentString += rowCells.join(" | ") + "\n";
              });
              if (rows.length > 150) {
                contentString += `... [${rows.length - 150} additional rows in sheet "${name}"] ...\n`;
              }
              contentString += "\n";
            }
          });

          const base64Data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });

          onFileLoaded({
            name: file.name,
            size: file.size,
            type: file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            content: contentString,
            base64Data,
            isImage: false,
            isVideo: false,
            isPdf: false,
            isExcel: true,
            excelSheets: sheets,
          });
        } catch (err: any) {
          console.error("Excel parse error:", err);
          setError("Failed to parse Excel workbook. Please verify the file is not corrupted.");
        }
      };
      reader.onerror = () => {
        setError("Failed to read the Excel file.");
      };
      reader.readAsArrayBuffer(file);

    } else if (isPdf) {
      // 2. PDF File Ingestion
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64Data = result.split(",")[1];
        onFileLoaded({
          name: file.name,
          size: file.size,
          type: "application/pdf",
          content: "",
          base64Data,
          isImage: false,
          isVideo: false,
          isPdf: true,
          isExcel: false,
        });
      };
      reader.onerror = () => {
        setError("Failed to read the PDF document.");
      };
      reader.readAsDataURL(file);

    } else if (isImage) {
      // 3. JPG / PNG / Image Ingestion
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64Data = result.split(",")[1];

        const img = new Image();
        img.onload = () => {
          onFileLoaded({
            name: file.name,
            size: file.size,
            type: file.type || (file.name.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg"),
            content: "",
            base64Data,
            isImage: true,
            isVideo: false,
            isPdf: false,
            isExcel: false,
            imageDimensions: { width: img.naturalWidth, height: img.naturalHeight },
          });
        };
        img.onerror = () => {
          onFileLoaded({
            name: file.name,
            size: file.size,
            type: file.type || "image/jpeg",
            content: "",
            base64Data,
            isImage: true,
            isVideo: false,
            isPdf: false,
            isExcel: false,
          });
        };
        img.src = result;
      };
      reader.onerror = () => {
        setError("Failed to read the image file.");
      };
      reader.readAsDataURL(file);

    } else if (isVideo) {
      // 4. Video Ingestion
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
          isPdf: false,
          isExcel: false,
        });
      };
      reader.onerror = () => {
        setError("Failed to read the video file.");
      };
      reader.readAsDataURL(file);

    } else {
      // 5. Text / CSV / Code / Markdown
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileLoaded({
          name: file.name,
          size: file.size,
          type: file.type || "text/plain",
          content,
          isImage: false,
          isVideo: false,
          isPdf: false,
          isExcel: false,
        });
      };
      reader.onerror = () => {
        setError("Failed to read the text file.");
      };
      reader.readAsText(file);
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

  // Quick sample loaders
  const loadSampleExcel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnalyzing) return;
    const { base64Data, sheets, contentString } = generateSampleExcel();
    onFileLoaded({
      name: "Q3_Financial_Sales_Model.xlsx",
      size: 18450,
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      content: contentString,
      base64Data,
      isImage: false,
      isVideo: false,
      isPdf: false,
      isExcel: true,
      excelSheets: sheets,
    });
  };

  const loadSamplePdf = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnalyzing) return;
    const base64Data = getSamplePdfBase64();
    onFileLoaded({
      name: "Invoice_Q3_Performance.pdf",
      size: 1420,
      type: "application/pdf",
      content: "",
      base64Data,
      isImage: false,
      isVideo: false,
      isPdf: true,
      isExcel: false,
    });
  };

  const loadSampleJpg = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnalyzing) return;
    const { base64Data, width, height } = generateSampleJpg();
    onFileLoaded({
      name: "Golden_Hour_Horizon.jpg",
      size: 92400,
      type: "image/jpeg",
      content: "",
      base64Data,
      isImage: true,
      isVideo: false,
      isPdf: false,
      isExcel: false,
      imageDimensions: { width, height },
    });
  };

  const loadSamplePng = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnalyzing) return;
    const { base64Data, width, height } = generateSamplePng();
    onFileLoaded({
      name: "Architecture_Design_Spec.png",
      size: 64200,
      type: "image/png",
      content: "",
      base64Data,
      isImage: true,
      isVideo: false,
      isPdf: false,
      isExcel: false,
      imageDimensions: { width, height },
    });
  };

  return (
    <div className="w-full space-y-3" id="uploader-container">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        className={`relative flex flex-col items-center justify-center p-5 lg:p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
          isAnalyzing
            ? "bg-slate-900/30 border-slate-800 cursor-not-allowed opacity-75"
            : isDragOver
            ? "border-emerald-400 bg-emerald-950/20 shadow-lg shadow-emerald-500/10 scale-[1.01]"
            : "border-slate-700/80 hover:border-emerald-500/50 bg-slate-900/40 hover:bg-slate-900/70"
        }`}
        id="uploader-drop-zone"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.pdf,application/pdf,.jpg,.jpeg,image/jpeg,.png,image/png,image/*,video/*,text/*,application/json,application/javascript,text/javascript,text/html,text/css,text/csv,text/markdown,.mp4,.webm,.mov"
          className="hidden"
          disabled={isAnalyzing}
          id="file-input-element"
        />

        {isAnalyzing ? (
          <div className="flex flex-col items-center text-center py-4" id="uploader-analyzing">
            <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-100">Deep File Inspection In Progress</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Gemini is running spreadsheet quantitative analysis, OCR, and forensic auditing.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center" id="uploader-prompt">
            <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 text-emerald-400 rounded-2xl mb-3 border border-slate-700/80 shadow-md">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-100">
              Drag & drop <span className="text-emerald-400 font-bold">Excel</span>, <span className="text-rose-400 font-bold">PDF</span>, <span className="text-amber-400 font-bold">JPG</span>, or <span className="text-cyan-400 font-bold">PNG</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              or <span className="text-emerald-400 hover:underline font-medium">browse local files</span> (up to 45MB)
            </p>

            {/* Badges for Primary File Analyzers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full mt-3.5 pt-3 border-t border-slate-800/80 text-[10px] font-mono">
              <div className="flex items-center justify-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 py-1 px-1.5 rounded-lg">
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                <span>Excel (.xlsx)</span>
              </div>
              <div className="flex items-center justify-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-300 py-1 px-1.5 rounded-lg">
                <FileText className="w-3 h-3 text-rose-400" />
                <span>PDF Doc</span>
              </div>
              <div className="flex items-center justify-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 py-1 px-1.5 rounded-lg">
                <ImageIcon className="w-3 h-3 text-amber-400" />
                <span>JPG Photo</span>
              </div>
              <div className="flex items-center justify-center gap-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 py-1 px-1.5 rounded-lg">
                <ImageIcon className="w-3 h-3 text-cyan-400" />
                <span>PNG Graphic</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-center gap-2 p-2.5 bg-red-500/15 border border-red-500/30 rounded-xl text-red-200 text-xs w-full" id="uploader-error">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* QUICK TRY SAMPLE FILES SECTION */}
      <div className="bg-slate-900/30 border border-slate-850 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" /> Instant Samples:
          </span>
          <span className="text-[9px] text-slate-500 font-mono">Click to test</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={loadSampleExcel}
            disabled={isAnalyzing}
            className="flex items-center justify-between px-2.5 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-emerald-500/40 rounded-lg text-left transition cursor-pointer disabled:opacity-50 text-xs text-slate-300 group"
          >
            <span className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 group-hover:scale-125 transition" />
              <span className="truncate">Sample Excel (Sales & Budget Model)</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono shrink-0">.XLSX</span>
          </button>

          <button
            onClick={loadSamplePdf}
            disabled={isAnalyzing}
            className="flex items-center justify-between px-2.5 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-rose-500/40 rounded-lg text-left transition cursor-pointer disabled:opacity-50 text-xs text-slate-300 group"
          >
            <span className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 group-hover:scale-125 transition" />
              <span className="truncate">Sample PDF (Invoice & Audit)</span>
            </span>
            <span className="text-[10px] text-rose-400 font-mono shrink-0">.PDF</span>
          </button>

          <button
            onClick={loadSampleJpg}
            disabled={isAnalyzing}
            className="flex items-center justify-between px-2.5 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-amber-500/40 rounded-lg text-left transition cursor-pointer disabled:opacity-50 text-xs text-slate-300 group"
          >
            <span className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 group-hover:scale-125 transition" />
              <span className="truncate">Sample JPG (Sunset Photography)</span>
            </span>
            <span className="text-[10px] text-amber-400 font-mono shrink-0">.JPG</span>
          </button>

          <button
            onClick={loadSamplePng}
            disabled={isAnalyzing}
            className="flex items-center justify-between px-2.5 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-cyan-500/40 rounded-lg text-left transition cursor-pointer disabled:opacity-50 text-xs text-slate-300 group"
          >
            <span className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 group-hover:scale-125 transition" />
              <span className="truncate">Sample PNG (UI Spec & Alpha)</span>
            </span>
            <span className="text-[10px] text-cyan-400 font-mono shrink-0">.PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
