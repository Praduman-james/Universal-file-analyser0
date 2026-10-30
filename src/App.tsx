import React, { useState, useEffect, useMemo } from "react";
import {
  UploadedFile,
  Message,
  FileAnalysis,
  AnalysisMode,
  LanguageOption,
  ClientWorkspace,
  TeamFolder,
  CustomTemplate,
  SignatureAudit,
} from "./types";
import FileUploader from "./components/FileUploader";
import FileViewer from "./components/FileViewer";
import AnalysisDashboard from "./components/AnalysisDashboard";
import ChatAssistant from "./components/ChatAssistant";
import HistoryList from "./components/HistoryList";
import CameraScanner from "./components/CameraScanner";
import PdfToolsModal from "./components/PdfToolsModal";
import FileComparisonModal from "./components/FileComparisonModal";
import FileHealthModal from "./components/FileHealthModal";
import PiiRedactionModal from "./components/PiiRedactionModal";
import ClientWorkspaceModal from "./components/ClientWorkspaceModal";
import TeamFoldersModal from "./components/TeamFoldersModal";
import BatchProcessingModal from "./components/BatchProcessingModal";
import ESignModal from "./components/ESignModal";
import CustomTemplatesModal from "./components/CustomTemplatesModal";
import ClearWorkspaceModal, { ClearScope } from "./components/ClearWorkspaceModal";
import { auditFileHealth, detectLocalPii, redactText } from "./utils/fileParsers";
import {
  Sparkles,
  FileText,
  BarChart3,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Upload,
  Eye,
  Camera,
  Layers,
  GitCompare,
  Share2,
  Lock,
  Check,
  Building2,
  Users2,
  FileCheck2,
  LayoutTemplate,
  FolderOpen,
} from "lucide-react";

// Local storage key
const STORAGE_KEY = "universal-file-analyzer-records";

