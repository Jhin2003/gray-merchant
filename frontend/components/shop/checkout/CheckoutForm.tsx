"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/context/CartContext";
import { CreateOrder, PaymentMethod, ShippingMode } from "@/lib/types";
import { saveOrder } from "@/lib/api/orders";

interface Props {
  onSuccess: () => void;
  onShippingChange: (fee: number) => void;
  onTermsChange: (accepted: boolean) => void;
}

export default function CheckoutForm({
  onSuccess,
  onShippingChange,
  onTermsChange,
}: Props) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { cart, subtotal } = useCart(); // Assuming your cart context provides these

 // 1. Change the parameter type to React.FormEvent
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // 2. STOP the browser from refreshing the page!
    e.preventDefault(); 
    setIsLoading(true);

    try {
      // 3. Extract the data from the native form event
      const formElement = e.currentTarget;
      const formData = new FormData(formElement);

      const orderItems = cart.map((item) => ({
        listingId: item.listing.id,
        quantity: item.quantity, // Make sure this is item.quantity, not item.listing.stock!
        priceAtPurchase: item.listing.price,
      }));

      // 4. Build the payload using formData.get("nameAttribute")
      const payload: CreateOrder = {
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,

        streetAddress: formData.get("streetAddress") as string,
        barangay: formData.get("barangay") as string,
        city: formData.get("city") as string, // Fixed this line!
        province: formData.get("province") as string,
        postalCode: formData.get("postalCode") as string,

        // Note: Make sure the names here match your input names!
        paymentMethod: formData.get("payment") as PaymentMethod, 
        shippingMode: formData.get("shippingMode") as ShippingMode,
        subtotal: subtotal, 
        // Need to calculate shipping fee locally since it's not a direct form input value
        shippingFee: (formData.get("shippingMode") === "LBC" || formData.get("shippingMode") === "JNT") ? 120 : 0,
        total: subtotal + ((formData.get("shippingMode") === "LBC" || formData.get("shippingMode") === "JNT") ? 120 : 0),

        items: orderItems,
      };
        console.log(payload);
      const response = await saveOrder(payload);
      console.log(response);
      
      // Pass the real order number to onSuccess if your response returns it
      onSuccess(); 
      
    } catch (error) {
      console.error("Failed to submit order:", error);
      // Handle error state here
    } finally {
      setIsLoading(false);
    }
  };
  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "lbc" || value === "jnt") {
      onShippingChange(120); // Add 120 for LBC/J&T
    } else {
      onShippingChange(0); // 0 for Book Own
    }
  };


  const paymentDetailsBlock = (
    <div className="ml-7 mb-3 mt-1 rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-800/50">
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Scan the QR code below using your banking app, or send the payment
        directly to the account details provided.
      </p>

      <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900">
        <img
          src="/placeholder.png"
          alt="QR Code Placeholder"
          className="max-h-full max-w-full p-2 object-contain opacity-50"
        />
      </div>

      <div className="mt-4 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <p>Account Name: Miguel Layos</p>
        <p>Account Number: 0927 451 8978</p>
      </div>
    </div>
  );

  return (
    <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
      <Link
        href="/shop/cart"
        className="group mb-8 flex w-fit items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      >
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to Cart
      </Link>

      {/* --- Shipping Information --- */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-white">
          Shipping Information
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              First Name
            </label>
            <input
              required
              type="text"
              name="firstName"
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-4 py-2.5 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:text-white"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Last Name
            </label>
            <input
              required
              type="text"
              name="lastName"
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-4 py-2.5 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:text-white"
            />
          </div>

          <div className="col-span-2 sm:col-span-1 mt-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Email Address
            </label>
            <input
              required
              type="email"
              name="email"
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-4 py-2.5 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:text-white"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 mt-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Phone Number
            </label>
            <input
              required
              type="tel"
              name="phone"
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-4 py-2.5 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:text-white"
            />
          </div>

          <div className="col-span-2 mt-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Street Address
            </label>
            <input
              required
              type="text"
              name="streetAddress"
              placeholder="Street, Barangay, Building/House No."
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-4 py-2.5 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:text-white"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Barangay
            </label>
            <input
              required
              type="text"
              name="barangay"
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-4 py-2.5 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:text-white"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              City / Municipality
            </label>
            <input
              required
              type="text"
              name="city"
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-4 py-2.5 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:text-white"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Province
            </label>
            <input
              required
              type="text"
              name="province"
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-4 py-2.5 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:text-white"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Postal Code
            </label>
            <input
              required
              type="text"
              name="postalCode"
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-4 py-2.5 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* --- Mode of Shipment --- */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-white">
          Mode of Shipment
        </h2>

        <div className="space-y-3">
          <label className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 cursor-pointer hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50">
            <input
              required
              type="radio"
              name="shippingMode"
              value="LBC"
              onChange={handleShippingChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-zinc-900 dark:text-white">
              LBC Express (+120)
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 cursor-pointer hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50">
            <input
              required
              type="radio"
              name="shippingMode"
              value="jnt"
              onChange={handleShippingChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-zinc-900 dark:text-white">
              J&T Express (+120)
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 cursor-pointer hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50">
            <input
              required
              type="radio"
              name="shippingMode"
              value="own_delivery"
              onChange={handleShippingChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex flex-col">
              <span className="font-medium text-zinc-900 dark:text-white">
                Book your own rider
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Grab, Lalamove, Borzo (Buyer books and pays delivery fee)
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* --- Payment Options --- */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-white">
          Payment Method
        </h2>

        <div className="space-y-3">
          {/* GCash Option */}
          <label className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 cursor-pointer hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50">
            <input
              required
              type="radio"
              name="payment"
              value="GCASH"
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-zinc-900 dark:text-white">
              GCash
            </span>
          </label>

          {/* Renders the QR block right under GCash if selected */}
          {paymentMethod === "gcash" && paymentDetailsBlock}

          {/* MariBank Option */}
          <label className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 cursor-pointer hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50">
            <input
              required
              type="radio"
              name="payment"
              value="maribank"
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-zinc-900 dark:text-white">
              MariBank
            </span>
          </label>

          {/* Renders the QR block right under MariBank if selected */}
          {paymentMethod === "maribank" && paymentDetailsBlock}
        </div>
      </div>

      {/* --- Terms and Conditions --- */}
      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            required
            type="checkbox"
            name="terms"
            onChange={(e) => onTermsChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            I agree to the{" "}
            <Link
              href="/terms"
              className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>
      </div>
    </form>
  );
}
