import express from "express";
import {
  getQdrantInfoController,
  getQdrantPointsController,
} from "../controllers/qdrant.controller.js";

const router = express.Router();

router.get(
  "/qdrant/info",
  getQdrantInfoController,
);

router.get(
  "/qdrant/points",
  getQdrantPointsController,
);

export default router;