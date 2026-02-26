// React hook for Music Catalog
import { useState, useEffect, useCallback } from 'react';
import musicCatalogService, { type MusicTrack, type MusicCatalogFilters, type Playlist } from '../services/musicCatalogService';

export interface UseMusicCatalogOptions {
  autoLoad?: boolean;
  initialFilters?: MusicCatalogFilters;
}

export interface UseMusicCatalogReturn {
  // Data
  tracks: MusicTrack[];
  playlists: Playlist[];
  genres: string[];
  totalTracks: number;
  hasMore: boolean;
  
  // Loading states
  loading: boolean;
  tracksLoading: boolean;
  playlistsLoading: boolean;
  uploading: boolean;
  deleting: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  loadTracks: (filters?: MusicCatalogFilters) => Promise<void>;
  loadMoreTracks: () => Promise<void>;
  refreshTracks: () => Promise<void>;
  loadPlaylists: () => Promise<void>;
  loadGenres: () => Promise<void>;
  
  uploadTrack: (file: File, metadata?: {
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
  }) => Promise<MusicTrack>;
  
  uploadMultipleTracks: (files: File[], onProgress?: (fileName: string, progress: number) => void) => Promise<MusicTrack[]>;
  
  updateTrack: (trackId: number, updates: Partial<MusicTrack>) => Promise<void>;
  deleteTrack: (trackId: number) => Promise<void>;
  deleteTracks: (trackIds: number[]) => Promise<void>;
  
  createPlaylist: (data: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }) => Promise<Playlist>;
  
  addTracksToPlaylist: (playlistId: number, trackIds: number[]) => Promise<void>;
  
  searchTracks: (query: string) => Promise<void>;
  
  // Filters
  currentFilters: MusicCatalogFilters;
  setFilters: (filters: MusicCatalogFilters) => void;
  clearFilters: () => void;
}

