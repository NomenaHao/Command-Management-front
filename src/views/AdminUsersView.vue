<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import LayoutAuthenticated from '../layouts/LayoutAuthenticated.vue'
import SectionMain from '../components/SectionMain.vue'
import CardBox from '../components/CardBox.vue'
import CardBoxComponentHeader from '../components/CardBoxComponentHeader.vue'
import CardBoxComponentTitle from '../components/CardBoxComponentTitle.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseButtons from '../components/BaseButtons.vue'
import BaseIcon from '../components/BaseIcon.vue'
import CardBoxModal from '../components/CardBoxModal.vue'
import FormField from '../components/FormField.vue'
import FormControl from '../components/FormControl.vue'
import userService from '../services/userService.js'
import { mdiPencil, mdiDelete, mdiPlus, mdiEye, mdiEyeOff } from '@mdi/js'

const router = useRouter()

const users = ref([])
const isLoading = ref(false)
const isModalActive = ref(false)
const isEditingUser = ref(false)
const error = ref('')
const success = ref('')

const form = ref({
  username: '',
  password: '',
  confirmPassword: '',
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const currentUserId = ref(null)

const formTitle = computed(() => (isEditingUser.value ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'))

onMounted(() => {
  loadUsers()
})

const loadUsers = async () => {
  try {
    isLoading.value = true
    const response = await userService.getAllUsers()
    users.value = response.data.users
    error.value = ''
  } catch (err) {
    // console.error('Aucun utilisateur:', err)
    // error.value = 'Aucun utilisateur'
  } finally {
    isLoading.value = false
  }
}

const openUserModal = (user = null) => {
  if (user) {
    isEditingUser.value = true
    currentUserId.value = user.id
    form.value = {
      username: user.username,
      password: '',
      confirmPassword: '',
    }
  } else {
    isEditingUser.value = false
    currentUserId.value = null
    form.value = {
      username: '',
      password: '',
      confirmPassword: '',
    }
  }
  showPassword.value = false
  showConfirmPassword.value = false
  isModalActive.value = true
}

const closeUserModal = () => {
  isModalActive.value = false
  form.value = {
    username: '',
    password: '',
    confirmPassword: '',
  }
  currentUserId.value = null
  isEditingUser.value = false
  error.value = ''
  showPassword.value = false
  showConfirmPassword.value = false
}

const saveUser = async () => {
  try {
    error.value = ''
    success.value = ''


    if (!form.value.username.trim()) {
      error.value = 'Le nom d\'utilisateur est requis'
      return
    }

    if (!isEditingUser.value && !form.value.password) {
      error.value = 'Le mot de passe est requis pour une nouvelle création'
      return
    }

    if (isEditingUser.value && form.value.password && form.value.password !== form.value.confirmPassword) {
      error.value = 'Les mots de passe ne correspondent pas'
      return
    }

    const userData = {
      username: form.value.username,
    }

    // Ajouter le password seulement si fourni
    if (form.value.password) {
      userData.password = form.value.password
    }

    if (isEditingUser.value) {
      // Mise à jour
      await userService.updateUser(currentUserId.value, userData)
      success.value = 'Utilisateur mis à jour avec succès'
    } else {
      // Création
      await userService.createUser(userData)
      success.value = 'Utilisateur créé avec succès'
    }

    await loadUsers()
    closeUserModal()

    // Afficher le message de succès pendant 3 secondes
    setTimeout(() => {
      success.value = ''
    }, 3000)
  } catch (err) {
    console.error('Erreur lors de la sauvegarde:', err)
    error.value = err.response?.data?.message || 'Erreur lors de la sauvegarde'
  }
}

const deleteUser = async (id, username) => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${username}" ?`)) {
    try {
      error.value = ''
      success.value = ''
      
      await userService.deleteUser(id)
      success.value = 'Utilisateur supprimé avec succès'
      
      await loadUsers()

      // Afficher le message de succès pendant 3 secondes
      setTimeout(() => {
        success.value = ''
      }, 3000)
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      error.value = err.response?.data?.message || 'Erreur lors de la suppression'
    }
  }
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Gestion des utilisateurs
          </h1>
          <p class="mt-1 text-gray-600 dark:text-gray-400">
            Créez, modifiez et supprimez des utilisateurs administrateurs
          </p>
        </div>
        <BaseButton
          color="info"
          :icon="mdiPlus"
          label="Ajouter un utilisateur"
          @click="openUserModal()"
        />
      </div>

      <!-- Messages d'erreur et succès -->
      <div v-if="error" class="mb-4 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
        {{ error }}
      </div>
      <div v-if="success" class="mb-4 rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-400">
        {{ success }}
      </div>

      <!-- Tableau des utilisateurs -->
      <CardBox class="mb-6 overflow-hidden">
        <CardBoxComponentHeader>
          <CardBoxComponentTitle>Liste des utilisateurs</CardBoxComponentTitle>
        </CardBoxComponentHeader>

        <div v-if="isLoading" class="p-6 text-center">
          <p class="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>

        <div v-else-if="users.length === 0" class="p-6 text-center">
          <p class="text-gray-600 dark:text-gray-400">Aucun utilisateur trouvé</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Nom d'utilisateur
                </th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Date de création
                </th>
                <th class="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in users"
                :key="user.id"
                class="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {{ user.username }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {{ new Date(user.created_at).toLocaleDateString('fr-FR') }}
                </td>
                <td class="px-6 py-4 text-right">
                  <BaseButtons type="justify-end" no-wrap>
                    <BaseButton
                      color="info"
                      :icon="mdiPencil"
                      small
                      @click="openUserModal(user)"
                    />
                    <BaseButton
                      color="danger"
                      :icon="mdiDelete"
                      small
                      @click="deleteUser(user.id, user.username)"
                    />
                  </BaseButtons>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardBox>
    </SectionMain>

    <!-- Modal pour créer/modifier un utilisateur -->
    <CardBoxModal
      v-model="isModalActive"
      :title="formTitle"
      button="info"
      button-label="Sauvegarder"
      @confirm="saveUser"
      @cancel="closeUserModal"
    >
      <FormField label="Nom d'utilisateur" help="Entrez un nom d'utilisateur unique (lettres, chiffres, tirets bas)">
        <FormControl
          v-model="form.username"
          type="text"
          placeholder="ex: jean_dupont"
        />
      </FormField>

      <FormField
        label="Mot de passe"
        :help="isEditingUser.value ? 'Laissez vide pour garder le mot de passe actuel' : 'Entrez un mot de passe sécurisé (minimum 6 caractères)'"
      >
        <div class="relative">
          <FormControl
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="isEditingUser.value ? 'Laisser vide pour ne pas changer' : 'Entrez un mot de passe'"
          />
          <button
            v-if="form.password"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="showPassword = !showPassword"
          >
            <BaseIcon :path="showPassword ? mdiEyeOff : mdiEye" :size="20" />
          </button>
        </div>
      </FormField>

      <FormField
        v-if="form.password"
        label="Confirmer le mot de passe"
        help="Confirmez le mot de passe"
      >
        <div class="relative">
          <FormControl
            v-model="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="Confirmez le mot de passe"
          />
          <button
            v-if="form.confirmPassword"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <BaseIcon :path="showConfirmPassword ? mdiEyeOff : mdiEye" :size="20" />
          </button>
        </div>
      </FormField>

      <div v-if="error" class="mt-4 rounded-lg bg-red-50 p-3 text-red-800 dark:bg-red-900/20 dark:text-red-400">
        {{ error }}
      </div>
    </CardBoxModal>
  </LayoutAuthenticated>
</template>
