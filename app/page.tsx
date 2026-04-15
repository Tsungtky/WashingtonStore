"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const cards = [
  { href: "/pos",          icon: "🛒", label: "レジ",        gradient: "from-amber-300/35 to-yellow-400/20",    border: "border-amber-300/50",     shadow: "hover:shadow-amber-300/30" },
  { href: "/products",     icon: "📦", label: "商品管理",    gradient: "from-sky-400/30 to-cyan-300/20",        border: "border-sky-300/50",       shadow: "hover:shadow-sky-400/30" },
  { href: "/transactions", icon: "📊", label: "売上履歴",    gradient: "from-rose-400/30 to-pink-300/20",       border: "border-rose-300/50",      shadow: "hover:shadow-rose-400/30" },
  { href: "/categories",   icon: "🗂️", label: "カテゴリ管理", gradient: "from-violet-400/30 to-purple-300/20",   border: "border-violet-300/50",    shadow: "hover:shadow-violet-400/30" },
];

export default function Home() {
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(data => {
      if (!data.error) setUser(data);
    });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%)" }}
    >
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle, #6ee7b7, transparent)" }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-25 pointer-events-none" style={{ background: "radial-gradient(circle, #fcd34d, transparent)" }} />
      <div className="absolute top-[35%] right-[15%] w-[300px] h-[300px] rounded-full blur-[80px] opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #5eead4, transparent)" }} />

      {/* User bar */}
      {user && (
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
          <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white/90 hover:text-white transition" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <span className="w-6 h-6 rounded-full bg-emerald-400/40 flex items-center justify-center text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
            {user.name}
          </Link>
          <button onClick={handleLogout} className="px-3 py-2 rounded-xl text-sm font-semibold text-white/60 hover:text-white transition" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            ログアウト
          </button>
        </div>
      )}

      <div className="text-center mb-12 z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 text-3xl"
          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.25)" }}>
          🏪
        </div>
        <h1 className="text-5xl font-bold text-white tracking-tight mb-2" style={{ textShadow: "0 0 60px rgba(110,231,183,0.4)" }}>
          Washington POS
        </h1>
        <p className="text-white/50 text-sm tracking-[0.2em] uppercase">雑貨店管理システム</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs z-10">
        {cards.map(c => (
          <Link key={c.href} href={c.href}
            className={`relative flex flex-col items-center justify-center gap-3 p-7 rounded-2xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl ${c.shadow} border ${c.border}`}
            style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
          >
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${c.gradient} opacity-100`} />
            <span className="relative text-4xl drop-shadow">{c.icon}</span>
            <span className="relative text-sm text-white/90 font-semibold">{c.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
