import cors from "cors";
import express from "express";
import chatRoutes from "./routes/chat.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import documentRoutes from "./routes/document.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Organisation RAG server is running",
  });
});

app.use("/api/chat", chatRoutes);

app.use(
  "/api/conversations",
  conversationRoutes,
);

app.use(
  "/api/documents",
  documentRoutes,
);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorMiddleware);

export default app;