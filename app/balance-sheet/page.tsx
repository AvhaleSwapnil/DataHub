"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import FinancialReport from "@/components/FinancialReport";
import { SkeletonReportTable } from "@/components/SkeletonLoader";
import { FinancialLine } from "@/data/balance-sheet";
import { DetailedFinancialData, balanceSheetDetailData as fallbackDetail } from "@/data/financial-details";
import { parseQBBalanceSheet, parseQBBalanceSheetDetails } from "@/lib/quickbooks-parser";

export default function BalanceSheetPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<FinancialLine[]>([]);
  const [detailedData, setDetailedData] = useState<DetailedFinancialData>({ groups: [], grandTotal: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalanceSheetData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch Summary Report
        const reportRes = await fetch("http://localhost:3000/balance-sheet");
        if (!reportRes.ok) throw new Error(`HTTP Error: ${reportRes.status}`);
        const reportJson = await reportRes.json();
        
        const parsedReport = parseQBBalanceSheet(reportJson);
        setReportData(parsedReport);

        // Fetch Detailed Report
        const detailRes = await fetch("http://localhost:3000/balance-sheet-detail");
        if (!detailRes.ok) throw new Error(`HTTP Error: ${detailRes.status}`);
        const detailJson = await detailRes.json();
        
        const parsedDetail = parseQBBalanceSheetDetails(detailJson);
        setDetailedData(parsedDetail);

      } catch (err: any) {
        console.error("Error fetching balance sheet API:", err);
        setError("Failed to load real data. Please ensure the backend is running at localhost:3000 and CORS is configured.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBalanceSheetData();
  }, []);

  return (
    <>
      <Header title="Balance Sheet" />
      <div className="flex-1 p-8 flex flex-col min-h-0 min-w-0">
        {isLoading ? (
          <SkeletonReportTable />
        ) : error && reportData.length === 0 ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-md font-medium flex items-center gap-3 border border-red-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        ) : (
          <FinancialReport 
            data={reportData} 
            detailedData={detailedData.groups.length > 0 ? detailedData : fallbackDetail}
            title="Balance Sheet" 
            subtitle="As of March 26, 2026" 
          />
        )}
      </div>
    </>
  );
}
