import React from "react";
import {
  ContractAnalysis,
  InvoiceAnalysis,
  ReceiptAnalysis,
  ResumeAnalysis,
  BankStatementAnalysis,
  DatasetAnalysis,
  ImageAnalysisDetails,
} from "../types";
import {
  Scale,
  DollarSign,
  Receipt as ReceiptIcon,
  UserCheck,
  Building,
  BarChart3,
  Image as ImageIcon,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FileText,
  CreditCard,
  Briefcase,
  GraduationCap,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

interface SpecializedIntelligenceViewProps {
  contractDetails?: ContractAnalysis;
  invoiceDetails?: InvoiceAnalysis;
  receiptDetails?: ReceiptAnalysis;
  resumeDetails?: ResumeAnalysis;
  bankStatementDetails?: BankStatementAnalysis;
  datasetDetails?: DatasetAnalysis;
  imageDetails?: ImageAnalysisDetails;
  onSelectPrompt?: (prompt: string) => void;
}

export default function SpecializedIntelligenceView({
  contractDetails,
  invoiceDetails,
  receiptDetails,
  resumeDetails,
  bankStatementDetails,
  datasetDetails,
  imageDetails,
  onSelectPrompt,
}: SpecializedIntelligenceViewProps) {
  const hasSpecializedData =
    Boolean(contractDetails?.parties?.length || contractDetails?.riskFlags?.length) ||
    Boolean(invoiceDetails?.vendor || invoiceDetails?.total) ||
    Boolean(receiptDetails?.merchant || receiptDetails?.amount) ||
    Boolean(resumeDetails?.skills?.length || resumeDetails?.jobMatchSummary) ||
    Boolean(bankStatementDetails?.income || bankStatementDetails?.expenses) ||
    Boolean(datasetDetails?.columnExplanations?.length || datasetDetails?.trends?.length) ||
    Boolean(imageDetails?.description || imageDetails?.extractedFields?.length);

  if (!hasSpecializedData) return null;

  return (
    <div className="space-y-6">
      {/* 1. CONTRACT INTELLIGENCE */}
      {contractDetails && (contractDetails.parties?.length || contractDetails.riskFlags?.length) && (
        <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                Contract Intelligence & Risk Audit
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  Legal Mode
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Parties, obligations, critical dates, governing law, and risk clauses
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Parties */}
            {contractDetails.parties && contractDetails.parties.length > 0 && (
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Contracting Parties</span>
                </div>
                <ul className="space-y-1 text-slate-200">
                  {contractDetails.parties.map((party, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span>{party}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Critical Dates & Deadlines */}
            {contractDetails.dates && (
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Key Dates & Term</span>
                </div>
                <div className="space-y-1 text-slate-300">
                  {contractDetails.dates.effective && (
                    <p><span className="text-slate-500">Effective:</span> {contractDetails.dates.effective}</p>
                  )}
                  {contractDetails.dates.expiry && (
                    <p><span className="text-slate-500">Expiry/Term:</span> {contractDetails.dates.expiry}</p>
                  )}
                  {contractDetails.dates.keyDeadlines?.map((d, i) => (
                    <p key={i} className="text-amber-300/90 text-[11px]">• {d}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Payment & Termination */}
            {(contractDetails.paymentTerms || contractDetails.terminationClauses) && (
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Payment & Termination</span>
                </div>
                {contractDetails.paymentTerms && (
                  <p className="text-slate-300 mb-1.5">
                    <span className="text-slate-500 font-medium">Payment: </span>
                    {contractDetails.paymentTerms}
                  </p>
                )}
                {contractDetails.terminationClauses && (
                  <p className="text-slate-300">
                    <span className="text-slate-500 font-medium">Termination: </span>
                    {contractDetails.terminationClauses}
                  </p>
                )}
              </div>
            )}

            {/* Jurisdiction */}
            {contractDetails.jurisdiction && (
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-purple-400" />
                  <span>Jurisdiction & Dispute Resolution</span>
                </div>
                <p className="text-slate-300">{contractDetails.jurisdiction}</p>
              </div>
            )}
          </div>

          {/* Obligations */}
          {contractDetails.obligations && contractDetails.obligations.length > 0 && (
            <div className="mt-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div className="text-slate-400 font-medium mb-2 flex items-center gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Key Binding Obligations</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {contractDetails.obligations.map((ob, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    {ob.party && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 block mb-0.5">
                        {ob.party}
                      </span>
                    )}
                    <p className="text-slate-200">{ob.obligation}</p>
                    {ob.citation && (
                      <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                        Citation: {ob.citation}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Flags */}
          {contractDetails.riskFlags && contractDetails.riskFlags.length > 0 && (
            <div className="mt-4 bg-red-950/20 border border-red-500/30 p-3.5 rounded-xl">
              <div className="text-red-400 font-medium mb-2 flex items-center gap-1.5 text-xs">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Identified Legal & Financial Risk Flags</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {contractDetails.riskFlags.map((risk, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2 rounded-lg bg-slate-900/70 border border-red-500/20"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-slate-200">{risk.flag}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {risk.citation && (
                        <span className="text-[10px] text-slate-500 font-mono">{risk.citation}</span>
                      )}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          risk.severity === "High"
                            ? "bg-red-500/20 text-red-300 border border-red-500/30"
                            : risk.severity === "Medium"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}
                      >
                        {risk.severity} Risk
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. INVOICE INTELLIGENCE */}
      {invoiceDetails && (invoiceDetails.vendor || invoiceDetails.total) && (
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                Invoice & Tax Intelligence
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  GST/Billing Mode
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Vendor, invoice sequence, dates, tax breakdown, and total payable
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Vendor</span>
              <span className="text-slate-100 font-medium truncate block">{invoiceDetails.vendor || "N/A"}</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Invoice #</span>
              <span className="text-slate-100 font-mono font-medium truncate block">{invoiceDetails.invoiceNumber || "N/A"}</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Invoice Date</span>
              <span className="text-slate-100 font-medium block">{invoiceDetails.date || "N/A"}</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Due Date</span>
              <span className="text-amber-400 font-medium block">{invoiceDetails.dueDate || "Due upon receipt"}</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Tax / GST</span>
              <span className="text-slate-200 font-medium block">{invoiceDetails.tax || "₹0.00"}</span>
            </div>
            <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/30">
              <span className="text-emerald-400/80 block mb-1 font-medium">Total Amount</span>
              <span className="text-emerald-300 font-bold text-sm block">{invoiceDetails.total || "N/A"}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. RECEIPT INTELLIGENCE */}
      {receiptDetails && (receiptDetails.merchant || receiptDetails.amount) && (
        <div className="bg-slate-900/80 border border-teal-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <ReceiptIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                Expense Receipt Breakdown
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono">
                  Receipt Mode
                </span>
              </h3>
              <p className="text-xs text-slate-400">Merchant, expense classification, date, and final amount</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Merchant / Store</span>
              <span className="text-slate-100 font-medium block">{receiptDetails.merchant || "N/A"}</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Category</span>
              <span className="text-teal-400 font-medium block">{receiptDetails.category || "General Expense"}</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Date</span>
              <span className="text-slate-100 font-medium block">{receiptDetails.date || "N/A"}</span>
            </div>
            <div className="bg-teal-950/30 p-3 rounded-xl border border-teal-500/30">
              <span className="text-teal-400/80 block mb-1 font-medium">Receipt Total</span>
              <span className="text-teal-300 font-bold text-sm block">{receiptDetails.amount || "N/A"}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. RESUME INTELLIGENCE */}
      {resumeDetails && (resumeDetails.skills?.length || resumeDetails.jobMatchSummary) && (
        <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                Resume & Profile Intelligence
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  ATS Profile
                </span>
              </h3>
              <p className="text-xs text-slate-400">Extracted skills, experience highlights, education, and candidate summary</p>
            </div>
          </div>

          {/* Job Match Summary */}
          {resumeDetails.jobMatchSummary && (
            <div className="mb-4 p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-slate-200">
              <span className="text-purple-400 font-medium block mb-1">Candidate Profile & Job Match:</span>
              <p>{resumeDetails.jobMatchSummary}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Skills */}
            {resumeDetails.skills && resumeDetails.skills.length > 0 && (
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium mb-2 block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Key Skills & Competencies
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {resumeDetails.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[11px]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience & Education */}
            <div className="space-y-3">
              {resumeDetails.experience && resumeDetails.experience.length > 0 && (
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-medium mb-2 block flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                    Career Highlights
                  </span>
                  <ul className="space-y-1.5 text-slate-300">
                    {resumeDetails.experience.map((exp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <span>{exp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {resumeDetails.education && resumeDetails.education.length > 0 && (
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-medium mb-2 block flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
                    Education
                  </span>
                  <ul className="space-y-1 text-slate-300">
                    {resumeDetails.education.map((edu, idx) => (
                      <li key={idx}>• {edu}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. BANK STATEMENT INTELLIGENCE */}
      {bankStatementDetails && (bankStatementDetails.income || bankStatementDetails.expenses) && (
        <div className="bg-slate-900/80 border border-blue-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                Bank Statement & Cash Flow Audit
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                  Financial Mode
                </span>
              </h3>
              <p className="text-xs text-slate-400">Inflows, outflows, recurring subscriptions, and unusual debits</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
              <span className="text-emerald-400 font-medium block mb-1">Total Inflow / Income</span>
              <span className="text-emerald-300 text-lg font-bold">{bankStatementDetails.income || "N/A"}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
              <span className="text-rose-400 font-medium block mb-1">Total Outflow / Expenses</span>
              <span className="text-rose-300 text-lg font-bold">{bankStatementDetails.expenses || "N/A"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Recurring Payments */}
            {bankStatementDetails.recurringPayments && bankStatementDetails.recurringPayments.length > 0 && (
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium mb-2 block flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  Detected Recurring Payments
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {bankStatementDetails.recurringPayments.map((item, idx) => (
                    <li key={idx} className="p-1.5 rounded bg-slate-900/60 flex items-center justify-between">
                      <span>{item}</span>
                      <span className="text-[10px] text-blue-400 font-mono">Recurring</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Unusual Transactions */}
            {bankStatementDetails.unusualTransactions && bankStatementDetails.unusualTransactions.length > 0 && (
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-amber-400 font-medium mb-2 block flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Unusual / Anomaly Transactions
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {bankStatementDetails.unusualTransactions.map((item, idx) => (
                    <li key={idx} className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-slate-200">
                      ⚠️ {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. DATASET / SPREADSHEET (XLSX / CSV) INTELLIGENCE */}
      {datasetDetails && (datasetDetails.columnExplanations?.length || datasetDetails.trends?.length) && (
        <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                Dataset, Trends & Column Analysis
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  XLSX / CSV
                </span>
              </h3>
              <p className="text-xs text-slate-400">Column definitions, aggregate totals, observed trends, and simple charts</p>
            </div>
          </div>

          {/* Column Explanations */}
          {datasetDetails.columnExplanations && datasetDetails.columnExplanations.length > 0 && (
            <div className="mb-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-cyan-400 font-medium mb-2 block">Column Explanations</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {datasetDetails.columnExplanations.map((col, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-100 font-semibold font-mono block mb-0.5">{col.column}</span>
                    <span className="text-slate-400 text-[11px] block">{col.explanation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Computed Totals & Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
            {datasetDetails.totals && datasetDetails.totals.length > 0 && (
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium mb-2 block">Calculated Column Totals & Sums</span>
                <div className="space-y-1.5">
                  {datasetDetails.totals.map((tot, idx) => (
                    <div key={idx} className="flex justify-between items-center p-1.5 rounded bg-slate-900">
                      <span className="text-slate-300">{tot.metric}</span>
                      <span className="text-emerald-400 font-mono font-semibold">{tot.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {datasetDetails.trends && datasetDetails.trends.length > 0 && (
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium mb-2 block">Observed Key Trends</span>
                <ul className="space-y-1.5 text-slate-300">
                  {datasetDetails.trends.map((trend, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">↗</span>
                      <span>{trend}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Simple Charts Visualization */}
          {datasetDetails.simpleCharts && datasetDetails.simpleCharts.length > 0 && (
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium mb-3 block">Simple Visual Charts</span>
              <div className="space-y-4">
                {datasetDetails.simpleCharts.map((chart, cIdx) => {
                  const maxVal = Math.max(...chart.values, 1);
                  return (
                    <div key={cIdx} className="space-y-2 p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                      <span className="text-slate-200 font-semibold text-xs block">{chart.title}</span>
                      <div className="space-y-2">
                        {chart.labels.map((lbl, lIdx) => {
                          const val = chart.values[lIdx] || 0;
                          const pct = Math.min(100, Math.round((val / maxVal) * 100));
                          return (
                            <div key={lIdx} className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-400 truncate max-w-[200px]">{lbl}</span>
                                <span className="text-cyan-300 font-mono font-medium">{val}</span>
                              </div>
                              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. IMAGE INTELLIGENCE & FIELD EXTRACTION */}
      {imageDetails && (imageDetails.description || imageDetails.extractedFields?.length) && (
        <div className="bg-slate-900/80 border border-teal-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                Visual OCR & Field Extraction
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono">
                  Vision Mode
                </span>
              </h3>
              <p className="text-xs text-slate-400">Visual description, classification, and key-value extracted fields</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Description & Classification */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">Classification</span>
                <span className="px-2 py-1 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 font-medium inline-block">
                  {imageDetails.classification || "General Image"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">Visual Scene Description</span>
                <p className="text-slate-200">{imageDetails.description}</p>
              </div>
            </div>

            {/* Extracted Fields */}
            {imageDetails.extractedFields && imageDetails.extractedFields.length > 0 && (
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium mb-2 block">Extracted Key Fields</span>
                <div className="space-y-1.5">
                  {imageDetails.extractedFields.map((f, idx) => (
                    <div key={idx} className="flex justify-between items-center p-1.5 rounded bg-slate-900/60 text-[11px]">
                      <span className="text-slate-400 font-medium">{f.field}</span>
                      <span className="text-slate-100 font-mono">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
