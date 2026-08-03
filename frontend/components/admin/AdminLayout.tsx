'use client';

import SidebarNav from './SidebarNav';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <>
    

      <div className="flex min-h-[calc(100vh-68px)] w-full flex-col bg-gray-100 md:flex-row">
        <SidebarNav />

        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </>
  );
}