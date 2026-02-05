<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { mdiArrowLeft, mdiPlus, mdiPencil, mdiTrashCan, mdiImage } from '@mdi/js'
import SectionMain from '../components/SectionMain.vue'
import NotificationBar from '../components/NotificationBar.vue'
import CardBox from '../components/CardBox.vue'
import LayoutAuthenticated from '../layouts/LayoutAuthenticated.vue'
import SectionTitleLineWithButton from '../components/SectionTitleLineWithButton.vue'
import BaseButton from '../components/BaseButton.vue'
import productService from '../services/productService.js'

const route = useRoute()
const supplierId = route.params.id
const supplierName = route.params.name || 'Client'

const products = ref([])
const isLoading = ref(false)
const error = ref('')
const success = ref('')
const showProductModal = ref(false)
const currentProduct = ref(null)
const isEditing = ref(false)
const selectedImage = ref(null)
const imagePreview = ref(null)

onMounted(async () => {
  await loadProducts()
})

const loadProducts = async () => {
  try {
    isLoading.value = true
    error.value = ''
    const response = await productService.getProductsBySupplier(supplierId)
    products.value = response.data.products || []
  } catch (err) {
    console.error('Erreur chargement produits:', err)
    error.value = 'Erreur lors du chargement des produits'
  } finally {
    isLoading.value = false
  }
}

const openProductModal = (product = null) => {
  currentProduct.value = product ? { ...product } : {
    name: '',
    description: '',
    price: 0,
    supplier_id: supplierId
  }
  isEditing.value = !!product
  selectedImage.value = null
  imagePreview.value = product?.image || null
  showProductModal.value = true
}

const closeProductModal = () => {
  showProductModal.value = false
  currentProduct.value = null
  isEditing.value = false
  selectedImage.value = null
  imagePreview.value = null
}

const handleImageSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedImage.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const saveProduct = async () => {
  try {
    if (!currentProduct.value.name.trim()) {
      error.value = 'Le nom du produit est obligatoire'
      return
    }
    
    const formData = new FormData()
    formData.append('name', currentProduct.value.name)
    formData.append('description', currentProduct.value.description || '')
    formData.append('price', currentProduct.value.price)
    formData.append('supplierId', supplierId)
    
    if (selectedImage.value) {
      formData.append('image', selectedImage.value)
    }
    
    if (isEditing.value) {
      await productService.updateProduct(currentProduct.value.id, formData)
      success.value = 'Produit modifié avec succès'
    } else {
      await productService.createProduct(formData)
      success.value = 'Produit créé avec succès'
    }
    
    await loadProducts()
    closeProductModal()
    
    setTimeout(() => {
      success.value = ''
    }, 3000)
  } catch (err) {
    console.error('Erreur sauvegarde produit:', err)
    error.value = err.response?.data?.message || 'Erreur lors de la sauvegarde du produit'
  }
}

const deleteProduct = async (productId) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
    try {
      await productService.deleteProduct(productId)
      success.value = 'Produit supprimé avec succès'
      await loadProducts()
      
      setTimeout(() => {
        success.value = ''
      }, 3000)
    } catch (err) {
      console.error('Erreur suppression produit:', err)
      error.value = 'Erreur lors de la suppression du produit'
    }
  }
}

const goBack = () => {
  window.history.back()
}

