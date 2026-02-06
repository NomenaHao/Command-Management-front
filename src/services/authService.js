import api from './api.js'

export const authService = {
  // Login
  login(credentials) {
    return api.post('/users/login', credentials)
  },

  // Register
  register(userData) {
    return api.post('/users/register', userData)
  },

  // Logout
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  // Obtenir le profil utilisateur
  getProfile() {
    return api.get('/users/me')
  },

  // Mettre à jour le profil
  updateProfile(userData) {
    return api.put('/users/profile', userData)
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    const token = localStorage.getItem('token')
    return !!token
  },

  // Obtenir les infos de l'utilisateur connecté
  getCurrentUser() {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  // Sauvegarder les infos de l'utilisateur
  saveUser(user, token) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  },
}

export default authService
