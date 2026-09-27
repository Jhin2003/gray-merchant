"use client";

import { useCallback, useEffect, useState } from "react";
import { getListings } from "@/lib/api/listings";
import { Listing } from "@/lib/types";

export function useListings(
  page: number,
  pageSize: number,
  search: string
) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

 const fetchListings = useCallback(async () => {
  try {
    setLoading(true);

    const startTime = Date.now();

    const res = await getListings(page, pageSize, search);

    setListings(res.data);

    setPagination({
      total: res.pagination.total,
      totalPages: res.pagination.totalPages,
    });

    // Keep loading indicator visible for at least 250ms
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 300 - elapsed);

    await new Promise((resolve) => setTimeout(resolve, remaining));
  } finally {
    setLoading(false);
  }
}, [page, pageSize, search]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return {
    listings,
    loading,
    pagination,
    refetch: fetchListings,
  };
}