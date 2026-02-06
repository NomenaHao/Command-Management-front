<script setup>
import { reactive, ref } from 'vue'
import { useMainStore } from '../stores/main'
import { mdiAccount, mdiAsterisk, mdiFormTextboxPassword } from '@mdi/js'
import SectionMain from '../components/SectionMain.vue'
import CardBox from '../components/CardBox.vue'
import BaseDivider from '../components/BaseDivider.vue'
import FormField from '../components/FormField.vue'
import FormControl from '../components/FormControl.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseButtons from '../components/BaseButtons.vue'
import UserCard from '../components/UserCard.vue'
import LayoutAuthenticated from '../layouts/LayoutAuthenticated.vue'
import SectionTitleLineWithButton from '../components/SectionTitleLineWithButton.vue'
import authService from '../services/authService.js'
import userService from '../services/userService.js'

const mainStore = useMainStore()

const profileForm = reactive({
  name: mainStore.userName,
})

const avatarFile = ref(null)
const avatarPreview = ref(mainStore.userAvatarPath)
const isLoading = ref(false)
const success = ref('')
const error = ref('')

const passwordForm = reactive({
  password_current: '',
  password: '',
  password_confirmation: '',
})

const handleAvatarSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    avatarFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const submitProfile = async () => {
  try {
    isLoading.value = true
    error.value = ''
    success.value = ''
    
    const formData = new FormData()
    formData.append('username', profileForm.name)
    
    if (avatarFile.value) {
      formData.append('avatar', avatarFile.value)
    }
    
    await authService.updateProfile(formData)
    
    // Recharger les données utilisateur depuis la liste (car /users/me retourne 500)
    const usersResponse = await userService.getAllUsers()
    if (usersResponse.data && usersResponse.data.users) {
      const currentUser = usersResponse.data.users.find(u => u.username === profileForm.name)
      if (currentUser) {
        mainStore.setUser({
          username: currentUser.username,
          avatar: currentUser.avatar
        })
        // Mettre à jour localStorage pour persister l'avatar
        const currentToken = localStorage.getItem('token')
        authService.saveUser(currentUser, currentToken)
        avatarPreview.value = currentUser.avatar
      }
    }
    
    success.value = 'Profil mis à jour avec succès'
    avatarFile.value = null
    
    setTimeout(() => {
      success.value = ''
    }, 3000)
  } catch (err) {
    console.error('Erreur mise à jour profil:', err)
    error.value = err.response?.data?.message || 'Erreur lors de la mise à jour du profil'
  } finally {
    isLoading.value = false
  }
}

const submitPass = () => {
  //
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :icon="mdiAccount" title="Profile" main>
      
      </SectionTitleLineWithButton>

      <UserCard class="mb-6" />

      <!-- Messages de succès et d'erreur -->
      <div v-if="success" class="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
        {{ success }}
      </div>
      <div v-if="error" class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        {{ error }}
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CardBox is-form @submit.prevent="submitProfile">
          <FormField label="Avatar" help="Max 500kb">
            <!-- Aperçu de l'avatar -->
            <div v-if="avatarPreview" class="mb-4 flex justify-center">
              <img 
                :src="avatarPreview.startsWith('/') ? `http://localhost:3001${avatarPreview}` : avatarPreview" 
                alt="Avatar preview" 
                class="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg"
              />
            </div>
            
            <!-- Input file -->
            <label class="block">
              <input 
                type="file" 
                accept="image/*"
                @change="handleAvatarSelect"
                class="hidden"
              >
              <span class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Choisir une image
              </span>
            </label>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Formats supportés: JPG, PNG, GIF (Max 5MB)</p>
          </FormField>

          <FormField label="Name" help="Required. Your name">
            <FormControl
              v-model="profileForm.name"
              :icon="mdiAccount"
              name="username"
              required
              autocomplete="username"
            />
          </FormField>

          <template #footer>
            <BaseButtons>
              <BaseButton color="info" type="submit" label="Submit" :disabled="isLoading" />
            </BaseButtons>
          </template>
        </CardBox>

        <CardBox is-form @submit.prevent="submitPass">
          <FormField label="Current password" help="Required. Your current password">
            <FormControl
              v-model="passwordForm.password_current"
              :icon="mdiAsterisk"
              name="password_current"
              type="password"
              required
              autocomplete="current-password"
            />
          </FormField>

          <BaseDivider />

          <FormField label="New password" help="Required. New password">
            <FormControl
              v-model="passwordForm.password"
              :icon="mdiFormTextboxPassword"
              name="password"
              type="password"
              required
              autocomplete="new-password"
            />
          </FormField>

          <FormField label="Confirm password" help="Required. New password one more time">
            <FormControl
              v-model="passwordForm.password_confirmation"
              :icon="mdiFormTextboxPassword"
              name="password_confirmation"
              type="password"
              required
              autocomplete="new-password"
            />
          </FormField>

          <template #footer>
            <BaseButtons>
              <BaseButton type="submit" color="info" label="Submit" />
            </BaseButtons>
          </template>
        </CardBox>
      </div>
    </SectionMain>
  </LayoutAuthenticated>
</template>
