"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PAGE_BG = { background: "linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%)" };
const GLASS = { background: "rgba(255,255,255,0.93)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" };
const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-3 text-gray-900 bg-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-slate-400 text-sm";

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: number; name: string; email: string | null } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(data => {
      if (data.error) { router.push("/login"); return; }
      setUser(data);
      setName(data.name);
      setEmail(data.email || "");
    });
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setError("新しいパスワードが一致しません"); return;
    }
    setSaving(true); setError(""); setSuccess("");
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined }),
    });
    setSaving(false);
    if (!res.ok) { setError((await res.json()).error || "更新に失敗しました"); return; }
    const updated = await res.json();
    setUser(updated);
    setName(updated.name);
    setEmail(updated.email || "");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setSuccess("プロフィールを更新しました");
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen p-4 relative overflow-hidden" style={PAGE_BG}>
      <div className="absolute top-[-10%] right-[-5%] w-80 h-80 rounded-full blur-[100px] opacity-25 pointer-events-none" style={{ background: "radial-gradient(circle, #6ee7b7, transparent)" }} />
      <div className="absolute bottom-[-5%] left-[-5%] w-72 h-72 rounded-full blur-[80px] opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #fcd34d, transparent)" }} />

      <div className="max-w-lg mx-auto relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>👤 プロフィール</h1>
          <Link href="/" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition hover:scale-105 active:scale-95" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 4px 15px rgba(0,0,0,0.15)" }}>🏠 ホーム</Link>
        </div>

        {/* User info card */}
        <div className="rounded-2xl p-5 mb-4 flex items-center gap-4" style={GLASS}>
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700 shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-lg">{user.name}</p>
            <p className="text-sm text-slate-400">スタッフ ID: {user.id}</p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-400 transition"
          >
            ログアウト
          </button>
        </div>

        {/* Edit form */}
        <div className="rounded-2xl p-6" style={GLASS}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">プロフィール編集</p>

          {success && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-emerald-700 flex items-center gap-2" style={{ background: "rgba(209,250,229,0.9)", border: "1px solid rgba(110,231,183,0.5)" }}>
              ✓ {success}
            </div>
          )}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-700 flex items-center gap-2" style={{ background: "rgba(254,226,226,0.9)", border: "1px solid rgba(252,165,165,0.5)" }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">表示名</label>
              <input className={inputCls} value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">メールアドレス（ログインID）</label>
              <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">パスワード変更（任意）</p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">現在のパスワード</label>
                  <input className={inputCls} type="password" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">新しいパスワード</label>
                  <input className={inputCls} type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">新しいパスワード（確認）</label>
                  <input className={inputCls} type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition disabled:opacity-50 shadow-lg shadow-emerald-500/25 mt-1"
              style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
            >
              {saving ? "保存中..." : "保存する"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
