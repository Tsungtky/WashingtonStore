"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Category = { id: number; name: string };

const PAGE_BG = { background: "linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%)" };
const GLASS = { background: "rgba(255,255,255,0.93)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" };

const inputCls = "border border-slate-200 rounded-xl px-3 py-2 text-gray-900 bg-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-slate-400 text-sm";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [confirmState, setConfirmState] = useState<{ message: string; onOk: () => void } | null>(null);

  const fetch_ = async () => {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
  };

  useEffect(() => { fetch_(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setName("");
    fetch_();
  };

  const handleEdit = async (id: number) => {
    if (!editName.trim()) return;
    await fetch(`/api/categories/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editName }) });
    setEditId(null);
    setEditName("");
    fetch_();
  };

  const handleDelete = (id: number) => {
    setConfirmState({ message: "このカテゴリを削除しますか？", onOk: async () => {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) { const data = await res.json(); setError(data.error); return; }
      setError("");
      fetch_();
    }});
  };

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen p-4 relative overflow-hidden" style={PAGE_BG}>
      <div className="absolute top-[-10%] right-[-5%] w-80 h-80 rounded-full blur-[100px] opacity-25 pointer-events-none" style={{ background: "radial-gradient(circle, #fcd34d, transparent)" }} />
      <div className="absolute bottom-[-5%] left-[-5%] w-72 h-72 rounded-full blur-[80px] opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #6ee7b7, transparent)" }} />

      <div className="max-w-lg mx-auto relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>🗂️ カテゴリ管理</h1>
          <Link href="/" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition hover:scale-105 active:scale-95" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 4px 15px rgba(0,0,0,0.15)" }}>🏠 ホーム</Link>
        </div>

        <div className="rounded-2xl p-5 mb-4" style={GLASS}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">新規追加</p>
          <form onSubmit={handleAdd} className="flex gap-3">
            <input className={`${inputCls} flex-1`} placeholder="カテゴリ名" value={name} onChange={e => setName(e.target.value)} required />
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-semibold text-sm transition shadow-lg shadow-emerald-500/30">追加</button>
          </form>
        </div>

        <div className="mb-3">
          <input
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/50"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)", color: "white" }}
            placeholder="カテゴリ名で検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between" style={{ background: "rgba(254,226,226,0.9)", border: "1px solid rgba(252,165,165,0.5)" }}>
            <span className="text-red-700 text-sm">⚠️ {error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 ml-3">✕</button>
          </div>
        )}

        <div className="rounded-2xl overflow-hidden" style={GLASS}>
          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 py-10 text-sm">{search ? "検索結果がありません" : "カテゴリがありません"}</p>
          ) : (
            filtered.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition">
                {editId === c.id ? (
                  <>
                    <input className={`${inputCls} flex-1`} value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                    <button onClick={() => handleEdit(c.id)} className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold transition">保存</button>
                    <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-600 text-sm transition">キャンセル</button>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="flex-1 text-slate-800 font-medium">{c.name}</span>
                    <button onClick={() => { setEditId(c.id); setEditName(c.name); }} className="text-sm font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 border border-teal-200 hover:border-teal-400 px-3 py-1.5 rounded-lg transition">編集</button>
                    <button onClick={() => handleDelete(c.id)} className="text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition">削除</button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {confirmState && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl p-6 w-full max-w-sm" style={GLASS}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl shrink-0">🗑️</div>
              <h3 className="font-bold text-slate-800 text-base">削除の確認</h3>
            </div>
            <p className="text-slate-500 text-sm mb-5 pl-1">{confirmState.message}</p>
            <div className="flex gap-3">
              <button onClick={() => { confirmState.onOk(); setConfirmState(null); }} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 transition shadow-lg shadow-red-500/25">削除する</button>
              <button onClick={() => setConfirmState(null)} className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition">キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
