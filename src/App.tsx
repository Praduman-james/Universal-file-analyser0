import React, { useState, useEffect, useMemo } from "react";
import { UploadedFile, Message, FileAnalysis, ExcelSheetData } from "./types";
import FileUploader from "./components/FileUploader";
import FileViewer from "./components/FileViewer";
import AnalysisDashboard from "./components/AnalysisDashboard";
import ChatAssistant from "./components/ChatAssistant";
import HistoryList from "./components/HistoryList";
import { Sparkles, FileText, BarChart3, MessageSquare, AlertCircle, RefreshCw, Upload, Eye, Image as ImageIcon, FileSpreadsheet } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Local storage key
const STORAGE_KEY = "universal-file-analyzer-records";

// SEED / WELCOME TEMPLATE FILE
const WELCOME_FILE: UploadedFile = {
  id: "welcome-guide",
  name: "Welcome_Guide.md",
  size: 2450,
  type: "text/markdown",
  content: `# Welcome to Universal File Analyzer!
### High-Precision Multi-Format Inspection for Excel, PDF, JPG, PNG & Media

This app provides specialized forensic analysis and data science auditing powered by Google Gemini 3.8 Flash.

## What You Can Analyze:

### 1. 📊 Excel Spreadsheets (.xlsx, .xls)
* **Multi-Sheet Navigation**: Inspect complex multi-sheet workbooks with tabs, row counts, and column schemas.
* **Spreadsheet Grid & Formula Bar**: Excel-style grid (A, B, C... / 1, 2, 3...) with interactive cell selection and coordinate tracking (e.g. \`B4\`).
* **Column Data Profiler**: Automated type detection, unique counts, blank counts, and numerical aggregations (Sum, Average, Min, Max).
* **AI Quantitative KPI Auditing**: Derives business metrics with suggested formulas (e.g., \`=SUM(...)\`, \`=AVERAGE(...)\`, \`=XLOOKUP(...)\`) and flags data anomalies.

### 2. 📄 PDF Documents (.pdf)
* **Document Classification**: Automatically identifies invoices, contracts, scientific papers, resumes, and reports.
* **Text & OCR Extraction**: Transcribes full readable text, headings, tabular figures, and clauses.
* **Section Outline & Interactive Preview**: Outlines major chapters and embeds a live PDF viewer.

### 3. 🌅 JPG / JPEG Photographs (.jpg, .jpeg)
* **Visual Composition**: Analyzes photographic styles, focal subjects, lighting, and camera balance.
* **Color Palette Harmony**: Extracts 4-6 dominant color swatches with precise, 1-click copyable Hex codes.
* **In-Image OCR**: Transcribes text, signage, and labels embedded within photos.

### 4. 🎨 PNG Graphics & UI Assets (.png)
* **Alpha Channel Transparency**: Inspects raster clarity, icons, and UI design hierarchies.
* **Interactive Zoom**: Zoom in/out (25% to 300%) with dark checkerboard background for transparent assets.

### 5. 🎬 Videos & 💻 Code / Data (.mp4, .webm, .csv, .json, .ts, .py)
* Scene breakdowns, temporal motion pacing, and syntax highlighting.

## Getting Started:
* Click any **Instant Sample** on the left (Sample Excel, Sample PDF, Sample JPG, Sample PNG) to test immediately!
* Or drag and drop any file up to 45MB into the dropzone.
* Use the **Chat Assistant** on the right to converse directly with your spreadsheet or document!`,
  isImage: false,
  isVideo: false,
  isPdf: false,
  isExcel: false,
  uploadedAt: new Date().toISOString(),
  analysis: {
    summary: "Welcome to Universal File Analyzer! Specialized multimodal and quantitative analysis is active for Excel workbooks (.xlsx, .xls), PDF documents, JPG photographs, PNG graphics, videos, code, and datasets powered by Gemini 3.8 Flash.",
    fileTypeDetails: "Multimodal Markdown Reference Guide",
    documentType: "Reference Guide",
    quickStats: [
      { label: "Excel Engine", value: "Active", unit: "XLSX" },
      { label: "PDF & OCR", value: "Ready", unit: "Forensics" },
      { label: "JPG & PNG", value: "Ready", unit: "Palette" },
      { label: "AI Model", value: "Gemini 3.8", unit: "Flash" },
    ],
    primaryInsights: [
      {
        title: "Excel Quantitative Auditing",
        description: "Parses multi-sheet workbooks, calculates column distributions, generates formula suggestions, and flags anomalies.",
        category: "Spreadsheet",
      },
      {
        title: "PDF Document Forensics",
        description: "Full inline PDF ingestion extracts document classification, key clauses, structured outlines, and verbatim text.",
        category: "Document",
      },
      {
        title: "JPG & PNG Color & OCR Audit",
        description: "Extracts dominant color palettes with hex values, detects embedded text via OCR, and inspects alpha transparency.",
        category: "Palette",
      },
      {
        title: "Conversational Spreadsheet Reasoning",
        description: "Chat directly with your Excel sheets, query cell ranges, compute custom variances, or request Excel formulas.",
        category: "Formula",
      },
    ],
    suggestedPrompts: [
      "How do I analyze an Excel workbook with multiple sheets?",
      "Can Gemini suggest Excel formulas like SUMIFS or XLOOKUP for my data?",
      "How do I inspect column statistics and data anomalies in a spreadsheet?",
    ],
  },
  chatHistory: [
    {
      id: "welcome-msg-1",
      role: "assistant",
      content: "Hello! I am your Multimodal File & Data Science Assistant. I specialize in analyzing **Excel spreadsheets (.xlsx, .xls)**, **PDF documents**, and **JPG / PNG images**. Try uploading your file or clicking one of the instant sample buttons on the left!",
      timestamp: new Date().toISOString(),
    },
  ],
};

