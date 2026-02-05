import api from './api.js'

export const productService = {
  // Obtenir tous les produits
  getAllProducts() {
    return api.get('/products')
  },

  // Obtenir un produit par ID
  getProductById(id) {
    return api.get(`/products/${id}`)
  },

  // Obtenir les produits d'un fournisseur
  getProductsBySupplier(supplierId) {
    return api.get(`/products/supplier/${supplierId}`)
  },

  // Créer un nouveau produit
  createProduct(productData) {
    return api.post('/products', productData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // Mettre à jour un produit
  updateProduct(id, productData) {
    return api.put(`/products/${id}`, productData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // Supprimer un produit
  deleteProduct(id) {
    return api.delete(`/products/${id}`)
  },

  // Upload d'image de produit
  uploadProductImage(id, formData) {
    return api.post(`/products/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

export default productService
