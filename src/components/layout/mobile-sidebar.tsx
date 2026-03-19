"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SidebarNav } from "./sidebar-nav";

interface MobileSidebarProps {
  userEmail: string | null;
}

export function MobileSidebar({ userEmail }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="md:hidden" />
        }
      >
        <Menu />
        <span className="sr-only">Toggle menu</span>
      </SheetTrigger>
      <SheetContent side="left" showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>Echo Weave Studio</SheetTitle>
        </SheetHeader>
        <SidebarNav onNavClick={() => setOpen(false)} />
        <div className="space-y-1 border-t border-border px-2 py-3">
          <p className="px-3 text-xs text-muted-foreground truncate">
            {userEmail ?? "Not signed in"}
          </p>
          {userEmail && <SignOutButton />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
