"use client";

import { CardData } from "@/lib/types";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { searchCards } from "@/lib/api/cards";
import { CreateListingDto } from "@/lib/types";

type AddListingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (listingDTO: CreateListingDto) => void;
};

export default function AddListingModal({
  isOpen,
  onClose,
  onSave,
}: AddListingModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardData[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState({
    cardId: 0,
    condition: "Near Mint",
    language: "English",
    stock: "" as number | "",
    price: "" as number | "",
    isFoil: false,
  });

  const handleSearch = async (search: string) => {
    if (search.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const data = await searchCards(search);
      setResults(data);
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setSelectedCard(null);
         setListing({
      cardId: 0,
      condition: "Near Mint",
      language: "English",
      stock: "",
      price: "",
      isFoil: false,
    });
  
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-[95%] max-w-sm overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl sm:max-w-md md:max-w-xl lg:max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-xl font-semibold">Add Listing</h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">
          {/* Search */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Search Card
            </label>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by card name..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            />

            {results.length > 0 && (
              <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-lg">
                {results.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className="flex w-full items-center gap-3 border-b border-zinc-800 p-3 text-left transition hover:bg-zinc-800 last:border-0"
                    onClick={() => {
                      setSelectedCard(card);
                      setQuery(card.name);
                      setResults([]);

                      setListing((prev) => ({
                        ...prev,
                        cardId: card.id,
                      }));
                    }}
                  >
                    {card.imageUrl && (
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="h-10 w-10 object-contain text-xs font-medium text-zinc-100"
                      />
                    )}

                    <div>
                      <div className="font-medium">{card.name}</div>
                      <div className="text-sm text-zinc-400">
                        {card.setName}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Card Preview */}
          <div className="flex gap-4">
            {selectedCard ? (
              <>
                <img
                  src={selectedCard.imageUrl ?? "/placeholder-card.png"}
                  className="h-48 rounded-lg border border-zinc-800 bg-zinc-950 object-contain"
                  alt={selectedCard.name}
                />

                <div className="flex flex-col justify-center">
                  <h3 className="text-xl font-semibold">{selectedCard.name}</h3>
                  <p className="text-zinc-400">{selectedCard.setName}</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-48 w-36 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-sm text-zinc-500">
                  Card Image
                </div>

                <div className="flex flex-col justify-center text-zinc-500">
                  Select a card...
                </div>
              </>
            )}
          </div>

          {/* Listing Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Condition
              </label>
              <select
                value={listing.condition}
                onChange={(e) =>
                  setListing((prev) => ({
                    ...prev,
                    condition: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-blue-500 focus:outline-none"
              >
                <option value="Near Mint">Near Mint</option>
                <option value="Lightly Played">Lightly Played</option>
                <option value="Moderately Played">Moderately Played</option>
                <option value="Heavily Played">Heavily Played</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Language
              </label>

              <select
                value={listing.language}
                onChange={(e) =>
                  setListing((prev) => ({
                    ...prev,
                    language: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-blue-500 focus:outline-none"
              >
                <option>English</option>
                <option>Japanese</option>
                <option>Korean</option>
                <option>Chinese</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Quantity
              </label>

              <input
                type="number"
                value={listing.stock}
                onChange={(e) =>
                  setListing((prev) => ({
                    ...prev,
                    stock:  e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Price (₱)
              </label>

              <input
                type="number"
                value={listing.price}
                onChange={(e) =>
                  setListing((prev) => ({
                    ...prev,
                    price: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="foil"
              type="checkbox"
              checked={listing.isFoil}
              onChange={(e) =>
                setListing((prev) => ({
                  ...prev,
                  isFoil: e.target.checked,
                }))
              }
              className="h-4 w-4 cursor-pointer rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900"
            />
            <label
              htmlFor="foil"
              className="cursor-pointer text-sm font-medium text-zinc-300"
            >
              Foil
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-zinc-800 bg-zinc-900/50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={() => onSave?.(listing)}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            Create Listing
          </button>
        </div>
      </div>
    </div>
  );
}
