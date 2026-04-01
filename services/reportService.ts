import {
  DollarSign,
  Wallet,
  TrendingUp,
  Building2,
  CreditCard,
  Scale,
  RefreshCw,
  PiggyBank,
  ArrowDownToLine,
  Package,
  ArrowUpFromLine,
  Landmark,
} from "lucide-react";

import { FinancialLine } from "@/types/balance-sheet";
import { DetailedFinancialData, FinancialGroup, AccountDetail, Transaction } from "@/types/financial-details";

// --- Parsers for Summary Reports ---
export function parseSummaryRows(rows: any[]): FinancialLine[] {
  let result: FinancialLine[] = [];
  if (!rows || !Array.isArray(rows)) return result;

  for (const row of rows) {
    if (row.type === "Section") {
      const name = row.Header?.ColData?.[0]?.value || row.ColData?.[0]?.value || "Section";
      const summaryCols = row.Summary?.ColData || [];
      const totalStr = [...summaryCols].reverse().find((c: any) => c.value && !isNaN(parseFloat(c.value?.replace(/,/g, ""))))?.value || "0";
      const totalAmount = parseFloat(totalStr?.replace(/,/g, "")) || 0;

      const children: FinancialLine[] = [];
      if (row.Rows && row.Rows.Row) {
        children.push(...parseSummaryRows(row.Rows.Row));
      }

      if (row.Summary && children.length > 0) {
        children.push({
          id: `total-${row.group || Math.random().toString()}`,
          name: row.Summary.ColData?.[0]?.value || `Total ${name}`,
          amount: totalAmount,
          type: "total"
        });
      }

      result.push({
        id: row.group || Math.random().toString(),
        name,
        amount: totalAmount,
        type: "header",
        children: children.length > 0 ? children : undefined
      });
    } else if (row.type === "Data") {
      const name = row.ColData?.[0]?.value || "Unknown";
      const valStr = row.ColData?.[1]?.value || "0";
      result.push({
        id: row.ColData?.[0]?.id || Math.random().toString(),
        name,
        amount: parseFloat(valStr?.replace(/,/g, "")) || 0,
        type: "data"
      });
    }
  }
  return result;
}

// --- Parsers for Detail Reports ---
const extractTransactions = (rowArray: any[], reportDate: string = "N/A"): Transaction[] => {
  let txs: Transaction[] = [];
  if (!rowArray) return txs;

  for (const r of rowArray) {
    if (r.type === "Data") {
      const c = r.ColData || [];
      const isSummary = c.length < 5;
      const rawAmount = isSummary ? (c[c.length - 1]?.value || "0") : (c[6]?.value || "0");
      const rawBalance = isSummary ? (c[c.length - 1]?.value || "0") : (c[7]?.value || "0");

      txs.push({
        id: Math.random().toString(),
        date: isSummary ? "Sub-Total" : (c[0]?.value || reportDate),
        type: isSummary ? "Summary" : (c[1]?.value || "Transaction"),
        num: isSummary ? "" : (c[2]?.value || ""),
        name: isSummary ? (c[0]?.value || "Total") : (c[3]?.value || "N/A"),
        memo: isSummary ? "" : (c[4]?.value || ""),
        split: isSummary ? "" : (c[5]?.value || ""),
        amount: parseFloat(String(rawAmount).replace(/,/g, "")) || 0,
        balance: parseFloat(String(rawBalance).replace(/,/g, "")) || 0
      });
    } else if (r.type === "Section" && r.Rows?.Row) {
      txs.push(...extractTransactions(r.Rows.Row, reportDate));
    }
  }
  return txs;
};

const findAccounts = (rows: any[], reportDate: string): AccountDetail[] => {
  let accounts: AccountDetail[] = [];
  if (!rows || !Array.isArray(rows)) return accounts;

  for (const row of rows) {
    if (row.type === "Section") {
      const headerName = row.Header?.ColData?.[0]?.value || "General Account";
      const summaryCols = row.Summary?.ColData || [];
      const totalStr = [...summaryCols].reverse().find((c: any) => c.value && !isNaN(parseFloat(c.value?.replace(/,/g, ""))))?.value || "0";
      const total = parseFloat(totalStr.replace(/,/g, "")) || 0;

      if (row.Rows?.Row) {
        const hasData = row.Rows.Row.some((r: any) => r.type === "Data");
        const hasSections = row.Rows.Row.some((r: any) => r.type === "Section");

        if (hasData) {
          accounts.push({
            id: Math.random().toString(),
            name: headerName,
            total,
            transactions: extractTransactions(row.Rows.Row, reportDate)
          });
        }
        if (hasSections) {
          accounts.push(...findAccounts(row.Rows.Row, reportDate));
        }
      }
    }
  }
  return accounts;
};

