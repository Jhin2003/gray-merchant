import Image from "next/image";
import Navbar from "@/components/Navbar";

export default function Page() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-gray-950">
      <Navbar />
      <div className="flex items-center justify-center h-screen"></div>
    </div>
  );
}
