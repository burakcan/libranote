"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { GrApple, GrGoogle } from "react-icons/gr";
import { LuLoader, LuCircleAlert } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmailAndPassword } from "@/lib/server-actions/emailPasswordAuth";

export function SignInForm() {
  const t = useTranslations("auth.signIn");
  const [{ formData, error }, formAction, pending] = useActionState(
    signInWithEmailAndPassword,
    {
      formData: null,
      error: false,
      success: false,
    }
  );

  const defaultValues = {
    email: formData?.get("email") as string,
    password: formData?.get("password") as string,
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t("cardTitle")}</CardTitle>
        <CardDescription>{t("cardDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <Button variant="outline" className="w-full" type="button">
                <GrApple className="size-4" />
                {t("signInWithApple")}
              </Button>
              <Button variant="outline" className="w-full" type="button">
                <GrGoogle className="size-4" />
                {t("signInWithGoogle")}
              </Button>
            </div>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-card text-muted-foreground relative z-10 px-2">
                {t("continueWith")}
              </span>
            </div>
            <form action={formAction} className="grid gap-6">
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground">
                  <LuCircleAlert className="size-4" />
                  {t("invalidEmailOrPassword")}
                </div>
              )}
              <div className="grid gap-3">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  defaultValue={defaultValues.email}
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                    tabIndex={-1}
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  defaultValue={defaultValues.password}
                />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {t("signIn")}
                {pending && <LuLoader className="size-4 animate-spin" />}
              </Button>
            </form>
            <div className="text-center text-sm">
              {t("dontHaveAccount")}{" "}
              <Link href="/signup" className="underline underline-offset-4">
                {t("signUp")}
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
