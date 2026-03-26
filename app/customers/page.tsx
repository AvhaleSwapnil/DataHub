"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { SkeletonTable } from "@/components/SkeletonLoader";
import { customersData } from "@/data/customers";
import { Plus, MoreHorizontal, Download } from "lucide-react";
import Pagination from "@/components/Pagination";
import AdvancedFilterToolbar from "@/components/AdvancedFilterToolbar";
import AddCustomerModal from "@/components/AddCustomerModal";
import { formatCurrency, cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 8;

export default function CustomersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState(customersData);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleAddCustomer = (newCustomer: any) => {
    const customer = {
      ...newCustomer,
      id: `CUST-${Math.floor(Math.random() * 9000) + 1000}`,
      status: "active",
      balance: 0,
      totalSpent: 0,
      lastOrder: new Date().toISOString()
    };
    setCustomers([customer, ...customers]);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-primary/10 text-primary-dark border-primary/20",
      inactive: "bg-gray-100 text-gray-500 border-gray-200",
    };
    return styles[status.toLowerCase()] || "bg-gray-100 text-gray-500";
  };

  return (
    <>
      <Header title="Customers" />
      <div className="flex-1 p-8 space-y-6">
        
        {/* Top Header / Action Row */}
        <div className="flex items-center justify-between">
           <div>
              <h1 className="text-[26px] font-black text-gray-900 tracking-tighter uppercase mb-0.5">Global Directory</h1>
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Manage your customer base & portfolios</p>
           </div>
           <div className="flex items-center gap-3">
              <button 
                className="h-10 px-4 bg-white border border-gray-200 rounded-xl text-[12px] font-black text-gray-600 uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <Download size={14} className="text-gray-400" />
                Export CSV
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="h-10 px-6 bg-primary text-white rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2 active:scale-95"
              >
                <Plus size={16} />
                Add Customer
              </button>
           </div>
        </div>

        {/* Filter Toolbar Component */}
        <AdvancedFilterToolbar 
          placeholder="Search customer name, email, or ID..."
          onSearch={setSearchTerm}
          onFilterChange={(key, val) => {
             if (key === "status") setStatusFilter(val);
             setCurrentPage(1);
          }}
          onReset={() => {
             setSearchTerm("");
             setStatusFilter("all");
             setCurrentPage(1);
          }}
          statusOptions={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" }
          ]}
        />

        {/* Table/List View */}
        {isLoading ? (
          <SkeletonTable />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto min-h-[500px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-tighter py-5 px-8">Full Name & ID</th>
                    <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-tighter py-5 px-6">Direct Contact</th>
                    <th className="text-right text-[11px] font-black text-gray-400 uppercase tracking-tighter py-5 px-6">Open Receivables</th>
                    <th className="text-right text-[11px] font-black text-gray-400 uppercase tracking-tighter py-5 px-6">Lifetime Engagement</th>
                    <th className="text-center text-[11px] font-black text-gray-400 uppercase tracking-tighter py-5 px-6">Status</th>
                    <th className="w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedCustomers.length > 0 ? (
                    paginatedCustomers.map((customer) => (
                      <tr key={customer.id} className="group hover:bg-gray-50/70 transition-colors duration-200">
                        <td className="py-5 px-8">
                          <div>
                               <p className="text-[15px] font-black text-gray-900 group-hover:text-primary transition-colors">{customer.name}</p>
                               <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-gray-100 text-[10px] font-black text-gray-400 uppercase rounded-md tracking-widest">{customer.id}</span>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                           <div className="flex flex-col">
                              <span className="text-[13px] font-bold text-gray-900">{customer.email}</span>
                              <span className="text-[12px] font-medium text-gray-400">{customer.phone}</span>
                           </div>
                        </td>
                        <td className="py-5 px-6 text-right tabular-nums">
                            <span className={cn(
                              "text-[15px] font-black text-[#000000]",
                              customer.balance < 0 ? "text-negative" : ""
                            )}>
                               {formatCurrency(customer.balance)}
                            </span>
                        </td>
                        <td className="py-5 px-6 text-right tabular-nums">
                           <span className="text-[15px] font-bold text-[#000000]">
                              {formatCurrency(customer.totalSpent)}
                           </span>
                        </td>
                        <td className="py-5 px-6 text-center">
                           <span className={cn(
                             "inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-transparent shadow-sm",
                             statusBadge(customer.status)
                           )}>
                             {customer.status}
                           </span>
                        </td>
                        <td className="py-5 px-6 text-center">
                           <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all cursor-pointer">
                              <MoreHorizontal size={18} />
                           </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-24 text-center">
                         <div className="flex flex-col items-center gap-3">
                            <div className="p-4 bg-gray-50 rounded-full text-gray-300">
                               <Plus size={32} />
                            </div>
                            <p className="text-[14px] font-black text-gray-900 uppercase">No Matches Found</p>
                            <p className="text-[12px] text-gray-400 font-medium">Refine your search parameters or add a new customer</p>
                            <button 
                              onClick={() => {setSearchTerm(""); setStatusFilter("all");}}
                              className="mt-2 text-[11px] font-black text-primary uppercase tracking-widest underline decoration-2 cursor-pointer"
                            >
                              Clear all filters
                            </button>
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

      <AddCustomerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddCustomer}
      />
    </>
  );
}
