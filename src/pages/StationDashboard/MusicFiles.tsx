import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from '../../components/common';
import { api, type FileListItem, type StationQuota } from '../../services/api';
import './MusicFiles.css';

interface MusicFilesProps {
    stationId: number;
}

const MusicFiles: React.FC<MusicFilesProps> = ({ stationId }) => {
    const [files, setFiles] = useState<FileListItem[]>([]);
    const [quota, setQuota] = useState<StationQuota | null>(null);
    const [currentPath, setCurrentPath] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [_playlists, setPlaylists] = useState<Array<{ id: number; name: string }>>([]);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRows, setTotalRows] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch initial config (playlists, custom fields)
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const config = await api.getVueFilesConfig(stationId);
                setPlaylists(config.playlists || []);
            } catch (error) {
                console.error('Failed to fetch vue files config:', error);
            }
        };
        fetchConfig();
    }, [stationId]);

    // Fetch files and quota
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [filesResponse, quotaResponse] = await Promise.all([
                api.getFiles(stationId, {
                    currentDirectory: currentPath,
                    searchPhrase: searchTerm || undefined,
                    rowCount: pageSize,
                    current: currentPage,
                }),
                api.getStationQuota(stationId),
            ]);
            setFiles(filesResponse.rows || []);
            setTotalRows(filesResponse.total || filesResponse.rows?.length || 0);
            setQuota(quotaResponse);
        } catch (error) {
            console.error('Failed to fetch files:', error);
        } finally {
            setIsLoading(false);
        }
    }, [stationId, currentPath, searchTerm, pageSize, currentPage]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Breadcrumb navigation
    const getBreadcrumbs = () => {
        const parts = currentPath.split('/').filter(Boolean);
        return [{ name: 'Home', path: '' }, ...parts.map((part, index) => ({
            name: part,
            path: parts.slice(0, index + 1).join('/'),
        }))];
    };

    // Handle folder navigation
    const handleNavigate = (path: string) => {
        setCurrentPath(path);
        setSelectedFiles(new Set());
        setCurrentPage(1);
    };

    // Handle file/folder click
    const handleItemClick = (item: FileListItem) => {
        if (item.type === 'directory') {
            handleNavigate(item.path);
        }
    };

    // Handle checkbox selection
    const handleSelect = (path: string, checked: boolean) => {
        setSelectedFiles(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(path);
            } else {
                newSet.delete(path);
            }
            return newSet;
        });
    };

    // Handle select all
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedFiles(new Set(files.map((f: FileListItem) => f.path)));
        } else {
            setSelectedFiles(new Set());
        }
    };

    // Handle file upload
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const filesArray = e.target.files;
        if (!filesArray) return;

        for (const file of Array.from(filesArray)) {
            try {
                await api.uploadFile(stationId, file, currentPath, (percent) => {
                    console.log(`Uploading ${file.name}: ${percent}%`);
                });
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
            }
        }
        fetchData();
    };

    // Handle drag and drop
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = e.dataTransfer.files;
        if (!droppedFiles.length) return;

        for (const file of Array.from(droppedFiles)) {
            try {
                await api.uploadFile(stationId, file, currentPath);
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
            }
        }
        fetchData();
    };

    // Handle create folder
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            await api.createFolder(stationId, currentPath, newFolderName.trim());
            setShowNewFolderModal(false);
            setNewFolderName('');
            fetchData();
        } catch (error) {
            console.error('Failed to create folder:', error);
            alert('Failed to create folder');
        }
    };

    // Handle delete selected
    const handleDeleteSelected = async () => {
        if (selectedFiles.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedFiles.size} item(s)?`)) return;

        try {
            await api.batchFilesOperation(stationId, 'delete', Array.from(selectedFiles));
            setSelectedFiles(new Set());
            fetchData();
        } catch (error) {
            console.error('Failed to delete files:', error);
            alert('Failed to delete files');
        }
    };

    // Format file size
    const formatSize = (bytes: number | null) => {
        if (bytes === null) return '-';
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Format timestamp
    const formatDate = (timestamp: number) => {
        if (!timestamp) return '-';
        return new Date(timestamp * 1000).toLocaleString();
    };

    // Pagination - API already handles pagination, so use totalRows
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

    // Get playlists for a file
    const getPlaylistNames = (item: FileListItem) => {
        if (!item.media?.playlists) return '-';
        return item.media.playlists.map(p => p.name).join(', ') || '-';
    };

    return (
        <div className="music-files">
            {/* Header */}
            <div className="music-files-header">
                <h1 className="page-title">Music Files</h1>
                <div className="quota-info">
                    {quota && (
                        <>
                            <div className="quota-bar">
                                <div
                                    className="quota-used"
                                    style={{ width: `${quota.used_percent}%` }}
                                ></div>
                            </div>
                            <span className="quota-text">
                                {quota.used_bytes} of {quota.quota_bytes} Used ({quota.num_files} Files)
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* SFTP Info Banner */}
            <div className="sftp-banner">
                <Icon name="settings" size={16} />
                <span>You can also upload files in bulk via SFTP.</span>
                <button className="btn-sftp">MANAGE SFTP ACCOUNTS</button>
            </div>

            {/* Breadcrumb */}
            <div className="breadcrumb">
                {getBreadcrumbs().map((crumb, index) => (
                    <React.Fragment key={crumb.path}>
                        {index > 0 && <span className="breadcrumb-separator">/</span>}
                        <button
                            className="breadcrumb-link"
                            onClick={() => handleNavigate(crumb.path)}
                        >
                            {crumb.name}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* Upload Zone */}
            <div
                className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
            >
                <span>Drag file(s) here to upload or</span>
                <button className="btn-select-file" onClick={() => fileInputRef.current?.click()}>
                    <Icon name="upload" size={16} />
                    SELECT FILE
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="audio/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
            </div>

            {/* Action Bar */}
            <div className="action-bar">
                <div className="batch-actions">
                    <span className="action-label">With selected:</span>
                    <button className="btn-action btn-playlists" disabled={selectedFiles.size === 0}>
                        <Icon name="plus" size={14} />
                        PLAYLISTS
                        <Icon name="chevron-down" size={12} />
                    </button>
                    <button className="btn-action btn-move" disabled={selectedFiles.size === 0}>
                        <Icon name="folder" size={14} />
                        MOVE
                    </button>
                    <button className="btn-action btn-more" disabled={selectedFiles.size === 0}>
                        <Icon name="menu" size={14} />
                        MORE
                        <Icon name="chevron-down" size={12} />
                    </button>
                    <button
                        className="btn-action btn-delete"
                        disabled={selectedFiles.size === 0}
                        onClick={handleDeleteSelected}
                    >
                        <Icon name="trash" size={14} />
                        DELETE
                    </button>
                </div>
                <button className="btn-new-folder" onClick={() => setShowNewFolderModal(true)}>
                    <Icon name="plus" size={14} />
                    NEW FOLDER
                </button>
            </div>

            {/* Search and Pagination Controls */}
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
                    <button className="btn-refresh" onClick={fetchData}>
                        <Icon name="refresh" size={16} />
                    </button>
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <button className="btn-filter">
                        <Icon name="filter" size={16} />
                    </button>
                </div>
            </div>

            {/* Files Table */}
            <div className="files-table-container">
                <table className="files-table">
                    <thead>
                        <tr>
                            <th className="col-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedFiles.size === files.length && files.length > 0}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                />
                            </th>
                            <th className="col-name">Name</th>
                            <th className="col-length">Length</th>
                            <th className="col-size">Size</th>
                            <th className="col-modified">Modified</th>
                            <th className="col-playlists">Playlists</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} className="loading-cell">
                                    <div className="loading-spinner"></div>
                                    Loading...
                                </td>
                            </tr>
                        ) : files.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="empty-cell">No records.</td>
                            </tr>
                        ) : (
                            files.map((file: FileListItem) => (
                                <tr key={file.path} className={selectedFiles.has(file.path) ? 'selected' : ''}>
                                    <td className="col-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedFiles.has(file.path)}
                                            onChange={(e) => handleSelect(file.path, e.target.checked)}
                                        />
                                    </td>
                                    <td className="col-name">
                                        <button
                                            className="file-name-btn"
                                            onClick={() => handleItemClick(file)}
                                        >
                                            <Icon
                                                name={file.type === 'directory' ? 'folder' : 'music'}
                                                size={18}
                                                className={`file-icon ${file.type}`}
                                            />
                                            <span className="file-name">
                                                {file.text || file.path_short}
                                            </span>
                                        </button>
                                    </td>
                                    <td className="col-length">
                                        {file.media?.length_text || '-'}
                                    </td>
                                    <td className="col-size">
                                        {formatSize(file.size)}
                                    </td>
                                    <td className="col-modified">
                                        {formatDate(file.timestamp)}
                                    </td>
                                    <td className="col-playlists">
                                        {getPlaylistNames(file)}
                                    </td>
                                    <td className="col-actions">
                                        <div className="action-buttons">
                                            {file.type === 'file' && file.media && (
                                                <>
                                                    <button className="action-btn" title="Edit">
                                                        <Icon name="edit" size={14} />
                                                    </button>
                                                    <button className="action-btn" title="Play">
                                                        <Icon name="play" size={14} />
                                                    </button>
                                                </>
                                            )}
                                            <button className="action-btn" title="More">
                                                <Icon name="menu" size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
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

            {/* New Folder Modal */}
            {showNewFolderModal && (
                <div className="modal-overlay" onClick={() => setShowNewFolderModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Create New Folder</h3>
                        <input
                            type="text"
                            placeholder="Folder name"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowNewFolderModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-create" onClick={handleCreateFolder}>
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MusicFiles;
