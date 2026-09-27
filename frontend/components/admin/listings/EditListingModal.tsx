"use client";

import { X } from "lucide-react";
import { Listing } from "@/lib/types";
import { useState, useEffect } from "react";

type EditListingModalProps = {
  isOpen: boolean;
  listing: Listing | null;
  onClose: () => void;
  onSave: (updatedListing: Listing) => void;
};

export default function EditListingModal({
  isOpen,
  listing,
  onClose,
  onSave,
}: EditListingModalProps) {
  const [formData, setFormData] = useState({
    condition: "",
    language: "",
    isFoil: false,
    stock: 0,
    price: 0,
  });

  // Populate form when modal opens or listing changes
  useEffect(() => {
    if (listing && isOpen) {
      setFormData({
        condition: listing.condition,
        language: listing.language,
        isFoil: listing.isFoil,
        stock: listing.stock,
        price: listing.price,
      });
    }
  }, [listing, isOpen]);

  if (!isOpen || !listing) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...listing,
      ...formData,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">
              Edit {listing.card.name}
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

        {/* Form Body */}
        <form id="edit-listing-form" onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-6 overflow-y-auto p-5">
          
          {/* Image */}
          {listing.card.imageUrl && (
            <div className="flex-shrink-0">
              <img
                src={listing.card.imageUrl}
                alt={listing.card.name}
                className="mx-auto w-48 rounded-lg border border-zinc-700 sm:w-56"
              />
            </div>
          )}

          {/* Edit Inputs Grid */}
          <div className="grid w-full grid-cols-2 gap-4 h-fit">
            
            {/* Condition */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
              >
                <option value="NM">Near Mint (NM)</option>
                <option value="LP">Lightly Played (LP)</option>
                <option value="MP">Moderately Played (MP)</option>
                <option value="HP">Heavily Played (HP)</option>
                <option value="DMG">Damaged (DMG)</option>
              </select>
            </div>

            {/* Language */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400">Language</label>
              <input
                type="text"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
                placeholder="e.g., English"
              />
            </div>

            {/* Stock */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400">Stock</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Price */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400">Price (₱)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Foil Checkbox */}
            <div className="flex items-center col-span-2 pt-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-100">
                <input
                  type="checkbox"
                  checked={formData.isFoil}
                  onChange={(e) => setFormData({ ...formData, isFoil: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900"
                />
                Foil version
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-zinc-800 px-5 py-3">
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg px-4 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-listing-form"
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}