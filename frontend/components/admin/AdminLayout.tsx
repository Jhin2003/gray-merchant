

import SidebarNav from './SidebarNav';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <>
    

      <div className="flex min-h-screen w-full flex-col  md:flex-row">
        <SidebarNav />

        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </>
  );
}