"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

type AuthActionState = {
  formData: FormData | null;
  error: boolean;
  success: boolean;
};

export async function signUpWithEmailAndPassword(
  prevState: AuthActionState,
  formData: FormData | null
): Promise<AuthActionState> {
  "use server";

  if (!formData) {
    return {
      formData,
      error: true,
      success: false,
    };
  }

  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (!email || !password || !name || !confirmPassword) {
    return {
      formData,
      error: true,
      success: false,
    };
  }

  if (password !== confirmPassword) {
    return {
      formData,
      error: true,
      success: false,
    };
  }

  const response = await auth.api.signUpEmail({
    body: {
      name: name as string,
      email: email as string,
      password: password as string,
    },
    asResponse: true,
  });

  if (response.status === 200) {
    redirect("/dashboard");
  }

  return {
    formData,
    error: true,
    success: false,
  };
}

export async function signInWithEmailAndPassword(
  prevState: AuthActionState,
  formData: FormData | null
): Promise<AuthActionState> {
  "use server";

  if (!formData) {
    return {
      formData,
      error: true,
      success: false,
    };
  }

  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    return {
      formData,
      error: true,
      success: false,
    };
  }

  const response = await auth.api.signInEmail({
    body: {
      email: email as string,
      password: password as string,
      callbackURL: "/dashboard",
    },
    asResponse: true,
  });

  if (response.status === 200) {
    redirect("/dashboard");
  }

  return {
    formData,
    error: true,
    success: false,
  };
}

export async function forgotPassword(
  prevState: AuthActionState,
  formData: FormData | null
): Promise<AuthActionState> {
  "use server";

  if (!formData) {
    return {
      formData,
      error: true,
      success: false,
    };
  }

  const email = formData.get("email");

  if (!email) {
    return {
      formData,
      error: true,
      success: false,
    };
  }

  const response = await auth.api.forgetPassword({
    body: {
      email: email as string,
    },
    asResponse: true,
  });

  if (response.status === 200) {
    return {
      formData,
      error: false,
      success: true,
    };
  }

  return {
    formData,
    error: true,
    success: false,
  };
}
