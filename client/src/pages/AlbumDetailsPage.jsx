import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from "react-router-dom";
import Loading from '../components/layout/common/Loading';
import { ArrowLeft, Calendar, Plus, Trash2Icon } from 'lucide-react';
import PhotoGrid from "../components/photos/PhotoGrid";
import AddPhotosModal from '../components/albums/AddPhotosModal';
import { PhotoLightbox } from '../components/photos/PhotoLightbox';
import BulkSelectionBar from '../components/photos/BulkSelectionBar';
import { api } from '../config/api';
import toast from 'react-hot-toast';

const AlbumDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [activePhoto, setActivePhoto] = useState(null);
    const [isAddPhotosModalOpen, setIsAddPhotosModalOpen] = useState(false);

    const fetchAlbum = async () => {
        try {
            const res = await api.get(`/api/albums/${id}`);

            setAlbum(res.data.album);
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Failed to load album"
            );

            navigate("/albums");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlbum();
    }, [id]);

    const handleRemoveFromAlbum = async (photoIds) => {
        if (!album) return;

        const ids = Array.isArray(photoIds) ? photoIds : [photoIds];
        if (ids.length === 0) return;

        try {
            if (Array.isArray(photoIds)) {
                await api.delete(`/api/albums/${album._id}/photos`, {
                    data: { photoIds: ids },
                });
            } else {
                await api.delete(
                    `/api/albums/${album._id}/photos/${ids[0]}`
                );
            }

            const removedSet = new Set(ids);
            setAlbum((prev) =>
                prev
                    ? {
                        ...prev,
                        photos: prev.photos.filter((photo) => !removedSet.has(photo._id)),
                    }
                    : prev
            );
            setSelectedIds((prev) => prev.filter((id) => !removedSet.has(id)));

            if (activePhoto && removedSet.has(activePhoto._id)) {
                setActivePhoto(null);
            }

            toast.success(`Removed ${ids.length} photo(s) from album`);
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Failed to remove photos from album"
            );
        }
    };

    const toggleFavorite = async (photoId) => {
        try {
            const res = await api.patch(
                `/api/media/${photoId}/favorite`
            );

            const updated = res.data.media;

            setAlbum((prev) =>
                prev
                    ? {
                        ...prev,
                        photos: prev.photos.map((p) =>
                            p._id === photoId
                                ? {
                                    ...p,
                                    isFavorite: updated.isFavorite,
                                }
                                : p
                        ),
                    }
                    : prev
            );
        } catch (error) {
            toast.error("Failed to update favorite");
        }
    };

    const handleDeleteAlbum = async () => {
        if (!album) return;

        const confirmed = window.confirm(
            "Are you sure you want to delete this album? Photos inside will remain safe in your library."
        );

        if (!confirmed) return;

        try {
            await api.delete(`/api/albums/${album._id}`);

            toast.success("Album deleted");
            navigate("/albums");
        } catch (error) {
            toast.error("Failed to delete album");
        }
    };

    if (loading) {
        return <Loading />
    }

    if (!album) return null;

    const existingPhotoIds = album.photos ? album.photos.map((p) => p._id) : [];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Navigation Back */}
            <button
                onClick={() => navigate("/albums")}
                className="flex items-center gap-2 hover:bg-slate-100 rounded-full p-2 px-4 text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
                <ArrowLeft className="size-3.5" />
                <span>Back to Albums</span>
            </button>

            {/* Album Header */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">

                {/* Left */}
                <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-3">
                        <h1 className="min-w-0 break-words text-2xl sm:text-3xl text-slate-900 tracking-tight">
                            {album.title}
                        </h1>
                    </div>

                    {album.description && (
                        <p className="text-sm text-slate-600 max-w-xl">
                            {album.description}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span>
                            {album.photos?.length || 0}{" "}
                            {album.photos?.length === 1 ? "photo" : "photos"}
                        </span>

                        <span>•</span>

                        <span className="flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            Created {new Date(album.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Right */}
                <div className="flex w-full items-center gap-2.5 shrink-0 md:w-auto">
                    <button
                        onClick={() => setIsAddPhotosModalOpen(true)}
                        className="flex flex-1 items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-full transition cursor-pointer md:flex-none"
                    >
                        <Plus className="size-4" />
                        <span>Add Photos</span>
                    </button>

                    <button
                        onClick={handleDeleteAlbum}
                        className="p-2.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full transition cursor-pointer"
                        title="Delete Album"
                    >
                        <Trash2Icon className="size-4" />
                    </button>
                </div>
            </div>

            {/* Photos Inside Album */}
            {album.photos && album.photos.length > 0 ? (
                <PhotoGrid
                    photos={album.photos}
                    selectedIds={selectedIds}
                    onToggleSelect={(photoId) =>
                        setSelectedIds((prev) =>
                            prev.includes(photoId)
                                ? prev.filter((i) => i !== photoId)
                                : [...prev, photoId]
                        )
                    }
                    onToggleFavorite={toggleFavorite}
                    onSelectPhoto={(photo) => setActivePhoto(photo)}
                    onRemoveFromAlbum={handleRemoveFromAlbum}
                />
            ) : (
                <div className="text-center py-20 px-4 bg-white rounded-3xl border border-slate-200/80 max-w-lg mx-auto">
                    <h3 className="text-lg font-medium text-slate-800">
                        Album is empty
                    </h3>

                    <p className="text-sm text-slate-500 mt-2">
                        Add photos from your existing library to populate this album.
                    </p>

                    <button
                        onClick={() => setIsAddPhotosModalOpen(true)}
                        className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-full transition cursor-pointer"
                    >
                        <Plus className="size-4" />
                        <span>Add Photos to Album</span>
                    </button>
                </div>
            )}

            {/* Add Photos Modal */}
            <AddPhotosModal
                isOpen={isAddPhotosModalOpen}
                albumId={album._id}
                existingPhotoIds={existingPhotoIds}
                onClose={() => setIsAddPhotosModalOpen(false)}
                onPhotosAdded={(updatedAlbum) => {
                    setAlbum(updatedAlbum);
                }}
            />

            {/* Lightbox for Preview */}
            <PhotoLightbox
                photos={album.photos || []}
                currentPhoto={activePhoto}
                onClose={() => setActivePhoto(null)}
                onToggleFavorite={toggleFavorite}
                onTrashPhoto={(photoId) => handleRemoveFromAlbum(photoId)}
            />

            <BulkSelectionBar
                count={selectedIds.length}
                onClear={() => setSelectedIds([])}
                onRemoveFromAlbum={() => handleRemoveFromAlbum(selectedIds)}
            />
        </div>
    )
}

export default AlbumDetailsPage