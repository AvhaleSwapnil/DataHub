import { 
  parseQBBalanceSheet, 
  parseQBBalanceSheetDetails, 
  parseQBInvoices, 
  parseQBCustomers 
} from "@/lib/quickbooks-parser";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`[API Fetch Error] ${endpoint}:`, error);
    throw error;
  }
}

export const QuickbooksService = {
  async getBalanceSheet() {
    const rawData = await apiFetch("/balance-sheet");
    return parseQBBalanceSheet(rawData);
  },

  async getBalanceSheetDetails() {
    const rawData = await apiFetch("/balance-sheet-detail");
    return parseQBBalanceSheetDetails(rawData);
  },

  async getInvoices() {
    const rawData = await apiFetch("/invoices");
    return parseQBInvoices(rawData);
  },

  async getCustomers() {
    const rawData = await apiFetch("/customers");
    return parseQBCustomers(rawData);
  }
};
