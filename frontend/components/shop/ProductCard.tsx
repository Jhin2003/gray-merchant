import Link from "next/link";
import { Listing } from "@/lib/types";

interface Props {
  listing: Listing;
}

export default function ProductCard({ listing }: Props) {
  return (
    <>
      <style>{`
        @keyframes foil-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <Link
        href={`/shop/${listing.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-3 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-zinc-200/40 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:hover:border-zinc-700 dark:hover:shadow-black/40"
      >
        {/* Card Image Container (MTG Aspect Ratio) */}
        <div className="relative overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-950 aspect-[63/88] w-full">
          <img
            src={listing.card.imageUrl ?? "/placeholder.png"}
            alt={listing.card.name}
            className="relative z-0 h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* === FOIL HOLOGRAPHIC === */}
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

          {/* === UNIVERSAL CARD GLOSS (Sweeping Light) === */}
          {/* Brighter for foil, softer for non-foil */}
          <div 
            className={`pointer-events-none absolute -left-[100%] top-0 z-20 h-full w-[50%] -skew-x-12 transform bg-gradient-to-r from-transparent to-transparent transition-all duration-700 ease-in-out group-hover:left-[150%] ${
              listing.isFoil ? "via-white/60" : "via-white/20 dark:via-white/10"
            }`} 
          />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col pt-3 sm:pt-4 px-1 pb-1">
          <div>
            {/* Title: text-xs on mobile, text-sm on small screens and up */}
            <h3 className="line-clamp-1 text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {listing.card.name}
            </h3>
            {/* Set Name: text-[11px] on mobile, text-xs on small screens and up */}
            <p className="mt-0.5 sm:mt-1 line-clamp-1 text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {listing.card.setName}
            </p>
          </div>

          {/* Condition, Finish, & Stock */}
          <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Badges: text-[10px] on mobile, text-[11px] on sm screens */}
            <span className="whitespace-nowrap rounded-md bg-zinc-100/80 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300">
              {listing.condition}
            </span>

            <span
              className={`whitespace-nowrap rounded-md border px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-[11px] font-semibold transition-colors ${
                listing.isFoil
                  ? "border-purple-200 bg-gradient-to-tr from-indigo-50 via-purple-50 to-pink-50 text-purple-700 dark:border-purple-800/50 dark:from-indigo-950/40 dark:via-purple-900/40 dark:to-pink-950/40 dark:text-purple-300"
                  : "border-zinc-200/50 bg-white text-zinc-600 dark:border-zinc-700/50 dark:bg-zinc-900 dark:text-zinc-400"
              }`}
            >
              {listing.isFoil ? "Foil" : "Nonfoil"}
            </span>

            <span className="ml-auto whitespace-nowrap text-[10px] sm:text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              {listing.stock} in stock
            </span>
          </div>

          {/* Price & Action Area */}
          <div className="mt-auto pt-3 sm:pt-4 flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-zinc-400">Price</span>
              {/* Price: text-base on mobile, text-lg on sm screens */}
              <span className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                ₱{listing.price.toLocaleString()}
              </span>
            </div>
            
            {/* Subtle View Indicator */}
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-zinc-800 dark:text-zinc-500 dark:group-hover:bg-blue-500/10 dark:group-hover:text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </>
  );
}