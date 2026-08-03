import { Pencil, Trash2 } from "lucide-react";
import { Listing } from "./ListingTable";

type Props = {
  listing: Listing;
};

export default function ListingTableRow({ listing }: Props) {
  return (
    <tr className="transition-colors hover:bg-gray-50">
      <td className="px-6 py-4 font-medium text-gray-900">
        {listing.cardName}
      </td>

      <td className="px-6 py-4 text-gray-600">
        {listing.setName}
      </td>

      <td className="px-6 py-4">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          {listing.condition}
        </span>
      </td>

      <td className="px-6 py-4 text-gray-600">
        {listing.stock}
      </td>

      <td className="px-6 py-4 font-semibold">
        ₱{listing.price.toFixed(2)}
      </td>

      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">
          <button className="rounded-lg border p-2 text-gray-600 transition hover:bg-gray-100">
            <Pencil size={18} />
          </button>

          <button className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50">
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}