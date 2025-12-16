// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  COUNT: `${API_BASE_URL}/count`,
  ENTITIES: (major, minor, offset = 0, limit = 50) => 
    `${API_BASE_URL}/entities?major=${major}&minor=${minor}&offset=${offset}&limit=${limit}`,
  ENTITY_METADATA: (entityId) => 
    `${API_BASE_URL}/entities/${entityId}/metadata`,
  ENTITY_RELATIONS: (entityId) => 
    `${API_BASE_URL}/entities/${entityId}/relations`,
};

export default API_BASE_URL;

