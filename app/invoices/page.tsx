"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { SkeletonTable } from "@/components/SkeletonLoader";
import { invoicesData } from "@/data/invoices";
import { customersData } from "@/data/customers";
import { Plus, MoreHorizontal, Download, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Pagination from "@/components/Pagination";
import AdvancedFilterToolbar from "@/components/AdvancedFilterToolbar";
import { formatCurrency, cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

export default function InvoicesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredInvoices = invoicesData.filter((inv) => {
    const matchesSearch = inv.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchesCustomer = customerFilter === "all" || inv.customer === customerFilter;
    
    // Simple date filter logic
    let matchesDate = true;
    if (dateFilter !== "all") {
       const invDate = new Date(inv.date);
       const now = new Date();
       if (dateFilter === "this-month") {
         matchesDate = invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
       } else if (dateFilter === "last-month") {
         matchesDate = invDate.getMonth() === (now.getMonth() === 0 ? 11 : now.getMonth() - 1);
       }
    }

    return matchesSearch && matchesStatus && matchesCustomer && matchesDate;
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

  return (
    <>
      <Header title="Invoices" />
      <div className="flex-1 p-8 space-y-6">
        
        {/* Page Header */}
        <div className="flex items-center justify-between">
           <div>
              <h1 className="text-[26px] font-black text-gray-900 tracking-tighter uppercase mb-0.5">Accounts Receivable</h1>
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Track billing, payments, and revenue lifecycles</p>
           </div>
           <div className="flex items-center gap-3">
              <button className="h-10 px-4 bg-white border border-gray-200 rounded-xl text-[12px] font-black text-gray-600 uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2">
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
