"use client";

import { Bell, Sparkles, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
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
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Left: Date/Time & Title */}
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[12px] text-primary font-semibold">
              {currentDate}
            </span>
            <span className="text-[12px] text-text-muted">{currentTime}</span>
          </div>
          <h2 className="text-[22px] font-bold text-text-primary tracking-tight">
            {title}
          </h2>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button className="relative p-2.5 rounded-[var(--radius-input)] hover:bg-bg-page transition-colors duration-200 cursor-pointer">
            <Bell size={19} className="text-text-secondary" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-bg-card" />
          </button>
        </div>
      </div>
    </header>
  );
}
