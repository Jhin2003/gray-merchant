// app/checkout/page.tsx (or wherever your checkout page is)
"use client";

import { useState } from "react";
import { useCart } from "@/lib/context/CartContext";
import CheckoutForm from "@/components/shop/checkout/CheckoutForm";
import OrderSummary from "@/components/shop/checkout/CheckoutSummary";
import CheckoutSuccess from "@/components/shop/checkout/CheckoutSuccessModal";

export default function CheckoutPage() {
  const { clearCart } = useCart();
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  // 1. Success State View
  if (isSuccess) {
    return <CheckoutSuccess orderId={orderId} />;
  }

  // 2. Main Checkout State
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <CheckoutForm
              onSuccess={() => {
                // Generate a random mock order ID (e.g., ORD-739218)
                const generatedId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
                setOrderId(generatedId);
                setIsSuccess(true);
                clearCart();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onShippingChange={setShippingFee}
              onTermsChange={setTermsAccepted}
            />
          </div>

          <div className="lg:col-span-5">
            <OrderSummary 
              shippingFee={shippingFee} 
              termsAccepted={termsAccepted} 
            />
          </div>
        </div>
      </div>
    </main>
  );
}