"use client";

import { useState } from "react";
import { X, User, Mail, Phone, MapPin, FileEdit } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (customer: any) => void;
}

export default function AddCustomerModal({ isOpen, onClose, onAdd }: AddCustomerModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Customer name is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onAdd(formData);
    setFormData({ name: "", email: "", phone: "", address: "", notes: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="h-full w-full max-w-[500px] bg-white shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-black text-gray-900 tracking-tighter uppercase mb-1">Add New Customer</h2>
            <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest">Create a professional profile</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Section: Basic Info */}
          <div className="space-y-5">
             <div className="flex items-center gap-2 mb-2">
                <User size={16} className="text-primary" />
                <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Primary Identity</span>
             </div>
             
             <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name / Company Name *</label>
                <input 
                  type="text"
                  placeholder="e.g. Acme Corp or Jane Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={cn(
                    "w-full h-11 px-4 bg-gray-50 border rounded-xl text-[14px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20",
                    errors.name ? "border-negative" : "border-gray-200 focus:border-primary"
                  )}
                />
                {errors.name && <p className="text-[11px] text-negative font-bold ml-1 italic">{errors.name}</p>}
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
             </div>
          </div>

          {/* Section: Details */}
          <div className="space-y-5">
             <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-secondary" />
                <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Billing Address</span>
             </div>
             <textarea 
               placeholder="Street, City, State, ZIP..."
               rows={3}
               value={formData.address}
               onChange={(e) => setFormData({...formData, address: e.target.value})}
               className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary resize-none"
             />
          </div>

          <div className="space-y-5 pt-4">
             <div className="flex items-center gap-2 mb-2">
                <FileEdit size={16} className="text-accent-4" />
                <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Internal Notes</span>
             </div>
             <textarea 
               placeholder="Special pricing, custom payment terms, etc..."
               rows={4}
               value={formData.notes}
               onChange={(e) => setFormData({...formData, notes: e.target.value})}
               className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent-4/20 focus:border-accent-4 resize-none"
             />
          </div>

          {/* Footer Actions */}
          <div className="pt-10 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white pb-8 mt-auto">
             <button 
               type="button"
               onClick={onClose}
               className="px-6 h-12 text-[12px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
             >
               Discard
             </button>
             <button 
               type="submit"
               className="px-8 h-12 bg-primary text-white text-[12px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-dark transition-all shadow-lg active:scale-95"
             >
               Add Customer Profile
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
