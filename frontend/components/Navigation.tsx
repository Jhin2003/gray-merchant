import DesktopNavbar from "./Navbar";
import MobileNavbar from "./MobileNavbar";

type NavigationProps = {
  title?: string;
};

export default function Navigation({
  title = "Gray Merchant",
}: NavigationProps) {
  return (
    <>
      <div className="hidden md:block">
        <DesktopNavbar title={title} />
      </div>

      <div className="md:hidden">
        <MobileNavbar />
      </div>
    </>
  );
}