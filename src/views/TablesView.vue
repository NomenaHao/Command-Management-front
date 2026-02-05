<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { mdiTableBorder, mdiPlus, mdiEye, mdiPencil, mdiTrashCan } from '@mdi/js'
import SectionMain from '../components/SectionMain.vue'
import NotificationBar from '../components/NotificationBar.vue'
import CardBox from '../components/CardBox.vue'
import LayoutAuthenticated from '../layouts/LayoutAuthenticated.vue'
import SectionTitleLineWithButton from '../components/SectionTitleLineWithButton.vue'
import BaseButton from '../components/BaseButton.vue'
import productService from '../services/productService.js'
import supplierService from '../services/supplierService.js'

const router = useRouter()
const suppliers = ref([])
const isLoading = ref(false)
const error = ref('')
const success = ref('')
const showSupplierModal = ref(false)
const newSupplier = ref({
  name: '',
  phone: '',
  address: '',
  description: ''
})
const isEditingSupplier = ref(false)
const editingSupplierId = ref(null)

// Charger les fournisseurs au montage
onMounted(async () => {
  await loadSuppliers()
})

const loadSuppliers = async () => {
  try {
    isLoading.value = true
    error.value = ''
    const response = await supplierService.getAllSuppliers()
    suppliers.value = response.data.suppliers || []
  } catch (err) {
    console.error('Erreur chargement clients:', err)
    error.value = 'Erreur lors du chargement des clients'
  } finally {
    isLoading.value = false
  }
}

const openSupplierModal = (supplier = null) => {
  if (supplier) {
    newSupplier.value = { ...supplier }
    isEditingSupplier.value = true
    editingSupplierId.value = supplier.id
  } else {
    newSupplier.value = {
      name: '',
      phone: '',
      address: '',
      description: ''
    }
    isEditingSupplier.value = false
    editingSupplierId.value = null
  }
  showSupplierModal.value = true
}

const closeSupplierModal = () => {
  showSupplierModal.value = false
}

const saveSupplier = async () => {
  try {
    if (!newSupplier.value.name.trim()) {
      error.value = 'Le nom du client est obligatoire'
      return
    }
    
    if (isEditingSupplier.value) {
      await supplierService.updateSupplier(editingSupplierId.value, newSupplier.value)
      success.value = 'Client modifié avec succès'
    } else {
      await supplierService.createSupplier(newSupplier.value)
      success.value = 'Client créé avec succès'
    }
    
    await loadSuppliers()
    closeSupplierModal()
    
    setTimeout(() => {
      success.value = ''
    }, 3000)
  } catch (err) {
    console.error('Erreur sauvegarde client:', err)
    error.value = err.response?.data?.message || 'Erreur lors de la sauvegarde du client'
  }
}

const deleteSupplier = async (supplierId) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce client? Tous les articles associés seront supprimés.')) {
    try {
      await supplierService.deleteSupplier(supplierId)
      success.value = 'Client supprimé avec succès'
      await loadSuppliers()
      
      setTimeout(() => {
        success.value = ''
      }, 3000)
    } catch (err) {
      console.error('Erreur suppression client:', err)
      error.value = 'Erreur lors de la suppression du client'
    }
  }
}

const goToSupplierProducts = (supplierId, supplierName) => {
  router.push({
    name: 'supplier-products',
    params: { id: supplierId, name: supplierName }
  })
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <!-- Header amélioré -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">Clients</h1>
            <p class="text-gray-600 dark:text-gray-400">Gérez vos clients et leurs articles</p>
          </div>
          <BaseButton 
            color="info" 
            :icon="mdiPlus" 
            label="Nouveau client" 
            @click="openSupplierModal()" 
            class="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          />
        </div>
      </div>
      
      <!-- Message de succès -->
      <div v-if="success" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
        {{ success }}
      </div>
      
      <!-- Message d'erreur -->
      <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        {{ error }}
      </div>

      <!-- Cartes des fournisseurs -->
      <div v-if="isLoading" class="text-center py-16">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Chargement des fournisseurs...</p>
      </div>
      
      <div v-else-if="suppliers.length === 0" class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <svg class="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
        <h3 class="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Aucun client</h3>
        <p class="mt-2 text-gray-500 dark:text-gray-400">Commencez par ajouter votre premier client</p>
        <BaseButton color="info" :icon="mdiPlus" label="Créer le premier client" @click="openSupplierModal()" class="mt-6 shadow-lg" />
      </div>
      
      <!-- Grille de cartes -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="supplier in suppliers" 
          :key="supplier.id" 
          class="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:scale-105 cursor-pointer"
        >
          <!-- Header de la carte -->
          <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                </div>
                <h3 
                  @click="goToSupplierProducts(supplier.id, supplier.name)"
                  class="text-2xl font-bold text-white hover:underline"
                >
                  {{ supplier.name }}
                </h3>
              </div>
            </div>
          </div>

          <!-- Contenu de la carte -->
          <div class="p-6 space-y-4">
            <!-- Téléphone -->
            <div v-if="supplier.phone" class="flex items-start space-x-3">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Téléphone</p>
                <p class="font-semibold text-gray-900 dark:text-white">{{ supplier.phone }}</p>
              </div>
            </div>

            <!-- Adresse -->
            <div v-if="supplier.address" class="flex items-start space-x-3">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Adresse</p>
                <p class="font-medium text-gray-900 dark:text-white">{{ supplier.address }}</p>
              </div>
            </div>

            <!-- Description -->
            <div v-if="supplier.description" class="flex items-start space-x-3">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path>
              </svg>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Description</p>
                <p class="text-gray-700 dark:text-gray-300 line-clamp-2">{{ supplier.description }}</p>
              </div>
            </div>
          </div>

          <!-- Footer avec actions -->
          <div class="px-6 pb-6 flex space-x-2">
            <button
              @click="goToSupplierProducts(supplier.id, supplier.name)"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
              </svg>
              <span>Articles</span>
            </button>
            <button
              @click="openSupplierModal(supplier)"
              class="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              title="Modifier"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <button
              @click="deleteSupplier(supplier.id)"
              class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              title="Supprimer"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal pour ajouter un fournisseur -->
      <div v-if="showSupplierModal" class="fixed inset-0 overflow-y-auto h-full flex items-center justify-center z-50 bg-black/40 backdrop-blur-md">
        <div class="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-8 rounded-2xl max-w-2xl w-full mx-4 shadow-2xl border border-white/20 dark:border-gray-700/20 transform transition-all">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ isEditingSupplier ? 'Modifier le client' : 'Ajouter un client' }}
            </h3>
            <button type="button" @click="closeSupplierModal" class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="saveSupplier">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom *</label>
              <input 
                v-model="newSupplier.name" 
                type="text" 
                required 
                placeholder="Nom du client"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Téléphone</label>
              <input 
                v-model="newSupplier.phone" 
                type="tel"
                placeholder="Numéro de téléphone"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adresse</label>
              <input 
                v-model="newSupplier.address" 
                type="text"
                placeholder="Adresse"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea 
                v-model="newSupplier.description" 
                rows="3"
                placeholder="Description du client"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              ></textarea>
            </div>
            
            <div class="flex justify-end space-x-2">
              <BaseButton type="button" color="light" label="Annuler" @click="closeSupplierModal" />
              <BaseButton type="submit" color="info" :label="isEditingSupplier ? 'Modifier' : 'Ajouter'" />
            </div>
          </form>
        </div>
      </div>
    </SectionMain>
  </LayoutAuthenticated>
</template>
