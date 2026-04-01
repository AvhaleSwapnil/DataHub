"use client";

import { useState, useEffect } from "react";
import { getCashflow, getCashflowDetail } from "@/services/financialReportService";
import FinancialReport from "@/components/FinancialReport";

interface CashflowReportProps {
    startDate?: string;
    endDate?: string;
    selectedView: "Summary" | "Detail";
}

export default function CashflowReport({ startDate, endDate, selectedView }: CashflowReportProps) {
    const [data, setData] = useState<any[]>([]);
    const [detailedData, setDetailedData] = useState<any>({ groups: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);

        if (selectedView === "Summary") {
            getCashflow(startDate, endDate)
                .then(res => { if (isMounted) setData(res); })
                .catch(() => { if (isMounted) setError("Failed to fetch Cashflow summary."); })
                .finally(() => { if (isMounted) setLoading(false); });
        } else {
            getCashflowDetail(startDate, endDate)
                .then(res => { if (isMounted) setDetailedData(res); })
                .catch(() => { if (isMounted) setError("Failed to fetch Cashflow detailed."); })
                .finally(() => { if (isMounted) setLoading(false); });
        }
        
        return () => {
            isMounted = false;
        };
    }, [startDate, endDate, selectedView]);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-bg-page card-base border border-border py-12">
                <div className="w-12 h-12 rounded-full border-4 border-border border-t-primary animate-spin mb-4" />
                <p className="text-[13px] text-text-muted animate-pulse">Loading Cashflow...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-bg-page card-base border border-border text-red-500 py-12">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <FinancialReport
            key={selectedView}
            data={data}
            detailedData={detailedData}
            title="Cashflow"
            subtitle="Statement of Cash Flows"
            hideToolbar={true}
            initialViewMode={selectedView.toLowerCase() as "summary" | "detail"}
        />
    );
}
