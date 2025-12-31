import React, { useEffect, useState } from 'react';
import { Icon, Button } from '../../components/common';
import { api } from '../../services/api';
import AddStationModal, { type StationFormData } from './AddStationModal';
import './Stations.css';

interface Station {
    id: number;
    name: string;
    broadcasting: boolean;
    autoDJ: boolean;
}

interface StationsProps {
    stations?: Station[];
    onManageStation?: (station: Station) => void;
}


const Stations: React.FC<StationsProps> = ({
    stations = [],
    onManageStation,
}) => {
    const [localStations, setLocalStations] = useState<Station[]>(stations);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStation, setEditingStation] = useState<Station | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter stations based on search term
    const filteredStations = localStations.filter(station =>
        station.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredStations.length / pageSize));
    const paginatedStations = filteredStations.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    useEffect(() => {
        handleRefresh();
    }, []);

    const handleRefresh = async () => {
        setIsLoading(true);
        try {
            const data = await api.getStations();
            // Map API response to Component State
            const mappedStations: Station[] = data.map(s => ({
                id: s.id,
                name: s.name,
                broadcasting: s.is_enabled,
                autoDJ: false // TODO: Check if API provides this info, or default to false
            }));
            setLocalStations(mappedStations);
        } catch (error) {
            console.error('Failed to fetch stations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddStation = () => {
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingStation(null);
    };

    const handleSaveStation = async (data: StationFormData) => {
        setIsLoading(true);
        try {
            // Calculate api_history_items
            let apiHistoryItems = 5;
            if (typeof data.visibleRecentSongs === 'number') {
                apiHistoryItems = data.visibleRecentSongs;
            } else if (data.visibleRecentSongs === 'disabled') {
                apiHistoryItems = 0;
            } else if (data.visibleRecentSongs === 'custom') {
                apiHistoryItems = data.customRecentSongs;
            }

            // Call API to create station
            await api.createStation({
                name: data.name,
                description: data.description,
                genre: data.genre,
                url: data.websiteUrl,
                timezone: data.timezone,
                short_name: data.urlStub,
                api_history_items: apiHistoryItems,
                enable_public_page: data.enablePublicPages,
                enable_on_demand: data.enableOnDemandStreaming,
                is_enabled: data.enableBroadcasting,
                enable_streamers: data.enableStreamers,
                enable_requests: data.enableSongRequests,
                backend_config: {
                    enable_autodj: data.enableAutoDJ,
                    enable_hls: data.enableHLS
                }
            });

            setIsAddModalOpen(false);

            // Refresh list to show new station
            await handleRefresh();
        } catch (error) {
            console.error('Failed to create station:', error);
            alert('Failed to create station. Please check console for details.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handle Edit Station - Opens edit modal with station data
     * Uses PUT /api/admin/station/{id}
     */
    const handleEditStation = (station: Station) => {
        setEditingStation(station);
        setIsEditModalOpen(true);
    };

    /**
     * Save edited station data
     * Calls PUT /api/admin/station/{id}
     */
    const handleUpdateStation = async (data: StationFormData) => {
        if (!editingStation) return;

        setIsLoading(true);
        try {
            // Calculate api_history_items
            let apiHistoryItems = 5;
            if (typeof data.visibleRecentSongs === 'number') {
                apiHistoryItems = data.visibleRecentSongs;
            } else if (data.visibleRecentSongs === 'disabled') {
                apiHistoryItems = 0;
            } else if (data.visibleRecentSongs === 'custom') {
                apiHistoryItems = data.customRecentSongs;
            }

            // Call API to update station
            await api.updateStation(editingStation.id, {
                name: data.name,
                description: data.description,
                genre: data.genre,
                url: data.websiteUrl,
                timezone: data.timezone,
                short_name: data.urlStub,
                api_history_items: apiHistoryItems,
                enable_public_page: data.enablePublicPages,
                enable_on_demand: data.enableOnDemandStreaming,
                is_enabled: data.enableBroadcasting,
                enable_streamers: data.enableStreamers,
                enable_requests: data.enableSongRequests,
                backend_config: {
                    enable_autodj: data.enableAutoDJ,
                    enable_hls: data.enableHLS
                }
            });

            setIsEditModalOpen(false);
            setEditingStation(null);

            // Refresh list to show updated station
            await handleRefresh();
        } catch (error) {
            console.error('Failed to update station:', error);
            alert('Failed to update station. Please check console for details.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handle Delete Station - Shows confirmation and deletes
     * Uses DELETE /api/admin/station/{id}
     */
    const handleDeleteStation = async (station: Station) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete station "${station.name}"?\n\nThis action cannot be undone!`
        );

        if (!confirmed) return;

        setIsDeleting(true);
        try {
            // Call API to delete station
            await api.deleteStation(station.id);

            // Refresh list to remove deleted station
            await handleRefresh();

            alert(`Station "${station.name}" has been deleted successfully.`);
        } catch (error) {
            console.error('Failed to delete station:', error);
            alert('Failed to delete station. Please check console for details.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="stations-container">
            {/* Header */}
            <div className="stations-header">
                <h1 className="stations-title">Stations</h1>
            </div>

            {/* Content */}
            <div className="stations-content">
                {/* Add Station Button */}
                <div className="stations-actions">
                    <Button
                        variant="success"
                        size="sm"
                        onClick={handleAddStation}
                        className="add-station-btn"
                    >
                        <Icon name="plus" size={14} />
                        ADD STATION
                    </Button>
                </div>

                {/* Toolbar */}
                <div className="stations-toolbar">
                    <div className="toolbar-left">
                        <button
                            className="page-btn active"
                            onClick={() => setCurrentPage(1)}
                        >
                            {currentPage}
                        </button>
                    </div>

                    <div className="toolbar-right">
                        {/* Search Box */}
                        <div className="search-box">
                            <Icon name="search" size={16} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        {/* Refresh & Page Size */}
                        <div className="toolbar-controls">
                            <button
                                className="refresh-btn"
                                onClick={handleRefresh}
                                title="Refresh"
                                disabled={isLoading}
                            >
                                <Icon name="refresh" size={14} />
                            </button>
                            <select
                                className="page-size-select"
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Loading Indicator */}
                {(isLoading || isDeleting) && (
                    <div className="loading-indicator">
                        {isDeleting ? 'Deleting station...' : 'Loading...'}
                    </div>
                )}

                {/* Table */}
                <div className="stations-table-container">
                    <table className="stations-table">
                        <thead>
                            <tr>
                                <th className="col-name">Name</th>
                                <th className="col-broadcasting">Broadcasting</th>
                                <th className="col-autodj">AutoDJ</th>
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedStations.length > 0 ? (
                                paginatedStations.map((station) => (
                                    <tr key={station.id}>
                                        <td className="col-name">
                                            <span className="station-name">{station.name}</span>
                                        </td>
                                        <td className="col-broadcasting">
                                            <span className={`status-badge ${station.broadcasting ? 'status-online' : 'status-offline'}`}>
                                                {station.broadcasting ? 'Online' : 'Offline'}
                                            </span>
                                        </td>
                                        <td className="col-autodj">
                                            <span className={`status-badge ${station.autoDJ ? 'status-enabled' : 'status-disabled'}`}>
                                                {station.autoDJ ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="col-actions">
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn action-manage"
                                                    onClick={() => onManageStation?.(station)}
                                                    title="Manage Station"
                                                >
                                                    <Icon name="settings" size={14} />
                                                </button>
                                                <button
                                                    className="action-btn action-edit"
                                                    onClick={() => handleEditStation(station)}
                                                    title="Edit Station"
                                                    disabled={isDeleting}
                                                >
                                                    <Icon name="edit" size={14} />
                                                </button>
                                                <button
                                                    className="action-btn action-delete"
                                                    onClick={() => handleDeleteStation(station)}
                                                    title="Delete Station"
                                                    disabled={isDeleting}
                                                >
                                                    <Icon name="trash" size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="no-records-row">
                                    <td colSpan={4}>
                                        <span className="no-records">No records.</span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="stations-pagination">
                    <div className="pagination-left">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add Station Modal */}
            <AddStationModal
                isOpen={isAddModalOpen}
                onClose={handleCloseAddModal}
                onSave={handleSaveStation}
                isLoading={isLoading}
            />

            {/* Edit Station Modal - Reuse AddStationModal with initial data */}
            <AddStationModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                onSave={handleUpdateStation}
                isLoading={isLoading}
                initialData={editingStation ? {
                    name: editingStation.name,
                    enableBroadcasting: editingStation.broadcasting,
                } : undefined}
                title="Edit Station"
            />
        </div>
    );
};

export default Stations;

