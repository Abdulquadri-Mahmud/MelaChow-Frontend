export const metadata = {
  title: "FAQs — MelaChow Help & Support",
  description:
    "Got questions about MelaChow? Find answers to common questions about how to order, delivery times, payments, vendor registration, and more.",
  alternates: {
    canonical: "https://melachow.vercel.app/faqs",
  },
  openGraph: {
    title: "FAQs — MelaChow Help & Support",
    description: "Find answers to your questions about MelaChow food delivery.",
    url: "https://melachow.vercel.app/faqs",
    images: [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "MelaChow FAQs" }],
  },
};

export default function FaqsLayout({ children }) {
  return children;
}
