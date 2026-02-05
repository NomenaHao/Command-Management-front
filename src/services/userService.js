import api from './api.js'

export const userService = {
  // Obtenir tous les utilisateurs
  getAllUsers() {
    return api.get('/users/all')
  },

  // Créer un nouvel utilisateur
  createUser(userData) {
    return api.post('/users/create', userData)
  },

  // Mettre à jour un utilisateur
  updateUser(userId, userData) {
    return api.put(`/users/${userId}`, userData)
  },

  // Supprimer un utilisateur
  deleteUser(userId) {
    return api.delete(`/users/${userId}`)
  },

  // Obtenir le profil
  getProfile() {
    return api.get('/users/profile')
  },

  // Mettre à jour le profil
  updateProfile(userData) {
    return api.put('/users/profile', userData)
  },
}

export default userService
