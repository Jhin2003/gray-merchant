import { CreateOrder } from "../types";
import { api } from "./axios";

export async function saveOrder(order: CreateOrder): Promise<CreateOrder> {
  const { data } = await api.post<CreateOrder>("/orders", order);
  return data;
}
