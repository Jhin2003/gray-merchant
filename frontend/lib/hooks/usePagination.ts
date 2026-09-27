// hooks/usePagination.ts
import { useState } from "react";

export function usePagination(initialPage = 1, initialLimit = 10) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  return {
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    setTotalPages,
    total,
    setTotal,
  };
}