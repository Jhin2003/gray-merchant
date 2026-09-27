import { notFound } from "next/navigation";
import { getListing } from "@/lib/api/listings";
import ListingDetails from "@/components/shop/viewListing/viewListing";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ListingPage({ params }: Props) {
  const { id } = await params;

  let listing;

  try {
    listing = await getListing(id);
  } catch (error: any) {
    if (error.response?.status === 404) {
      notFound();
    }

    throw error;
  }

  if (!listing) {
    notFound();
  }

  return <ListingDetails listing={listing} />;
}