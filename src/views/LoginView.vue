<script setup>
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { mdiAccount, mdiAsterisk } from '@mdi/js'
import { useDarkModeStore } from '../stores/darkMode.js'
import authService from '../services/authService.js'
import SectionFullScreen from '../components/SectionFullScreen.vue'
import CardBox from '../components/CardBox.vue'
import FormCheckRadio from '../components/FormCheckRadio.vue'
import FormField from '../components/FormField.vue'
import FormControl from '../components/FormControl.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseButtons from '../components/BaseButtons.vue'
import LayoutGuest from '../layouts/LayoutGuest.vue'

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
  <LayoutGuest>
    <SectionFullScreen v-slot="{ cardClass }" bg="purplePink">
      <CardBox :class="cardClass" is-form @submit.prevent="submit">
        <FormField label="Nom d'utilisateur" help="Veuillez entrer votre nom d'utilisateur">
          <FormControl
            v-model="form.username"
            :icon="mdiAccount"
            name="username"
            autocomplete="username"
            placeholder="Entrez votre nom d'utilisateur"
            :disabled="form.isLoading"
          />
        </FormField>

        <FormField label="Mot de passe" help="Veuillez entrer votre mot de passe">
          <FormControl
            v-model="form.password"
            :icon="mdiAsterisk"
            type="password"
            name="password"
            autocomplete="current-password"
            placeholder="Entrez votre mot de passe"
            :disabled="form.isLoading"
          />
        </FormField>

        <!-- Affichage des erreurs -->
        <div v-if="form.error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {{ form.error }}
        </div>

        <FormCheckRadio
          v-model="form.remember"
          name="remember"
          label="Se souvenir de moi"
          :input-value="true"
          :disabled="form.isLoading"
        />

        <template #footer>
          <BaseButtons>
            <BaseButton 
              type="submit" 
              color="info" 
              label="Se connecter" 
              :disabled="form.isLoading"
            />
            <BaseButton 
              v-if="form.isLoading"
              color="info" 
              label="Connexion..." 
              disabled
            />
          </BaseButtons>
        </template>
      </CardBox>
    </SectionFullScreen>
  </LayoutGuest>
</template>
