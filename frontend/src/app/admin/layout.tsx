import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const metadata = {
  title: 'Fundo Foundation Management Platform',
  description: 'Secure Foundation Management System',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
