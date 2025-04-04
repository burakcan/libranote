import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// import { createAuthMiddleware } from "better-auth/api";
import { jwt } from "better-auth/plugins";
import { prisma } from "./db/prisma.js";
import { env } from "./env.js";
// import { createCollection } from "@/lib/db/collection";
// import { createNote } from "@/lib/db/notes";
// import { prisma } from "@/lib/db/prisma";

export const auth = betterAuth({
  secret: env.AUTH_SECRET,
  baseURL: env.PUBLIC_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: env.AUTH_COOKIE_DOMAIN,
    },
    defaultCookieAttributes: {
      secure: true,
      httpOnly: true,
      sameSite: "none", // Allows CORS-based cookie sharing across subdomains
      partitioned: true, // New browser standards will mandate this for foreign cookies
    },
  },
  trustedOrigins: [env.AUTH_TRUSTED_ORIGINS],
  // hooks: {
  //   after: createAuthMiddleware(async (ctx) => {
  //     const path = ctx.path;
  //     const newSession = ctx.context.newSession;
  //     const userId = newSession?.user.id;

  //     if (userId && path.startsWith("/sign-up")) {
  //       const collection = await createCollection({
  //         userId,
  //         title: "Personal",
  //       });

  //       await createNote({
  //         userId,
  //         collectionId: collection.id,
  //         title: "New Note",
  //         description: "This is a new note",
  //       });
  //     }
  //   }),
  // },
  plugins: [
    // jwt({
    //   jwt: {
    //     expirationTime: "1h",
    //   },
    // }),
  ],
});
