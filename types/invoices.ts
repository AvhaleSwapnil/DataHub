export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  date: string;
  dueDate: string;
  amount: number;
  balance: number;
  status: "paid" | "open" | "overdue" | "draft";
}

export const invoicesData: Invoice[] = [];
