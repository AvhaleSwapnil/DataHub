"use client";

import { useState, Fragment } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { DetailedFinancialData, AccountDetail, Transaction } from "@/data/financial-details";

interface FinancialDetailsProps {
  data: DetailedFinancialData;
  title: string;
  subtitle: string;
}

const TransactionRow = ({ tx, depth = 3 }: { tx: Transaction; depth?: number }) => {
  return (
    <tr className="hover:bg-gray-50/70 border-b border-gray-100/60 transition-colors">
      <td className="py-2.5 px-4 text-[12.5px] text-gray-700 min-w-[100px]">{tx.date}</td>
      <td className="py-2.5 px-4 text-[12.5px] text-gray-700 font-medium">{tx.type}</td>
      <td className="py-2.5 px-4 text-[12.5px] text-gray-700">{tx.num}</td>
      <td className="py-2.5 px-4 text-[12.5px] text-gray-900 font-semibold">{tx.name}</td>
      <td className="py-2.5 px-4 text-[12.5px] text-gray-600 max-w-[200px] truncate">{tx.memo}</td>
      <td className="py-2.5 px-4 text-[12.5px] text-gray-600">{tx.split}</td>
      <td className="py-2.5 px-4 text-[13px] text-right font-bold text-[#000000] tabular-nums min-w-[110px]">
        {formatCurrency(tx.amount)}
      </td>
      <td className="py-2.5 px-4 text-[13px] text-right font-medium text-[#000000] tabular-nums min-w-[110px]">
        {formatCurrency(tx.balance)}
      </td>
    </tr>
  );
};

const AccountSection = ({ account }: { account: AccountDetail }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <tr
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer bg-gray-50/40 hover:bg-gray-50 transition-colors border-b border-gray-200"
      >
        <td colSpan={6} className="py-3 px-4">
          <div className="flex items-center gap-2 ml-4">
            {isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            <span className="text-[13px] font-black text-gray-900 uppercase tracking-tight">{account.name}</span>
          </div>
        </td>
        <td colSpan={2} />
      </tr>

      {isOpen && account.transactions.map((tx) => (
        <TransactionRow key={tx.id} tx={tx} />
      ))}

      {/* Total for Account */}
      {isOpen && (
        <tr className="bg-gray-50/20 border-b-2 border-gray-100">
          <td colSpan={6} className="py-3 px-4 text-right">
            <span className="text-[12px] font-bold text-gray-500 italic">Total for {account.name}</span>
          </td>
          <td className="py-3 px-4 text-right font-black text-[#000000] text-[13px] tabular-nums border-t border-gray-300">
            {formatCurrency(account.total)}
          </td>
          <td />
        </tr>
      )}
    </>
  );
};

export default function FinancialDetails({ data, title, subtitle }: FinancialDetailsProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 p-10">
      <div className="max-w-6xl mx-auto bg-white shadow-2xl border border-gray-100 min-h-[1000px] flex flex-col">
        {/* Detail Header */}
        <div className="flex flex-col items-center py-12 border-b border-gray-100 mb-8 relative">
          <div className="absolute top-0 left-0 w-24 h-1.5 bg-gray-900" />
          <h1 className="text-[22px] font-black text-gray-900 uppercase tracking-tighter mb-1">Sage Healthy RCM, LLC</h1>
          <h2 className="text-[18px] font-medium text-gray-600 mb-2">{title} Detail</h2>
          <div className="flex items-center gap-3 text-[11px] text-gray-400 font-bold uppercase tracking-[0.25em] bg-gray-50 px-5 py-2 rounded-full border border-gray-100 shadow-sm">
            <span>{subtitle}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <span>Detailed Basis</span>
          </div>
        </div>

        {/* Action Toolbar Inside Context */}
        <div className="px-8 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Transactions Found:</span>
            <span className="text-[12px] font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
              {data.groups.reduce((acc, g) => acc + g.accounts.reduce((a, acco) => a + acco.transactions.length, 0), 0)}
            </span>
          </div>
          <button className="text-[11px] font-black text-primary hover:underline uppercase tracking-widest">Expand All Groups</button>
        </div>

        <div className="flex-1 overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-900 text-white shadow-lg">
              <tr>
                <th className="py-4 px-4 text-left text-[11px] font-black uppercase tracking-widest min-w-[100px]">Date</th>
                <th className="py-4 px-4 text-left text-[11px] font-black uppercase tracking-widest">Type</th>
                <th className="py-4 px-4 text-left text-[11px] font-black uppercase tracking-widest">Num</th>
                <th className="py-4 px-4 text-left text-[11px] font-black uppercase tracking-widest">Name</th>
                <th className="py-4 px-4 text-left text-[11px] font-black uppercase tracking-widest">Memo</th>
                <th className="py-4 px-4 text-left text-[11px] font-black uppercase tracking-widest">Split</th>
                <th className="py-4 px-4 text-right text-[11px] font-black uppercase tracking-widest">Amount</th>
                <th className="py-4 px-4 text-right text-[11px] font-black uppercase tracking-widest">Balance</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {data.groups.map((group) => (
                <Fragment key={group.id}>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <td colSpan={8} className="py-4 px-6">
                      <span className="text-[14px] font-black text-gray-900 uppercase tracking-tighter">{group.name}</span>
                    </td>
                  </tr>
                  {group.accounts.map((account) => (
                    <AccountSection key={account.id} account={account} />
                  ))}
                  {/* Total for Group */}
                  <tr className="bg-gray-200/50 border-b-2 border-gray-900 mt-2">
                    <td colSpan={6} className="py-4 px-6 text-right">
                      <span className="text-[13px] font-black text-gray-900 uppercase">Total for {group.name}</span>
                    </td>
                    <td className="py-4 px-4 text-right font-black text-[#000000] text-[15px] tabular-nums">
                      {formatCurrency(group.total)}
                    </td>
                    <td />
                  </tr>
                </Fragment>
              ))}

              {/* Grand Total / Net Income */}
              {/* <tr className="bg-gray-900 text-white">
                <td colSpan={6} className="py-5 px-6 text-right">
                  <span className="text-[14px] font-black uppercase tracking-widest">Net Income / Total Change</span>
                </td>
                <td className="py-5 px-4 text-right font-black text-white text-[18px] tabular-nums">
                  {formatCurrency(data.grandTotal)}
                </td>
                <td />
              </tr> */}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-10 text-center bg-gray-50 border-t border-gray-100 mt-auto">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-4">AccountHub Financial Intelligence Engine</p>
          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-gray-400 uppercase tracking-widest">Audit Trail Status</span>
              <span className="text-[10px] font-black text-green-600 uppercase">Verified</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-gray-400 uppercase tracking-widest">Data Source</span>
              <span className="text-[10px] font-black text-gray-700 uppercase">Quickbooks Online API</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
