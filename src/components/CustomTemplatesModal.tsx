import React, { useState } from "react";
import { CustomTemplate, UploadedFile } from "../types";
import {
  Sparkles,
  X,
  Plus,
  Check,
  FileCode,
  Scale,
  DollarSign,
  Briefcase,
  HeartPulse,
  Building,
  Trash2,
  Play,
} from "lucide-react";

interface CustomTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFile: UploadedFile;
  onApplyTemplate: (template: CustomTemplate) => void;
}

export const BUILTIN_TEMPLATES: CustomTemplate[] = [
  {
    id: "tpl-nda",
    name: "Vendor Non-Disclosure Agreement (NDA)",
    category: "Contract",
    description: "Extracts confidentiality terms, exclusions, non-solicitation, jurisdiction, and survival duration.",
    isBuiltIn: true,
    fieldsToExtract: [
      { key: "disclosing_party", label: "Disclosing Party", description: "Name of party sharing confidential data", type: "text" },
      { key: "receiving_party", label: "Receiving Party", description: "Name of recipient party", type: "text" },
      { key: "confidential_scope", label: "Scope of Confidential Information", description: "Definition of covered proprietary items", type: "text" },
      { key: "term_years", label: "Duration / Term", description: "Agreement lifespan and survival clause", type: "text" },
      { key: "non_solicit", label: "Non-Solicitation Clause", description: "Restrictions on hiring recipient's employees", type: "text" },
      { key: "dispute_venue", label: "Governing Law & Dispute Venue", description: "Jurisdiction & arbitration venue", type: "text" },
    ],
  },
  {
    id: "tpl-lease",
    name: "Commercial Lease & Rental Agreement",
    category: "Contract",
    description: "Extracts premises, rent schedule, security deposit, escalation percentage, and lock-in period.",
    isBuiltIn: true,
    fieldsToExtract: [
      { key: "lessor", label: "Landlord / Lessor", description: "Property owner legal entity", type: "text" },
      { key: "lessee", label: "Tenant / Lessee", description: "Renting individual or corporation", type: "text" },
      { key: "premises_address", label: "Property / Premises Address", description: "Complete address and unit number", type: "text" },
      { key: "monthly_rent", label: "Monthly Rent Payable", description: "Base rent excluding maintenance & taxes", type: "currency" },
      { key: "security_deposit", label: "Security Deposit Amount", description: "Refundable security deposit paid", type: "currency" },
      { key: "lock_in_period", label: "Lock-in Period", description: "Minimum mandatory occupancy period", type: "text" },
      { key: "escalation_clause", label: "Annual Rent Escalation", description: "Percentage increase per annum (e.g. 5%)", type: "text" },
    ],
  },
  {
    id: "tpl-gst-invoice",
    name: "Indian GST Tax Invoice & Bill",
    category: "Invoice",
    description: "Extracts GSTIN numbers, HSN/SAC codes, reverse charge indicator, CGST/SGST/IGST, and bank IFSC.",
    isBuiltIn: true,
    fieldsToExtract: [
      { key: "supplier_gstin", label: "Supplier GSTIN", description: "15-digit alphanumeric GST identification", type: "text" },
      { key: "recipient_gstin", label: "Recipient GSTIN", description: "Buyer 15-digit GST identification", type: "text" },
      { key: "invoice_number", label: "Invoice Number", description: "Unique sequential billing invoice ID", type: "text" },
      { key: "invoice_date", label: "Invoice Date", description: "Date of invoice generation", type: "date" },
      { key: "taxable_amount", label: "Taxable Value", description: "Total value before applicable taxes", type: "currency" },
      { key: "cgst_sgst_igst", label: "CGST / SGST / IGST Split", description: "Breakup of goods and services taxes", type: "currency" },
      { key: "grand_total", label: "Grand Total Payable", description: "Final invoice amount payable in INR", type: "currency" },
      { key: "bank_account", label: "Bank Account & IFSC Code", description: "Vendor bank remittance coordinates", type: "text" },
    ],
  },
  {
    id: "tpl-offer-letter",
    name: "Employment Offer Letter & Compensation (CTC)",
    category: "HR",
    description: "Extracts job title, fixed salary, variable bonus, probation, notice period, and non-compete terms.",
    isBuiltIn: true,
    fieldsToExtract: [
      { key: "candidate_name", label: "Candidate Name", description: "Full name of prospective employee", type: "text" },
      { key: "job_designation", label: "Job Title & Department", description: "Assigned role and organizational unit", type: "text" },
      { key: "annual_ctc", label: "Total Annual CTC", description: "Cost to company package in INR or USD", type: "currency" },
      { key: "fixed_component", label: "Fixed Base Pay", description: "Monthly fixed component", type: "currency" },
      { key: "probation_period", label: "Probationary Period", description: "Duration of initial evaluation", type: "text" },
      { key: "notice_period", label: "Notice Period Duration", description: "Mandatory resignation notice timeline", type: "text" },
    ],
  },
  {
    id: "tpl-medical",
    name: "Medical Hospitalization & Insurance Claim",
    category: "Medical",
    description: "Extracts patient name, hospital, admission/discharge dates, procedure, and deductible breakdown.",
    isBuiltIn: true,
    fieldsToExtract: [
      { key: "patient_name", label: "Patient Name & UHID", description: "Hospital registration patient ID", type: "text" },
      { key: "hospital_name", label: "Hospital / Provider Name", description: "Healthcare facility name", type: "text" },
      { key: "admission_discharge", label: "Admission & Discharge Dates", description: "Treatment period timeline", type: "text" },
      { key: "diagnosis", label: "Diagnosis / ICD Code", description: "Primary medical diagnosis or surgery", type: "text" },
      { key: "total_billed", label: "Total Hospital Bill", description: "Gross claim amount submitted", type: "currency" },
    ],
  },
];

