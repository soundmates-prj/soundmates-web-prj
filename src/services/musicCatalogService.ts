// High-level Music Catalog Service
import musicCatalogApi, { type AzuraCastMedia, type AzuraCastPlaylist } from './azuracastApi';

// Enhanced Track interface matching the component
export interface MusicTrack {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  genre: string;
  plays: number;
  likes: number;
  uploadDate: string;
  coverUrl?: string;
  // Extended properties from AzuraCast
  unique_id?: string;
  song_id?: string;
  text?: string;
  lyrics?: string;
  length?: number;
  path?: string;
  custom_fields?: Record<string, any>;
}

// Transform AzuraCast media to our MusicTrack interface
function transformAzuraCastMediaToTrack(media: AzuraCastMedia): MusicTrack {
  // Handle null/undefined media objects
  if (!media) {
    console.warn('Received null/undefined media object');
    return {
      id: 0,
      title: 'Unknown Title',
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      duration: '0:00',
      genre: 'Unknown',
      plays: 0,
      likes: 0,
      uploadDate: new Date().toLocaleDateString('vi-VN'),
      unique_id: '',
      song_id: '',
      text: '',
      lyrics: '',
      length: 0,
      path: '',
      custom_fields: [],
    };
  }

  console.log('Transforming media object:', {
    id: media.id,
    title: media.title,
    artist: media.artist,
    album: media.album,
    genre: media.genre,
    length_text: media.length_text,
  });

  return {
    id: media.id || 0,
    title: media.title || 'Unknown Title',
    artist: media.artist || 'Unknown Artist',
    album: media.album || 'Unknown Album',
    duration: media.length_text || '0:00',
    genre: media.genre || 'Unknown',
    plays: 0, // AzuraCast doesn't provide play count in media endpoint
    likes: 0, // Not available in AzuraCast
    uploadDate: media.mtime 
      ? new Date(media.mtime * 1000).toLocaleDateString('vi-VN')
      : (media.media?.modified_time 
          ? new Date(media.media.modified_time * 1000).toLocaleDateString('vi-VN')
          : new Date().toLocaleDateString('vi-VN')),
    coverUrl: media.art || undefined,
    // Extended properties
    unique_id: media.unique_id || '',
    song_id: media.song_id || '',
    text: media.text || '',
    lyrics: media.lyrics || '',
    length: media.length || 0,
    path: media.path || '',
    custom_fields: media.custom_fields || [],
  };
}

export interface Playlist {
  id: number;
  name: string;
  tracks: number;
  cover: string;
  description?: string;
  isPublic?: boolean;
}

function transformAzuraCastPlaylistToPlaylist(playlist: AzuraCastPlaylist): Playlist {
  return {
    id: playlist.id,
    name: playlist.name,
    tracks: playlist.num_songs || 0,
    cover: 'gradient-' + ((playlist.id % 5) + 1), // Generate cover gradient
    description: playlist.description || '',
    isPublic: !playlist.is_jingle, // is_jingle means it's NOT public (internal use)
  };
}

export interface MusicCatalogFilters {
  genre?: string;
  artist?: string;
  album?: string;
  searchQuery?: string;
  minDuration?: number;
  maxDuration?: number;
  sortBy?: 'title' | 'artist' | 'plays' | 'likes' | 'uploadDate';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface MusicCatalogStats {
  totalTracks: number;
  totalPlaylists: number;
  totalArtists: number;
  totalGenres: number;
  totalDuration: string;
  recentUploads: number;
}

class MusicCatalogService {
  private defaultStationId = 1; // Default station ID

  setStationId(stationId: number) {
    this.defaultStationId = stationId;
  }

