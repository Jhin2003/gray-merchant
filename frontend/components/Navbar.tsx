

import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";

import ProfileDropdown from "./ProfileDropdown";


type NavbarProps = {
  title?: string;
};

export default function Navbar({
  title = "Gray Merchant",
}: NavbarProps) {
  return (
    <nav className="w-full text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
        <h1 className="text-xl font-bold text-gray-200">
          {title}
        </h1>

        <div className="flex items-center gap-6">
          <Link
            href="/shop"
            className="transition-colors hover:text-gray-600"
          >
            MTG Singles
          </Link>

          <Link
            href="/shop/products"
            className="transition-colors hover:text-gray-600"
          >
            Sealed & Accessories
          </Link>

          <Link
            href="/shop/cart"
            className="flex items-center gap-2 transition-colors hover:text-gray-300"
          >
            <ShoppingCart size={20} />
   
          </Link>

          <ProfileDropdown />
        </div>
      </div>
    </nav>
  );
}