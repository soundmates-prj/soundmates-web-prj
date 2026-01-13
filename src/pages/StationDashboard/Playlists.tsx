import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '../../components/common';
import { api } from '../../services/api';
import AddPlaylistModal from './AddPlaylistModal';
import './Playlists.css';

interface PlaylistItem {
    id: number;
    name: string;
    short_name: string;
    description: string | null;
    type: string;
    source: string;
    order: string;
    is_enabled: boolean;
    is_jingle: boolean;
    weight: number;
    include_in_requests: boolean;
    include_in_on_demand: boolean;
    num_songs: number;
    total_length: number;
    schedule_items: Array<{
        id: number;
        start_time: number;
        end_time: number;
        start_date: string | null;
        end_date: string | null;
        days: number[] | null;
    }>;
    links: {
        self: string;
        toggle: string;
        clone: string;
        order?: string;
        queue?: string;
        import?: string;
        reshuffle?: string;
        applyto?: string;
        empty?: string;
        export?: { pls: string; m3u: string };
    };
}

interface PlaylistsProps {
    stationId: number;
    timezone?: string;
}

const Playlists: React.FC<PlaylistsProps> = ({ stationId, timezone = 'UTC' }) => {
    const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'schedule'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);

    // Fetch playlists
    const fetchPlaylists = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.getPlaylists(stationId);
            setPlaylists(response as unknown as PlaylistItem[]);
        } catch (error) {
            console.error('Failed to fetch playlists:', error);
        } finally {
            setIsLoading(false);
        }
    }, [stationId]);

    useEffect(() => {
        fetchPlaylists();
    }, [fetchPlaylists]);

    // Filter playlists by search
    const filteredPlaylists = playlists.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredPlaylists.length / pageSize));
    const paginatedPlaylists = filteredPlaylists.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Get type label
    const getTypeLabel = (source: string) => {
        switch (source) {
            case 'songs': return 'Song-based';
            case 'remote_url': return 'Remote URL';
            default: return source;
        }
    };

    // Get scheduling info
    const getSchedulingInfo = (playlist: PlaylistItem) => {
        switch (playlist.type) {
            case 'default':
                return { type: 'General Rotation', detail: `Weight: ${playlist.weight}` };
            case 'once_per_x_songs':
                return { type: 'Once per X Songs', detail: '' };
            case 'once_per_x_minutes':
                return { type: 'Once per X Minutes', detail: '' };
            case 'once_per_hour':
                return { type: 'Once per Hour', detail: '' };
            case 'scheduled':
                return { type: 'Scheduled', detail: `${playlist.schedule_items?.length || 0} schedule(s)` };
            case 'once_per_day':
                return { type: 'Once per Day', detail: '' };
            case 'advanced':
                return { type: 'Advanced', detail: '' };
            default:
                return { type: playlist.type, detail: '' };
        }
    };

    // Handle toggle playlist (for future use)
    const _handleToggle = async (playlist: PlaylistItem) => {
        try {
            await api.togglePlaylist(stationId, playlist.id);
            fetchPlaylists();
        } catch (error) {
            console.error('Failed to toggle playlist:', error);
        }
    };

    // Handle delete playlist
    const handleDelete = async (playlist: PlaylistItem) => {
        if (!confirm(`Are you sure you want to delete the playlist "${playlist.name}"?`)) return;

        try {
            await api.deletePlaylist(stationId, playlist.id);
            fetchPlaylists();
        } catch (error) {
            console.error('Failed to delete playlist:', error);
        }
    };

    // Format song count
    const formatSongCount = (count: number) => {
        if (count === 0) return '0 (None)';
        return count.toString();
    };

    return (
        <div className="playlists-page">
            {/* Header */}
            <div className="playlists-header">
                <h1 className="page-title">Playlists</h1>
                <span className="timezone-info">
                    This station's time zone is currently {timezone}.
                </span>
            </div>

            {/* Tabs */}
            {/* <div className="playlists-tabs">
                <button
                    className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Playlists
                </button>
                <button
                    className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
                    onClick={() => setActiveTab('schedule')}
                >
                    Schedule View
                </button>
            </div> */}

            {activeTab === 'all' ? (
                <>
                    {/* Add Button */}
                    <div className="add-playlist-row">
                        <button className="btn-add-playlist" onClick={() => setShowAddModal(true)}>
                            <Icon name="plus" size={16} />
                            ADD PLAYLIST
                        </button>
                    </div>

                    {/* Table Controls */}
                    <div className="table-controls">
                        <div className="pagination-info">
                            <span className="page-badge">{currentPage}</span>
                        </div>
                        <div className="search-box">
                            <Icon name="search" size={16} />
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="table-options">
                            <button className="btn-refresh" onClick={fetchPlaylists}>
                                <Icon name="refresh" size={16} />
                            </button>
                            <select
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>

                    {/* Playlists Table */}
                    <div className="playlists-table-container">
                        <table className="playlists-table">
                            <thead>
                                <tr>
                                    <th className="col-playlist">Playlist</th>
                                    <th className="col-scheduling">Scheduling</th>
                                    <th className="col-songs"># Songs</th>
                                    <th className="col-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="loading-cell">
                                            <div className="loading-spinner"></div>
                                            Loading...
                                        </td>
                                    </tr>
                                ) : paginatedPlaylists.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="empty-cell">No playlists found.</td>
                                    </tr>
                                ) : (
                                    paginatedPlaylists.map((playlist) => {
                                        const scheduling = getSchedulingInfo(playlist);
                                        return (
                                            <tr key={playlist.id} className={!playlist.is_enabled ? 'disabled' : ''}>
                                                <td className="col-playlist">
                                                    <div className="playlist-name">{playlist.name}</div>
                                                    <span className={`playlist-type-badge ${playlist.source}`}>
                                                        {getTypeLabel(playlist.source)}
                                                    </span>
                                                </td>
                                                <td className="col-scheduling">
                                                    <div className="scheduling-type">{scheduling.type}</div>
                                                    {scheduling.detail && (
                                                        <div className="scheduling-detail">{scheduling.detail}</div>
                                                    )}
                                                </td>
                                                <td className="col-songs">
                                                    <a href="#" className="song-count-link">
                                                        {formatSongCount(playlist.num_songs)}
                                                    </a>
                                                </td>
                                                <td className="col-actions">
                                                    <div className="action-buttons">
                                                        <button className="btn-edit" title="Edit">
                                                            EDIT
                                                        </button>
                                                        <button
                                                            className="btn-delete"
                                                            title="Delete"
                                                            onClick={() => handleDelete(playlist)}
                                                        >
                                                            DELETE
                                                        </button>
                                                        <button className="btn-more" title="More options">
                                                            <Icon name="chevron-down" size={12} />
                                                            MORE
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="pagination">
                        <button
                            className="page-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(1)}
                        >
                            <Icon name="chevron-left" size={14} />
                            <Icon name="chevron-left" size={14} />
                        </button>
                        <button
                            className="page-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        >
                            <Icon name="chevron-left" size={14} />
                        </button>
                        <span className="page-number">{currentPage}</span>
                        <button
                            className="page-btn"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        >
                            <Icon name="chevron-right" size={14} />
                        </button>
                        <button
                            className="page-btn"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                        >
                            <Icon name="chevron-right" size={14} />
                            <Icon name="chevron-right" size={14} />
                        </button>
                    </div>
                </>
            ) : (
                <div className="schedule-view">
                    <div className="schedule-placeholder">
                        <Icon name="calendar" size={48} />
                        <h3>Schedule View</h3>
                        <p>Calendar view of scheduled playlists - Coming Soon</p>
                    </div>
                </div>
            )}

            {/* Add Playlist Modal */}
            {showAddModal && (
                <AddPlaylistModal
                    stationId={stationId}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={fetchPlaylists}
                />
            )}
        </div>
    );
};

export default Playlists;
