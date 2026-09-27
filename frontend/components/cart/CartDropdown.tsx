"use client";

import Link from "next/link";
import { ShoppingCart, X, Trash2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/context/CartContext";
export default function CartDropdown() {
  const [open, setOpen] = useState(false);
  const { cart, totalItems, removeFromCart } = useCart(); // <-- Get cart state

  return (
    <div className="relative">
      {/* Cart button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Shopping Cart"
        className="relative flex items-center rounded-lg p-2 text-gray-200 transition-colors hover:text-yellow-400"
      >
        <ShoppingCart size={20} />
        {/* Cart Item Badge */}
        {totalItems > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
            {totalItems}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-80 rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">
              Shopping Cart ({totalItems})
            </h2>

            <button
              onClick={() => setOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Cart items list */}
          <div className="max-h-60 overflow-y-auto pr-2">
            {cart.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-400">
                Your cart is empty.
              </div>
            ) : (
              <div className="flex flex-col gap-4 mb-4">
                {cart.map((item) => (
                  <div key={item.listing.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.listing.card.imageUrl && (
                        <img 
                          src={item.listing.card.imageUrl} 
                          alt={item.listing.card.name} 
                          className="h-12 w-9 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-white truncate w-32">
                          {item.listing.card.name}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {item.quantity} x ₱{item.listing.price}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.listing.id)}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full cart button */}
          <Link
            href="/shop/cart"
            onClick={() => setOpen(false)}
            className="block mt-2 w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-700"
          >
            View Cart
          </Link>
        </div>
      )}
    </div>
  );
}