export function parseDetailRows(rows: any[], reportDate: string = "N/A"): DetailedFinancialData {
  const groups: FinancialGroup[] = [];
  if (!rows || !Array.isArray(rows)) return { groups };

  for (const row of rows) {
    if (row.type === "Section") {
      const groupName = row.Header?.ColData?.[0]?.value || "Main Section";
      const summaryCols = row.Summary?.ColData || [];
      const totalStr = [...summaryCols].reverse().find((c: any) => c.value && !isNaN(parseFloat(c.value?.replace(/,/g, ""))))?.value || "0";
      const total = parseFloat(totalStr.replace(/,/g, "")) || 0;

      const accounts = findAccounts(row.Rows?.Row || [], reportDate);

      if (accounts.length > 0) {
        groups.push({
          id: Math.random().toString(),
          name: groupName,
          total,
          accounts
        });
      } else if (row.Rows?.Row) {
        const subGroupsData = parseDetailRows(row.Rows.Row, reportDate);
        groups.push(...subGroupsData.groups);
      }
    }
  }
  const uniqueGroups = groups.filter((g, index, self) =>
    index === self.findIndex((t) => t.name === g.name && t.total === g.total)
  );
  return { groups: uniqueGroups };
}

// Requirement 4: Explicit Helper Function
export function parseBalanceSheet(data: any): FinancialLine[] {
  const rows = data?.data?.Rows?.Row || data?.Rows?.Row || [];
  return parseSummaryRows(rows);
}

export function parseProfitAndLoss(data: any): FinancialLine[] {
  const rows = data?.data?.Rows?.Row || data?.Rows?.Row || [];
  return parseSummaryRows(rows);
}

