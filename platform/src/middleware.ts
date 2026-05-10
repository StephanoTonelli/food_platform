import { NextResponse, type NextRequest } from "next/server";

const DEV_MODE = process.env.DEV_MODE === "true";
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const hasClerk = clerkKey.startsWith("pk_live_") || clerkKey.startsWith("pk_test_");

export async function middleware(req: NextRequest) {
  if (DEV_MODE || !hasClerk) {
    return NextResponse.next();
  }

  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );

  const isVendorRoute = createRouteMatcher(["/dashboard(.*)"]);
  const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
  const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/admin-access(.*)",
    "/:businessSlug(.*)",
    "/api/webhooks(.*)",
  ]);

  return clerkMiddleware(async (auth, request) => {
    if (isPublicRoute(request)) return NextResponse.next();
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signInUrl);
    }
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    if (isAdminRoute(request) && role !== "PLATFORM_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (
      isVendorRoute(request) &&
      role !== "VENDOR" &&
      role !== "PLATFORM_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  })(req, {} as never);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