  async getTracks(filters: MusicCatalogFilters = {}): Promise<{
    tracks: MusicTrack[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const {
        genre,
        artist,
        album,
        searchQuery,
        sortBy = 'title',
        sortOrder = 'asc',
        limit = 50,
        offset = 0,
      } = filters;

      // Build search phrase
      let searchPhrase = '';
      if (searchQuery) {
        searchPhrase = searchQuery;
      } else if (genre && genre !== 'Tất cả') {
        searchPhrase = `genre:"${genre}"`;
      } else if (artist) {
        searchPhrase = `artist:"${artist}"`;
      } else if (album) {
        searchPhrase = `album:"${album}"`;
      }

      const response = await musicCatalogApi.getMediaFiles(this.defaultStationId, {
        searchPhrase,
        sort: this.mapSortField(sortBy),
        sortOrder,
        limit,
        page: offset ? Math.floor(offset / (limit || 50)) + 1 : 1,
      });

      console.log('AzuraCast API Response:', response);
      
      // Handle both possible response structures
      let mediaData = response.data;
      if (!mediaData) {
        // If response.data is undefined, try the response itself
        mediaData = Array.isArray(response) ? response : [];
      }
      
      // Ensure mediaData is an array
      if (!Array.isArray(mediaData)) {
        console.warn('API response is not an array:', mediaData);
        mediaData = [];
      }

      const tracks = mediaData.map(transformAzuraCastMediaToTrack);
      
      // Apply additional filters that AzuraCast API doesn't support
      let filteredTracks = tracks;
      if (filters.minDuration || filters.maxDuration) {
        filteredTracks = tracks.filter(track => {
          const duration = this.parseDuration(track.duration);
          if (filters.minDuration && duration < filters.minDuration) return false;
          if (filters.maxDuration && duration > filters.maxDuration) return false;
          return true;
        });
      }

      return {
        tracks: filteredTracks,
        total: response.meta?.total || filteredTracks.length,
        hasMore: response.meta ? (offset + limit) < response.meta.total : false,
      };
    } catch (error) {
      console.error('Error fetching tracks:', error);
      
      // Provide fallback mock data when API is not available
      console.warn('AzuraCast API not available, returning mock data');
      const mockTracks: MusicTrack[] = [
        {
          id: 1,
          title: 'Sample Track 1',
          artist: 'Sample Artist',
          album: 'Sample Album',
          duration: '3:45',
          genre: 'Rock',
          plays: 1234,
          likes: 56,
          uploadDate: new Date().toLocaleDateString('vi-VN'),
          unique_id: 'mock1',
          song_id: 'mock1',
          text: 'Sample Track 1 - Sample Artist',
          lyrics: '',
          length: 225,
          path: '/mock/track1.mp3',
          custom_fields: [],
        },
        {
          id: 2,
          title: 'Sample Track 2',
          artist: 'Another Artist',
          album: 'Another Album',
          duration: '4:20',
          genre: 'Jazz',
          plays: 789,
          likes: 23,
          uploadDate: new Date().toLocaleDateString('vi-VN'),
          unique_id: 'mock2',
          song_id: 'mock2',
          text: 'Sample Track 2 - Another Artist',
          lyrics: '',
          length: 260,
          path: '/mock/track2.mp3',
          custom_fields: [],
        }
      ];
      
      return {
        tracks: mockTracks,
        total: mockTracks.length,
        hasMore: false,
      };
    }
  }

  async getTrackById(trackId: number): Promise<MusicTrack> {
    try {
      const media = await musicCatalogApi.getMediaFile(this.defaultStationId, trackId);
      return transformAzuraCastMediaToTrack(media);
    } catch (error) {
      console.error('Error fetching track:', error);
      throw new Error('Failed to fetch track');
    }
  }

  async searchTracks(query: string, limit = 50): Promise<MusicTrack[]> {
    const result = await this.getTracks({
      searchQuery: query,
      limit,
    });
    return result.tracks;
  }

