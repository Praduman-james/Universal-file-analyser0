import * as XLSX from "xlsx";
import { ExcelSheetData } from "../types";

// Utility to provide real, interactive sample PDF, JPG, PNG, and Excel files for immediate testing

// A valid, standalone 1-page PDF invoice & audit report
const SAMPLE_PDF_TEXT = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 265 >>
stream
BT
/F1 18 Tf
50 720 Td
(ACME SOLUTIONS - QUARTERLY PERFORMANCE & INVOICE) Tj
/F1 11 Tf
0 -30 Td
(Invoice Number: INV-2026-8841 | Date: October 2026) Tj
0 -22 Td
(Billed To: Global Tech Holdings Corp.) Tj
0 -22 Td
(Project: Cloud Infrastructure & AI Pipeline Deployment) Tj
0 -22 Td
(Total Invoice Amount: $24,500.00 USD (Net 30)) Tj
0 -28 Td
(Executive Summary: All milestones for Q3 achieved with 99.98% uptime.) Tj
0 -20 Td
(Key Compliance: SOC2 Type II Certified, GDPR Compliant.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000561 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
640
%%EOF`;

export function getSamplePdfBase64(): string {
  return btoa(SAMPLE_PDF_TEXT);
}

// Generate a rich, high-resolution sample PNG with transparency, typography, and badges
export function generateSamplePng(): { base64Data: string; width: number; height: number } {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 500;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return { base64Data: "", width: 800, height: 500 };
  }

  // Draw rich dark tech backdrop with subtle rounded rect and transparency
  ctx.fillStyle = "rgba(10, 15, 30, 0.95)";
  ctx.beginPath();
  ctx.roundRect(0, 0, 800, 500, 24);
  ctx.fill();

  // Draw vibrant gradient wave
  const gradient = ctx.createLinearGradient(0, 0, 800, 500);
  gradient.addColorStop(0, "#10B981"); // Emerald
  gradient.addColorStop(0.5, "#06B6D4"); // Cyan
  gradient.addColorStop(1, "#6366F1"); // Indigo

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Ambient glows
  const radialGlow = ctx.createRadialGradient(200, 150, 10, 200, 150, 200);
  radialGlow.addColorStop(0, "rgba(16, 185, 129, 0.35)");
  radialGlow.addColorStop(1, "rgba(16, 185, 129, 0)");
  ctx.fillStyle = radialGlow;
  ctx.beginPath();
  ctx.arc(200, 150, 200, 0, Math.PI * 2);
  ctx.fill();

  // Glass card in center
  ctx.fillStyle = "rgba(30, 41, 59, 0.8)";
  ctx.beginPath();
  ctx.roundRect(60, 60, 680, 380, 16);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Badge header
  ctx.fillStyle = "#10B981";
  ctx.beginPath();
  ctx.roundRect(90, 95, 140, 32, 8);
  ctx.fill();

  ctx.fillStyle = "#022c22";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillText("PNG GRAPHIC", 110, 116);

  // Title text
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillText("Product Architecture & Design Spec", 90, 175);

  // Subtitle
  ctx.fillStyle = "#94A3B8";
  ctx.font = "15px system-ui, sans-serif";
  ctx.fillText("Format: PNG-24 with Alpha Channel Transparency", 90, 208);
  ctx.fillText("Resolution: 800 x 500 px • Color Space: sRGB", 90, 232);

  // Metric blocks
  const metrics = [
    { label: "Active Nodes", val: "1,248", color: "#10B981" },
    { label: "Latency", val: "12.4 ms", color: "#38BDF8" },
    { label: "Throughput", val: "99.98%", color: "#A855F7" },
  ];

  metrics.forEach((m, idx) => {
    const x = 90 + idx * 210;
    ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
    ctx.beginPath();
    ctx.roundRect(x, 270, 190, 90, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(51, 65, 85, 0.8)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#64748B";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(m.label, x + 20, 302);

    ctx.fillStyle = m.color;
    ctx.font = "bold 24px system-ui, sans-serif";
    ctx.fillText(m.val, x + 20, 338);
  });

  // Footer bar
  ctx.fillStyle = "#475569";
  ctx.font = "11px monospace";
  ctx.fillText("ANALYZER OCR TEST: 'VERIFIED_SIGNATURE_OK_2026'", 90, 410);

  const dataUrl = canvas.toDataURL("image/png");
  const base64Data = dataUrl.split(",")[1];
  return { base64Data, width: 800, height: 500 };
}

// Generate a sample JPG photograph
export function generateSampleJpg(): { base64Data: string; width: number; height: number } {
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return { base64Data: "", width: 960, height: 640 };
  }

  // Draw vibrant sunset sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 400);
  skyGrad.addColorStop(0, "#0F172A");
  skyGrad.addColorStop(0.3, "#431407");
  skyGrad.addColorStop(0.6, "#EA580C");
  skyGrad.addColorStop(0.85, "#FBBF24");
  skyGrad.addColorStop(1, "#FEF3C7");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 960, 420);

  // Golden glowing sun
  const sunGrad = ctx.createRadialGradient(480, 340, 10, 480, 340, 140);
  sunGrad.addColorStop(0, "#FFFFFF");
  sunGrad.addColorStop(0.2, "#FEF08A");
  sunGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.6)");
  sunGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(480, 340, 140, 0, Math.PI * 2);
  ctx.fill();

  // Mountain silhouettes in background
  ctx.fillStyle = "#1E1B4B";
  ctx.beginPath();
  ctx.moveTo(0, 420);
  ctx.lineTo(120, 280);
  ctx.lineTo(260, 360);
  ctx.lineTo(440, 260);
  ctx.lineTo(580, 350);
  ctx.lineTo(760, 240);
  ctx.lineTo(960, 380);
  ctx.lineTo(960, 420);
  ctx.closePath();
  ctx.fill();

  // Fore-ground mountain ridge
  ctx.fillStyle = "#0F172A";
  ctx.beginPath();
  ctx.moveTo(0, 420);
  ctx.lineTo(180, 330);
  ctx.lineTo(380, 400);
  ctx.lineTo(620, 310);
  ctx.lineTo(840, 390);
  ctx.lineTo(960, 360);
  ctx.lineTo(960, 420);
  ctx.closePath();
  ctx.fill();

  // Calm reflective water in foreground
  const waterGrad = ctx.createLinearGradient(0, 420, 0, 640);
  waterGrad.addColorStop(0, "#78350F");
  waterGrad.addColorStop(0.3, "#451A03");
  waterGrad.addColorStop(0.7, "#1C1917");
  waterGrad.addColorStop(1, "#0C0A09");
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, 420, 960, 220);

  // Sun reflection ripples on water
  ctx.fillStyle = "rgba(253, 224, 71, 0.35)";
  for (let y = 430; y < 620; y += 8) {
    const spread = (y - 420) * 0.9;
    ctx.fillRect(480 - spread / 2, y, spread, 2);
  }

  // Camera lens metadata imprint
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "bold 12px monospace";
  ctx.fillText("JPEG PHOTOGRAPHY • ISO 100 • 35mm • f/2.8 • 1/250s", 30, 615);
  ctx.fillText("GOLDEN HOUR MOUNTAIN HORIZON", 30, 595);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const base64Data = dataUrl.split(",")[1];
  return { base64Data, width: 960, height: 640 };
}

// Generate a rich, multi-sheet Excel Workbook (.xlsx) with financial & sales data
export function generateSampleExcel(): {
  base64Data: string;
  sheets: ExcelSheetData[];
  contentString: string;
} {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Sales Performance
  const sheet1Headers = [
    "Region",
    "Account Executive",
    "Product Line",
    "Units Sold",
    "Unit Price ($)",
    "Total Revenue ($)",
    "Commission Rate",
    "Net Margin ($)",
    "Quarter",
    "Target Achieved",
  ];

  const sheet1Data = [
    ["North America", "Elena Rostova", "Cloud Enterprise AI", 45, 1200, 54000, "8.5%", 38500, "Q3-2026", "Yes (112%)"],
    ["North America", "Marcus Vance", "Data Lakehouse Pro", 80, 650, 52000, "7.0%", 34200, "Q3-2026", "Yes (105%)"],
    ["Europe", "Sophie Dupont", "Security Vault Suite", 62, 950, 58900, "8.0%", 41200, "Q3-2026", "Yes (118%)"],
    ["Europe", "Liam Becker", "Cloud Enterprise AI", 38, 1200, 45600, "8.5%", 32000, "Q3-2026", "No (92%)"],
    ["Asia Pacific", "Kenji Takahashi", "Data Lakehouse Pro", 95, 650, 61750, "7.0%", 42500, "Q3-2026", "Yes (124%)"],
    ["Asia Pacific", "Priya Sharma", "Cloud Enterprise AI", 54, 1200, 64800, "8.5%", 46000, "Q3-2026", "Yes (130%)"],
    ["Latin America", "Carlos Mendez", "Security Vault Suite", 40, 950, 38000, "7.5%", 25500, "Q3-2026", "No (88%)"],
    ["Latin America", "Lucia Silva", "Edge Analytics Box", 110, 420, 46200, "6.5%", 29800, "Q3-2026", "Yes (102%)"],
    ["Middle East", "Tariq Al-Mansoor", "Cloud Enterprise AI", 42, 1200, 50400, "8.5%", 36100, "Q3-2026", "Yes (108%)"],
    ["Middle East", "Zahra Hosseini", "Security Vault Suite", 50, 950, 47500, "8.0%", 33200, "Q3-2026", "Yes (104%)"],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet([sheet1Headers, ...sheet1Data]);
  XLSX.utils.book_append_sheet(wb, ws1, "Regional Sales Q3");

  // Sheet 2: Department Budget 2026
  const sheet2Headers = [
    "Department",
    "Headcount",
    "Annual Budget ($)",
    "Q1 Actual ($)",
    "Q2 Actual ($)",
    "Q3 Projected ($)",
    "Q4 Projected ($)",
    "YTD Total ($)",
    "Budget Remaining ($)",
    "Status",
  ];

  const sheet2Data = [
    ["Engineering & AI", 58, 4800000, 1150000, 1180000, 1200000, 1210000, 4740000, 60000, "On Track"],
    ["Product Design", 18, 1450000, 340000, 355000, 360000, 370000, 1425000, 25000, "On Track"],
    ["Global Sales", 42, 3200000, 780000, 810000, 830000, 850000, 3270000, -70000, "Over Budget"],
    ["Growth Marketing", 22, 1850000, 420000, 450000, 470000, 480000, 1820000, 30000, "On Track"],
    ["Cloud Infrastructure", 14, 2100000, 490000, 510000, 520000, 530000, 2050000, 50000, "Under Budget"],
    ["People Operations", 10, 850000, 195000, 205000, 210000, 215000, 825000, 25000, "On Track"],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet([sheet2Headers, ...sheet2Data]);
  XLSX.utils.book_append_sheet(wb, ws2, "Dept Operating Budget");

  // Generate Base64
  const base64Data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });

  const sheets: ExcelSheetData[] = [
    {
      name: "Regional Sales Q3",
      headers: sheet1Headers,
      rows: sheet1Data,
      rowCount: sheet1Data.length,
      colCount: sheet1Headers.length,
    },
    {
      name: "Dept Operating Budget",
      headers: sheet2Headers,
      rows: sheet2Data,
      rowCount: sheet2Data.length,
      colCount: sheet2Headers.length,
    },
  ];

  // Convert to clean text representation for Gemini
  let contentString = `EXCEL WORKBOOK: "Q3_Financial_Sales_Model.xlsx"\n`;
  contentString += `Total Sheets: 2\n\n`;
  sheets.forEach((s) => {
    contentString += `### SHEET: "${s.name}" (${s.rowCount} rows, ${s.colCount} cols)\n`;
    contentString += s.headers.join(" | ") + "\n";
    contentString += s.headers.map(() => "---").join(" | ") + "\n";
    s.rows.forEach((r) => {
      contentString += r.join(" | ") + "\n";
    });
    contentString += "\n";
  });

  return { base64Data, sheets, contentString };
}
