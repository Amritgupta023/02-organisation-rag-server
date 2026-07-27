import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat.routes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Organisation RAG server is running",
  });
});

app.use("/api/chat", chatRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;