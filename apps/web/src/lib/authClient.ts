import {
  emailOTPClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
  plugins: [
    inferAdditionalFields<{
      user: {
        additionalFields: {
          onboardingFinished: {
            type: "boolean";
          };
        };
      };
    }>(),
    emailOTPClient(),
  ],
});
