<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { mdiPlus, mdiPencil, mdiTrashCan, mdiTableBorder, mdiArrowRight } from '@mdi/js'
import SectionMain from '../components/SectionMain.vue'
import CardBox from '../components/CardBox.vue'
import CardBoxComponentHeader from '../components/CardBoxComponentHeader.vue'
import CardBoxComponentTitle from '../components/CardBoxComponentTitle.vue'
import LayoutAuthenticated from '../layouts/LayoutAuthenticated.vue'
import SectionTitleLineWithButton from '../components/SectionTitleLineWithButton.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseButtons from '../components/BaseButtons.vue'
import CardBoxModal from '../components/CardBoxModal.vue'
import FormField from '../components/FormField.vue'
import FormControl from '../components/FormControl.vue'
import supplierService from '../services/supplierService.js'

const router = useRouter()

const suppliers = ref([])
const isLoading = ref(false)
const isModalActive = ref(false)
const isEditing = ref(false)
const error = ref('')
const success = ref('')
const currentSupplierId = ref(null)

const searchQuery = ref('')

const form = ref({
  name: '',
  address: ''
})

const filteredSuppliers = computed(() => {
  if (!searchQuery.value) return suppliers.value
  const query = searchQuery.value.toLowerCase()
  return suppliers.value.filter(s =>
    s.name?.toLowerCase().includes(query) ||
    s.address?.toLowerCase().includes(query)
  )
})

onMounted(() => {
  loadSuppliers()
})

const loadSuppliers = async () => {
  try {
    isLoading.value = true
    error.value = ''
    const response = await supplierService.getAllSuppliers()
    suppliers.value = response.data.suppliers || []
  } catch (err) {
    console.error('Erreur chargement fournisseurs:', err)
    error.value = 'Erreur lors du chargement des clients'
  } finally {
    isLoading.value = false
  }
}

const openModal = (supplier = null) => {
  if (supplier) {
    isEditing.value = true
    currentSupplierId.value = supplier.id
    form.value = {
      name: supplier.name || '',
      address: supplier.address || ''
    }
  } else {
    isEditing.value = false
    currentSupplierId.value = null
    form.value = { name: '', address: '' }
  }
  error.value = ''
  isModalActive.value = true
}

const closeModal = () => {
  isModalActive.value = false
  form.value = { name: '', address: '' }
  currentSupplierId.value = null
  isEditing.value = false
  error.value = ''
}

const saveSupplier = async () => {
  try {
    error.value = ''
    success.value = ''

    if (!form.value.name.trim()) {
      error.value = 'Le nom du client est requis'
      return
    }

    if (isEditing.value) {
      await supplierService.updateSupplier(currentSupplierId.value, form.value)
      success.value = 'Client mis à jour avec succès'
    } else {
      await supplierService.createSupplier(form.value)
      success.value = 'Client créé avec succès'
    }

    await loadSuppliers()
    closeModal()

    setTimeout(() => { success.value = '' }, 3000)
  } catch (err) {
    console.error('Erreur sauvegarde:', err)
    error.value = err.response?.data?.message || 'Erreur lors de la sauvegarde'
  }
}

const viewProducts = (supplier) => {
  router.push({
    name: 'supplier-products',
    params: { 
      id: supplier.id,
      name: supplier.name 
    }
  })
}

const deleteSupplier = async (id, name) => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) {
    try {
      await supplierService.deleteSupplier(id)
      success.value = 'Client supprimé avec succès'
      await loadSuppliers()
      setTimeout(() => { success.value = '' }, 3000)
    } catch (err) {
      console.error('Erreur suppression:', err)
      error.value = err.response?.data?.message || 'Erreur lors de la suppression'
    }
  }
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <!-- Header moderne -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Liste des clients
            </h1>
            <p class="mt-2 text-gray-500 dark:text-gray-400">
              Gérez vos clients et accédez à leurs articles
            </p>
          </div>
          <BaseButton
            color="info"
            :icon="mdiPlus"
            label="Nouveau client"
            @click="openModal()"
            class="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          />
        </div>
      </div>

      <!-- Barre de recherche stylisée -->
      <div class="mb-6">
        <div class="relative max-w-md">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher un client..."
            class="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-all"
          />
        </div>
      </div>

      <!-- Messages avec animations -->
      <transition name="fade">
        <div v-if="error" class="mb-4 rounded-xl bg-red-50 border-l-4 border-red-500 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400 shadow-sm">
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ error }}
          </div>
        </div>
      </transition>
      <transition name="fade">
        <div v-if="success" class="mb-4 rounded-xl bg-green-50 border-l-4 border-green-500 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-400 shadow-sm">
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ success }}
          </div>
        </div>
      </transition>

      <!-- Tableau des clients - Design moderne -->
      <CardBox class="mb-6 overflow-hidden shadow-xl rounded-2xl border-0">
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="p-2 bg-white/20 rounded-lg">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <CardBoxComponentTitle class="text-white !text-lg">Clients ({{ filteredSuppliers.length }})</CardBoxComponentTitle>
            </div>
          </div>
        </div>

        <div v-if="isLoading" class="p-12 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p class="text-gray-500 dark:text-gray-400">Chargement des clients...</p>
        </div>

        <div v-else-if="suppliers.length === 0" class="p-12 text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Aucun client</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">Commencez par ajouter votre premier client</p>
          <BaseButton
            color="info"
            :icon="mdiPlus"
            label="Ajouter un client"
            @click="openModal()"
          />
        </div>

        <div v-else-if="filteredSuppliers.length === 0" class="p-12 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p class="text-gray-500 dark:text-gray-400">Aucun résultat pour cette recherche</p>
        </div>

        <div v-else>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Adresse</th>
                  <th class="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr
                  v-for="(supplier, index) in filteredSuppliers"
                  :key="supplier.id"
                  class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group"
                  :class="index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30'"
                >
                  <td class="px-6 py-4">
                    <button
                      @click="viewProducts(supplier)"
                      class="flex items-center gap-3 group/btn"
                    >
                      <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md group-hover/btn:shadow-lg transition-all">
                        {{ supplier.name.charAt(0).toUpperCase() }}
                      </div>
                      <div class="text-left">
                        <span class="block text-sm font-semibold text-gray-900 dark:text-white group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors">
                          {{ supplier.name }}
                        </span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">Voir les articles →</span>
                      </div>
                    </button>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span class="max-w-xs truncate">{{ supplier.address || 'Adresse non renseignée' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        @click="openModal(supplier)"
                        class="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        @click="deleteSupplier(supplier.id, supplier.name)"
                        class="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardBox>
    </SectionMain>

    <!-- Modal Ajouter/Modifier -->
    <CardBoxModal
      v-model="isModalActive"
      :title="isEditing ? 'Modifier le client' : 'Ajouter un client'"
      button="info"
      :button-label="isEditing ? 'Mettre à jour' : 'Créer'"
      @confirm="saveSupplier"
      @cancel="closeModal"
    >
      <FormField label="Nom du client *" help="Nom du client ou fournisseur">
        <FormControl
          v-model="form.name"
          type="text"
          placeholder="Ex: Société ABC"
        />
      </FormField>

      <FormField label="Adresse" help="Adresse du client (optionnel)">
        <FormControl
          v-model="form.address"
          type="text"
          placeholder="Ex: 123 Rue Principale, Antananarivo"
        />
      </FormField>

      <div v-if="error" class="mt-4 rounded-lg bg-red-50 p-3 text-red-800 dark:bg-red-900/20 dark:text-red-400">
        {{ error }}
      </div>
    </CardBoxModal>
  </LayoutAuthenticated>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
