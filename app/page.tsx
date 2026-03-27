"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import {
  FileText,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Wallet,
  Receipt,
  PieChart,
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

const stats = [
  {
    label: "Total Revenue",
    value: "$142,450.00",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
    color: "#8bc53d",
  },
  {
    label: "Total Expenses",
    value: "$95,230.50",
    change: "+4.2%",
    trend: "down" as const,
    icon: Wallet,
    color: "#C62026",
  },
  {
    label: "Net Profit",
    value: "$47,219.50",
    change: "+18.3%",
    trend: "up" as const,
    icon: TrendingUp,
    color: "#00648F",
  },
  {
    label: "Outstanding Invoices",
    value: "$28,450.75",
    change: "6 invoices",
    trend: "neutral" as const,
    icon: Receipt,
    color: "#F68C1F",
  },
];

const chartData = [
  { name: "Jan", revenue: 65, expenses: 40 },
  { name: "Feb", revenue: 45, expenses: 35 },
  { name: "Mar", revenue: 85, expenses: 50 },
  { name: "Apr", revenue: 55, expenses: 45 },
  { name: "May", revenue: 70, expenses: 30 },
  { name: "Jun", revenue: 95, expenses: 60 },
];

const recentInvoices = [
  { id: "INV-2026-0042", customer: "Kestnerphysmed, LLC", amount: 12450.0, status: "open" },
  { id: "INV-2026-0031", customer: "Metro Orthopedic Group", amount: 22100.0, status: "open" },
  { id: "INV-2026-0012", customer: "Restore Muscle & Joint", amount: 8320.5, status: "open" },
  { id: "INV-2026-0009", customer: "Health First Chiro", amount: 9500.0, status: "overdue" },
  { id: "INV-2026-0005", customer: "Pinnacle Sports Med", amount: 5780.25, status: "open" },
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Header title="Dashboard" />
      <div className="flex-1 p-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className={`bg-bg-card rounded-[var(--radius-card)] border border-border p-6 transition-all duration-300 hover:translate-y-[-2px] ${isLoading ? "opacity-0" : "opacity-100"
                  }`}
                style={{
                  boxShadow: "var(--shadow-card)",
                  transitionDelay: `${i * 100}ms`,
                  borderLeft: `4px solid ${stat.color}`,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-[12px] font-bold text-text-muted uppercase tracking-widest">
                    {stat.label}
                  </span>
                  <div
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${stat.color}10` }}
                  >
                    <Icon size={18} style={{ color: stat.color }} />
                  </div>
                </div>
                <p className="text-[26px] font-bold text-text-primary leading-none mb-2">
                  {isLoading ? (
                    <span className="skeleton inline-block h-8 w-24 rounded-md" />
                  ) : (
                    stat.value
                  )}
                </p>
                <div className="flex items-center gap-1.5">
                  {stat.trend === "up" && <ArrowUpRight size={14} className="text-primary font-bold" />}
                  {stat.trend === "down" && <ArrowDownRight size={14} className="text-negative font-bold" />}
                  <span className={`text-[12px] font-bold ${stat.trend === "up" ? "text-primary" : stat.trend === "down" ? "text-negative" : "text-text-muted"
                    }`}>
                    {stat.change}
                  </span>
                  <span className="text-[11px] text-text-muted font-medium ml-1">vs last month</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Revenue vs Expenses Chart with Recharts */}
          <div
            className="col-span-12 lg:col-span-8 bg-bg-card rounded-[var(--radius-card)] border border-border p-6 flex flex-col"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-[16px] font-bold text-text-primary">Financial Trends</h3>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-[11px] font-bold rounded-md bg-bg-page border border-border-light text-text-secondary hover:border-border transition-all">Export PDF</button>
                <button className="px-3 py-1.5 text-[11px] font-bold rounded-md bg-accent-4 text-white shadow-sm hover:bg-accent-4/90 transition-all">Full View</button>
              </div>
            </div>

            <div className="h-[300px] w-full mt-auto">
              {isClient && !isLoading ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--color-text-muted)", fontSize: 11, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--color-text-muted)", fontSize: 11, fontWeight: 700 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--color-bg-page)', radius: 4 }}
                      contentStyle={{
                        borderRadius: 'var(--radius-card)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-card)',
                        fontSize: '12px',
                        padding: '12px'
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    />
                    <Bar name="Revenue" dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar name="Expenses" dataKey="expenses" fill="var(--color-negative)" fillOpacity={0.7} radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center p-8">
                  <div className="w-full h-full bg-bg-page/50 rounded-[12px] flex items-center justify-center border border-dashed border-border">
                    <TrendingUp className="text-text-muted animate-pulse" size={32} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Performance Summary / Insights */}
          <div
            className="col-span-12 lg:col-span-4 bg-bg-card rounded-[var(--radius-card)] border border-border p-6 flex flex-col"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[16px] font-bold text-text-primary">Monthly Insight</h3>
              <PieChart size={18} className="text-primary" />
            </div>

            <div className="flex-1 space-y-4">
              {[
                { label: "Operating Margin", value: "33.1%", color: "#8bc53d", desc: "Healthy profit range" },
                { label: "Account Payable", value: "$4,230", color: "#F68C1F", desc: "Due within 14 days" },
                { label: "Projected Cash", value: "$182K", color: "#00648F", desc: "Estimated end of Q2" },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-[16px] border border-border-light hover:border-primary/20 transition-all group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">{item.label}</span>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  </div>
                  <p className="text-[20px] font-bold text-text-primary mb-1">{item.value}</p>
                  <p className="text-[12px] text-text-secondary">{item.desc}</p>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 py-3 bg-bg-page hover:bg-border-light border border-border text-[12px] font-bold text-text-primary rounded-[var(--radius-button)] transition-all">
              Comprehensive Audit Info
            </button>
          </div>

          {/* Recent Invoices - Full Width Table */}
          <div
            className="col-span-12 bg-bg-card rounded-[var(--radius-card)] border border-border overflow-hidden"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-text-primary">Recent Invoices</h3>
              <button className="text-[12px] font-bold text-primary hover:underline">Manage All Invoices</button>
            </div>

            <div className="overflow-x-auto px-6 pb-6 pt-2">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border-light">
                    <th className="py-4 text-[11px] font-black text-text-muted uppercase tracking-widest">Number</th>
                    <th className="py-4 text-[11px] font-black text-text-muted uppercase tracking-widest">Customer</th>
                    <th className="py-4 text-[11px] font-black text-text-muted uppercase tracking-widest text-right">Amount</th>
                    <th className="py-4 text-[11px] font-black text-text-muted uppercase tracking-widest text-center">Status</th>
                    <th className="py-4 text-[11px] font-black text-text-muted uppercase tracking-widest">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={5} className="py-4"><div className="skeleton h-8 w-full rounded-md" /></td></tr>
                    ))
                  ) : (
                    recentInvoices.map((inv, i) => (
                      <tr key={i} className="group hover:bg-bg-page/50 transition-colors">
                        <td className="py-4 text-[13.5px] font-bold text-accent-1 hover:underline cursor-pointer">{inv.id}</td>
                        <td className="py-4 text-[13.5px] text-text-primary font-semibold">{inv.customer}</td>
                        <td className="py-4 text-[14.5px] font-bold text-text-primary text-right">${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 text-center">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${inv.status === "paid" ? "bg-primary-light/50 text-primary-dark" :
                            inv.status === "overdue" ? "bg-negative-bg text-negative" :
                              "bg-accent-light-blue/30 text-accent-1"
                            }`}>
                            {inv.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 text-[13px] text-text-secondary font-medium">Apr 15, 2026</td>
                      </tr>
                    ))
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
