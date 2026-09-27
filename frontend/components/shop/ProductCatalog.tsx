"use client";

import { useCallback, useEffect, useState } from "react";

import SearchBar from "../Searchbar";
import ProductGrid from "./ProductGrid";
import Pagination from "../admin/Pagination";
import { useListings } from "@/lib/hooks/useListings";

export default function ProductCatalog() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  
  const { listings, loading, pagination } = useListings(page, pageSize, search);

  // 1. Stabilize the search handler
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  // 2. Stabilize the page size handler
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return (
    <section className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="w-full max-w-md">
          <SearchBar
            search={search}
            setSearch={handleSearch} // Pass the stable reference
          />
        </div>

        {/* Filter button will go here */}
        <button className="shrink-0 rounded-full bg-gray-100 px-5 py-3 text-sm dark:bg-gray-800">
          Filters
        </button>
      </div>

      <ProductGrid listings={listings} loading={loading} />

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={pagination.total}
        totalPages={pagination.totalPages}
        variant="shop"
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange} // Pass the stable reference
      />
    </section>
  );
}