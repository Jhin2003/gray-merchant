// components/shop/checkout/CheckoutSuccess.tsx
import { CheckCircle2, MessageCircle, Mail, QrCode, Building2, Smartphone } from "lucide-react";
import Link from "next/link";

interface CheckoutSuccessProps {
  orderId: string;
}

export default function CheckoutSuccess({ orderId }: CheckoutSuccessProps) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-6 py-20 dark:bg-zinc-950">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm sm:p-12 dark:border-zinc-800 dark:bg-zinc-900">
        <CheckCircle2 className="mx-auto mb-6 h-20 w-20 text-green-500" />
        <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-white">
          Order Placed!
        </h1>
        <p className="mb-6 text-zinc-500 dark:text-zinc-400">
          Thank you for your order. Your Order ID is:
        </p>

        {/* Order ID Display */}
        <div className="mb-8 inline-block rounded-xl bg-zinc-100 px-8 py-4 dark:bg-zinc-800">
          <span className="text-3xl font-black tracking-widest text-zinc-900 dark:text-white">
            {orderId}
          </span>
        </div>

        {/* Payment Details Section */}
        <div className="mb-8 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 text-left dark:border-zinc-800 dark:bg-zinc-900/50">
          <h3 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">
            Payment Details
          </h3>

          <div className="grid gap-6 md:grid-cols-2">
            {/* QR Code Placeholder */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
              <QrCode className="mb-3 h-32 w-32 text-zinc-300 dark:text-zinc-600" />
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Scan QR to Pay
              </span>
            </div>

            {/* Account Details */}
            <div className="flex flex-col justify-center space-y-5">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  <Building2 size={16} className="text-zinc-500" /> Bank Transfer
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                  <p>Bank: <span className="font-medium text-zinc-900 dark:text-zinc-200">Universal Bank</span></p>
                  <p>Name: <span className="font-medium text-zinc-900 dark:text-zinc-200">Your Store Inc.</span></p>
                  <p className="font-mono text-zinc-900 dark:text-white">1234 5678 9012</p>
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  <Smartphone size={16} className="text-zinc-500" /> E-Wallet / Mobile
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                  <p>App: <span className="font-medium text-zinc-900 dark:text-zinc-200">GCash / Venmo / Zelle</span></p>
                  <p>Name: <span className="font-medium text-zinc-900 dark:text-zinc-200">Your Store</span></p>
                  <p className="font-mono text-zinc-900 dark:text-white">+1 234 567 8900</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps / Payment Verification Info */}
        <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 p-6 text-left dark:border-blue-900/30 dark:bg-blue-900/10">
          <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-400">
            Next Step: Payment Verification
          </h3>
          <p className="mb-5 text-sm leading-relaxed text-blue-800 dark:text-blue-300/80">
            To process your order, please send your <strong>Proof of Payment (Screenshot/Receipt)</strong> along with
            your <strong>Order ID ({orderId})</strong> to our official contact channels.
          </p>

          <div className="flex flex-wrap gap-3">
            <a href="#" target="_blank" className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
              <MessageCircle size={18} /> Message Us
            </a>
            <a href="mailto:contact@yourstore.com" className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-800">
              <Mail size={18} /> Email Receipt
            </a>
          </div>
        </div>

        <Link href="/shop" className="block w-full rounded-xl bg-zinc-900 px-6 py-4 font-bold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
          Continue Shopping
        </Link>
      </div>
    </main>
  );
}