"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  FileText,
  BarChart3,
  TrendingUp,
  LogOut,
  LayoutDashboard,
  Link2,
  PieChart,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/balance-sheet", label: "Balance Sheet", icon: BarChart3 },
  { href: "/profit-loss", label: "Profit & Loss", icon: TrendingUp },
  { href: "/connections", label: "Connections", icon: Link2 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-bg-sidebar border-r border-border flex flex-col z-30"
      style={{ boxShadow: "var(--shadow-sidebar)" }}
    >
      {/* Brand */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <PieChart size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[17px] font-black text-gray-900 tracking-tighter leading-tight uppercase">
              DATA<span className="text-primary font-black">HUB</span>
            </h1>
            <p className="text-[10px] text-text-muted font-bold tracking-[0.2em] uppercase opacity-70">
              Financial Suite
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-input)] text-[13.5px] font-medium
                transition-all duration-200 group relative
                ${isActive
                  ? "bg-bg-sidebar-active text-primary-dark"
                  : "text-text-secondary hover:bg-bg-sidebar-hover hover:text-text-primary"
                }
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
              )}
              <Icon
                size={18}
                className={`transition-colors duration-200 ${isActive
                    ? "text-primary"
                    : "text-text-muted group-hover:text-text-secondary"
                  }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-border pt-3">
        <button className="flex items-center gap-3 px-4 py-2.5 w-full rounded-[var(--radius-input)] text-[13.5px] font-medium text-text-secondary hover:bg-negative-bg hover:text-negative transition-all duration-200 cursor-pointer">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
