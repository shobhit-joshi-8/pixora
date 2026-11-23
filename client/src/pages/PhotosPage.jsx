import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom';
import { Film, ImageIcon, Upload } from 'lucide-react';
import Loading from '../components/layout/common/Loading';
import PhotoGrid from '../components/photos/PhotoGrid';
import { PhotoLightbox } from '../components/photos/PhotoLightbox';
import BulkSelectionBar from '../components/photos/BulkSelectionBar';
import toast from "react-hot-toast";
import { api } from '../config/api';

const PhotosPage = () => {

    const { searchQuery, onOpenUpload, openCreateAlbum } = useOutletContext();

    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [filterType, setFilterType] = useState("all");
    const [activePhoto, setactivePhoto] = useState(null);


    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id]
        );
    };

    // Toggle favorite
    const toggleFavorite = async (id) => {
        try {
            const res = await api.patch(`/api/media/${id}/favorite`);

            const updated = res.data.media;

            setPhotos((prev) =>
                prev.map((p) =>
                    p._id === id
                        ? { ...p, isFavorite: updated.isFavorite }
                        : p
                )
            );

            if (activePhoto && activePhoto._id === id) {
                setactivePhoto({
                    ...activePhoto,
                    isFavorite: updated.isFavorite,
                });
            }
        } catch (error) {
            toast.error("Failed to update favorite");
        }
    };

    // Move photo to trash
    const handleTrash = async (id) => {
        try {
            await api.patch(`/api/media/${id}/trash`, {
                restore: false,
            });

            setPhotos((prev) =>
                prev.filter((p) => p._id !== id)
            );

            setSelectedIds((prev) =>
                prev.filter((i) => i !== id)
            );

            if (activePhoto && activePhoto._id === id) {
                setactivePhoto(null);
            }

            toast.success("Moved item to trash");
        } catch (error) {
            toast.error("Failed to move to trash");
        }
    };

    // Bulk favorite
    const handleBulkFavorite = async () => {
        try {
            for (const id of selectedIds) {
                await api.patch(`/api/media/${id}/favorite`);
            }

            toast.success("Updated selected favorites");

            fetchPhotos();
            setSelectedIds([]);
        } catch (error) {
            toast.error("Bulk favorite update failed");
        }
    };

    // Bulk trash
    const handleBulkTrash = async () => {
        try {
            for (const id of selectedIds) {
                await api.patch(`/api/media/${id}/trash`, {
                    restore: false,
                });
            }

            toast.success(
                `Moved ${selectedIds.length} item(s) to trash`
            );

            fetchPhotos();
            setSelectedIds([]);
        } catch (error) {
            toast.error("Bulk trash failed");
        }
    };

    const fetchPhotos = async () => {
        try {
            const params = new URLSearchParams();

            if (searchQuery) {
                params.append("q", searchQuery);
            }

            if (filterType !== "all") {
                params.append("type", filterType);
            }

            const queryString = params.toString();

            const url = queryString
                ? `/api/media?${queryString}`
                : "/api/media";

            const res = await api.get(url);

            setPhotos(res.data.media || []);
        } catch (error) {
            toast.error("Failed to load media");
        } finally {
            setLoading(false);
        }
    }

    const handleRemoveFromAlbum = () => {
        console.log(selectedIds);
    }

    useEffect(() => {
        fetchPhotos();
    }, [searchQuery, filterType])

    useEffect(() => {
        const handleRefresh = () => fetchPhotos();

        window.addEventListener("media-uploaded", handleRefresh);

        return () => {
            window.removeEventListener("media-uploaded", handleRefresh);
        };
    }, []);


    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
                {/* Left */}
                <div>
                    <h2 className="text-2xl font-medium text-slate-900 tracking-tight flex items-center gap-2">
                        Photos & Videos

                        {photos.length > 0 && (
                            <span className="text-sm font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                {photos.length}
                            </span>
                        )}
                    </h2>

                    <p className='text-xs text-slate-500 mt-0.5'>
                        All your preserved photos and videos, automatically organized by date
                    </p>
                </div>

                {/* right */}
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center bg-slate-100 p-1 rounded-full text-sm font-medium text-slate-600">
                        <button
                            onClick={() => setFilterType("all")}
                            className={`px-3 py-1 rounded-full transition cursor-pointer ${filterType === "all"
                                ? "bg-white text-slate-900 font-semibold"
                                : "hover:text-slate-900"
                                }`}
                        >
                            All
                        </button>

                        <button
                            onClick={() => setFilterType("image")}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full transition cursor-pointer ${filterType === "image"
                                ? "bg-white text-slate-900 font-semibold"
                                : "hover:text-slate-900"
                                }`}
                        >
                            <ImageIcon className="size-3" />
                            <span>Photos</span>
                        </button>

                        <button
                            onClick={() => setFilterType("video")}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full transition cursor-pointer ${filterType === "video"
                                ? "bg-white text-slate-900 font-semibold"
                                : "hover:text-slate-900"
                                }`}
                        >
                            <Film className="size-3" />
                            <span>Videos</span>
                        </button>
                    </div>
                </div>


            </div>

            {/* Media Content */}
            {loading ? (
                <Loading />
            ) : photos.length === 0 ? (
                <div className='empty-state-card'>
                    <h3 className='text-lg font-medium text-slate-800'>{searchQuery ? "No matching media" : "Your media library is empty"}</h3>
                    <p>{searchQuery ? `No media found for "${searchQuery}". Try a different keyword.` : "Upload high quality photos and videos from your computer"}</p>

                    <button
                        onClick={onOpenUpload}
                        className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-full transition cursor-pointer"
                    >
                        <Upload className="size-4" />
                        <span>Upload Media Now</span>
                    </button>
                </div>
            ) : (
                <div>
                    <PhotoGrid photos={photos} selectedIds={selectedIds} onToggleSelect={toggleSelect} onToggleFavorite={toggleFavorite} onSelectPhoto={(photo) => setactivePhoto(photo)} onRemoveFromAlbum={handleRemoveFromAlbum} />
                </div>
            )}

            <PhotoLightbox photos={photos}
                currentPhoto={activePhoto}
                onClose={() => setactivePhoto(null)}
                onToggle={toggleFavorite}
                onTrashPhoto={handleTrash}
                onAddToAlbum={(photo) => {
                    openCreateAlbum?.(photo._id)
                }} />

            <BulkSelectionBar
                count={selectedIds.length}
                onClear={() => setSelectedIds([])}
                onFavorite={handleBulkFavorite}
                onAddToAlbum={() => openCreateAlbum?.(selectedIds)}
                onTrash={handleBulkTrash}
            />
        </div>
    )
}

export default PhotosPage