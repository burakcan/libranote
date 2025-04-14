import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { env } from "./env.js";

// Import routes
import collectionRoutes from "./routes/collection-routes.js";
import noteRoutes from "./routes/note-routes.js";
import sseRoutes from "./routes/sse-routes.js";
import ydocStateRoutes from "./routes/ydocstate-routes.js";
import { handleWebhook } from "./controllers/sse-controller.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

// CORS configuration
app.use(
  cors({
    origin: env.AUTH_TRUSTED_ORIGINS.split(","),
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

// Better Auth handler
app.all("/api/auth/*", toNodeHandler(auth));

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Mount API routes
app.use("/api/collections", collectionRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/sse", sseRoutes);
app.use("/api/ydocstates", ydocStateRoutes);
app.post("/api/webhook/sse", handleWebhook);

// Error handling middleware
app.use(errorHandler);

// Start the server
app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on port ${env.PORT}`);
});