export default function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "viewer" | "chat">("dashboard");
  const [globalError, setGlobalError] = useState<string | null>(null);

  // 1. Initial State Load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          setFiles(parsed);
          setActiveFileId(parsed[0].id);
          return;
        }
      }
      setFiles([WELCOME_FILE]);
      setActiveFileId(WELCOME_FILE.id);
    } catch (e) {
      console.error("Failed to load local storage", e);
      setFiles([WELCOME_FILE]);
      setActiveFileId(WELCOME_FILE.id);
    }
  }, []);

  // 2. State Sync to LocalStorage
  const saveFiles = (updatedFiles: UploadedFile[]) => {
    setFiles(updatedFiles);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
    } catch (e: any) {
      console.error("Failed to write to local storage:", e);
      if (e.name === "QuotaExceededError" || e.code === 22) {
        setGlobalError("Storage quota exceeded. Older cached file records trimmed.");
        const trimmed = updatedFiles.map((f, i) =>
          i > 1 ? { ...f, base64Data: undefined, excelSheets: undefined } : f
        );
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        } catch {
          // ignore
        }
      }
    }
  };

  // Get current active file
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || null;
  }, [files, activeFileId]);

  // Handle uploading/reading a file
  const handleFileLoaded = async (fileData: {
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
  }) => {
    setGlobalError(null);
    setIsAnalyzing(true);
    setActiveTab("dashboard");

    const newFileId = `file-${Date.now()}`;
    const newFile: UploadedFile = {
      id: newFileId,
      name: fileData.name,
      size: fileData.size,
      type: fileData.type,
      content: fileData.content,
      base64Data: fileData.base64Data,
      isImage: fileData.isImage,
      isVideo: fileData.isVideo,
      isPdf: fileData.isPdf,
      isExcel: fileData.isExcel,
      excelSheets: fileData.excelSheets,
      imageDimensions: fileData.imageDimensions,
      uploadedAt: new Date().toISOString(),
      chatHistory: [],
    };

    const updatedFilesList = [newFile, ...files];
    setFiles(updatedFilesList);
    setActiveFileId(newFileId);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: fileData.name,
          fileType: fileData.type,
          fileContent: fileData.content,
          isImage: fileData.isImage,
          isVideo: fileData.isVideo,
          isPdf: fileData.isPdf,
          isExcel: fileData.isExcel,
          excelSheets: fileData.excelSheets,
          base64Data: fileData.base64Data,
          imageDimensions: fileData.imageDimensions,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Server returned ${response.status}`);
      }

      const analysisResult: FileAnalysis = await response.json();

      // Custom welcome assistant message
      const getWelcomeMessage = (f: UploadedFile) => {
        if (f.isExcel) {
          const sheetCount = f.excelSheets?.length || 1;
          return `I've analyzed the Excel workbook \`${f.name}\` (${sheetCount} sheet${sheetCount > 1 ? "s" : ""})! Explore the multi-sheet spreadsheet grid, column statistical distributions, and calculated KPI formulas in the Dashboard and Preview tabs, or ask me for custom Excel formulas, filters, or variance insights!`;
        }
        if (f.isPdf) {
          return `I've analyzed the PDF document \`${f.name}\`! I classified it as **${analysisResult.documentType || "PDF Document"}**. Explore the forensic summary, key sections, and extracted OCR text in the Dashboard and Preview tabs, or ask me any question about clauses, numbers, or terms!`;
        }
        if (f.isImage) {
          const isPng = f.name.toLowerCase().endsWith(".png");
          const isJpg = f.name.toLowerCase().endsWith(".jpg") || f.name.toLowerCase().endsWith(".jpeg");
          const typeName = isPng ? "PNG Graphic" : isJpg ? "JPG Photograph" : "Image";
          return `I've analyzed the ${typeName} \`${f.name}\`! I extracted the dominant color palette (${analysisResult.dominantColors?.length || 0} colors), performed OCR text recognition, and inspected visual composition. Check the Preview and Dashboard tabs to review details!`;
        }
        if (f.isVideo) {
          return `I've analyzed the video \`${f.name}\`! Explore key scenes, visual pacing, audio dynamics, and timestamps in the Dashboard, view the video in the Preview tab, or ask me questions about any moment in the video.`;
        }
        return `I've analyzed \`${f.name}\` successfully! You can explore technical summary insights in the Dashboard, view data or code in the Preview, or chat with me right here.`;
      };

      const finalizedFiles = updatedFilesList.map((f) => {
        if (f.id === newFileId) {
          return {
            ...f,
            analysis: analysisResult,
            chatHistory: [
              {
                id: `chat-${Date.now()}-init`,
                role: "assistant",
                content: getWelcomeMessage(f),
                timestamp: new Date().toISOString(),
              },
            ],
          };
        }
        return f;
      });

      saveFiles(finalizedFiles);
    } catch (error: any) {
      console.error("Upload/Analysis Error:", error);
      setGlobalError(`Analysis failed: ${error.message || "Unknown error"}. Displaying raw file preview.`);

      const fallbackAnalysis: FileAnalysis = {
        summary: "I parsed your file, but wasn't able to complete the Gemini analysis. You can still review the file's raw layout in the Preview tab or discuss it here.",
        fileTypeDetails: fileData.type || "Document",
        quickStats: [
          { label: "File Size", value: (fileData.size / 1024).toFixed(1), unit: "KB" },
          { label: "Status", value: "Unverified", unit: "" },
        ],
        primaryInsights: [
          {
            title: "Analysis Notice",
            description: "The Gemini analysis request failed. You can inspect the document or image directly in the Preview tab.",
            category: "Anomaly",
          },
        ],
        suggestedPrompts: ["Can you attempt to analyze this file structure again?"],
      };

      const fallbackFiles = updatedFilesList.map((f) => {
        if (f.id === newFileId) {
          return {
            ...f,
            analysis: fallbackAnalysis,
          };
        }
        return f;
      });
      saveFiles(fallbackFiles);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Chat message send handler with Multimodal & Excel Grounding
  const handleSendMessage = async (content: string) => {
    if (!activeFile) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...activeFile.chatHistory, userMsg];

    const tempFiles = files.map((f) => {
      if (f.id === activeFileId) {
        return { ...f, chatHistory: updatedHistory };
      }
      return f;
    });
    setFiles(tempFiles);
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          history: activeFile.chatHistory,
          fileContext: {
            fileName: activeFile.name,
            fileType: activeFile.type,
            summary: activeFile.analysis?.summary || "",
            documentType: activeFile.analysis?.documentType || "",
            extractedText: activeFile.analysis?.extractedText || "",
            content: activeFile.isImage || activeFile.isVideo || activeFile.isPdf ? "" : activeFile.content,
            isVideo: activeFile.isVideo,
            isImage: activeFile.isImage,
            isPdf: activeFile.isPdf,
            isExcel: activeFile.isExcel,
            base64Data: activeFile.base64Data,
          },
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Server status ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toISOString(),
      };

      const finalFiles = files.map((f) => {
        if (f.id === activeFileId) {
          return {
            ...f,
            chatHistory: [...updatedHistory, assistantMsg],
          };
        }
        return f;
      });
      saveFiles(finalFiles);
    } catch (error: any) {
      console.error("Chat Error:", error);
      const systemErrorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Error communicating with AI: ${error.message || "Failed to process chat request"}. Please verify your network and credentials.`,
        timestamp: new Date().toISOString(),
      };

      const errorFiles = files.map((f) => {
        if (f.id === activeFileId) {
          return {
            ...f,
            chatHistory: [...updatedHistory, systemErrorMsg],
          };
        }
        return f;
      });
      setFiles(errorFiles);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectFile = (id: string) => {
    setActiveFileId(id);
    setGlobalError(null);
  };

  const handleDeleteFile = (id: string) => {
    const filtered = files.filter((f) => f.id !== id);
    saveFiles(filtered);
    if (activeFileId === id) {
      setActiveFileId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete all upload histories?")) {
      saveFiles([]);
      setActiveFileId(null);
    }
  };

  // Get current active file badge label
  const getActiveFileBadge = () => {
    if (!activeFile) return null;
    const ext = activeFile.name.split(".").pop()?.toUpperCase() || "";
    if (activeFile.isExcel || ext === "XLSX" || ext === "XLS" || activeFile.type.includes("spreadsheet")) {
      return (
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1">
          <FileSpreadsheet className="w-3 h-3" />
          <span>Excel Workbook</span>
        </span>
      );
    }
    if (activeFile.isPdf || ext === "PDF") {
      return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-mono">PDF Document</span>;
    }
    if (ext === "JPG" || ext === "JPEG") {
      return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-mono">JPG Photo</span>;
    }
    if (ext === "PNG") {
      return <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[10px] font-mono">PNG Graphic</span>;
    }
    return <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono">{ext || "File"}</span>;
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col text-slate-200" id="app-root">
      {/* Decorative ambient blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* TOP POLISHED HEADER BAR */}
      <header className="sticky top-0 z-40 bg-[#070a13]/85 backdrop-blur-md border-b border-slate-900 px-6 py-3.5 flex items-center justify-between" id="app-header">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-100 font-sans">
                Universal File Analyzer
              </h1>
              <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono">
                <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">XLSX</span>
                <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.2 rounded">PDF</span>
                <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">JPG</span>
                <span className="text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.2 rounded">PNG</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium font-mono mt-0.5">
              Powered by Gemini 3.8 Flash • Excel Spreadsheets, PDFs, Images & Media Auditing
            </p>
          </div>
        </div>

        {activeFile && (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-950/80 px-3 py-1.5 rounded-full border border-slate-850">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate max-w-[180px] font-medium text-slate-200">{activeFile.name}</span>
            {getActiveFileBadge()}
          </div>
        )}
      </header>

      {/* GLOBAL ERROR BANNER */}
      {globalError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-xl flex items-start gap-2.5 animate-fade-in" id="global-error-banner">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Notice</p>
            <p className="mt-1 text-slate-400 leading-relaxed">{globalError}</p>
          </div>
          <button onClick={() => setGlobalError(null)} className="text-red-400 hover:text-red-300 font-mono text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN CONTAINER LAYOUT */}
      <main className="flex-1 px-6 py-6 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full min-h-0" id="main-content-area">
        
        {/* LEFT COLUMN: UPLOADER & HISTORY LIST */}
        <aside className="w-full lg:w-76 flex flex-col gap-6 shrink-0" id="sidebar-layout">
          {/* File Uploader widget */}
          <div className="bg-slate-950/60 border border-slate-900 p-4.5 rounded-2xl shadow-xl flex flex-col gap-3.5">
            <h3 className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-mono flex items-center justify-between">
              <span>Upload & Analyze</span>
              <span className="text-[10px] text-emerald-400 font-normal">Excel • PDF • JPG • PNG</span>
            </h3>
            <FileUploader onFileLoaded={handleFileLoaded} isAnalyzing={isAnalyzing} />
          </div>

          {/* History Widget */}
          <div className="flex-1 bg-slate-950/60 border border-slate-900 p-4.5 rounded-2xl shadow-xl flex flex-col justify-between min-h-[280px] lg:min-h-0">
            <HistoryList
              files={files}
              activeFileId={activeFileId}
              onSelectFile={handleSelectFile}
              onDeleteFile={handleDeleteFile}
              onClearAll={handleClearAll}
            />
          </div>
        </aside>

        {/* RIGHT COLUMN: PREVIEW, DASHBOARD & CHAT WORKSPACE */}
        <section className="flex-1 flex flex-col gap-6 min-w-0" id="main-workspace">
          {!activeFile ? (
            <div className="flex-1 bg-slate-950/20 border border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center p-8 text-center min-h-[350px]" id="empty-workspace-state">
              <Upload className="w-12 h-12 text-slate-600 mb-4 animate-bounce" />
              <h2 className="text-lg font-bold text-slate-300">No active analyzed file</h2>
              <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                Upload an Excel workbook, PDF document, JPG photograph, PNG graphic, dataset, or video in the left panel, or click an instant sample to begin forensic analysis.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-5 min-h-0">
              
              {/* MOBILE ONLY NAVIGATION TABS */}
              <div className="flex lg:hidden bg-slate-950 p-1 rounded-xl border border-slate-900 text-xs font-mono" id="mobile-tabs-bar">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === "dashboard" ? "bg-slate-800 text-emerald-400 font-semibold" : "text-slate-400"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("viewer")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === "viewer" ? "bg-slate-800 text-emerald-400 font-semibold" : "text-slate-400"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === "chat" ? "bg-slate-800 text-emerald-400 font-semibold" : "text-slate-400"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </button>
              </div>

              {/* DESKTOP SPLIT AND MOBILE VIEWER STACK */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0" id="desktop-grid-layout">
                
                {/* MIDDLE CONTAINER: METRICS + PREVIEW VIEWER */}
                <div className={`col-span-1 lg:col-span-7 flex flex-col gap-6 min-h-0 ${activeTab !== "dashboard" && activeTab !== "viewer" ? "hidden lg:flex" : "flex"}`}>
                  
                  {/* File Visual Content Preview */}
                  <div className={`transition-all duration-200 ${activeTab === "viewer" ? "flex flex-1 flex-col" : "hidden lg:flex lg:h-[45%] shrink-0"}`} id="viewer-panel-wrapper">
                    <FileViewer file={activeFile} />
                  </div>

                  {/* Summary & Analytical Insights */}
                  <div className={`overflow-y-auto pr-1 ${activeTab === "dashboard" ? "flex-1" : "hidden lg:flex lg:h-[55%] lg:overflow-y-auto"}`} id="dashboard-panel-wrapper">
                    {activeFile.analysis ? (
                      <AnalysisDashboard
                        analysis={activeFile.analysis}
                        onSelectPrompt={handleSendMessage}
                      />
                    ) : (
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center py-12">
                        <RefreshCw className="w-8 h-8 text-slate-500 animate-spin mb-3" />
                        <p className="text-sm font-semibold text-slate-400">Loading Analysis Insights...</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs">Connecting to Gemini for deep inspection.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT CONTAINER: INTERACTIVE CHAT PANEL */}
                <div className={`col-span-1 lg:col-span-5 flex flex-col min-h-0 ${activeTab !== "chat" ? "hidden lg:flex" : "flex"}`} id="chat-panel-wrapper">
                  <ChatAssistant
                    chatHistory={activeFile.chatHistory}
                    onSendMessage={handleSendMessage}
                    isSending={isSending}
                    suggestedPrompts={activeFile.analysis?.suggestedPrompts}
                  />
                </div>

              </div>
            </div>
          )}
        </section>

      </main>

      {/* FOOTER */}
      <footer className="py-3.5 text-center text-[10px] text-slate-600 border-t border-slate-950 font-mono mt-auto" id="app-footer">
        Universal File Analyzer • Excel (.xlsx), PDF, JPG, PNG & Media Auditing • Gemini 3.8 Flash Engine
      </footer>
    </div>
  );
}