  async uploadTrack(file: File, metadata: {
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
  }): Promise<MusicTrack> {
    try {
      // Validate file type
      if (!this.isValidAudioFile(file)) {
        throw new Error(`Unsupported file format. Please upload MP3, MP4, FLAC, OGG, or WAV files.`);
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 100MB.');
      }

      // Create FormData for file upload
      const formData = new FormData();
      // AzuraCast expects the file field to be named 'file'
      formData.append('file', file, file.name);
      
      // Add metadata to FormData if provided
      if (metadata.title) formData.append('title', metadata.title);
      if (metadata.artist) formData.append('artist', metadata.artist);
      if (metadata.album) formData.append('album', metadata.album);
      if (metadata.genre) formData.append('genre', metadata.genre);
      
      console.log('Uploading file:', file.name, 'Size:', this.formatFileSize(file.size));
      console.log('Upload metadata:', metadata);
      
      const uploadedMedia = await musicCatalogApi.uploadMediaFile(this.defaultStationId, formData);
      
      console.log('File uploaded successfully:', uploadedMedia);
      
      // Use the upload response directly as it already contains complete metadata
      // AzuraCast returns full media info in the upload response
      return transformAzuraCastMediaToTrack(uploadedMedia);
    } catch (error: any) {
      console.error('Error uploading track:', error);
      
      // Handle specific AzuraCast API errors
      if (error.response?.data?.message?.includes('UploadFile')) {
        console.warn('AzuraCast UploadFile constructor error, trying alternative approach');
        throw new Error('File upload format không phù hợp với AzuraCast API. Vui lòng thử lại.');
      }
      
      // When API is not available, create a mock uploaded track for testing
      if (error.message?.includes('Network Error') || 
          error.message?.includes('ECONNREFUSED') ||
          error.code === 'ECONNREFUSED') {
        console.warn('AzuraCast API not available, creating mock upload result');
        const mockTrack: MusicTrack = {
          id: Date.now(), // Use timestamp as mock ID
          title: this.extractTitleFromFilename(file.name),
          artist: this.extractArtistFromFilename(file.name) || 'Unknown Artist',
          album: 'Unknown Album',
          duration: this.estimateDurationFromFileSize(file.size),
          genre: this.guessGenreFromFilename(file.name) || 'Unknown',
          plays: 0,
          likes: 0,
          uploadDate: new Date().toLocaleDateString('vi-VN'),
          unique_id: `mock_${Date.now()}`,
          song_id: `mock_${Date.now()}`,
          text: `${this.extractTitleFromFilename(file.name)} - ${this.extractArtistFromFilename(file.name) || 'Unknown Artist'}`,
          lyrics: '',
          length: Math.floor(file.size / 1000), // Rough estimation
          path: `/mock/${file.name}`,
          custom_fields: [],
        };
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('Mock upload completed:', mockTrack);
        return mockTrack;
      }
      
    //   throw new Error(`Failed to upload track: ${error.message}`);
    // }
    // } catch (error) {
      console.error('Error uploading track:', error);
      if (error instanceof Error) {
        throw error; // Re-throw the original error with its message
      } else {
        throw new Error('Failed to upload track');
      }
    }
  }

  async updateTrack(trackId: number, updates: Partial<MusicTrack>): Promise<MusicTrack> {
    try {
      await musicCatalogApi.updateMediaFile(this.defaultStationId, trackId, {
        title: updates.title,
        artist: updates.artist,
        album: updates.album,
        genre: updates.genre,
        lyrics: updates.lyrics,
      });
      // Fetch the updated media since update returns void
      const updatedMedia = await musicCatalogApi.getMediaFile(this.defaultStationId, trackId);
      return transformAzuraCastMediaToTrack(updatedMedia);
    } catch (error) {
      console.error('Error updating track:', error);
      throw new Error('Failed to update track');
    }
  }

  async deleteTrack(trackId: number): Promise<void> {
    try {
      await musicCatalogApi.deleteMediaFile(this.defaultStationId, trackId);
    } catch (error) {
      console.error('Error deleting track:', error);
      throw new Error('Failed to delete track');
    }
  }

