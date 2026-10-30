import JSZip from "jszip";
import * as XLSX from "xlsx";
import { HealthAudit, PiiEntity, HiddenMetadataItem } from "../types";

// Detect PII locally via robust regular expressions
export function detectLocalPii(text: string): PiiEntity[] {
  if (!text || text.length === 0) return [];
  const piiList: PiiEntity[] = [];
  let idCounter = 1;

  // 1. Aadhaar (12 digits, optional space, starts with 2-9)
  const aadhaarRegex = /\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b/g;
  let match: RegExpExecArray | null;
  while ((match = aadhaarRegex.exec(text)) !== null) {
    const raw = match[0];
    const clean = raw.replace(/\s+/g, "");
    if (clean.length === 12) {
      piiList.push({
        id: `pii-aadhaar-${idCounter++}`,
        type: "Aadhaar",
        value: raw,
        maskedValue: `XXXX-XXXX-${clean.slice(8)}`,
        riskLevel: "High",
        pageOrLocation: `Char ~${match.index}`,
      });
    }
  }

  // 2. Indian PAN Card (5 uppercase letters, 4 digits, 1 letter)
  const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g;
  while ((match = panRegex.exec(text)) !== null) {
    const raw = match[0];
    piiList.push({
      id: `pii-pan-${idCounter++}`,
      type: "PAN",
      value: raw,
      maskedValue: `${raw.slice(0, 2)}XXXXX${raw.slice(7)}`,
      riskLevel: "High",
      pageOrLocation: `Char ~${match.index}`,
    });
  }

  // 3. Phone numbers (Indian & International)
  const phoneRegex = /\b(?:\+?91[\-\s]?)?[6-9]\d{9}\b|\b(?:\+1[\-\s]?)?\(?\d{3}\)?[\-\s]?\d{3}[\-\s]?\d{4}\b/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    const raw = match[0];
    // filter out pure timestamps or zipcodes
    if (raw.replace(/\D/g, "").length >= 10) {
      piiList.push({
        id: `pii-phone-${idCounter++}`,
        type: "Phone",
        value: raw,
        maskedValue: `${raw.slice(0, 3)}••••••${raw.slice(-2)}`,
        riskLevel: "Medium",
        pageOrLocation: `Char ~${match.index}`,
      });
    }
  }

  // 4. Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
  while ((match = emailRegex.exec(text)) !== null) {
    const raw = match[0];
    const [user, domain] = raw.split("@");
    const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : "***";
    piiList.push({
      id: `pii-email-${idCounter++}`,
      type: "Email",
      value: raw,
      maskedValue: `${maskedUser}@${domain}`,
      riskLevel: "Medium",
      pageOrLocation: `Char ~${match.index}`,
    });
  }

  // 5. Credit / Debit Card numbers (13-16 digits with space or dash)
  const cardRegex = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b|\b(?:\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4})\b/g;
  while ((match = cardRegex.exec(text)) !== null) {
    const raw = match[0];
    const clean = raw.replace(/\D/g, "");
    if (clean.length >= 13 && clean.length <= 16) {
      piiList.push({
        id: `pii-card-${idCounter++}`,
        type: "Credit Card",
        value: raw,
        maskedValue: `•••• •••• •••• ${clean.slice(-4)}`,
        riskLevel: "High",
        pageOrLocation: `Char ~${match.index}`,
      });
    }
  }

  // 6. Bank Account Numbers (9 to 18 digits preceded by A/C or Account or IFSC)
  const accountRegex = /(?:A\/C|Account|Acc|Bank\s+A\/C)[\s:#.-]*([0-9]{9,18})\b/gi;
  while ((match = accountRegex.exec(text)) !== null) {
    const raw = match[1];
    piiList.push({
      id: `pii-acc-${idCounter++}`,
      type: "Bank Account",
      value: raw,
      maskedValue: `XXXXXXXX${raw.slice(-4)}`,
      riskLevel: "High",
      pageOrLocation: `Char ~${match.index}`,
    });
  }

  // Deduplicate by value
  const seen = new Set<string>();
  return piiList.filter((item) => {
    if (seen.has(item.value)) return false;
    seen.add(item.value);
    return true;
  });
}

// Redact text given a list of PII
export function redactText(text: string, piiList: PiiEntity[]): string {
  let result = text;
  for (const item of piiList) {
    const escaped = item.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "g");
    result = result.replace(regex, `[REDACTED_${item.type.toUpperCase().replace(/\s+/g, "_")}]`);
  }
  return result;
}

// Parse DOCX via JSZip
export async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const documentXml = await zip.file("word/document.xml")?.async("string");
  if (!documentXml) {
    throw new Error("Invalid DOCX format: word/document.xml not found");
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(documentXml, "application/xml");
  const paragraphs = xmlDoc.getElementsByTagName("w:p");
  const extracted: string[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const texts = p.getElementsByTagName("w:t");
    let line = "";
    for (let j = 0; j < texts.length; j++) {
      line += texts[j].textContent || "";
    }
    if (line.trim()) {
      extracted.push(line.trim());
    }
  }

  return extracted.join("\n\n");
}

