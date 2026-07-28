import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 text-gray-400">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <h2 className="text-xl font-bold text-white">
              Gray Merchant
            </h2>
            <p className="mt-3 text-sm leading-6">
              Your trusted marketplace for Magic: The Gathering singles,
              sealed products, and accessories.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="mb-4 font-semibold text-white">
              Shop
            </h3>

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
            <h3 className="mb-4 font-semibold text-white">
              Support
            </h3>

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

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-semibold text-white">
              Contact
            </h3>

            <div className="space-y-2 text-sm">
              <p>Email: support@graymerchant.com</p>
              <p>Mon – Fri</p>
              <p>9:00 AM – 6:00 PM</p>
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