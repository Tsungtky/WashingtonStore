"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

type Category = { id: number; name: string; parentId: number | null; children: { id: number; name: string }[] };
type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  barcode: string;
  imageUrl: string | null;
  category: Category | null;
};

const PAGE_BG = { background: "linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%)" };
const GLASS = { background: "rgba(255,255,255,0.93)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" };
const inputCls = "border border-slate-200 rounded-xl px-3 py-2 text-gray-900 bg-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-slate-400 text-sm w-full";

declare global {
  interface Window {
    bwipjs: { toCanvas: (canvas: HTMLCanvasElement, options: Record<string, unknown>) => void };
  }
}

function BarcodeCanvas({ barcode, height = 10 }: { barcode: string; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || !window.bwipjs) return;
    try {
      window.bwipjs.toCanvas(ref.current, { bcid: "code128", text: barcode, scale: 2, height, includetext: false });
    } catch {}
  }, [barcode, height]);
  return <canvas ref={ref} style={{ width: "100%", height: "auto", display: "block" }} />;
}

function ImageUpload({ current, onUploaded, onUploadingChange }: {
  current: string | null;
  onUploaded: (url: string | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [preview, setPreview] = useState<string | null>(current);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    onUploadingChange?.(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "アップロード失敗");
      setPreview(data.url);
      onUploaded(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "不明なエラー");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploaded(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 mb-1 block">商品画像</label>
      {preview ? (
        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 group">
          <Image src={preview} alt="商品画像" fill className="object-cover" />
          <button type="button" onClick={handleRemove} className="absolute inset-0 bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center">削除</button>
        </div>
      ) : (
        <label className={`flex items-center justify-center w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 cursor-pointer hover:border-emerald-400 transition ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <span className="text-slate-400 text-xs text-center">{uploading ? "アップロード中..." : "画像を\n選択"}</span>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
      )}
      {uploadError && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-700" style={{ background: "rgba(254,226,226,0.9)", border: "1px solid rgba(252,165,165,0.5)" }}>
          <span>⚠️ {uploadError}</span>
          <button type="button" onClick={() => setUploadError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", price: "", stock: "", categoryId: "", imageUrl: "" });
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", stock: "", categoryId: "", imageUrl: "" });
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterParentId, setFilterParentId] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [formParentId, setFormParentId] = useState("");
  const [editParentId, setEditParentId] = useState("");
  const [confirmState, setConfirmState] = useState<{ message: string; onOk: () => void } | null>(null);

  // Barcode print state
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [showBarcodePrint, setShowBarcodePrint] = useState(false);
  const [barcodeSelections, setBarcodeSelections] = useState<Map<number, string>>(new Map());
  const [bwipLoaded, setBwipLoaded] = useState(false);
  const [labelWmm, setLabelWmm] = useState("38");
  const [barcodeHmm, setBarcodeHmm] = useState("10");

  const labelPresets = [
    { label: "小型（雑貨）", w: "38", h: "10" },
    { label: "標準（小売）", w: "50", h: "12" },
    { label: "食品・スーパー", w: "63", h: "15" },
    { label: "大型・倉庫", w: "100", h: "20" },
  ];

  const filtered = products.filter(p => {
    const matchName = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    let matchCat = true;
    if (filterCategory) {
      matchCat = String(p.category?.id) === filterCategory;
    } else if (filterParentId) {
      const parent = categories.find(c => String(c.id) === filterParentId);
      const childIds = parent ? parent.children.map(ch => ch.id) : [];
      matchCat = childIds.includes(p.category?.id ?? -1) || String(p.category?.id) === filterParentId;
    }
    return matchName && matchCat;
  });

  const fetchAll = async () => {
    const [p, c] = await Promise.all([fetch("/api/products"), fetch("/api/categories")]);
    setProducts(await p.json());
    setCategories(await c.json());
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (window.bwipjs) { setBwipLoaded(true); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/bwip-js/dist/bwip-js-min.js";
    script.onload = () => setBwipLoaded(true);
    document.head.appendChild(script);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", price: "", stock: "", categoryId: "", imageUrl: "" });
    setLoading(false);
    fetchAll();
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    let parentId = "";
    if (p.category) {
      const parent = categories.find(c => c.children.some(ch => ch.id === p.category!.id));
      if (parent) parentId = String(parent.id);
    }
    setEditParentId(parentId);
    setEditForm({ name: p.name, price: String(p.price), stock: String(p.stock), categoryId: p.category ? String(p.category.id) : "", imageUrl: p.imageUrl || "" });
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    setLoading(true);
    await fetch(`/api/products/${editProduct.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    setEditProduct(null);
    setLoading(false);
    fetchAll();
  };

  const handleDelete = (id: number) => {
    setConfirmState({ message: "この商品を削除しますか？", onOk: async () => {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      fetchAll();
    }});
  };

  const toggleBarcode = (id: number) => {
    setBarcodeSelections(prev => {
      const next = new Map(prev);
      next.has(id) ? next.delete(id) : next.set(id, "1");
      return next;
    });
  };
  const setCopies = (id: number, val: string) => {
    setBarcodeSelections(prev => new Map(prev).set(id, val));
  };
  const getCopies = (id: number) => Math.max(1, parseInt(barcodeSelections.get(id) ?? "1") || 1);
  const selectedForPrint = products.filter(p => barcodeSelections.has(p.id));
  const totalLabels = Array.from(barcodeSelections.entries()).reduce((s, [id]) => s + getCopies(id), 0);

  const handlePrint = () => {
    const labelPx = (Number(labelWmm) || 38) * 3.78;
    const canvases = document.querySelectorAll<HTMLCanvasElement>("#barcode-print-area canvas");
    const dataUrls = Array.from(canvases).map(c => c.toDataURL());

    let idx = 0;
    const labelsHtml = selectedForPrint.flatMap(p =>
      Array.from({ length: getCopies(p.id) }).map(() => {
        const src = dataUrls[idx++] || "";
        return `<div style="width:${labelPx}px;border:1px solid #d1d5db;border-radius:4px;padding:6px;display:flex;flex-direction:column;align-items:center;gap:4px;page-break-inside:avoid;background:white;box-sizing:border-box;">
          <p style="font-size:11px;font-weight:600;text-align:center;margin:0;word-break:break-word;width:100%;">${p.name}</p>
          <img src="${src}" style="width:100%;height:auto;display:block;" />
          <p style="font-size:11px;color:#6b7280;font-family:monospace;margin:0;">${p.barcode}</p>
          <p style="font-size:13px;font-weight:700;margin:0;">¥${p.price.toLocaleString()}</p>
        </div>`;
      })
    ).join("");

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>バーコード印刷</title>
      <style>body{margin:0;padding:8px;}.wrap{display:flex;flex-wrap:wrap;gap:8px;}@media print{body{margin:0;padding:8px;}}</style>
      </head><body><div class="wrap">${labelsHtml}</div></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <>

      <div className="min-h-screen p-4 relative overflow-hidden" style={PAGE_BG}>
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full blur-[100px] opacity-25 pointer-events-none" style={{ background: "radial-gradient(circle, #6ee7b7, transparent)" }} />
        <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 rounded-full blur-[80px] opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #fcd34d, transparent)" }} />

        <div className="max-w-4xl mx-auto relative z-10">

          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-bold text-white" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>📦 商品管理</h1>
            <div className="flex items-center gap-3">
              {barcodeMode ? (
                <>
                  <button
                    onClick={() => { setBarcodeMode(false); setBarcodeSelections(new Map()); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white/80 hover:text-white transition"
                    style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}
                  >
                    ✕ キャンセル
                  </button>
                  <button
                    disabled={barcodeSelections.size === 0}
                    onClick={() => setShowBarcodePrint(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-30 shadow-xl shadow-teal-500/40"
                    style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)", border: "1px solid rgba(94,234,212,0.4)" }}
                  >
                    🖨️ 印刷プレビュー（{totalLabels}枚）
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setBarcodeSelections(new Map()); setBarcodeMode(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition shadow-xl shadow-teal-500/40"
                  style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)", border: "1px solid rgba(94,234,212,0.4)" }}
                >
                  🏷️ バーコード印刷
                </button>
              )}
              <Link href="/" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition hover:scale-105 active:scale-95" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 4px 15px rgba(0,0,0,0.15)" }}>🏠 ホーム</Link>
            </div>
          </div>

          {/* Add form */}
          <div className="rounded-2xl p-5 mb-5" style={GLASS}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">商品を追加</p>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
              <input className={`${inputCls} col-span-2`} placeholder="商品名" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <input className={inputCls} placeholder="価格 (¥)" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
              <input className={inputCls} placeholder="在庫数" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required />
              <select className={`${inputCls} col-span-2`} value={formParentId} onChange={e => { setFormParentId(e.target.value); setForm(f => ({ ...f, categoryId: "" })); }}>
                <option value="">大分類を選択</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className={`${inputCls} col-span-2`} value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">小分類を選択（任意）</option>
                {(formParentId
                  ? (categories.find(c => String(c.id) === formParentId)?.children ?? [])
                  : categories.flatMap(c => c.children)
                ).map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
              </select>
              <div className="col-span-2">
                <ImageUpload current={null} onUploaded={url => setForm(f => ({ ...f, imageUrl: url || "" }))} />
              </div>
              <div className="col-span-2">
                <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-semibold transition text-sm disabled:opacity-50 shadow-lg shadow-emerald-500/20">追加する</button>
              </div>
            </form>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-3 mb-4">
            <input
              className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/50"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)", color: "white" }}
              placeholder="商品名・バーコードで検索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="relative">
              <select
                className="appearance-none rounded-xl pl-4 pr-9 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)", color: "white" }}
                value={filterParentId}
                onChange={e => { setFilterParentId(e.target.value); setFilterCategory(""); }}
              >
                <option value="" style={{ color: "#1e293b", background: "white" }}>すべての大分類</option>
                {categories.map(c => <option key={c.id} value={c.id} style={{ color: "#1e293b", background: "white" }}>{c.name}</option>)}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/70 text-xs">▾</span>
            </div>
            <div className="relative">
              <select
                className="appearance-none rounded-xl pl-4 pr-9 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)", color: "white" }}
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="" style={{ color: "#1e293b", background: "white" }}>すべての小分類</option>
                {(filterParentId
                  ? (categories.find(c => String(c.id) === filterParentId)?.children ?? [])
                  : categories.flatMap(c => c.children)
                ).map(ch => (
                  <option key={ch.id} value={ch.id} style={{ color: "#1e293b", background: "white" }}>{ch.name}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/70 text-xs">▾</span>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={GLASS}>
            <table className="w-full text-base">
              <thead className="border-b border-slate-100">
                <tr>
                  {barcodeMode && <th className="px-3 py-3 w-32 text-slate-500 font-semibold text-xs text-center uppercase tracking-wide">選択 / 枚数</th>}
                  <th className="px-4 py-3 w-14"></th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">商品名</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">カテゴリ</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">価格</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">在庫</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">バーコード</th>
                  {!barcodeMode && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={barcodeMode ? 8 : 7} className="text-center py-12 text-slate-400">{search || filterCategory ? "検索結果がありません" : "商品がありません"}</td></tr>
                )}
                {filtered.map(p => (
                  <tr key={p.id} className={`border-t border-slate-100 transition ${barcodeMode && barcodeSelections.has(p.id) ? "bg-teal-50" : "hover:bg-slate-50/80"}`}>
                    {barcodeMode && (
                      <td className="px-3 py-2 text-center">
                        {barcodeSelections.has(p.id) ? (
                          <div className="flex items-center justify-center gap-1">
                            <input type="checkbox" checked onChange={() => toggleBarcode(p.id)} className="accent-teal-600" />
                            <button onClick={() => setCopies(p.id, String(Math.max(1, getCopies(p.id) - 1)))} className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700">−</button>
                            <input
                              type="number"
                              min={1}
                              value={barcodeSelections.get(p.id) ?? "1"}
                              onChange={e => setCopies(p.id, e.target.value)}
                              onBlur={e => { const n = parseInt(e.target.value); setCopies(p.id, String(isNaN(n) || n < 1 ? 1 : n)); }}
                              className="w-16 text-center text-sm font-bold text-gray-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white py-1"
                            />
                            <button onClick={() => setCopies(p.id, String(getCopies(p.id) + 1))} className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700">+</button>
                          </div>
                        ) : (
                          <input type="checkbox" checked={false} onChange={() => toggleBarcode(p.id)} className="accent-teal-600" />
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {p.imageUrl ? (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200">
                          <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 text-xl">📦</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 text-base">{p.name}</td>
                    <td className="px-4 py-3 text-slate-500 text-sm">{p.category?.name || "—"}</td>
                    <td className="px-4 py-3 text-right text-slate-800 font-medium text-base">¥{p.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold text-base ${p.stock <= 5 ? "text-red-500" : "text-slate-800"}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm font-mono">{p.barcode}</td>
                    {!barcodeMode && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => openEdit(p)} className="text-sm font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 border border-teal-200 hover:border-teal-400 px-3 py-1.5 rounded-lg transition">編集</button>
                          <button onClick={() => handleDelete(p.id)} className="text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition">削除</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editProduct && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={e => { if (e.target === e.currentTarget) setEditProduct(null); }}>
          <div className="rounded-2xl w-full max-w-md p-6" style={GLASS}>
            <h2 className="text-lg font-bold text-slate-800 mb-5">✏️ 商品を編集</h2>
            <form onSubmit={handleEditSave} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">商品名</label>
                <input className={inputCls} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">価格 (¥)</label>
                  <input className={inputCls} type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">在庫数</label>
                  <input className={inputCls} type="number" value={editForm.stock} onChange={e => setEditForm({ ...editForm, stock: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">カテゴリ</label>
                <select className={inputCls} value={editParentId} onChange={e => { setEditParentId(e.target.value); setEditForm(f => ({ ...f, categoryId: "" })); }}>
                  <option value="">大分類を選択</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className={`${inputCls} mt-2`} value={editForm.categoryId} onChange={e => setEditForm({ ...editForm, categoryId: e.target.value })}>
                  <option value="">小分類を選択（任意）</option>
                  {(editParentId
                    ? (categories.find(c => String(c.id) === editParentId)?.children ?? [])
                    : categories.flatMap(c => c.children)
                  ).map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                </select>
              </div>
              <ImageUpload current={editForm.imageUrl || null} onUploaded={url => setEditForm(f => ({ ...f, imageUrl: url || "" }))} onUploadingChange={setImageUploading} />
              {imageUploading && <p className="text-xs text-emerald-600 animate-pulse">画像をアップロード中... 完了まで待ってください</p>}
              <div className="flex gap-3 mt-2">
                <button type="submit" disabled={loading || imageUploading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-semibold transition text-sm disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                  {imageUploading ? "アップロード中..." : "保存する"}
                </button>
                <button type="button" onClick={() => setEditProduct(null)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm transition">キャンセル</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Print Modal */}
      {showBarcodePrint && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl w-full max-w-3xl flex flex-col" style={{ ...GLASS, maxHeight: "90vh" }}>
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">🖨️ 印刷プレビュー</h2>
                <div className="flex gap-3">
                  <button onClick={() => setShowBarcodePrint(false)} className="text-sm text-slate-500 hover:text-slate-700 font-medium">← 戻る</button>
                  <button onClick={handlePrint} className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2 rounded-xl font-semibold text-sm transition shadow-lg shadow-teal-500/30">印刷する</button>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {/* Presets */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">プリセット</span>
                  {labelPresets.map(p => {
                    const active = labelWmm === p.w && barcodeHmm === p.h;
                    return (
                      <button
                        key={p.label}
                        onClick={() => { setLabelWmm(p.w); setBarcodeHmm(p.h); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${active ? "bg-teal-600 text-white border-teal-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-600"}`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
                {/* Manual inputs */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">ラベル幅</label>
                    <input
                      type="number" min={20} max={150} value={labelWmm}
                      onChange={e => setLabelWmm(e.target.value)}
                      className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 text-center"
                    />
                    <span className="text-xs text-slate-400">mm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">バーコード高さ</label>
                    <input
                      type="number" min={4} max={50} value={barcodeHmm}
                      onChange={e => setBarcodeHmm(e.target.value)}
                      className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 text-center"
                    />
                    <span className="text-xs text-slate-400">mm</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="flex flex-wrap gap-3">
                {bwipLoaded && selectedForPrint.map(p =>
                  Array.from({ length: getCopies(p.id) }).map((_, i) => (
                    <div key={`${p.id}-${i}`} className="border border-gray-300 rounded p-2 flex flex-col items-center gap-1 bg-white" style={{ width: (Number(labelWmm) || 38) * 3.78, breakInside: "avoid" }}>
                      <p className="text-xs font-semibold text-center text-gray-900 leading-tight w-full break-words">{p.name}</p>
                      <BarcodeCanvas barcode={p.barcode} height={Number(barcodeHmm) || 10} />
                      <p className="text-xs text-gray-500 font-mono">{p.barcode}</p>
                      <p className="text-sm font-bold text-gray-900">¥{p.price.toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
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

      {/* Print-only area — outside all modals, hidden on screen */}
      <div id="barcode-print-area" style={{ display: "none" }}>
        {bwipLoaded && selectedForPrint.map(p =>
          Array.from({ length: getCopies(p.id) }).map((_, i) => (
            <div key={`${p.id}-${i}`} className="border border-gray-300 rounded p-2 flex flex-col items-center gap-1 bg-white" style={{ width: (Number(labelWmm) || 38) * 3.78, breakInside: "avoid" }}>
              <p className="text-xs font-semibold text-center text-gray-900 leading-tight w-full break-words">{p.name}</p>
              <BarcodeCanvas barcode={p.barcode} height={Number(barcodeHmm) || 10} />
              <p className="text-xs text-gray-500 font-mono">{p.barcode}</p>
              <p className="text-sm font-bold text-gray-900">¥{p.price.toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}
