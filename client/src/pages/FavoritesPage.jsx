import React, { useEffect, useState } from 'react'
import { useOutletContext } from "react-router-dom"
import Loading from '../components/layout/common/Loading';
import PhotoGrid from "../components/photos/PhotoGrid";
import { PhotoLightbox } from '../components/photos/PhotoLightbox';
import BulkSelectionBar from '../components/photos/BulkSelectionBar';
import { api } from '../config/api';
import toast from 'react-hot-toast';


const FavoritesPage = () => {
    const { searchQuery, openCreateAlbum } = useOutletContext();
    const [loading, setLoading] = useState(true);
    const [photos, setPhotos] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [activePhoto, setActivePhoto] = useState(null);

    // Fetch favorites
    const fetchFavorites = async () => {
        try {
            const url = searchQuery
                ? `/api/media?favorite=true&q=${encodeURIComponent(searchQuery)}`
                : "/api/media?favorite=true";

            const res = await api.get(url);

            setPhotos(res.data.media || []);
        } catch (error) {
            toast.error("Failed to load favorites");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, [searchQuery]);

    const onToggleSelect = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
    }

    const handleBulkAction = async (request, successMessage) => {
        const ids = [...selectedIds];
        const results = await Promise.allSettled(ids.map(request));
        const updatedIds = ids.filter(
            (_, index) => results[index].status === "fulfilled"
        );

        if (updatedIds.length > 0) {
            const updatedSet = new Set(updatedIds);
            setPhotos((prev) => prev.filter((photo) => !updatedSet.has(photo._id)));
            setSelectedIds((prev) => prev.filter((id) => !updatedSet.has(id)));

            if (activePhoto && updatedSet.has(activePhoto._id)) {
                setActivePhoto(null);
            }

            toast.success(successMessage(updatedIds.length));
        }

        if (updatedIds.length !== ids.length) {
            toast.error("Some selected items could not be updated");
        }
    };

    // Toggle favorite
    const toggleFavorite = async (id) => {
        try {
            await api.patch(`/api/media/${id}/favorite`);

            setPhotos((prev) =>
                prev.filter((p) => p._id !== id)
            );
            setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));

            if (activePhoto && activePhoto._id === id) {
                setActivePhoto(null);
            }

            toast.success("Removed from favorites");
        } catch (error) {
            toast.error("Failed to update favorite");
        }
    };

    // Move item to trash
    const handleTrash = async (id) => {
        try {
            await api.patch(`/api/media/${id}/trash`, {
                restore: false,
            });

            setPhotos((prev) =>
                prev.filter((p) => p._id !== id)
            );
            setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));

            if (activePhoto && activePhoto._id === id) {
                setActivePhoto(null);
            }

            toast.success("Moved item to trash");
        } catch (error) {
            toast.error("Failed to move to trash");
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div>
                    <h2 className="text-2xl font-medium text-slate-900 tracking-tight flex items-center gap-2">
                        Favorites

                        {photos.length > 0 && (
                            <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                {photos.length}
                            </span>
                        )}


                    </h2>

                    <p className="text-xs text-slate-500 mt-0.5">
                        Your starred photos and videos for quick access
                    </p>
                </div>
            </div>

            {loading ? (
                <Loading />
            ) : photos.length === 0 ? (
                <div className="empty-state-card">
                    <h3 className="text-lg font-medium text-slate-800">
                        No favorites yet
                    </h3>

                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        Click the star icon on any photo or video in your collection to add them to your favorites.
                    </p>
                </div>
            ) : (
                <div>
                    <PhotoGrid
                        photos={photos}
                        selectedIds={selectedIds}
                        onToggleSelect={onToggleSelect}
                        onSelectPhoto={(photo) => setActivePhoto(photo)}
                        onToggleFavorite={toggleFavorite} />
                </div>
            )}

            <PhotoLightbox
                photos={photos}
                currentPhoto={activePhoto}
                onClose={() => setActivePhoto(null)}
                onToggleFavorite={toggleFavorite}
                onTrashPhoto={handleTrash}
            />

            <BulkSelectionBar
                count={selectedIds.length}
                onClear={() => setSelectedIds([])}
                favoriteLabel="Remove favorite"
                onFavorite={() =>
                    handleBulkAction(
                        (id) => api.patch(`/api/media/${id}/favorite`),
                        (count) => `Removed ${count} item(s) from favorites`
                    )
                }
                onAddToAlbum={() => openCreateAlbum?.(selectedIds)}
                onTrash={() =>
                    handleBulkAction(
                        (id) => api.patch(`/api/media/${id}/trash`, { restore: false }),
                        (count) => `Moved ${count} item(s) to trash`
                    )
                }
            />
        </div>
    )
}

export default FavoritesPage