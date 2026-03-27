import { useState, useEffect } from "react";
import { Customer, customersData } from "@/data/customers";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Using mock data as requested
    setCustomers(customersData);
    setIsLoading(false);
    setError(null);
  }, []);

  return { customers, setCustomers, isLoading, error };
}
