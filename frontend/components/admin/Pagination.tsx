type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;

  pageSizeOptions?: number[];
  variant?: "admin" | "shop";

  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  variant = "admin",
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const pages: number[] = [];

  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, page + 2);

  if (page <= 3) {
    end = Math.min(totalPages, 5);
  }

  if (page >= totalPages - 2) {
    start = Math.max(1, totalPages - 4);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (variant === "shop") {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Previous
          </button>

          {start > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                1
              </button>
              <span className="text-gray-400 dark:text-zinc-500">...</span>
            </>
          )}

          {pages.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                p === page
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
            >
              {p}
            </button>
          ))}

          {end < totalPages && (
            <>
              {end < totalPages - 1 && (
                <span className="text-gray-400 dark:text-zinc-500">...</span>
              )}

              <button
                onClick={() => onPageChange(totalPages)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // Default Admin Variant
  return (
    <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4">
      {/* Left */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-400">Rows per page</span>

        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
          }}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <span className="text-sm text-zinc-500">{totalItems} items</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-white disabled:opacity-40"
        >
          Previous
        </button>

        {start > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="rounded-lg px-3 py-2 text-white"
            >
              1
            </button>

            <span className="text-zinc-500">...</span>
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`rounded-lg px-3 py-2 ${
              p === page
                ? "bg-blue-600 text-white"
                : "text-white hover:bg-zinc-800"
            }`}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="text-zinc-500">...</span>}

            <button
              onClick={() => onPageChange(totalPages)}
              className="rounded-lg px-3 py-2 text-white"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-white disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}