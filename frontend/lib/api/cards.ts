import { api } from "@/lib/api/axios";
import { CardData } from "@/lib/types";

export async function searchCards(query: string): Promise<CardData[]> {
  const { data } = await api.get<CardData[]>("/cards/search", {
    params: {
      q: query,
    },
  });

  return data;
}