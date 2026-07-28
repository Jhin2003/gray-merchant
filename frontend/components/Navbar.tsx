"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";

type NavbarProps = {
  title?: string;
};

export default function Navbar({
  title = "Gray Merchant",
}: NavbarProps) {
  const pathname = usePathname();

  const navClass = (href: string) =>
    `transition-colors ${
      pathname === href
        ? "text-yellow-400"
        : "text-gray-200 hover:text-yellow-400"
    }`;

  return (
    <nav className="w-full text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <h1 className="text-xl font-bold text-gray-200">
          {title}
        </h1>

        <div className="flex items-center gap-6">
          <Link href="/shop" className={navClass("/shop")}>
            MTG Singles
          </Link>

          <Link
            href="/shop/products"
            className={navClass("/shop/products")}
          >
            Sealed & Accessories
          </Link>

          <Link
            href="/shop/cart"
            aria-label="Shopping Cart"
            className={`${navClass("/shop/cart")} flex items-center`}
          >
            <ShoppingCart size={20} />
          </Link>

          <ProfileDropdown />
        </div>
      </div>
    </nav>
  );
}