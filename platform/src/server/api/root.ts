import { businessRouter } from "~/server/api/routers/business";
import { eventRouter } from "~/server/api/routers/event";
import { ingredientRouter } from "~/server/api/routers/ingredient";
import { menuRouter } from "~/server/api/routers/menu";
import { orderRouter } from "~/server/api/routers/order";
import { recipeRouter } from "~/server/api/routers/recipe";
import { userRouter } from "~/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  business: businessRouter,
  event: eventRouter,
  menu: menuRouter,
  order: orderRouter,
  recipe: recipeRouter,
  ingredient: ingredientRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
