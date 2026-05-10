import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import type { UserRole } from "../../generated/prisma";

export async function getAuthUser() {
  const { userId } = await auth();
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function requireRole(role: UserRole) {
  const user = await getAuthUser();
  if (!user || user.role !== role) throw new Error("Forbidden");
  return user;
}

export async function requireVendor() {
  const user = await getAuthUser();
  if (!user || (user.role !== "VENDOR" && user.role !== "PLATFORM_ADMIN")) {
    throw new Error("Forbidden");
  }
  if (user.role === "VENDOR") {
    const business = await db.business.findUnique({
      where: { vendorId: user.id },
    });
    if (!business) throw new Error("No business found for vendor");
    return { user, business };
  }
  return { user, business: null };
}

export async function syncClerkUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();

  return db.user.upsert({
    where: { id: clerkUser.id },
    update: { email, name },
    create: {
      id: clerkUser.id,
      email,
      name,
      role: "CUSTOMER",
    },
  });
}
