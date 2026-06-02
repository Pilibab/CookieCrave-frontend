import AdminNavbar from "@/components/layout/AdminNavbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout">
      <AdminNavbar />
      <div className="main-content">{children}</div>
    </div>
  );
}
