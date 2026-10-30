import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  X,
  RefreshCw,
  Check,
  ShieldAlert,
  Upload,
  FileText,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Maximize2,
  Sliders,
  Image as ImageIcon,
} from "lucide-react";

interface CameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (capturedFile: {
    name: string;
    type: string;
    size: number;
    content: string;
    base64Data: string;
    isImage: boolean;
  }) => void;
}

export default function CameraScanner({ isOpen, onClose, onCapture }: CameraScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [rawCapturedImage, setRawCapturedImage] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"normal" | "document_bw" | "high_contrast">("document_bw");
  const [docTitle, setDocTitle] = useState("Scanned_Document.png");
  const [cameraError, setCameraError] = useState<{
    type: "permission" | "not_found" | "unsupported" | "generic";
    message: string;
  } | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage]);

  // Clean stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Listen for paste event when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            loadFileAsSnapshot(blob, "Pasted_Screenshot.png");
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen]);

  const startCamera = async () => {
    setIsStartingCamera(true);
    setCameraError(null);

    // Check mediaDevices support
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function"
    ) {
      setCameraError({
        type: "unsupported",
        message: "Direct camera streaming is not supported in this browser context or insecure environment.",
      });
      setIsStartingCamera(false);
      return;
    }

    // Attempt 1: Try environment camera (ideal for scanning physical papers)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsStartingCamera(false);
      return;
    } catch (firstErr: any) {
      // If it's a permission denial, don't attempt fallback; user explicitly denied
      if (
        firstErr?.name === "NotAllowedError" ||
        firstErr?.name === "PermissionDeniedError" ||
        firstErr?.message?.toLowerCase().includes("permission denied")
      ) {
        // Operational warning instead of console.error to avoid crashing / test alerts
        console.warn("Camera permission not granted by user or browser policy:", firstErr.name || firstErr.message);
        setCameraError({
          type: "permission",
          message: "Camera access was denied by your browser or device permissions.",
        });
        setIsStartingCamera(false);
        return;
      }

      // Attempt 2: Fallback to generic video (works on laptops/desktops without rear cameras)
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
        setIsStartingCamera(false);
        return;
      } catch (fallbackErr: any) {
        console.warn("Fallback camera access failed:", fallbackErr?.name || fallbackErr?.message);

        if (
          fallbackErr?.name === "NotAllowedError" ||
          fallbackErr?.name === "PermissionDeniedError" ||
          fallbackErr?.message?.toLowerCase().includes("permission denied")
        ) {
          setCameraError({
            type: "permission",
            message: "Camera access was denied by your browser or device permissions.",
          });
        } else if (fallbackErr?.name === "NotFoundError" || fallbackErr?.name === "DevicesNotFoundError") {
          setCameraError({
            type: "not_found",
            message: "No camera device was detected on your computer or device.",
          });
        } else {
          setCameraError({
            type: "generic",
            message: fallbackErr?.message || "Unable to start camera. Please upload an image or select a sample.",
          });
        }
        setIsStartingCamera(false);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      try {
        stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        // Ignore track stop errors
      }
      setStream(null);
    }
  };

  // Apply filters on captured image whenever filter mode changes
  const applyFiltersToImage = (srcDataUrl: string, mode: "normal" | "document_bw" | "high_contrast") => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      if (mode === "document_bw" || mode === "high_contrast") {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const threshold = mode === "high_contrast" ? 140 : 128;

        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (mode === "document_bw") {
            const val = gray > threshold ? 255 : Math.max(0, gray * 0.7);
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          } else {
            const val = gray > 130 ? 255 : 0;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      const filteredUrl = canvas.toDataURL("image/png");
      setCapturedImage(filteredUrl);
    };
    img.src = srcDataUrl;
  };

  const handleFilterChange = (newMode: "normal" | "document_bw" | "high_contrast") => {
    setFilterMode(newMode);
    if (rawCapturedImage) {
      applyFiltersToImage(rawCapturedImage, newMode);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawUrl = canvas.toDataURL("image/png");
    setRawCapturedImage(rawUrl);
    applyFiltersToImage(rawUrl, filterMode);
    stopCamera();
  };

  const loadFileAsSnapshot = (file: File, fallbackName?: string) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (PNG, JPG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setDocTitle(fallbackName || file.name || "Scanned_Document.png");
        setRawCapturedImage(result);
        applyFiltersToImage(result, filterMode);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadFileAsSnapshot(file);
    }
  };

  // Generate crisp realistic sample documents on canvas for instant testing without camera
  const loadSampleDocument = (type: "invoice" | "agreement") => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clean white paper background with slight natural shading
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative page border
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    if (type === "invoice") {
      setDocTitle("Sample_GST_Tax_Invoice_Hindi_English.png");

      // Header Banner
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(50, 50, canvas.width - 100, 110);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText("TAX INVOICE / कर चालान", 80, 115);

      ctx.font = "16px sans-serif";
      ctx.fillText("Original for Recipient • GSTIN: 27AABCA1234F1Z5", 700, 115);

      // Company info
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("BHARAT INDUSTRIAL SOLUTIONS PVT LTD", 80, 210);

      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText("Plot 42, Bandra-Kurla Complex, Mumbai, MH - 400051", 80, 240);
      ctx.fillText("Email: billing@bharat-solutions.in | Phone: +91 98200 12345", 80, 265);

      // Buyer Info & Metadata Box
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(80, 300, 500, 140);
      ctx.strokeRect(80, 300, 500, 140);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("Billed To (ग्राहक):", 100, 330);
      ctx.font = "15px sans-serif";
      ctx.fillText("Acme Enterprise Corporation Pvt Ltd", 100, 360);
      ctx.fillText("GSTIN: 07AAACA9876Q1Z3 • PAN: AAACA9876Q", 100, 385);
      ctx.fillText("Connaught Place, New Delhi - 110001", 100, 410);

      // Invoice Details Box
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(620, 300, 500, 140);
      ctx.strokeRect(620, 300, 500, 140);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("Invoice Details (चालान विवरण):", 640, 330);
      ctx.font = "15px sans-serif";
      ctx.fillText("Invoice No: INV-2026-9841", 640, 360);
      ctx.fillText("Date of Issue: 24/09/2026", 640, 385);
      ctx.fillText("Place of Supply: Delhi (07) • State Code: 07", 640, 410);

      // Table Header
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(80, 480, 1040, 45);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("SN", 100, 510);
      ctx.fillText("Description of Services / विवरण", 160, 510);
      ctx.fillText("HSN/SAC", 560, 510);
      ctx.fillText("Qty", 690, 510);
      ctx.fillText("Rate (₹)", 770, 510);
      ctx.fillText("Amount (₹)", 960, 510);

      // Rows
      const rows = [
        ["1", "Enterprise Cloud Infrastructure & AI Pipeline Hosting", "998313", "1", "1,20,000.00", "1,20,000.00"],
        ["2", "Bilingual OCR & Legal Clause Scrutiny Automation", "998314", "1", "45,000.00", "45,000.00"],
        ["3", "Chartered Accountant Forensic Audit & GST Sync", "998222", "1", "35,000.00", "35,000.00"],
      ];

      ctx.fillStyle = "#1e293b";
      ctx.font = "14px sans-serif";
      rows.forEach((r, idx) => {
        const y = 560 + idx * 50;
        ctx.fillText(r[0], 100, y);
        ctx.fillText(r[1], 160, y);
        ctx.fillText(r[2], 560, y);
        ctx.fillText(r[3], 690, y);
        ctx.fillText(r[4], 770, y);
        ctx.fillText(r[5], 960, y);

        ctx.strokeStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.moveTo(80, y + 20);
        ctx.lineTo(1120, y + 20);
        ctx.stroke();
      });

      // Totals
      const subtotalY = 740;
      ctx.font = "15px sans-serif";
      ctx.fillText("Subtotal (कुल राशि):", 720, subtotalY);
      ctx.fillText("₹ 2,00,000.00", 960, subtotalY);

      ctx.fillText("Integrated GST / IGST (18%):", 720, subtotalY + 35);
      ctx.fillText("₹ 36,000.00", 960, subtotalY + 35);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("Grand Total (शुद्ध देय राशि):", 720, subtotalY + 80);
      ctx.fillText("₹ 2,36,000.00", 960, subtotalY + 80);

      // Amount in words
      ctx.font = "italic 14px sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText("Amount in words: Two Lakh Thirty-Six Thousand Rupees Only", 80, subtotalY + 130);

      // Stamp & Signature Box
      ctx.strokeStyle = "#047857";
      ctx.strokeRect(800, subtotalY + 160, 280, 110);
      ctx.fillStyle = "#047857";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("VERIFIED DIGITAL SIGNATURE", 820, subtotalY + 190);
      ctx.font = "12px sans-serif";
      ctx.fillText("For Bharat Industrial Solutions", 820, subtotalY + 220);
      ctx.fillText("Auth Signatory: Rajesh Sharma", 820, subtotalY + 245);
    } else {
      setDocTitle("Sample_Service_Agreement_Clause_Scrutiny.png");

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 26px serif";
      ctx.fillText("MUTUAL NON-DISCLOSURE & MASTER SERVICE AGREEMENT", 120, 120);

      ctx.font = "15px serif";
      ctx.fillStyle = "#334155";
      ctx.fillText("This Agreement is made on this 24th day of September, 2026, by and between:", 120, 170);

      ctx.font = "bold 16px serif";
      ctx.fillText("Party A: Acme Global Innovations Inc., a Delaware corporation ('Disclosing Party')", 120, 210);
      ctx.fillText("Party B: Apex Technologies Pvt Ltd, a company registered under Indian Companies Act ('Receiving Party')", 120, 240);

      ctx.font = "bold 18px serif";
      ctx.fillStyle = "#0f172a";
      ctx.fillText("Clause 4. Unilateral Indemnity & Unlimited Liability", 120, 310);

      ctx.font = "15px serif";
      ctx.fillStyle = "#334155";
      const p1 =
        "The Receiving Party shall indemnify, defend, and hold harmless the Disclosing Party and its officers without limitation from and against any and all claims, liabilities, losses, damages, costs, or expenses (including reasonable attorney fees) arising from any breach of confidentiality or intellectual property covenants.";
      wrapText(ctx, p1, 120, 345, 960, 26);

      ctx.font = "bold 18px serif";
      ctx.fillStyle = "#0f172a";
      ctx.fillText("Clause 8. Non-Compete & Restrictive Covenants (36 Months)", 120, 460);

      ctx.font = "15px serif";
      ctx.fillStyle = "#334155";
      const p2 =
        "During the term of this Agreement and for a period of thirty-six (36) months following termination, the Receiving Party shall not directly or indirectly engage in any business or enterprise that competes with the Disclosing Party within the territory of India or globally (Subject to Section 27 of the Indian Contract Act, 1872).";
      wrapText(ctx, p2, 120, 495, 960, 26);

      ctx.font = "bold 18px serif";
      ctx.fillStyle = "#0f172a";
      ctx.fillText("Clause 14. Dispute Resolution & Exclusive Jurisdiction", 120, 610);

      ctx.font = "15px serif";
      ctx.fillStyle = "#334155";
      const p3 =
        "Any dispute arising out of or in connection with this Agreement shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be Mumbai, India, and the language shall be English.";
      wrapText(ctx, p3, 120, 645, 960, 26);

      // Signatures
      ctx.font = "bold 16px serif";
      ctx.fillStyle = "#0f172a";
      ctx.fillText("IN WITNESS WHEREOF, the parties hereto have executed this Agreement:", 120, 780);

      ctx.fillText("For Acme Global Innovations Inc.", 120, 840);
      ctx.font = "italic 16px serif";
      ctx.fillText("Johnathan Doe (VP Legal)", 120, 890);

      ctx.font = "bold 16px serif";
      ctx.fillText("For Apex Technologies Pvt Ltd", 650, 840);
      ctx.font = "italic 16px serif";
      ctx.fillText("Vikramaditya Rao (Director)", 650, 890);
    }

    const sampleUrl = canvas.toDataURL("image/png");
    setRawCapturedImage(sampleUrl);
    applyFiltersToImage(sampleUrl, filterMode);
    stopCamera();
  };

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(" ");
    let line = "";
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setRawCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (!capturedImage) return;
    const base64Data = capturedImage.split(",")[1];
    const byteLength = Math.round((base64Data.length * 3) / 4);

    onCapture({
      name: docTitle.endsWith(".png") ? docTitle : `${docTitle}.png`,
      type: "image/png",
      size: byteLength,
      content: "",
      base64Data,
      isImage: true,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
          loadFileAsSnapshot(file);
        }
      }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100 font-sans">Document Scanner</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Hindi & English OCR
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Live Camera • Mobile Snapshot • Physical Paper Scrutiny
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport / Live Stream Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[380px] max-h-[550px] overflow-hidden select-none">
          {/* Hidden Canvas for manipulation */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden File Input for Device Photo / File fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {isDragOver && (
            <div className="absolute inset-0 z-30 bg-emerald-950/80 border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xs">
              <Upload className="w-12 h-12 text-emerald-400 animate-bounce mb-2" />
              <p className="text-sm font-bold text-white">Drop Document Image Here</p>
              <p className="text-xs text-emerald-300">Will be instantly filtered and scanned</p>
            </div>
          )}

          {/* CASE 1: Camera Error / Permission Denied */}
          {cameraError ? (
            <div className="text-center p-6 max-w-lg space-y-4 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/5">
                <ShieldAlert className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-100 mb-1">
                  {cameraError.type === "permission"
                    ? "Camera Permission Denied"
                    : cameraError.type === "not_found"
                    ? "No Camera Detected"
                    : "Camera Not Accessible"}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">{cameraError.message}</p>
                {cameraError.type === "permission" && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 text-left flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      To allow live camera streaming, click the lock or settings icon in your browser address bar,
                      enable <strong>Camera</strong>, and click Retry. Or use one of the direct options below:
                    </span>
                  </div>
                )}
              </div>

              {/* Instant Alternative Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Take Photo / Select File</span>
                </button>

                <button
                  type="button"
                  onClick={() => loadSampleDocument("invoice")}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Try Sample GST Invoice</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => loadSampleDocument("agreement")}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-4 cursor-pointer"
                >
                  Or try Sample Legal Agreement
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={isStartingCamera}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isStartingCamera ? "animate-spin" : ""}`} />
                  Retry Camera
                </button>
              </div>
            </div>
          ) : !capturedImage ? (
            /* CASE 2: Live Video Stream Active */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="max-h-[500px] w-full object-contain"
              />

              {/* Document Alignment Frame */}
              <div className="absolute inset-6 sm:inset-10 border-2 border-dashed border-emerald-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-4 shadow-[0_0_50px_rgba(16,185,129,0.15)]">
                <div className="flex justify-between items-center text-[10px] text-emerald-400 font-mono tracking-wider bg-black/40 px-2 py-1 rounded backdrop-blur-xs w-full">
                  <span>TOP-LEFT</span>
                  <span className="text-emerald-300 font-sans font-bold flex items-center gap-1">
                    <Maximize2 className="w-3 h-3" /> ALIGN DOCUMENT INSIDE FRAME
                  </span>
                  <span>TOP-RIGHT</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-emerald-400 font-mono tracking-wider bg-black/40 px-2 py-1 rounded backdrop-blur-xs w-full">
                  <span>BOTTOM-LEFT</span>
                  <span>BILINGUAL OCR (HINDI / ENGLISH) READY</span>
                  <span>BOTTOM-RIGHT</span>
                </div>
              </div>
            </div>
          ) : (
            /* CASE 3: Captured / Loaded Image Preview */
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={capturedImage}
                alt="Scanned Document Preview"
                className="max-h-[460px] w-full object-contain rounded-xl shadow-2xl border border-slate-700/50"
              />
              <div className="absolute top-6 right-6 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300 flex items-center gap-1.5 font-mono shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ready for Extraction</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col gap-3">
          {!capturedImage ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Filter mode pill selector */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleFilterChange("normal")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    filterMode === "normal" ? "bg-slate-700 text-white font-medium" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Color
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange("document_bw")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    filterMode === "document_bw"
                      ? "bg-emerald-600 text-white font-medium shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Doc Crisp
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange("high_contrast")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    filterMode === "high_contrast"
                      ? "bg-slate-700 text-white font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  High B&W
                </button>
              </div>

              {/* Snap Button & Alternative Upload */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Pick image file or take photo from system dialog"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Choose Photo</span>
                </button>

                <button
                  type="button"
                  onClick={takeSnapshot}
                  disabled={!stream || !!cameraError}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Document</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Document title input */}
              <div className="w-full sm:w-auto flex-1">
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="Document_Title.png"
                />
              </div>

              {/* Filter change when image is already captured */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleFilterChange("normal")}
                  className={`px-2.5 py-1 rounded text-[11px] cursor-pointer ${
                    filterMode === "normal" ? "bg-slate-700 text-white font-medium" : "text-slate-400"
                  }`}
                >
                  Color
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange("document_bw")}
                  className={`px-2.5 py-1 rounded text-[11px] cursor-pointer ${
                    filterMode === "document_bw" ? "bg-emerald-600 text-white font-medium" : "text-slate-400"
                  }`}
                >
                  Doc Crisp
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange("high_contrast")}
                  className={`px-2.5 py-1 rounded text-[11px] cursor-pointer ${
                    filterMode === "high_contrast" ? "bg-slate-700 text-white font-medium" : "text-slate-400"
                  }`}
                >
                  High B&W
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Analyze Scanned Document</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
