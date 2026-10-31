import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up large payload limits for PDF, Excel, video, image and document analysis (50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazily get the Gemini Client and verify key
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper to attempt generation with fallback to 2.5 flash if 3.8 flash is busy
async function generateContentWithFallback(ai: GoogleGenAI, requestOptions: any) {
  try {
    return await ai.models.generateContent({
      ...requestOptions,
      model: "gemini-3.8-flash",
    });
  } catch (error: any) {
    console.warn("gemini-3.8-flash failed:", error.message);
    const isUnavailable = error.status === 503 || error.message?.includes("503") || error.message?.includes("high demand");
    if (isUnavailable) {
      console.warn("Falling back to gemini-2.5-flash due to high demand...");
      return await ai.models.generateContent({
        ...requestOptions,
        model: "gemini-2.5-flash",
      });
    }
    throw error;
  }
}

// HEALTH CHECK ENDPOINT
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// FILE ANALYSIS API
app.post("/api/analyze", async (req, res) => {
  try {
    const {
      fileName,
      fileType,
      fileContent,
      isImage,
      isVideo,
      isPdf,
      isExcel,
      base64Data,
      imageDimensions,
      excelSheets,
    } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: "fileName is required" });
    }

    const ai = getGeminiClient();

    // Check file category
    const isPdfFile = Boolean(isPdf) || fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
    const isExcelFile =
      Boolean(isExcel) ||
      fileName.toLowerCase().endsWith(".xlsx") ||
      fileName.toLowerCase().endsWith(".xls") ||
      (fileType && (fileType.includes("spreadsheet") || fileType.includes("excel")));
    const isJpg = fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg") || fileType === "image/jpeg";
    const isPng = fileName.toLowerCase().endsWith(".png") || fileType === "image/png";
    const isImageFile = Boolean(isImage) || isJpg || isPng || (fileType && fileType.startsWith("image/"));

    const systemInstruction = `You are a world-class File Analyzer, Forensic Media Specialist, Financial Data Scientist, and Quantitative Analyst.
Your mission is to perform comprehensive, in-depth analysis of files:
- For Excel Workbooks (.xlsx, .xls): Conduct exhaustive multi-sheet financial and operational data science audits. Compute aggregations, calculate key KPI formulas (SUM, AVERAGE, variance, ratios), evaluate column profiles, identify data anomalies (e.g. negative numbers, outliers, empty cells, budget overruns), and summarize each individual worksheet.
- For PDF Documents: Conduct full structural, semantic, and textual forensic analysis. Classify document type (Invoice, Contract, Academic Paper, Report, Resume, Manual, Financial Statement, etc.), outline key sections, extract visible text/OCR, highlight key figures, dates, and actionable clauses.
- For JPG / JPEG Images: Evaluate visual composition, photographic style, lighting, depth, compression artifacts, dominant color palette (with exact hex codes), optical character recognition (OCR) of text in the image, and detected objects.
- For PNG Images: Examine pixel precision, alpha transparency, typography/UI elements, graphics structure, dominant colors (with hex codes), OCR text, and design clarity.
- For Videos: Extract narrative, chronological progression, key scenes, pacing, motion dynamics, audio, and visual tone.
- For Code / Data / Text: Audit syntax, schema, data distributions, architecture, and complexity.

Always return highly structured, precise JSON matching the requested schema. Provide rich, factual, concrete insights without fluff.`;

    let contents: any[] = [];

    if (isExcelFile) {
      // EXCEL WORKBOOK QUANTITATIVE ANALYSIS
      const truncatedContent = (fileContent || "").length > 80000 
        ? (fileContent || "").substring(0, 80000) + "\n... [Remaining Rows Truncated for AI context] ..."
        : (fileContent || "");

      const sheetCount = excelSheets?.length || 1;
      const totalRecords = excelSheets?.reduce((acc: number, s: any) => acc + (s.rowCount || 0), 0) || 0;

      const prompt = `Perform an advanced, quantitative data science and financial audit of this Excel Workbook titled "${fileName}".
This workbook contains ${sheetCount} sheet(s) with approximately ${totalRecords} data rows.
Here is the multi-sheet data export:
\`\`\`
${truncatedContent}
\`\`\`

Provide:
1. Executive summary (summary): 2-3 sentences covering the purpose of the workbook, key business / operational domains, and the most significant takeaway from the numbers.
2. Technical description (fileTypeDetails): e.g. "Microsoft Excel (.xlsx) Multi-Sheet Financial Model with ${sheetCount} Sheet(s)".
3. Sheet summaries (excelSheetSummaries): An array for each sheet in the workbook with sheet name (name), row count (rowCount), column count (colCount), and a 1-sentence analytical synopsis (summary).
4. Key Formulas & Calculated KPI Metrics (keyFormulasOrMetrics): 3 to 5 calculated quantitative totals or ratios (e.g. Total Revenue, Average Margin, Overall Variance, Burn Rate, Top Region / Department), including the recommended Excel formula (formula, e.g. "=SUM(F2:F11)", "=AVERAGE(E2:E11)", "=XLOOKUP(...)") and a brief description.
5. 4 to 6 primary insights categorized into 'Financial', 'Spreadsheet', 'Metrics', 'Anomaly', 'Optimization', or 'Structure' (e.g., top-performing segments, under-budget departments, distribution trends, growth drivers).
6. 4 key quickStats (e.g., 'Total Sheets', 'Total Records', 'Aggregate Sum / Revenue', 'Top Category').
7. Data Anomalies (dataAnomalies): List 2 to 4 specific anomalies, outliers, negative values, discrepancies, or data hygiene observations found in the data rows.
8. Technical specs: totalSheets (${sheetCount}), totalRows (${totalRecords}), hasFormulas (true).
9. 4 highly tailored, actionable follow-up prompt suggestions that the user can ask regarding these sheets, formulas, or cross-tabulations.`;

      contents = [{ text: prompt }];

    } else if (isPdfFile && base64Data) {
      // PDF Forensic and Document Analysis
      const pdfPart = {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        },
      };
      const prompt = `Perform an exhaustive, professional document analysis of this PDF file titled "${fileName}".
Inspect all readable pages, typography, tables, headings, and metadata.
Provide:
1. A concise, authoritative executive summary (2-3 sentences) covering the purpose, audience, and main message of the document.
2. Document Classification (documentType) e.g., "Financial Invoice", "Legal Agreement / Contract", "Scientific Research Paper", "Executive Brief / Whitepaper", "Curriculum Vitae / Resume", "Technical Manual / Specification", or "Corporate Report".
3. 4-6 primary insights categorized into 'Document', 'Structure', 'Content', 'Metrics', 'Quality', or 'Anomaly' (e.g. key covenants, dates, financial totals, legal parties, methodologies, conclusions, risks).
4. 4 key quickStats (e.g. Page Count, Word Count, Language, Estimated Reading Time, Key Entity / Issuer).
5. Document Outline (major sections or headings with short summaries and page reference).
6. Extracted Text / OCR: transcribing the key headings, paragraphs, and critical data points from the document.
7. Technical specs: estimated pages, estimated word count, language, reading time in minutes.
8. 4 specific, high-value prompt suggestions for follow-up questions the user can ask regarding this PDF's data, clauses, or numbers.`;

      contents = [pdfPart, { text: prompt }];

    } else if (isImageFile && base64Data) {
      // JPG / PNG Image Analysis
      const mimeType = isJpg ? "image/jpeg" : isPng ? "image/png" : (fileType || "image/png");
      const formatLabel = isPng ? "PNG (Portable Network Graphics)" : isJpg ? "JPG / JPEG Image" : "Image File";

      const imagePart = {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      };

      const dimInfo = imageDimensions ? `Known Client Resolution: ${imageDimensions.width}x${imageDimensions.height} px.` : "";

      const prompt = `Perform a forensic visual and semantic analysis of this ${formatLabel} titled "${fileName}". ${dimInfo}
Inspect the visual composition, subject matter, text/signage/branding, color scheme, and technical fidelity.
Provide:
1. An overarching summary of what is depicted, its context, artistic or functional intent, and key visual focal points.
2. Technical description (fileTypeDetails) noting format nuances (e.g. "${isPng ? "PNG Raster with Alpha Channel & Sharp Edges" : "High-Fidelity JPEG Photographic Stream with Natural Tone Gradients"}").
3. Dominant Color Palette (dominantColors): 4 to 6 primary colors found in the image. For each, give an exact 6-character hex code (e.g., "#1E293B", "#10B981"), a descriptive color name (e.g., "Deep Emerald", "Slate Navy", "Warm Ivory"), and an estimated visual area percentage.
4. Detected Objects & Visual Tags (detectedObjects): 5 to 10 prominent items, themes, visual motifs, or UI elements.
5. Extracted Text / OCR (extractedText): Transcribe ANY visible text, signage, logos, labels, captions, or typography seen within the image. If absolutely no text exists, return an empty string.
6. 4 primary insights categorized into 'Visual', 'Palette', 'OCR', 'Quality', 'Structure', or 'Optimization'.
7. 4 key quickStats (e.g., Primary Aspect Ratio, Dominant Color, Subject Type, Visual Sharpness / Quality Score).
8. Technical specs including estimated aspect ratio, colorSpace (sRGB), hasAlpha (${isPng ? "true" : "false"}).
9. 4 engaging follow-up suggested prompts tailored to this specific image (e.g. color adjustments, OCR translation, design audit, composition breakdown).`;

      contents = [imagePart, { text: prompt }];

    } else if (isVideo && base64Data) {
      // Video Analysis
      const videoPart = {
        inlineData: {
          mimeType: fileType || "video/mp4",
          data: base64Data,
        },
      };
      const prompt = `Analyze this video file titled "${fileName}". 
Extract key scenes, chronological flow, narrative or demonstration actions, visual composition, pacing, notable objects, transitions, and any dialogue or audio elements present.
Provide:
1. An overarching executive summary of the video content and narrative.
2. 3-5 specific, high-value primary insights covering key scenes, visual clarity, transitions, audio/transcript summary, or highlighted timestamps.
3. 4 key video metrics or properties (e.g. estimated duration, pacing/tempo, motion dynamics, visual style, audio presence) as "quickStats".
4. 3 creative and tailored prompt suggestions for user inquiries.`;
      contents = [videoPart, { text: prompt }];

    } else {
      // Text, CSV, JSON, Markdown, or Code analysis
      const truncatedContent = (fileContent || "").length > 80000 
        ? (fileContent || "").substring(0, 80000) + "\n... [Content Truncated due to size] ..."
        : (fileContent || "");

      const prompt = `Analyze the uploaded file "${fileName}" (type: ${fileType || "Plain Text"}). 
Here is the file content:
\`\`\`
${truncatedContent}
\`\`\`

Perform the following:
1. Summarize the file's primary purpose or contents.
2. Formulate 3-5 high-value structural or content-related primary insights.
3. Extract 4 key metrics or properties (e.g., lines of code, rows of data, column names, word counts, nested levels, validation status, syntax style) as "quickStats".
4. Suggest 3 useful, specific, and creative prompts that the user can ask regarding this file's data or code.`;
      contents = [{ text: prompt }];
    }

    // Call Gemini with structured schema output
    const response = await generateContentWithFallback(ai, {
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["summary", "fileTypeDetails", "primaryInsights", "quickStats", "suggestedPrompts"],
          properties: {
            summary: {
              type: Type.STRING,
              description: "A professional 2-3 sentence overview of the file's content and overall purpose.",
            },
            fileTypeDetails: {
              type: Type.STRING,
              description: "A brief technical summary of the format (e.g. 'Microsoft Excel (.xlsx) Multi-Sheet Financial Model', 'PDF Document', 'JPEG Photographic Image', 'PNG Raster Graphic with Alpha').",
            },
            documentType: {
              type: Type.STRING,
              description: "Classification for documents/PDFs (e.g. 'Financial Invoice', 'Legal Contract', 'Resume / CV', 'Academic Paper', 'Corporate Report', 'User Manual'). Leave blank or null if not a document.",
            },
            extractedText: {
              type: Type.STRING,
              description: "Transcribed OCR text found in the image or key text/data extracted from the PDF document. Empty string if none.",
            },
            dominantColors: {
              type: Type.ARRAY,
              description: "For images: 3 to 6 dominant colors with hex code, name, and visual coverage percentage.",
              items: {
                type: Type.OBJECT,
                required: ["hex", "name"],
                properties: {
                  hex: { type: Type.STRING, description: "Valid 6-character hex string including '#' like '#10B981'" },
                  name: { type: Type.STRING, description: "Descriptive name like 'Emerald Green'" },
                  percentage: { type: Type.STRING, description: "Estimated percentage like '45%'" }
                }
              }
            },
            detectedObjects: {
              type: Type.ARRAY,
              description: "List of detected visual elements, subjects, objects, or UI components for images.",
              items: { type: Type.STRING }
            },
            documentOutline: {
              type: Type.ARRAY,
              description: "For PDFs: outline of major document sections with headings and summaries.",
              items: {
                type: Type.OBJECT,
                required: ["heading", "summary"],
                properties: {
                  heading: { type: Type.STRING, description: "Section or clause title" },
                  summary: { type: Type.STRING, description: "Brief 1-sentence synopsis of this section" },
                  page: { type: Type.STRING, description: "Page number or section ID if identifiable" }
                }
              }
            },
            excelSheetSummaries: {
              type: Type.ARRAY,
              description: "For Excel: summary of each sheet in the workbook.",
              items: {
                type: Type.OBJECT,
                required: ["name", "rowCount", "colCount", "summary"],
                properties: {
                  name: { type: Type.STRING, description: "Sheet tab name" },
                  rowCount: { type: Type.NUMBER, description: "Number of data rows" },
                  colCount: { type: Type.NUMBER, description: "Number of columns" },
                  summary: { type: Type.STRING, description: "Concise analytical summary of this sheet" }
                }
              }
            },
            keyFormulasOrMetrics: {
              type: Type.ARRAY,
              description: "For Excel / Datasets: calculated KPI metrics with suggested Excel formula.",
              items: {
                type: Type.OBJECT,
                required: ["label", "value"],
                properties: {
                  label: { type: Type.STRING, description: "Metric title, e.g. 'Total Q3 Revenue' or 'Average Margin'" },
                  value: { type: Type.STRING, description: "Computed value or amount" },
                  formula: { type: Type.STRING, description: "Suggested Excel formula e.g. '=SUM(F2:F11)' or '=AVERAGE(E2:E11)'" },
                  description: { type: Type.STRING, description: "Short rationale or explanation" }
                }
              }
            },
            dataAnomalies: {
              type: Type.ARRAY,
              description: "For Excel / Data: list of detected anomalies, negative values, discrepancies, or outliers.",
              items: { type: Type.STRING }
            },
            technicalSpecs: {
              type: Type.OBJECT,
              description: "Technical properties of the file.",
              properties: {
                format: { type: Type.STRING },
                dimensions: { type: Type.STRING },
                megapixels: { type: Type.STRING },
                aspectRatio: { type: Type.STRING },
                colorSpace: { type: Type.STRING },
                hasAlpha: { type: Type.BOOLEAN },
                estimatedPages: { type: Type.NUMBER },
                wordCount: { type: Type.NUMBER },
                language: { type: Type.STRING },
                readingTimeMinutes: { type: Type.NUMBER },
                totalSheets: { type: Type.NUMBER },
                totalRows: { type: Type.NUMBER },
                totalColumns: { type: Type.NUMBER },
                hasFormulas: { type: Type.BOOLEAN }
              }
            },
            primaryInsights: {
              type: Type.ARRAY,
              description: "3 to 6 key discoveries, observations, quality audits, patterns, or trends found in the file.",
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "category"],
                properties: {
                  title: { type: Type.STRING, description: "A concise, engaging title for the insight." },
                  description: { type: Type.STRING, description: "Detailed explanation of the insight with specific examples." },
                  category: { 
                    type: Type.STRING, 
                    description: "One of: 'Document', 'OCR', 'Palette', 'Structure', 'Quality', 'Metrics', 'Optimization', 'Content', 'Visual', 'Video', 'Audio', 'Anomaly', 'Spreadsheet', 'Financial', 'Formula'" 
                  }
                }
              }
            },
            quickStats: {
              type: Type.ARRAY,
              description: "Key metrics or properties extracted from the file metadata/contents.",
              items: {
                type: Type.OBJECT,
                required: ["label", "value", "unit"],
                properties: {
                  label: { type: Type.STRING, description: "Metric label, e.g., 'Sheets', 'Total Records', 'Revenue', 'Pages', 'Resolution'." },
                  value: { type: Type.STRING, description: "The calculated metric value." },
                  unit: { type: Type.STRING, description: "Unit of measurement, or leave blank if none." }
                }
              }
            },
            suggestedPrompts: {
              type: Type.ARRAY,
              description: "3 to 4 highly tailored follow-up question prompts.",
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini API");
    }

    const parsedResult = JSON.parse(resultText.trim());
    return res.json(parsedResult);

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to analyze the file", 
      details: error.stack 
    });
  }
});

