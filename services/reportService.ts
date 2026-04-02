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
import {
  DetailedFinancialData,
  FinancialGroup,
  AccountDetail,
  Transaction,
} from "@/types/financial-details";

// --- Parsers for Summary Reports ---
export function parseSummaryRows(rows: any[]): FinancialLine[] {
  let result: FinancialLine[] = [];
  if (!rows || !Array.isArray(rows)) return result;

  for (const row of rows) {
    if (row.type === "Section") {
      const name =
        row.Header?.ColData?.[0]?.value || row.ColData?.[0]?.value || "Section";
      const summaryCols = row.Summary?.ColData || [];
      const totalStr =
        [...summaryCols]
          .reverse()
          .find(
            (c: any) =>
              c.value && !isNaN(parseFloat(c.value?.replace(/,/g, ""))),
          )?.value || "0";
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
          type: "total",
        });
      }

      result.push({
        id: row.group || Math.random().toString(),
        name,
        amount: totalAmount,
        type: "header",
        children: children.length > 0 ? children : undefined,
      });
    } else if (row.type === "Data") {
      const name = row.ColData?.[0]?.value || "Unknown";
      const valStr = row.ColData?.[1]?.value || "0";
      result.push({
        id: row.ColData?.[0]?.id || Math.random().toString(),
        name,
        amount: parseFloat(valStr?.replace(/,/g, "")) || 0,
        type: "data",
      });
    }
  }
  return result;
}

