import { z } from "zod";
import { adminProcedure, createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  syncMe: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.user.upsert({
        where: { id: ctx.userId },
        update: { email: input.email, name: input.name },
        create: {
          id: ctx.userId,
          email: input.email,
          name: input.name,
          role: "CUSTOMER",
        },
      });
    }),

  getMe: protectedProcedure.query(({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.userId },
      include: { managedBusiness: true },
    });
  }),

  setRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["PLATFORM_ADMIN", "VENDOR", "CUSTOMER"]),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });
    }),

  listAll: adminProcedure.query(({ ctx }) => {
    return ctx.db.user.findMany({
      include: { managedBusiness: true },
      orderBy: { createdAt: "desc" },
    });
  }),
});
