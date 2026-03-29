"use client";

import { useState } from "react";
import Header from "@/components/Header";
import FinancialReport from "@/components/FinancialReport";
import { Search, ChevronDown, FileCheck, FileSpreadsheet, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useCustomers } from "@/hooks/useCustomers";
import { 
  getBalanceSheet, 
  getBalanceSheetDetail, 
  getProfitAndLoss, 
  getProfitAndLossDetail 
} from "@/services/financialReportService";


export default function ReportsPage() {
    const [selectedTab, setSelectedTab] = useState<"Balance Sheet" | "Profit & Loss">("Balance Sheet");
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

    // Mock Datasets for Export
    const getReportData = () => {
        const isSummary = reportType === "Summary";
        if (selectedTab === "Balance Sheet") {
            return isSummary 
                ? [{ Category: "Assets", Amount: 500000 }, { Category: "Liabilities", Amount: 200000 }, { Category: "Equity", Amount: 300000 }]
                : [{ ID: "A1", Category: "Current Assets", Item: "Cash", Amount: 150000 }, { ID: "A2", Category: "Fixed Assets", Item: "Property", Amount: 350000 }, { ID: "L1", Category: "Current Liabilities", Item: "Accounts Payable", Amount: 200000 }];
        } else {
            return isSummary
                ? [{ Category: "Revenue", Amount: 1200000 }, { Category: "Expenses", Amount: 800000 }, { Category: "Net Income", Amount: 400000 }]
                : [{ ID: "R1", Category: "Service Revenue", Item: "Consulting", Amount: 1000000 }, { ID: "E1", Category: "Operating Expenses", Item: "Rent", Amount: 500000 }, { ID: "E2", Category: "Taxes", Item: "Income Tax", Amount: 300000 }];
        }
    };

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

    const generateExcel = (data: any[]) => {
        if (!data.length) return;
        const headers = Object.keys(data[0]).join("\t");
        const rows = data.map(obj => Object.values(obj).join("\t")).join("\n");
        const excelContent = `${headers}\n${rows}`;
        
        const blob = new Blob([excelContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
        const link = document.createElement("a");
        const fileName = `${selectedTab.toLowerCase().replace(" ", "-")}-${reportType.toLowerCase()}.xls`;
        
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const mockReportData = [
        { id: "-F102", practice: "Cole Family Group LLC", contact: "Charles", status: "active" },
        { id: "-F103", practice: "Roach Chiropractic Clinic", contact: "Sarah", status: "active" },
        { id: "-F104", practice: "In-Line Family Chiro", contact: "John", status: "inactive" },
    ];

    return (
        <div className="page-container">
            <Header title="Reports" />

            <div className="page-content">
                <h1 className="page-title">Financial Reports</h1>
                
                {/* Tabs — matching reference segmented style */}
                <div className="flex gap-6 mb-6 border-b border-border pb-px">
                    {(["Balance Sheet", "Profit & Loss"] as const).map((tab) => (
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
                        /* Generator Form Grid */
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                                                onChange={(e) => setDateRange(e.target.value)}
                                                className="w-full h-10 pl-3 pr-10 bg-bg-card border border-border-input rounded-md text-[14px] text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                                            >
                                                <option>Today</option>
                                                <option>This Month</option>
                                                <option>This Quarter</option>
                                                <option>Custom Range</option>
                                            </select>
                                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                        </div>

                                        {dateRange === "Custom Range" && (
                                            <div className="flex items-end gap-3">
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
                                        <select className="w-full h-10 pl-3 pr-10 bg-bg-card border border-border-input rounded-md text-[14px] text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer">
                                            <option>PDF</option>
                                            <option>Excel (CSV)</option>
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={() => setViewMode("preview")}
                                    disabled={!selectedClient}
                                    className="btn-primary w-full mt-4"
                                >
                                    <FileCheck size={16} />
                                    Generate Report
                                </button>
                            </div>

                            {/* Client Selector */}
                            <div className="flex flex-col h-full">
                                <label className="text-[14px] font-medium text-text-primary mb-2">Select Client</label>
                                <div className="relative mb-3">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search clients..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="input-base pl-10"
                                    />
                                </div>
                                <div className="flex-1 min-h-[300px] border border-border rounded-lg overflow-hidden flex flex-col bg-bg-card">
                                    <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                                        {filteredClients.map((client) => (
                                            <div
                                                key={client.id}
                                                onClick={() => toggleClient(client.id)}
                                                className={cn(
                                                    "flex items-center justify-between px-3 py-3 rounded-md transition-all cursor-pointer",
                                                    selectedClient === client.id 
                                                        ? "bg-bg-sidebar-active border border-primary/20" 
                                                        : "bg-bg-card hover:bg-bg-page border border-transparent"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                                                        selectedClient === client.id 
                                                            ? "border-primary bg-primary" 
                                                            : "border-border-input"
                                                    )}>
                                                        {selectedClient === client.id && (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                        )}
                                                    </div>
                                                    <span className={cn(
                                                        "text-[14px] transition-colors",
                                                        selectedClient === client.id ? "font-medium text-text-primary" : "text-text-secondary"
                                                    )}>
                                                        {client.name}
                                                    </span>
                                                </div>
                                                <span className="text-[12px] text-text-muted tabular-nums">{client.id}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Preview Mode */
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="h-[700px] flex flex-col">
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
                            </div>
                            
                            {/* Actions bar */}
                            <div className="flex items-center justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setViewMode("generator")}
                                    className="btn-secondary"
                                >
                                    Back to Generator
                                </button>
                                <button 
                                    onClick={() => generateCSV(getReportData())}
                                    className="btn-secondary"
                                >
                                    <FileSpreadsheet size={16} className="text-text-muted" />
                                    Export as CSV
                                </button>
                                <button 
                                    onClick={() => generateExcel(getReportData())}
                                    className="btn-primary shadow-md"
                                >
                                    <Download size={16} />
                                    Download Excel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