// --- Parsers for Detail Reports ---
const extractTransactions = (
  rowArray: any[],
  reportDate: string = "N/A",
): Transaction[] => {
  let txs: Transaction[] = [];
  if (!rowArray) return txs;

  for (const r of rowArray) {
    if (r.type === "Data") {
      const c = r.ColData || [];
      const isSummary = c.length < 5;
      const rawAmount = isSummary
        ? c[c.length - 1]?.value || "0"
        : c[6]?.value || "0";
      const rawBalance = isSummary
        ? c[c.length - 1]?.value || "0"
        : c[7]?.value || "0";

      txs.push({
        id: Math.random().toString(),
        date: isSummary ? "Sub-Total" : c[0]?.value || reportDate,
        type: isSummary ? "Summary" : c[1]?.value || "Transaction",
        num: isSummary ? "" : c[2]?.value || "",
        name: isSummary ? c[0]?.value || "Total" : c[3]?.value || "N/A",
        memo: isSummary ? "" : c[4]?.value || "",
        split: isSummary ? "" : c[5]?.value || "",
        amount: parseFloat(String(rawAmount).replace(/,/g, "")) || 0,
        balance: parseFloat(String(rawBalance).replace(/,/g, "")) || 0,
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
      const totalStr =
        [...summaryCols]
          .reverse()
          .find(
            (c: any) =>
              c.value && !isNaN(parseFloat(c.value?.replace(/,/g, ""))),
          )?.value || "0";
      const total = parseFloat(totalStr.replace(/,/g, "")) || 0;

      if (row.Rows?.Row) {
        const hasData = row.Rows.Row.some((r: any) => r.type === "Data");
        const hasSections = row.Rows.Row.some((r: any) => r.type === "Section");

        if (hasData) {
          accounts.push({
            id: Math.random().toString(),
            name: headerName,
            total,
            transactions: extractTransactions(row.Rows.Row, reportDate),
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

export function parseDetailRows(
  rows: any[],
  reportDate: string = "N/A",
): DetailedFinancialData {
  const groups: FinancialGroup[] = [];
  if (!rows || !Array.isArray(rows)) return { groups };

  for (const row of rows) {
    if (row.type === "Section") {
      const groupName = row.Header?.ColData?.[0]?.value || "Main Section";
      const summaryCols = row.Summary?.ColData || [];
      const totalStr =
        [...summaryCols]
          .reverse()
          .find(
            (c: any) =>
              c.value && !isNaN(parseFloat(c.value?.replace(/,/g, ""))),
          )?.value || "0";
      const total = parseFloat(totalStr.replace(/,/g, "")) || 0;

      const accounts = findAccounts(row.Rows?.Row || [], reportDate);

      if (accounts.length > 0) {
        groups.push({
          id: Math.random().toString(),
          name: groupName,
          total,
          accounts,
        });
      } else if (row.Rows?.Row) {
        const subGroupsData = parseDetailRows(row.Rows.Row, reportDate);
        groups.push(...subGroupsData.groups);
      }
    }
  }
  const uniqueGroups = groups.filter(
    (g, index, self) =>
      index === self.findIndex((t) => t.name === g.name && t.total === g.total),
  );
  return { groups: uniqueGroups };
}

export function parseBalanceSheet(data: any): FinancialLine[] {
  const rows = data?.data?.Rows?.Row || data?.Rows?.Row || [];
  return parseSummaryRows(rows);
}

export function parseProfitAndLoss(data: any): FinancialLine[] {
  const rows = data?.data?.Rows?.Row || data?.Rows?.Row || [];
  return parseSummaryRows(rows);
}

// Helper function to find value by group name
const findValueByGroup = (rows: any[], groupName: string): number | null => {
  if (!rows) return null;

  for (const row of rows) {
    if (row.group === groupName) {
      const val = row.Summary?.ColData?.[1]?.value || row.ColData?.[1]?.value;
      if (val !== undefined) return parseFloat(String(val).replace(/,/g, ""));
    }
    if (row.Rows?.Row) {
      const val = findValueByGroup(row.Rows.Row, groupName);
      if (val !== null) return val;
    }
  }
  return null;
};

// Helper function to find value by name substring
const findValueByName = (rows: any[], nameSubstring: string): number | null => {
  if (!rows) return null;

  for (const row of rows) {
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
      const val = findValueByName(row.Rows.Row, nameSubstring);
      if (val !== null) return val;
    }
  }
  return null;
};

// Extract revenue and expenses totals from P&L rows
const extractRevenueAndExpenses = (
  rows: any[],
): { revenue: number; expenses: number } => {
  // Try multiple strategies to find the right values

  // Strategy 1: find by group key
  const incomeByGroup =
    findValueByGroup(rows, "Income") ||
    findValueByGroup(rows, "OrdinaryRevenue") ||
    findValueByGroup(rows, "GrossProfit") ||
    null;

  const expensesByGroup =
    findValueByGroup(rows, "Expenses") ||
    findValueByGroup(rows, "TotalExpenses") ||
    findValueByGroup(rows, "COGS") ||
    null;

  // Strategy 2: find by name substring (walk all rows)
  const incomeByName =
    findValueByName(rows, "Total Income") ||
    findValueByName(rows, "Total Revenue") ||
    findValueByName(rows, "Gross Profit") ||
    findValueByName(rows, "Income") ||
    findValueByName(rows, "Revenue") ||
    null;

  const expensesByName =
    findValueByName(rows, "Total Expenses") ||
    findValueByName(rows, "Total Expense") ||
    findValueByName(rows, "Expenses") ||
    null;

  // Strategy 3: Walk the top-level rows and grab summary values from first two sections
  let firstSectionValue = 0;
  let secondSectionValue = 0;
  let sectionCount = 0;
  for (const row of rows) {
    if (row.type === "Section") {
      const sectionName =
        row.Header?.ColData?.[0]?.value ||
        row.Summary?.ColData?.[0]?.value ||
        "";
      const summaryVal = parseFloat(
        String(
          row.Summary?.ColData?.[1]?.value ||
            row.Summary?.ColData?.[row.Summary?.ColData?.length - 1]?.value ||
            "0",
        ).replace(/,/g, ""),
      );

      if (
        sectionName.toLowerCase().includes("income") ||
        sectionName.toLowerCase().includes("revenue") ||
        sectionName.toLowerCase().includes("gross profit")
      ) {
        firstSectionValue = summaryVal;
      } else if (
        sectionName.toLowerCase().includes("expense") ||
        sectionName.toLowerCase().includes("cost")
      ) {
        secondSectionValue = summaryVal;
      }
      sectionCount++;
    }
  }

  const revenue = incomeByGroup ?? incomeByName ?? firstSectionValue ?? 0;
  const expenses = expensesByGroup ?? expensesByName ?? secondSectionValue ?? 0;

  return { revenue: Math.abs(revenue), expenses: Math.abs(expenses) };
};

// Main function to fetch KPIs with date range
export async function fetchDashboardKPIs(
  startDate?: string,
  endDate?: string,
): Promise<
  Array<{
    label: string;
    value: string;
    desc: string;
    icon: any;
    color: string;
    rawValue?: number;
  }>
> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  const qs = params.toString() ? `?${params.toString()}` : "";

  const balanceSheetUrl = `${baseUrl}/balance-sheet-detail${qs}`;
  const profitLossUrl = `${baseUrl}/profit-and-loss-statement${qs}`;

  console.log("[fetchDashboardKPIs] Balance Sheet URL →", balanceSheetUrl);
  console.log("[fetchDashboardKPIs] Profit & Loss URL →", profitLossUrl);

  try {
    const [balanceSheetRes, profitLossRes] = await Promise.all([
      fetch(balanceSheetUrl, { cache: "no-store" }),
      fetch(profitLossUrl, { cache: "no-store" }),
    ]);

    if (!balanceSheetRes.ok) {
      throw new Error(
        `Failed to fetch balance sheet: ${balanceSheetRes.status}`,
      );
    }
    if (!profitLossRes.ok) {
      throw new Error(`Failed to fetch profit & loss: ${profitLossRes.status}`);
    }

    const balanceSheetJson = await balanceSheetRes.json();
    const profitLossJson = await profitLossRes.json();

    const balanceRows =
      balanceSheetJson?.data?.Rows?.Row || balanceSheetJson?.Rows?.Row || [];
    const profitRows =
      profitLossJson?.data?.Rows?.Row || profitLossJson?.Rows?.Row || [];

    const totalAssets = findValueByGroup(balanceRows, "TotalAssets") || 0;
    const totalLiabilities = findValueByGroup(balanceRows, "Liabilities") || 0;
    const totalEquity = findValueByGroup(balanceRows, "Equity") || 0;
    const currentAssets = findValueByGroup(balanceRows, "CurrentAssets") || 0;
    const currentLiabilities =
      findValueByGroup(balanceRows, "CurrentLiabilities") || 0;
    const workingCapital = currentAssets - currentLiabilities;
    const cashBank = findValueByGroup(balanceRows, "BankAccounts") || 0;
    const accountsReceivable = findValueByGroup(balanceRows, "AR") || 0;
    const inventoryValue = findValueByName(balanceRows, "Inventory") || 0;
    const accountsPayable = findValueByGroup(balanceRows, "AP") || 0;
    const longTermDebt =
      findValueByGroup(balanceRows, "LongTermLiabilities") || 0;

    const { revenue: totalRevenue, expenses: totalExpenses } =
      extractRevenueAndExpenses(profitRows);
    const netProfit = totalRevenue - totalExpenses;

    const formatCurrency = (num: number | null) =>
      "$" +
      (num || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    return [
      {
        label: "Total Revenue",
        value: formatCurrency(totalRevenue),
        desc: "Total gross income",
        icon: DollarSign,
        color: "#8bc53d",
        rawValue: totalRevenue,
      },
      {
        label: "Total Expenses",
        value: formatCurrency(totalExpenses),
        desc: "Total operating costs",
        icon: Wallet,
        color: "#C62026",
        rawValue: totalExpenses,
      },
      {
        label: "Net Profit",
        value: formatCurrency(netProfit),
        desc: "Bottom-line earnings",
        icon: TrendingUp,
        color: "#00648F",
        rawValue: netProfit,
      },
      {
        label: "Total Assets",
        value: formatCurrency(totalAssets),
        desc: "Company's total valuation",
        icon: Building2,
        color: "#8bc53d",
        rawValue: totalAssets,
      },
      {
        label: "Total Liabilities",
        value: formatCurrency(totalLiabilities),
        desc: "Current total obligations",
        icon: CreditCard,
        color: "#F68C1F",
        rawValue: totalLiabilities,
      },
      {
        label: "Total Equity",
        value: formatCurrency(totalEquity),
        desc: "Net asset value",
        icon: Scale,
        color: "#00648F",
        rawValue: totalEquity,
      },
      {
        label: "Working Capital",
        value: formatCurrency(workingCapital),
        desc: "Available operating liquidity",
        icon: RefreshCw,
        color: "#8bc53d",
        rawValue: workingCapital,
      },
      {
        label: "Cash & Bank Balance",
        value: formatCurrency(cashBank),
        desc: "Liquid funds available",
        icon: PiggyBank,
        color: "#8bc53d",
        rawValue: cashBank,
      },
      {
        label: "Account Receivable",
        value: formatCurrency(accountsReceivable),
        desc: "Unpaid client invoices",
        icon: ArrowDownToLine,
        color: "#00B0F0",
        rawValue: accountsReceivable,
      },
      {
        label: "Inventory Value",
        value: formatCurrency(inventoryValue),
        desc: "Current stock valuation",
        icon: Package,
        color: "#6D6E71",
        rawValue: inventoryValue,
      },
      {
        label: "Account Payable",
        value: formatCurrency(accountsPayable),
        desc: "Outstanding vendor bills",
        icon: ArrowUpFromLine,
        color: "#C62026",
        rawValue: accountsPayable,
      },
      {
        label: "Long-Term Debt",
        value: formatCurrency(longTermDebt),
        desc: "Non-current liabilities",
        icon: Landmark,
        color: "#C62026",
        rawValue: longTermDebt,
      },
    ];
  } catch (error) {
    console.error("Error fetching dashboard KPIs:", error);
    throw error;
  }
}

// ─── FINANCIAL TRENDS ────────────────────────────────────────────────────────
// Fetches the P&L API once per month in the range so every bar in the chart
// reflects the real data for that month rather than a rough distribution.

/** Fetch P&L for a single month and return { revenue, expenses } */
async function fetchMonthRevExp(
  baseUrl: string,
  year: number,
  month: number, // 0-indexed (0 = Jan)
): Promise<{ revenue: number; expenses: number }> {
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = new Date(year, month + 1, 0).getDate();

  const startDate = `${year}-${pad(month + 1)}-01`;
  const endDate = `${year}-${pad(month + 1)}-${pad(lastDay)}`;

  const url = `${baseUrl}/profit-and-loss-statement?start_date=${startDate}&end_date=${endDate}`;
  console.log("[fetchMonthRevExp] →", url);

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.warn(`[fetchMonthRevExp] Non-OK ${res.status} for ${startDate}`);
      return { revenue: 0, expenses: 0 };
    }
    const json = await res.json();
    const rows = json?.data?.Rows?.Row || json?.Rows?.Row || [];
    return extractRevenueAndExpenses(rows);
  } catch (err) {
    console.error("[fetchMonthRevExp] Error:", err);
    return { revenue: 0, expenses: 0 };
  }
}

/** Build an array of { year, month0 } for every month in [startDate, endDate] */
function buildMonthRange(
  startDate: string,
  endDate: string,
): Array<{ year: number; month: number }> {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  const months: Array<{ year: number; month: number }> = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cur <= end) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() });
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Fetch financial trends (real data, one API call per month).
 * For "quarterly" aggregation the monthly values are summed into quarters.
 */
export async function fetchFinancialTrends(
  startDate?: string,
  endDate?: string,
  aggregationType: "monthly" | "quarterly" = "monthly",
): Promise<Array<{ name: string; revenue: number; expenses: number }>> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Default: last 6 months if no range provided
  const now = new Date();
  const resolvedEnd =
    endDate ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const resolvedStart =
    startDate ||
    `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;

  const monthRange = buildMonthRange(resolvedStart, resolvedEnd);

  // Fetch all months in parallel
  const results = await Promise.all(
    monthRange.map(({ year, month }) =>
      fetchMonthRevExp(baseUrl, year, month).then((data) => ({
        year,
        month,
        ...data,
      })),
    ),
  );

  if (aggregationType === "monthly") {
    return results.map(({ year, month, revenue, expenses }) => ({
      name: `${SHORT_MONTHS[month]} ${year}`,
      revenue,
      expenses,
    }));
  }

  // Quarterly aggregation
  const quarterMap = new Map<string, { revenue: number; expenses: number }>();

  for (const { year, month, revenue, expenses } of results) {
    const q = Math.floor(month / 3) + 1;
    const key = `Q${q} ${year}`;
    const existing = quarterMap.get(key) ?? { revenue: 0, expenses: 0 };
    quarterMap.set(key, {
      revenue: existing.revenue + revenue,
      expenses: existing.expenses + expenses,
    });
  }

  // Keep insertion order (already chronological)
  return Array.from(quarterMap.entries()).map(([name, data]) => ({
    name,
    ...data,
  }));
}
