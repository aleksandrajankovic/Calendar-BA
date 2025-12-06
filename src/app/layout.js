import { Roboto, Roboto_Condensed } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const roboto = Roboto({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});
const robotoCondensed = Roboto_Condensed({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto-condensed",
});

export const metadata = {
  metadataBase: new URL("https://calendar.meridianbet.ba"),
  title: "Kalendar promocija | Meridianbet",
  description:
    "Budite u toku s dnevnim ponudama, otkrijte nove promocije i iskoristite ekskluzivne nagrade uz Meridianbet Kalendar promocija.",
  alternates: {
    canonical: "/", // jer je projekat na subdomenu calendar.meridianbet.ba
  },
  openGraph: {
    title: "Kalendar promocija | Meridianbet",
    description:
      "Budite u toku s dnevnim ponudama, otkrijte nove promocije i iskoristite ekskluzivne nagrade uz Meridianbet Kalendar promocija.",
    url: "/", // putanja unutar subdomena
    siteName: "Meridianbet",
    images: [
      {
        url: "https://cloud.merbet.com/Preview-image/calendar-universal.png",
        width: 1200,
        height: 630,
        alt: "Kalendar promocija",
      },
    ],
    locale: "bs_BA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kalendar promocija | Meridianbet",
    description:
      "Budite u toku s dnevnim ponudama, otkrijte nove promocije i iskoristite ekskluzivne nagrade uz Meridianbet Kalendar promocija.",
    images: ["https://cloud.merbet.com/Preview-image/calendar-universal.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/src/app/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} ${robotoCondensed.variable} min-h-screen`}
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{ style: { background: "#fff", color: "#333" } }}
        />
      </body>
    </html>
  );
}
