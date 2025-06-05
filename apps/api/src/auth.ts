import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { jwt, oAuthProxy } from "better-auth/plugins";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "./db/prisma.js";
import { env } from "./env.js";
import { emailService } from "./services/email/index.js";
import { NoteService } from "./services/note-service.js";
import { nanoid } from "nanoid";

export const auth = betterAuth({
  secret: env.AUTH_SECRET,
  baseURL: env.PUBLIC_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }
        : undefined,

    github:
      env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
        ? {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          }
        : undefined,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: env.REQUIRE_EMAIL_VALIDATION,
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
  user: {
    deleteUser: {
      enabled: true,
      async sendDeleteAccountVerification({ user, url }) {
        await emailService.sendDeleteAccountVerificationEmail({
          to: user.email,
          userName: user.name || user.email,
          deleteUrl: url,
          appName: "LibraNote",
        });
      },
    },
    additionalFields: {
      onboardingFinished: {
        type: "boolean",
      },
    },
  },
  account: {
    accountLinking: {
      allowDifferentEmails: true,
    },
  },
  trustedOrigins: env.AUTH_TRUSTED_ORIGINS.split(","),
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const path = ctx.path;
      const newSession = ctx.context.newSession;
      const userId = newSession?.user.id;

      if (userId && path.startsWith("/sign-up")) {
        await NoteService.createNote(
          userId,
          {
            title: "",
            description: "",
            isPublic: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            id: nanoid(10),
            collectionId: null,
          },
          "",
        );
      }
    }),
  },
  plugins: [
    oAuthProxy(),
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
    env.REQUIRE_EMAIL_VALIDATION
      ? emailOTP({
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
            }
          },
        })
      : undefined,
  ].filter(Boolean) as BetterAuthPlugin[],
});
