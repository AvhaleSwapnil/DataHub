"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import {
  Link2,
  Link2Off,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Shield,
  Database,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickbooksService } from "@/services/quickbooksService";

interface ConnectionInfo {
  status: "connected" | "disconnected" | "expired" | "error";
  companyName: string;
  companyId: string;
  connectedAt: string;
  lastSynced: string;
  tokenExpiresAt: string;
  environment: "sandbox" | "production";
  syncedEntities: {
    name: string;
    count: number;
    lastSync: string;
    status: "synced" | "syncing" | "error";
  }[];
}

const connectionData: ConnectionInfo = {
  status: "connected",
  companyName: "Sage Healthy RCM",
  companyId: "4620816365213104410",
  connectedAt: "2026-03-20T10:30:00Z",
  lastSynced: "2026-03-25T17:00:00Z",
  tokenExpiresAt: "2026-04-19T10:30:00Z",
  environment: "production",
  syncedEntities: [
    { name: "Customers", count: 89, lastSync: "2026-03-25T17:00:00Z", status: "synced" },
    { name: "Invoices", count: 247, lastSync: "2026-03-25T17:00:00Z", status: "synced" },
    { name: "Accounts", count: 68, lastSync: "2026-03-25T16:45:00Z", status: "synced" },
    { name: "Payments", count: 182, lastSync: "2026-03-25T16:30:00Z", status: "synced" },
    { name: "Vendors", count: 34, lastSync: "2026-03-25T14:00:00Z", status: "synced" },
    { name: "Bills", count: 95, lastSync: "2026-03-25T14:00:00Z", status: "synced" },
  ],
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
  });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 86400000));
}

