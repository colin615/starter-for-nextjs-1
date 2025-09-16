import Navigation from "@/components/auth/Navigation";
import "./app.css";

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
        <link rel="icon" type="image/svg+xml" href="/appwrite.svg" />
      </head>
      <body
        className={
          "min-h-screen bg-stone-950 dark font-[Montserrat] text-sm text-[#56565C]"
        }
      >
        {children}
      </body>
    </html>
  );
}