export default function CustomTemplatesModal({
  isOpen,
  onClose,
  activeFile,
  onApplyTemplate,
}: CustomTemplatesModalProps) {
  const [templates, setTemplates] = useState<CustomTemplate[]>(() => {
    try {
      const saved = localStorage.getItem("custom_document_templates");
      if (saved) return [...BUILTIN_TEMPLATES, ...JSON.parse(saved)];
    } catch {
      // fallback
    }
    return BUILTIN_TEMPLATES;
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || "");
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // New template fields
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<CustomTemplate["category"]>("Contract");
  const [newDescription, setNewDescription] = useState("");
  const [newFields, setNewFields] = useState<{ key: string; label: string; description: string; type: "text" | "number" | "date" | "currency" }[]>([
    { key: "field_1", label: "Key Term 1", description: "Custom field description", type: "text" },
  ]);

  if (!isOpen) return null;

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleAddField = () => {
    setNewFields([
      ...newFields,
      {
        key: `field_${newFields.length + 1}`,
        label: `Custom Field ${newFields.length + 1}`,
        description: "Specify what to extract",
        type: "text",
      },
    ]);
  };

  const handleRemoveField = (index: number) => {
    setNewFields(newFields.filter((_, i) => i !== index));
  };

  const handleSaveCustomTemplate = () => {
    if (!newTitle.trim()) return;

    const created: CustomTemplate = {
      id: `custom-tpl-${Date.now()}`,
      name: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || "User-defined extraction template",
      isBuiltIn: false,
      fieldsToExtract: newFields,
    };

    const updated = [...templates, created];
    setTemplates(updated);
    try {
      const customOnly = updated.filter((t) => !t.isBuiltIn);
      localStorage.setItem("custom_document_templates", JSON.stringify(customOnly));
    } catch {
      // ignore
    }
    setSelectedTemplateId(created.id);
    setIsCreatingNew(false);
    setNewTitle("");
    setNewDescription("");
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    try {
      const customOnly = updated.filter((t) => !t.isBuiltIn);
      localStorage.setItem("custom_document_templates", JSON.stringify(customOnly));
    } catch {
      // ignore
    }
    if (selectedTemplateId === id) {
      setSelectedTemplateId(updated[0]?.id || "");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Custom Extraction Templates
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  Schema Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Apply pre-configured or custom extraction schemas to extract precise data points
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
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row text-xs">
          {/* Left: Template Catalog */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/50 p-4 overflow-y-auto space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Available Templates
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>

            {templates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => {
                  setSelectedTemplateId(tpl.id);
                  setIsCreatingNew(false);
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  selectedTemplateId === tpl.id && !isCreatingNew
                    ? "bg-indigo-500/15 border-indigo-500/50 text-slate-100 shadow-md"
                    : "bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-semibold text-xs leading-snug">{tpl.name}</span>
                  {!tpl.isBuiltIn && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(tpl.id);
                      }}
                      className="text-slate-500 hover:text-red-400 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                    {tpl.category}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {tpl.fieldsToExtract.length} fields
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Selected Template Details or New Template Form */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-900">
            {isCreatingNew ? (
              /* CREATE NEW TEMPLATE FORM */
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-100">Create Custom Extraction Template</h3>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Template Name</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Master Service Agreement (MSA)"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    >
                      <option value="Contract">Contract</option>
                      <option value="Invoice">Invoice</option>
                      <option value="HR">HR / Employee</option>
                      <option value="Medical">Medical / Healthcare</option>
                      <option value="Financial">Financial / Banking</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Description</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Brief description of the document purpose"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>

                {/* Fields list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold">Fields to Extract ({newFields.length})</label>
                    <button
                      type="button"
                      onClick={handleAddField}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Field</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {newFields.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                        <input
                          type="text"
                          value={f.label}
                          onChange={(e) => {
                            const updated = [...newFields];
                            updated[i].label = e.target.value;
                            updated[i].key = e.target.value.toLowerCase().replace(/\s+/g, "_");
                            setNewFields(updated);
                          }}
                          placeholder="Field Label (e.g. Indemnity Cap)"
                          className="flex-1 p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                        />
                        <select
                          value={f.type}
                          onChange={(e) => {
                            const updated = [...newFields];
                            updated[i].type = e.target.value as any;
                            setNewFields(updated);
                          }}
                          className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-mono text-[11px]"
                        >
                          <option value="text">Text</option>
                          <option value="currency">Currency / Amount</option>
                          <option value="date">Date</option>
                          <option value="number">Number</option>
                        </select>
                        {newFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveField(i)}
                            className="p-1 text-slate-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleSaveCustomTemplate}
                    disabled={!newTitle.trim()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold cursor-pointer shadow-md"
                  >
                    Save Custom Template
                  </button>
                </div>
              </div>
            ) : (
              /* SELECTED TEMPLATE VIEW */
              selectedTemplate && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-slate-100">{selectedTemplate.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                        {selectedTemplate.category}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{selectedTemplate.description}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                      Target Schema Fields ({selectedTemplate.fieldsToExtract.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedTemplate.fieldsToExtract.map((f, i) => (
                        <div key={i} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200">{f.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 font-mono">
                              {f.type}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px]">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-amber-300 font-semibold block text-xs">
                        Target Document: {activeFile.name}
                      </span>
                      <p className="text-slate-400 text-[11px]">
                        Applying this template will instruct the AI to extract these precise schema fields from the file.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyTemplate(selectedTemplate);
                        onClose();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-2 cursor-pointer shadow-lg shrink-0 transition-transform active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>Apply Schema</span>
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
