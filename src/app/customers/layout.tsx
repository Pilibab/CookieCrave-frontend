// import AdminGuard from "../../components/layout/AdminGuard";

import AdminNavbar from "@/components/layout/AdminNavbar";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
      <div className="min-h-screen bg-[var(--cream)]">
        <AdminNavbar />
        <div className="pt-[calc(var(--navbar-h)+28px)] px-10 pb-10 max-w-[1200px] mx-auto">
          {children}
        </div>
      </div>
  );
}