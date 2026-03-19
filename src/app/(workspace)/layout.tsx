import { getUser } from "@/lib/supabase/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const email = user?.email ?? null;

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <AppSidebar userEmail={email} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-12 items-center gap-2 border-b border-border px-4 md:hidden">
          <MobileSidebar userEmail={email} />
          <span className="text-sm font-bold tracking-tight">Echo Weave Studio</span>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
