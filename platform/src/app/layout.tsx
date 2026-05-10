import "~/styles/globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Esfija Platform",
  description: "Pre-order platform for small food businesses",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const useClerk = !!clerkKey && clerkKey.startsWith("pk_");

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const body = (
    <html lang="en" className={`${geist.variable}`}>
      <body className="bg-gray-50 font-sans antialiased">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );

  if (useClerk) {
    return <ClerkProvider>{body}</ClerkProvider>;
  }

  return body;
}
