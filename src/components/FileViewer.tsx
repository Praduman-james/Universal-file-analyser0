import React, { useState, useMemo } from "react";
import { UploadedFile, ExcelSheetData } from "../types";
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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  Palette,
  FileText,
  Tag,
  Download,
  ExternalLink,
  Layers,
  Sparkles,
  Calculator,
  BarChart2,
  Table as TableIcon,
  HelpCircle,
} from "lucide-react";

interface FileViewerProps {
  file: UploadedFile;
}

export default function FileViewer({ file }: FileViewerProps) {
  // Navigation / active tabs inside viewer
  const [imageTab, setImageTab] = useState<"visual" | "ocr" | "palette" | "specs">("visual");
  const [pdfTab, setPdfTab] = useState<"preview" | "text" | "outline" | "specs">("preview");
  const [excelTab, setExcelTab] = useState<"grid" | "profiler" | "formulas">("grid");
  
  // Excel Sheet navigation and cell selection
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number; val: any; header: string } | null>(null);
  const [excelSearchQuery, setExcelSearchQuery] = useState("");
  const [excelPage, setExcelPage] = useState(0);
  const [copiedCellVal, setCopiedCellVal] = useState(false);
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);
  const excelRowsPerPage = 12;

  // Image controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // CSV controls
  const [csvSearchQuery, setCsvSearchQuery] = useState("");
  const [csvPage, setCsvPage] = useState(0);
  const [videoDuration, setVideoDuration] = useState<string | null>(null);
  const [videoResolution, setVideoResolution] = useState<string | null>(null);
  const csvRowsPerPage = 10;

  // File extension
  const fileExtension = useMemo(() => {
    const parts = file.name.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "TXT";
  }, [file.name]);

  const isExcel = Boolean(file.isExcel) || fileExtension === "XLSX" || fileExtension === "XLS" || file.type.includes("spreadsheet");
  const isPdf = Boolean(file.isPdf) || file.type === "application/pdf" || fileExtension === "PDF";
  const isJpg = fileExtension === "JPG" || fileExtension === "JPEG" || file.type === "image/jpeg";
  const isPng = fileExtension === "PNG" || file.type === "image/png";

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Copy helper
  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyCell = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedCellVal(true);
    setTimeout(() => setCopiedCellVal(false), 2000);
  };

  const handleCopyFormula = (formula: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormula(formula);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  // Active Excel Sheet
  const activeExcelSheet: ExcelSheetData | null = useMemo(() => {
    if (!isExcel || !file.excelSheets || file.excelSheets.length === 0) return null;
    return file.excelSheets[Math.min(activeSheetIdx, file.excelSheets.length - 1)] || null;
  }, [isExcel, file.excelSheets, activeSheetIdx]);

  // Excel filtered & paginated rows
  const filteredExcelRows = useMemo(() => {
    if (!activeExcelSheet) return [];
    if (!excelSearchQuery.trim()) return activeExcelSheet.rows;

    const q = excelSearchQuery.toLowerCase().trim();
    return activeExcelSheet.rows.filter((row) =>
      row.some((cell) => String(cell ?? "").toLowerCase().includes(q))
    );
  }, [activeExcelSheet, excelSearchQuery]);

  const paginatedExcelRows = useMemo(() => {
    const start = excelPage * excelRowsPerPage;
    return filteredExcelRows.slice(start, start + excelRowsPerPage);
  }, [filteredExcelRows, excelPage]);

  const maxExcelPages = Math.ceil(filteredExcelRows.length / excelRowsPerPage);

  // Column Profiler for Active Excel Sheet
  const columnProfiles = useMemo(() => {
    if (!activeExcelSheet) return [];

    return activeExcelSheet.headers.map((header, colIdx) => {
      const values = activeExcelSheet.rows.map((r) => r[colIdx]);
      let numericCount = 0;
      let nonNullCount = 0;
      let sum = 0;
      let min: number | null = null;
      let max: number | null = null;
      const uniqueSet = new Set<string>();

      values.forEach((v) => {
        if (v !== null && v !== undefined && v !== "") {
          nonNullCount++;
          const strVal = String(v).trim();
          uniqueSet.add(strVal);

          // Clean currency/percent for numeric detection
          const cleanStr = strVal.replace(/[$,%]/g, "");
          const num = parseFloat(cleanStr);
          if (!isNaN(num) && isFinite(num) && !isNaN(Number(cleanStr))) {
            numericCount++;
            sum += num;
            if (min === null || num < min) min = num;
            if (max === null || num > max) max = num;
          }
        }
      });

      const isNumeric = numericCount > 0 && numericCount >= nonNullCount * 0.7;
      const avg = isNumeric && numericCount > 0 ? sum / numericCount : undefined;

      return {
        column: header,
        colLetter: String.fromCharCode(65 + (colIdx % 26)),
        type: isNumeric ? "numeric" : "text",
        totalRows: values.length,
        filledCount: nonNullCount,
        blankCount: values.length - nonNullCount,
        uniqueCount: uniqueSet.size,
        min: isNumeric ? min : undefined,
        max: isNumeric ? max : undefined,
        sum: isNumeric ? sum : undefined,
        avg: isNumeric ? avg : undefined,
      };
    });
  }, [activeExcelSheet]);

  // Export current active sheet as CSV
  const handleExportSheetCsv = () => {
    if (!activeExcelSheet) return;
    const csvContent =
      [activeExcelSheet.headers.join(","), ...activeExcelSheet.rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeExcelSheet.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download raw XLSX file
  const handleDownloadXlsx = () => {
    if (!file.base64Data) return;
    const byteCharacters = atob(file.base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", file.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Parsing
  const parsedCsv = useMemo(() => {
    if (file.isImage || file.isVideo || isPdf || isExcel || !file.content) return null;
    const isCsvFile = file.name.endsWith(".csv") || file.type === "text/csv";
    if (!isCsvFile) return null;

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
  }, [file.content, file.name, file.isImage, file.isVideo, isPdf, isExcel]);

  // JSON Parsing
  const parsedJson = useMemo(() => {
    if (file.isImage || file.isVideo || isPdf || isExcel || !file.content) return null;
    const isJson = file.name.endsWith(".json") || file.type === "application/json";
    if (!isJson) return null;

    try {
      return JSON.parse(file.content);
    } catch (e) {
      return null;
    }
  }, [file.content, file.name, file.isImage, file.isVideo, isPdf, isExcel]);

  // Filtered CSV rows
  const filteredCsvRows = useMemo(() => {
    if (!parsedCsv) return [];
    if (!csvSearchQuery) return parsedCsv.rows;

    const query = csvSearchQuery.toLowerCase();
    return parsedCsv.rows.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(query))
    );
  }, [parsedCsv, csvSearchQuery]);

  const paginatedCsvRows = useMemo(() => {
    const start = csvPage * csvRowsPerPage;
    return filteredCsvRows.slice(start, start + csvRowsPerPage);
  }, [filteredCsvRows, csvPage]);

  const maxCsvPages = Math.ceil(filteredCsvRows.length / csvRowsPerPage);

  // RENDER EXCEL WORKBOOK INSPECTOR
  const renderExcelViewer = () => {
    const sheets = file.excelSheets || [];
    const formulas = file.analysis?.keyFormulasOrMetrics || [];

    if (!activeExcelSheet) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-950 rounded-xl border border-slate-800 text-center text-slate-500 font-mono text-xs">
          <FileSpreadsheet className="w-10 h-10 text-emerald-500 mb-2 animate-bounce" />
          <p>No worksheet data detected in this Excel workbook.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full space-y-3" id="viewer-excel-module">
        {/* Top Controls: Sheet Tabs & Sub-view buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 gap-2 text-xs">
          {/* Subtabs */}
          <div className="flex items-center gap-1 font-mono">
            <button
              onClick={() => setExcelTab("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                excelTab === "grid"
                  ? "bg-slate-800 text-emerald-400 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Spreadsheet Grid
            </button>
            <button
              onClick={() => setExcelTab("profiler")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                excelTab === "profiler"
                  ? "bg-slate-800 text-emerald-400 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> Column Profiler ({activeExcelSheet.headers.length})
            </button>
            <button
              onClick={() => setExcelTab("formulas")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                excelTab === "formulas"
                  ? "bg-slate-800 text-emerald-400 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Calculator className="w-3.5 h-3.5" /> Formulas & KPIs
              {formulas.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button
              onClick={handleExportSheetCsv}
              className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-emerald-400 bg-slate-800 hover:bg-slate-750 border border-slate-700 px-2 py-1 rounded-md transition cursor-pointer"
              title="Export current active worksheet as CSV"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </button>
            {file.base64Data && (
              <button
                onClick={handleDownloadXlsx}
                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1 rounded-md transition cursor-pointer"
                title="Download original .xlsx file"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Save .XLSX</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Sheet Selection Bar (when file has multiple sheets) */}
        {sheets.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap bg-slate-950/60 p-1.5 rounded-xl border border-slate-850 scrollbar-none text-xs font-mono">
            <span className="text-[10px] uppercase font-bold text-slate-500 px-2">Sheets:</span>
            {sheets.map((sheet, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveSheetIdx(idx);
                  setExcelPage(0);
                  setSelectedCell(null);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                  activeSheetIdx === idx
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-semibold shadow-sm"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                }`}
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                <span>{sheet.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {sheet.rowCount} rows
                </span>
              </button>
            ))}
          </div>
        )}

        {/* TAB 1: SPREADSHEET GRID */}
        {excelTab === "grid" && (
          <div className="flex flex-col space-y-2">
            {/* Formula / Cell Inspector Bar */}
            <div className="flex items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-xs font-mono">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="bg-slate-900 text-emerald-400 px-2 py-1 rounded border border-slate-800 font-bold shrink-0">
                  {selectedCell
                    ? `${String.fromCharCode(65 + (selectedCell.col % 26))}${selectedCell.row + 1}`
                    : "A1"}
                </span>
                <div className="flex items-center gap-1.5 truncate text-slate-300">
                  <span className="text-slate-500 shrink-0">fx:</span>
                  <span className="truncate select-text">
                    {selectedCell ? `${selectedCell.header} = ${String(selectedCell.val ?? "")}` : "Click any cell to inspect coordinate & value"}
                  </span>
                </div>
                {selectedCell && (
                  <button
                    onClick={() => handleCopyCell(String(selectedCell.val ?? ""))}
                    className="text-slate-500 hover:text-emerald-400 transition cursor-pointer p-1"
                    title="Copy cell value"
                  >
                    {copiedCellVal ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* Instant Search in Sheet */}
              <div className="relative w-48 sm:w-64 shrink-0">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter sheet rows..."
                  value={excelSearchQuery}
                  onChange={(e) => {
                    setExcelSearchQuery(e.target.value);
                    setExcelPage(0);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/50 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Grid Table Container */}
            <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950 max-h-[300px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <table className="w-full text-left border-collapse text-xs font-mono">
                {/* Excel Column Letters Header */}
                <thead className="bg-slate-900 text-slate-300 font-semibold sticky top-0 border-b border-slate-800 z-10">
                  <tr>
                    <th className="w-10 px-2 py-2 text-center text-slate-500 font-mono text-[10px] bg-slate-900/90 border-r border-slate-800">
                      #
                    </th>
                    {activeExcelSheet.headers.map((header, colIdx) => (
                      <th
                        key={colIdx}
                        className="px-3.5 py-2.5 font-mono text-slate-300 uppercase tracking-wider min-w-[130px] border-r border-slate-800/80 bg-slate-900"
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{header}</span>
                          <span className="text-[9px] text-emerald-500/80 font-normal ml-1">
                            {String.fromCharCode(65 + (colIdx % 26))}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body with Row Numbers */}
                <tbody className="divide-y divide-slate-900/80 text-slate-300">
                  {paginatedExcelRows.length === 0 ? (
                    <tr>
                      <td colSpan={activeExcelSheet.headers.length + 1} className="text-center py-8 text-slate-500">
                        No rows matching &quot;{excelSearchQuery}&quot;
                      </td>
                    </tr>
                  ) : (
                    paginatedExcelRows.map((row, rIdx) => {
                      const absoluteRowIdx = excelPage * excelRowsPerPage + rIdx;
                      return (
                        <tr key={rIdx} className="hover:bg-slate-900/60 transition-colors">
                          {/* Row Number */}
                          <td className="px-2 py-2 text-center text-slate-600 font-mono text-[10px] bg-slate-950 border-r border-slate-900 select-none">
                            {absoluteRowIdx + 1}
                          </td>
                          {/* Cells */}
                          {activeExcelSheet.headers.map((_, colIdx) => {
                            const val = row[colIdx];
                            const isSelected =
                              selectedCell?.row === absoluteRowIdx && selectedCell?.col === colIdx;
                            return (
                              <td
                                key={colIdx}
                                onClick={() =>
                                  setSelectedCell({
                                    row: absoluteRowIdx,
                                    col: colIdx,
                                    val,
                                    header: activeExcelSheet.headers[colIdx],
                                  })
                                }
                                className={`px-3.5 py-2 truncate max-w-xs font-mono border-r border-slate-900/60 cursor-pointer transition ${
                                  isSelected
                                    ? "bg-emerald-950/40 text-emerald-300 outline outline-1 outline-emerald-500 font-bold"
                                    : "text-slate-300 hover:bg-slate-800/30"
                                }`}
                              >
                                {val !== null && val !== undefined ? String(val) : ""}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-slate-400 font-mono">
                Showing {filteredExcelRows.length === 0 ? 0 : excelPage * excelRowsPerPage + 1}–
                {Math.min((excelPage + 1) * excelRowsPerPage, filteredExcelRows.length)} of {filteredExcelRows.length} rows
                {activeExcelSheet.name && ` (Sheet: ${activeExcelSheet.name})`}
              </p>
              {maxExcelPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={excelPage === 0}
                    onClick={() => setExcelPage((p) => Math.max(0, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 transition text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-slate-400 font-mono">
                    Page {excelPage + 1} of {maxExcelPages}
                  </span>
                  <button
                    disabled={excelPage >= maxExcelPages - 1}
                    onClick={() => setExcelPage((p) => Math.min(maxExcelPages - 1, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 transition text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: COLUMN PROFILER */}
        {excelTab === "profiler" && (
          <div className="bg-slate-950 rounded-xl border border-slate-850 p-4 max-h-[350px] overflow-auto scrollbar-thin scrollbar-thumb-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-2">
              <span className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                Column Statistics & Data Health • Sheet: &quot;{activeExcelSheet.name}&quot;
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {activeExcelSheet.rowCount} rows • {activeExcelSheet.colCount} columns
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
              {columnProfiles.map((prof, i) => (
                <div
                  key={i}
                  className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                      <span className="text-[10px] bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded">
                        {prof.colLetter}
                      </span>
                      {prof.column}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                        prof.type === "numeric"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {prof.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-850">
                    <div>
                      <span className="text-slate-500 text-[10px]">Filled: </span>
                      <span className="text-slate-200 font-bold">{prof.filledCount}</span>
                      <span className="text-slate-600 text-[10px]"> ({prof.uniqueCount} unique)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px]">Blanks: </span>
                      <span className={prof.blankCount > 0 ? "text-amber-400 font-bold" : "text-slate-200"}>
                        {prof.blankCount}
                      </span>
                    </div>

                    {prof.type === "numeric" && (
                      <>
                        <div>
                          <span className="text-slate-500 text-[10px]">Sum: </span>
                          <span className="text-emerald-400 font-bold">
                            {prof.sum !== undefined ? prof.sum.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px]">Average: </span>
                          <span className="text-slate-200 font-bold">
                            {prof.avg !== undefined ? prof.avg.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px]">Min: </span>
                          <span className="text-slate-300">{prof.min !== undefined ? prof.min.toLocaleString() : "-"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px]">Max: </span>
                          <span className="text-slate-300">{prof.max !== undefined ? prof.max.toLocaleString() : "-"}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: KEY FORMULAS & KPIS */}
        {excelTab === "formulas" && (
          <div className="bg-slate-950 rounded-xl border border-slate-850 p-4 max-h-[350px] overflow-auto scrollbar-thin scrollbar-thumb-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-2">
              <span className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-400" />
                Key KPI Calculations & Suggested Excel Formulas
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Click formula to copy</span>
            </div>

            {formulas.length > 0 ? (
              <div className="space-y-2.5">
                {formulas.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 font-mono">{item.label}</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-900/40">
                        {item.value}
                      </span>
                    </div>
                    {item.formula && (
                      <div className="flex items-center justify-between bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-850 font-mono text-xs">
                        <code className="text-cyan-400">{item.formula}</code>
                        <button
                          onClick={() => handleCopyFormula(item.formula!)}
                          className="text-slate-500 hover:text-emerald-400 transition cursor-pointer flex items-center gap-1 text-[11px]"
                          title="Copy Excel formula"
                        >
                          {copiedFormula === item.formula ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedFormula === item.formula ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    )}
                    {item.description && (
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 font-mono text-xs">
                KPI formulas and aggregations will populate upon Gemini analysis completion.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render Image Viewer with Tabs & Controls
  const renderImageViewer = () => {
    const mimeType = isJpg ? "image/jpeg" : isPng ? "image/png" : (file.type || "image/png");
    const dataUri = `data:${mimeType};base64,${file.base64Data}`;
    const dominantColors = file.analysis?.dominantColors || [];
    const extractedText = file.analysis?.extractedText || "";
    const detectedObjects = file.analysis?.detectedObjects || [];
    const specs = file.analysis?.technicalSpecs;

    return (
      <div className="flex flex-col h-full space-y-3" id="viewer-image-module">
        {/* Subtabs Header */}
        <div className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1 font-mono">
            <button
              onClick={() => setImageTab("visual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                imageTab === "visual"
                  ? "bg-slate-800 text-emerald-400 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Visual
            </button>
            <button
              onClick={() => setImageTab("ocr")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                imageTab === "ocr"
                  ? "bg-slate-800 text-emerald-400 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> OCR Text
              {extractedText && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setImageTab("palette")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                imageTab === "palette"
                  ? "bg-slate-800 text-emerald-400 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Palette className="w-3.5 h-3.5" /> Palette ({dominantColors.length})
            </button>
            <button
              onClick={() => setImageTab("specs")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                imageTab === "specs"
                  ? "bg-slate-800 text-emerald-400 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Specs
            </button>
          </div>

          {imageTab === "visual" && (
            <div className="flex items-center gap-1 text-slate-400 font-mono">
              <button
                onClick={() => setZoomLevel((z) => Math.max(25, z - 25))}
                className="p-1 hover:text-slate-200 rounded hover:bg-slate-800 transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] w-12 text-center text-slate-300 font-bold">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(300, z + 25))}
                className="p-1 hover:text-slate-200 rounded hover:bg-slate-800 transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1 hover:text-slate-200 rounded hover:bg-slate-800 transition cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Visual Inspector */}
        {imageTab === "visual" && (
          <div className="flex flex-col items-center justify-center min-h-[280px] max-h-[380px] bg-slate-950/80 rounded-xl border border-slate-855 p-4 overflow-auto scrollbar-thin scrollbar-thumb-slate-800 relative">
            {isPng && (
              <div
                className="absolute inset-0 opacity-15 pointer-events-none rounded-xl"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                }}
              />
            )}

            <div
              className="transition-transform duration-150 ease-out flex items-center justify-center"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center center" }}
            >
              <img
                src={dataUri}
                alt={file.name}
                className="max-h-[320px] max-w-full object-contain rounded-lg shadow-2xl border border-slate-800"
              />
            </div>

            <div className="absolute bottom-2 right-2 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-800 text-[10px] text-slate-400 font-mono flex items-center gap-2">
              {file.imageDimensions && (
                <span>
                  {file.imageDimensions.width} × {file.imageDimensions.height} px
                </span>
              )}
              <span className="text-emerald-400 font-bold">{fileExtension}</span>
            </div>
          </div>
        )}

        {/* Tab 2: OCR Extracted Text */}
        {imageTab === "ocr" && (
          <div className="flex flex-col bg-slate-950 rounded-xl border border-slate-850 p-4 min-h-[280px] max-h-[380px] overflow-auto scrollbar-thin scrollbar-thumb-slate-800">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2.5 mb-3">
              <span className="text-xs font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                OCR Text Transcription ({extractedText ? `${extractedText.length} chars` : "None"})
              </span>
              {extractedText && (
                <button
                  onClick={() => handleCopyText(extractedText)}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono bg-emerald-950/40 border border-emerald-900/40 px-2 py-1 rounded-md transition cursor-pointer"
                >
                  {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText ? "Copied" : "Copy Text"}</span>
                </button>
              )}
            </div>

            {extractedText ? (
              <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed select-text">
                {extractedText}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-8 text-slate-500 font-mono text-xs">
                <Search className="w-8 h-8 text-slate-600 mb-2" />
                <p>No typographic or signage text detected in this image.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Dominant Color Palette */}
        {imageTab === "palette" && (
          <div className="flex flex-col bg-slate-950 rounded-xl border border-slate-850 p-4 min-h-[280px] max-h-[380px] overflow-auto scrollbar-thin scrollbar-thumb-slate-800">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2.5 mb-3">
              <span className="text-xs font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                Extracted Color Palette
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Click hex to copy</span>
            </div>

            {dominantColors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {dominantColors.map((color, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleCopyHex(color.hex)}
                    className="flex items-center justify-between p-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg border border-white/20 shadow-inner group-hover:scale-105 transition"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition">
                          {color.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{color.hex}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {color.percentage && (
                        <span className="text-[10px] text-slate-500 font-mono font-semibold">
                          {color.percentage}
                        </span>
                      )}
                      <button className="text-slate-500 group-hover:text-emerald-400 transition">
                        {copiedHex === color.hex ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs font-mono">
                Color palette data will populate upon Gemini analysis completion.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Technical Specs */}
        {imageTab === "specs" && (
          <div className="flex flex-col bg-slate-950 rounded-xl border border-slate-850 p-4 min-h-[280px] max-h-[380px] overflow-auto scrollbar-thin scrollbar-thumb-slate-800 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider mb-2">
                Technical Specifications
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-850">
                  <span className="text-slate-500 text-[10px] block">Format</span>
                  <span className="text-slate-200 font-bold">{fileExtension}</span>
                </div>
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-850">
                  <span className="text-slate-500 text-[10px] block">Dimensions</span>
                  <span className="text-slate-200 font-bold">
                    {file.imageDimensions
                      ? `${file.imageDimensions.width} × ${file.imageDimensions.height}`
                      : specs?.dimensions || "Dynamic"}
                  </span>
                </div>
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-850">
                  <span className="text-slate-500 text-[10px] block">Alpha Channel</span>
                  <span className={`font-bold ${isPng ? "text-cyan-400" : "text-slate-400"}`}>
                    {isPng ? "Yes (Transparent)" : "No (Opaque)"}
                  </span>
                </div>
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-850">
                  <span className="text-slate-500 text-[10px] block">Megapixels</span>
                  <span className="text-slate-200 font-bold">
                    {file.imageDimensions
                      ? `${((file.imageDimensions.width * file.imageDimensions.height) / 1000000).toFixed(2)} MP`
                      : "Standard"}
                  </span>
                </div>
              </div>
            </div>

            {detectedObjects.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  Detected Visual Subjects & Elements
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {detectedObjects.map((item, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render PDF Viewer
  const renderPdfViewer = () => {
    const dataUri = `data:application/pdf;base64,${file.base64Data}#toolbar=1&navpanes=0`;
    const extractedText = file.analysis?.extractedText || "";
    const documentOutline = file.analysis?.documentOutline || [];
    const docType = file.analysis?.documentType || "Document";
    const specs = file.analysis?.technicalSpecs;

    const openPdfInTab = () => {
      const byteCharacters = atob(file.base64Data || "");
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    };

    return (
      <div className="flex flex-col h-full space-y-3" id="viewer-pdf-module">
        <div className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1 font-mono">
            <button
              onClick={() => setPdfTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                pdfTab === "preview"
                  ? "bg-slate-800 text-rose-400 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> PDF Page
            </button>
            <button
              onClick={() => setPdfTab("text")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                pdfTab === "text"
                  ? "bg-slate-800 text-rose-400 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Extracted Text
            </button>
            <button
              onClick={() => setPdfTab("outline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                pdfTab === "outline"
                  ? "bg-slate-800 text-rose-400 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Outline ({documentOutline.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openPdfInTab}
              className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-rose-400 font-mono bg-slate-800 hover:bg-slate-750 border border-slate-700 px-2 py-1 rounded-md transition cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Full View</span>
            </button>
          </div>
        </div>

        {pdfTab === "preview" && (
          <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden h-[340px] flex flex-col">
            <iframe
              src={dataUri}
              title={file.name}
              className="w-full h-full rounded-xl bg-white/5"
            />
          </div>
        )}

        {pdfTab === "text" && (
          <div className="flex flex-col bg-slate-950 rounded-xl border border-slate-850 p-4 h-[340px] overflow-auto scrollbar-thin scrollbar-thumb-slate-800">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2.5 mb-3">
              <span className="text-xs font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                Document Text & OCR
              </span>
              {extractedText && (
                <button
                  onClick={() => handleCopyText(extractedText)}
                  className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-mono bg-rose-950/30 border border-rose-900/40 px-2 py-1 rounded-md transition cursor-pointer"
                >
                  {copiedText ? <Check className="w-3 h-3 text-rose-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText ? "Copied" : "Copy All"}</span>
                </button>
              )}
            </div>

            {extractedText ? (
              <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed select-text">
                {extractedText}
              </pre>
            ) : (
              <div className="text-center py-10 text-slate-500 font-mono text-xs">
                Extracting textual contents from PDF document...
              </div>
            )}
          </div>
        )}

        {pdfTab === "outline" && (
          <div className="flex flex-col bg-slate-950 rounded-xl border border-slate-850 p-4 h-[340px] overflow-auto scrollbar-thin scrollbar-thumb-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-1">
              <span className="text-xs font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-rose-400" />
                Structured Sections ({documentOutline.length})
              </span>
            </div>

            {documentOutline.length > 0 ? (
              documentOutline.map((sec, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-xs font-bold text-slate-200 font-mono">{sec.heading}</h5>
                    {sec.page && (
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-rose-400 font-mono">
                        Page {sec.page}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{sec.summary}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 font-mono text-xs">
                Document section outline will appear here after Gemini analysis completes.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    // 1. EXCEL WORKBOOK RENDERING (.xlsx, .xls)
    if (isExcel) {
      return renderExcelViewer();
    }

    // 2. PDF DOCUMENT RENDERING
    if (isPdf && file.base64Data) {
      return renderPdfViewer();
    }

    // 3. IMAGE (JPG, PNG) RENDERING
    if (file.isImage && file.base64Data) {
      return renderImageViewer();
    }

    // 4. VIDEO RENDERING
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
            {videoDuration && <span>• Length: {videoDuration}</span>}
            {videoResolution && <span>• Res: {videoResolution}</span>}
          </div>
        </div>
      );
    }

    // 5. CSV TABLE RENDERING
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
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
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

    // 6. JSON DOCUMENT RENDERING
    if (parsedJson) {
      return (
        <div className="border border-slate-800 rounded-xl bg-slate-950 p-4 font-mono text-xs overflow-auto max-h-[360px] scrollbar-thin scrollbar-thumb-slate-800" id="viewer-json">
          <pre className="text-emerald-400">
            {JSON.stringify(parsedJson, null, 2)}
          </pre>
        </div>
      );
    }

    // 7. PLAIN TEXT / SOURCE CODE RENDERER
    const lines = (file.content || "").split(/\r?\n/);
    const displayedLines = lines.slice(0, 1000);
    const isTruncated = lines.length > 1000;

    return (
      <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden font-mono text-xs" id="viewer-text">
        <div className="flex items-center justify-between bg-slate-900/60 px-4 py-2 border-b border-slate-850">
          <span className="text-[10px] text-slate-500 font-mono">Lines: {lines.length} {isTruncated && "(Showing first 1000 lines)"}</span>
          <span className="text-[10px] text-slate-500 font-mono">{fileExtension} File</span>
        </div>
        <div className="overflow-y-auto max-h-[340px] p-4 scrollbar-thin scrollbar-thumb-slate-800 flex">
          <div className="text-slate-600 select-none text-right pr-4 border-r border-slate-900 font-mono text-xs">
            {displayedLines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <pre className="pl-4 text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono text-xs flex-1">
            {displayedLines.join("\n")}
            {isTruncated && "\n... [Remaining content hidden in reader view] ..."}
          </pre>
        </div>
      </div>
    );
  };

  const getBadgeIcon = () => {
    if (isExcel) return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    if (isPdf) return <FileText className="w-4 h-4 text-rose-400" />;
    if (isJpg) return <ImageIcon className="w-4 h-4 text-amber-400" />;
    if (isPng) return <ImageIcon className="w-4 h-4 text-cyan-400" />;
    if (file.isImage) return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    if (file.isVideo) return <VideoIcon className="w-4 h-4 text-cyan-400" />;
    return <FileCode className="w-4 h-4 text-emerald-400" />;
  };

  const getFormatBadgeColor = () => {
    if (isExcel) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (isPdf) return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    if (isJpg) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (isPng) return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    return "bg-slate-900 text-slate-400 border-slate-800";
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-2xl border border-slate-800/80 p-5" id={`viewer-${file.id}`}>
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-slate-800 shrink-0">
            {getBadgeIcon()}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-100 truncate flex items-center gap-1.5">
              {file.name}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {formatSize(file.size)} • {file.type || `${fileExtension} File`}
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono ${getFormatBadgeColor()}`}>
          <Eye className="w-3 h-3" />
          <span>{isExcel ? "Excel Workbook" : isPdf ? "PDF Document" : isJpg ? "JPG Photo" : isPng ? "PNG Graphic" : "Preview"}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {renderContent()}
      </div>
    </div>
  );
}
