"use client";

import { useState, useEffect } from "react";
import { X, User, Mail, Phone, MapPin, FileEdit, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData: any;
  title: string;
  fields: {
    name: string;
    label: string;
    type: "text" | "email" | "tel" | "textarea" | "select";
    placeholder?: string;
    icon?: any;
    options?: { label: string; value: string }[];
  }[];
}

export default function GenericEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  title,
  fields,
}: EditModalProps) {
  const [formData, setFormData] = useState<any>(initialData || {});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await onSave(formData);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="h-full w-full max-w-[480px] bg-bg-card shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-bg-card border-b border-border px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-semibold text-text-primary mb-0.5">{title}</h2>
            <p className="text-[13px] text-text-muted">Update record information</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-page rounded-md transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <CheckCircle2 size={32} />
              </div>
              <p className="text-[16px] font-semibold text-text-primary">Update Successful!</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-negative/10 border border-negative/20 rounded-md text-[13px] text-negative font-medium">
                  {error}
                </div>
              )}

              {fields.map((field) => (
                <div key={field.name} className="space-y-1.5">
                  <label className="text-[14px] font-medium text-text-primary">{field.label}</label>
                  <div className="relative">
                    {field.icon && (
                      <field.icon
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                      />
                    )}

                    {field.type === "textarea" ? (
                      <textarea
                        value={formData[field.name] || ""}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                        rows={4}
                        className="input-base h-auto py-3 resize-none"
                      />
                    ) : field.type === "select" ? (
                      <select
                        value={formData[field.name] || ""}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        className="input-base px-3 h-10 appearance-none bg-bg-card"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.name] || ""}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                        className={cn("input-base h-10", field.icon ? "pl-9" : "px-3")}
                      />
                    )}
                  </div>
                </div>
              ))}

              {/* Footer Actions */}
              <div className="pt-6 border-t border-border flex items-center justify-end gap-3 sticky bottom-3 bg-bg-card pb-6 mt-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary border-none hover:bg-transparent"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary px-8 flex items-center gap-2">
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
