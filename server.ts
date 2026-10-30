import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up large payload limits for PDF, video, image and document analysis
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

// Models to try in order of availability & stability
const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
];

function isTransientError(error: any): boolean {
  if (!error) return false;
  const status = error.status || error.code || error.error?.code || error.error?.status;
  const msg = (error.message || error.toString() || "").toLowerCase();
  return (
    status === 503 ||
    status === "503" ||
    status === "UNAVAILABLE" ||
    status === 429 ||
    status === "429" ||
    status === "RESOURCE_EXHAUSTED" ||
    msg.includes("503") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("spikes in demand") ||
    msg.includes("rate limit") ||
    msg.includes("resource_exhausted")
  );
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to attempt generation with silent fallback to alternative models if high demand or 503 occurs
async function generateContentWithFallback(ai: GoogleGenAI, requestOptions: any) {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      return await ai.models.generateContent({
        ...requestOptions,
        model,
      });
    } catch (error: any) {
      lastError = error;
      if (isTransientError(error)) {
        // Silently shift to the next candidate model without polluting stderr/build monitors
        continue;
      }
      // Non-transient error (e.g. invalid parameter), break immediately
      break;
    }
  }

  throw lastError || new Error("AI services are temporarily busy. Please try again shortly.");
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
      base64Data,
      docMode = "auto",
      language = "en",
      personaMode = "general",
    } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: "fileName is required" });
    }

    const ai = getGeminiClient();

    let langInstruction = "";
    if (language === "hi") {
      langInstruction = `Output ALL narrative fields (summary, insight titles, descriptions, recommendations) in fluent Hindi (Devanagari script). Retain exact proper nouns, numbers, currencies, and technical terms. Provide exact page/clause citations like [Page 1, Para 2] or [धारा 4.1].`;
    } else if (language === "hinglish") {
      langInstruction = `Output explanations in natural, clear Hinglish (conversational Hindi-English blend written in Latin script) widely used in Indian business, legal, and tech contexts.`;
    } else if (language === "regional") {
      langInstruction = `Perform OCR on any Indian regional language text (e.g. Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati). Transcribe accurately and provide bilingual explanations in English and Hindi.`;
    } else {
      langInstruction = `Provide answers in clear, professional English. If the document is in Hindi or regional languages, translate and provide bilingual context with citations.`;
    }

    let personaInstruction = "";
    if (personaMode === "lawyer") {
      personaInstruction = `\nLAWYER MODE ACTIVATED: You are acting as senior corporate & litigation legal counsel. Scrutinize clauses with extreme legal rigor. Emphasize: unilateral liabilities, uncapped indemnities, ambiguous termination rights, non-compete reasonableness under Indian Contract Act, arbitration clauses, jurisdiction, and statutory compliance risks.`;
    } else if (personaMode === "accountant") {
      personaInstruction = `\nACCOUNTANT MODE ACTIVATED: You are acting as a Chartered Accountant and forensic auditor. Scrutinize all numerical values with mathematical precision. Verify 15-character GSTIN structure, perform arithmetic cross-validation of total amounts against line-item sub-totals, check CGST (9%) + SGST (9%) or IGST (18%) percentages, flag missing invoice dates or serials, and identify unusual debits/credits.`;
    }

    // System prompt for structured file analysis
    const systemInstruction = `You are an elite Document Intelligence, Legal, Financial & Multimodal Analysis Agent.
Your capabilities:
1. Multi-format support: PDF, DOCX, XLSX, PPTX, Images (JPG, PNG, WebP), Videos (MP4, WebM), CSV, TXT, JSON, ZIP.
2. OCR: High-precision OCR for printed and handwritten Hindi, English, and regional Indian scripts.
3. Analysis Modes:
   - "contract": Identify contracting parties, effective & expiry dates, liabilities, indemnity, auto-renewal, termination clauses, dispute jurisdiction. Include exact citations (e.g. "Page 2, Clause 4.2").
   - "invoice": Extract vendor/buyer details, GSTIN/Tax IDs, invoice number, line-items table, taxes (CGST/SGST/IGST), total payable, bank details.
   - "receipt": Extract merchant, date/time, line items, taxes, payment mode, expense category.
   - "resume": Extract candidate contact, total experience, technical skills matrix, education, ATS score (0-100), improvement tips.
   - "bank_statement": Extract account holder, bank, statement period, opening/closing balance, total credit/debit, recurring transactions, high-value alerts.
   - "legal_notice": Extract sender/recipient, claims, legal statutes (e.g. Section 138 NI Act, CPC), remedies, response deadline, actionable legal options.
   - "general" or "auto": Automatically classify and adapt.
4. Always provide exact page, paragraph, or clause citations where applicable (e.g. "Page 1, Para 3", "Clause 8.1", "Row 14").
5. Extract structured tables as arrays of headers and rows for export to CSV/Excel.
6. Detect Sensitive Information (PII) including Aadhaar (12 digits), PAN (5 letters + 4 digits + 1 letter), Phone numbers, Emails, Credit Cards, Bank Accounts.
7. ${langInstruction}${personaInstruction}`;

    let prompt = "";
    let contents: any[] = [];

    if (isPdf && base64Data) {
      // Inline PDF document analysis
      const pdfPart = {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        },
      };
      prompt = `Analyze this PDF document titled "${fileName}".
Analysis Mode: ${docMode}.
Language Preference: ${language}.
Instructions:
1. Detect document category (contract, invoice, receipt, resume, bank_statement, legal_notice, or general).
2. Transcribe and extract all textual data (including Hindi/regional OCR if present).
3. Extract 3-6 high-impact primary insights with EXACT page/paragraph citations (e.g. "Page 1, Para 2" or "Clause 3.1").
4. Extract 3-5 quick key stats/metrics (e.g. Total Amount, Due Date, Parties, Pages, ATS Score, Word Count).
5. Extract any structured tabular data into the "extractedTables" field.
6. Detect any PII (Aadhaar, PAN, Phone, Email, Bank Account, Credit Card) with masked values.
7. Provide 3-4 insightful suggested follow-up prompts.`;
      contents = [pdfPart, { text: prompt }];
    } else if (isVideo && base64Data) {
      // Video analysis
      const videoPart = {
        inlineData: {
          mimeType: fileType || "video/mp4",
          data: base64Data,
        },
      };
      prompt = `Analyze this video file titled "${fileName}". 
Extract key scenes, chronological flow, narrative actions, visual composition, pacing, dialogue/audio presence, and timestamp markers.
Provide:
1. Executive summary of video content.
2. 3-5 primary insights with timestamp citations (e.g. "00:15 - Scene 1").
3. 2-4 key video metrics as quickStats.
4. Suggested follow-up prompts.`;
      contents = [videoPart, { text: prompt }];
    } else if (isImage && base64Data) {
      // Image analysis with OCR
      const imagePart = {
        inlineData: {
          mimeType: fileType || "image/png",
          data: base64Data,
        },
      };
      prompt = `Analyze this image titled "${fileName}".
Analysis Mode: ${docMode}.
Language Preference: ${language}.
Perform comprehensive OCR (English, Hindi, and regional scripts). 
If it is a document, invoice, receipt, ID card, or contract page, parse its structure, detect PII, extract tables if visible, and provide exact citations and key stats. Include full OCR text in "ocrText".`;
      contents = [imagePart, { text: prompt }];
    } else {
      // Text, Office DOCX, PPTX, CSV, JSON, ZIP
      const truncatedContent = (fileContent || "").length > 90000 
        ? (fileContent || "").substring(0, 90000) + "\n... [Content Truncated due to size] ..."
        : (fileContent || "");

      prompt = `Analyze the uploaded document "${fileName}" (type: ${fileType || "Plain Text"}).
Analysis Mode: ${docMode}.
Language Preference: ${language}.
Document content:
\`\`\`
${truncatedContent}
\`\`\`
Perform:
1. Summarize the document's primary purpose, key entities, and findings.
2. Formulate 3-6 high-value primary insights with exact page, clause, or line citations.
3. Extract 3-5 key metrics/properties as quickStats.
4. Extract any tabular data into "extractedTables" (headers & rows).
5. Detect any PII (Aadhaar, PAN, phone, email, accounts) for redaction.
6. Suggest 3-4 specific, actionable follow-up questions.`;
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
              description: "A comprehensive executive overview of the document contents, context, and purpose in the requested language.",
            },
            fileTypeDetails: {
              type: Type.STRING,
              description: "A precise technical summary (e.g. 'Bilingual Service Contract PDF', 'GST Tax Invoice', 'Indian Bank Statement XLSX', 'Software Engineer Resume').",
            },
            detectedLanguage: {
              type: Type.STRING,
              description: "Language(s) detected in the file (e.g. 'English + Hindi Bilingual', 'English', 'Hindi Devanagari', 'Marathi').",
            },
            detectedDocMode: {
              type: Type.STRING,
              description: "Detected document class: 'contract', 'invoice', 'receipt', 'resume', 'bank_statement', 'legal_notice', or 'general'.",
            },
            primaryInsights: {
              type: Type.ARRAY,
              description: "3 to 6 key discoveries, clauses, obligations, financial items, or quality audits.",
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "category"],
                properties: {
                  title: { type: Type.STRING, description: "Concise title for the insight." },
                  description: { type: Type.STRING, description: "Detailed explanation with specific evidence and findings." },
                  category: {
                    type: Type.STRING,
                    description: "One of: 'Structure', 'Quality', 'Metrics', 'Optimization', 'Content', 'Visual', 'Video', 'Audio', 'Anomaly', 'Legal', 'Financial', 'Obligation', 'Compliance'",
                  },
                  citation: {
                    type: Type.STRING,
                    description: "Exact citation in the document, e.g. 'Page 2, Clause 4.1', 'Paragraph 3', 'Row 15', '00:45'.",
                  },
                },
              },
            },
            quickStats: {
              type: Type.ARRAY,
              description: "Key metrics extracted from the document.",
              items: {
                type: Type.OBJECT,
                required: ["label", "value", "unit"],
                properties: {
                  label: { type: Type.STRING, description: "Metric label, e.g., 'Total GST', 'Contract Term', 'ATS Score', 'Notice Deadline'." },
                  value: { type: Type.STRING, description: "The calculated metric value." },
                  unit: { type: Type.STRING, description: "Unit of measurement or blank." },
                },
              },
            },
            extractedTables: {
              type: Type.ARRAY,
              description: "Structured tables extracted from the document for CSV/Excel export.",
              items: {
                type: Type.OBJECT,
                required: ["title", "headers", "rows"],
                properties: {
                  title: { type: Type.STRING, description: "Table title or caption" },
                  headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  rows: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  pageOrSection: { type: Type.STRING, description: "Page or section where table was found." },
                },
              },
            },
            piiDetected: {
              type: Type.ARRAY,
              description: "List of sensitive personal or financial information found.",
              items: {
                type: Type.OBJECT,
                required: ["type", "value", "maskedValue", "riskLevel"],
                properties: {
                  type: { type: Type.STRING, description: "'Aadhaar', 'PAN', 'Phone', 'Email', 'Credit Card', 'Bank Account', 'SSN', 'Address', or 'Name'" },
                  value: { type: Type.STRING, description: "Raw sensitive value detected" },
                  maskedValue: { type: Type.STRING, description: "Redacted or masked value, e.g. 'XXXX-XXXX-1234'" },
                  riskLevel: { type: Type.STRING, description: "'High', 'Medium', or 'Low'" },
                  pageOrLocation: { type: Type.STRING, description: "Location in document" },
                },
              },
            },
            ocrText: {
              type: Type.STRING,
              description: "Full transcribed searchable text layer from OCR if applicable.",
            },
            suggestedPrompts: {
              type: Type.ARRAY,
              description: "3-4 tailored follow-up question prompts.",
              items: { type: Type.STRING },
            },
            // Contract specific intelligence
            contractDetails: {
              type: Type.OBJECT,
              description: "Extracted contract details if the document is an agreement, contract, NDA, lease, or legal deed.",
              properties: {
                parties: { type: Type.ARRAY, items: { type: Type.STRING }, description: "All contracting parties named." },
                obligations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      party: { type: Type.STRING },
                      obligation: { type: Type.STRING },
                      citation: { type: Type.STRING },
                    },
                  },
                },
                dates: {
                  type: Type.OBJECT,
                  properties: {
                    effective: { type: Type.STRING },
                    expiry: { type: Type.STRING },
                    keyDeadlines: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                },
                paymentTerms: { type: Type.STRING },
                terminationClauses: { type: Type.STRING },
                jurisdiction: { type: Type.STRING },
                riskFlags: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      flag: { type: Type.STRING },
                      severity: { type: Type.STRING, description: "'High', 'Medium', or 'Low'" },
                      citation: { type: Type.STRING },
                    },
                  },
                },
              },
            },
            // Invoice specific intelligence
            invoiceDetails: {
              type: Type.OBJECT,
              description: "Extracted invoice fields if document is an invoice or bill.",
              properties: {
                vendor: { type: Type.STRING },
                invoiceNumber: { type: Type.STRING },
                date: { type: Type.STRING },
                dueDate: { type: Type.STRING },
                tax: { type: Type.STRING },
                total: { type: Type.STRING },
              },
            },
            // Receipt specific intelligence
            receiptDetails: {
              type: Type.OBJECT,
              description: "Extracted receipt details if document is a point-of-sale receipt or expense ticket.",
              properties: {
                merchant: { type: Type.STRING },
                amount: { type: Type.STRING },
                category: { type: Type.STRING },
                date: { type: Type.STRING },
              },
            },
            // Resume specific intelligence
            resumeDetails: {
              type: Type.OBJECT,
              description: "Extracted resume breakdown if document is a CV or resume.",
              properties: {
                skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                experience: { type: Type.ARRAY, items: { type: Type.STRING } },
                education: { type: Type.ARRAY, items: { type: Type.STRING } },
                jobMatchSummary: { type: Type.STRING },
              },
            },
            // Bank statement specific intelligence
            bankStatementDetails: {
              type: Type.OBJECT,
              description: "Extracted financial statement metrics if document is a bank statement or passbook.",
              properties: {
                income: { type: Type.STRING },
                expenses: { type: Type.STRING },
                recurringPayments: { type: Type.ARRAY, items: { type: Type.STRING } },
                unusualTransactions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
            // XLSX/CSV Dataset specific intelligence
            datasetDetails: {
              type: Type.OBJECT,
              description: "Structured dataset explanation, trends, totals, and charts if document is a spreadsheet or CSV table.",
              properties: {
                columnExplanations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      column: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                    },
                  },
                },
                totals: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      metric: { type: Type.STRING },
                      value: { type: Type.STRING },
                    },
                  },
                },
                trends: { type: Type.ARRAY, items: { type: Type.STRING } },
                simpleCharts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      labels: { type: Type.ARRAY, items: { type: Type.STRING } },
                      values: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                    },
                  },
                },
              },
            },
            // Image specific intelligence
            imageDetails: {
              type: Type.OBJECT,
              description: "Visual analysis, classification, and OCR field extraction if document is an image or photo scan.",
              properties: {
                ocrText: { type: Type.STRING },
                description: { type: Type.STRING },
                classification: { type: Type.STRING },
                extractedFields: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      field: { type: Type.STRING },
                      value: { type: Type.STRING },
                    },
                  },
                },
              },
            },
          },
        },
      },
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

