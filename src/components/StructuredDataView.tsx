import React, { useState } from "react";
import { ExtractedTable } from "../types";
import { Table, Download, Copy, Check, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface StructuredDataViewProps {
  tables: ExtractedTable[];
}

export default function StructuredDataView({ tables }: StructuredDataViewProps) {
  const [selectedTableIdx, setSelectedTableIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  if (!tables || tables.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-950/60 rounded-xl border border-slate-800">
        <Table className="w-10 h-10 text-slate-600 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-300">No structured tables extracted</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Documents with financial statements, invoice line items, or tabular datasets will display structured tables here.
        </p>
      </div>
    );
  }

  const currentTable = tables[selectedTableIdx] || tables[0];

  const filteredRows = (currentTable.rows || []).filter((row) =>
    row.some((cell) => cell.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const paginatedRows = filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const maxPages = Math.ceil(filteredRows.length / rowsPerPage);

  const exportTableAsCsv = () => {
    const csvContent = [
      currentTable.headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
      ...currentTable.rows.map((row) =>
        row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentTable.title.replace(/\s+/g, "_") || "Extracted_Table"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyTableCsv = () => {
    const csvContent = [
      currentTable.headers.join("\t"),
      ...currentTable.rows.map((r) => r.join("\t")),
    ].join("\n");
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Table selector tabs if multiple tables */}
      {tables.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {tables.map((t, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedTableIdx(idx);
                setPage(0);
                setSearchQuery("");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedTableIdx === idx
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              {t.title || `Table ${idx + 1}`} ({t.rows.length} rows)
            </button>
          ))}
        </div>
      )}

      {/* Table Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <Table className="w-4 h-4 text-emerald-400 shrink-0" />
          <h4 className="text-xs font-semibold text-slate-200 truncate">
            {currentTable.title || "Extracted Structured Table"}
          </h4>
          {currentTable.pageOrSection && (
            <span className="text-[10px] text-slate-500 font-mono">
              ({currentTable.pageOrSection})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Search table rows..."
              className="pl-8 pr-2.5 py-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg focus:outline-none focus:border-emerald-500 w-36 sm:w-48"
            />
          </div>

          <button
            type="button"
            onClick={copyTableCsv}
            className="p-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition-colors"
            title="Copy as Tab-Separated Values"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            type="button"
            onClick={exportTableAsCsv}
            className="p-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-300 font-mono text-[11px] border-b border-slate-800">
            <tr>
              <th className="p-2.5 text-slate-500 w-10 text-center">#</th>
              {currentTable.headers.map((h, i) => (
                <th key={i} className="p-2.5 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={currentTable.headers.length + 1} className="p-6 text-center text-slate-500">
                  No matching rows found
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-2 text-center text-slate-500 font-mono text-[10px]">
                    {page * rowsPerPage + rowIdx + 1}
                  </td>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="p-2.5 text-slate-200">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {maxPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Showing {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, filteredRows.length)} of{" "}
            {filteredRows.length} rows
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono">
              {page + 1} / {maxPages}
            </span>
            <button
              type="button"
              disabled={page >= maxPages - 1}
              onClick={() => setPage(page + 1)}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
