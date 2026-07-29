import "dotenv/config";
import app from "./app.js";
import {connectDatabase} from "./config/database.js";
import {
  ensureQdrantCollection,
} from "./services/qdrant.service.js";

const PORT =
  process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDatabase();

    console.log(
      "MongoDB connected successfully",
    );

    await ensureQdrantCollection();

    console.log(
      "Qdrant connected successfully",
    );

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error(
      "Unable to start server:",
      error,
    );

    process.exit(1);
  }
}

startServer();