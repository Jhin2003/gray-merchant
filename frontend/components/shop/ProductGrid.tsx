import { Listing } from "@/lib/types";
import ProductCard from "./ProductCard";

interface Props {
  listings: Listing[];
  loading?: boolean;
}

export default function ProductGrid({
  listings,
  loading = false,
}: Props) {
  if (loading) {
  return (
    <section className="flex min-h-[500px] items-center justify-center">
     <div className="h-6 w-6 animate-spin rounded-full border border-zinc-200 border-t-zinc-400 dark:border-zinc-800 dark:border-t-zinc-500" />
    </section>
  );
}

  if (listings.length === 0) {
    return (
      <div className="py-20 text-center text-gray-500">
        No products found.
      </div>
    );
  }

  return (
    <section className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5">
      {listings.map((listing) => (
        <ProductCard
          key={listing.id}
          listing={listing}
        />
      ))}
    </section>
  );
}