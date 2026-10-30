import * as XLSX from "xlsx";
import { UploadedFile } from "../types";

/**
 * Export full OCR text and AI analysis to a formatted Word document (.doc)
 * Opens cleanly in Microsoft Word, Google Docs, Apple Pages, LibreOffice
 */
export function exportOcrToWord(file: UploadedFile) {
  const ocrText = file.analysis?.ocrText || file.content || "No raw text available.";
  const summary = file.analysis?.summary || "No summary available.";
  const stats = file.analysis?.quickStats || [];
  const insights = file.analysis?.primaryInsights || [];
  const fileName = file.name.replace(/\.[^/.]+$/, "");

  const wordHtml = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>${file.name} - AI Analysis & OCR Report</title>
    <style>
      body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #1a202c; padding: 20px; }
      h1 { color: #1e3a8a; font-size: 20pt; border-bottom: 2px solid #1e3a8a; padding-bottom: 6px; }
      h2 { color: #2563eb; font-size: 14pt; margin-top: 18px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
      h3 { color: #0f172a; font-size: 12pt; margin-top: 12px; }
      .meta-box { background-color: #f1f5f9; padding: 12px; border-left: 4px solid #2563eb; margin-bottom: 16px; }
      table { border-collapse: collapse; width: 100%; margin-top: 10px; margin-bottom: 16px; }
      th { background-color: #1e3a8a; color: white; border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 10pt; }
      td { border: 1px solid #cbd5e1; padding: 8px; font-size: 10pt; }
      tr:nth-child(even) { background-color: #f8fafc; }
      .ocr-block { background-color: #f8fafc; padding: 14px; border: 1px solid #e2e8f0; font-family: 'Courier New', monospace; font-size: 9.5pt; white-space: pre-wrap; line-height: 1.4; }
      .badge { display: inline-block; padding: 3px 8px; background: #e0e7ff; color: #3730a3; border-radius: 4px; font-size: 9pt; }
    </style>
  </head>
  <body>
    <h1>AI Document Intelligence & OCR Report</h1>
    
    <div class="meta-box">
      <p><strong>Document:</strong> ${file.name}</p>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Classification:</strong> ${file.analysis?.fileTypeDetails || file.type}</p>
      <p><strong>Language:</strong> ${file.analysis?.detectedLanguage || "English"}</p>
      <p><strong>Mode:</strong> ${file.analysis?.detectedDocMode || "General"}</p>
    </div>

    <h2>Executive Summary</h2>
    <p>${summary.replace(/\n/g, "<br/>")}</p>

    <h2>Key Extracted Metrics</h2>
    <table>
      <thead>
        <tr><th>Metric / Field</th><th>Value</th><th>Unit</th></tr>
      </thead>
      <tbody>
        ${stats.map((s) => `<tr><td><strong>${s.label}</strong></td><td>${s.value}</td><td>${s.unit || ""}</td></tr>`).join("")}
      </tbody>
    </table>

    ${insights.length > 0 ? `
    <h2>Key Insights & Exact Citations</h2>
    ${insights.map((ins) => `
      <div>
        <h3>[${ins.category}] ${ins.title} ${ins.citation ? `<span class="badge">Citation: ${ins.citation}</span>` : ""}</h3>
        <p>${ins.description.replace(/\n/g, "<br/>")}</p>
      </div>
    `).join("")}
    ` : ""}

    ${file.analysis?.contractDetails ? `
    <h2>Contract Intelligence Summary</h2>
    <p><strong>Parties:</strong> ${file.analysis.contractDetails.parties?.join(", ") || "N/A"}</p>
    <p><strong>Effective Date:</strong> ${file.analysis.contractDetails.dates?.effective || "N/A"}</p>
    <p><strong>Expiry / Term:</strong> ${file.analysis.contractDetails.dates?.expiry || "N/A"}</p>
    <p><strong>Jurisdiction:</strong> ${file.analysis.contractDetails.jurisdiction || "N/A"}</p>
    <p><strong>Payment Terms:</strong> ${file.analysis.contractDetails.paymentTerms || "N/A"}</p>
    ` : ""}

    <h2>Full Extracted OCR / Text Layer</h2>
    <div class="ocr-block">${ocrText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>

    <hr style="margin-top: 30px; border: none; border-top: 1px solid #cbd5e1;" />
    <p style="font-size: 8pt; color: #64748b; text-align: center;">Exported from Universal Document & Media Intelligence Suite</p>
  </body>
  </html>
  `;

  const blob = new Blob(["\ufeff", wordHtml], {
    type: "application/msword",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}_OCR_Text_Report.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export extracted document fields to Microsoft Excel (.xlsx)
 */
export function exportFieldsToExcel(file: UploadedFile) {
  const wb = XLSX.utils.book_new();
  const fileName = file.name.replace(/\.[^/.]+$/, "");

  // 1. Overview & Stats Sheet
  const statsRows: (string | number)[][] = [
    ["Document Name", file.name],
    ["Export Date", new Date().toLocaleString()],
    ["Document Type", file.analysis?.fileTypeDetails || file.type],
    ["Detected Language", file.analysis?.detectedLanguage || "English"],
    ["Detected Mode", file.analysis?.detectedDocMode || "General"],
    [],
    ["METRIC", "VALUE", "UNIT"],
  ];

  file.analysis?.quickStats?.forEach((stat) => {
    statsRows.push([stat.label, stat.value, stat.unit || ""]);
  });

  const wsOverview = XLSX.utils.aoa_to_sheet(statsRows);
  XLSX.utils.book_append_sheet(wb, wsOverview, "Key Metrics");

  // 2. Extracted Tables (if any)
  if (file.analysis?.extractedTables && file.analysis.extractedTables.length > 0) {
    file.analysis.extractedTables.forEach((tbl, index) => {
      const tableData = [tbl.headers, ...tbl.rows];
      const wsTable = XLSX.utils.aoa_to_sheet(tableData);
      const sheetName = `Table ${index + 1}`.slice(0, 31);
      XLSX.utils.book_append_sheet(wb, wsTable, sheetName);
    });
  }

  // 3. Specialized Fields (Contract / Invoice / Receipt / Resume / Bank / Dataset)
  const specializedRows: (string | number)[][] = [["Field", "Extracted Value", "Notes"]];

  if (file.analysis?.invoiceDetails) {
    const inv = file.analysis.invoiceDetails;
    specializedRows.push(["Vendor", inv.vendor || "", ""]);
    specializedRows.push(["Invoice Number", inv.invoiceNumber || "", ""]);
    specializedRows.push(["Invoice Date", inv.date || "", ""]);
    specializedRows.push(["Due Date", inv.dueDate || "", ""]);
    specializedRows.push(["Tax / GST", inv.tax || "", ""]);
    specializedRows.push(["Total Payable", inv.total || "", ""]);
  } else if (file.analysis?.receiptDetails) {
    const rec = file.analysis.receiptDetails;
    specializedRows.push(["Merchant", rec.merchant || "", ""]);
    specializedRows.push(["Amount", rec.amount || "", ""]);
    specializedRows.push(["Category", rec.category || "", ""]);
    specializedRows.push(["Receipt Date", rec.date || "", ""]);
  } else if (file.analysis?.contractDetails) {
    const c = file.analysis.contractDetails;
    specializedRows.push(["Parties", c.parties?.join("; ") || "", ""]);
    specializedRows.push(["Effective Date", c.dates?.effective || "", ""]);
    specializedRows.push(["Expiry Date", c.dates?.expiry || "", ""]);
    specializedRows.push(["Payment Terms", c.paymentTerms || "", ""]);
    specializedRows.push(["Termination", c.terminationClauses || "", ""]);
    specializedRows.push(["Jurisdiction", c.jurisdiction || "", ""]);
    c.riskFlags?.forEach((r, idx) => {
      specializedRows.push([`Risk Flag #${idx + 1} (${r.severity})`, r.flag, r.citation || ""]);
    });
  } else if (file.analysis?.bankStatementDetails) {
    const b = file.analysis.bankStatementDetails;
    specializedRows.push(["Total Inflow / Income", b.income || "", ""]);
    specializedRows.push(["Total Outflow / Expenses", b.expenses || "", ""]);
    b.recurringPayments?.forEach((r, idx) => {
      specializedRows.push([`Recurring Payment #${idx + 1}`, r, ""]);
    });
    b.unusualTransactions?.forEach((u, idx) => {
      specializedRows.push([`Unusual Transaction #${idx + 1}`, u, "Warning"]);
    });
  } else if (file.analysis?.imageDetails?.extractedFields) {
    file.analysis.imageDetails.extractedFields.forEach((f) => {
      specializedRows.push([f.field, f.value, "Extracted from Image"]);
    });
  }

  if (specializedRows.length > 1) {
    const wsSpecialized = XLSX.utils.aoa_to_sheet(specializedRows);
    XLSX.utils.book_append_sheet(wb, wsSpecialized, "Specialized Fields");
  }

  // 4. Insights Sheet
  if (file.analysis?.primaryInsights && file.analysis.primaryInsights.length > 0) {
    const insightRows = [
      ["Category", "Title", "Description", "Citation"],
      ...file.analysis.primaryInsights.map((i) => [i.category, i.title, i.description, i.citation || ""]),
    ];
    const wsInsights = XLSX.utils.aoa_to_sheet(insightRows);
    XLSX.utils.book_append_sheet(wb, wsInsights, "Insights & Citations");
  }

  // 5. PII Audit Sheet (if detected)
  if (file.analysis?.piiDetected && file.analysis.piiDetected.length > 0) {
    const piiRows = [
      ["Entity Type", "Masked Value", "Risk Level", "Location"],
      ...file.analysis.piiDetected.map((p) => [p.type, p.maskedValue, p.riskLevel, p.pageOrLocation || ""]),
    ];
    const wsPii = XLSX.utils.aoa_to_sheet(piiRows);
    XLSX.utils.book_append_sheet(wb, wsPii, "PII Audit Log");
  }

  XLSX.writeFile(wb, `${fileName}_Extracted_Fields.xlsx`);
}

/**
 * Export extracted document fields to CSV
 */
export function exportFieldsToCsv(file: UploadedFile) {
  const fileName = file.name.replace(/\.[^/.]+$/, "");
  const rows: (string | number)[][] = [
    ["Document Name", file.name],
    ["Date", new Date().toLocaleString()],
    [],
    ["Type", "Key", "Value", "Notes"],
  ];

  file.analysis?.quickStats?.forEach((s) => {
    rows.push(["Metric", s.label, s.value, s.unit || ""]);
  });

  if (file.analysis?.invoiceDetails) {
    const inv = file.analysis.invoiceDetails;
    rows.push(["Invoice", "Vendor", inv.vendor || "", ""]);
    rows.push(["Invoice", "Invoice Number", inv.invoiceNumber || "", ""]);
    rows.push(["Invoice", "Date", inv.date || "", ""]);
    rows.push(["Invoice", "Due Date", inv.dueDate || "", ""]);
    rows.push(["Invoice", "Tax", inv.tax || "", ""]);
    rows.push(["Invoice", "Total", inv.total || "", ""]);
  }

  if (file.analysis?.contractDetails) {
    const c = file.analysis.contractDetails;
    rows.push(["Contract", "Parties", c.parties?.join(" | ") || "", ""]);
    rows.push(["Contract", "Effective Date", c.dates?.effective || "", ""]);
    rows.push(["Contract", "Expiry Date", c.dates?.expiry || "", ""]);
    rows.push(["Contract", "Jurisdiction", c.jurisdiction || "", ""]);
    rows.push(["Contract", "Payment Terms", c.paymentTerms || "", ""]);
  }

  file.analysis?.primaryInsights?.forEach((i) => {
    rows.push(["Insight", i.title, i.description, i.citation || ""]);
  });

  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? "").replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(",")
    )
    .join("\r\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}_Extracted_Fields.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Batch Export: Export multiple processed files into a single consolidated Excel Workbook
 */
export function exportBatchToExcel(files: UploadedFile[], clientWorkspaceName?: string) {
  const wb = XLSX.utils.book_new();

  const summaryHeaders = [
    "File Name",
    "Client Workspace",
    "Doc Mode",
    "Format Details",
    "Primary Entity / Parties",
    "Total / Key Metric",
    "Tax / Secondary Metric",
    "Effective / Due Date",
    "Risk Flags Count",
    "PII Count",
    "Health Score",
    "Processed At",
  ];

  const summaryRows = files.map((file) => {
    const analysis = file.analysis;
    let primaryEntity = "N/A";
    let keyMetric = "N/A";
    let secondaryMetric = "N/A";
    let relevantDate = "N/A";

    if (analysis?.invoiceDetails) {
      primaryEntity = analysis.invoiceDetails.vendor || "N/A";
      keyMetric = analysis.invoiceDetails.total || "N/A";
      secondaryMetric = analysis.invoiceDetails.tax || "N/A";
      relevantDate = analysis.invoiceDetails.dueDate || analysis.invoiceDetails.date || "N/A";
    } else if (analysis?.receiptDetails) {
      primaryEntity = analysis.receiptDetails.merchant || "N/A";
      keyMetric = analysis.receiptDetails.amount || "N/A";
      secondaryMetric = analysis.receiptDetails.category || "N/A";
      relevantDate = analysis.receiptDetails.date || "N/A";
    } else if (analysis?.contractDetails) {
      primaryEntity = analysis.contractDetails.parties?.join(" & ") || "N/A";
      keyMetric = analysis.contractDetails.paymentTerms || "N/A";
      secondaryMetric = analysis.contractDetails.jurisdiction || "N/A";
      relevantDate = analysis.contractDetails.dates?.effective || "N/A";
    } else if (analysis?.bankStatementDetails) {
      primaryEntity = "Bank Account";
      keyMetric = `Inflow: ${analysis.bankStatementDetails.income || "0"}`;
      secondaryMetric = `Outflow: ${analysis.bankStatementDetails.expenses || "0"}`;
    } else if (analysis?.quickStats?.[0]) {
      keyMetric = `${analysis.quickStats[0].label}: ${analysis.quickStats[0].value}`;
    }

    const riskFlagsCount = analysis?.contractDetails?.riskFlags?.length || 0;
    const piiCount = analysis?.piiDetected?.length || 0;
    const healthScore = analysis?.healthAudit?.securityScore ?? 100;

    return [
      file.name,
      clientWorkspaceName || file.clientWorkspaceId || "General",
      analysis?.detectedDocMode || file.docMode || "General",
      analysis?.fileTypeDetails || file.type,
      primaryEntity,
      keyMetric,
      secondaryMetric,
      relevantDate,
      riskFlagsCount,
      piiCount,
      `${healthScore}%`,
      file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : new Date().toLocaleDateString(),
    ];
  });

  const wsBatch = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
  XLSX.utils.book_append_sheet(wb, wsBatch, "Batch Summary");

  XLSX.writeFile(wb, `Batch_Extraction_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