const handleImageError = (event) => {
  // Remplacer par l'icône par défaut si l'image ne peut pas être chargée
  console.warn('Erreur chargement image:', event)
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <!-- Header avec bouton retour -->
      <div class="mb-8">
        <div class="flex items-center space-x-4 mb-6">
          <button 
            @click="goBack"
            class="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all"
          >
            <svg class="w-6 h-6 text-gray-700 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
          </button>
          <div class="flex-1">
            <div class="flex items-center space-x-3">
              <h1 class="text-4xl font-bold text-gray-900 dark:text-white">{{ supplierName }}</h1>
              <span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-1 rounded-full text-sm font-semibold">
                {{ products.length }} article{{ products.length > 1 ? 's' : '' }}
              </span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Gérez les articles de ce client</p>
          </div>
          <button
            @click="openProductModal()"
            class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center space-x-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>Nouvel article</span>
          </button>
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

      <!-- Loading state -->
      <div v-if="isLoading" class="text-center py-16">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Chargement des articles...</p>
      </div>
      
      <!-- Empty state -->
      <div v-else-if="products.length === 0" class="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
          <svg class="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Aucun article</h3>
        <p class="mt-2 text-gray-500 dark:text-gray-400">Ajoutez votre premier article pour ce client</p>
        <button
          @click="openProductModal()"
          class="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all inline-flex items-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <span>Créer le premier article</span>
        </button>
      </div>
        
      <!-- Grille de produits améliorée -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div 
          v-for="product in products" 
          :key="product.id" 
          class="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:-translate-y-2"
        >
          <!-- Image du produit avec overlay -->
          <div class="relative h-56 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 overflow-hidden">
            <img 
              v-if="product.image" 
              :src="`http://localhost:3001${product.image}`" 
              :alt="product.name"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              @error="handleImageError"
            >
            <div v-else class="flex items-center justify-center h-full">
              <svg class="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <!-- Contenu -->
          <div class="p-5">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{{ product.name }}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
              {{ product.description || 'Pas de description' }}
            </p>
            
            <!-- Prix -->
            <div class="flex items-baseline space-x-2 mb-4">
              <span class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {{ product.price }}
              </span>
              <span class="text-lg text-gray-600 dark:text-gray-400 font-semibold">Ar</span>
            </div>

            <!-- Actions -->
            <div class="flex space-x-2">
              <button
                @click="openProductModal(product)"
                class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                <span class="text-sm">Modifier</span>
              </button>
              <button
                @click="deleteProduct(product.id)"
                class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
                title="Supprimer"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal pour ajouter/éditer un produit -->
      <div v-if="showProductModal" class="fixed inset-0 overflow-y-auto h-full flex items-center justify-center z-50 bg-black/40 backdrop-blur-md">
        <div class="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-8 rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 dark:border-gray-700/20">        
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ isEditing ? 'Modifier l\'article' : 'Ajouter un article' }}
            </h3>
            <button type="button" @click="closeProductModal" class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="saveProduct">
            <!-- Nom -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom de l'article *</label>
              <input 
                v-model="currentProduct.name" 
                type="text" 
                required 
                placeholder="Nom du produit"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
            </div>
            
            <!-- Description -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea 
                v-model="currentProduct.description" 
                rows="3"
                placeholder="Description du produit"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              ></textarea>
            </div>
            
            <!-- Prix -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prix (Ar) *</label>
                <input 
                  v-model="currentProduct.price" 
                  type="text" 
                  required 
                  placeholder="Ex: 20000 ou 20 000"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
              </div>
              
              <!-- Stock -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantité en stock</label>
                <input 
                  v-model="currentProduct.stock_quantity" 
                  type="number"
                  min="0"
                  placeholder="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
              </div>
            </div>

            <!-- Upload image -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photo de l'article</label>
              
              <!-- Aperçu image -->
              <div v-if="imagePreview" class="mb-3 rounded-lg overflow-hidden h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <img :src="imagePreview" :alt="currentProduct.name" class="w-full h-full object-cover">
              </div>
              
              <!-- Input file -->
              <label class="block">
                <input 
                  type="file" 
                  accept="image/*"
                  @change="handleImageSelect"
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
            </div>
            
            <!-- Boutons d'action -->
            <div class="flex justify-end space-x-2">
              <BaseButton type="button" color="light" label="Annuler" @click="closeProductModal" />
              <BaseButton type="submit" color="info" :label="isEditing ? 'Modifier' : 'Ajouter'" />
            </div>
          </form>
        </div>
      </div>
    </SectionMain>
  </LayoutAuthenticated>
</template>
