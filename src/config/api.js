// Configuration des URLs de l'API
export const API_BASE_URL = 'http://localhost:3001/api'

// Endpoints de l'API
export const API_ENDPOINTS = {
  // Authentification
  AUTH: {
    LOGIN: '/users/login',
    REGISTER: '/users/register',
    PROFILE: '/users/profile',
  },
  
  // Produits
  PRODUCTS: {
    ALL: '/products',
    BY_ID: (id) => `/products/${id}`,
    BY_SUPPLIER: (supplierId) => `/products/supplier/${supplierId}`,
    CREATE: '/products',
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
    UPLOAD_IMAGE: (id) => `/products/${id}/image`,
  },
  
  // Fournisseurs
  SUPPLIERS: {
    ALL: '/suppliers',
    BY_ID: (id) => `/suppliers/${id}`,
    CREATE: '/suppliers',
    UPDATE: (id) => `/suppliers/${id}`,
    DELETE: (id) => `/suppliers/${id}`,
    PRODUCTS: (id) => `/suppliers/${id}/products`,
  },
}

export default {
  API_BASE_URL,
  API_ENDPOINTS,
}