// CHAT ASSISTANT API WITH MULTIMODAL GROUNDING & EXCEL CONTEXT
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, fileContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const ai = getGeminiClient();

    // Reconstruct Chat history and compile with system instruction
    const systemInstruction = `You are an expert conversational File & Media Analyst, Financial Data Scientist, and Spreadsheet Consultant. 
You are discussing the file that was uploaded:
File Name: "${fileContext?.fileName || "Unknown"}"
File Type: ${fileContext?.fileType || "General Document"}
Summary: ${fileContext?.summary || ""}
${fileContext?.documentType ? `Document Classification: ${fileContext.documentType}` : ""}
${fileContext?.extractedText ? `Extracted OCR / Document Text:\n${fileContext.extractedText.slice(0, 10000)}` : ""}
${fileContext?.isExcel ? `Excel Spreadsheet Data & Multi-Sheet Content:\n${(fileContext?.content || "").slice(0, 40000)}` : ""}

Use both the file's visual/multimodal content, tabular dataset, and any contextual summary to provide deep, accurate answers:
- If this is an Excel Spreadsheet (.xlsx, .xls): provide exact calculations (sums, averages, margins, variances), write functional Excel formulas (e.g. SUMIFS, XLOOKUP, INDEX/MATCH, AVERAGEIF, IF), answer questions about specific rows/cells, or recommend pivot tables and charts.
- If this is a PDF: explain clauses, verify calculations, summarize specific pages, cite sections, locate terms, or extract tables.
- If this is a JPG or PNG image: answer visual inquiries, describe objects, interpret text, explain composition, suggest color enhancements, or identify elements.
- If code/dataset: analyze syntax, debug, compute formulas, or transform formats.
Be clear, direct, insightful, and professional. Use formatting (tables, bullet points, formula code blocks) where helpful.`;

    // Map history to contents format for GoogleGenAI
    const formattedHistory: any[] = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Attach current user message, with multimodal inlineData if available for image or PDF
    const userParts: any[] = [];
    
    // Attach inlineData to ground the model on the actual file content if image or PDF
    if (fileContext?.base64Data && (fileContext.isImage || fileContext.isPdf)) {
      const mimeType = fileContext.isPdf 
        ? "application/pdf" 
        : fileContext.fileType || (fileContext.fileName?.toLowerCase().endsWith(".jpg") ? "image/jpeg" : "image/png");
      userParts.push({
        inlineData: {
          mimeType,
          data: fileContext.base64Data,
        },
      });
    }

    userParts.push({ text: message });

    formattedHistory.push({
      role: "user",
      parts: userParts,
    });

    const response = await generateContentWithFallback(ai, {
      contents: formattedHistory,
      config: {
        systemInstruction,
      }
    });

    return res.json({ 
      reply: response.text || "I was unable to formulate a response. Please try asking again.",
    });

  } catch (error: any) {
    console.error("Chat Error:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to process chat message",
      details: error.stack 
    });
  }
});

// INTEGRATE VITE DEV MIDDLEWARE IN DEV OR STATIC PRODUCTION FILE IN PROD
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
