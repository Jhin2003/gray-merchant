import { Pencil, Trash2 } from "lucide-react";
import { Listing } from "@/lib/types";

type Props = {
  listing: Listing;
  onDelete: (id: number) => void;
  onView: (listing: Listing) => void;
  onEdit: (listing: Listing) => void;

};

export default function ListingTableRow({ listing, onDelete, onView, onEdit }: Props) {
  return (
    <tr
      onClick={() => onView(listing)}
      className="transition-colors hover:bg-zinc-800/50"
    >
      <td className="px-6 py-4 font-medium text-zinc-100">
        {listing.card.name}
   
      </td>

      <td className="px-6 py-4 text-zinc-400">{listing.card.setName}</td>

      <td className="px-6 py-4">
        <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
          {listing.condition}
        </span>
      </td>

      <td className="px-6 py-4 text-zinc-400">{listing.stock}</td>

      <td className="px-6 py-4 font-semibold text-zinc-100">
        ₱{listing.price}
      </td>

      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">
          <button 
          onClick={(e) => {
              e.stopPropagation();
              onEdit(listing);
            }}
          className="rounded-lg border border-zinc-700 p-2 text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-100">
            <Pencil size={18} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(listing.id);
            }}
            className="rounded-lg border border-red-900/50 p-2 text-red-400 transition hover:border-red-900 hover:bg-red-950/50 hover:text-red-300"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}
