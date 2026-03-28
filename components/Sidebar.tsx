"use client";

import { useState, useRef, useEffect } from "react";
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
  Briefcase,
  Settings,
  BarChart,
  MoreHorizontal,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart },
  { href: "/connections", label: "Connections", icon: Link2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[240px] bg-bg-sidebar border-r border-border flex flex-col z-30"
      style={{ boxShadow: "var(--shadow-sidebar)" }}
    >
      {/* Brand */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <BarChart size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[16px] font-bold text-text-primary tracking-tight leading-tight">
              DATA<span className="text-primary">HUB</span>
            </h1>
            <p className="text-[11px] text-text-muted leading-none mt-0.5">Sage Healthy RCM</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] font-medium
                transition-all duration-200 group relative
                ${isActive
                  ? "bg-bg-sidebar-active text-primary font-semibold"
                  : "text-text-secondary hover:bg-bg-sidebar-hover hover:text-text-primary"
                }
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
              )}
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 2}
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
      <div className="px-3 pb-4 border-t border-border pt-4 relative" ref={menuRef}>
        {/* User Profile */}
        <div 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-md hover:bg-bg-sidebar-hover cursor-pointer transition-colors duration-200 group"
        >
          <div className="w-8 h-8 shrink-0 rounded-full bg-primary flex items-center justify-center text-white text-[12px] font-semibold">
            SA
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[14px] font-medium text-text-primary truncate leading-none">
              Jhon Doe
            </p>
            <p className="text-[12px] text-text-muted truncate mt-1 leading-none">Administrator</p>
          </div>
          <button className="text-text-muted hover:text-text-primary transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Profile Dropdown */}
        {showProfileMenu && (
          <div 
            className="absolute bottom-[60px] left-3 right-3 bg-bg-card rounded-md border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{ boxShadow: "var(--shadow-dropdown)" }}
          >
            <button 
              className="flex items-center gap-3 w-full px-4 py-3 text-[13px] font-medium text-negative hover:bg-negative/10 transition-colors"
              onClick={() => {
                // handle logout
                setShowProfileMenu(false);
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
