export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  citations?: string[];
}

export type AnalysisMode =
  | "auto"
  | "contract"
  | "invoice"
  | "receipt"
  | "resume"
  | "bank_statement"
  | "legal_notice"
  | "general";

export type LanguageOption = "en" | "hi" | "hinglish" | "regional";

export type UserPersonaMode = "general" | "lawyer" | "accountant";

export interface Insight {
  title: string;
  description: string;
  category:
    | "Structure"
    | "Quality"
    | "Metrics"
    | "Optimization"
    | "Content"
    | "Visual"
    | "Video"
    | "Audio"
    | "Anomaly"
    | "Legal"
    | "Financial"
    | "Obligation"
    | "Compliance";
  citation?: string; // e.g. "Page 2, Clause 4.2" or "Row 18"
}

export interface QuickStat {
  label: string;
  value: string;
  unit?: string;
}

export interface ExtractedTable {
  title: string;
  headers: string[];
  rows: string[][];
  pageOrSection?: string;
}

export interface PiiEntity {
  id: string;
  type: "Aadhaar" | "PAN" | "Phone" | "Email" | "Credit Card" | "Bank Account" | "SSN" | "Address" | "Name";
  value: string;
  maskedValue: string;
  riskLevel: "High" | "Medium" | "Low";
  pageOrLocation?: string;
  isRedacted?: boolean;
}

export interface HiddenMetadataItem {
  key: string;
  value: string;
}

export interface HealthAudit {
  isCorrupted: boolean;
  suspiciousExtension: boolean;
  detectedMime: string;
  declaredMime: string;
  duplicateCandidate?: { id: string; name: string };
  hiddenMetadata: HiddenMetadataItem[];
  securityScore: number; // 0 - 100
  warnings: string[];
  sha256Prefix?: string;
}

export interface ContractAnalysis {
  parties?: string[];
  obligations?: { party?: string; obligation: string; citation?: string }[];
  dates?: { effective?: string; expiry?: string; keyDeadlines?: string[] };
  paymentTerms?: string;
  terminationClauses?: string;
  jurisdiction?: string;
  riskFlags?: { flag: string; severity: "High" | "Medium" | "Low"; citation?: string }[];
}

export interface InvoiceAnalysis {
  vendor?: string;
  invoiceNumber?: string;
  date?: string;
  dueDate?: string;
  tax?: string;
  total?: string;
}

export interface ReceiptAnalysis {
  merchant?: string;
  amount?: string;
  category?: string;
  date?: string;
}

export interface ResumeAnalysis {
  skills?: string[];
  experience?: string[];
  education?: string[];
  jobMatchSummary?: string;
}

export interface BankStatementAnalysis {
  income?: string;
  expenses?: string;
  recurringPayments?: string[];
  unusualTransactions?: string[];
}

export interface SimpleChart {
  title: string;
  labels: string[];
  values: number[];
}

export interface DatasetAnalysis {
  columnExplanations?: { column: string; explanation: string }[];
  totals?: { metric: string; value: string }[];
  trends?: string[];
  simpleCharts?: SimpleChart[];
}

export interface ImageAnalysisDetails {
  ocrText?: string;
  description?: string;
  classification?: string;
  extractedFields?: { field: string; value: string }[];
}

export interface FileAnalysis {
  summary: string;
  fileTypeDetails: string;
  detectedLanguage?: string;
  detectedDocMode?: AnalysisMode;
  primaryInsights: Insight[];
  quickStats: QuickStat[];
  suggestedPrompts: string[];
  extractedTables?: ExtractedTable[];
  piiDetected?: PiiEntity[];
  healthAudit?: HealthAudit;
  ocrText?: string;
  contractDetails?: ContractAnalysis;
  invoiceDetails?: InvoiceAnalysis;
  receiptDetails?: ReceiptAnalysis;
  resumeDetails?: ResumeAnalysis;
  bankStatementDetails?: BankStatementAnalysis;
  datasetDetails?: DatasetAnalysis;
  imageDetails?: ImageAnalysisDetails;
}

export interface ClientWorkspace {
  id: string;
  name: string;
  clientName?: string;
  type?: "client" | "team" | "personal";
  clientCode?: string;
  industry?: string;
  color?: string;
  createdAt?: string;
}

export interface TeamFolder {
  id: string;
  name: string;
  team: string; // e.g., "Legal Team", "Finance & Accounts", "HR & Operations", "Audit & Risk"
  clientWorkspaceId?: string;
  permission: "Admin" | "Editor" | "Viewer";
  members: string[];
  color?: string;
}

export interface CustomTemplate {
  id: string;
  name: string;
  category: "Contract" | "Invoice" | "HR" | "Medical" | "Financial" | "Custom";
  description: string;
  fieldsToExtract: {
    key: string;
    label: string;
    description: string;
    type: "text" | "number" | "date" | "currency";
  }[];
  isBuiltIn?: boolean;
}

export interface SignatureAudit {
  signatureId: string;
  signedAt: string;
  signerName: string;
  signerEmail?: string;
  signerTitle?: string;
  signType: "drawn" | "typed" | "uploaded";
  signatureDataUrl: string;
  sha256Checksum: string;
  auditTrail: string[];
  isVerified: boolean;
  certificateNumber: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string; // Plain text, extracted text, CSV or JSON
  base64Data?: string; // For PDFs, images, and videos
  isImage: boolean;
  isVideo?: boolean;
  isPdf?: boolean;
  isOffice?: boolean; // DOCX, XLSX, PPTX
  isZip?: boolean;
  uploadedAt: string;
  analysis?: FileAnalysis;
  chatHistory: Message[];
  folderId?: string;
  teamFolderId?: string;
  clientWorkspaceId?: string;
  signatureAudit?: SignatureAudit;
  appliedTemplateId?: string;
  batchId?: string;
  tags?: string[];
  isFavorite?: boolean;
  redactedContent?: string;
  redactedBase64?: string;
  pageCount?: number;
  docMode?: AnalysisMode;
  language?: LanguageOption;
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
}

export interface FileComparisonResult {
  file1Name: string;
  file2Name: string;
  executiveSummary: string;
  similarityScore: number; // 0-100%
  majorDifferences: {
    title: string;
    description: string;
    type: "added" | "removed" | "modified" | "risk";
    citation1?: string;
    citation2?: string;
  }[];
  financialShifts?: {
    item: string;
    file1Value: string;
    file2Value: string;
    difference: string;
  }[];
  clauseChanges?: {
    clauseName: string;
    file1Text: string;
    file2Text: string;
    impact: string;
  }[];
  verdict: string;
}
