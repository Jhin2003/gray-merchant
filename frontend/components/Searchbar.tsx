import { Search } from "lucide-react";

export default function Searchbar() {
  return (
    <div className="relative w-full max-w-xl">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
      />

      <input
        type="text"
        placeholder="Search Magic cards..."
        className="
          w-full
          rounded-full
          bg-gray-100
          py-3
          pl-11
          pr-4
          text-sm
          text-gray-900
          placeholder:text-gray-500
          outline-none
          transition
          focus:bg-white
          focus:ring-2
          focus:ring-gray-300
          dark:bg-gray-800
          dark:text-gray-100
          dark:placeholder:text-gray-400
          dark:focus:bg-gray-700
          dark:focus:ring-gray-600
        "
      />
    </div>
  );
}