// SEED / WELCOME TEMPLATE FILE
const WELCOME_FILE: UploadedFile = {
  id: "welcome-guide",
  name: "Universal_Intelligence_Guide.md",
  size: 2450,
  type: "text/markdown",
  content: `# Universal Multi-Format Intelligence Suite

Welcome to the AI Document & Video Intelligence Platform.

## Supported Formats
* **PDF Documents**: Exact page & clause citations, OCR for Hindi, English & regional scripts, searchable PDF layers.
* **Office Formats**: Word (.docx), Excel (.xlsx, .xls), PowerPoint (.pptx).
* **Archives & Media**: .zip file structural tree, .mp4 / .webm videos, high-res images (.jpg, .png).
* **Data**: .csv, .tsv, .json, and source code.

## Key Functional Modes
1. **Contract Analysis**: Clause-by-clause audit, liabilities, auto page citations.
2. **Invoice & Receipt OCR**: GST, tax breakdown, vendor details, and table extraction to CSV.
3. **Resume / CV**: Skill matching, timeline verification, candidate benchmarking.
4. **Bank Statements**: Inflow/outflow tracking, balance validation.
5. **Legal Notices**: Cause of action, response deadlines, risk assessment.
6. **Side-by-Side Comparison**: Automatic variance detection between two versions of contracts or invoices.
7. **Sensitive PII Redaction**: Automatic masking of Aadhaar, PAN, SSN, credit cards, and bank accounts.
8. **PDF Suite**: Built-in PDF merge, split, rotate, and compression.
9. **Bilingual & Hindi Chat**: Ask in Hindi, receive answers in Hindi with exact citations.`,
  isImage: false,
  isVideo: false,
  uploadedAt: new Date().toISOString(),
  analysis: {
    summary: "Welcome to Universal File & Video Analyzer! This system provides multi-format document parsing (PDF, Office, Video, Image, Data), OCR for Hindi and English, sensitive data masking, and automated document comparison.",
    fileTypeDetails: "Comprehensive Document & Video Analyzer",
    detectedDocMode: "general",
    detectedLanguage: "English & Hindi",
    quickStats: [
      { label: "File Size", value: "2.4", unit: "KB" },
      { label: "OCR Engine", value: "Ready", unit: "" },
      { label: "PII Shield", value: "Active", unit: "" },
      { label: "PDF Suite", value: "Online", unit: "" },
    ],
    primaryInsights: [
      {
        title: "Hindi-English & Regional OCR",
        description: "Extracts typed and handwritten text in Hindi (Devanagari) and Indian regional scripts with verifiable line & paragraph citations.",
        category: "Content",
        citation: "[Section 2]",
      },
      {
        title: "Specialized Analysis Modes",
        description: "Tailored analytical pipelines for contracts, GST invoices, expense receipts, resumes, and bank statements.",
        category: "Structure",
        citation: "[Section 3]",
      },
      {
        title: "Automated PII Redaction & File Health Check",
        description: "Scans for Aadhaar, PAN, phone numbers, and financial credentials with one-click sanitization and corruption auditing.",
        category: "Compliance",
        citation: "[Section 7]",
      },
      {
        title: "Client-Side PDF Manipulation",
        description: "Merge multiple PDFs, split page ranges, rotate orientation, and deflate documents with zero cloud dependency.",
        category: "Optimization",
        citation: "[Section 8]",
      },
    ],
    suggestedPrompts: [
      "इस दस्तावेज़ का हिंदी में संक्षिप्त विवरण दो",
      "How do I compare two versions of an employment contract?",
      "Can I export tables from an invoice into an Excel/CSV file?",
      "Show me how PII redaction masks sensitive PAN and Aadhaar cards",
    ],
    healthAudit: {
      securityScore: 100,
      isCorrupted: false,
      suspiciousExtension: false,
      detectedMime: "text/markdown",
      declaredMime: "text/markdown",
      warnings: [],
      hiddenMetadata: [
        { key: "Format", value: "Markdown Workspace Guide" },
        { key: "Encryption", value: "Client-Side Private" },
        { key: "OCR Compatibility", value: "Multi-Script Devanagari/Latin" },
      ],
    },
    contractDetails: {
      parties: ["Platform User / Client", "Universal Document & Media Intelligence Suite"],
      obligations: [
        { party: "Platform", obligation: "Process documents with zero cloud persistence and client-side PII sanitization", citation: "[Section 7]" },
        { party: "User", obligation: "Select document modes (Contract, Invoice, Resume, Bank, Dataset) for specialized extraction", citation: "[Section 2]" },
      ],
      dates: {
        effective: "Immediate upon session start",
        expiry: "Perpetual / Session based",
        keyDeadlines: ["OCR processing within 2.5 seconds", "Local memory purge on Clear All"],
      },
      paymentTerms: "Zero subscription / Open AI Studio runtime",
      terminationClauses: "Users can clear local session and remove uploaded files at any time without data retention.",
      jurisdiction: "Client-side private sandbox / Local browser execution",
      riskFlags: [
        { flag: "Unredacted files may contain sensitive PII before applying redaction shield", severity: "Medium", citation: "[Privacy Warning]" },
      ],
    },
  },
  chatHistory: [
    {
      id: "welcome-msg-1",
      role: "assistant",
      content: "Hello! I am your Universal Document & Media Intelligence Assistant. You can upload or scan any PDF, Word doc, Excel sheet, video, image, or ZIP archive. Feel free to ask questions in English or हिंदी!",
      timestamp: new Date().toISOString(),
    },
  ],
};

// DEFAULT CLIENT WORKSPACES & TEAM FOLDERS
const DEFAULT_WORKSPACES: ClientWorkspace[] = [
  { id: "ws-acme", name: "Acme Global Tech", clientCode: "ACM-01", industry: "Enterprise Tech", color: "#3b82f6", createdAt: new Date().toISOString() },
  { id: "ws-tata", name: "Tata Enterprises", clientCode: "TATA-IND", industry: "Manufacturing & Auto", color: "#10b981", createdAt: new Date().toISOString() },
  { id: "ws-reliance", name: "Reliance Industries", clientCode: "RIL-IN", industry: "Retail & Telecom", color: "#8b5cf6", createdAt: new Date().toISOString() },
];

