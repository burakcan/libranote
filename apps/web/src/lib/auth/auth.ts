import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { createCollection } from "@/lib/db/collection";
import { createNote } from "@/lib/db/notes";
import { prisma } from "@/lib/db/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const path = ctx.path;
      const newSession = ctx.context.newSession;
      const userId = newSession?.user.id;

      if (userId && path.startsWith("/sign-up")) {
        const collection = await createCollection({
          userId,
          title: "Personal",
        });

        await createNote({
          userId,
          collectionId: collection.id,
          title: "New Note",
          description: "This is a new note",
        });
      }
    }),
  },
  plugins: [
    nextCookies(),
    jwt({
      jwt: {
        expirationTime: "1h",
      },
    }),
  ],
});
