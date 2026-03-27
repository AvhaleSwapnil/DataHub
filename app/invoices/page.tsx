"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { SkeletonTable } from "@/components/SkeletonLoader";
import { customersData } from "@/data/customers";
import { Plus, MoreHorizontal, Download, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Pagination from "@/components/Pagination";
import AdvancedFilterToolbar from "@/components/AdvancedFilterToolbar";
import { formatCurrency, cn } from "@/lib/utils";
import { useInvoices } from "@/hooks/useInvoices";
import { filterInvoices } from "@/lib/filters";
import { exportToCSV } from "@/lib/exportCSV";

const ITEMS_PER_PAGE = 10;

export default function InvoicesPage() {
  const { invoices, isLoading, error } = useInvoices();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredInvoices = filterInvoices(invoices, {
    searchTerm,
    statusFilter,
    dateFilter,
    customerFilter
  });

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const statusConfig = (status: string) => {
    const configs: Record<string, { label: string; icon: any; color: string }> = {
      paid: { label: "Fully Paid", icon: CheckCircle2, color: "bg-primary/10 text-primary-dark border-primary/20" },
      open: { label: "Outstanding", icon: Clock, color: "bg-blue-50 text-blue-600 border-blue-100" },
      overdue: { label: "Overdue", icon: AlertCircle, color: "bg-negative/10 text-negative border-negative/20" },
      draft: { label: "Draft", icon: FileText, color: "bg-gray-100 text-gray-500 border-gray-200" },
    };
    return configs[status.toLowerCase()] || configs.draft;
  };

  const handleExportCSV = () => {
    exportToCSV(
      filteredInvoices,
      ["Invoice Number", "Customer", "Date", "Due Date", "Status", "Total Amount", "Balance Due"],
      "invoices_export",
      (inv) => [inv.invoiceNumber, inv.customer, inv.date, inv.dueDate, inv.status, inv.amount, inv.balance]
    );
  };

  return (
    <>
      <Header title="Invoices" />
      <div className="flex-1 p-8 space-y-6">


        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[26px] font-black text-gray-900 tracking-tighter uppercase mb-0.5">Accounts Receivable</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="h-10 px-4 bg-white border border-gray-200 rounded-xl text-[12px] font-black text-gray-600 uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <Download size={14} className="text-gray-400" />
              Export Ledger
            </button>
            <button className="h-10 px-6 bg-primary text-white rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2 active:scale-95">
              <Plus size={16} />
              Create Invoice
            </button>
          </div>
        </div>

        {/* Filters */}
        <AdvancedFilterToolbar
          placeholder="Search by invoice # or customer..."
          onSearch={setSearchTerm}
          onFilterChange={(key, val) => {
            if (key === "status") setStatusFilter(val);
            if (key === "date") setDateFilter(val);
            if (key === "customer") setCustomerFilter(val);
            setCurrentPage(1);
          }}
          onReset={() => {
            setSearchTerm("");
            setStatusFilter("all");
            setDateFilter("all");
            setCustomerFilter("all");
            setCurrentPage(1);
          }}
          statusOptions={[
            { label: "Paid", value: "paid" },
            { label: "Outstanding", value: "open" },
            { label: "Overdue", value: "overdue" },
            { label: "Draft", value: "draft" }
          ]}
          dateOptions={[
            { label: "This Month", value: "this-month" },
            { label: "Last Month", value: "last-month" },
            { label: "Custom Range", value: "custom" }
          ]}
          showCustomerFilter={true}
          customerOptions={customersData.map(c => ({ label: c.name, value: c.name }))}
        />

        {/* Table */}
        {isLoading ? (
          <SkeletonTable />
        ) : error && invoices.length === 0 ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-md font-medium flex items-center gap-3 border border-red-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto min-h-[500px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-tighter py-5 px-8">Audit Ref & Date</th>
                    <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-tighter py-5 px-6">Customer / Client</th>
                    <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-tighter py-5 px-6">Due Date</th>
                    <th className="text-right text-[11px] font-black text-gray-400 uppercase tracking-tighter py-5 px-6">Total Amount</th>
                    <th className="text-right text-[11px] font-black text-gray-400 uppercase tracking-tighter py-5 px-6">Balance Due</th>
                    <th className="text-center text-[11px] font-black text-gray-400 uppercase tracking-tighter py-5 px-6">Lifecycle Status</th>
                    <th className="w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedInvoices.length > 0 ? (
                    paginatedInvoices.map((invoice) => {
                      const status = statusConfig(invoice.status);
                      const StatusIcon = status.icon;
                      return (
                        <tr key={invoice.id} className="group hover:bg-gray-50/70 transition-colors duration-200">
                          <td className="py-5 px-8">
                            <div className="flex flex-col">
                              <span className="text-[14px] font-black text-gray-900 leading-tight">#{invoice.invoiceNumber}</span>
                              <span className="text-[12px] font-medium text-gray-400">
                                {new Date(invoice.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-[14px] font-bold text-gray-900">{invoice.customer}</span>
                          </td>
                          <td className="py-5 px-6">
                            <span className={cn(
                              "text-[13px] font-medium",
                              invoice.status === "overdue" ? "text-negative font-black" : "text-gray-600"
                            )}>
                              {new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </td>
                          <td className="py-5 px-6 text-right tabular-nums">
                            <span className="text-[15px] font-black text-[#000000]">
                              {formatCurrency(invoice.amount)}
                            </span>
                          </td>
                          <td className="py-5 px-6 text-right tabular-nums">
                            <span className={cn(
                              "text-[15px] font-black",
                              invoice.balance > 0 ? "text-[#000000]" : "text-gray-300"
                            )}>
                              {formatCurrency(invoice.balance)}
                            </span>
                          </td>
                          <td className="py-5 px-6 text-center">
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                              status.color
                            )}>
                              <StatusIcon size={12} />
                              {status.label}
                            </div>
                          </td>
                          <td className="py-5 px-6 text-center">
                            <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all cursor-pointer">
                              <MoreHorizontal size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <p className="text-[14px] font-black text-gray-900 uppercase tracking-tighter">No Invoices Found</p>
                          <p className="text-[12px] text-gray-400">Adjust your filters to refine the search</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-gray-50/30 border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="bg-transparent border-0"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
