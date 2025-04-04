"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
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
import { invalidateSessionQuery } from "@/hooks/useSessionQuery";
import { authClient } from "@/lib/authClient";

export function SignUpForm() {
  const queryClient = useQueryClient();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    await authClient.signUp.email({ email, password, name });

    invalidateSessionQuery(queryClient);
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Sign up</CardTitle>
        <CardDescription>Create an account</CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <Button variant="outline" className="w-full" type="button">
                Sign up with Apple
              </Button>
              <Button variant="outline" className="w-full" type="button">
                Sign up with Google
              </Button>
            </div>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-card text-muted-foreground relative z-10 px-2">
                Continue with email
              </span>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Sign up
              </Button>
            </form>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/signin" className="underline underline-offset-4">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
