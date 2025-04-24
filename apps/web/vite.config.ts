import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import dotenv from "dotenv";
import path from "path";
import { defineConfig, PluginOption } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

dotenv.config();

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      target: "react",
      autoCodeSplitting: true,
    }) as PluginOption,
    tailwindcss(),
    react(),
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "LibraNote",
        short_name: "LibraNote",
        description: "A note-taking app",
        display: "standalone",
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: `${process.env.VITE_API_URL}/api/auth/get-session`,
            handler: "NetworkFirst",
            options: {
              cacheName: "session",
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "NetworkFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 50,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3010,
    allowedHosts: ["localhost", "127.0.0.1", "libranote.relaymate.com"],
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
});