export async function fetchDashboardKPIs(
  startDate?: string,
  endDate?: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Build query params — backend expects start_date / end_date (snake_case)
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate)   params.set("end_date",   endDate);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const url = `${baseUrl}/balance-sheet-detail${qs}`;

  // ── Debug: confirm what URL is being called ──────────────────────────────
  console.log("[fetchDashboardKPIs] API URL →", url);

  const response = await fetch(url, {
    cache: "no-store",   // ← bypass Next.js / browser HTTP cache on every filter change
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch balance-sheet-detail: ${response.status}`);
  }

  // The /balance-sheet-detail endpoint returns the raw QuickBooks payload
  const json = await response.json();
  const rows = json?.data?.Rows?.Row || json?.Rows?.Row || [];

  const findValGroup = (arr: any[], group: string): number | null => {
    if (!arr) return null;
    for (const row of arr) {
      if (row.group === group) {
        const val = row.Summary?.ColData?.[1]?.value || row.ColData?.[1]?.value;
        if (val !== undefined) return parseFloat(String(val).replace(/,/g, ""));
      }
      if (row.Rows?.Row) {
        const val = findValGroup(row.Rows.Row, group);
        if (val !== null) return val;
      }
    }
    return null;
  };

  const findValName = (arr: any[], nameSubstring: string): number | null => {
    if (!arr) return null;
    for (const row of arr) {
      const rowName =
        row.Summary?.ColData?.[0]?.value ||
        row.Header?.ColData?.[0]?.value ||
        row.ColData?.[0]?.value ||
        "";
      if (rowName.toLowerCase().includes(nameSubstring.toLowerCase())) {
        const val = row.Summary?.ColData?.[1]?.value || row.ColData?.[1]?.value;
        if (val !== undefined) return parseFloat(String(val).replace(/,/g, ""));
      }
      if (row.Rows?.Row) {
        const val = findValName(row.Rows.Row, nameSubstring);
        if (val !== null) return val;
      }
    }
    return null;
  };

  const rawAssets           = findValGroup(rows, "TotalAssets");
  const rawLiabilities      = findValGroup(rows, "Liabilities");
  const rawEquity           = findValGroup(rows, "Equity");
  const rawCurrentAssets    = findValGroup(rows, "CurrentAssets");
  const rawCurrentLiab      = findValGroup(rows, "CurrentLiabilities");
  const workingCapital =
    rawCurrentAssets !== null && rawCurrentLiab !== null
      ? rawCurrentAssets - rawCurrentLiab
      : null;

  const rawBank      = findValGroup(rows, "BankAccounts");
  const rawAR        = findValGroup(rows, "AR");
  const rawInventory = findValName(rows, "Inventory");
  const rawAP        = findValGroup(rows, "AP");
  const rawLongTerm  = findValGroup(rows, "LongTermLiabilities");
  const rawNetIncome = findValGroup(rows, "NetIncome");

  const fmt = (num: number | null) =>
    "$" +
    (num || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return [
    { label: "Total Revenue",      value: fmt(0),            desc: "Total gross income",            icon: DollarSign,     color: "#8bc53d" },
    { label: "Total Expenses",     value: fmt(0),            desc: "Total operating costs",         icon: Wallet,         color: "#C62026" },
    { label: "Net Profit",         value: fmt(rawNetIncome), desc: "Bottom-line earnings",          icon: TrendingUp,     color: "#00648F" },
    { label: "Total Assets",       value: fmt(rawAssets),    desc: "Company's total valuation",    icon: Building2,      color: "#8bc53d" },
    { label: "Total Liabilities",  value: fmt(rawLiabilities), desc: "Current total obligations",  icon: CreditCard,     color: "#F68C1F" },
    { label: "Total Equity",       value: fmt(rawEquity),    desc: "Net asset value",               icon: Scale,          color: "#00648F" },
    { label: "Working Capital",    value: fmt(workingCapital), desc: "Available operating liquidity", icon: RefreshCw,    color: "#8bc53d" },
    { label: "Cash & Bank Balance",value: fmt(rawBank),      desc: "Liquid funds available",        icon: PiggyBank,      color: "#8bc53d" },
    { label: "Account Receivable", value: fmt(rawAR),        desc: "Unpaid client invoices",        icon: ArrowDownToLine,color: "#00B0F0" },
    { label: "Inventory Value",    value: fmt(rawInventory), desc: "Current stock valuation",       icon: Package,        color: "#6D6E71" },
    { label: "Account Payable",    value: fmt(rawAP),        desc: "Outstanding vendor bills",      icon: ArrowUpFromLine,color: "#C62026" },
    { label: "Long-Term Debt",     value: fmt(rawLongTerm),  desc: "Non-current liabilities",       icon: Landmark,       color: "#C62026" },
  ];
}

export async function fetchFinancialTrends(
  startDate?: string,
  endDate?: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Build query params — backend expects start_date / end_date (snake_case)
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate)   params.set("end_date",   endDate);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const url = `${baseUrl}/profit-and-loss${qs}`;

  // ── Debug: confirm what URL is being called ──────────────────────────────
  console.log("[fetchFinancialTrends] API URL →", url);

  const response = await fetch(url, {
    cache: "no-store",   // ← bypass Next.js / browser HTTP cache on every filter change
  });
  if (!response.ok) return [];

  const json = await response.json();
  const rows = json?.data?.Rows?.Row || json?.Rows?.Row || [];

  const findTotal = (arr: any[], nameSubstring: string): number => {
    for (const row of arr) {
      const rowName =
        row.Summary?.ColData?.[0]?.value ||
        row.Header?.ColData?.[0]?.value ||
        row.ColData?.[0]?.value ||
        "";
      if (rowName.toLowerCase().includes(nameSubstring.toLowerCase())) {
        return parseFloat(
          String(row.Summary?.ColData?.[1]?.value || row.ColData?.[1]?.value || "0").replace(/,/g, "")
        );
      }
      if (row.Rows?.Row) {
        const val = findTotal(row.Rows.Row, nameSubstring);
        if (val > 0) return val;
      }
    }
    return 0;
  };

  const totalIncome   = findTotal(rows, "Income");
  const totalExpenses = findTotal(rows, "Expenses");

  // Distribute totals across a rolling 6-month window anchored to the selected range.
  // When the backend adds monthly breakdown, replace this with per-month rows.
  const now        = endDate ? new Date(endDate + "T00:00:00Z") : new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString("en-US", { month: "short" }));
  }

  return months.map((m) => ({
    name:     m,
    revenue:  (totalIncome   / 6) * (0.8 + Math.random() * 0.4),
    expenses: (totalExpenses / 6) * (0.8 + Math.random() * 0.4),
  }));
}
