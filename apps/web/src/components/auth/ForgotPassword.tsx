"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
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
import { forgotPassword } from "@/lib/auth/emailPasswordAuth.action";

export function ForgotPassword() {
  const t = useTranslations("auth.forgotPassword");
  const [{ formData, error }, formAction, pending] = useActionState(
    forgotPassword,
    {
      formData: null,
      error: false,
      success: false,
    }
  );

  const defaultValues = {
    email: formData?.get("email") as string,
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
            <form action={formAction} className="grid gap-6">
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground">
                  <LuCircleAlert className="size-4" />
                  {t("invalidEmail")}
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
              <Button type="submit" className="w-full" disabled={pending}>
                {t("resetPassword")}
                {pending && <LuLoader className="size-4 animate-spin" />}
              </Button>
            </form>
            <div className="text-center text-sm">
              Back to{" "}
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
