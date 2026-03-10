// Export all services
export * from './api';
export * from './azuracastApi';
export * from './musicCatalogService';
// Selectively re-export from livestreamService to avoid duplicate names
export type { TrackInfo, ApiResponse, SongRequestItem } from './livestreamService';
export { livestreamService as _livestreamService } from './livestreamService';

// Export userService types
export type { UserDto, PagedResult, GetUsersParams } from './userService';

// Export default instances for easy use
export { default as musicCatalogApi } from './azuracastApi';
export { default as musicCatalogService } from './musicCatalogService';
export { default as livestreamService } from './livestreamService';
export { default as userService } from './userService';