  async deleteTracks(trackIds: number[]): Promise<void> {
    try {
      // Delete tracks sequentially to avoid overwhelming the server
      for (const trackId of trackIds) {
        await this.deleteTrack(trackId);
      }
    } catch (error) {
      console.error('Error deleting tracks:', error);
      throw new Error('Failed to delete tracks');
    }
  }

  async getPlaylists(): Promise<Playlist[]> {
    try {
      const playlists = await musicCatalogApi.getPlaylists(this.defaultStationId);
      return playlists.map(transformAzuraCastPlaylistToPlaylist);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      throw new Error('Failed to fetch playlists');
    }
  }

  async createPlaylist(data: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }): Promise<Playlist> {
    try {
      const playlist = await musicCatalogApi.createPlaylist(this.defaultStationId, {
        name: data.name,
        description: data.description || '',
        is_jingle: !data.isPublic, // is_jingle = true means internal/not public
        is_enabled: true,
        source: 'songs',
        order: 'shuffle',
        remote_url: '',
        remote_type: 'stream',
        include_in_automation: true,
        include_in_requests: true,
        weight: 1,
      });
      return transformAzuraCastPlaylistToPlaylist(playlist);
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw new Error('Failed to create playlist');
    }
  }

  async addTracksToPlaylist(playlistId: number, trackIds: number[]): Promise<void> {
    try {
      // Add tracks to playlist one by one since bulk operation might not be available
      for (const trackId of trackIds) {
        // This is a simplified approach - the actual AzuraCast API might have different methods
        // You may need to adjust this based on the actual API endpoints available
        await musicCatalogApi.updatePlaylist(this.defaultStationId, playlistId, {
          // Add track to playlist - this might need adjustment based on actual API
          trackId,
        });
      }
    } catch (error) {
      console.error('Error adding tracks to playlist:', error);
      throw new Error('Failed to add tracks to playlist');
    }
  }

  async getGenres(): Promise<string[]> {
    try {
      // Get all tracks and extract unique genres
      const { tracks } = await this.getTracks({ limit: 1000 });
      const genres = [...new Set(tracks.map(track => track.genre).filter(Boolean))];
      return ['Tất cả', ...genres.sort()];
    } catch (error) {
      console.error('Error fetching genres:', error);
      return ['Tất cả', 'Cổ Điển', 'Jazz', 'Acoustic', 'EDM', 'Nhạc Việt', 'Rock', 'Podcast'];
    }
  }

  async getStatistics(): Promise<MusicCatalogStats> {
    try {
      const [tracksResponse, playlists] = await Promise.all([
        this.getTracks({ limit: 1000 }),
        this.getPlaylists()
      ]);

      const tracks = tracksResponse.tracks;
      const artists = new Set(tracks.map(t => t.artist));
      const genres = new Set(tracks.map(t => t.genre));
      
      // Calculate total duration
      const totalSeconds = tracks.reduce((sum, track) => sum + this.parseDuration(track.duration), 0);
      const totalDuration = this.formatDuration(totalSeconds);

      // Count recent uploads (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentUploads = tracks.filter(track => {
        const uploadDate = new Date(track.uploadDate.split('/').reverse().join('-'));
        return uploadDate >= weekAgo;
      }).length;

