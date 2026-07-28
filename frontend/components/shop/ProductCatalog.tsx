// ShopSection.tsx

import SearchBar from "../Searchbar";
import ProductGrid from "./ProductGrid";

export default function ProductCatalog() {
  return (
    <section className="space-y-6 p-6">
      <SearchBar />
      <ProductGrid />
    </section>
  );
}