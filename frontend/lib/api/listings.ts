import { api } from "@/lib/api/axios";
import { CreateListingDto, Listing, PaginatedResponse } from "@/lib/types";

export async function getListings(
  page: number,
  limit: number,
  search?: string,
): Promise<PaginatedResponse<Listing>> {
  const { data } = await api.get<PaginatedResponse<Listing>>("/listings", {
    params: {
      page,
      limit,
      ...(search?.trim() && { search }),
    },
  });

  return data;
}

export async function getListing(id: string) {
  const {data} = await api.get<Listing>(`/listings/${id}`);
 return data;
}

export async function saveListing(
  listing: CreateListingDto,
): Promise<CreateListingDto> {
  const { data } = await api.post<CreateListingDto>("/listings", listing);
  return data;
}

export async function deleteListing(id: number): Promise<Listing> {
  const { data } = await api.delete<Listing>(`/listings/${id}`);
  return data;
}


export async function updateListing(
  id: number,
  listing: Partial<CreateListingDto> // Using Partial allows you to send only what changed
): Promise<Listing> {
  // Using PATCH is the REST standard for partial updates
  const { data } = await api.patch<Listing>(`/listings/${id}`, listing);
  return data;
}