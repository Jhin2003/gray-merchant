import { Phone } from "lucide-react";
import Link from "next/link";
import { FaFacebook, FaTiktok } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 text-gray-400">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <h2 className="text-xl font-bold text-white">About Us</h2>

            <p className="mt-3 text-sm leading-6">
              Your trusted marketplace for Magic: The Gathering singles, sealed
              products, and accessories.
            </p>

            <p className="mt-2 flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>+63 927 451 8978</span>
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Shop</h3>

            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="hover:text-white">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-white">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/new-arrivals" className="hover:text-white">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/sale" className="hover:text-white">
                  Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Support</h3>

            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Social Media</h3>

            <div className="space-y-3 text-sm">
              <Link
                href="https://facebook.com/graymerchant"
                target="_blank"
                className="flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
              >
                <FaFacebook className="h-4 w-4" />
                <span>Facebook</span>
              </Link>

              <Link
                href="https://tiktok.com/@graymerchant"
                target="_blank"
                className="flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
              >
                <FaTiktok className="h-4 w-4" />
                <span>TikTok</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Gray Merchant. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
