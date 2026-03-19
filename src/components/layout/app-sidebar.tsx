import { SignOutButton } from "@/components/auth/sign-out-button";
import { SidebarNav } from "./sidebar-nav";

interface AppSidebarProps {
  userEmail: string | null;
}

export function AppSidebar({ userEmail }: AppSidebarProps) {
  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-4 py-4">
        <h1 className="text-sm font-bold tracking-tight">Echo Weave Studio</h1>
      </div>
      <SidebarNav />
      <div className="space-y-1 border-t border-border px-2 py-3">
        <p className="px-3 text-xs text-muted-foreground truncate">
          {userEmail ?? "Not signed in"}
        </p>
        {userEmail && <SignOutButton />}
      </div>
    </aside>
  );
}
