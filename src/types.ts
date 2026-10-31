export type AnalysisMode =
  | "general"
  | "contract"
  | "invoice"
  | "receipt"
  | "resume"
  | "bank_statement"
  | "legal_notice"
  | "spreadsheet";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

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
    | "Document"
    | "OCR"
    | "Palette"
    | "Spreadsheet"
    | "Financial"
    | "Formula";
}

export interface QuickStat {
  label: string;
  value: string;
  unit?: string;
}

export interface ColorSwatch {
  hex: string;
  name: string;
  percentage?: string;
}

export interface DocumentSection {
  heading: string;
  summary: string;
  page?: string | number;
}

export interface TechnicalSpecs {
  format?: string;
  dimensions?: string;
  megapixels?: string;
  aspectRatio?: string;
  colorSpace?: string;
  hasAlpha?: boolean;
  estimatedPages?: number;
  wordCount?: number;
  language?: string;
  readingTimeMinutes?: number;
  // Excel specs
  totalSheets?: number;
  totalRows?: number;
  totalColumns?: number;
  hasFormulas?: boolean;
}

export interface ExcelSheetData {
  name: string;
  headers: string[];
  rows: (string | number | boolean | null)[][];
  rowCount: number;
  colCount: number;
}

export interface ExcelColumnStat {
  column: string;
  type: "numeric" | "string" | "date" | "boolean";
  count: number;
  uniqueCount?: number;
  nullCount?: number;
  min?: number | string;
  max?: number | string;
  sum?: number;
  avg?: number;
}

export interface KeyMetricFormula {
  label: string;
  value: string;
  formula?: string;
  description?: string;
}

export interface SheetSummary {
  name: string;
  rowCount: number;
  colCount: number;
  summary: string;
}

export interface FileAnalysis {
  summary: string;
  fileTypeDetails: string;
  primaryInsights: Insight[];
  quickStats: QuickStat[];
  suggestedPrompts: string[];
  // Specialized extensions for PDF, JPG, PNG
  documentType?: string;
  extractedText?: string;
  dominantColors?: ColorSwatch[];
  detectedObjects?: string[];
  documentOutline?: DocumentSection[];
  technicalSpecs?: TechnicalSpecs;
  // Specialized extensions for Excel (.xlsx, .xls)
  excelSheetSummaries?: SheetSummary[];
  keyFormulasOrMetrics?: KeyMetricFormula[];
  columnStats?: ExcelColumnStat[];
  dataAnomalies?: string[];
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string; // Plain text or CSV/JSON content
  base64Data?: string; // For images, PDFs, videos, and Excel
  isImage: boolean;
  isVideo?: boolean;
  isPdf?: boolean;
  isExcel?: boolean;
  excelSheets?: ExcelSheetData[];
  activeSheetIndex?: number;
  imageDimensions?: { width: number; height: number };
  uploadedAt: string;
  analysis?: FileAnalysis;
  chatHistory: Message[];
}
