import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    CLERK_SECRET_KEY: z.string().min(1).default("sk_test_devplaceholder"),
    STRIPE_SECRET_KEY: z.string().min(1).default("sk_test_devplaceholder"),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).default("whsec_devplaceholder"),
    ADMIN_SECRET_PATH: z.string().default("platform-admin"),
    DEV_MODE: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional().default(""),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
      .string()
      .default("pk_test_devplaceholder"),
    NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
    NEXT_PUBLIC_DEV_MODE: z.string().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    ADMIN_SECRET_PATH: process.env.ADMIN_SECRET_PATH,
    DEV_MODE: process.env.DEV_MODE,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_DEV_MODE: process.env.NEXT_PUBLIC_DEV_MODE,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: false,
});
