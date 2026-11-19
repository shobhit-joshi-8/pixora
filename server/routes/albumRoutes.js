import { Router } from "express";

import { requireAuth } from "../middleware/auth.js";

import {
    addPhotosToAlbum,
    createAlbum,
    deleteAlbum,
    getAlbumById,
    getMyAlbums,
} from "../controllers/albumController.js";

const albumRouter = Router();

albumRouter.use(requireAuth);

albumRouter.post("/", createAlbum);
albumRouter.get("/", getMyAlbums);
albumRouter.get("/:id", getAlbumById);
albumRouter.delete("/:id", deleteAlbum);
albumRouter.post("/:id/photos", addPhotosToAlbum);

export default albumRouter;