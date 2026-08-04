"use client";

import { X } from "lucide-react";
import { Listing } from "@/lib/types";

type ViewListingModalProps = {
  isOpen: boolean;
  listing: Listing | null;
  onClose: () => void;
};

export default function ViewListingModal({
  isOpen,
  listing,
  onClose,
}: ViewListingModalProps) {
  if (!isOpen || !listing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      {/* Changed max-w-xl to max-w-2xl to accommodate side-by-side layout, added max-h and overflow */}
      <div className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        
        {/* Header - Reduced padding from px-6 py-4 to px-5 py-3 */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">
              {listing.card.name}
            </h2>
            <p className="text-xs text-zinc-400">
              {listing.card.setName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - Changed to a flex layout to put image and info side-by-side */}
        <div className="flex flex-col sm:flex-row gap-6 overflow-y-auto p-5">
          
          {/* Image - Moved to the left, slightly reduced width */}
          {listing.card.imageUrl && (
            <div className="flex-shrink-0">
              <img
                src={listing.card.imageUrl}
                alt={listing.card.name}
                className="mx-auto w-48 rounded-lg border border-zinc-700 sm:w-56"
              />
            </div>
          )}

          {/* Info Grid - Moved to the right, reduced gap from 6 to 4 */}
          <div className="grid w-full grid-cols-2 gap-4 h-fit">
            <Info label="Condition" value={listing.condition} />
            <Info label="Language" value={listing.language} />
            <Info label="Foil" value={listing.isFoil ? "Yes" : "No"} />
            <Info label="Stock" value={listing.stock} />
            <Info label="Price" value={`₱${listing.price}`} />
          </div>
          
        </div>

        {/* Footer - Reduced padding */}
        <div className="flex justify-end border-t border-zinc-800 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-4 py-1.5 text-sm text-zinc-200 transition hover:bg-zinc-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

type InfoProps = {
  label: string;
  value: React.ReactNode;
};

function Info({ label, value }: InfoProps) {
  return (
    <div>
      <p className="mb-0.5 text-xs text-zinc-500">{label}</p>
      <p className="text-sm font-medium text-zinc-100">{value}</p>
    </div>
  );
}