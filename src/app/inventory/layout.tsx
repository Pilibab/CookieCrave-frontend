import Sidebar from "@/components/layout/Sidebar";
import AdminGuard from "../../components/layout/AdminGuard";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-amber-50">
        <Sidebar />
        <div className="pt-14 px-10 pb-10 max-w-6xl mx-auto">
          {children}
        </div>
      </div>
    </AdminGuard>
  );
}