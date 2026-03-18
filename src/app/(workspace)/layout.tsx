import Link from "next/link";
import { getUser } from "@/lib/supabase/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chapters", label: "Chapters" },
  { href: "/songs", label: "Songs" },
  { href: "/images", label: "Images" },
  { href: "/conversations", label: "Conversations" },
  { href: "/characters", label: "Characters" },
  { href: "/themes", label: "Themes" },
  { href: "/notes", label: "Notes" },
  { href: "/activity", label: "Activity" },
  { href: "/settings", label: "Settings" },
];

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar — will be extracted to its own component in the shared layout task */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
        <div className="border-b border-border px-4 py-4">
          <h1 className="text-sm font-bold tracking-tight">Arcana Studio</h1>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-1 border-t border-border px-2 py-3">
          <p className="px-3 text-xs text-muted-foreground truncate">
            {user?.email ?? "Not signed in"}
          </p>
          {user && <SignOutButton />}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
