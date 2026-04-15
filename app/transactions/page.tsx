"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type TransactionItem = { id: number; quantity: number; unitPrice: number; product: { name: string } };
type Transaction = { id: number; total: number; createdAt: string; items: TransactionItem[]; user: { id: number; name: string } | null };

const PAGE_BG = { background: "linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%)" };
const GLASS = { background: "rgba(255,255,255,0.93)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" };

function fmt(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }

function TransactionsContent() {
  const now = new Date();
  const thisMonth = fmt(now);
  const [tab, setTab] = useState<"current" | "search">("current");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchMonth, setSearchMonth] = useState(thisMonth);
  const [open, setOpen] = useState<number | null>(null);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");

  const fetchTransactions = useCallback(async (month?: string) => {
    const url = month ? `/api/transactions?month=${month}` : "/api/transactions";
    const data = await fetch(url).then(r => r.json());
    setTransactions(data);
  }, []);

  useEffect(() => { if (tab === "current") fetchTransactions(); }, [tab, fetchTransactions]);
  useEffect(() => { if (highlight) setOpen(Number(highlight)); }, [highlight]);

  const todayTotal = transactions.filter(t => new Date(t.createdAt).toDateString() === now.toDateString()).reduce((s, t) => s + t.total, 0);
  const todayCount = transactions.filter(t => new Date(t.createdAt).toDateString() === now.toDateString()).length;
  const monthTotal = transactions.reduce((s, t) => s + t.total, 0);

  const saveEdit = async (txId: number) => {
    setSaving(true); setError("");
    const res = await fetch(`/api/transactions/${txId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: editItemId, newQuantity: editQty }) });
    setSaving(false);
    if (!res.ok) { setError((await res.json()).error || "更新に失敗しました"); return; }
    const updated: Transaction = await res.json();
    setTransactions(prev => prev.map(t => t.id === txId ? updated : t));
    setEditItemId(null);
  };

  const TxList = ({ list }: { list: Transaction[] }) => (
    <div className="flex flex-col gap-3">
      {list.length === 0 ? (
        <div className="rounded-2xl text-center py-16 text-slate-400" style={GLASS}>
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">取引がありません</p>
        </div>
      ) : list.map(t => {
        const isOpen = open === t.id;
        const isHighlight = t.id === Number(highlight);
        return (
          <div
            key={t.id}
            className="rounded-2xl overflow-hidden transition-all duration-200"
            style={{
              ...GLASS,
              ...(isOpen ? { boxShadow: "0 24px 64px rgba(5,150,105,0.2)", border: "1px solid rgba(52,211,153,0.5)" } : {}),
              ...(isHighlight && !isOpen ? { border: "1px solid rgba(52,211,153,0.4)" } : {}),
            }}
          >
            {/* Row header */}
            <button
              onClick={() => { setOpen(isOpen ? null : t.id); setEditItemId(null); setError(""); }}
              className="w-full flex items-center justify-between px-6 py-5 transition hover:bg-emerald-50/40"
            >
              <div className="flex items-center gap-3 text-left">
                <div className={`w-2 h-8 rounded-full shrink-0 ${isOpen ? "bg-emerald-500" : "bg-slate-200"}`} />
                <div>
                  <p className="font-bold text-slate-800 text-base">
                    伝票 #{String(t.id).padStart(3, "0")}
                    {isHighlight && (
                      <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">最新</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-slate-400">{new Date(t.createdAt).toLocaleString("ja-JP")}</p>
                    {t.user && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                        {t.user.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-bold text-lg text-slate-900">¥{t.total.toLocaleString()}</p>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${isOpen ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                  {isOpen ? "▲" : "▼"}
                </div>
              </div>
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div className="px-6 pb-6 border-t border-emerald-100" style={{ background: "rgba(236,253,245,0.5)" }}>
                {error && (
                  <div className="mt-4 rounded-xl px-4 py-3 flex items-center justify-between text-sm" style={{ background: "rgba(254,226,226,0.9)", border: "1px solid rgba(252,165,165,0.5)" }}>
                    <span className="text-red-700">⚠️ {error}</span>
                    <button onClick={() => setError("")} className="ml-2 text-red-400 hover:text-red-600">✕</button>
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2">
                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_80px_100px_90px_140px] gap-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide pb-1 border-b border-emerald-200">
                    <span>商品名</span>
                    <span className="text-right">単価</span>
                    <span className="text-center">数量</span>
                    <span className="text-right">小計</span>
                    <span></span>
                  </div>

                  {/* Items */}
                  {t.items.map(item => {
                    const isEditing = editItemId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`grid grid-cols-[1fr_80px_100px_90px_140px] gap-2 items-center px-3 py-3 rounded-xl transition ${isEditing ? "bg-amber-50 ring-2 ring-amber-300" : "hover:bg-white/70"}`}
                      >
                        <span className="font-semibold text-slate-800 text-base">{item.product.name}</span>
                        <span className="text-right text-slate-500 text-sm">¥{item.unitPrice.toLocaleString()}</span>
                        <span className="text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => setEditQty(q => Math.max(0, q - 1))} className="w-7 h-7 rounded-full bg-amber-200 hover:bg-amber-300 font-bold text-amber-800 text-sm transition">−</button>
                              <span className="w-8 text-center font-bold text-slate-900 text-base">{editQty}</span>
                              <button onClick={() => setEditQty(q => q + 1)} className="w-7 h-7 rounded-full bg-amber-200 hover:bg-amber-300 font-bold text-amber-800 text-sm transition">+</button>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-700 text-base">{item.quantity}</span>
                          )}
                        </span>
                        <span className="text-right font-bold text-slate-800 text-base">
                          ¥{(item.unitPrice * (isEditing ? editQty : item.quantity)).toLocaleString()}
                        </span>
                        <span className="flex flex-row gap-2 justify-end items-center">
                          {isEditing ? (
                            <>
                              <button onClick={() => saveEdit(t.id)} disabled={saving} className="text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 px-3 py-1.5 rounded-lg shadow-sm transition whitespace-nowrap">{saving ? "..." : "保存"}</button>
                              <button onClick={() => setEditItemId(null)} className="text-sm font-semibold text-slate-500 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg transition whitespace-nowrap">取消</button>
                            </>
                          ) : (
                            <button onClick={() => { setEditItemId(item.id); setEditQty(item.quantity); setError(""); }} className="text-sm font-semibold text-teal-600 hover:text-teal-800 px-3 py-1.5 rounded-lg hover:bg-teal-50 border border-teal-200 hover:border-teal-400 transition whitespace-nowrap">編集</button>
                          )}
                        </span>
                      </div>
                    );
                  })}

                  {/* Total */}
                  <div className="flex justify-between items-center px-3 pt-3 mt-1 border-t-2 border-emerald-200">
                    <span className="text-sm font-bold text-slate-500">合計</span>
                    <span className="text-xl font-bold text-slate-900">¥{t.total.toLocaleString()}</span>
                  </div>
                </div>

                {editQty === 0 && editItemId !== null && (
                  <p className="text-sm text-amber-600 mt-3 px-3">※ 数量を0にすると、この商品が注文から削除されます</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen p-4 relative overflow-hidden" style={PAGE_BG}>
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full blur-[100px] opacity-25 pointer-events-none" style={{ background: "radial-gradient(circle, #fcd34d, transparent)" }} />
      <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 rounded-full blur-[80px] opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #6ee7b7, transparent)" }} />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>📊 売上履歴</h1>
          <Link href="/" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition hover:scale-105 active:scale-95" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 4px 15px rgba(0,0,0,0.15)" }}>🏠 ホーム</Link>
        </div>

        <div className="flex gap-2 mb-5">
          {(["current", "search"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${tab === t ? "text-white shadow-lg shadow-emerald-500/30" : "text-white/60 hover:text-white"}`}
              style={tab === t ? { background: "rgba(5,150,105,0.85)", backdropFilter: "blur(10px)", border: "1px solid rgba(52,211,153,0.4)" } : { background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              {t === "current" ? "今月" : "月別検索"}
            </button>
          ))}
        </div>

        {tab === "current" && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { label: "本日の売上", value: `¥${todayTotal.toLocaleString()}` },
                { label: "本日の取引数", value: `${todayCount} 件` },
                { label: "今月の売上", value: `¥${monthTotal.toLocaleString()}` },
              ].map(card => (
                <div key={card.label} className="rounded-2xl p-5" style={GLASS}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                </div>
              ))}
            </div>
            <TxList list={transactions} />
          </>
        )}

        {tab === "search" && (
          <>
            <div className="rounded-2xl p-5 mb-5" style={GLASS}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">月を選択</p>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Year select */}
                <div className="relative">
                  <select
                    value={searchMonth.slice(0, 4)}
                    onChange={e => setSearchMonth(`${e.target.value}-${searchMonth.slice(5, 7)}`)}
                    className="appearance-none pl-4 pr-8 py-2.5 rounded-xl text-sm font-bold text-slate-800 border-2 border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 hover:border-emerald-300 transition cursor-pointer"
                  >
                    {Array.from({ length: 4 }, (_, i) => now.getFullYear() - i).map(y => (
                      <option key={y} value={y}>{y}年</option>
                    ))}
                  </select>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▾</span>
                </div>

                {/* Month select */}
                <div className="relative">
                  <select
                    value={searchMonth.slice(5, 7)}
                    onChange={e => setSearchMonth(`${searchMonth.slice(0, 4)}-${e.target.value}`)}
                    className="appearance-none pl-4 pr-8 py-2.5 rounded-xl text-sm font-bold text-slate-800 border-2 border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 hover:border-emerald-300 transition cursor-pointer"
                  >
                    {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
                      <option key={m} value={m} disabled={`${searchMonth.slice(0,4)}-${m}` > thisMonth}>
                        {parseInt(m)}月
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▾</span>
                </div>

                <button
                  onClick={() => fetchTransactions(searchMonth)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-lg shadow-emerald-500/30"
                >
                  🔍 検索
                </button>

                {transactions.length > 0 && (
                  <span className="ml-auto text-sm text-slate-500">
                    合計 <span className="font-bold text-slate-800">¥{monthTotal.toLocaleString()}</span>（{transactions.length}件）
                  </span>
                )}
              </div>
            </div>
            <TxList list={transactions} />
          </>
        )}
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  return <Suspense><TransactionsContent /></Suspense>;
}
