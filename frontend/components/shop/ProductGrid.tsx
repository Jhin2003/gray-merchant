export default function ProductGrid() {
  return (
    <section className="mt-6">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-lg border bg-white shadow-sm"
          >
            <div className="aspect-[5/7] animate-pulse bg-gray-200" />

            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-1/2 rounded bg-gray-200" />
              <div className="h-6 w-1/3 rounded bg-gray-300" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}