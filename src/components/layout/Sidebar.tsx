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
    <aside className="fixed inset-y-0 left-0 w-60 bg-blue-950 flex flex-col z-100">
      {/* Brand */}
      <div className="p-7 pb-5 border-b border-white border-opacity-8">
        <span className="font-serif text-2xl text-white leading-tight block">cookie<br />krave</span>
        <span className="text-xs text-amber-600 font-bold uppercase tracking-wider mt-1 block">Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors ${
                active 
                  ? "bg-white bg-opacity-12 text-white" 
                  : "text-white text-opacity-65 hover:text-opacity-100"
              } text-sm font-medium`}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-t border-white border-opacity-8">
        {user && (
          <>
            <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
              {user.image
                ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                : <span>{user.name[0]}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white overflow-hidden text-ellipsis whitespace-nowrap">{user.name}</p>
              <p className="text-xs text-white text-opacity-50 overflow-hidden text-ellipsis whitespace-nowrap">{user.email}</p>
            </div>
          </>
        )}
        <button onClick={logout} className="bg-none border-none text-white text-opacity-50 hover:text-opacity-75 cursor-pointer text-base flex-shrink-0 p-1 transition-colors" title="Sign out">↩</button>
      </div>
    </aside>
  );
}
