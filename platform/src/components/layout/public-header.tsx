"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";

const devMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const hasClerk = !devMode && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_");

interface PublicHeaderProps {
  businessName?: string;
  businessSlug?: string;
}

function ClerkHeader() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAuth, SignInButton, UserButton } = require("@clerk/nextjs") as typeof import("@clerk/nextjs");
  const { isSignedIn } = useAuth();
  return (
    <div className="flex items-center gap-3">
      {isSignedIn ? (
        <>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
          <UserButton />
        </>
      ) : (
        <SignInButton mode="modal">
          <Button variant="secondary" size="sm">Sign In</Button>
        </SignInButton>
      )}
    </div>
  );
}

function DevHeader() {
  return (
    <div className="flex items-center gap-3">
      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
        Dev Mode
      </span>
      <Link href="/dashboard">
        <Button variant="ghost" size="sm">Dashboard</Button>
      </Link>
    </div>
  );
}

export function PublicHeader({ businessName, businessSlug }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href={businessSlug ? `/${businessSlug}` : "/"}
          className="flex items-center gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
            <span className="text-sm font-bold text-white">E</span>
          </div>
          <span className="font-semibold text-gray-900">
            {businessName ?? "Esfija Platform"}
          </span>
        </Link>
        {hasClerk ? <ClerkHeader /> : <DevHeader />}
      </div>
    </header>
  );
}
