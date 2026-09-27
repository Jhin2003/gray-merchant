"use client";

import { useCart } from "@/lib/context/CartContext";
import Link from "next/link";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();

  // Calculate the total price of all items in the cart
  const subtotal = cart.reduce(
    (sum, item) => sum + item.listing.price * item.quantity,
    0,
  );

  return (
    <main className="min-h-screen bg-white px-6 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Shopping Cart
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Review your selected cards before checkout.
          </p>
        </div>

        {cart.length === 0 ? (
          /* Empty Cart State */
          <div className="rounded-2xl border border-zinc-200 py-20 text-center dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Your cart is empty
            </h2>
            <p className="mt-2 text-zinc-500">
              Looks like you haven't added any cards yet.
            </p>
            <Link
              href="/shop"
              className="mx-auto mt-6 block w-fit rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          /* Cart Content */
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cart Items List */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                {cart.map((item, index) => (
                  <div
                    key={`${item.listing.id}-${index}`}
                    className="flex gap-5 border-b border-zinc-200 p-5 last:border-b-0 dark:border-zinc-800"
                  >
                    {/* Card Image */}
                    <div className="flex h-32 w-24 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <img
                        src={item.listing.card.imageUrl ?? "/placeholder.png"}
                        alt={item.listing.card.name}
                        className="max-h-28 max-w-20 rounded-md object-contain"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h2 className="font-semibold text-zinc-900 dark:text-white">
                          {item.listing.card.name} {item.listing.isFoil && "✨"}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-500">
                          {item.listing.card.setName}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          Condition: {item.listing.condition}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center rounded-lg border border-zinc-300 dark:border-zinc-700">
                          <button
                            onClick={() =>
                              updateQuantity(item.listing.id, item.quantity - 1)
                            }
                            className="px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            −
                          </button>
                          <span className="px-4 py-1.5 text-sm font-medium text-zinc-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            // Disable + button if they reached the max stock limit
                            onClick={() =>
                              updateQuantity(item.listing.id, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.listing.stock}
                            className="px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            +
                          </button>
                        </div>

                        {/* Total Price for this item */}
                        <p className="font-semibold text-zinc-900 dark:text-white">
                          ₱
                          {(
                            item.listing.price * item.quantity
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.listing.id)}
                      className="self-start text-sm text-red-500 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="sticky top-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Order Summary
                </h2>

                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      ₱{subtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-zinc-500">Shipping</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      Calculated at checkout
                    </span>
                  </div>

                  <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-zinc-900 dark:text-white">
                        Total
                      </span>
                      <span className="text-xl font-bold text-blue-600">
                        ₱{subtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/shop/checkout"
                  className="mt-6 block text-center w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98]"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  href="/shop"
                  className="mt-3 block w-full rounded-xl border border-zinc-300 px-6 py-3 text-center font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
