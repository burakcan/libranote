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
import { signUpWithEmailAndPassword } from "@/lib/server-actions/emailPasswordAuth";

export function SignUpForm() {
  const t = useTranslations("auth.signUp");
  const [{ formData, error }, formAction, pending] = useActionState(
    signUpWithEmailAndPassword,
    {
      formData: null,
      error: false,
      success: false,
    }
  );

  const defaultValues = {
    name: formData?.get("name") as string,
    email: formData?.get("email") as string,
    password: formData?.get("password") as string,
    confirmPassword: formData?.get("confirmPassword") as string,
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
                {t("signUpWithApple")}
              </Button>
              <Button variant="outline" className="w-full" type="button">
                <GrGoogle className="size-4" />
                {t("signUpWithGoogle")}
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
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  defaultValue={defaultValues.name}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  required
                  defaultValue={defaultValues.email}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  defaultValue={defaultValues.password}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  defaultValue={defaultValues.confirmPassword}
                />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {t("signUp")}
                {pending && <LuLoader className="size-4 animate-spin" />}
              </Button>
            </form>
            <div className="text-center text-sm">
              {t("alreadyHaveAccount")}{" "}
              <Link href="/signin" className="underline underline-offset-4">
                {t("signIn")}
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
