<script setup>
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDarkModeStore } from '../stores/darkMode.js'
import { useMainStore } from '../stores/main.js'
import authService from '../services/authService.js'

const form = reactive({
  username: '',
  password: '',
  remember: true,
  isLoading: false,
  error: ''
})

const router = useRouter()
const darkModeStore = useDarkModeStore()

// Activer le mode dark par défaut
onMounted(() => {
  darkModeStore.set(true)
})

const submit = async () => {
  try {
    form.isLoading = true
    form.error = ''
    
    // Appel au service d'authentification
    const response = await authService.login({
      username: form.username,
      password: form.password
    })
    
    if (response.data.token) {
      // Sauvegarder le token et les infos utilisateur
      authService.saveUser(response.data.user, response.data.token)
      
      // Mettre à jour le store avec les infos utilisateur
      const mainStore = useMainStore()
      mainStore.setUser({ 
        username: response.data.user.username,
        avatar: response.data.user.avatar
      })
      
      // Marquer comme authentifié
      localStorage.setItem('isAuthenticated', 'true')
      
      // Rediriger vers le dashboard
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Erreur de connexion:', error)
    
    // Gestion spécifique des erreurs
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      form.error = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.'
    } else if (error.response?.status === 500) {
      form.error = 'Erreur serveur. La base de données est peut-être inaccessible.'
    } else if (error.response?.status === 401) {
      form.error = 'Nom d\'utilisateur ou mot de passe incorrect'
    } else if (error.response?.data?.message) {
      form.error = error.response.data.message
    } else {
      form.error = 'Une erreur est survenue lors de la connexion'
    }
  } finally {
    form.isLoading = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background decorative elements -->
    <div class="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
    <div class="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>

    <!-- Login Container -->
    <div class="w-full max-w-md relative z-10">
      <!-- Card -->
      <div class="bg-white/10 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-white mb-2">Connexion</h1>
          <p class="text-slate-300">Accédez à votre tableau de bord</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="submit" class="space-y-6">
          <!-- Username Field -->
          <div>
            <label class="block text-sm font-medium text-slate-200 mb-2">Nom d'utilisateur</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <input
                v-model="form.username"
                type="text"
                name="username"
                autocomplete="username"
                placeholder="Entrez votre nom d'utilisateur"
                :disabled="form.isLoading"
                class="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 disabled:opacity-50"
              />
            </div>
          </div>

          <!-- Password Field -->
          <div>
            <label class="block text-sm font-medium text-slate-200 mb-2">Mot de passe</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <input
                v-model="form.password"
                type="password"
                name="password"
                autocomplete="current-password"
                placeholder="Entrez votre mot de passe"
                :disabled="form.isLoading"
                class="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 disabled:opacity-50"
              />
            </div>
          </div>

          <!-- Error Message -->
          <transition name="fade">
            <div v-if="form.error" class="p-4 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-sm">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                <p class="text-sm text-red-200">{{ form.error }}</p>
              </div>
            </div>
          </transition>

          <!-- Remember Me -->
          <label class="flex items-center cursor-pointer">
            <input
              v-model="form.remember"
              type="checkbox"
              name="remember"
              :disabled="form.isLoading"
              class="w-4 h-4 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <span class="ml-2 text-sm text-slate-300">Se souvenir de moi</span>
          </label>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="form.isLoading"
            class="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span v-if="!form.isLoading" class="flex items-center justify-center">
              <span>Se connecter</span>
              <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </span>
            <span v-else class="flex items-center justify-center">
              <svg class="animate-spin w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Connexion en cours...
            </span>
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-8">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-white/20"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-slate-800/50 text-slate-400">ou</span>
          </div>
        </div>

        <!-- Help Link -->
        <div class="text-center">
          <p class="text-slate-300 text-sm">
            Besoin d'aide ? 
            <a href="#" class="text-blue-400 hover:text-blue-300 font-medium transition-colors">Contactez le support</a>
          </p>
        </div>
      </div>

      <!-- Footer Text -->
      <p class="text-center text-slate-400 text-xs mt-6">
        © 2026 MISA Admin. Tous droits réservés.
      </p>
    </div>
  </div>
</template>

<style scoped>
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
</style>
