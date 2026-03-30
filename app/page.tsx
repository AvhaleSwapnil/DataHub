"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import {
  FileText,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Wallet,
  Receipt,
  PieChart,
  Search,
  ChevronDown,
  Building2,
  CreditCard,
  Scale,
  RefreshCw,
  PiggyBank,
  ArrowDownToLine,
  Package,
  ArrowUpFromLine,
  Landmark,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { fetchDashboardKPIs, fetchFinancialTrends } from "@/services/reportService";
import { fetchCustomers } from "@/services/customerService";
import { fetchInvoices } from "@/services/invoiceService";
import { getProfitAndLoss } from "@/services/financialReportService";
import { exportToCSV } from "@/lib/exportCSV";


export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [dynamicStats, setDynamicStats] = useState<any[]>([]);
  const [customersData, setCustomersData] = useState<any[]>([]);
  const [invoicesData, setInvoicesData] = useState<any[]>([]);
  const [chartDataState, setChartDataState] = useState<any[]>([]);
  const [monthlyInsights, setMonthlyInsights] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setIsClient(true);
    let isMounted = true;

    async function loadAllData() {
      try {
        const [kpiData, custsData, invsData, plData, trendData] = await Promise.all([
          fetchDashboardKPIs(),
          fetchCustomers(),
          fetchInvoices(),
          getProfitAndLoss().catch(() => []),
          fetchFinancialTrends().catch(() => [])
        ]);

        if (isMounted) {
          const custs = Array.isArray(custsData?.QueryResponse?.Customer) ? custsData.QueryResponse.Customer :
            Array.isArray(custsData?.data?.QueryResponse?.Customer) ? custsData.data.QueryResponse.Customer :
              (Array.isArray(custsData) ? custsData : []);

          const invs = Array.isArray(invsData?.QueryResponse?.Invoice) ? invsData.QueryResponse.Invoice :
            Array.isArray(invsData?.data?.QueryResponse?.Invoice) ? invsData.data.QueryResponse.Invoice :
              (Array.isArray(invsData) ? invsData : []);

          setCustomersData(custs);
          setInvoicesData(invs);
          setChartDataState(trendData);

          let totalRevenue = 0;
          let outstandingCount = 0;

          invs.forEach((inv: any) => {
            const amt = inv.TotalAmt || inv.amount || 0;
            const bal = inv.Balance || inv.balance || 0;
            totalRevenue += amt;
            if (bal > 0 && (inv.status !== "paid")) outstandingCount++;
          });


          const finalMap = kpiData.map(stat => {
            if (stat.label === "Total Revenue") {
              return { ...stat, value: "$" + totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) };
            }
            return stat;
          });

          let totalExpenses = 0;
          const findExpenses = (lines: any[]) => {
            for (const line of lines) {
              if (line.name && line.name.toUpperCase().includes("EXPENSE") && typeof line.amount === 'number' && line.amount > 0) {
                totalExpenses = line.amount;
              }
              if (line.children) findExpenses(line.children);
            }
          };
          findExpenses(plData);

          const finalKpis = finalMap.map((stat: any) => {
            if (stat.label === "Total Expenses") {
              return { ...stat, value: "$" + totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) };
            }
            return stat;
          });

          setDynamicStats(finalKpis);

          // Calculate Monthly Insights
          const formatInsight = (num: number) =>
            "$" + num.toLocaleString("en-US", { maximumFractionDigits: 0 });

          const rawAP = kpiData.find(k => k.label === "Account Payable")?.value?.replace(/[$,]/g, "") || "0";
          const apVal = parseFloat(rawAP);

          const rawBank = kpiData.find(k => k.label === "Cash & Bank Balance")?.value?.replace(/[$,]/g, "") || "0";
          const bankVal = parseFloat(rawBank);

          const margin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100) : 0;

          setMonthlyInsights([
            { label: "Operating Margin", value: margin.toFixed(1) + "%", color: "#8bc53d", desc: margin > 20 ? "Healthy profit range" : "Monitor expenses" },
            { label: "Account Payable", value: formatInsight(apVal), color: "#F68C1F", desc: "Current liabilities" },
            { label: "Cash on Hand", value: formatInsight(bankVal), color: "#00648F", desc: "Liquid bank balance" },
          ]);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAllData();

    return () => { isMounted = false; };
  }, []);

  const handleExportTrendsCSV = () => {
    exportToCSV(
      chartDataState,
      ["Month", "Revenue", "Expenses"],
      "financial_trends",
      (item) => [item.name, item.revenue.toFixed(2), item.expenses.toFixed(2)]
    );
  };

  return (
    <>
      <Header title="Dashboard" />
      <div className="flex-1 p-6 space-y-6">
        <h1 className="text-[24px] font-bold text-text-primary">Dashboard</h1>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dynamicStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className={cn(
                  "card-base card-p",
                  isLoading ? "opacity-0" : "opacity-100"
                )}
                style={{
                  transitionDelay: `${i * 100}ms`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[14px] font-medium text-text-secondary">
                    {stat.label}
                  </span>
                  <Icon size={18} style={{ color: stat.color }} strokeWidth={2} />
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-[24px] font-bold text-text-primary leading-none tracking-tight">
                    {isLoading ? (
                      <span className="skeleton inline-block h-8 w-24 rounded-md" />
                    ) : (
                      stat.value
                    )}
                  </p>

                  <p className="text-[12px] text-text-muted mt-1">
                    {stat.change} from last month
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Revenue vs Expenses Chart */}
          <div
            className="col-span-12 lg:col-span-8 card-base card-p flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-semibold text-text-primary">Financial Trends</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportTrendsCSV}
                  className="btn-secondary h-auto py-1.5 text-[13px]"
                >
                  Export CSV
                </button>
              </div>
            </div>

            <div className="h-[300px] w-full mt-auto">
              {isClient && !isLoading ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataState} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--color-text-muted)", fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--color-text-muted)", fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--color-bg-page)', radius: 4 }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-card)',
                        fontSize: '13px',
                        padding: '10px 14px'
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '16px', fontSize: '12px', fontWeight: 500 }}
                    />
                    <Bar name="Revenue" dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar name="Expenses" dataKey="expenses" fill="var(--color-negative)" fillOpacity={0.7} radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center p-8">
                  <div className="w-full h-full bg-bg-page/50 rounded-lg flex items-center justify-center border border-dashed border-border">
                    <TrendingUp className="text-text-muted animate-pulse" size={32} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Performance Summary / Insights */}
          <div
            className="col-span-12 lg:col-span-4 card-base card-p flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-semibold text-text-primary">Monthly Insight</h3>
              <PieChart size={18} className="text-primary" />
            </div>

            <div className="flex-1 space-y-3">
              {(monthlyInsights.length > 0 ? monthlyInsights : [
                { label: "Operating Margin", value: "0%", color: "#8bc53d", desc: "Calculating..." },
                { label: "Account Payable", value: "$0", color: "#F68C1F", desc: "Loading..." },
                { label: "Cash on Hand", value: "$0", color: "#00648F", desc: "Loading..." },
              ]).map((item, i) => (
                <div key={i} className="p-4 rounded-lg bg-bg-page/50 hover:bg-bg-page transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium text-text-muted">{item.label}</span>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  </div>
                  <p className="text-[20px] font-bold text-text-primary mb-0.5">{item.value}</p>
                  <p className="text-[12px] text-text-muted">{item.desc}</p>
                </div>
              ))}
            </div>

            <button className="btn-secondary w-full mt-5 py-2.5">
              Comprehensive Audit Info
            </button>
          </div>

          {/* Recent Invoices - Full Width Table */}
          <div
            className="col-span-12 card-base card-p"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-semibold text-text-primary">Recent Invoices</h3>

              <div className="flex items-center gap-3">
                <div className="relative w-[280px]">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-text-muted" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-base pl-10 h-10"
                  />
                </div>

                <Link href="/invoices">
                  <button className="btn-primary">
                    View All
                    <ChevronDown size={16} />
                  </button>
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-bg-page/50">
                    <th className="py-3 px-6 text-[14px] font-medium text-text-muted">Invoice & Date</th>
                    <th className="py-3 px-4 text-[14px] font-medium text-text-muted">Client</th>
                    <th className="py-3 px-4 text-[14px] font-medium text-text-muted">Due Date</th>
                    <th className="py-3 px-4 text-[14px] font-medium text-text-muted text-right">Amount</th>
                    <th className="py-3 px-4 text-[14px] font-medium text-text-muted text-right">Balance</th>
                    <th className="py-3 px-4 text-[14px] font-medium text-text-muted text-center w-[100px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={6} className="py-4 px-4"><div className="skeleton h-8 w-full rounded-md" /></td></tr>
                    ))
                  ) : (
                    invoicesData
                      .filter((inv: any) => {
                        const s = searchTerm.toLowerCase();
                        const idMatch = (inv.DocNumber || inv.id || "").toLowerCase().includes(s);
                        const customerMatch = (inv.CustomerRef?.name || inv.customer || "").toLowerCase().includes(s);
                        return idMatch || customerMatch;
                      })
                      .slice(0, 5)
                      .map((inv: any, i: number) => {
                        const amount = inv.TotalAmt || inv.amount || 0;
                        const balance = inv.Balance || inv.balance || 0;

                        // Accurate status mapping consistent with Invoices page
                        let status = "open";
                        if (balance === 0) status = "paid";
                        else if (inv.DueDate && new Date(inv.DueDate) < new Date()) status = "overdue";

                        const statusConfig = (s: string) => {
                          const cfgs: any = {
                            paid: { label: "Paid", icon: CheckCircle2, color: "bg-[#8bc53d] text-white" },
                            open: { label: "Open", icon: Clock, color: "bg-[#00648F] text-white" },
                            overdue: { label: "Overdue", icon: AlertCircle, color: "bg-[#C62026] text-white" },
                            draft: { label: "Draft", icon: FileText, color: "bg-[#6D6E71] text-white" },
                          };
                          return cfgs[s.toLowerCase()] || cfgs.open;
                        };
                        const config = statusConfig(status);
                        const StatusIcon = config.icon;

                        return (
                          <tr key={inv.id || i} className="group hover:bg-bg-page/50 transition-colors">
                            <td className="py-3 px-6">
                              <div className="flex flex-col">
                                <span className="text-[14px] font-medium text-text-primary">#{inv.DocNumber || inv.id || `INV-00${i + 1}`}</span>
                                <span className="text-[12px] text-text-muted">
                                  {new Date(inv.MetaData?.CreateTime || inv.date || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[14px] text-text-secondary">
                              {inv.CustomerRef?.name || inv.customer || "Unknown Client"}
                            </td>
                            <td className="py-3 px-4 text-[14px] text-text-secondary">
                              {inv.DueDate || inv.dueDate || "N/A"}
                            </td>
                            <td className="py-3 px-4 text-right text-[14px] font-semibold text-text-primary tabular-nums">
                              ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right text-[14px] font-medium text-text-primary tabular-nums">
                              ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className={cn(
                                "inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[12px] font-bold capitalize min-w-[80px]",
                                config.color
                              )}>
                                {config.label}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
