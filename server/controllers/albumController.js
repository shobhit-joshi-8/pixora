import { Album } from "../models/Album.js";

export const createAlbum = async (req, res) => {
    try {
        const { title, description, photoIds } = req.body;

        if (!title || !title.trim()) {
            res.status(400).json({
                message: "Album title is required",
            });
            return;
        }

        const validPhotos = Array.isArray(photoIds) ? photoIds : [];

        const album = await Album.create({
            title: title.trim(),
            description: description || "",
            owner: req.user?.id,
            photos: validPhotos,
        });

        const populated = await Album.findById(album._id)
            .populate("owner", "name email")
            .populate({
                path: "photos",
                match: { isTrash: false },
                select: "thumbnailUrl url mediaType title",
            });

        res.status(201).json({
            album: populated || album,
        });
    } catch (error) {
        console.log(error.message);

        res.status(500).json({
            message: "Failed to create album",
        });
    }
}

export const getMyAlbums = async (req, res) => {
    try {
        const albums = await Album.find({
            owner: req.user?.id,
        })
            .populate("owner", "name email")
            .populate({
                path: "photos",
                match: {
                    isTrash: false,
                },
                select: "thumbnailUrl url mediaType title",
            })
            .sort({ updatedAt: -1 });

        res.json({ albums });
    } catch (error) {
        console.log(error.message);

        res.status(500).json({
            message: "Failed to fetch albums",
        });
    }
};

export const getAlbumById = async (req, res) => {
    try {
        const { id } = req.params;

        const album = await Album.findOne({
            _id: id,
            owner: req.user?.id,
        })
            .populate("owner", "name email")
            .populate({
                path: "photos",
                match: { isTrash: false },
                options: {
                    sort: { createdAt: -1 },
                },
            });

        if (!album) {
            res.status(404).json({
                message: "Album not found",
            });
            return;
        }

        res.json({ album });
    } catch (error) {
        console.log(error.message);

        res.status(500).json({
            message: "Failed to fetch album",
        });
    }
};

export const addPhotosToAlbum = async (req, res) => {
    try {
        const { id } = req.params;

        const { photoIds } = req.body;

        if (!Array.isArray(photoIds) || photoIds.length === 0) {
            res.status(400).json({
                message: "photoIds array is required",
            });
            return;
        }

        const album = await Album.findOne({
            _id: id,
            owner: req.user?.id,
        });

        if (!album) {
            res.status(404).json({
                message: "Album not found",
            });
            return;
        }

        // Add photos avoiding duplicates
        const updatedPhotos = Array.from(
            new Set([
                ...album.photos.map((p) => p.toString()),
                ...photoIds,
            ])
        );

        album.photos = updatedPhotos;

        await album.save();

        const populated = await Album.findById(id).populate({
            path: "photos",
            match: { isTrash: false },
        });

        res.json({
            album: populated,
        });
    } catch (error) {
        console.log(error.message);

        res.status(500).json({
            message: "Failed to add photos to album",
        });
    }
};

export const removePhotoFromAlbum = async (req, res) => {
    try {
        const { id, photoId } = req.params;

        const album = await Album.findOne({
            _id: id,
            owner: req.user?.id,
        });

        if (!album) {
            res.status(404).json({
                message: "Album not found",
            });
            return;
        }

        album.photos = album.photos.filter(
            (p) => p.toString() !== photoId
        );

        await album.save();

        res.json({
            message: "Photo removed from album successfully",
            album,
        });
    } catch (error) {
        console.log(error.message);

        res.status(500).json({
            message: "Failed to remove photo from album",
        });
    }
};

export const removePhotosFromAlbum = async (req, res) => {
    try {
        const { id } = req.params;
        const { photoIds } = req.body;

        if (!Array.isArray(photoIds) || photoIds.length === 0) {
            res.status(400).json({
                message: "photoIds array is required",
            });
            return;
        }

        const album = await Album.findOneAndUpdate(
            {
                _id: id,
                owner: req.user?.id,
            },
            {
                $pull: {
                    photos: { $in: photoIds },
                },
            },
            { new: true }
        ).populate({
            path: "photos",
            match: { isTrash: false },
        });

        if (!album) {
            res.status(404).json({
                message: "Album not found",
            });
            return;
        }

        res.json({ album });
    } catch (error) {
        console.log(error.message);

        res.status(500).json({
            message: "Failed to remove photos from album",
        });
    }
};

export const deleteAlbum = async (req, res) => {
    try {
        const { id } = req.params;

        const album = await Album.findOneAndDelete({
            _id: id,
            owner: req.user?.id,
        });

        if (!album) {
            res.status(404).json({
                message: "Album not found",
            });
            return;
        }

        res.json({
            message: "Album deleted successfully",
        });
    } catch (error) {
        console.log(error.message);

        res.status(500).json({
            message: "Failed to delete album",
        });
    }
};