export const metadata = {
  title: "Vendor Login",
  description:
    "Sign in to your MelaChow vendor dashboard to manage restaurant orders, menus, payouts, and customer activity.",
  alternates: {
    canonical: "https://www.melachow.com/vendors/auth/login",
  },
  openGraph: {
    title: "Vendor Login | MelaChow",
    description: "Access the MelaChow restaurant vendor dashboard.",
    url: "https://www.melachow.com/vendors/auth/login",
    images: [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "MelaChow Vendor Login" }],
  },
};

export default function VendorLoginLayout({ children }) {
  return children;
}
