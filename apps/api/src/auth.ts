import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// import { createAuthMiddleware } from "better-auth/api";
import { jwt } from "better-auth/plugins";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "./db/prisma.js";
import { env } from "./env.js";
import { emailService } from "./services/email/index.js";
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
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      try {
        await emailService.sendPasswordResetEmail({
          to: user.email,
          userName: user.name || user.email,
          resetUrl: url,
          appName: "LibraNote",
        });
        console.log("Password reset email sent successfully to:", user.email);
      } catch (error) {
        console.error("Failed to send password reset email:", error);
        throw error;
      }
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
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
  trustedOrigins: env.AUTH_TRUSTED_ORIGINS.split(","),
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
    jwt({
      jwt: {
        // 5 minutes
        expirationTime: "15m",
        definePayload: (session) => {
          return {
            userId: session.user.id,
          };
        },
      },
    }),
    emailOTP({
      otpLength: 6,
      expiresIn: 900, // 15 minutes in seconds
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        try {
          // Get user from database to get their actual name
          const user = await prisma.user.findUnique({
            where: { email },
            select: { name: true, email: true },
          });

          const userName = user?.name || email.split("@")[0] || "User";

          await emailService.sendOTPEmail({
            to: email,
            userName: userName,
            otp: otp,
            appName: "LibraNote",
            type: type,
          });
          console.log(`OTP email sent successfully to: ${email}, type: ${type}`);
        } catch (error) {
          console.error("Failed to send OTP email:", error);
          throw error;
        }
      },
    }),
  ],
});
