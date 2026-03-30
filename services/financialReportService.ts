import {
  parseSummaryRows,
  parseDetailRows
} from "./reportService";
import { DetailedFinancialData } from "@/types/financial-details";
import { FinancialLine } from "@/types/balance-sheet";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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

export async function getBalanceSheet(): Promise<FinancialLine[]> {
  const json = await fetchWithAuth("/balance-sheet");
  const rows = json?.data?.Rows?.Row || json?.Rows?.Row || [];
  return parseSummaryRows(rows);
}

export async function getBalanceSheetDetail(): Promise<DetailedFinancialData> {
  const json = await fetchWithAuth("/balance-sheet-detail");
  const rows = json?.data?.Rows?.Row || json?.Rows?.Row || [];
  const reportDate = json?.data?.Header?.EndPeriod || json?.Header?.EndPeriod || "N/A";
  return parseDetailRows(rows, reportDate);
}

export async function getProfitAndLoss(): Promise<FinancialLine[]> {
  const json = await fetchWithAuth("/profit-and-loss");
  const rows = json?.data?.Rows?.Row || json?.Rows?.Row || [];
  return parseSummaryRows(rows);
}

export async function getProfitAndLossDetail(): Promise<DetailedFinancialData> {
  const json = await fetchWithAuth("/profit-and-loss-detail");
  const rows = json?.data?.Rows?.Row || json?.Rows?.Row || [];
  const reportDate = json?.data?.Header?.EndPeriod || json?.Header?.EndPeriod || "N/A";
  return parseDetailRows(rows, reportDate);
}

export async function getProfitAndLossStatement(): Promise<FinancialLine[]> {
  const json = await fetchWithAuth("/profit-and-loss-statement");
  const rows = json?.data?.Rows?.Row || json?.Rows?.Row || [];
  return parseSummaryRows(rows);
}
