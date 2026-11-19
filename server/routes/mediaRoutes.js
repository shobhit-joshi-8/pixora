import { Router } from "express";

import { requireAuth } from "../middleware/auth.js";

import { upload } from "../middleware/upload.js";

import {
    uploadMedia,
    getMedia,
    getTrash,
    emptyTrash,
    getStorageStats,
    toggleFavorite,
    toggleTrash,
    deleteMediaPermanent,
} from "../controllers/mediaController.js";

const mediaRouter = Router();

// Authentication middleware
mediaRouter.use(requireAuth);

// Media Routes
mediaRouter.post("/upload", upload.array("media", 20), uploadMedia);

mediaRouter.get("/", getMedia);

mediaRouter.get("/trash", getTrash);

mediaRouter.delete("/trash/empty", emptyTrash);

mediaRouter.get("/stats", getStorageStats);

mediaRouter.patch("/:id/favorite", toggleFavorite);

mediaRouter.patch("/:id/trash", toggleTrash);

mediaRouter.delete("/:id", deleteMediaPermanent);

export default mediaRouter;