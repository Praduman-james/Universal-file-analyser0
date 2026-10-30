import React, { useState } from "react";
import { AnalysisMode } from "../types";
import {
  X,
  Sparkles,
  BookOpen,
  Plus,
  Scale,
  FileCheck,
  Building,
  DollarSign,
  Check,
  Trash2,
  Copy,
} from "lucide-react";

export interface PromptTemplate {
  id: string;
  title: string;
  category: "legal" | "finance" | "compliance" | "hr" | "general";
  targetMode: AnalysisMode;
  description: string;
  systemPromptAddition: string;
}

const DEFAULT_TEMPLATES: PromptTemplate[] = [
  {
    id: "tpl-nda",
    title: "Vendor NDA & Confidentiality Audit",
    category: "legal",
    targetMode: "contract",
    description: "Audits unilateral vs bilateral terms, definition of Confidential Information, survival period, non-solicitation, and remedy clauses.",
    systemPromptAddition: "Strictly audit this Non-Disclosure Agreement. Highlight if obligations are unilateral, whether the survival clause exceeds 3 years, identify exclusions to confidential info, and flag injunctive relief stipulations.",
  },
  {
    id: "tpl-gst",
    title: "GST Tax Invoice & 3-Way Match",
    category: "finance",
    targetMode: "invoice",
    description: "Verifies 15-character GSTIN format, audits CGST/SGST/IGST arithmetic accuracy, line items, and TDS compliance.",
    systemPromptAddition: "Perform a thorough GST and accounting audit: verify seller and buyer GSTINs, calculate exact CGST (9%) + SGST (9%) or IGST (18%) math, verify line-item sub-totals against total payable, and flag any rounding discrepancies.",
  },
  {
    id: "tpl-employment",
    title: "Employment Agreement & Non-Compete Review",
    category: "hr",
    targetMode: "contract",
    description: "Scans non-compete enforceability under Indian law, intellectual property assignment, notice period buyout, and probation clauses.",
    systemPromptAddition: "Analyze this employment contract: evaluate non-compete enforceability (Section 27 of Indian Contract Act), verify IP assignment scope, note notice period and garden leave terms, and highlight any post-termination restrictions.",
  },
  {
    id: "tpl-lease",
    title: "Commercial Lease & Rental Deed Audit",
    category: "legal",
    targetMode: "contract",
    description: "Examines lock-in periods, security deposit refund terms, annual rent escalation percentage, and maintenance liability.",
    systemPromptAddition: "Review this lease/rental agreement: verify lock-in duration, notice period for termination, annual rent escalation percentage (typically 5-10%), security deposit deduction conditions, and structural repair obligations.",
  },
  {
    id: "tpl-bank",
    title: "Bank Statement Inflow & Loan Eligibility",
    category: "finance",
    targetMode: "bank_statement",
    description: "Calculates average monthly balance, recurring salary deposits, existing EMI debits, and any bounced cheque penalties.",
    systemPromptAddition: "Audit this bank statement for credit underwriting: compute average monthly inflow, list all detected recurring EMI/loan debits, flag any ECS return/bounce charges, and evaluate cash-flow stability.",
  },
  {
    id: "tpl-ni-act",
    title: "Legal Notice & Cheque Bounce (Sec 138 NI Act)",
    category: "legal",
    targetMode: "legal_notice",
    description: "Audits statutory 15-day payment demand window, cheque dishonor memo citation, cause of action, and legal defense advice.",
    systemPromptAddition: "Analyze this legal notice under Section 138 of Negotiable Instruments Act or CPC: verify the 15-day statutory response window, cite cheque numbers/amounts, identify allegations, and outline legally sound reply arguments.",
  },
];

const LOCAL_STORAGE_KEY = "universal-file-analyzer-custom-templates";

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: PromptTemplate) => void;
}

export default function TemplateLibraryModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplateLibraryModalProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return [...DEFAULT_TEMPLATES, ...JSON.parse(saved)];
    } catch {}
    return DEFAULT_TEMPLATES;
  });

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<"legal" | "finance" | "compliance" | "hr" | "general">("legal");
  const [newTargetMode, setNewTargetMode] = useState<AnalysisMode>("contract");
  const [newDesc, setNewDesc] = useState("");
  const [newPrompt, setNewPrompt] = useState("");

  if (!isOpen) return null;

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrompt.trim()) return;

    const custom: PromptTemplate = {
      id: "custom-tpl-" + Date.now(),
      title: newTitle,
      category: newCategory,
      targetMode: newTargetMode,
      description: newDesc || newTitle,
      systemPromptAddition: newPrompt,
    };

    const userCustomOnly = templates.filter((t) => t.id.startsWith("custom-tpl-"));
    const updatedUserCustom = [...userCustomOnly, custom];
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUserCustom));
    } catch {}

    setTemplates([...DEFAULT_TEMPLATES, ...updatedUserCustom]);
    setIsCreating(false);
    setNewTitle("");
    setNewDesc("");
    setNewPrompt("");
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    const userCustomOnly = updated.filter((t) => t.id.startsWith("custom-tpl-"));
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userCustomOnly));
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Custom Extraction Templates
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  Library
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pre-configured analysis recipes for NDA audits, GST verification, Lease agreements, and more
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/30 flex items-center justify-between text-xs">
          <span className="text-slate-400">Choose a template to automatically apply specialized extraction:</span>
          <button
            type="button"
            onClick={() => setIsCreating(!isCreating)}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCreating ? "Cancel" : "Create Custom Template"}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {isCreating && (
            <form onSubmit={handleSaveCustom} className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-3">
              <h3 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> New Custom Template
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1">Template Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Freelance Client SOW Review"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Target Mode</label>
                  <select
                    value={newTargetMode}
                    onChange={(e) => setNewTargetMode(e.target.value as AnalysisMode)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="contract">Contract Mode</option>
                    <option value="invoice">Invoice Mode</option>
                    <option value="receipt">Receipt Mode</option>
                    <option value="resume">Resume Mode</option>
                    <option value="bank_statement">Bank Statement</option>
                    <option value="legal_notice">Legal Notice</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Short Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Checks milestone payment schedule, revision limits, and copyright transfer."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Custom AI Extraction Instructions / Prompt</label>
                <textarea
                  required
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  rows={3}
                  placeholder="e.g. Look specifically for milestones, intellectual property retention until full payment, and late payment penalties."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium cursor-pointer"
                >
                  Save Template
                </button>
              </div>
            </form>
          )}

          {/* Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map((tpl) => {
              const isCustom = tpl.id.startsWith("custom-tpl-");
              return (
                <div
                  key={tpl.id}
                  onClick={() => {
                    onSelectTemplate(tpl);
                    onClose();
                  }}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900/60 transition-all cursor-pointer group flex flex-col justify-between relative"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 uppercase">
                        {tpl.category} • {tpl.targetMode}
                      </span>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustom(tpl.id, e)}
                          className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                          title="Delete Custom Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <h3 className="text-slate-100 font-semibold text-xs group-hover:text-purple-300 transition-colors mb-1">
                      {tpl.title}
                    </h3>
                    <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-3">
                      {tpl.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-purple-400 font-medium">
                    <span>Apply this template</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
