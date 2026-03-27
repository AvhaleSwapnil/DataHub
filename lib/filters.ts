import { Invoice } from "@/data/invoices";
import { Customer } from "@/data/customers";

export interface InvoiceFilters {
  searchTerm: string;
  statusFilter: string;
  dateFilter: string;
  customerFilter: string;
}

export function filterInvoices(invoices: Invoice[], filters: InvoiceFilters): Invoice[] {
  return invoices.filter((inv) => {
    const matchesSearch = inv.customer.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         inv.invoiceNumber.toLowerCase().includes(filters.searchTerm.toLowerCase());
    const matchesStatus = filters.statusFilter === "all" || inv.status === filters.statusFilter;
    const matchesCustomer = filters.customerFilter === "all" || inv.customer === filters.customerFilter;
    
    // Simple date filter logic
    let matchesDate = true;
    if (filters.dateFilter !== "all" && inv.date) {
       const invDate = new Date(inv.date);
       const now = new Date();
       if (filters.dateFilter === "this-month") {
         matchesDate = invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
       } else if (filters.dateFilter === "last-month") {
         matchesDate = invDate.getMonth() === (now.getMonth() === 0 ? 11 : now.getMonth() - 1);
       }
    }

    return matchesSearch && matchesStatus && matchesCustomer && matchesDate;
  });
}

export interface CustomerFilters {
  searchTerm: string;
  statusFilter: string;
}

export function filterCustomers(customers: Customer[], filters: CustomerFilters): Customer[] {
  return customers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         c.email.toLowerCase().includes(filters.searchTerm.toLowerCase());
    const matchesStatus = filters.statusFilter === "all" || c.status.toLowerCase() === filters.statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });
}
