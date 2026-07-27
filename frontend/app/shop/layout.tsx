import Navbar from "@/components/Navbar";
import SearchBar from "@/components/Searchbar";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6">
        <Navbar />
        <SearchBar />
        <main>{children}</main>
      </div>
    </div>
  );
}