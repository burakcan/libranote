import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/goodbye")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <img src="/fox.png" alt="Fox" className="w-12 h-12" />
      <h1 className="text-2xl font-bold">Goodbye</h1>
      <p className="text-sm text-gray-500">
        We're sorry to see you go but no hard feelings! Bon voyage!
      </p>
    </div>
  );
}
