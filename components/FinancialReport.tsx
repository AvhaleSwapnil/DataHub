"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Printer,
  Download,
  Settings2,
  Calendar,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { FinancialLine } from "@/data/balance-sheet";
import FinancialDetails from "./FinancialDetails";
import { DetailedFinancialData } from "@/data/financial-details";

interface FinancialReportProps {
  data: FinancialLine[];
  detailedData?: DetailedFinancialData | null;
  title: string;
  subtitle?: string;
  hideToolbar?: boolean;
  initialViewMode?: "summary" | "detail";
  initialPeriod?: string;
  initialMethod?: "Accrual" | "Cash";
  initialCustomRange?: { start: string; end: string };
}

const ReportRow = ({ line, depth = 0 }: { line: FinancialLine; depth: number }) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = line.children && line.children.length > 0;

  const toggle = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.stopPropagation();
      setIsOpen(!isOpen);
    }
  };

  const isCategory = line.type === "header";
  const isTotal = line.type === "total";

  return (
    <div className="flex flex-col">
      <div
        onClick={toggle}
        className={cn(
          "group flex items-center justify-between py-2.5 px-4 transition-colors border-b border-border-light",
          hasChildren && "cursor-pointer hover:bg-bg-page/50",
          !hasChildren && "hover:bg-bg-page/30",
          isTotal && "bg-bg-page/60 font-semibold border-b-2 border-text-primary mt-1 mb-2",
          isCategory && depth === 0 && "bg-bg-page/30 border-t border-border mt-4"
        )}
      >
        <div className="flex items-center gap-1 flex-1">
          <div className="flex shrink-0">
            {Array.from({ length: depth }).map((_, i) => (
              <div key={i} className="w-6 h-5 border-r border-border-light mr-[-1px]" />
            ))}
          </div>

          <div className="w-5 flex items-center justify-center">
            {hasChildren ? (
              isOpen ? <ChevronDown size={14} className="text-text-muted group-hover:text-text-primary" /> : <ChevronRight size={14} className="text-text-muted group-hover:text-text-primary" />
            ) : null}
          </div>

          <span className={cn(
            "text-[14px]",
            isCategory ? "font-semibold text-text-primary" : "text-text-secondary",
            isTotal && "text-text-primary font-semibold",
            depth > 1 && !isTotal && "text-text-muted"
          )}>
            {line.name}
          </span>
        </div>

        <div className={cn(
          "text-[14px] text-right min-w-[140px] tabular-nums",
          "text-text-primary",
          isTotal ? "font-semibold border-t border-text-muted pt-0.5" : "font-medium"
        )}>
          {formatCurrency(line.amount)}
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="flex flex-col">
          {line.children?.map((child, idx) => (
            <ReportRow key={child.id || `row-${depth}-${idx}`} line={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FinancialReport({ 
  data, detailedData, title, subtitle, hideToolbar, 
  initialViewMode = "summary",
  initialPeriod = "This Month",
  initialMethod = "Accrual",
  initialCustomRange = { start: "2026-03-01", end: "2026-03-25" }
}: FinancialReportProps) {
  const [viewMode, setViewMode] = useState<"summary" | "detail">(initialViewMode);
  const [period, setPeriod] = useState(initialPeriod);
  const [method, setMethod] = useState<"Accrual" | "Cash">(initialMethod);
  const [customRange, setCustomRange] = useState(initialCustomRange);

  const activeSubtitle = period === "Custom Range" ? `${customRange.start} - ${customRange.end}` : period;

  return (
    <div className="flex flex-col h-full card-base overflow-hidden">
      {/* Professional Sticky Toolbar */}
      {!hideToolbar && (
        <div className="sticky top-0 z-20 bg-bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* View Mode Toggle */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] text-text-muted px-0.5">View Mode</span>
              <div className="flex bg-bg-page p-1 rounded-lg border border-border h-10 w-[180px]">
                <button
                  onClick={() => setViewMode("summary")}
                  className={cn(
                    "flex-1 text-[13px] font-medium rounded-md transition-all",
                    viewMode === "summary" ? "bg-bg-card text-text-primary shadow-sm border border-border" : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  Summary
                </button>
                <button
                  onClick={() => setViewMode("detail")}
                  className={cn(
                    "flex-1 text-[13px] font-medium rounded-md transition-all",
                    viewMode === "detail" ? "bg-bg-card text-text-primary shadow-sm border border-border" : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  Detail
                </button>
              </div>
            </div>

            {/* Period Selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] text-text-muted px-0.5">Report Period</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 h-10 px-3 bg-bg-card border border-border-input rounded-md hover:border-primary/50 cursor-pointer transition-all group">
                  <Calendar size={14} className="text-text-muted group-hover:text-primary transition-colors" />
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="bg-transparent text-[14px] text-text-primary focus:outline-none cursor-pointer min-w-[120px]"
                  >
                    <option>Today</option>
                    <option>This Month</option>
                    <option>This Quarter</option>
                    <option>This Year</option>
                    <option>Custom Range</option>
                  </select>
                </div>

                {period === "Custom Range" && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    <input
                      type="date"
                      value={customRange.start}
                      onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                      className="input-base h-10 w-[140px]"
                    />
                    <span className="text-text-muted text-[12px]">to</span>
                    <input
                      type="date"
                      value={customRange.end}
                      onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                      className="input-base h-10 w-[140px]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Method Toggle */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] text-text-muted px-0.5">Accounting Method</span>
              <div className="flex bg-bg-page p-1 rounded-lg border border-border h-10 w-[180px]">
                <button
                  onClick={() => setMethod("Accrual")}
                  className={cn(
                    "flex-1 text-[13px] font-medium rounded-md transition-all",
                    method === "Accrual" ? "bg-bg-card text-text-primary shadow-sm border border-border" : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  Accrual
                </button>
                <button
                  onClick={() => setMethod("Cash")}
                  className={cn(
                    "flex-1 text-[13px] font-medium rounded-md transition-all",
                    method === "Cash" ? "bg-bg-card text-text-primary shadow-sm border border-border" : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  Cash
                </button>
              </div>
            </div>

            <button className="btn-primary self-end mb-0.5">
              Run Report
            </button>
          </div>

          <div className="flex items-center gap-2 self-end mb-0.5">
            <button title="Print" className="p-2.5 text-text-muted hover:text-primary hover:bg-bg-page rounded-md transition-all border border-transparent hover:border-border"><Printer size={18} /></button>
            <button title="Export" className="p-2.5 text-text-muted hover:text-primary hover:bg-bg-page rounded-md transition-all border border-transparent hover:border-border"><Download size={18} /></button>
            <button title="Settings" className="p-2.5 text-text-muted hover:text-primary hover:bg-bg-page rounded-md transition-all border border-transparent hover:border-border"><Settings2 size={18} /></button>
          </div>
        </div>
      )}

      {/* Report Content */}
      {viewMode === "summary" ? (
        <div className="flex-1 overflow-y-auto bg-bg-page/50 p-10 lg:p-16">
          <div className="max-w-4xl mx-auto card-base p-10 min-h-[1000px] flex flex-col rounded-sm">
            {/* Company Branding */}
            <div className="flex flex-col items-center mb-12 relative">
              <div className="w-12 h-1 bg-primary rounded-full mb-6" />
              <h1 className="text-[22px] font-bold text-text-primary tracking-tight leading-none mb-2">Sage Healthy RCM, LLC</h1>
              <h2 className="text-[18px] font-medium text-text-secondary mb-4">{title}</h2>
              <div className="flex items-center gap-3 text-[12px] text-text-muted bg-bg-page px-4 py-1.5 rounded-full border border-border">
                <span>{activeSubtitle}</span>
                <div className="w-1 h-1 rounded-full bg-border" />
                <span>{method} Basis</span>
              </div>
            </div>

            {/* Table Header */}
            <div className="flex items-center justify-between pb-3 px-4 border-b-2 border-text-primary sticky top-0 bg-bg-card z-10 pt-2">
              <span className="text-[12px] font-medium text-text-muted">Accounting Classification</span>
              <span className="text-[12px] font-medium text-text-muted">Amount (USD)</span>
            </div>

            {/* Main Report Body */}
            <div className="flex-1 py-4">
              {Array.isArray(data) && data.length > 0 ? (
                data.map((category, idx) => (
                  <ReportRow key={category.id || `cat-${idx}`} line={category} depth={0} />
                ))
              ) : (
                <div className="py-20 text-center text-text-muted italic">
                  No report data found for this period.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-border flex flex-col items-center gap-4">
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center">
                  <span className="text-[11px] text-text-muted mb-1">Created on</span>
                  <span className="text-[12px] font-medium text-text-primary">March 26, 2026</span>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="flex flex-col items-center">
                  <span className="text-[11px] text-text-muted mb-1">Status</span>
                  <span className="text-[12px] font-medium text-primary">Consolidated & Verified</span>
                </div>
              </div>
              <p className="text-[11px] text-text-muted text-center max-w-sm leading-relaxed">
                This report provides a granular view of the company&apos;s financial state based on the {method.toLowerCase()} accounting method.
              </p>
            </div>
          </div>
        </div>
      ) : (
        detailedData ? (
          <FinancialDetails data={detailedData} title={title} subtitle={`${activeSubtitle} • ${method} Basis`} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-bg-page">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-border border-t-primary animate-spin" />
              <p className="text-[13px] text-text-muted animate-pulse">Compiling Detailed Transaction Log...</p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
