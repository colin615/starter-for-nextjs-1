import { Navigation } from "@/components/auth";
import "./app.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/providers";

export const metadata = {
  title: "Appwrite + Next.js",
  description: "Secure authentication with Appwrite and Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
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
