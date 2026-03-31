"use client";

import { Bell, Sparkles, ChevronDown, AlertCircle, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { getConnectionStatus, connectQuickbooks } from "@/services/authService";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [isConnected, setIsConnected] = useState<boolean | null>(true); // default true to avoid flash

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      try {
        const data = await getConnectionStatus();
        if (mounted) setIsConnected(data.isConnected);
      } catch (err) {
        if (mounted) setIsConnected(false);
      }
    };
    checkStatus();

    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => {
      clearInterval(interval);
      mounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-bg-card border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Date/Time & Title */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-text-muted font-medium">
              {currentDate}
            </span>
            <span className="text-[13px] text-text-muted tabular-nums font-medium">{currentTime}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {isConnected === false && (
            <div className="flex items-center gap-3 bg-negative-bg/40 px-3 py-1.5 rounded-lg border border-negative/20 mr-2">
              <span className="text-[13px] text-negative font-medium flex items-center gap-1.5">
                <AlertCircle size={15} /> You are disconnected.
              </span>
              <button
                onClick={connectQuickbooks}
                className="text-[12px] bg-negative hover:bg-negative-dark text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors font-semibold shadow-sm"
              >
                <Zap size={13} fill="currentColor" /> Connect to QuickBooks
              </button>
            </div>
          )}

          <button className="flex items-center justify-center w-10 h-10 bg-bg-card hover:bg-bg-page border border-border rounded-md text-text-muted transition-all group">
            <Bell size={18} className="group-hover:text-primary" />
          </button>
          
          <button className="flex items-center gap-2 px-4 h-10 bg-primary hover:bg-primary-dark text-white text-[14px] font-semibold rounded-md transition-all active:scale-[0.98]">
            <Sparkles size={16} />
            History
          </button>
        </div>
      </div>
    </header>
  );
}
