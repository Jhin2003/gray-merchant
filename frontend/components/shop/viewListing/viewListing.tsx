"use client";

import { Listing } from "@/lib/types";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useCart } from "@/lib/context/CartContext";
import { showToast } from "@/components/Toast";

interface Props {
  listing: Listing;
}

export default function ListingDetails({ listing }: Props) {
  const { addToCart } = useCart();

  return (
    <>
      {/* Foil Animation Keyframes */}
      <style>{`
        @keyframes foil-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <main className="min-h-[calc(100vh-80px)] bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 md:py-6">
          {/* === BACK BUTTON === */}
          <Link
            href="/shop"
            className="group mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Shop
          </Link>

          {/* Reduced mobile gap from gap-8 to gap-5 */}
          <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-2 md:gap-8 lg:gap-12">
            
            {/* === IMAGE PRESENTATION === */}
            {/* Reduced padding on mobile (p-3) */}
            <div className="flex items-center justify-center rounded-2xl border border-zinc-200/60 bg-zinc-50/50 p-3 sm:p-4 md:p-6 dark:border-zinc-800/60 dark:bg-zinc-900/20">
              
              {/* Scaled mobile max-width down to 180px. Scales up on sm and md screens */}
              <div className="group relative w-full max-w-[180px] sm:max-w-[240px] md:max-w-[280px] aspect-[63/88] overflow-hidden rounded-[4.5%]/[3.5%] bg-black shadow-xl transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-zinc-300/50 dark:hover:shadow-black/60">
                <img
                  src={listing.card.imageUrl ?? "/placeholder.png"}
                  alt={listing.card.name}
                  className="absolute inset-0 z-0 h-full w-full object-contain"
                />

                {/* Holographic Foil Overlay */}
                {listing.isFoil && (
                  <div
                    className="pointer-events-none absolute inset-0 z-10 mix-blend-color-dodge opacity-40 transition-opacity duration-500 group-hover:opacity-70"
                    style={{
                      backgroundImage:
                        "linear-gradient(115deg, transparent 20%, #ff8a00 25%, #e52e71 45%, #02aab0 65%, #00cdac 80%, transparent 85%)",
                      backgroundSize: "200% 200%",
                      animation: "foil-shift 4s ease-in-out infinite",
                    }}
                  />
                )}

                {/* Glossy Light Sweep */}
                <div
                  className={`pointer-events-none absolute -left-[100%] top-0 z-20 h-full w-[50%] -skew-x-12 transform bg-gradient-to-r from-transparent to-transparent transition-all duration-1000 ease-in-out group-hover:left-[150%] ${
                    listing.isFoil
                      ? "via-white/50"
                      : "via-white/20 dark:via-white/10"
                  }`}
                />
              </div>
            </div>

            {/* === DETAILS SECTION === */}
            {/* Tightened vertical spacing on mobile (space-y-4) */}
            <div className="flex flex-col justify-center space-y-4 md:space-y-5">
              {/* Header */}
              <div>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-500">
                  {listing.card.setName}
                </p>
                <h1 className="mt-1 text-2xl font-extrabold text-zinc-900 dark:text-white sm:text-3xl">
                  {listing.card.name}
                </h1>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] sm:text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                  {listing.condition}
                </span>

                <span
                  className={`rounded-md border px-2 py-1 text-[11px] sm:text-xs font-semibold ${
                    listing.isFoil
                      ? "border-purple-200 bg-gradient-to-tr from-indigo-50 via-purple-50 to-pink-50 text-purple-700 dark:border-purple-800/50 dark:from-indigo-950/40 dark:via-purple-900/40 dark:to-pink-950/40 dark:text-purple-300"
                      : "border-zinc-200/80 bg-white text-zinc-600 dark:border-zinc-700/80 dark:bg-zinc-900 dark:text-zinc-400"
                  }`}
                >
                  {listing.isFoil ? "Foil" : "Nonfoil"}
                </span>

                <span className="ml-1 text-[11px] sm:text-xs font-medium text-zinc-500">
                  {listing.stock} in stock
                </span>
              </div>

              {/* Price */}
              <div>
                <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Price
                </p>
                <div className="mt-0.5 text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
                  ₱{listing.price.toLocaleString()}
                </div>
              </div>

              {/* Actions - Changed to flex-row so they sit side-by-side on mobile */}
              <div className="flex flex-row gap-2 sm:gap-3 pt-1 sm:pt-2">
                <button
                  onClick={() => {
                    addToCart(listing);
                    showToast("Added to cart successfully!", "success");
                  }}
                  className="flex-1 rounded-xl bg-blue-600 px-3 py-2.5 sm:px-5 sm:py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.98]"
                >
                  Add to Cart
                </button>

                <button className="flex-1 rounded-xl border-2 border-zinc-200 px-3 py-2.5 sm:px-5 sm:py-3 text-sm font-bold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900">
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}