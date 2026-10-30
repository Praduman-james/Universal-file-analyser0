import React, { useState } from "react";
import {
  X,
  Sparkles,
  Languages,
  BookOpen,
  Check,
  Copy,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

interface ExplainTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentSnippet?: string;
  fileName?: string;
  onAskInChat?: (prompt: string) => void;
}

export default function ExplainTextModal({
  isOpen,
  onClose,
  documentSnippet = "",
  fileName = "Document",
  onAskInChat,
}: ExplainTextModalProps) {
  const [inputText, setInputText] = useState(documentSnippet || "");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    plainExplanation?: string;
    legalOrTechnicalBreakdown?: string;
    hindiTranslation?: string;
    keyTakeaway?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Translation tab states
  const [activeTab, setActiveTab] = useState<"explain" | "translate">("explain");
  const [targetLang, setTargetLang] = useState<"hi" | "en" | "hinglish">("hi");
  const [translationResult, setTranslationResult] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  if (!isOpen) return null;

  const handleExplain = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/explain-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textToExplain: inputText,
          fileContext: `Document: ${fileName}`,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to get explanation from server");
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to explain difficult text");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    setError(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          targetLanguage: targetLang,
        }),
      });
      if (!res.ok) throw new Error("Translation service failed");
      const data = await res.json();
      setTranslationResult(data.translatedText);
    } catch (err: any) {
      setError(err.message || "Failed to translate text");
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Clause & Difficult Text Explainer
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  PDF / DOCX
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Simplify convoluted clauses, legal jargon, and dense sentences with bilingual breakdown
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-800 flex items-center gap-3 bg-slate-950/30">
          <button
            type="button"
            onClick={() => setActiveTab("explain")}
            className={`text-xs font-semibold pb-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "explain"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explain Difficult Text</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("translate")}
            className={`text-xs font-semibold pb-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "translate"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>Translate Clause</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Input text area */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium flex items-center justify-between">
              <span>Paste or select clause / sentence from document:</span>
              <span className="text-[11px] text-slate-500">{inputText.length} chars</span>
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. 'Notwithstanding anything to the contrary contained herein, either party may terminate without prejudice to accrued rights upon ninety (90) days prior written notice...'"
              rows={4}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs font-mono resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === "explain" ? (
            <div>
              <button
                type="button"
                onClick={handleExplain}
                disabled={isLoading || !inputText.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing & Simplifying Clause...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Simplify & Explain in Plain Language</span>
                  </>
                )}
              </button>

              {result && (
                <div className="mt-5 space-y-3 animate-in fade-in duration-200">
                  {/* Key Takeaway */}
                  {result.keyTakeaway && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <span className="text-amber-400 font-semibold text-xs flex items-center gap-1.5 mb-1">
                        <Check className="w-3.5 h-3.5" />
                        Key Bottom Line:
                      </span>
                      <p className="text-slate-100 font-medium text-xs">{result.keyTakeaway}</p>
                    </div>
                  )}

                  {/* Plain Language */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-400 font-semibold text-xs">Plain Language Explanation:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(result.plainExplanation || "", "plain")}
                        className="text-slate-400 hover:text-slate-200 p-1"
                      >
                        {copiedField === "plain" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{result.plainExplanation}</p>
                  </div>

                  {/* Hindi Explanation */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                        <Languages className="w-3.5 h-3.5" />
                        सरल हिंदी में व्याख्या (Hindi Explanation):
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(result.hindiTranslation || "", "hindi")}
                        className="text-slate-400 hover:text-slate-200 p-1"
                      >
                        {copiedField === "hindi" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-sans">{result.hindiTranslation}</p>
                  </div>

                  {/* Technical & Legal Breakdown */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="text-purple-400 font-semibold text-xs">Legal / Technical Mechanics:</span>
                    <p className="text-slate-300 leading-relaxed">{result.legalOrTechnicalBreakdown}</p>
                  </div>

                  {/* Ask in chat shortcut */}
                  {onAskInChat && (
                    <button
                      type="button"
                      onClick={() => {
                        onAskInChat(`Can you explain what happens if this clause is breached: "${inputText.substring(0, 100)}..."?`);
                        onClose();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Ask follow-up question in Assistant Chat</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* TRANSLATION TAB */
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-slate-300 font-medium">Target Language:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetLang("hi")}
                    className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                      targetLang === "hi"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    हिंदी (Hindi)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetLang("hinglish")}
                    className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                      targetLang === "hinglish"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    Hinglish
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetLang("en")}
                    className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                      targetLang === "en"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTranslate}
                disabled={isTranslating || !inputText.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                {isTranslating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Translating accurately...</span>
                  </>
                ) : (
                  <>
                    <Languages className="w-4 h-4" />
                    <span>Translate Now</span>
                  </>
                )}
              </button>

              {translationResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-400 font-semibold text-xs">Translation:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(translationResult, "trans")}
                      className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                    >
                      {copiedField === "trans" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-slate-200 leading-relaxed font-sans text-xs">{translationResult}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
