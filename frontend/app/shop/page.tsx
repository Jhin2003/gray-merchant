import Image from "next/image";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/Searchbar";
import ProductGrid from "@/components/shop/ProductGrid";
import ProductCatalog from "@/components/shop/ProductCatalog";

export default function Page() {
  return (
    <div className="flex flex-col flex-1 justify-center ">
      
      <ProductCatalog />
      
    </div>
  );
}