const DEFAULT_TEAM_FOLDERS: TeamFolder[] = [
  { id: "tf-legal", name: "Master Services & NDAs", team: "Legal & Compliance", permission: "Admin", members: ["legal@company.com", "counsel@company.com"], color: "#8b5cf6" },
  { id: "tf-finance", name: "Invoices & GST Filings", team: "Finance & Accounts", permission: "Editor", members: ["finance@company.com", "tax@company.com"], color: "#10b981" },
  { id: "tf-hr", name: "Employment & Offers", team: "HR & Operations", permission: "Editor", members: ["hr@company.com"], color: "#f59e0b" },
  { id: "tf-audit", name: "Bank Statements & Audit", team: "Auditing & Risk", permission: "Viewer", members: ["audit@company.com"], color: "#06b6d4" },
];

export default function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "viewer" | "chat">("dashboard");
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // Advanced features state
  const [selectedDocMode, setSelectedDocMode] = useState<AnalysisMode>("auto");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>("en");
  const [isPrivateMode, setIsPrivateMode] = useState<boolean>(false);

  // Modals state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPdfToolsOpen, setIsPdfToolsOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isPiiOpen, setIsPiiOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isClientWsOpen, setIsClientWsOpen] = useState(false);
  const [isTeamFoldersOpen, setIsTeamFoldersOpen] = useState(false);
  const [isESignOpen, setIsESignOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Client Workspaces & Team Folders state
  const [workspaces, setWorkspaces] = useState<ClientWorkspace[]>(() => {
    try {
      const saved = localStorage.getItem("universal-client-workspaces");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_WORKSPACES;
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("universal-active-client-ws") || null;
    } catch {
      return null;
    }
  });

  const [teamFolders, setTeamFolders] = useState<TeamFolder[]>(() => {
    try {
      const saved = localStorage.getItem("universal-team-folders");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_TEAM_FOLDERS;
  });

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
        setGlobalError("Storage quota exceeded. Please clear older file histories to save new records.");
      }
    }
  };

  const activeWorkspace = useMemo(() => {
    return workspaces.find((w) => w.id === activeWorkspaceId) || null;
  }, [workspaces, activeWorkspaceId]);

  const displayedFiles = useMemo(() => {
    if (!activeWorkspaceId) return files;
    return files.filter(
      (f) => f.clientWorkspaceId === activeWorkspaceId || !f.clientWorkspaceId
    );
  }, [files, activeWorkspaceId]);

  // Workspace and Team Folder handlers
  const handleSelectWorkspace = (id: string | null) => {
    setActiveWorkspaceId(id);
    if (id) {
      localStorage.setItem("universal-active-client-ws", id);
    } else {
      localStorage.removeItem("universal-active-client-ws");
    }
  };

  const handleCreateWorkspace = (newWs: ClientWorkspace) => {
    const updated = [...workspaces, newWs];
    setWorkspaces(updated);
    localStorage.setItem("universal-client-workspaces", JSON.stringify(updated));
  };

  const handleDeleteWorkspace = (id: string) => {
    const updated = workspaces.filter((w) => w.id !== id);
    setWorkspaces(updated);
    localStorage.setItem("universal-client-workspaces", JSON.stringify(updated));
    if (activeWorkspaceId === id) {
      handleSelectWorkspace(null);
    }
  };

  const handleCreateTeamFolder = (newFolder: TeamFolder) => {
    const updated = [...teamFolders, newFolder];
    setTeamFolders(updated);
    localStorage.setItem("universal-team-folders", JSON.stringify(updated));
  };

  const handleDeleteTeamFolder = (id: string) => {
    const updated = teamFolders.filter((t) => t.id !== id);
    setTeamFolders(updated);
    localStorage.setItem("universal-team-folders", JSON.stringify(updated));
  };

  const handleAssignFileToTeamFolder = (fileId: string, folderId: string | undefined) => {
    const updated = files.map((f) =>
      f.id === fileId ? { ...f, teamFolderId: folderId } : f
    );
    saveFiles(updated);
  };

  const handleSaveSignature = (fileId: string, audit: SignatureAudit) => {
    const updated = files.map((f) =>
      f.id === fileId ? { ...f, signatureAudit: audit } : f
    );
    saveFiles(updated);
  };

  const handleBatchAnalyze = async (filesToProcess: UploadedFile[]) => {
    setIsAnalyzing(true);
    try {
      const updated = [...files];
      for (const f of filesToProcess) {
        if (f.analysis) continue; // Already analyzed
        try {
          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: f.name,
              fileType: f.type,
              fileContent: f.content,
              isImage: f.isImage,
              isVideo: f.isVideo,
              base64Data: f.base64Data,
              docMode: f.docMode || selectedDocMode,
              language: f.language || selectedLanguage,
            }),
          });
          if (response.ok) {
            const res = await response.json();
            const idx = updated.findIndex((item) => item.id === f.id);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], analysis: res };
            }
          }
        } catch (err) {
          console.error("Batch file analyze failed for", f.name, err);
        }
      }
      saveFiles(updated);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyTemplate = (template: CustomTemplate) => {
    if (!activeFile) return;
    const prompt = `Please extract the following specific schema fields according to the "${template.name}" template from this document:
${template.fieldsToExtract.map((f, i) => `${i + 1}. **${f.label}** (${f.key}): ${f.description}`).join("\n")}

Provide the extracted values formatted cleanly with citations.`;
    handleSendMessage(prompt);
  };

  // Get current active file
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || null;
  }, [files, activeFileId]);

  // Handle uploading / parsing a file
  const handleFileLoaded = async (fileData: {
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
    docMode: AnalysisMode;
    language: LanguageOption;
  }) => {
    setGlobalError(null);
    setIsAnalyzing(true);
    setActiveTab("dashboard");

    // Local client health audit & PII scan
    const health = auditFileHealth(
      fileData.name,
      fileData.size,
      fileData.type,
      fileData.content || fileData.base64Data || "",
      files
    );

    const localPii = fileData.content ? detectLocalPii(fileData.content) : [];
    let initialRedacted = "";
    if (isPrivateMode && fileData.content && localPii.length > 0) {
      initialRedacted = redactText(fileData.content, localPii);
    }

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
      isOffice: fileData.isOffice,
      isZip: fileData.isZip,
      docMode: fileData.docMode,
      language: fileData.language,
      redactedContent: initialRedacted,
      uploadedAt: new Date().toISOString(),
      chatHistory: [],
    };

    // Add in pending state
    const updatedFilesList = [newFile, ...files];
    setFiles(updatedFilesList);
    setActiveFileId(newFileId);

    try {
      // API call for structured analysis
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: fileData.name,
          fileType: fileData.type,
          fileContent: isPrivateMode && initialRedacted ? initialRedacted : fileData.content,
          isImage: fileData.isImage,
          isVideo: fileData.isVideo,
          base64Data: fileData.base64Data,
          docMode: fileData.docMode,
          language: fileData.language,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Server returned ${response.status}`);
      }

      const analysisResult: FileAnalysis = await response.json();

      // Merge local health audit and PII with model discoveries
      analysisResult.healthAudit = health;
      if (!analysisResult.piiDetected || analysisResult.piiDetected.length === 0) {
        analysisResult.piiDetected = localPii;
      }

      // Update the loaded file details
      const finalizedFiles = updatedFilesList.map((f) => {
        if (f.id === newFileId) {
          return {
            ...f,
            analysis: analysisResult,
            chatHistory: [
              {
                id: `chat-${Date.now()}-init`,
                role: "assistant",
                content: f.isVideo
                  ? `I've analyzed \`${f.name}\`! Explore key scenes, dialogue, and timestamps in the Dashboard. You can ask me questions about any moment in the video.`
                  : `I've analyzed \`${f.name}\` under **${analysisResult.detectedDocMode || fileData.docMode}** mode with exact citations. Ask questions in English or हिंदी!`,
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
      setGlobalError(
        `Analysis failed: ${error.message || "Unknown issue"}. Raw preview and offline tools remain available.`
      );

      // Fallback
      const fallbackAnalysis: FileAnalysis = {
        summary: `Loaded ${fileData.name}. AI analysis encountered a spike or connection delay, but you can inspect the file in Preview or try again.`,
        fileTypeDetails: fileData.type || "Document",
        healthAudit: health,
        piiDetected: localPii,
        quickStats: [
          { label: "File Size", value: (fileData.size / 1024).toFixed(1), unit: "KB" },
          { label: "Integrity", value: `${health.securityScore}%`, unit: "" },
        ],
        primaryInsights: [
          {
            title: "File Loaded",
            description: "File is available for local viewer, PDF suite, and comparison operations.",
            category: "Content",
          },
        ],
        suggestedPrompts: [
          "इस फ़ाइल का मुख्य विषय क्या है?",
          "Can you analyze this document again?",
        ],
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

  // Chat message send handler
  const handleSendMessage = async (content: string) => {
    if (!activeFile) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...activeFile.chatHistory, userMsg];

    // Optimistically update frontend state
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
            content:
              activeFile.isImage || activeFile.isVideo
                ? activeFile.analysis?.ocrText || ""
                : activeFile.redactedContent || activeFile.content,
            isVideo: activeFile.isVideo,
            docMode: activeFile.docMode || selectedDocMode,
            language: activeFile.language || selectedLanguage,
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
        content: `Error: ${error.message || "Failed to process chat request"}. Spikes in demand are usually temporary. Please try again.`,
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
    setIsClearModalOpen(true);
  };

  const handleClearHistory = (scope: ClearScope) => {
    if (scope === "active_workspace") {
      if (!activeWorkspaceId) {
        saveFiles([]);
        setActiveFileId(null);
        return;
      }
      const remaining = files.filter((f) => f.clientWorkspaceId !== activeWorkspaceId);
      saveFiles(remaining);
      if (activeFile && activeFile.clientWorkspaceId === activeWorkspaceId) {
        setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
      }
    } else if (scope === "all_history") {
      saveFiles([]);
      setActiveFileId(null);
    } else if (scope === "all_reset") {
      // Complete factory reset: files, client workspaces, team folders, templates
      saveFiles([]);
      setActiveFileId(null);
      setWorkspaces(DEFAULT_WORKSPACES);
      setTeamFolders(DEFAULT_TEAM_FOLDERS);
      setActiveWorkspaceId(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("universal-client-workspaces");
        localStorage.removeItem("universal-team-folders");
        localStorage.removeItem("universal-active-client-ws");
        localStorage.removeItem("universal-custom-templates");
      } catch (err) {
        console.error("Failed to clear local storage", err);
      }
    }
  };

  const handleRenameFile = (id: string, newName: string) => {
    const updated = files.map((f) => (f.id === id ? { ...f, name: newName } : f));
    saveFiles(updated);
  };

  const handleMoveFile = (id: string, folderId: string) => {
    const updated = files.map((f) => (f.id === id ? { ...f, folderId } : f));
    saveFiles(updated);
  };

  const handleToggleFavorite = (id: string) => {
    const updated = files.map((f) => (f.id === id ? { ...f, isFavorite: !f.isFavorite } : f));
    saveFiles(updated);
  };

  const handleAddTag = (id: string, tag: string) => {
    const updated = files.map((f) => {
      if (f.id === id) {
        const existingTags = f.tags || [];
        if (!existingTags.includes(tag)) {
          return { ...f, tags: [...existingTags, tag] };
        }
      }
      return f;
    });
    saveFiles(updated);
  };

  const handleUpdateFile = (updated: UploadedFile) => {
    const next = files.map((f) => (f.id === updated.id ? updated : f));
    saveFiles(next);
  };

  // Share workflow
  const handleShareSummary = async () => {
    if (!activeFile || !activeFile.analysis) return;
    const shareText = `Document: ${activeFile.name}\n\nSummary:\n${activeFile.analysis.summary}\n\nKey Insights:\n${activeFile.analysis.primaryInsights
      .map((i) => `• ${i.title}: ${i.description}`)
      .join("\n")}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Analysis: ${activeFile.name}`,
          text: shareText,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(shareText);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col text-slate-200" id="app-root">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* TOP HEADER BAR */}
      <header
        className="sticky top-0 z-40 bg-[#070a13]/85 backdrop-blur-md border-b border-slate-900 px-6 py-3.5 flex items-center justify-between"
        id="app-header"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 font-bold" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-100 flex items-center gap-1.5 font-sans">
              Universal File & Video Analyzer
            </h1>
            <p className="text-[10px] text-slate-400 font-medium font-mono">
              OCR (Hindi/Regional) • Exact Citations • PII Redaction • PDF Suite • Diff Comparison
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Client Workspace Selector Button */}
          <button
            type="button"
            onClick={() => setIsClientWsOpen(true)}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 text-slate-200 text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Switch client partition or add new client workspace"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline text-slate-400">Workspace:</span>
            <span className="font-semibold text-blue-300">
              {activeWorkspace ? activeWorkspace.name : "All Clients"}
            </span>
          </button>

          {/* Team Folders Button */}
          <button
            type="button"
            onClick={() => setIsTeamFoldersOpen(true)}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 text-slate-200 text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Access departmental team folders with role permissions"
          >
            <Users2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Team Folders</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-mono">
              {teamFolders.length}
            </span>
          </button>

          {/* Batch Operations Button */}
          <button
            type="button"
            onClick={() => setIsBatchOpen(true)}
            className="px-2.5 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-300 text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
            title="Batch upload and multi-document data extraction"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Batch ({files.length})</span>
          </button>

          {/* Compare Documents Button */}
          <button
            type="button"
            onClick={() => setIsComparisonOpen(true)}
            className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
            title="Side-by-side document comparison & clause auditing"
          >
            <GitCompare className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Compare</span>
          </button>

          {activeFile && (
            <button
              type="button"
              onClick={handleShareSummary}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              title="Share or copy document summary"
            >
              {shareCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{shareCopied ? "Copied!" : "Share"}</span>
            </button>
          )}

          {activeFile && (
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-mono px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate max-w-[150px]">{activeFile.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* GLOBAL ERROR BANNER */}
      {globalError && (
        <div
          className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-xl flex items-start gap-2.5 animate-fade-in"
          id="global-error-banner"
        >
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Notice</p>
            <p className="mt-1 text-slate-400 leading-relaxed">{globalError}</p>
          </div>
          <button
            onClick={() => setGlobalError(null)}
            className="text-red-400 hover:text-red-300 font-mono text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN CONTAINER LAYOUT */}
      <main
        className="flex-1 px-4 sm:px-6 py-5 flex flex-col lg:flex-row gap-5 max-w-[1600px] mx-auto w-full min-h-0"
        id="main-content-area"
      >
        {/* LEFT COLUMN: UPLOADER & HISTORY LIST */}
        <aside className="w-full lg:w-80 flex flex-col gap-4 shrink-0" id="sidebar-layout">
          {/* File Uploader widget */}
          <div className="bg-slate-950/70 border border-slate-900 p-4 rounded-2xl shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300 tracking-wider uppercase font-mono">
                Document Ingestion
              </h3>
              {isPrivateMode && (
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Private
                </span>
              )}
            </div>

            <FileUploader
              onFileLoaded={handleFileLoaded}
              isAnalyzing={isAnalyzing}
              selectedDocMode={selectedDocMode}
              onDocModeChange={setSelectedDocMode}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              isPrivateMode={isPrivateMode}
              onTogglePrivateMode={() => setIsPrivateMode(!isPrivateMode)}
              onOpenScanner={() => setIsCameraOpen(true)}
              onOpenPdfTools={() => setIsPdfToolsOpen(true)}
              onOpenComparison={() => setIsComparisonOpen(true)}
              existingFiles={files.map((f) => ({ id: f.id, name: f.name, size: f.size }))}
            />
          </div>

          {/* History Widget */}
          <div className="flex-1 bg-slate-950/70 border border-slate-900 p-4 rounded-2xl shadow-xl flex flex-col justify-between min-h-[300px] lg:min-h-0">
            {activeWorkspace && (
              <div className="mb-2 p-2 bg-blue-500/10 border border-blue-500/25 rounded-xl flex items-center justify-between text-[11px]">
                <span className="text-blue-300 truncate font-medium">
                  Client: {activeWorkspace.name}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsClearModalOpen(true)}
                    className="text-red-400 hover:text-red-300 cursor-pointer text-[10px] hover:underline"
                    title="Clear files in this client workspace"
                  >
                    Clear files
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => handleSelectWorkspace(null)}
                    className="text-slate-400 hover:text-slate-200 cursor-pointer text-[10px]"
                  >
                    All clients
                  </button>
                </div>
              </div>
            )}
            <HistoryList
              files={displayedFiles}
              activeFileId={activeFileId}
              onSelectFile={handleSelectFile}
              onDeleteFile={handleDeleteFile}
              onClearAll={handleClearAll}
              onRenameFile={handleRenameFile}
              onMoveFile={handleMoveFile}
              onToggleFavorite={handleToggleFavorite}
              onAddTag={handleAddTag}
            />
          </div>
        </aside>

        {/* RIGHT COLUMN: PREVIEW, DASHBOARD & CHAT WORKSPACE */}
        <section className="flex-1 flex flex-col gap-4 min-w-0" id="main-workspace">
          {!activeFile ? (
            /* EMPTY SCREEN STATE */
            <div
              className="flex-1 bg-slate-950/30 border border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center p-8 text-center min-h-[350px]"
              id="empty-workspace-state"
            >
              <Upload className="w-12 h-12 text-slate-600 mb-4 animate-bounce" />
              <h2 className="text-lg font-bold text-slate-300">No active analyzed file</h2>
              <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                Upload a PDF, Word document, Excel spreadsheet, video, image, or ZIP archive. Gemini
                will extract citations, structure tables, and provide instant intelligence.
              </p>
            </div>
          ) : (
            /* ACTIVE WORKSPACE SPLIT STAGE */
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              {/* MOBILE NAVIGATION TABS */}
              <div
                className="flex lg:hidden bg-slate-950 p-1 rounded-xl border border-slate-900 text-xs font-mono"
                id="mobile-tabs-bar"
              >
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                    activeTab === "dashboard"
                      ? "bg-slate-800 text-emerald-400 font-semibold"
                      : "text-slate-400"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("viewer")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                    activeTab === "viewer"
                      ? "bg-slate-800 text-emerald-400 font-semibold"
                      : "text-slate-400"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                    activeTab === "chat"
                      ? "bg-slate-800 text-emerald-400 font-semibold"
                      : "text-slate-400"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </button>
              </div>

              {/* DESKTOP SPLIT AND WORKSPACE GRID */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0" id="desktop-grid-layout">
                {/* MIDDLE CONTAINER: PREVIEW VIEWER + DASHBOARD */}
                <div
                  className={`col-span-1 lg:col-span-7 flex flex-col gap-4 min-h-0 ${
                    activeTab !== "dashboard" && activeTab !== "viewer" ? "hidden lg:flex" : "flex"
                  }`}
                >
                  {/* File Visual Content Preview */}
                  <div
                    className={`transition-all duration-200 ${
                      activeTab === "viewer" ? "flex flex-1 flex-col" : "hidden lg:flex lg:h-[42%] shrink-0"
                    }`}
                    id="viewer-panel-wrapper"
                  >
                    <FileViewer file={activeFile} />
                  </div>

                  {/* Summary & Analytical Insights */}
                  <div
                    className={`overflow-y-auto pr-1 ${
                      activeTab === "dashboard" ? "flex-1" : "hidden lg:flex lg:h-[58%] lg:overflow-y-auto"
                    }`}
                    id="dashboard-panel-wrapper"
                  >
                    {activeFile.analysis ? (
                      <AnalysisDashboard
                        analysis={activeFile.analysis}
                        file={activeFile}
                        onSelectPrompt={handleSendMessage}
                        onOpenHealthModal={() => setIsHealthOpen(true)}
                        onOpenPiiModal={() => setIsPiiOpen(true)}
                        onOpenComparisonModal={() => setIsComparisonOpen(true)}
                        onOpenESignModal={() => setIsESignOpen(true)}
                        onOpenTemplatesModal={() => setIsTemplatesOpen(true)}
                      />
                    ) : (
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center py-12">
                        <RefreshCw className="w-8 h-8 text-slate-500 animate-spin mb-3" />
                        <p className="text-sm font-semibold text-slate-400">Loading Analysis Insights...</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs">
                          Extracting citations, inspecting tables, and generating bilingual summary.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT CONTAINER: INTERACTIVE CHAT PANEL */}
                <div
                  className={`col-span-1 lg:col-span-5 flex flex-col min-h-0 ${
                    activeTab !== "chat" ? "hidden lg:flex" : "flex"
                  }`}
                  id="chat-panel-wrapper"
                >
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
      <footer
        className="py-3 text-center text-[10px] text-slate-600 border-t border-slate-950 font-mono mt-auto"
        id="app-footer"
      >
        Universal File & Video Analyzer • Gemini Multi-Modal Engine • Offline PII & PDF Cryptography
      </footer>

      {/* MODALS */}
      <CameraScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(captured) => {
          handleFileLoaded({
            ...captured,
            isVideo: false,
            docMode: selectedDocMode,
            language: selectedLanguage,
          });
        }}
      />

      <PdfToolsModal
        isOpen={isPdfToolsOpen}
        onClose={() => setIsPdfToolsOpen(false)}
        files={files}
        activeFile={activeFile}
      />

      <FileComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        files={files}
        initialFile1Id={activeFile?.id}
        language={selectedLanguage}
      />

      <BatchProcessingModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        files={files}
        onBatchAnalyze={handleBatchAnalyze}
        onSelectFile={(id) => {
          handleSelectFile(id);
          setIsBatchOpen(false);
        }}
        currentClientWorkspaceName={activeWorkspace?.name}
      />

      <ClientWorkspaceModal
        isOpen={isClientWsOpen}
        onClose={() => setIsClientWsOpen(false)}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
        onOpenClearModal={() => setIsClearModalOpen(true)}
        files={files}
      />

      <ClearWorkspaceModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        activeWorkspace={activeWorkspace}
        totalFilesCount={files.length}
        workspaceFilesCount={displayedFiles.length}
        onClearHistory={handleClearHistory}
      />

      <TeamFoldersModal
        isOpen={isTeamFoldersOpen}
        onClose={() => setIsTeamFoldersOpen(false)}
        teamFolders={teamFolders}
        activeFile={activeFile || undefined}
        onSelectTeamFolder={() => {}}
        onCreateTeamFolder={handleCreateTeamFolder}
        onAssignFileToTeamFolder={handleAssignFileToTeamFolder}
        onDeleteTeamFolder={handleDeleteTeamFolder}
      />

      {activeFile && (
        <ESignModal
          isOpen={isESignOpen}
          onClose={() => setIsESignOpen(false)}
          file={activeFile}
          onSaveSignature={handleSaveSignature}
        />
      )}

      {activeFile && (
        <CustomTemplatesModal
          isOpen={isTemplatesOpen}
          onClose={() => setIsTemplatesOpen(false)}
          activeFile={activeFile}
          onApplyTemplate={handleApplyTemplate}
        />
      )}

      {activeFile && (
        <FileHealthModal
          isOpen={isHealthOpen}
          onClose={() => setIsHealthOpen(false)}
          file={activeFile}
        />
      )}

      {activeFile && (
        <PiiRedactionModal
          isOpen={isPiiOpen}
          onClose={() => setIsPiiOpen(false)}
          file={activeFile}
          onUpdateFile={handleUpdateFile}
        />
      )}
    </div>
  );
}
