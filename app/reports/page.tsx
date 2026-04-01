"use client";

import { useState } from "react";
import Header from "@/components/Header";
import FinancialReport from "@/components/FinancialReport";
import { Search, ChevronDown, FileCheck, FileSpreadsheet, Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useCustomers } from "@/hooks/useCustomers";
import {
    getBalanceSheet,
    getBalanceSheetDetail,
    getProfitAndLoss,
    getProfitAndLossDetail
} from "@/services/financialReportService";
import * as XLSX from "xlsx";
import { flattenAllReports } from "@/lib/report-utils";
import CashflowReport from "@/components/reports/CashflowReport";

export default function ReportsPage() {
    const [selectedTab, setSelectedTab] = useState<"Balance Sheet" | "Profit & Loss" | "Cashflow">("Balance Sheet");
    const [viewMode, setViewMode] = useState<"generator" | "preview">("generator");
    const [reportType, setReportType] = useState<"Summary" | "Detail">("Summary");
    const [dateRange, setDateRange] = useState("This Month");
    const [customRange, setCustomRange] = useState({ start: "2026-03-01", end: "2026-03-27" });
    const [accountingMethod, setAccountingMethod] = useState("Accrual");
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const [balanceSheetData, setBalanceSheetData] = useState<any[]>([]);
    const [profitLossData, setProfitLossData] = useState<any[]>([]);
    const [balanceSheetDetailData, setBalanceSheetDetailData] = useState<any>({ groups: [] });
    const [profitLossDetailData, setProfitLossDetailData] = useState<any>({ groups: [] });

    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
    const [reportFormat, setReportFormat] = useState<"PDF" | "Excel">("PDF");
    const { customers } = useCustomers();

    useEffect(() => {
        let isMounted = true;
        Promise.all([
            getBalanceSheet().catch(() => []),
            getBalanceSheetDetail().catch(() => ({ groups: [] })),
            getProfitAndLoss().catch(() => []),
            getProfitAndLossDetail().catch(() => ({ groups: [] }))
        ]).then(([bs, bsd, pl, pld]) => {
            if (isMounted) {
                setBalanceSheetData(bs);
                setBalanceSheetDetailData(bsd);
                setProfitLossData(pl);
                setProfitLossDetailData(pld);
                setIsLoading(false);
            }
        });
        return () => { isMounted = false; };
    }, []);

    const toggleClient = (id: string) => {
        setSelectedClient(selectedClient === id ? null : id);
    };

    const filteredClients = customers.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    // // Mock Datasets for Export
    // const getReportData = () => {
    //     const isSummary = reportType === "Summary";
    //     if (selectedTab === "Balance Sheet") {
    //         return isSummary
    //             ? [{ Category: "Assets", Amount: 500000 }, { Category: "Liabilities", Amount: 200000 }, { Category: "Equity", Amount: 300000 }]
    //             : [{ ID: "A1", Category: "Current Assets", Item: "Cash", Amount: 150000 }, { ID: "A2", Category: "Fixed Assets", Item: "Property", Amount: 350000 }, { ID: "L1", Category: "Current Liabilities", Item: "Accounts Payable", Amount: 200000 }];
    //     } else {
    //         return isSummary
    //             ? [{ Category: "Revenue", Amount: 1200000 }, { Category: "Expenses", Amount: 800000 }, { Category: "Net Income", Amount: 400000 }]
    //             : [{ ID: "R1", Category: "Service Revenue", Item: "Consulting", Amount: 1000000 }, { ID: "E1", Category: "Operating Expenses", Item: "Rent", Amount: 500000 }, { ID: "E2", Category: "Taxes", Item: "Income Tax", Amount: 300000 }];
    //     }
    // };

    const generateCSV = (data: any[]) => {
        if (!data.length) return;
        const headers = Object.keys(data[0]).join(",");
        const rows = data.map(obj => Object.values(obj).join(",")).join("\n");
        const csvContent = `${headers}\n${rows}`;

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const fileName = `${selectedTab.toLowerCase().replace(" ", "-")}-${reportType.toLowerCase()}.csv`;

        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateExcel = async () => {
        setIsDownloading(true);
        
        try {
            // 1. Reverted to previous endpoint selection (Tab-based only)
            const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
            let endpoint = `${base}/all-reports`;
            if (selectedTab === "Profit & Loss") endpoint = `${base}/profit-and-loss-statement`;
            if (selectedTab === "Cashflow") endpoint = reportType === "Summary" ? `${base}/qb-cashflow` : `${base}/qb-cashflow-engine`;

            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`Failed to fetch reports from ${endpoint}`);
            
            const fullData = await response.json();

            // 2. Transform reports. Prioritize active tab context and reportType (Summary/Detail)
            const reportKeyHint = `${selectedTab} ${reportType}`.toLowerCase();
            const workbookData = flattenAllReports(fullData, reportKeyHint);
            const sheetNames = Object.keys(workbookData);

            if (sheetNames.length === 0) {
                alert("No valid report data found in the API response. Please ensure localhost:3000 is providing the correct QuickBooks report structure.");
                setIsDownloading(false);
                return;
            }

            // 3. Create workbook and append each report as its own sheet
            const workbook = XLSX.utils.book_new();
            
            sheetNames.forEach(name => {
                const sheetData = workbookData[name];
                const worksheet = XLSX.utils.json_to_sheet(sheetData);
                
                // Truncate name to max 31 characters (Excel compatibility)
                const safeName = name.slice(0, 31);
                XLSX.utils.book_append_sheet(workbook, worksheet, safeName);
            });

            // 4. Trigger auto download
            // Dynamic naming: e.g. balance-sheet-detail.xlsx
            const baseName = selectedTab.toLowerCase().replace(/[^a-z0-9]/g, "-");
            const detailSuffix = reportType.toLowerCase();
            const fileName = `${baseName}-${detailSuffix}.xlsx`;

            XLSX.writeFile(workbook, fileName);

        } catch (error) {
            console.error("Excel generation failed:", error);
            alert("Error: Could not generate complete report. Please check if the local server at localhost:3000 is running.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadPDF = async () => {
        setIsDownloadingPDF(true);
        
        try {
            // 1. Reverted to previous endpoint selection (Tab-based only)
            const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
            let endpoint = `${base}/all-reports`;
            if (selectedTab === "Profit & Loss") endpoint = `${base}/profit-and-loss-statement`;
            if (selectedTab === "Cashflow") endpoint = reportType === "Summary" ? `${base}/qb-cashflow` : `${base}/qb-cashflow-engine`;

            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`Failed to fetch reports from ${endpoint}`);
            
            const fullData = await response.json();

            // 2. Same transformation logic as Excel
            const reportKeyHint = `${selectedTab} ${reportType}`.toLowerCase();
            const workbookData = flattenAllReports(fullData, reportKeyHint);
            const sheetNames = Object.keys(workbookData);

            if (sheetNames.length === 0) {
                alert("No valid report data found for PDF generation.");
                setIsDownloadingPDF(false);
                return;
            }

            // 3. Generate PDF using jsPDF and autoTable
            const { default: jsPDF } = await import("jspdf");
            const { default: autoTable } = await import("jspdf-autotable");
            
            const doc = new jsPDF("p", "pt", "a4");
            
            sheetNames.forEach((name, index) => {
                if (index > 0) doc.addPage();
                
                // Add header title for this report
                doc.setFontSize(16);
                doc.setTextColor(40);
                doc.text(name, 40, 45);
                
                const sheetData = workbookData[name];
                if (sheetData.length === 0) return;
                
                // Get headers from dataset
                const headers = Object.keys(sheetData[0]);
                const body = sheetData.map(row => headers.map(header => row[header] || ""));
                
                autoTable(doc, {
                    head: [headers],
                    body: body,
                    startY: 60,
                    margin: { left: 40, right: 40 },
                    theme: "grid",
                    styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
                    headStyles: { fillColor: [43, 67, 101], textColor: 255, halign: "center" },
                    columnStyles: {
                        [headers.indexOf("Amount")]: { halign: "right" },
                        [headers.indexOf("Total")]: { halign: "right" }
                    },
                    alternateRowStyles: { fillColor: [245, 247, 250] },
                });
            });

            // 4. Dynamic naming: e.g. balance-sheet-detail.pdf
            const baseName = selectedTab.toLowerCase().replace(/[^a-z0-9]/g, "-");
            const fileName = `${baseName}-${reportType.toLowerCase()}.pdf`;
            
            doc.save(fileName);

        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Error: Could not generate dynamic PDF report.");
        } finally {
            setIsDownloadingPDF(false);
        }
    };

    return (
        <div className="page-container">
            <Header title="Reports" />

            <div className="page-content">
                <h1 className="page-title">Financial Reports</h1>

                {/* Tabs — matching reference segmented style */}
                <div className="flex gap-6 mb-6 border-b border-border pb-px">
                    {(["Balance Sheet", "Profit & Loss", "Cashflow"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setSelectedTab(tab);
                                setViewMode("generator");
                            }}
                            className={cn(
                                "relative pb-3 text-[14px] font-medium transition-all",
                                selectedTab === tab
                                    ? "text-text-primary font-semibold after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-[2px] after:bg-primary after:rounded-full"
                                    : "text-text-muted hover:text-text-secondary"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Main Card */}
                <div className="card-base card-p">
                    {/* Content Header */}
                    <div className="flex flex-col gap-1 mb-5">
                        <h2 className="text-[18px] font-semibold text-text-primary">{selectedTab}</h2>
                        <p className="text-[14px] text-text-muted">
                            Generate reports about your company financial position, performance, and trends.
                        </p>
                    </div>

                    {/* View Switcher Controls — matching reference pill tabs */}
                    <div className="flex bg-bg-page p-1 rounded-lg border border-border w-fit mb-6">
                        <button
                            onClick={() => setViewMode("generator")}
                            className={cn(
                                "px-5 py-2 rounded-md text-[14px] font-medium transition-all",
                                viewMode === "generator" ? "bg-bg-card text-text-primary shadow-sm border border-border" : "text-text-muted hover:text-text-secondary"
                            )}
                        >
                            Generate Report
                        </button>
                        <button
                            onClick={() => setViewMode("preview")}
                            className={cn(
                                "px-5 py-2 rounded-md text-[14px] font-medium transition-all",
                                viewMode === "preview" ? "bg-bg-card text-text-primary shadow-sm border border-border" : "text-text-muted hover:text-text-secondary"
                            )}
                        >
                            Preview Report
                        </button>
                    </div>

                    {viewMode === "generator" ? (
                        /* Generator Form - Centered 2-Column Layout */
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                {/* Left Column */}
                                <div className="space-y-5">
                                    {/* Report Type */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[14px] font-medium text-text-primary">Report Type</label>
                                        <div className="relative">
                                            <select
                                                value={reportType}
                                                onChange={(e) => setReportType(e.target.value as any)}
                                                className="w-full h-10 pl-3 pr-10 bg-bg-card border border-border-input rounded-md text-[14px] text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                                            >
                                                <option value="Summary">Summary</option>
                                                <option value="Detail">Detailed</option>
                                            </select>
                                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Date Range */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[14px] font-medium text-text-primary">Date Range</label>
                                        <div className="flex flex-col gap-3">
                                            <div className="relative">
                                                <select
                                                    value={dateRange}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setDateRange(val);
                                                        if (val === "This Year") {
                                                            const currentYear = new Date().getFullYear();
                                                            const today = new Date().toISOString().split("T")[0];
                                                            setCustomRange({ start: `${currentYear}-01-01`, end: today });
                                                        }
                                                    }}
                                                    className="w-full h-10 pl-3 pr-10 bg-bg-card border border-border-input rounded-md text-[14px] text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                                                >
                                                    <option>Today</option>
                                                    <option>This Month</option>
                                                    <option>This Quarter</option>
                                                    <option>This Year</option>
                                                    <option>Custom Range</option>
                                                </select>
                                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                            </div>

                                            {dateRange === "Custom Range" && (
                                                <div className="flex items-end gap-3 translate-y-1">
                                                    <div className="flex-1 flex flex-col gap-1.5">
                                                        <span className="text-[12px] text-text-muted">From</span>
                                                        <input
                                                            type="date"
                                                            value={customRange.start}
                                                            onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                                            className="h-10 px-3 bg-bg-card border border-border-input rounded-md text-[14px] text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                                        />
                                                    </div>
                                                    <div className="flex-1 flex flex-col gap-1.5">
                                                        <span className="text-[12px] text-text-muted">To</span>
                                                        <input
                                                            type="date"
                                                            value={customRange.end}
                                                            onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                                            className="h-10 px-3 bg-bg-card border border-border-input rounded-md text-[14px] text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-5">
                                    {/* Accounting Method */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[14px] font-medium text-text-primary">Accounting Method</label>
                                        <div className="relative">
                                            <select
                                                value={accountingMethod}
                                                onChange={(e) => setAccountingMethod(e.target.value)}
                                                className="w-full h-10 pl-3 pr-10 bg-bg-card border border-border-input rounded-md text-[14px] text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                                            >
                                                <option>Cash</option>
                                                <option>Accrual</option>
                                            </select>
                                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Report Format */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[14px] font-medium text-text-primary">Report Format</label>
                                        <div className="relative">
                                            <select 
                                                value={reportFormat === "Excel" ? "Excel (CSV)" : "PDF"}
                                                onChange={(e) => setReportFormat(e.target.value.includes("Excel") ? "Excel" : "PDF")}
                                                className="w-full h-10 pl-3 pr-10 bg-bg-card border border-border-input rounded-md text-[14px] text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                                            >
                                                <option value="PDF">PDF</option>
                                                <option value="Excel (CSV)">Excel (CSV)</option>
                                            </select>
                                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Full-width Generate Button */}
                            <button
                                onClick={() => setViewMode("preview")}
                                className="btn-primary w-full mt-4"
                            >
                                <FileCheck size={16} />
                                Generate Report
                            </button>
                        </div>
                    ) : (
                        /* Preview Mode */
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="h-[700px] flex flex-col">
                                {selectedTab === "Cashflow" ? (() => {
                                    let startDate: string | undefined;
                                    let endDate: string | undefined;

                                    if (dateRange === "Custom Range") {
                                        startDate = customRange.start;
                                        endDate = customRange.end;
                                    } else {
                                        const now = new Date();
                                        const y = now.getFullYear();
                                        const m = String(now.getMonth() + 1).padStart(2, "0");
                                        const d = String(now.getDate()).padStart(2, "0");
                                        endDate = `${y}-${m}-${d}`;
                                        
                                        if (dateRange === "Today") {
                                            startDate = `${y}-${m}-${d}`;
                                        } else if (dateRange === "This Month") {
                                            startDate = `${y}-${m}-01`;
                                        } else if (dateRange === "This Quarter") {
                                            const qMonth = String(Math.floor(now.getMonth() / 3) * 3 + 1).padStart(2, "0");
                                            startDate = `${y}-${qMonth}-01`;
                                        } else if (dateRange === "This Year") {
                                            startDate = `${y}-01-01`;
                                        }
                                    }

                                    return (
                                        <CashflowReport 
                                            startDate={startDate} 
                                            endDate={endDate} 
                                            selectedView={reportType} 
                                        />
                                    );
                                })() : (
                                    <FinancialReport
                                        key={`${selectedTab}-${reportType}-${selectedClient}-${dateRange}-${accountingMethod}`}
                                        data={selectedTab === "Balance Sheet" ? balanceSheetData : profitLossData}
                                        detailedData={selectedTab === "Balance Sheet" ? balanceSheetDetailData : profitLossDetailData}
                                        title={`${selectedTab}`}
                                        subtitle={`As of March 27, 2026 • ${selectedClient ? customers.find(c => c.id === selectedClient)?.name : 'Consolidated'}`}
                                        hideToolbar={true}
                                        initialViewMode={reportType.toLowerCase() as "summary" | "detail"}
                                        initialPeriod={dateRange}
                                        initialMethod={accountingMethod as "Accrual" | "Cash"}
                                        initialCustomRange={customRange}
                                    />
                                )}
                            </div>

                            {/* Actions bar */}
                            <div className="flex items-center justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setViewMode("generator")}
                                    className="btn-secondary"
                                >
                                    Back to Generator
                                </button>
                                
                                {reportFormat === "Excel" ? (
                                    <button
                                        onClick={() => generateExcel()}
                                        disabled={isDownloading}
                                        className={cn(
                                            "btn-primary shadow-md min-w-[160px]",
                                            isDownloading && "opacity-80 cursor-wait"
                                        )}
                                    >
                                        {isDownloading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Processing...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <Download size={16} />
                                                Download Excel
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={isDownloadingPDF}
                                        className={cn(
                                            "btn-primary shadow-md min-w-[160px]",
                                            isDownloadingPDF && "opacity-80 cursor-wait"
                                        )}
                                    >
                                        {isDownloadingPDF ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Processing...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <FileText size={16} />
                                                Download PDF
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
