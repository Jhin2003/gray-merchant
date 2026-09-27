"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingCart, X } from "lucide-react"; // Added X icon
import { useState } from "react";
import ProfileDropdown from "./ProfileDropdown";
import CartDropdown from "./cart/CartDropdown";

export default function MobileNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Updated to support modern pill-shaped active states
  const navClass = (href: string) =>
    `flex w-full items-center rounded-xl px-4 py-3 text-sm transition-all ${
      pathname === href
        ? "bg-blue-50 font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
        : "font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl md:hidden dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="flex h-16 items-center justify-between px-6">
        
        {/* Brand */}
        <Link 
          href="/"
          className="text-lg font-black tracking-tight text-zinc-900 dark:text-white"
          onClick={() => setOpen(false)}
        >
          Gray Merchant
        </Link>

        {/* Quick Actions (Cart + Hamburger) */}
        <div className="flex items-center gap-4">
             <CartDropdown />
          
          <button
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors active:scale-95 dark:bg-zinc-800 dark:text-zinc-400"
            aria-label="Toggle Menu"
          >
            {open ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* Expanded Dropdown Menu */}
      {open && (
        <div className="absolute left-0 top-16 w-full border-b border-zinc-200/80 bg-white px-4 py-4 shadow-2xl dark:border-zinc-800/80 dark:bg-zinc-950 dark:shadow-black/50">
          <div className="flex flex-col space-y-2">
            <Link
              href="/shop"
              className={navClass("/shop")}
              onClick={() => setOpen(false)}
            >
              MTG Singles
            </Link>

            <Link
              href="/shop/products"
              className={navClass("/shop/products")}
              onClick={() => setOpen(false)}
            >
              Sealed & Accessories
            </Link>

            {/* Divider */}
            <div className="my-2 h-px w-full bg-zinc-100 dark:bg-zinc-800/80" />

            {/* Profile Section */}
            <div className="px-2 pt-2 pb-1">
              <ProfileDropdown />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}