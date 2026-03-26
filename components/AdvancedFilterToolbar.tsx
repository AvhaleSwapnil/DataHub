"use client";

import { useState } from "react";
import { Search, Filter, RotateCcw, ChevronDown, Calendar, Receipt, Users, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface AdvancedFilterToolbarProps {
  onSearch: (term: string) => void;
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
  statusOptions?: FilterOption[];
  dateOptions?: FilterOption[];
  customerOptions?: FilterOption[];
  placeholder?: string;
  showCustomerFilter?: boolean;
}

export default function AdvancedFilterToolbar({
  onSearch,
  onFilterChange,
  onReset,
  statusOptions = [],
  dateOptions = [],
  customerOptions = [],
  placeholder = "Search...",
  showCustomerFilter = false,
}: AdvancedFilterToolbarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  const handleSelect = (key: string, value: string) => {
    setActiveFilters({ ...activeFilters, [key]: value });
    onFilterChange(key, value);
  };

  const resetAll = () => {
    setSearchTerm("");
    setActiveFilters({});
    onReset();
  };

  return (
    <div className="sticky top-0 z-20 bg-[#f9fafb]/95 backdrop-blur-md border-b border-gray-200/60 pb-6 mb-6">
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
        {/* Search Input */}
        <div className="relative group flex-1 min-w-[300px]">
          <Search 
            size={18} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" 
          />
          <input 
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearch}
            className="w-full h-11 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Date Filter */}
        {dateOptions.length > 0 && (
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Calendar size={14} className="text-gray-400 group-hover:text-secondary" />
            </div>
            <select 
              className="h-11 pl-9 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-[12px] font-black uppercase tracking-widest text-gray-600 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary appearance-none cursor-pointer hover:bg-white transition-all shadow-sm"
              onChange={(e) => handleSelect("date", e.target.value)}
              value={activeFilters.date || "all"}
            >
              <option value="all">All Dates</option>
              {dateOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}

        {/* Status Filter */}
        {statusOptions.length > 0 && (
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Filter size={14} className="text-gray-400 group-hover:text-accent-4" />
            </div>
            <select 
              className="h-11 pl-9 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-[12px] font-black uppercase tracking-widest text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-4/20 focus:border-accent-4 appearance-none cursor-pointer hover:bg-white transition-all shadow-sm"
              onChange={(e) => handleSelect("status", e.target.value)}
              value={activeFilters.status || "all"}
            >
              <option value="all">Any Status</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}

        {/* Customer Filter */}
        {showCustomerFilter && (
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Users size={14} className="text-gray-400 group-hover:text-accent-1" />
            </div>
            <select 
              className="h-11 pl-9 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-[12px] font-black uppercase tracking-widest text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-1/20 focus:border-accent-1 appearance-none cursor-pointer hover:bg-white transition-all shadow-sm"
              onChange={(e) => handleSelect("customer", e.target.value)}
              value={activeFilters.customer || "all"}
            >
              <option value="all">Every Customer</option>
              {customerOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}

        {/* Reset Button */}
        <button 
          onClick={resetAll}
          className="h-11 px-5 flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-[11px] font-black uppercase tracking-widest text-gray-500 rounded-xl transition-all active:scale-95"
          title="Reset all filters"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
