import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar';
import CreateAlbumModal from '../albums/CreateAlbumModal';
import UploadModal from '../photos/UploadModal';
import { useAuth } from '../../context/AuthContext';
import Loading from './common/Loading';

const AppLayout = ({ children }) => {
    const { token, loading } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [createAlbumState, setcreateAlbumState] = useState({
        isOpen: false,
        photosIds: []
    });

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [location.pathname])

    if (loading) {
        return <Loading fullscreen />;
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleUploadSuccess = () => {
        window.dispatchEvent(new CustomEvent("media-uploaded"));
    }

    const handleAlbumcreated = (album) => {
        setcreateAlbumState({ isOpen: false, photosIds: [] });
        navigate(`/albums/${album._id}`);
    }

    const openCreateAlbum = (photoIds = []) => {
        setcreateAlbumState({ isOpen: true, photoIds });
    }


    return (
        <div className='h-screen flex flex-col bg-white overflow-hidden'>
            <Navbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onUploadClick={() => setIsUploadOpen(true)}
                toggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
            />

            <div className='flex-1 flex overflow-hidden min-h-0 relative'>
                <Sidebar
                    onCreateAlbumClick={() => openCreateAlbum()}
                    onUploadClick={() => setIsUploadOpen(true)}
                    isMobileOpen={isMobileSidebarOpen}
                    onCloseMobile={() => setIsMobileSidebarOpen(false)}
                />

                <main className='app-main-content'>
                    <Outlet context={{ searchQuery, onOpenUpload: () => setIsUploadOpen(true), openCreateAlbum }} />
                </main>
            </div>

            <CreateAlbumModal
                isOpen={createAlbumState.isOpen}
                onClose={() => setcreateAlbumState({ isOpen: false, photosIds: [] })}
                onAlbumCreated={handleAlbumcreated}
                intitialPhotoIds={createAlbumState.photosIds}
            />

            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onUploadSuccess={handleUploadSuccess}
            />

        </div>
    )
}

export default AppLayout