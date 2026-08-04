import { api } from "@/lib/api/axios";
import { CreateListingDto, Listing } from "@/lib/types";


export async function getListings(): Promise<Listing[]> {
  const response = await api.get("/listings");
  return response.data;
}


export async function saveListing(listing: CreateListingDto,): Promise<CreateListingDto> {
  const { data } = await api.post<CreateListingDto>("/listings", listing);
  return data;
}


export async function deleteListing(id: number): Promise<Listing> {
  const { data } = await api.delete<Listing>(`/listings/${id}`);
  return data;
}