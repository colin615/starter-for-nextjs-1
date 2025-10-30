import { Navigation } from "@/components/auth.jsx";
import "./app.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/providers";

export const metadata = {
  metadataBase: new URL("https://wagerdash.app"),
  title: {
    default: "WagerDash",
    template: "%s | WagerDash",
  },
  description: "The Dashboard for Streaming Success",
  applicationName: "WagerDash",
  keywords: [
    "wagerdash",
    "streaming",
    "dashboard",
    "wager tracking",
    "streaming success",
  ],
  authors: [{ name: "WagerDash" }],
  creator: "WagerDash",
  publisher: "WagerDash",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.json",
  themeColor: "#E86618",
  colorScheme: "dark",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://wagerdash.app",
    siteName: "WagerDash",
    title: "WagerDash",
    description: "The Dashboard for Streaming Success",
    images: [
      {
        url: "/icon-small.png",
        width: 512,
        height: 512,
        alt: "WagerDash Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "WagerDash",
    description: "The Dashboard for Streaming Success",
    images: ["/icon.png"],
    creator: "@wagerdash",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WagerDash",
  },
  other: {
    "msapplication-TileColor": "#E86618",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code&family=Montserrat:wght@100..900&family=Poppins:wght@300;400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={"dark min-h-screen bg-stone-950 font-[Montserrat] text-sm"}
      >
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "transparent",
              boxShadow: "none",
              padding: 0,
              marginRight: "4.5rem",
              color: "inherit",
            },
          }}
        />
      </body>
    </html>
  );
}
