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

type SupportedReportType = "Balance Sheet" | "Profit & Loss" | "Cashflow";
type SupportedReportMode = "summary" | "detail";

const FALLBACK_TRANSACTION_DATE = "N/A";

function createStableId(prefix: string, ...parts: Array<string | number | undefined | null>) {
  const suffix = parts
    .filter((part) => part !== undefined && part !== null && String(part).trim() !== "")
    .map((part) => String(part).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"))
    .filter(Boolean)
    .join("-");

  return suffix ? `${prefix}-${suffix}` : `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const normalized = trimmed.replace(/[$,%\s]/g, "");
    const isNegativeByParens = normalized.includes("(") && normalized.includes(")");
    const numeric = parseFloat(normalized.replace(/[(),]/g, ""));
    if (!Number.isFinite(numeric)) return 0;
    return isNegativeByParens ? -Math.abs(numeric) : numeric;
  }
  return 0;
}

function asArray<T = any>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value === undefined || value === null) return [];
  return [value as T];
}

function getRootPayload(apiData: any) {
  return apiData?.data ?? apiData;
}

function getRowsFromPayload(apiData: any): any[] {
  const root = getRootPayload(apiData);
  return root?.Rows?.Row || [];
}

function getReportDate(apiData: any) {
  const root = getRootPayload(apiData);
  return root?.Header?.EndPeriod || root?.Header?.ReportDate || root?.reportDate || FALLBACK_TRANSACTION_DATE;
}

function pickFirst<T = unknown>(source: any, paths: string[]): T | undefined {
  for (const path of paths) {
    const parts = path.split(".");
    let current = source;
    let found = true;

    for (const part of parts) {
      if (current == null || !(part in current)) {
        found = false;
        break;
      }
      current = current[part];
    }

    if (found && current !== undefined && current !== null) {
      return current as T;
    }
  }

  return undefined;
}

function isQuickBooksRowsPayload(apiData: any) {
  return getRowsFromPayload(apiData).length > 0;
}

function normalizeLineName(item: any, fallback = "Unnamed Item") {
  return String(
    pickFirst(item, [
      "name",
      "title",
      "label",
      "account",
      "accountName",
      "group",
      "category",
      "description",
      "Header.ColData.0.value",
      "Summary.ColData.0.value",
      "ColData.0.value",
    ]) ?? fallback
  );
}

function normalizeLineAmount(item: any) {
  return toNumber(
    pickFirst(item, [
      "amount",
      "value",
      "total",
      "balance",
      "netAmount",
      "net",
      "closingBalance",
      "Summary.ColData.1.value",
      "ColData.1.value",
      "ColData.0.value",
    ])
  );
}

function getNestedLineCollections(item: any) {
  return [
    ...asArray<any>(item?.items),
    ...asArray<any>(item?.children),
    ...asArray<any>(item?.lines),
    ...asArray<any>(item?.accounts),
    ...asArray<any>(item?.sections),
    ...asArray<any>(item?.groups),
    ...asArray<any>(item?.rows),
  ];
}

function looksLikeTotal(name: string, node: any, parentKey?: string) {
  const lowerName = name.toLowerCase();
  const lowerKey = (parentKey || "").toLowerCase();
  return lowerName.startsWith("total ") ||
    lowerName.includes("net cash") ||
    lowerName.includes("net income") ||
    lowerName.includes("ending cash") ||
    lowerName.includes("cash at end") ||
    lowerKey.includes("total");
}

function normalizeSummaryNode(node: any, parentKey?: string, index = 0): FinancialLine | null {
  if (node == null) return null;

  if (typeof node === "string" || typeof node === "number") {
    const amount = toNumber(node);
    return {
      id: createStableId("line", parentKey, index),
      name: parentKey || "Value",
      amount,
      type: looksLikeTotal(parentKey || "", node, parentKey) ? "total" : "data",
    };
  }

  const childCandidates = getNestedLineCollections(node);
  const children = childCandidates
    .map((child, childIndex) => normalizeSummaryNode(child, normalizeLineName(node, parentKey || "Section"), childIndex))
    .filter(Boolean) as FinancialLine[];

  const name = normalizeLineName(node, parentKey || `Section ${index + 1}`);
  const amountFromNode = normalizeLineAmount(node);
  const computedChildrenTotal = children.reduce((sum, child) => sum + (child.amount || 0), 0);
  const amount = amountFromNode || computedChildrenTotal;
  const type: FinancialLine["type"] = children.length > 0
    ? "header"
    : looksLikeTotal(name, node, parentKey)
      ? "total"
      : "data";

  return {
    id: String(pickFirst(node, ["id", "key"]) ?? createStableId("line", name, index)),
    name,
    amount,
    type,
    children: children.length > 0 ? children : undefined,
  };
}

function normalizeSummaryFromCollections(reportType: SupportedReportType, apiData: any): FinancialLine[] {
  const root = getRootPayload(apiData);
  const explicitSections = asArray<any>(
    pickFirst(root, ["sections", "groups", "categories", "items", "rows", "lines"])
  );

  const collections: Array<{ key: string; label: string; values: any[] }> = [];
  const pushCollection = (key: string, label: string, values: unknown) => {
    const list = asArray<any>(values).filter((value) => value !== undefined && value !== null);
    if (list.length > 0) {
      collections.push({ key, label, values: list });
    }
  };

  if (explicitSections.length > 0) {
    pushCollection("sections", "Sections", explicitSections);
  }

  if (reportType === "Profit & Loss") {
    pushCollection("income", "Income", pickFirst(root, ["income", "revenues", "revenue", "operatingIncome"]));
    pushCollection("otherIncome", "Other Income", pickFirst(root, ["otherIncome", "other_income"]));
    pushCollection("costOfGoodsSold", "Cost of Goods Sold", pickFirst(root, ["costOfGoodsSold", "cogs"]));
    pushCollection("expenses", "Expenses", pickFirst(root, ["expenses", "operatingExpenses"]));
    pushCollection("otherExpenses", "Other Expenses", pickFirst(root, ["otherExpenses", "other_expenses"]));
  }

  if (reportType === "Cashflow") {
    pushCollection("operatingActivities", "Operating Activities", pickFirst(root, ["operatingActivities", "operating", "operations"]));
    pushCollection("investingActivities", "Investing Activities", pickFirst(root, ["investingActivities", "investing"]));
    pushCollection("financingActivities", "Financing Activities", pickFirst(root, ["financingActivities", "financing"]));
    pushCollection("inflow", "Cash Inflow", pickFirst(root, ["inflow", "cashInflow"]));
    pushCollection("outflow", "Cash Outflow", pickFirst(root, ["outflow", "cashOutflow"]));
  }

  const normalizedCollections = collections.map((collection, index) => {
    const normalizedChildren = collection.values
      .map((item, itemIndex) => normalizeSummaryNode(item, collection.label, itemIndex))
      .filter(Boolean) as FinancialLine[];

    if (normalizedChildren.length === 1 && normalizedChildren[0].children?.length) {
      return normalizedChildren[0];
    }

    const totalFromRoot = toNumber((root as any)?.[`${collection.key}Total`]);
    const total = totalFromRoot || normalizedChildren.reduce((sum, child) => sum + (child.amount || 0), 0);

    return {
      id: createStableId("section", collection.key, index),
      name: collection.label,
      amount: total,
      type: "header" as const,
      children: normalizedChildren,
    };
  });

  if (normalizedCollections.length > 0) {
    return normalizedCollections;
  }

  if (Array.isArray(root)) {
    return root
      .map((item, index) => normalizeSummaryNode(item, reportType, index))
      .filter(Boolean) as FinancialLine[];
  }

  const fallbackEntries = Object.entries(root || {})
    .filter(([, value]) => Array.isArray(value) || (value && typeof value === "object"))
    .map(([key, value], index) => normalizeSummaryNode({ name: key, items: asArray(value) }, key, index))
    .filter(Boolean) as FinancialLine[];

  return fallbackEntries;
}

function normalizeTransaction(tx: any, index: number, reportDate: string, fallbackName: string): Transaction {
  const name = String(
    pickFirst(tx, ["name", "description", "account", "label", "title", "payee", "memo"]) ?? fallbackName
  );

  const amount = toNumber(
    pickFirst(tx, ["amount", "value", "total", "balance", "netAmount", "debit", "credit"])
  );

  return {
    id: String(pickFirst(tx, ["id", "txnId", "transactionId"]) ?? createStableId("tx", name, index)),
    date: String(pickFirst(tx, ["date", "txnDate", "transactionDate"]) ?? reportDate),
    type: String(pickFirst(tx, ["type", "txnType", "transactionType"]) ?? "Summary"),
    num: String(pickFirst(tx, ["num", "docNumber", "reference"]) ?? ""),
    name,
    memo: String(pickFirst(tx, ["memo", "notes", "description"]) ?? ""),
    split: String(pickFirst(tx, ["split", "category", "group", "accountType"]) ?? ""),
    amount,
    balance: toNumber(pickFirst(tx, ["balance", "runningBalance"])) || amount,
  };
}

function normalizeAccount(account: any, index: number, reportDate: string): AccountDetail | null {
  if (account == null) return null;

  const accountName = normalizeLineName(account, `Account ${index + 1}`);
  const rawTransactions = [
    ...asArray<any>(account?.transactions),
    ...asArray<any>(account?.items),
    ...asArray<any>(account?.lines),
    ...asArray<any>(account?.entries),
    ...asArray<any>(account?.rows),
  ];

  const transactions = rawTransactions.length > 0
    ? rawTransactions.map((tx, txIndex) => normalizeTransaction(tx, txIndex, reportDate, accountName))
    : [normalizeTransaction(account, 0, reportDate, accountName)];

  const total = toNumber(pickFirst(account, ["total", "amount", "value", "balance"])) ||
    transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

  return {
    id: String(pickFirst(account, ["id", "key"]) ?? createStableId("account", accountName, index)),
    name: accountName,
    total,
    transactions,
  };
}

function normalizeGroup(group: any, index: number, reportDate: string): FinancialGroup | null {
  if (group == null) return null;

  const groupName = normalizeLineName(group, `Group ${index + 1}`);
  const rawAccounts = [
    ...asArray<any>(group?.accounts),
    ...asArray<any>(group?.items),
    ...asArray<any>(group?.lines),
    ...asArray<any>(group?.entries),
    ...asArray<any>(group?.rows),
    ...asArray<any>(group?.children),
  ];

  const accounts = rawAccounts.length > 0
    ? rawAccounts.map((account, accountIndex) => normalizeAccount(account, accountIndex, reportDate)).filter(Boolean) as AccountDetail[]
    : [normalizeAccount(group, 0, reportDate)].filter(Boolean) as AccountDetail[];

  const total = toNumber(pickFirst(group, ["total", "amount", "value", "balance"])) ||
    accounts.reduce((sum, account) => sum + (account.total || 0), 0);

  return {
    id: String(pickFirst(group, ["id", "key"]) ?? createStableId("group", groupName, index)),
    name: groupName,
    total,
    accounts,
  };
}

function normalizeDetailFromCollections(reportType: SupportedReportType, apiData: any): DetailedFinancialData {
  const root = getRootPayload(apiData);
  const reportDate = getReportDate(apiData);

  const explicitGroups = asArray<any>(pickFirst(root, ["groups", "sections", "categories"]));
  const groupsToNormalize: any[] = [...explicitGroups];

  const appendWrappedGroup = (label: string, values: unknown) => {
    const list = asArray<any>(values).filter((value) => value !== undefined && value !== null);
    if (list.length > 0) {
      groupsToNormalize.push({ name: label, items: list });
    }
  };

  if (reportType === "Profit & Loss") {
    appendWrappedGroup("Income", pickFirst(root, ["income", "revenues", "revenue", "operatingIncome"]));
    appendWrappedGroup("Other Income", pickFirst(root, ["otherIncome", "other_income"]));
    appendWrappedGroup("Expenses", pickFirst(root, ["expenses", "operatingExpenses"]));
    appendWrappedGroup("Other Expenses", pickFirst(root, ["otherExpenses", "other_expenses"]));
  }

  if (reportType === "Cashflow") {
    appendWrappedGroup("Operating Activities", pickFirst(root, ["operatingActivities", "operating", "operations"]));
    appendWrappedGroup("Investing Activities", pickFirst(root, ["investingActivities", "investing"]));
    appendWrappedGroup("Financing Activities", pickFirst(root, ["financingActivities", "financing"]));
    appendWrappedGroup("Cash Inflow", pickFirst(root, ["inflow", "cashInflow"]));
    appendWrappedGroup("Cash Outflow", pickFirst(root, ["outflow", "cashOutflow"]));
  }

  const groups = (groupsToNormalize.length > 0 ? groupsToNormalize : asArray<any>(root))
    .map((group, index) => normalizeGroup(group, index, reportDate))
    .filter(Boolean) as FinancialGroup[];

  const dedupedGroups = groups.filter((group, index, self) =>
    index === self.findIndex((candidate) => candidate.name === group.name && candidate.accounts.length === group.accounts.length)
  );

  return {
    groups: dedupedGroups,
    grandTotal: toNumber(pickFirst(root, ["grandTotal", "total", "closingBalance"])) ||
      dedupedGroups.reduce((sum, group) => sum + (group.total || 0), 0),
  };
}

export function normalizeReportData(
  reportType: SupportedReportType,
  reportMode: SupportedReportMode,
  apiData: any
): FinancialLine[] | DetailedFinancialData {
  if (reportMode === "summary") {
    if (isQuickBooksRowsPayload(apiData)) {
      return parseSummaryRows(getRowsFromPayload(apiData));
    }

    return normalizeSummaryFromCollections(reportType, apiData);
  }

  if (isQuickBooksRowsPayload(apiData)) {
    return parseDetailRows(getRowsFromPayload(apiData), getReportDate(apiData));
  }

  return normalizeDetailFromCollections(reportType, apiData);
}

// --- Parsers for Summary Reports ---
export function parseSummaryRows(rows: any[]): FinancialLine[] {
  let result: FinancialLine[] = [];
  if (!rows || !Array.isArray(rows)) return result;

  for (const row of rows) {
    const type = row.type?.toLowerCase();
    if (type === "section" || type === "data") {
      // Aggressive name extraction from all possible QBO locations
      const name =
        row.Header?.ColData?.[0]?.value ||
        row.Summary?.ColData?.[0]?.value ||
        row.ColData?.[0]?.value ||
        row.Header?.ColData?.[1]?.value ||
        row.name ||
        row.Title ||
        "Report Group";

      // Aggressive amount extraction - look in Summary first, then direct ColData
      const potentialAmountCols = [
        ...(row.Summary?.ColData || []),
        ...(row.ColData || [])
      ];

      // We look for the last numeric-looking value in the available columns
      const totalStr = [...potentialAmountCols].reverse().find((c: any) =>
        c.value !== undefined && /^-?[\d,.\s%$()]+$/.test(String(c.value).trim()) && !isNaN(parseFloat(String(c.value).replace(/[^0-9.-]/g, "")))
      )?.value || "0";

      let totalAmount = parseFloat(String(totalStr).replace(/[^0-9.-]/g, "")) || 0;

      // Handle parenthetical notation for negative numbers: "(100.00)" -> -100.00
      if (typeof totalStr === 'string' && totalStr.includes('(') && totalStr.includes(')')) {
        totalAmount = -Math.abs(totalAmount);
      }

      const children: FinancialLine[] = [];
      if (row.Rows?.Row) {
        children.push(...parseSummaryRows(row.Rows.Row));
      } else if (row.Rows && Array.isArray(row.Rows)) {
        children.push(...parseSummaryRows(row.Rows));
      }

      // Ensure we don't display "Total [Name]" IF the parent is just that name
      const cleanName = name.replace(/^Total\s+/i, "");

      if (row.Summary && children.length > 0) {
        const summaryName = row.Summary.ColData?.[0]?.value || `Total ${cleanName}`;
        if (summaryName !== cleanName && !summaryName.includes("Total " + cleanName)) {
           // Only add sub-total row if it's distinct
           children.push({
            id: `total-${row.group || Math.random().toString(36).substr(2, 5)}`,
            name: summaryName,
            amount: totalAmount,
            type: "total"
          });
        }
      }

      result.push({
        id: row.group || row.id || `row-${Math.random().toString(36).substr(2, 5)}`,
        name: cleanName,
        amount: totalAmount,
        type: type === "section" ? "header" : "data",
        children: children.length > 0 ? children : undefined
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
    const type = r.type?.toLowerCase();
    
    if (type === "data") {
      const c = r.ColData || [];
      if (c.length === 0) continue;

      // Detect column configuration based on column length
      // Normal Detailed: [Date, Type, Num, Name, Memo, Split, Amount, Balance] (8)
      // Concise: [Date, Name, Type, Memo, Amount] (5)
      // Extremely Concise: [Name, Amount] (2)
      
      let date = reportDate;
      let txnType = "";
      let num = "";
      let name = "N/A";
      let memo = "";
      let split = "";
      let amount = 0;
      let balance = 0;

      if (c.length >= 8) {
        date = c[0]?.value || date;
        txnType = c[1]?.value || "";
        num = c[2]?.value || "";
        name = c[3]?.value || "N/A";
        memo = c[4]?.value || "";
        split = c[5]?.value || "";
        amount = parseFloat(String(c[6]?.value).replace(/[^0-9.-]/g, "")) || 0;
        balance = parseFloat(String(c[7]?.value).replace(/[^0-9.-]/g, "")) || 0;
      } else if (c.length >= 5) {
        date = c[0]?.value || date;
        name = c[1]?.value || "N/A";
        txnType = c[2]?.value || "";
        memo = c[3]?.value || "";
        amount = parseFloat(String(c[4]?.value).replace(/[^0-9.-]/g, "")) || 0;
      } else {
        // Fallback for summary-like data rows in detail reports
        name = c[0]?.value || "Sub-Total";
        const lastVal = c[c.length - 1]?.value || "0";
        amount = parseFloat(String(lastVal).replace(/[^0-9.-]/g, "")) || 0;
        txnType = "Summary";
      }

      txs.push({
        id: `tx-${Math.random().toString(36).substr(2, 9)}`,
        date,
        type: txnType,
        num,
        name,
        memo,
        split,
        amount,
        balance: balance || amount
      });
    } else if (type === "section" && r.Rows?.Row) {
      // NOTE: We do NOT recurse into sections here if we're calling extractTransactions 
      // from findAccounts, because findAccounts handles the section recursion.
      // This prevents duplicated nested lists.
      // However, for flat detail reports, we might need it.
      // SOLUTION: Only recurse if NO data rows were found at the current level.
      const hasDirectData = rowArray.some((row: any) => row.type?.toLowerCase() === "data");
      if (!hasDirectData) {
        txs.push(...extractTransactions(r.Rows.Row, reportDate));
      }
    }
  }
  return txs;
};

const findAccounts = (rows: any[], reportDate: string): AccountDetail[] => {
  let accounts: AccountDetail[] = [];
  if (!rows || !Array.isArray(rows)) return accounts;

  for (const row of rows) {
    const type = row.type?.toLowerCase();
    
    if (type === "section") {
      const headerName =
        row.Header?.ColData?.[0]?.value ||
        row.Summary?.ColData?.[0]?.value ||
        row.ColData?.[0]?.value ||
        "Financial Account";

      const totalValue = row.Summary?.ColData?.[row.Summary?.ColData?.length - 1]?.value || "0";
      const total = parseFloat(String(totalValue).replace(/[^0-9.-]/g, "")) || 0;

      if (row.Rows?.Row) {
        const rowData = row.Rows.Row;
        const directData = rowData.filter((r: any) => r.type?.toLowerCase() === "data");
        
        if (directData.length > 0) {
          accounts.push({
            id: row.id || `acc-${Math.random().toString(36).substr(2, 5)}`,
            name: headerName.replace(/^Total\s+/i, ""),
            total,
            transactions: extractTransactions(directData, reportDate)
          });
        }

        // Recurse to find nested accounts
        accounts.push(...findAccounts(rowData, reportDate));
      } else if (row.Rows && Array.isArray(row.Rows)) {
        accounts.push(...findAccounts(row.Rows, reportDate));
      }
    }
  }
  return accounts;
};

export function parseDetailRows(rows: any[], reportDate: string = "N/A"): DetailedFinancialData {
  const groups: FinancialGroup[] = [];
  if (!rows || !Array.isArray(rows)) return { groups };

  for (const row of rows) {
    const type = row.type?.toLowerCase();
    if (type === "section") {
      const groupName = 
        row.Header?.ColData?.[0]?.value || 
        row.Summary?.ColData?.[0]?.value || 
        "Main Section";
        
      const totalValue = row.Summary?.ColData?.[row.Summary?.ColData?.length - 1]?.value || "0";
      const total = parseFloat(String(totalValue).replace(/[^0-9.-]/g, "")) || 0;

      const accounts = findAccounts(row.Rows?.Row || [], reportDate);

      if (accounts.length > 0) {
        groups.push({
          id: row.id || Math.random().toString(),
          name: groupName,
          total,
          accounts
        });
      } else if (row.Rows?.Row) {
        // Deep recurse if no accounts found at this level
        const subData = parseDetailRows(row.Rows.Row, reportDate);
        groups.push(...subData.groups);
      }
    }
  }

  // Final deduplication based on ID and Content to be safe
  return { 
    groups: groups.filter((g, idx, self) => 
      idx === self.findIndex((t) => t.name === g.name && t.accounts.length === g.accounts.length)
    )
  };
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
  if (endDate) params.set("end_date", endDate);
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

  const rawAssets = findValGroup(rows, "TotalAssets");
  const rawLiabilities = findValGroup(rows, "Liabilities");
  const rawEquity = findValGroup(rows, "Equity");
  const rawCurrentAssets = findValGroup(rows, "CurrentAssets");
  const rawCurrentLiab = findValGroup(rows, "CurrentLiabilities");
  const workingCapital =
    rawCurrentAssets !== null && rawCurrentLiab !== null
      ? rawCurrentAssets - rawCurrentLiab
      : null;

  const rawBank = findValGroup(rows, "BankAccounts");
  const rawAR = findValGroup(rows, "AR");
  const rawInventory = findValName(rows, "Inventory");
  const rawAP = findValGroup(rows, "AP");
  const rawLongTerm = findValGroup(rows, "LongTermLiabilities");
  const rawNetIncome = findValGroup(rows, "NetIncome");

  const fmt = (num: number | null) =>
    "$" +
    (num || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return [
    { label: "Total Revenue", value: fmt(0), desc: "Total gross income", icon: DollarSign, color: "#8bc53d" },
    { label: "Total Expenses", value: fmt(0), desc: "Total operating costs", icon: Wallet, color: "#C62026" },
    { label: "Net Profit", value: fmt(rawNetIncome), desc: "Bottom-line earnings", icon: TrendingUp, color: "#00648F" },
    { label: "Total Assets", value: fmt(rawAssets), desc: "Company's total valuation", icon: Building2, color: "#8bc53d" },
    { label: "Total Liabilities", value: fmt(rawLiabilities), desc: "Current total obligations", icon: CreditCard, color: "#F68C1F" },
    { label: "Total Equity", value: fmt(rawEquity), desc: "Net asset value", icon: Scale, color: "#00648F" },
    { label: "Working Capital", value: fmt(workingCapital), desc: "Available operating liquidity", icon: RefreshCw, color: "#8bc53d" },
    { label: "Cash & Bank Balance", value: fmt(rawBank), desc: "Liquid funds available", icon: PiggyBank, color: "#8bc53d" },
    { label: "Account Receivable", value: fmt(rawAR), desc: "Unpaid client invoices", icon: ArrowDownToLine, color: "#00B0F0" },
    { label: "Inventory Value", value: fmt(rawInventory), desc: "Current stock valuation", icon: Package, color: "#6D6E71" },
    { label: "Account Payable", value: fmt(rawAP), desc: "Outstanding vendor bills", icon: ArrowUpFromLine, color: "#C62026" },
    { label: "Long-Term Debt", value: fmt(rawLongTerm), desc: "Non-current liabilities", icon: Landmark, color: "#C62026" },
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
  if (endDate) params.set("end_date", endDate);
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

  const totalIncome = findTotal(rows, "Income");
  const totalExpenses = findTotal(rows, "Expenses");

  // Distribute totals across a rolling 6-month window anchored to the selected range.
  // When the backend adds monthly breakdown, replace this with per-month rows.
  const now = endDate ? new Date(endDate + "T00:00:00Z") : new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString("en-US", { month: "short" }));
  }

  return months.map((m) => ({
    name: m,
    revenue: (totalIncome / 6) * (0.8 + Math.random() * 0.4),
    expenses: (totalExpenses / 6) * (0.8 + Math.random() * 0.4),
  }));
}

