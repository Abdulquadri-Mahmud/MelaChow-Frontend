export const metadata = {
  title: "Register Your Restaurant",
  description:
    "Apply to join MelaChow as a restaurant vendor and start receiving food delivery orders from local customers.",
  alternates: {
    canonical: "https://www.melachow.com/vendors/auth/register",
  },
  openGraph: {
    title: "Register Your Restaurant | MelaChow",
    description: "Join MelaChow as a restaurant partner.",
    url: "https://www.melachow.com/vendors/auth/register",
    images: [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "MelaChow Vendor Registration" }],
  },
};

export default function VendorRegisterLayout({ children }) {
  return children;
}