// EXPLAIN DIFFICULT TEXT / JARGON / CLAUSE API (For PDF, DOCX, Contracts, Legal, Technical)
app.post("/api/explain-text", async (req, res) => {
  try {
    const { textToExplain, fileContext = "", language = "en" } = req.body;

    if (!textToExplain) {
      return res.status(400).json({ error: "textToExplain is required" });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are a Legal, Technical, and Linguistic Document Intelligence Specialist.
Your task is to take difficult, dense, jargon-laden, or complex clauses/sentences from documents (PDF, DOCX, Contracts, Policies) and make them crystal clear.
Provide:
1. plainExplanation: Clear, simple explanation that anyone can understand without technical training.
2. legalOrTechnicalBreakdown: Point-by-point breakdown of rights, conditions, obligations, or risks.
3. hindiTranslation: Fluent Hindi explanation (Devanagari script) explaining what this means.
4. keyTakeaway: Direct 1-line actionable advice or meaning for the reader.`;

    const prompt = `Explain and simplify this difficult text:
"${textToExplain}"

Document Context:
${fileContext}`;

    const response = await generateContentWithFallback(ai, {
      contents: [{ text: prompt }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["plainExplanation", "legalOrTechnicalBreakdown", "hindiTranslation", "keyTakeaway"],
          properties: {
            plainExplanation: { type: Type.STRING },
            legalOrTechnicalBreakdown: { type: Type.STRING },
            hindiTranslation: { type: Type.STRING },
            keyTakeaway: { type: Type.STRING },
          },
        },
      },
    });

    const output = JSON.parse(response.text?.trim() || "{}");
    return res.json(output);
  } catch (error: any) {
    console.error("Explain Text Error:", error);
    return res.status(500).json({ error: error.message || "Failed to explain text" });
  }
});

// ON-DEMAND TRANSLATE API
app.post("/api/translate", async (req, res) => {
  try {
    const { text, targetLanguage = "hi" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    const ai = getGeminiClient();
    let langName = "Hindi (Devanagari script)";
    if (targetLanguage === "en") langName = "English";
    else if (targetLanguage === "hinglish") langName = "Hinglish (conversational Hindi-English in Latin alphabet)";
    else if (targetLanguage === "mr") langName = "Marathi";
    else if (targetLanguage === "bn") langName = "Bengali";

    const prompt = `Translate the following text accurately into ${langName}. Preserve proper names, numbers, currencies, and technical terms:\n\n${text}`;

    const response = await generateContentWithFallback(ai, {
      contents: [{ text: prompt }],
    });

    return res.json({ translatedText: response.text?.trim() || text });
  } catch (error: any) {
    console.error("Translation Error:", error);
    return res.status(500).json({ error: error.message || "Translation failed" });
  }
});

// FILE COMPARISON API (Diff contracts, invoices, statements, or resumes)
app.post("/api/compare", async (req, res) => {
  try {
    const { file1, file2, comparisonType = "auto", language = "en" } = req.body;

    if (!file1 || !file2) {
      return res.status(400).json({ error: "Both file1 and file2 are required for comparison" });
    }

    const ai = getGeminiClient();

    let langInstruction = "";
    if (language === "hi") {
      langInstruction = `Output ALL narrative fields and difference explanations in clear Hindi (Devanagari script), preserving numbers and clause names.`;
    } else if (language === "hinglish") {
      langInstruction = `Output explanations in natural conversational Hinglish.`;
    }

    const systemInstruction = `You are a Senior Legal Counsel, Forensic Auditor, and Document Comparison Specialist.
Your task is to compare two versions of a document, contract, invoice, resume, or financial statement.
Highlight:
1. Exact additions, deletions, and alterations.
2. Financial shifts (prices, rates, taxes, totals, salaries).
3. Clause-by-clause changes (indemnity, liability, termination, warranties, deadlines).
4. Critical risk flags and strategic verdict.
5. Exact citations to both documents where applicable.
${langInstruction}`;

    const prompt = `Compare these two documents:
DOCUMENT 1: "${file1.name}" (${file1.type || "Document"})
Summary: ${file1.summary || "No summary provided"}
Content snippet:
\`\`\`
${(file1.content || "").substring(0, 45000)}
\`\`\`

DOCUMENT 2: "${file2.name}" (${file2.type || "Document"})
Summary: ${file2.summary || "No summary provided"}
Content snippet:
\`\`\`
${(file2.content || "").substring(0, 45000)}
\`\`\`

Comparison Mode: ${comparisonType}.
Analyze every difference meticulously and output the structured JSON comparison.`;

    const response = await generateContentWithFallback(ai, {
      contents: [{ text: prompt }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["file1Name", "file2Name", "executiveSummary", "similarityScore", "majorDifferences", "verdict"],
          properties: {
            file1Name: { type: Type.STRING },
            file2Name: { type: Type.STRING },
            executiveSummary: { type: Type.STRING, description: "High-level overview of how the documents differ." },
            similarityScore: { type: Type.NUMBER, description: "Percentage similarity between 0 and 100." },
            majorDifferences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "type"],
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING, description: "'added', 'removed', 'modified', or 'risk'" },
                  citation1: { type: Type.STRING, description: "Citation in Doc 1" },
                  citation2: { type: Type.STRING, description: "Citation in Doc 2" },
                },
              },
            },
            financialShifts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["item", "file1Value", "file2Value", "difference"],
                properties: {
                  item: { type: Type.STRING },
                  file1Value: { type: Type.STRING },
                  file2Value: { type: Type.STRING },
                  difference: { type: Type.STRING },
                },
              },
            },
            clauseChanges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["clauseName", "file1Text", "file2Text", "impact"],
                properties: {
                  clauseName: { type: Type.STRING },
                  file1Text: { type: Type.STRING },
                  file2Text: { type: Type.STRING },
                  impact: { type: Type.STRING },
                },
              },
            },
            verdict: { type: Type.STRING, description: "Actionable summary recommendation on which version is preferable or key risks to negotiate." },
          },
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from comparison");
    }

    return res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.error("Comparison Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to compare files",
      details: error.stack,
    });
  }
});

