"use client";

import React from "react";
import Header from "@/components/Header";
import FinancialReport from "@/components/FinancialReport";
import { SkeletonReportTable } from "@/components/SkeletonLoader";
import { balanceSheetDetailData as fallbackDetail } from "@/data/financial-details";
import { useBalanceSheet } from "@/hooks/useBalanceSheet";

export default function BalanceSheetPage() {
  const { reportData, detailedData, isLoading, error } = useBalanceSheet();

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
