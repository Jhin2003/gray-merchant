export type CardData = {
  id: number;
  scryfallId: string;
  name: string;
  imageUrl: string | null;
  setName: string;
};


export type CreateListingDto = {
  cardId: number;
  stock: number;
  price: number;
  condition: string;
  language: string;
  isFoil: boolean;
};

export interface Listing {
  id: number;
  cardId: number;

  cardName: string;
  setName: string;

  stock: number;
  price: number;

  condition: string;
  language: string;
  isFoil: boolean;

  createdAt: string;
  card: CardData;
}