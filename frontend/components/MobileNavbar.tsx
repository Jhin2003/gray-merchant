"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingCart } from "lucide-react";
import { useState } from "react";
import ProfileDropdown from "./ProfileDropdown";

export default function MobileNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navClass = (href: string) =>
    `block rounded-md px-3 py-2 transition-colors ${
      pathname === href
        ? "text-yellow-400"
        : "text-gray-200 hover:text-yellow-400"
    }`;

  return (
    <nav className="md:hidden border-b border-gray-800 bg-gray-900 text-white">
      <div className="flex h-16 items-center justify-between px-4">
        <h1 className="text-lg font-bold text-gray-200">
          Gray Merchant
        </h1>

        <button
          onClick={() => setOpen(!open)}
          className="rounded-md p-2 hover:bg-gray-800"
        >
          <Menu size={24} />
        </button>
      </div>

      {open && (
        <div className="space-y-1 border-t border-gray-800 px-4 py-3">
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

          <Link
            href="/shop/cart"
            className={`${navClass("/shop/cart")} flex items-center gap-2`}
            onClick={() => setOpen(false)}
          >
            <ShoppingCart size={18} />
            Cart
          </Link>

          <div className="pt-2">
            <ProfileDropdown />
          </div>
        </div>
      )}
    </nav>
  );
}