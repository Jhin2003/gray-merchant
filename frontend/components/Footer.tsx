import { Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { FaFacebook, FaTiktok } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 pt-16 pb-8 dark:border-zinc-800/80 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Brand & Info */}
          <div className="flex flex-col space-y-4 lg:pr-8">
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              Gray Merchant
            </h2>
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Your premium marketplace for Magic: The Gathering singles, sealed products, and elite accessories.
            </p>
            <div className="mt-2 flex flex-col space-y-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-2">
                {/* Added shrink-0 here */}
                <Phone className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-500" />
                <span>+63 927 451 8978</span>
              </span>
              
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Shop
            </h3>
            <ul className="space-y-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <li>
                <Link href="/products" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/new-arrivals" className="flex items-center gap-2 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  New Arrivals
                  <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                    NEW
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/sale" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Support
            </h3>
            <ul className="space-y-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <li>
                <Link href="/faq" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/returns" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Connect With Us
            </h3>
            <div className="flex gap-4">
              <Link
                href="https://facebook.com/graymerchant"
                target="_blank"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-200/50 text-zinc-600 transition-all hover:bg-[#1877F2] hover:text-white hover:shadow-lg hover:shadow-[#1877F2]/30 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-[#1877F2] dark:hover:text-white"
                aria-label="Facebook"
              >
                <FaFacebook className="h-5 w-5" />
              </Link>

              <Link
                href="https://tiktok.com/@graymerchant"
                target="_blank"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-200/50 text-zinc-600 transition-all hover:bg-black hover:text-white hover:shadow-lg hover:shadow-black/30 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-white dark:hover:text-black"
                aria-label="TikTok"
              >
                <FaTiktok className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between border-t border-zinc-200/80 pt-8 text-center md:flex-row md:text-left dark:border-zinc-800/80">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-500">
            © {new Date().getFullYear()} Gray Merchant. All rights reserved.
          </p>
          <p className="mt-4 text-xs text-zinc-400 md:mt-0 md:max-w-md md:text-right dark:text-zinc-600">
            Magic: The Gathering is TM and copyright Wizards of the Coast, Inc, a subsidiary of Hasbro, Inc. All rights reserved. This site is unaffiliated.
          </p>
        </div>
      </div>
    </footer>
  );
}