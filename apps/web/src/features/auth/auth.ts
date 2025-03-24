import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { createCollection } from "@/features/collections/collections.db";
import { createNote } from "@/features/notes/db/notes.db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const newSession = ctx.context.newSession;
      const userId = newSession?.user.id;

      if (userId) {
        const collection = await createCollection(userId, "Personal");
        await createNote(
          userId,
          collection.id,
          "New Note",
          "This is a new note"
        );
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
