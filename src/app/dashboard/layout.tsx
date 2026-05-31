import Sidebar from "@/components/layout/Sidebar";
import AdminGuard from "../../components/layout/AdminGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    // <AdminGuard>
      <div className="min-h-screen bg-amber-50">
        <Sidebar />
        <div className="pt-14">
          {children}
        </div>
      </div>
    // </AdminGuard>
  );
}