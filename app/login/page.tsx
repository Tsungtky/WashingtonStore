"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PAGE_BG = { background: "linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%)" };
const GLASS = { background: "rgba(255,255,255,0.93)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" };
const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-3 text-gray-900 bg-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-slate-400 text-sm";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "ログインに失敗しました");
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={PAGE_BG}>
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle, #6ee7b7, transparent)" }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-25 pointer-events-none" style={{ background: "radial-gradient(circle, #fcd34d, transparent)" }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 text-3xl"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.25)" }}>
            🏪
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight" style={{ textShadow: "0 0 40px rgba(110,231,183,0.4)" }}>
            Washington POS
          </h1>
          <p className="text-white/50 text-sm mt-1">スタッフログイン</p>
        </div>

        <div className="rounded-2xl p-7" style={GLASS}>
          <h2 className="text-lg font-bold text-slate-800 mb-5">ログイン</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-700 flex items-center gap-2" style={{ background: "rgba(254,226,226,0.9)", border: "1px solid rgba(252,165,165,0.5)" }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">メールアドレス</label>
              <input className={inputCls} type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">パスワード</label>
              <input className={inputCls} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition disabled:opacity-50 shadow-xl shadow-emerald-500/30 mt-1"
              style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-4">
            管理者にアカウントを作成してもらってください
          </p>
        </div>
      </div>
    </div>
  );
}
