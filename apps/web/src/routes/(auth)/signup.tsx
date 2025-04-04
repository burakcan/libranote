import { createFileRoute } from "@tanstack/react-router";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const Route = createFileRoute("/(auth)/signup")({
  component: RouteComponent,
});

function RouteComponent() {
  return <SignUpForm />;
}
