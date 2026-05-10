import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "~/server/db";

const DEV_MODE = process.env.DEV_MODE === "true";
const DEV_USER_ID = "dev_user_admin";

async function getDevUser() {
  return db.user.upsert({
    where: { id: DEV_USER_ID },
    update: {},
    create: {
      id: DEV_USER_ID,
      email: "dev@esfija.com",
      name: "Dev Admin",
      role: "PLATFORM_ADMIN",
    },
  });
}

export const createTRPCContext = async (opts: { headers: Headers }) => {
  if (DEV_MODE) {
    const user = await getDevUser();
    return { db, userId: user.id, user, ...opts };
  }

  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  const user = userId
    ? await db.user.findUnique({ where: { id: userId } })
    : null;

  return { db, userId, user, ...opts };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();
  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  const result = await next();
  console.log(`[TRPC] ${path} took ${Date.now() - start}ms`);
  return result;
});

export const publicProcedure = t.procedure.use(timingMiddleware);

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId, user: ctx.user } });
});

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(isAuthed);

const isVendor = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.user.role !== "VENDOR" && ctx.user.role !== "PLATFORM_ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  if (ctx.user.role === "VENDOR") {
    const business = await ctx.db.business.findUnique({
      where: { vendorId: ctx.userId },
    });
    if (!business) throw new TRPCError({ code: "FORBIDDEN" });
    return next({ ctx: { ...ctx, user: ctx.user, business } });
  }

  return next({ ctx: { ...ctx, user: ctx.user, business: null } });
});

export const vendorProcedure = t.procedure
  .use(timingMiddleware)
  .use(isAuthed)
  .use(isVendor);

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.userId || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.user.role !== "PLATFORM_ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = t.procedure
  .use(timingMiddleware)
  .use(isAuthed)
  .use(isAdmin);
