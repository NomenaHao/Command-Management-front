import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useMainStore = defineStore('main', () => {
  const userName = ref('')  // Sera mis à jour après connexion
  const userAvatarPath = ref('')  // Avatar uploadé par l'utilisateur

  const userAvatar = computed(
    () => {
      // Si l'utilisateur a un avatar uploadé, l'utiliser
      if (userAvatarPath.value) {
        return userAvatarPath.value.startsWith('http') 
          ? userAvatarPath.value 
          : `http://localhost:3001${userAvatarPath.value}`
      }
      // Sinon, utiliser Dicebear
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName.value.replace(
        /[^a-z0-9]+/gi,
        '-',
      )}`
    },
  )

  const isFieldFocusRegistered = ref(false)

  const clients = ref([])
  const history = ref([])

  function setUser(payload) {
    if (payload.username) {
      userName.value = payload.username
    }
    if (payload.avatar && payload.avatar.trim() !== '') {
      userAvatarPath.value = payload.avatar
    }
  }

  function fetchSampleClients() {
    axios
      .get(`data-sources/clients.json?v=3`)
      .then((result) => {
        clients.value = result?.data?.data
      })
      .catch((error) => {
        alert(error.message)
      })
  }

  function fetchSampleHistory() {
    axios
      .get(`data-sources/history.json`)
      .then((result) => {
        history.value = result?.data?.data
      })
      .catch((error) => {
        alert(error.message)
      })
  }

  return {
    userName,
    userAvatarPath,
    userAvatar,
    isFieldFocusRegistered,
    clients,
    history,
    setUser,
    fetchSampleClients,
    fetchSampleHistory,
  }
})
