import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminNavProvider } from '@/context/AdminNavContext';
import { AuthProvider } from '@/context/AuthContext';

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
    <AuthProvider>
      <AdminNavProvider>
        <div className="min-h-screen flex bg-slate-50 font-sans relative">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
            {children}
          </div>
        </div>
      </AdminNavProvider>
    </AuthProvider>
  );
}
