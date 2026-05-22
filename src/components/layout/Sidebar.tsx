"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { href: "/dashboard",  label: "Dashboard",  icon: "⬛" },
  { href: "/orders",     label: "Orders",     icon: "📋" },
  { href: "/products",   label: "Products",   icon: "🍪" },
  { href: "/inventory",  label: "Inventory",  icon: "📦" },
  { href: "/customers",  label: "Customers",  icon: "👤" },
  { href: "/reports",    label: "Reports",    icon: "📊" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside style={s.sidebar}>
      {/* Brand */}
      <div style={s.brand}>
        <span style={s.brandText}>cookie<br />krave</span>
        <span style={s.brandSub}>Admin</span>
      </div>

      {/* Nav */}
      <nav style={s.nav}>
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{ ...s.link, ...(active ? s.linkActive : {}) }}
            >
              <span style={s.icon}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={s.userArea}>
        {user && (
          <>
            <div style={s.avatar}>
              {user.image
                ? <img src={user.image} alt={user.name} style={s.avatarImg} />
                : <span>{user.name[0]}</span>}
            </div>
            <div style={s.userInfo}>
              <p style={s.userName}>{user.name}</p>
              <p style={s.userEmail}>{user.email}</p>
            </div>
          </>
        )}
        <button onClick={logout} style={s.logoutBtn} title="Sign out">↩</button>
      </div>
    </aside>
  );
}

const s: Record<string, React.CSSProperties> = {
  sidebar: {
    position: "fixed",
    top: 0, left: 0, bottom: 0,
    width: 240,
    background: "#0d1240",
    display: "flex",
    flexDirection: "column",
    zIndex: 100,
  },
  brand: {
    padding: "28px 20px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  brandText: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28,
    color: "#fff",
    lineHeight: 1.1,
    display: "block",
  },
  brandSub: {
    fontSize: 11,
    color: "#c8883a",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginTop: 4,
    display: "block",
  },
  nav: {
    flex: 1,
    padding: "16px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: 8,
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    fontWeight: 500,
    transition: "background 0.15s, color 0.15s",
  },
  linkActive: {
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
  },
  icon: { fontSize: 16, width: 20, textAlign: "center" },
  userArea: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 16px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  avatar: {
    width: 32, height: 32,
    borderRadius: "50%",
    background: "#c8883a",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 700, fontSize: 14,
    flexShrink: 0, overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  userEmail: { fontSize: 11, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  logoutBtn: {
    background: "none", border: "none", color: "rgba(255,255,255,0.5)",
    cursor: "pointer", fontSize: 16, flexShrink: 0,
    padding: 4,
  },
};