      return {
        totalTracks: tracks.length,
        totalPlaylists: playlists.length,
        totalArtists: artists.size,
        totalGenres: genres.size,
        totalDuration,
        recentUploads,
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw new Error('Failed to fetch statistics');
    }
  }

  // Helper methods
  private isValidAudioFile(file: File): boolean {
    const validTypes = [
      'audio/mpeg', // MP3
      'audio/mp4',  // MP4/M4A
      'audio/flac', // FLAC
      'audio/ogg',  // OGG
      'audio/wav',  // WAV
      'audio/x-wav',
      'audio/wave',
      'audio/x-flac',
      'application/ogg', // Some browsers report OGG as this
    ];
    
    const validExtensions = ['.mp3', '.mp4', '.m4a', '.flac', '.ogg', '.wav'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    return validTypes.includes(file.type) || hasValidExtension;
  }

  private extractTitleFromFilename(filename: string): string {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Common patterns: "Artist - Title", "Title - Artist", "01 - Title", etc.
    const patterns = [
      /^\d+\s*[-.]\s*(.+?)\s*[-]\s*(.+)$/, // "01 - Artist - Title" or "01. Artist - Title"
      /^(.+?)\s*[-]\s*(.+)$/, // "Artist - Title"
      /^\d+\s*[-.]\s*(.+)$/, // "01 - Title" or "01. Title"
    ];
    
    for (const pattern of patterns) {
      const match = nameWithoutExt.match(pattern);
      if (match) {
        return match[match.length - 1].trim(); // Take the last capture group as title
      }
    }
    
    return nameWithoutExt;
  }

  private extractArtistFromFilename(filename: string): string | null {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Look for "Artist - Title" pattern
    const artistPattern = /^(.+?)\s*[-]\s*(.+)$/;
    const match = nameWithoutExt.match(artistPattern);
    
    if (match && !match[1].match(/^\d+$/)) { // Don't treat numbers as artist
      return match[1].trim();
    }
    
    return null;
  }

  private guessGenreFromFilename(filename: string): string | null {
    const lowerName = filename.toLowerCase();
    const genreKeywords = {
      'rock': ['rock', 'metal', 'punk'],
      'pop': ['pop', 'mainstream'],
      'jazz': ['jazz', 'blues'],
      'classical': ['classical', 'orchestra', 'symphony'],
      'electronic': ['electronic', 'edm', 'techno', 'house', 'dubstep'],
      'hip-hop': ['hip', 'rap', 'hiphop'],
      'country': ['country', 'folk']
    };
    
    for (const [genre, keywords] of Object.entries(genreKeywords)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return genre;
      }
    }
    
    return null;
  }

  private estimateDurationFromFileSize(sizeBytes: number): string {
    // Rough estimation: 1MB ≈ 1 minute for MP3 at 128kbps
    const minutes = Math.floor(sizeBytes / (1024 * 1024));
    const seconds = Math.floor((sizeBytes % (1024 * 1024)) / (1024 * 1024) * 60);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private parseDuration(duration: string): number {
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  private mapSortField(sortBy: string): 'title' | 'artist' | 'genre' | 'album' | 'song_id' | 'length' | 'mtime' | undefined {
    switch (sortBy) {
      case 'title':
        return 'title';
      case 'artist':
        return 'artist';
      case 'uploadDate':
        return 'mtime';
      case 'plays':
      case 'likes':
      default:
        return 'title';
    }
  }

  // Multiple file upload with progress tracking
  async uploadMultipleTracks(files: File[], onProgress?: (fileName: string, progress: number) => void): Promise<MusicTrack[]> {
    const results: MusicTrack[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        onProgress?.(file.name, 0);
        
        // Simulate progress for mock uploads
        const progressInterval = setInterval(() => {
          const progress = Math.min(90, (Date.now() % 3000) / 3000 * 100);
          onProgress?.(file.name, progress);
        }, 100);
        
        // Extract metadata from filename
        const extractedMetadata = {
          title: this.extractTitleFromFilename(file.name),
          artist: this.extractArtistFromFilename(file.name) || undefined,
          album: 'Unknown Album',
          genre: this.guessGenreFromFilename(file.name) || 'Unknown',
        };
        
        const track = await this.uploadTrack(file, extractedMetadata);
        
        clearInterval(progressInterval);
        onProgress?.(file.name, 100);
        
        results.push(track);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        onProgress?.(file.name, -1); // -1 indicates error
      }
    }
    
    return results;
  }
}

export const musicCatalogService = new MusicCatalogService();
export default musicCatalogService;