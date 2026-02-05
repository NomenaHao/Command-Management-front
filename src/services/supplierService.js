import api from './api.js'

export const supplierService = {
  // Obtenir tous les fournisseurs
  getAllSuppliers() {
    return api.get('/suppliers')
  },

  // Obtenir un fournisseur par ID
  getSupplierById(id) {
    return api.get(`/suppliers/${id}`)
  },

  // Créer un nouveau fournisseur
  createSupplier(supplierData) {
    return api.post('/suppliers', supplierData)
  },

  // Mettre à jour un fournisseur
  updateSupplier(id, supplierData) {
    return api.put(`/suppliers/${id}`, supplierData)
  },

  // Supprimer un fournisseur
  deleteSupplier(id) {
    return api.delete(`/suppliers/${id}`)
  },

  // Obtenir les produits d'un fournisseur
  getSupplierProducts(supplierId) {
    return api.get(`/suppliers/${supplierId}/products`)
  },
}

export default supplierService
