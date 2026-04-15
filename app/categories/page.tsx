"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Category = { id: number; name: string; parentId: null; children: { id: number; name: string }[] };

const PAGE_BG = { background: "linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%)" };
const GLASS = { background: "rgba(255,255,255,0.93)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" };
const inputCls = "border border-slate-200 rounded-xl px-3 py-2 text-gray-900 bg-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-slate-400 text-sm w-full";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newParent, setNewParent] = useState("");
  const [newChild, setNewChild] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [confirmState, setConfirmState] = useState<{ message: string; onOk: () => void } | null>(null);

  const load = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
    if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
  };

  useEffect(() => { load(); }, []);

  const selected = categories.find(c => c.id === selectedId) ?? null;

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParent.trim()) return;
    await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newParent.trim() }) });
    setNewParent("");
    load();
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChild.trim() || !selectedId) return;
    await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newChild.trim(), parentId: selectedId }) });
    setNewChild("");
    load();
  };

  const handleEdit = async (id: number) => {
    if (!editName.trim()) return;
    await fetch(`/api/categories/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editName }) });
    setEditId(null);
    setEditName("");
    load();
  };

  const handleDelete = (id: number, name: string) => {
    setConfirmState({ message: `「${name}」を削除しますか？`, onOk: async () => {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) { const data = await res.json(); setError(data.error); return; }
      setError("");
      if (id === selectedId) setSelectedId(null);
      load();
    }});
  };

  return (
    <div className="min-h-screen p-4 relative overflow-hidden" style={PAGE_BG}>
      <div className="absolute top-[-10%] right-[-5%] w-80 h-80 rounded-full blur-[100px] opacity-25 pointer-events-none" style={{ background: "radial-gradient(circle, #fcd34d, transparent)" }} />
      <div className="absolute bottom-[-5%] left-[-5%] w-72 h-72 rounded-full blur-[80px] opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #6ee7b7, transparent)" }} />

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>🗂️ カテゴリ管理</h1>
          <Link href="/" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition hover:scale-105 active:scale-95" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 4px 15px rgba(0,0,0,0.15)" }}>🏠 ホーム</Link>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between" style={{ background: "rgba(254,226,226,0.9)", border: "1px solid rgba(252,165,165,0.5)" }}>
            <span className="text-red-700 text-sm">⚠️ {error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 ml-3">✕</button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* 左：大分類 */}
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl p-4" style={GLASS}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">大分類を追加</p>
              <form onSubmit={handleAddParent} className="flex flex-col gap-2">
                <input className={inputCls} placeholder="大分類名" value={newParent} onChange={e => setNewParent(e.target.value)} required />
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl font-semibold text-sm transition shadow-lg shadow-emerald-500/30">追加</button>
              </form>
            </div>

            <div className="rounded-2xl overflow-hidden" style={GLASS}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-4 pt-4 pb-2">大分類</p>
              {categories.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">なし</p>
              ) : categories.map(c => (
                <div key={c.id}
                  onClick={() => { setSelectedId(c.id); setEditId(null); }}
                  className={`flex items-center gap-2 px-4 py-3 border-b border-slate-100 last:border-0 cursor-pointer transition ${selectedId === c.id ? "bg-emerald-50" : "hover:bg-slate-50"}`}
                >
                  {editId === c.id ? (
                    <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                      <input className={inputCls} value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                      <button onClick={() => handleEdit(c.id)} className="text-emerald-600 text-xs font-semibold shrink-0">保存</button>
                      <button onClick={() => setEditId(null)} className="text-slate-400 text-xs shrink-0">✕</button>
                    </div>
                  ) : (
                    <>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${selectedId === c.id ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span className={`flex-1 text-sm font-medium ${selectedId === c.id ? "text-emerald-700" : "text-slate-700"}`}>{c.name}</span>
                      <span className="text-xs text-slate-400">{c.children.length}</span>
                      <button onClick={e => { e.stopPropagation(); setEditId(c.id); setEditName(c.name); }} className="text-xs text-teal-600 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-1 rounded-lg transition">編集</button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(c.id, c.name); }} className="text-xs text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-lg transition">削除</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 右：小分類 */}
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl p-4" style={GLASS}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">小分類を追加</p>
              <p className="text-xs text-slate-400 mb-3">{selected ? `→ ${selected.name}` : "大分類を選択してください"}</p>
              <form onSubmit={handleAddChild} className="flex flex-col gap-2">
                <input className={inputCls} placeholder="小分類名" value={newChild} onChange={e => setNewChild(e.target.value)} disabled={!selectedId} required />
                <button type="submit" disabled={!selectedId} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white py-2 rounded-xl font-semibold text-sm transition shadow-lg shadow-emerald-500/30">追加</button>
              </form>
            </div>

            <div className="rounded-2xl overflow-hidden" style={GLASS}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-4 pt-4 pb-2">
                {selected ? `${selected.name} の小分類` : "小分類"}
              </p>
              {!selected ? (
                <p className="text-center text-slate-400 py-8 text-sm">大分類を選択してください</p>
              ) : selected.children.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">小分類がありません</p>
              ) : selected.children.map(c => (
                <div key={c.id} className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                  {editId === c.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input className={inputCls} value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                      <button onClick={() => handleEdit(c.id)} className="text-emerald-600 text-xs font-semibold shrink-0">保存</button>
                      <button onClick={() => setEditId(null)} className="text-slate-400 text-xs shrink-0">✕</button>
                    </div>
                  ) : (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 ml-1" />
                      <span className="flex-1 text-sm text-slate-700">{c.name}</span>
                      <button onClick={() => { setEditId(c.id); setEditName(c.name); }} className="text-xs text-teal-600 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-1 rounded-lg transition">編集</button>
                      <button onClick={() => handleDelete(c.id, c.name)} className="text-xs text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-lg transition">削除</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
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
