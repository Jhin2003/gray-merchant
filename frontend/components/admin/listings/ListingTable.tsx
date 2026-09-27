import { Listing } from "@/lib/types";
import ListingTableRow from "./ListingTableRow";
import { useState } from "react";
import Pagination from "../Pagination";

type Props = {
  listings: Listing[];

  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;

  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;

  onAddListing: () => void;
  onDelete: (id: number) => void;
  onView: (listing: Listing) => void;
  onEdit: (listing: Listing) => void;
};

export default function ListingTable({
  listings,

  page,
  totalPages,
  totalItems,
  pageSize,

  onPageChange,
  onPageSizeChange,

  onAddListing,
  onDelete,
  onView,
  onEdit,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg">
      {/* Table Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <h2 className="text-lg font-semibold text-zinc-100">Listings</h2>

        <button
          onClick={onAddListing}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
        >
          + Add Listing
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full whitespace-nowrap">
          <thead className="bg-zinc-800/50 text-left text-sm font-semibold text-zinc-300">
            <tr>
              <th className="px-6 py-4">Card</th>
              <th className="px-6 py-4">Set</th>
              <th className="px-6 py-4">Condition</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800 bg-zinc-900">
            {listings.length > 0 ? (
              listings.map((listing) => (
                <ListingTableRow
                  key={listing.id}
                  listing={listing}
                  onDelete={onDelete}
                  onView={onView}
                  onEdit={onEdit}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-sm text-zinc-500"
                >
                  No listings found. Click "Add Listing" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
