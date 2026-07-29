import {
  getQdrantCollectionInfo,
  getQdrantPoints,
} from "../services/qdrant.service.js";

export async function getQdrantInfoController(req, res) {
  try {
    const collectionInfo =
      await getQdrantCollectionInfo();

    return res.status(200).json({
      success: true,
      data: collectionInfo,
    });
  } catch (error) {
    console.error(
      "Get Qdrant collection info error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to retrieve Qdrant collection information",
    });
  }
}

export async function getQdrantPointsController(req, res) {
  try {
    const requestedLimit =
      Number.parseInt(req.query.limit, 10);

    const limit =
      Number.isInteger(requestedLimit) &&
      requestedLimit > 0
        ? Math.min(requestedLimit, 50)
        : 5;

    const points =
      await getQdrantPoints({
        limit,
      });

    return res.status(200).json({
      success: true,
      data: {
        count: points.length,
        points,
      },
    });
  } catch (error) {
    console.error(
      "Get Qdrant points error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to retrieve Qdrant points",
    });
  }
}