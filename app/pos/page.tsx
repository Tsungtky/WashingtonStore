"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Product = { id: number; name: string; price: number; stock: number; barcode: string; imageUrl: string | null };
type CartItem = Product & { quantity: number };

const PAGE_BG = { background: "linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%)" };
const GLASS = { background: "rgba(255,255,255,0.93)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" };

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("pos_cart") || "[]"); } catch { return []; }
  });
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { localStorage.setItem("pos_cart", JSON.stringify(cart)); }, [cart]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!barcode.trim()) return;
    const res = await fetch(`/api/scan?barcode=${barcode.trim()}`);
    if (!res.ok) { setError("商品が見つかりません: " + barcode); setBarcode(""); inputRef.current?.focus(); return; }
    const product: Product = await res.json();
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
    setBarcode("");
    inputRef.current?.focus();
  };

  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.id !== id));
    else setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleCheckout = async () => {
    setLoading(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.map(i => ({ productId: i.id, quantity: i.quantity, unitPrice: i.price })) }),
    });
    setLoading(false);
    setShowConfirm(false);
    if (!res.ok) { const data = await res.json(); setError(data.error || "会計に失敗しました"); return; }
    localStorage.removeItem("pos_cart");
    setCart([]);
  };

  return (
    <div className="min-h-screen p-4 relative overflow-hidden" style={PAGE_BG}>
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full blur-[100px] opacity-25 pointer-events-none" style={{ background: "radial-gradient(circle, #6ee7b7, transparent)" }} />
      <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 rounded-full blur-[80px] opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #fcd34d, transparent)" }} />

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>🛒 レジ</h1>
          <Link href="/" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition hover:scale-105 active:scale-95" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 4px 15px rgba(0,0,0,0.15)" }}>🏠 ホーム</Link>
        </div>

        <form onSubmit={handleScan} className="rounded-2xl p-4 mb-3 flex gap-3" style={GLASS}>
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            placeholder="バーコードをスキャン / 入力..."
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-base text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white/70 placeholder-slate-400"
          />
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold transition text-sm shadow-lg shadow-emerald-500/30">追加</button>
        </form>

        {error && (
          <div className="rounded-xl px-4 py-3 mb-3 flex items-center justify-between" style={{ background: "rgba(254,226,226,0.9)", border: "1px solid rgba(252,165,165,0.5)" }}>
            <span className="text-red-700 text-sm">⚠️ {error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 ml-3">✕</button>
          </div>
        )}

        <div className="rounded-2xl overflow-hidden mb-4" style={GLASS}>
          {cart.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-4xl mb-3">📷</p>
              <p className="text-sm">商品をスキャンしてください</p>
            </div>
          ) : (
            <table className="w-full text-base">
              <thead className="border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 w-14"></th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">商品名</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">単価</th>
                  <th className="text-center px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">数量</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">小計</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.id} className="border-t border-slate-100 hover:bg-emerald-50/50 transition">
                    <td className="px-4 py-3">
                      {item.imageUrl ? (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200">
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl">📦</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 text-right text-slate-500">¥{item.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-slate-600 transition">−</button>
                        <span className="w-8 text-center font-bold text-slate-800">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-slate-600 transition">+</button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">¥{(item.price * item.quantity).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => updateQty(item.id, 0)} className="text-red-400 hover:text-red-600 transition text-lg">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-2xl p-5 flex items-center justify-between" style={GLASS}>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">合計金額</p>
            <p className="text-4xl font-bold text-slate-900">¥{total.toLocaleString()}</p>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={cart.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white px-10 py-4 rounded-xl text-lg font-bold transition shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50"
          >
            会計する
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl w-full max-w-sm p-6" style={GLASS}>
            <h2 className="text-lg font-bold text-slate-800 mb-1">お会計の確認</h2>
            <p className="text-slate-500 text-sm mb-5">以下の内容でお会計しますか？</p>
            <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  {item.imageUrl ? (
                    <div className="relative w-8 h-8 rounded overflow-hidden border border-slate-200 shrink-0">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-sm shrink-0">📦</div>
                  )}
                  <span className="text-slate-700 flex-1">{item.name} × {item.quantity}</span>
                  <span className="font-semibold text-slate-800">¥{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-base">
                <span className="text-slate-800">合計</span>
                <span className="text-emerald-600">¥{total.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCheckout} disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition disabled:opacity-50 shadow-lg shadow-emerald-500/30">
                {loading ? "処理中..." : "確定する"}
              </button>
              <button onClick={() => setShowConfirm(false)} disabled={loading} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition">
                戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
