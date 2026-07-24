type NavbarProps = {
  title?: string;
};

export default function Navbar({
  title = "Gray Merchant",
}: NavbarProps) {
  return (
    <nav className="w-full  text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
       
       <h1 className="text-xl font-bold text-gray-200">
  {title}
</h1>

        <div className="flex items-center gap-6">
          <a
            href="/shop"
            className="transition-colors hover:text-gray-300"
          >
            MTG Singles
          </a>

          <a
            href="/shop/products"
            className="transition-colors hover:text-gray-300"
          >
            Sealed and Accessories  
          </a>

          <a
            href="/shop/cart"
            className="transition-colors hover:text-gray-300"
          >
            Cart
          </a>
        </div>
      </div>
    </nav>
  );
}