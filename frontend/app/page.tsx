import { redirect } from "next/dist/client/components/navigation";


export default function Home() {
  redirect("/shop");
}