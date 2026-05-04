export const metadata = {
  title: "Customer Login",
  description:
    "Sign in to your MelaChow customer account to order Nigerian meals from local restaurants.",
  alternates: {
    canonical: "https://www.melachow.com/auth/signin",
  },
  openGraph: {
    title: "Customer Login | MelaChow",
    description:
      "Access your MelaChow customer account and continue ordering food online.",
    url: "https://www.melachow.com/auth/signin",
    images: [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "MelaChow" }],
  },
};

export default function CustomerSigninLayout({ children }) {
  return children;
}
