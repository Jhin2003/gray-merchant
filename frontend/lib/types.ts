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

// types/order.ts

export interface OrderItem {
  listingId: number;
  quantity: number;
  priceAtPurchase: number;
}

export type PaymentMethod = 'GCASH' | 'MARIBANK';
export type ShippingMode = 'LBC' | 'JNT'| 'OWN_DELIVERY';

export interface CreateOrder {
  // Customer Contact
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  
  // Shipping Address
  streetAddress: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;

  // Order Details
  paymentMethod: PaymentMethod; // Or your specific enum e.g., 'BANK_TRANSFER' | 'CASH'
  shippingMode: ShippingMode;  // Or your specific enum e.g., 'STANDARD' | 'EXPRESS'
  
  // Financials
  subtotal: number;
  shippingFee: number;
  total: number;

  // Relations
  items: OrderItem[];
  userId?: string; // Optional if guest checkout is allowed
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string; // e.g., 'PENDING_PAYMENT'
  total: number;
  items: OrderItem[];
  createdAt: string;
}
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}