// CHAT ASSISTANT API
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, fileContext, language = "auto" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const ai = getGeminiClient();

    // Reconstruct Chat history and compile with system instruction
    const systemInstruction = `You are a conversational file and document assistant.
You are discussing the file that was uploaded.
Key rules:
1. "Ask in Hindi, answer in Hindi": If the user's question is in Hindi (or Devanagari script), answer in fluent, respectful Hindi. If in Hinglish, answer in Hinglish. If in English, answer in English. You can also offer bilingual clarifications for complex legal/technical terms.
2. Exact Citations: Whenever you cite facts, clauses, numbers, or conclusions, explicitly cite the exact location in brackets, e.g., "[Page 2, Para 4]" or "[Clause 7.2]" or "[Row 12]" or "[Timestamp 01:23]".
3. Privacy: Never invent non-existent facts; stick strictly to the file context.

File Context:
---
File Name: ${fileContext.fileName}
File Type: ${fileContext.fileType}
Document Mode: ${fileContext.docMode || "General"}
Analysis Summary: ${fileContext.summary}
${fileContext.ocrText ? `OCR Transcribed Text:\n${fileContext.ocrText.substring(0, 30000)}\n` : ""}
${fileContext.isVideo ? "Video Media File analyzed." : fileContext.content ? `File Contents (Truncated if large):\n${fileContext.content.substring(0, 50000)}` : "Visual/PDF data analyzed successfully."}
---`;

    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    formattedHistory.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await generateContentWithFallback(ai, {
      contents: formattedHistory,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({ 
      reply: response.text || "I was unable to formulate a response. Please try asking again.",
    });

  } catch (error: any) {
    console.error("Chat Error:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to process chat message",
      details: error.stack,
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
