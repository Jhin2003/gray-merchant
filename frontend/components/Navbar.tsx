"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ProfileDropdown from "./ProfileDropdown";
import CartDropdown from "./cart/CartDropdown";

type NavbarProps = {
  title?: string;
};

export default function Navbar({
  title = "Gray Merchant",
}: NavbarProps) {
  const pathname = usePathname();

  const navClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-all ${
      pathname === href
        ? "bg-zinc-800 text-yellow-400"
        : "text-zinc-300 hover:bg-zinc-800 hover:text-yellow-400"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link
          href="/shop"
          className="text-xl font-bold tracking-tight text-white transition hover:text-yellow-400"
        >
          {title}
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Link href="/shop" className={navClass("/shop")}>
            MTG Singles
          </Link>

          <Link
            href="/shop/products"
            className={navClass("/shop/products")}
          >
            Sealed & Accessories
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <CartDropdown />
          <ProfileDropdown />
        </div>

      </div>
    </nav>
  );
}