export function useMusicCatalog(options: UseMusicCatalogOptions = {}): UseMusicCatalogReturn {
  const { autoLoad = true, initialFilters = {} } = options;
  
  // State
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [genres, setGenres] = useState<string[]>(['Tất cả']);
  const [totalTracks, setTotalTracks] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [currentFilters, setCurrentFilters] = useState<MusicCatalogFilters>(initialFilters);
  
  // Prevent concurrent requests
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  // Load tracks
  const loadTracks = useCallback(async (filters: MusicCatalogFilters = {}) => {
    // Prevent concurrent requests
    if (isLoadingTracks) {
      console.log('Track loading already in progress, skipping...');
      return;
    }
    
    try {
      setIsLoadingTracks(true);
      setTracksLoading(true);
      setError(null);
      
      console.log('Loading tracks with filters:', filters);
      
      const mergedFilters = { ...currentFilters, ...filters, offset: 0 };
      
      const result = await musicCatalogService.getTracks(mergedFilters);
      
      console.log('Tracks loaded:', result.tracks.length);
      
      setTracks(result.tracks);
      setTotalTracks(result.total);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracks');
      console.error('Error loading tracks:', err);
    } finally {
      setTracksLoading(false);
      setIsLoadingTracks(false);
    }
  }, []); // Remove currentFilters dependency to prevent infinite loop

  // Load more tracks (pagination)
  const loadMoreTracks = useCallback(async () => {
    if (!hasMore || tracksLoading) return;
    
    try {
      setTracksLoading(true);
      setError(null);
      
      const nextFilters = {
        ...currentFilters,
        offset: tracks.length,
      };
      
      const result = await musicCatalogService.getTracks(nextFilters);
      
      setTracks(prev => [...prev, ...result.tracks]);
      setTotalTracks(result.total);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more tracks');
      console.error('Error loading more tracks:', err);
    } finally {
      setTracksLoading(false);
    }
  }, [hasMore, tracksLoading, currentFilters, tracks.length]);

  // Refresh tracks
  const refreshTracks = useCallback(async () => {
    await loadTracks(currentFilters);
  }, [loadTracks]); // Only depend on loadTracks, not currentFilters

  // Load playlists
  const loadPlaylists = useCallback(async () => {
    try {
      setPlaylistsLoading(true);
      setError(null);
      
      const result = await musicCatalogService.getPlaylists();
      setPlaylists(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlists');
      console.error('Error loading playlists:', err);
    } finally {
      setPlaylistsLoading(false);
    }
  }, []);

  // Load genres
  const loadGenres = useCallback(async () => {
    try {
      const result = await musicCatalogService.getGenres();
      setGenres(result);
    } catch (err) {
      console.error('Error loading genres:', err);
      // Use default genres on error
      setGenres(['Tất cả', 'Cổ Điển', 'Jazz', 'Acoustic', 'EDM', 'Nhạc Việt', 'Rock', 'Podcast']);
    }
  }, []);

  // Upload track
  const uploadTrack = useCallback(async (
    file: File,
    metadata?: {
      title?: string;
      artist?: string;
      album?: string;
      genre?: string;
    }
  ): Promise<MusicTrack> => {
    try {
      setUploading(true);
      setError(null);
      
      console.log('Starting upload for file:', file.name);
      
      const newTrack = await musicCatalogService.uploadTrack(file, metadata || {});
      
      console.log('Upload completed, refreshing track list:', newTrack.title);
      
      // Refresh the entire track list to ensure we have complete metadata
      await loadTracks(currentFilters);
      
      return newTrack;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload track';
      console.error('Upload failed:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  }, []);

  // Upload multiple tracks
  const uploadMultipleTracks = useCallback(async (
    files: File[],
    onProgress?: (fileName: string, progress: number) => void
  ): Promise<MusicTrack[]> => {
    try {
      setUploading(true);
      setError(null);
      
      console.log('Starting multiple upload for files:', files.map(f => f.name));
      
      const newTracks = await musicCatalogService.uploadMultipleTracks(files, onProgress);
      
      console.log('Multiple upload completed:', newTracks.length, 'tracks');
      
      // Refresh the entire track list to ensure we have complete metadata
      await loadTracks(currentFilters);
      
      return newTracks;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload tracks';
      console.error('Multiple upload failed:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  }, []);

  // Update track
  const updateTrack = useCallback(async (trackId: number, updates: Partial<MusicTrack>) => {
    try {
      setError(null);
      
      const updatedTrack = await musicCatalogService.updateTrack(trackId, updates);
      
      // Update the track in the list
      setTracks(prev => prev.map(track => 
        track.id === trackId ? updatedTrack : track
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update track');
      throw err;
    }
  }, []);

  // Delete single track
  const deleteTrack = useCallback(async (trackId: number) => {
    try {
      setDeleting(true);
      setError(null);
      
      await musicCatalogService.deleteTrack(trackId);
      
      // Remove the track from the list
      setTracks(prev => prev.filter(track => track.id !== trackId));
      setTotalTracks(prev => prev - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete track');
      throw err;
    } finally {
      setDeleting(false);
    }
  }, []);

  // Delete multiple tracks
  const deleteTracks = useCallback(async (trackIds: number[]) => {
    try {
      setDeleting(true);
      setError(null);
      
      await musicCatalogService.deleteTracks(trackIds);
      
      // Remove the tracks from the list
      setTracks(prev => prev.filter(track => !trackIds.includes(track.id)));
      setTotalTracks(prev => prev - trackIds.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tracks');
      throw err;
    } finally {
      setDeleting(false);
    }
  }, []);

  // Create playlist
  const createPlaylist = useCallback(async (data: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }): Promise<Playlist> => {
    try {
      setError(null);
      
      const newPlaylist = await musicCatalogService.createPlaylist(data);
      
      // Add the new playlist to the list
      setPlaylists(prev => [newPlaylist, ...prev]);
      
      return newPlaylist;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create playlist';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Add tracks to playlist
  const addTracksToPlaylist = useCallback(async (playlistId: number, trackIds: number[]) => {
    try {
      setError(null);
      
      await musicCatalogService.addTracksToPlaylist(playlistId, trackIds);
      
      // Update the playlist track count
      setPlaylists(prev => prev.map(playlist =>
        playlist.id === playlistId
          ? { ...playlist, tracks: playlist.tracks + trackIds.length }
          : playlist
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tracks to playlist');
      throw err;
    }
  }, []);

  // Search tracks
  const searchTracks = useCallback(async (query: string) => {
    await loadTracks({ searchQuery: query, limit: 50 });
  }, [loadTracks]);

  // Set filters
  const setFilters = useCallback((filters: MusicCatalogFilters) => {
    setCurrentFilters(prev => ({ ...prev, ...filters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setCurrentFilters(initialFilters);
  }, [initialFilters]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      console.log('Auto-loading initial data...');
      setLoading(true);
      Promise.all([
        loadTracks(initialFilters),
        loadPlaylists(),
        loadGenres(),
      ]).finally(() => {
        setLoading(false);
        console.log('Auto-load completed');
      });
    }
  }, [autoLoad]); // Remove other dependencies to prevent re-loading

  return {
    // Data
    tracks,
    playlists,
    genres,
    totalTracks,
    hasMore,
    
    // Loading states
    loading,
    tracksLoading,
    playlistsLoading,
    uploading,
    deleting,
    
    // Error state
    error,
    
    // Actions
    loadTracks,
    loadMoreTracks,
    refreshTracks,
    loadPlaylists,
    loadGenres,
    uploadTrack,
    uploadMultipleTracks,
    updateTrack,
    deleteTrack,
    deleteTracks,
    createPlaylist,
    addTracksToPlaylist,
    searchTracks,
    
    // Filters
    currentFilters,
    setFilters,
    clearFilters,
  };
}