import ListingTableRow from "./ListingTableRow";

export type Listing = {
  id: number;
  cardName: string;
  setName: string;
  condition: string;
  stock: number;
  price: number;
};

type ListingTableProps = {
  listings: Listing[];
};

export default function ListingTable({
  listings,
}: ListingTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
            <tr>
              <th className="px-6 py-4">Card</th>
              <th className="px-6 py-4">Set</th>
              <th className="px-6 py-4">Condition</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {listings.map((listing) => (
              <ListingTableRow
                key={listing.id}
                listing={listing}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}