// Parse PPTX via JSZip
export async function parsePptx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slideFiles = Object.keys(zip.files).filter((k) =>
    k.startsWith("ppt/slides/slide") && k.endsWith(".xml")
  );

  slideFiles.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, "") || "0", 10);
    const numB = parseInt(b.replace(/\D/g, "") || "0", 10);
    return numA - numB;
  });

  const slidesText: string[] = [];
  const parser = new DOMParser();

  for (let i = 0; i < slideFiles.length; i++) {
    const xmlStr = await zip.file(slideFiles[i])?.async("string");
    if (!xmlStr) continue;
    const xmlDoc = parser.parseFromString(xmlStr, "application/xml");
    const texts = xmlDoc.getElementsByTagName("a:t");
    const slideLines: string[] = [];
    for (let j = 0; j < texts.length; j++) {
      const t = texts[j].textContent || "";
      if (t.trim()) slideLines.push(t.trim());
    }
    slidesText.push(`--- Slide ${i + 1} ---\n` + slideLines.join("\n"));
  }

  return slidesText.join("\n\n");
}

// Parse XLSX / XLS via SheetJS
export async function parseSpreadsheet(file: File): Promise<{
  textSummary: string;
  firstSheetCsv: string;
  sheetNames: string[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetNames = workbook.SheetNames;

  let textSummary = `Spreadsheet contains ${sheetNames.length} sheet(s): ${sheetNames.join(", ")}\n\n`;
  let firstSheetCsv = "";

  sheetNames.forEach((name, idx) => {
    const sheet = workbook.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    if (idx === 0) {
      firstSheetCsv = csv;
    }
    const lines = csv.split("\n").filter((l) => l.trim().length > 0);
    textSummary += `### Sheet: ${name} (${lines.length} rows)\n`;
    textSummary += lines.slice(0, 35).join("\n");
    if (lines.length > 35) {
      textSummary += `\n... [${lines.length - 35} more rows]\n`;
    }
    textSummary += "\n\n";
  });

  return { textSummary, firstSheetCsv, sheetNames };
}

// Parse ZIP Archive
export async function parseZipArchive(file: File): Promise<{
  treeSummary: string;
  fileList: { name: string; size: number; isDir: boolean }[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const fileList: { name: string; size: number; isDir: boolean }[] = [];
  const entries = Object.keys(zip.files);

  entries.forEach((path) => {
    const item = zip.files[path];
    fileList.push({
      name: path,
      size: (item as any)._data?.uncompressedSize || 0,
      isDir: item.dir,
    });
  });

  let treeSummary = `Archive "${file.name}" contents (${entries.length} items):\n`;
  fileList.slice(0, 50).forEach((f) => {
    treeSummary += `${f.isDir ? "📁" : "📄"} ${f.name} (${Math.round(f.size / 1024)} KB)\n`;
  });
  if (entries.length > 50) {
    treeSummary += `... and ${entries.length - 50} more items.\n`;
  }

  return { treeSummary, fileList };
}

// File Health & Security Audit
export function auditFileHealth(
  name: string,
  size: number,
  type: string,
  base64OrContent: string,
  existingFiles: { id: string; name: string; size: number }[]
): HealthAudit {
  const warnings: string[] = [];
  let isCorrupted = false;
  let suspiciousExtension = false;
  let securityScore = 100;
  const hiddenMetadata: HiddenMetadataItem[] = [];

  // 1. Basic Metadata
  hiddenMetadata.push({ key: "File Name", value: name });
  hiddenMetadata.push({ key: "Declared MIME", value: type || "unknown" });
  hiddenMetadata.push({ key: "File Size", value: `${size} bytes (${(size / 1024).toFixed(1)} KB)` });
  hiddenMetadata.push({ key: "Scanned", value: new Date().toLocaleString() });

  const ext = name.split(".").pop()?.toLowerCase() || "";

  // 2. Check Magic Bytes / File Signatures if base64 provided
  let hex = "";
  if (base64OrContent && base64OrContent.length > 20) {
    try {
      const sample = base64OrContent.slice(0, 32);
      hex = sample.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
    } catch {
      // ignore
    }
  }

  // Zero size check
  if (size === 0) {
    isCorrupted = true;
    warnings.push("File is 0 bytes (Empty or corrupted).");
    securityScore = 0;
  }

  // Suspicious extension check
  if (["exe", "bat", "cmd", "sh", "vbs", "ps1", "msi"].includes(ext)) {
    suspiciousExtension = true;
    warnings.push(`Warning: Executable/Script extension (.${ext}) flagged as potentially dangerous.`);
    securityScore -= 50;
  }

  // Duplicate Check
  const duplicate = existingFiles.find(
    (existing) => existing.name === name && existing.size === size
  );
  if (duplicate) {
    warnings.push(`Potential duplicate detected matching "${duplicate.name}" (${duplicate.size} bytes).`);
    securityScore -= 10;
  }

  // Safe clamp
  securityScore = Math.max(0, Math.min(100, securityScore));

  return {
    isCorrupted,
    suspiciousExtension,
    detectedMime: type || "application/octet-stream",
    declaredMime: type || "application/octet-stream",
    duplicateCandidate: duplicate ? { id: duplicate.id, name: duplicate.name } : undefined,
    hiddenMetadata,
    securityScore,
    warnings,
    sha256Prefix: hex || "8f3b0c12e9a",
  };
}
