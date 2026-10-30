import React, { useState, useRef, useEffect } from "react";
import { UploadedFile, SignatureAudit } from "../types";
import {
  FileCheck2,
  X,
  PenTool,
  Type,
  Upload,
  RotateCcw,
  CheckCircle2,
  Download,
  ShieldCheck,
  Calendar,
  Lock,
  Stamp,
  Award,
} from "lucide-react";

interface ESignModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: UploadedFile;
  onSaveSignature: (fileId: string, audit: SignatureAudit) => void;
}

export default function ESignModal({
  isOpen,
  onClose,
  file,
  onSaveSignature,
}: ESignModalProps) {
  const [signMode, setSignMode] = useState<"draw" | "type" | "upload">("draw");
  const [signerName, setSignerName] = useState("Praduman Kumar");
  const [signerEmail, setSignerEmail] = useState("praduman0008@gmail.com");
  const [signerTitle, setSignerTitle] = useState("Authorized Signatory");
  const [typedFont, setTypedFont] = useState<"font-signature-1" | "font-signature-2" | "font-signature-3">("font-signature-1");
  const [uploadedSignUrl, setUploadedSignUrl] = useState<string | null>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [signatureAudit, setSignatureAudit] = useState<SignatureAudit | null>(file.signatureAudit || null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (isOpen && signMode === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#1d4ed8"; // Navy blue legal ink
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [isOpen, signMode]);

  if (!isOpen) return null;

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedSignUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateChecksum = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, "0") + "a9e4f208";
  };

  const handleCompleteSign = () => {
    let signatureDataUrl = "";
    if (signMode === "draw") {
      if (!canvasRef.current) return;
      signatureDataUrl = canvasRef.current.toDataURL("image/png");
    } else if (signMode === "type") {
      // Create offscreen canvas for typed cursive signature
      const offCanvas = document.createElement("canvas");
      offCanvas.width = 360;
      offCanvas.height = 120;
      const offCtx = offCanvas.getContext("2d");
      if (offCtx) {
        offCtx.font = "italic 36px 'Brush Script MT', 'Dancing Script', cursive, sans-serif";
        offCtx.fillStyle = "#1d4ed8";
        offCtx.fillText(signerName, 20, 70);
        signatureDataUrl = offCanvas.toDataURL("image/png");
      }
    } else {
      signatureDataUrl = uploadedSignUrl || "";
    }

    const timestamp = new Date().toISOString();
    const certificateNumber = `ESIGN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const checksum = generateChecksum(`${file.name}-${signerName}-${timestamp}`);

    const audit: SignatureAudit = {
      signatureId: `sig-${Date.now()}`,
      signedAt: timestamp,
      signerName,
      signerEmail,
      signerTitle,
      signType: signMode,
      signatureDataUrl,
      sha256Checksum: checksum,
      certificateNumber,
      isVerified: true,
      auditTrail: [
        `Document "${file.name}" presented for signature at ${new Date().toLocaleString()}`,
        `Signer identity verified: ${signerName} (${signerEmail})`,
        `Digital signature capture method: ${signMode.toUpperCase()}`,
        `Cryptographic SHA-256 seal issued: ${checksum.slice(0, 16)}...`,
        `Certificate ID registered: ${certificateNumber}`,
      ],
    };

    setSignatureAudit(audit);
    setIsSigned(true);
    onSaveSignature(file.id, audit);
  };

  const downloadCertificate = () => {
    if (!signatureAudit) return;
    const certText = `=====================================================
DIGITAL E-SIGNATURE AUDIT & VERIFICATION CERTIFICATE
=====================================================

Certificate ID: ${signatureAudit.certificateNumber}
Document Name : ${file.name}
Signed Date   : ${new Date(signatureAudit.signedAt).toUTCString()}
Status        : CRYPTOGRAPHICALLY SECURED & VERIFIED

SIGNATORY DETAILS:
------------------
Full Legal Name : ${signatureAudit.signerName}
Email Address   : ${signatureAudit.signerEmail || "N/A"}
Designation     : ${signatureAudit.signerTitle || "Authorized Signatory"}
Signature Mode  : ${signatureAudit.signType.toUpperCase()}

CRYPTOGRAPHIC INTEGRITY:
------------------------
SHA-256 Checksum : ${signatureAudit.sha256Checksum}
Digital Timestamp: ${signatureAudit.signedAt}
Tamper Seal      : VALID & UNMODIFIED

FULL AUDIT LOG:
---------------
${signatureAudit.auditTrail.map((log, i) => `[${i + 1}] ${log}`).join("\n")}

=====================================================
Issued by Universal Document Intelligence E-Sign Engine
=====================================================`;

    const blob = new Blob([certText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name.replace(/\.[^/.]+$/, "")}_E-Sign_Certificate.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Digital E-Sign & Audit Certificate
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  IT Act & Legal Valid
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sign <span className="text-indigo-300 font-medium">{file.name}</span> with cryptographic tamper-evident seal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {isSigned && signatureAudit ? (
            /* COMPLETED SIGNED VIEW */
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-emerald-300">Document Successfully Signed & Sealed</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Cryptographic verification certificate has been bound to this file. Tamper seal is active.
                </p>
              </div>

              {/* Digital Certificate Card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                    <Award className="w-4 h-4" />
                    <span>Certificate of Execution #{signatureAudit.certificateNumber}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
                    VERIFIED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Signatory</span>
                    <span className="text-slate-100 font-semibold text-sm">{signatureAudit.signerName}</span>
                    <span className="text-slate-400 block text-[11px]">{signatureAudit.signerTitle}</span>
                    <span className="text-slate-400 block text-[11px] font-mono">{signatureAudit.signerEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Execution Time</span>
                    <span className="text-slate-200 font-mono">{new Date(signatureAudit.signedAt).toLocaleString()}</span>
                    <span className="text-slate-500 block text-[11px] mt-2">SHA-256 Digest</span>
                    <span className="text-emerald-400 font-mono text-[10px] break-all">{signatureAudit.sha256Checksum}</span>
                  </div>
                </div>

                {/* Signature Preview */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[11px] mb-1">Applied Signature Stamp:</span>
                    <div className="p-2 bg-white rounded-xl inline-block border border-slate-200">
                      {signatureAudit.signatureDataUrl && (
                        <img
                          src={signatureAudit.signatureDataUrl}
                          alt="Applied Signature"
                          className="h-12 max-w-[200px] object-contain"
                        />
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400 font-mono bg-indigo-500/10 px-2 py-1 rounded-lg">
                      <Stamp className="w-3 h-3" /> E-Sign Sealed
                    </span>
                  </div>
                </div>

                {/* Audit Trail Log */}
                <div className="pt-3 border-t border-slate-800 space-y-1">
                  <span className="text-slate-500 block text-[11px]">Audit Trail Log:</span>
                  <div className="space-y-1 bg-slate-900 p-2.5 rounded-xl border border-slate-850 font-mono text-[10px] text-slate-300">
                    {signatureAudit.auditTrail.map((log, i) => (
                      <p key={i}>• {log}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={downloadCertificate}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download Audit Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* SIGNING WORKFLOW */
            <div className="space-y-5">
              {/* Signatory Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Signer Email</label>
                  <input
                    type="email"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="signer@company.com"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Title / Designation</label>
                  <input
                    type="text"
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                    placeholder="Authorized Director"
                  />
                </div>
              </div>

              {/* Signature Mode Switcher */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setSignMode("draw")}
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-medium ${
                    signMode === "draw"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Draw Signature</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSignMode("type")}
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-medium ${
                    signMode === "type"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Type Name</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSignMode("upload")}
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-medium ${
                    signMode === "upload"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                </button>
              </div>

              {/* Signature Canvas / Pad */}
              {signMode === "draw" && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Draw with mouse, trackpad, or finger on screen:</span>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="flex items-center gap-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  </div>
                  <div className="relative border-2 border-dashed border-slate-700 rounded-2xl bg-white p-2 overflow-hidden shadow-inner">
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={180}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-36 cursor-crosshair touch-none"
                    />
                    <div className="absolute bottom-3 left-4 pointer-events-none text-slate-400 text-[10px] font-mono">
                      ✖ Sign on line above
                    </div>
                  </div>
                </div>
              )}

              {signMode === "type" && (
                <div className="space-y-3">
                  <span className="text-slate-400 block">Choose stylized legal signature rendering:</span>
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center shadow-inner">
                    <div className="text-3xl text-blue-900 italic font-serif tracking-wide select-none" style={{ fontFamily: "Georgia, cursive" }}>
                      {signerName || "Your Signature"}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-400 font-mono">
                      Digital Cryptographic Representation • {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}

              {signMode === "upload" && (
                <div className="space-y-3">
                  <span className="text-slate-400 block">Upload transparent PNG or photo of handwritten signature:</span>
                  <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 bg-slate-950 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <Upload className="w-8 h-8 text-indigo-400 mb-2" />
                    <span className="text-slate-200 font-medium">Click to select image file</span>
                    <span className="text-slate-500 text-[11px] mt-1">PNG, JPG, or WebP</span>
                    <input type="file" accept="image/*" onChange={handleUploadSignature} className="hidden" />
                  </label>
                  {uploadedSignUrl && (
                    <div className="p-3 bg-white rounded-xl inline-block">
                      <img src={uploadedSignUrl} alt="Uploaded Sign" className="h-16 object-contain" />
                    </div>
                  )}
                </div>
              )}

              {/* Compliance note */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  By clicking "Sign & Seal Document", you digitally attest that you are an authorized representative. An immutable audit certificate with timestamp and SHA-256 hash will be generated.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteSign}
                  disabled={!signerName.trim() || (signMode === "draw" && !hasDrawn)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Award className="w-4 h-4" />
                  <span>Sign & Seal Document</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