export default function ConnectionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [connection, setConnection] = useState<ConnectionInfo | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setConnection(connectionData);
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await QuickbooksService.refreshToken();
      console.log("Token successfully refreshed before syncing");
      // We can add actual QB sync triggers here in the future
    } catch (err) {
      console.error("Error during sync/refresh:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 1500); // simulate the sync duration
    }
  };

  const handleConnect = async () => {
    // Also use the refresh token API as requested for the connect button
    setIsLoading(true);
    try {
      await QuickbooksService.refreshToken();
    } catch (err) {
      console.error(err);
    } finally {
      setConnection(connectionData);
      setIsLoading(false);
    }
  };

  const statusConfig = {
    connected: { label: "Connected", icon: CheckCircle2, color: "text-primary", bg: "bg-primary-light/40" },
    disconnected: { label: "Disconnected", icon: Link2Off, color: "text-text-secondary", bg: "bg-bg-page" },
    expired: { label: "Token Expired", icon: AlertCircle, color: "text-warning", bg: "bg-warning-bg/30" },
    error: { label: "Connection Error", icon: AlertCircle, color: "text-negative", bg: "bg-negative-bg" },
  };

  const currentStatus = connection ? statusConfig[connection.status] : statusConfig.disconnected;
  const tokenDaysLeft = connection ? daysUntil(connection.tokenExpiresAt) : 0;

  return (
    <>
      <Header title="Manage Connection" />
      <div className="flex-1 p-6 space-y-5">
        <h1 className="text-[24px] font-bold text-text-primary">Manage Connection</h1>
        
        {/* Main Status Card */}
        <div className="card-base overflow-hidden">
          <div className={cn("px-6 py-3 flex items-center justify-between border-b-2", 
            connection?.status === "connected" ? "bg-primary-light/10 border-primary" : "bg-bg-page border-border"
          )}>
            <div className="flex items-center gap-2">
              <currentStatus.icon size={16} className={currentStatus.color} />
              <span className={cn("text-[14px] font-semibold", currentStatus.color)}>{currentStatus.label}</span>
            </div>
            {connection?.status === "connected" && (
              <span className="text-[12px] text-text-muted">Last synced: {timeAgo(connection.lastSynced)}</span>
            )}
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="skeleton h-12 w-64 rounded-md" />
                <div className="skeleton h-4 w-48 rounded-md" />
              </div>
            ) : connection?.status === "connected" ? (
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary text-white font-bold text-xl">QB</div>
                  <div>
                    <h3 className="text-[18px] font-semibold text-text-primary">QuickBooks Online</h3>
                    <p className="text-[14px] text-text-secondary mb-3">{connection.companyName}</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                       <div className="flex items-center gap-1.5 text-[12px] text-text-muted">
                        <Database size={13} /> Company ID: <span className="font-medium text-text-secondary">{connection.companyId}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] text-text-muted">
                        <Shield size={13} /> Environment: <span className="font-semibold text-primary capitalize">{connection.environment}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleSync} disabled={isSyncing} className="btn-primary">
                    <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? "Syncing..." : "Sync Now"}
                  </button>
                  <button onClick={() => setShowDisconnectModal(true)} className="btn-negative">Disconnect</button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-xl bg-bg-page mx-auto mb-4 flex items-center justify-center text-text-muted"><Link2Off size={32} /></div>
                <h3 className="text-[18px] font-semibold text-text-primary mb-2">No active connection</h3>
                <p className="text-[14px] text-text-secondary mb-6 max-w-sm mx-auto">Connect your QuickBooks account to start syncing your financial data automatically.</p>
                <button onClick={handleConnect} className="btn-primary h-11 px-8 shadow-md mx-auto"><Zap size={16} fill="white" /> Connect to QuickBooks</button>
              </div>
            )}
          </div>
        </div>

        {/* Info Grid */}
        {connection?.status === "connected" && !isLoading && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="card-base p-5">
                <div className="flex items-center gap-2 mb-3 text-text-muted text-[12px] font-medium"><Shield size={14} className="text-accent-1" /> Access Token</div>
                <p className="text-[24px] font-bold text-text-primary">Active</p>
                <p className="text-[12px] text-text-muted mt-1">Refreshed automatically</p>
              </div>
              <div className="card-base p-5 border-l-4 border-l-warning">
                <div className="flex items-center gap-2 mb-3 text-text-muted text-[12px] font-medium"><Clock size={14} className="text-warning" /> Token Expiry</div>
                <p className="text-[24px] font-bold text-warning">{tokenDaysLeft} Days Left</p>
                <p className="text-[12px] text-text-muted mt-1">Valid until {formatDate(connection.tokenExpiresAt)}</p>
              </div>
              <div className="card-base p-5">
                <div className="flex items-center gap-2 mb-3 text-text-muted text-[12px] font-medium"><Database size={14} className="text-accent-3" /> Records Synced</div>
                <p className="text-[24px] font-bold text-text-primary">{connection.syncedEntities.reduce((a, b) => a + b.count, 0).toLocaleString()}</p>
                <p className="text-[12px] text-text-muted mt-1">Total synchronized entries</p>
              </div>
            </div>

            {/* Entity List */}
            <div className="card-base overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-[16px] font-semibold text-text-primary">Synced Entities</h3>
              </div>
              <div className="divide-y divide-border">
                {connection.syncedEntities.map((entity, i) => (
                  <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-bg-page/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-md bg-bg-page flex items-center justify-center text-text-secondary"><Database size={18} /></div>
                      <div>
                        <p className="text-[14px] font-medium text-text-primary">{entity.name}</p>
                        <p className="text-[12px] text-text-muted">Last sync {timeAgo(entity.lastSync)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[14px] font-semibold text-text-primary">{entity.count}</p>
                        <p className="text-[11px] text-text-muted uppercase">Entities</p>
                      </div>
                      <span className="text-[11px] font-semibold px-2 px-1.5 bg-primary-light/40 text-primary-dark rounded-full">Synced</span>
                      <ChevronRight size={16} className="text-text-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="card-base p-6">
              <h3 className="text-[16px] font-semibold text-text-primary mb-6">Recent Activity</h3>
              <div className="relative pl-6 space-y-6">
                <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border" />
                {[
                  { title: "Manual sync triggered", detail: "Started for 6 entities", time: "Today, 5:00 PM" },
                  { title: "Invoice sync complete", detail: "247 records updated", time: "Today, 4:45 PM" },
                  { title: "OAuth token refreshed", detail: "Access valid for 60 mins", time: "Today, 4:00 PM" },
                  { title: "System check", detail: "Connection health looking good", time: "Today, 10:30 AM" },
                ].map((act, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[19.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white" />
                    <p className="text-[14px] font-semibold text-text-primary leading-tight">{act.title}</p>
                    <p className="text-[12px] text-text-secondary mt-0.5">{act.detail}</p>
                    <p className="text-[11px] text-text-muted mt-1">{act.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {showDisconnectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDisconnectModal(false)} />
            <div className="relative bg-bg-card rounded-xl border border-border w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="w-12 h-12 bg-negative-bg rounded-full flex items-center justify-center mx-auto mb-4 text-negative"><AlertCircle size={24} /></div>
              <h3 className="text-[18px] font-semibold text-center text-text-primary mb-2">Disconnect QuickBooks?</h3>
              <p className="text-[14px] text-text-secondary text-center leading-relaxed">This will stop all automatic syncing and revoke active tokens. Your current data will remain as-is.</p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowDisconnectModal(false)} className="flex-1 h-10 rounded-md border border-border font-medium text-[14px] hover:bg-bg-page transition-colors">Cancel</button>
                <button onClick={() => { setConnection({ ...connectionData, status: "disconnected" }); setShowDisconnectModal(false); }} className="flex-1 h-10 rounded-md bg-negative text-white font-semibold text-[14px] hover:bg-negative-dark transition-colors">Disconnect</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
