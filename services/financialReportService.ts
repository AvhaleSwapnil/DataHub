import { FinancialLine } from "@/data/balance-sheet";
import { DetailedFinancialData, FinancialGroup, AccountDetail, Transaction } from "@/data/financial-details";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// --- Parsers for Summary Reports ---

export function parseSummaryRows(rows: any[]): FinancialLine[] {
  let result: FinancialLine[] = [];
  if (!rows || !Array.isArray(rows)) return result;

  for (const row of rows) {
    if (row.type === "Section") {
      const name = row.Header?.ColData?.[0]?.value || row.ColData?.[0]?.value || "Section";
      
      // Attempt to find the total amount in Summary row
      const summaryCols = row.Summary?.ColData || [];
      const totalStr = summaryCols.reverse().find((c: any) => c.value && !isNaN(parseFloat(c.value?.replace(/,/g, ""))))?.value || "0";
      const totalAmount = parseFloat(totalStr?.replace(/,/g, "")) || 0;
      
      const children: FinancialLine[] = [];
      if (row.Rows && row.Rows.Row) {
        children.push(...parseSummaryRows(row.Rows.Row));
      }
      
      // Only add a 'Total' line if there are multiple children or we want to emphasize the total
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

// In a detail report, QB often nests multiple layers. We'll flatten them into Group -> Account -> Tx.
export function parseDetailRows(rows: any[], reportDate: string = "N/A"): DetailedFinancialData {
  const groups: FinancialGroup[] = [];
  
  const extractTransactions = (rowArray: any[]): Transaction[] => {
    let txs: Transaction[] = [];
    if (!rowArray) return txs;
    const isSummaryStructure = rowArray.some(r => r.ColData && r.ColData.length < 5);

    for (const r of rowArray) {
      if (r.type === "Data") {
        const c = r.ColData || [];
        
        // Dynamically find Amount and Balance columns
        const numericValues = c.map((col: any, idx: number) => {
          const raw = String(col?.value || "").replace(/,/g, "").trim();
          return {
            val: parseFloat(raw),
            idx,
            isNumeric: raw !== "" && !isNaN(parseFloat(raw))
          };
        }).filter((item: any) => item.isNumeric);

        let amountIndex = c.length > 1 ? c.length - 1 : 0;
        let balanceIndex = c.length - 1;

        if (numericValues.length >= 2) {
            balanceIndex = numericValues[numericValues.length - 1].idx;
            amountIndex = numericValues[numericValues.length - 2].idx;
        } else if (numericValues.length === 1) {
            amountIndex = numericValues[0].idx;
            balanceIndex = amountIndex;
        }

        const nameValue = c[0]?.value || "Unknown Account";

        txs.push({
          id: Math.random().toString(),
          date: isSummaryStructure ? reportDate : (c[0]?.value || reportDate),
          type: isSummaryStructure ? "Summary" : (c[1]?.value || "Transaction"),
          num: isSummaryStructure ? "" : (c[2]?.value || ""),
          name: nameValue,
          memo: isSummaryStructure ? "" : (c.length > 4 ? (c[4]?.value || "") : ""),
          split: isSummaryStructure ? "" : (c.length > 5 ? (c[5]?.value || "") : ""),
          amount: parseFloat(String(c[amountIndex]?.value || "0").replace(/,/g, "")) || 0,
          balance: parseFloat(String(c[balanceIndex]?.value || "0").replace(/,/g, "")) || 0
        });
      } else if (r.type === "Section" && r.Rows?.Row) {
        txs.push(...extractTransactions(r.Rows.Row));
      }
    }
    return txs;
  };

  const traverseForAccounts = (node: any): AccountDetail[] => {
    let accts: AccountDetail[] = [];
    if (!node.Rows?.Row) return accts;
    
    // Check if this section has direct Data rows
    const dataRows = node.Rows.Row.filter((r: any) => r.type === "Data");
    if (dataRows.length > 0) {
      const summaryCols = node.Summary?.ColData || [];
      const totalStr = summaryCols.reverse().find((c: any) => c.value && !isNaN(parseFloat(c.value?.replace(/,/g, ""))))?.value || "0";
      accts.push({
        id: Math.random().toString(),
        name: node.Header?.ColData?.[0]?.value || "Regular Account",
        total: parseFloat(totalStr?.replace(/,/g, "")) || 0,
        transactions: extractTransactions(node.Rows.Row)
      });
    }

    // Also look for nested sections
    for (const r of node.Rows.Row) {
      if (r.type === "Section") {
        accts.push(...traverseForAccounts(r));
      }
    }
    return accts;
  };

  if (rows && Array.isArray(rows)) {
    for (const r of rows) {
      if (r.type === "Section") {
        const name = r.Header?.ColData?.[0]?.value || "Report Section";
        const summaryCols = r.Summary?.ColData ? [...r.Summary.ColData] : [];
        const totalStr = summaryCols.reverse().find((c: any) => c.value && !isNaN(parseFloat(c.value?.replace(/,/g, ""))))?.value || "0";
        
        const accounts = traverseForAccounts(r);
        if (accounts.length > 0) {
          groups.push({
            id: Math.random().toString(),
            name,
            total: parseFloat(totalStr?.replace(/,/g, "")) || 0,
            accounts
          });
        }
      }
    }
  }

  return { groups };
}

async function fetchWithAuth(endpoint: string, retries = 1): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
        if ((res.status === 401 || res.status === 403) && retries > 0) {
            console.warn(`[Auth Error] ${endpoint} 401. Refreshing Token...`);
            await fetch(`${API_BASE_URL}/refresh-token`);
            return await fetchWithAuth(endpoint, retries - 1);
        }
        throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

export async function getBalanceSheet() {
  const json = await fetchWithAuth("/balance-sheet");
  const rows = json?.data?.Rows?.Row || json?.Rows?.Row || [];
  return parseSummaryRows(rows);
}

export async function getBalanceSheetDetail() {
  const json = await fetchWithAuth("/balance-sheet-detail");
  const rows = json?.data?.Rows?.Row || json?.Rows?.Row || [];
  const reportDate = json?.data?.Header?.EndPeriod || json?.Header?.EndPeriod || "N/A";
  return parseDetailRows(rows, reportDate);
}

export async function getProfitAndLoss() {
  const json = await fetchWithAuth("/profit-and-loss");
  const rows = json?.data?.Rows?.Row || json?.Rows?.Row || [];
  return parseSummaryRows(rows);
}

export async function getProfitAndLossDetail() {
  const json = await fetchWithAuth("/profit-and-loss-detail");
  const rows = json?.data?.Rows?.Row || json?.Rows?.Row || [];
  const reportDate = json?.data?.Header?.EndPeriod || json?.Header?.EndPeriod || "N/A";
  return parseDetailRows(rows, reportDate);
}

// Wait, the user also mentioned /profit-and-loss-statement. 
// It's likely the same summary view but might be on a different endpoint? 
// I will fetch it if needed, but the UI only has 'Balance Sheet' and 'Profit & Loss' tabs.
export async function getProfitAndLossStatement() {
  const json = await fetchWithAuth("/profit-and-loss-statement");
  const rows = json?.data?.Rows?.Row || json?.Rows?.Row || [];
  return parseSummaryRows(rows);
}
