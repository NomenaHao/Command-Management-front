import api from './api.js'

export const userService = {
  // Obtenir tous les utilisateurs
  getAllUsers() {
    return api.get('/users/all')
  },

  // Créer un nouvel utilisateur
  createUser(userData) {
    const config = {}
    // Si c'est FormData, on ne doit pas définir Content-Type (laisse le navigateur le faire)
    if (userData instanceof FormData) {
      config.headers = {
        'Content-Type': 'multipart/form-data'
      }
    }
    return api.post('/users/create', userData, config)
  },

  // Mettre à jour un utilisateur
  updateUser(userId, userData) {
    const config = {}
    if (userData instanceof FormData) {
      config.headers = {
        'Content-Type': 'multipart/form-data'
      }
    }
    return api.put(`/users/${userId}`, userData, config)
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
