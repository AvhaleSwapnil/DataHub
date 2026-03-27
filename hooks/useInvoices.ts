import { useState, useEffect } from "react";
import { Invoice, invoicesData } from "@/data/invoices";

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Using mock data as requested
    setInvoices(invoicesData);
    setIsLoading(false);
    setError(null);
  }, []);

  return { invoices, isLoading, error };
}
