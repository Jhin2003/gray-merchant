"use client";

import { useCart } from "@/lib/context/CartContext";

interface Props {
  shippingFee: number;
  termsAccepted: boolean;
}

export default function OrderSummary({ shippingFee, termsAccepted }: Props) {
  const { cart } = useCart();
  
  const subtotal = cart.reduce((sum, item) => sum + item.listing.price * item.quantity, 0);
  const total = subtotal + shippingFee;

  return (
    <div className="sticky top-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-6 text-xl font-bold text-zinc-900 dark:text-white">Order Summary</h2>
      
      {/* Items List */}
      <div className="mb-6 max-h-[400px] space-y-4 overflow-y-auto pr-2">
        {cart.map((item, index) => (
          <div key={index} className="flex gap-4">
            <div className="h-16 w-12 shrink-0 rounded bg-zinc-100 dark:bg-zinc-800">
              <img 
                src={item.listing.card.imageUrl ?? "/placeholder.png"} 
                alt={item.listing.card.name} 
                className="h-full w-full object-contain p-1" 
              />
            </div>

            <div className="flex flex-1 flex-col justify-center">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white line-clamp-1">
                {item.listing.card.name}
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                {item.listing.card.setName}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {item.listing.condition} {item.listing.isFoil && "• Foil"}
              </p>
            </div>

            <div className="flex flex-col items-end justify-center text-right">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                ₱{(item.listing.price * item.quantity).toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {item.quantity} x ₱{item.listing.price.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-3 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
        <div className="flex justify-between">
          <span className="text-zinc-500">Subtotal</span>
          <span className="font-medium text-zinc-900 dark:text-white">
            ₱{subtotal.toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-zinc-500">Shipping</span>
          <span className="font-medium text-zinc-900 dark:text-white">
            {shippingFee === 0 ? "Calculated/Free" : `₱${shippingFee.toLocaleString()}`}
          </span>
        </div>
        
        <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-zinc-900 dark:text-white">Total</span>
            <span className="text-2xl font-black text-blue-600">
              ₱{total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Submit Button */}
      <button 
        type="submit" 
        form="checkout-form" 
        disabled={!termsAccepted}
        className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:active:scale-100"
      >
        {termsAccepted ? "Place Order" : "Accept terms to continue"}
      </button>
    </div>
  );
}