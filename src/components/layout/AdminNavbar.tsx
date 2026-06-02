"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { href: "/dashboard",  label: "Dashboard" },
  { href: "/orders",     label: "Orders" },
  { href: "/products",   label: "Products" },
  { href: "/inventory",  label: "Inventory" },
  { href: "/customers",  label: "Customers" },
  { href: "/reports",    label: "Reports" },
];

export default function AdminNavbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="navbar-wrapper">
      <nav className="navbar">
        <span className="navbar-brand">cookie krave</span>
        <div className="navbar-divider" />
        <div className="navbar-nav">
          {NAV.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`navbar-link${active ? " active" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </div>
        <div className="navbar-user">
          <button
            onClick={logout}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 13, fontWeight: 500 }}
          >
            Sign out
          </button>
          <div className="navbar-avatar">
            {user?.image
              ? <img src={user.image} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span>{user?.name?.[0] ?? "A"}</span>}
          </div>
        </div>
      </nav>
    </div>
  );
}