import ListingTable from "@/components/admin/listings/ListingTable";

const listings = [
  {
    id: 1,
    cardName: "Black Lotus",
    setName: "Limited Edition Alpha",
    condition: "Near Mint",
    stock: 1,
    price: 2500000,
  },
  {
    id: 2,
    cardName: "Lightning Bolt",
    setName: "Foundations",
    condition: "Lightly Played",
    stock: 4,
    price: 120,
  },
];

export default function ListingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Listings</h1>

      <ListingTable listings={listings} />
    </div>
  );
}