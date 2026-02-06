<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { mdiArrowLeft, mdiPlus, mdiPencil, mdiTrashCan, mdiImage, mdiFileDocument, mdiMagnify } from '@mdi/js'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import SectionMain from '../components/SectionMain.vue'
import NotificationBar from '../components/NotificationBar.vue'
import CardBox from '../components/CardBox.vue'
import LayoutAuthenticated from '../layouts/LayoutAuthenticated.vue'
import SectionTitleLineWithButton from '../components/SectionTitleLineWithButton.vue'
import BaseButton from '../components/BaseButton.vue'
import productService from '../services/productService.js'
import supplierService from '../services/supplierService.js'

const route = useRoute()
const supplierId = route.params.id
const supplierName = ref(route.params.name || 'Client')

const products = ref([])
const isLoading = ref(false)
const error = ref('')
const success = ref('')
const showProductModal = ref(false)
const currentProduct = ref(null)
const isEditing = ref(false)
const selectedImage = ref(null)
const imagePreview = ref(null)
const showInvoiceModal = ref(false)
const selectedItems = ref([])
const showInvoicePreview = ref(false)
const isDownloading = ref(false)
const invoiceData = ref({
  clientName: '',
  clientAddress: '',
  companyName: '',
  invoiceNumber: `INV-${Date.now()}`,
  date: new Date().toLocaleDateString('fr-FR')
})

// Pagination et recherche
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(12)

// Filtrer les produits selon la recherche
const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value
  
  const query = searchQuery.value.toLowerCase()
  return products.value.filter(product => 
    product.name.toLowerCase().includes(query) ||
    (product.description && product.description.toLowerCase().includes(query)) ||
    String(product.price).includes(query)
  )
})

// Calculer le nombre total de pages
const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage.value)
})

// Obtenir les produits de la page actuelle
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredProducts.value.slice(start, end)
})

// Changer de page
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Réinitialiser à la page 1 lors de la recherche
const handleSearch = () => {
  currentPage.value = 1
}

const invoiceTotal = computed(() => {
  return selectedItems.value.reduce((total, item) => {
    return total + (item.price * item.quantity)
  }, 0)
})

onMounted(async () => {
  await loadSupplierInfo()
  await loadProducts()
})

const loadSupplierInfo = async () => {
  try {
    const response = await supplierService.getSupplierById(supplierId)
    if (response.data && response.data.supplier && response.data.supplier.name) {
      supplierName.value = response.data.supplier.name
    }
  } catch (err) {
    console.error('Erreur chargement fournisseur:', err)
  }
}

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

const openInvoiceModal = () => {
  selectedItems.value = []
  invoiceData.value = {
    clientName: supplierName.value,
    clientAddress: '',
    companyName: '',
    invoiceNumber: `INV-${Date.now()}`,
    date: new Date().toLocaleDateString('fr-FR')
  }
  showInvoiceModal.value = true
}

const closeInvoiceModal = (clearItems = true) => {
  showInvoiceModal.value = false
  if (clearItems) {
    selectedItems.value = []
  }
}

const closeInvoicePreview = () => {
  showInvoicePreview.value = false
  selectedItems.value = []
}

const backToInvoiceModal = () => {
  showInvoicePreview.value = false
  showInvoiceModal.value = true
}

const toggleItemSelection = (product) => {
  const index = selectedItems.value.findIndex(item => item.id === product.id)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    // Nettoyer le prix en supprimant les espaces et points de formatage
    const cleanPrice = parseFloat(String(product.price).replace(/\s/g, '').replace(/\./g, ''))
    selectedItems.value.push({ ...product, quantity: 1, price: cleanPrice })
  }
}

const updateItemQuantity = (productId, quantity) => {
  const item = selectedItems.value.find(item => item.id === productId)
  if (item) {
    item.quantity = Math.max(1, parseInt(quantity) || 1)
  }
}

const generateInvoicePDF = () => {
  if (selectedItems.value.length === 0) {
    alert('Veuillez sélectionner au moins un article')
    return
  }
  
  // Afficher l'aperçu au lieu de télécharger directement
  showInvoicePreview.value = true
  closeInvoiceModal(false) // Ne pas vider les items sélectionnés
}

const downloadInvoicePDF = async () => {
  if (selectedItems.value.length === 0) {
    alert('Veuillez sélectionner au moins un article')
    return
  }

  isDownloading.value = true
  
  try {
    // Créer le document PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    // Couleurs
    const primaryColor = [37, 99, 235] // blue-600
    const darkColor = [31, 41, 55]    // gray-800
    const lightGray = [107, 114, 128] // gray-500

    // === EN-TÊTE ===
    doc.setFontSize(24)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text(invoiceData.value.companyName || 'Votre Société', margin, 30)

    doc.setFontSize(12)
    doc.setTextColor(...lightGray)
    doc.setFont('helvetica', 'normal')
    doc.text('Facture commerciale', margin, 38)

    // === TITRE FACTURE ===
    doc.setFontSize(28)
    doc.setTextColor(...darkColor)
    doc.setFont('helvetica', 'bold')
    doc.text('FACTURE', pageWidth / 2, 55, { align: 'center' })

    // === INFO FACTURE ===
    doc.setFontSize(11)
    doc.setTextColor(...lightGray)
    doc.setFont('helvetica', 'bold')
    doc.text('N° FACTURE', margin, 75)
    doc.text('DATE', margin + 70, 75)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...darkColor)
    doc.setFontSize(13)
    doc.text(invoiceData.value.invoiceNumber, margin, 82)
    doc.text(invoiceData.value.date, margin + 70, 82)

    // === INFO CLIENT ===
    doc.setFillColor(253, 242, 248) // rose très clair
    doc.roundedRect(margin, 90, contentWidth, 35, 3, 3, 'F')
    
    doc.setFontSize(10)
    doc.setTextColor(190, 24, 93) // rose
    doc.setFont('helvetica', 'bold')
    doc.text('FACTURÉ À:', margin + 5, 100)
    
    doc.setFontSize(12)
    doc.setTextColor(...darkColor)
    doc.text(invoiceData.value.clientName, margin + 5, 110)
    
    if (invoiceData.value.clientAddress) {
      doc.setFontSize(10)
      doc.setTextColor(...lightGray)
      const addressLines = doc.splitTextToSize(invoiceData.value.clientAddress, contentWidth - 10)
      doc.text(addressLines, margin + 5, 118)
    }

    // === TABLEAU DES ARTICLES ===
    const tableData = selectedItems.value.map(item => [
      item.name,
      item.price.toLocaleString('fr-FR'),
      item.quantity.toString(),
      (item.price * item.quantity).toLocaleString('fr-FR')
    ])

    autoTable(doc, {
      startY: 135,
      head: [['Désignation', 'Prix Unitaire (Ar)', 'Qté', 'Montant (Ar)']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [31, 41, 55],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [31, 41, 55]
      },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin },
      styles: {
        lineColor: [229, 231, 235],
        lineWidth: 0.5
      }
    })

    // === TOTAL ===
    const finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : 150
    
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(pageWidth - margin - 80, finalY, 80, 20, 2, 2, 'F')
    
    doc.setFontSize(11)
    doc.setTextColor(...darkColor)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL:', pageWidth - margin - 70, finalY + 8)
    
    doc.setFontSize(14)
    doc.setTextColor(...primaryColor)
    doc.text(`${invoiceTotal.value.toLocaleString('fr-FR')} Ar`, pageWidth - margin - 5, finalY + 13, { align: 'right' })

    // === PIED DE PAGE ===
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setFontSize(9)
    doc.setTextColor(...lightGray)
    doc.setFont('helvetica', 'normal')
    doc.text('Merci pour votre confiance et votre achat', pageWidth / 2, pageHeight - 20, { align: 'center' })
    doc.text(`Facture générée le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, pageHeight - 15, { align: 'center' })

    // Sauvegarder
    doc.save(`${invoiceData.value.invoiceNumber}.pdf`)
    
    success.value = 'Facture téléchargée avec succès'
    setTimeout(() => { success.value = '' }, 3000)
  } catch (err) {
    console.error('Erreur lors du téléchargement PDF:', err)
    alert('Erreur lors de la génération du PDF: ' + err.message)
  } finally {
    isDownloading.value = false
  }
}

const printInvoice = () => {
  window.print()
}

const cleanPrice = (price) => {
  return parseFloat(String(price).replace(/\s/g, '').replace(/\./g, ''))
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <!-- Header avec bouton retour -->
      <div class="mb-8">
        <!-- Fil d'Ariane (Breadcrumb) -->
        <div class="mb-4 flex items-center space-x-2 text-sm">
          <!-- Breadcrumb commenté -->
        </div>

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
            <!-- Badge "Client actuel" -->
            <div class="mb-2">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900 dark:to-pink-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {{ supplierName }}
              </span>
            </div>
            <div class="flex items-center space-x-3">
              <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{{ supplierName }}</h1>
              <span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-1 rounded-full text-sm font-semibold"> {{ products.length }} article{{ products.length > 1 ? 's' : '' }}
              </span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Gérez les articles de ce client</p>
          </div>
          <div class="flex space-x-2">
            <button
              @click="openInvoiceModal()"
              class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Générer facture</span>
            </button>
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
      </div>

      <!-- Barre de recherche -->
      <div class="mb-6">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            v-model="searchQuery"
            @input="handleSearch"
            type="text" 
            placeholder="Rechercher un article par nom, description ou prix..." 
            class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-800 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
          >
        </div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {{ filteredProducts.length }} article{{ filteredProducts.length > 1 ? 's' : '' }} trouvé{{ filteredProducts.length > 1 ? 's' : '' }}
        </p>
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

      <div v-else-if="filteredProducts.length === 0" class="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <svg class="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 class="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Aucun résultat</h3>
        <p class="mt-2 text-gray-500 dark:text-gray-400">Aucun article ne correspond à votre recherche</p>
      </div>
        
      <!-- Grille de produits améliorée -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div 
          v-for="product in paginatedProducts" 
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

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-8 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 rounded-lg shadow">
        <div class="flex-1 flex justify-between sm:hidden">
          <button 
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <button 
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Affichage de 
              <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
              à
              <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, filteredProducts.length) }}</span>
              sur
              <span class="font-medium">{{ filteredProducts.length }}</span>
              article{{ filteredProducts.length > 1 ? 's' : '' }}
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button 
                @click="goToPage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button 
                v-for="page in totalPages" 
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                  page === currentPage 
                    ? 'z-10 bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                ]"
              >
                {{ page }}
              </button>
              
              <button 
                @click="goToPage(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
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

      <!-- Modal pour générer la facture -->
      <div v-if="showInvoiceModal" class="fixed inset-0 overflow-y-auto h-full flex items-center justify-center z-50 bg-black/40 backdrop-blur-md">
        <div class="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-8 rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 dark:border-gray-700/20">
          <div class="flex justify-between items-start mb-6">
            <div class="flex-1">
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Générer une facture</h3>
              <div class="flex items-center space-x-4 text-sm">
                <div class="flex items-center space-x-2">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span class="font-semibold text-gray-700 dark:text-gray-300">Client:</span>
                  <span class="text-blue-600 dark:text-blue-400 font-bold">{{ supplierName }}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span class="font-semibold text-gray-700 dark:text-gray-300">N°:</span>
                  <span class="text-green-600 dark:text-green-400 font-bold">{{ invoiceData.invoiceNumber }}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span class="font-semibold text-gray-700 dark:text-gray-300">Date:</span>
                  <span class="text-purple-600 dark:text-purple-400 font-bold">{{ invoiceData.date }}</span>
                </div>
              </div>
            </div>
            <button type="button" @click="closeInvoiceModal" class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="grid grid-cols-3 gap-6">
            <!-- Sélection des articles -->
            <div class="col-span-1">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Sélectionner les articles</h4>
              <div class="space-y-2 max-h-96 overflow-y-auto">
                <div v-for="product in products" :key="product.id" class="flex items-start space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <input 
                    type="checkbox" 
                    :id="`product-${product.id}`"
                    :checked="selectedItems.some(item => item.id === product.id)"
                    @change="toggleItemSelection(product)"
                    class="mt-1 cursor-pointer"
                  >
                  <label :for="`product-${product.id}`" class="flex-1 cursor-pointer">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ product.name }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ product.price }} Ar</p>
                  </label>
                </div>
              </div>
            </div>

            <!-- Détails de la facture -->
            <div class="col-span-2">
              <div class="space-y-4 mb-6">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Numéro de facture</label>
                    <input 
                      v-model="invoiceData.invoiceNumber" 
                      type="text" 
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                    <input 
                      v-model="invoiceData.date" 
                      type="text" 
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de votre société *</label>
                  <input 
                    v-model="invoiceData.companyName" 
                    type="text" 
                    placeholder="Ex: SARL Commerce Plus"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du fournisseur/client</label>
                  <input 
                    v-model="invoiceData.clientName" 
                    type="text" 
                    readonly
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                  >
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Pré-rempli automatiquement</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse du fournisseur</label>
                  <textarea 
                    v-model="invoiceData.clientAddress" 
                    rows="2"
                    placeholder="Adresse du fournisseur (optionnel)"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  ></textarea>
                </div>
              </div>

              <!-- Tableau des articles sélectionnés -->
              <div class="mb-6">
                <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Articles</h4>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead class="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th class="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Article</th>
                        <th class="px-3 py-2 text-center text-gray-700 dark:text-gray-300 w-16">Prix</th>
                        <th class="px-3 py-2 text-center text-gray-700 dark:text-gray-300 w-16">Qté</th>
                        <th class="px-3 py-2 text-right text-gray-700 dark:text-gray-300 w-20">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="selectedItems.length === 0" class="text-center py-4">
                        <td colspan="4" class="text-gray-500 dark:text-gray-400 py-4">Sélectionnez un article</td>
                      </tr>
                      <tr v-for="item in selectedItems" :key="item.id" class="border-b border-gray-200 dark:border-gray-700">
                        <td class="px-3 py-2 text-gray-900 dark:text-white">{{ item.name }}</td>
                        <td class="px-3 py-2 text-center text-gray-900 dark:text-white">{{ item.price }} Ar</td>
                        <td class="px-3 py-2 text-center">
                          <input 
                            type="number" 
                            :value="item.quantity" 
                            @change="e => updateItemQuantity(item.id, e.target.value)"
                            min="1" 
                            class="w-12 px-1 py-1 text-center border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                        </td>
                        <td class="px-3 py-2 text-right text-gray-900 dark:text-white font-semibold">{{ (item.price * item.quantity).toLocaleString('fr-FR') }} Ar</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Total -->
              <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 p-4 rounded-lg mb-6">
                <div class="flex justify-between items-center">
                  <span class="text-lg font-semibold text-gray-900 dark:text-white">Montant total:</span>
                  <span class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {{ invoiceTotal.toLocaleString('fr-FR') }} Ar
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex justify-end space-x-3">
                <button 
                  @click="closeInvoiceModal"
                  class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button 
                  @click="generateInvoicePDF"
                  class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-lg transform hover:scale-105 transition-all flex items-center space-x-2"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-6-4m6 4l6-4" />
                  </svg>
                  <span>Prévisualiser</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Hidden Invoice Content for PDF -->
          <div id="invoice-content" class="hidden">
            <div style="padding: 20px; font-family: Arial, sans-serif;">
              <h1 style="text-align: center; margin-bottom: 30px; font-size: 24px;">FACTURE</h1>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                <div>
                  <p style="margin: 0; font-weight: bold;">Numéro de facture:</p>
                  <p style="margin: 0; font-size: 14px;">{{ invoiceData.invoiceNumber }}</p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 0; font-weight: bold;">Date:</p>
                  <p style="margin: 0; font-size: 14px;">{{ invoiceData.date }}</p>
                </div>
              </div>

              <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 30px;">
                <p style="margin: 0; font-weight: bold;">Client:</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">{{ invoiceData.clientName }}</p>
                <p v-if="invoiceData.clientAddress" style="margin: 5px 0 0 0; font-size: 14px;">{{ invoiceData.clientAddress }}</p>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                  <tr style="border-bottom: 2px solid #333;">
                    <th style="text-align: left; padding: 10px; font-weight: bold;">Article</th>
                    <th style="text-align: center; padding: 10px; font-weight: bold;">Prix (Ar)</th>
                    <th style="text-align: center; padding: 10px; font-weight: bold;">Quantité</th>
                    <th style="text-align: right; padding: 10px; font-weight: bold;">Total (Ar)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in selectedItems" :key="item.id" style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 10px;">{{ item.name }}</td>
                    <td style="text-align: center; padding: 10px;">{{ item.price }}</td>
                    <td style="text-align: center; padding: 10px;">{{ item.quantity }}</td>
                    <td style="text-align: right; padding: 10px; font-weight: bold;">{{ (item.price * item.quantity).toLocaleString('fr-FR') }}</td>
                  </tr>
                </tbody>
              </table>

              <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
                <div style="width: 300px;">
                  <div style="display: flex; justify-content: space-between; padding: 10px; border-top: 2px solid #333;">
                    <span style="font-weight: bold; font-size: 18px;">TOTAL:</span>
                    <span style="font-weight: bold; font-size: 18px;">{{ invoiceTotal.toLocaleString('fr-FR') }} Ar</span>
                  </div>
                </div>
              </div>

              <div style="text-align: center; margin-top: 40px; color: #666; font-size: 12px;">
                <p style="margin: 0;">Merci pour votre achat</p>
                <p style="margin: 5px 0 0 0;">Facture générée le {{ new Date().toLocaleDateString('fr-FR') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal pour visualiser la facture -->
      <div v-if="showInvoicePreview" class="fixed inset-0 overflow-y-auto h-full flex items-center justify-center z-50 bg-black/40 backdrop-blur-md">
        <div class="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-hidden shadow-2xl">
          <!-- Header de visualisation -->
          <div class="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6">
            <div class="flex justify-between items-start mb-4">
              <div class="flex-1">
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">Prévisualisation de la facture</h3>
                <div class="flex items-center space-x-4 text-sm">
                  <div class="flex items-center space-x-2">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span class="font-semibold text-gray-700 dark:text-gray-300">Client:</span>
                    <span class="text-blue-600 dark:text-blue-400 font-bold">{{ supplierName }}</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span class="font-semibold text-gray-700 dark:text-gray-300">N°:</span>
                    <span class="text-green-600 dark:text-green-400 font-bold">{{ invoiceData.invoiceNumber }}</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span class="font-semibold text-gray-700 dark:text-gray-300">Date:</span>
                    <span class="text-purple-600 dark:text-purple-400 font-bold">{{ invoiceData.date }}</span>
                  </div>
                </div>
              </div>
              <button 
                @click="showInvoicePreview = false" 
                class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Contenu de la facture -->
          <div id="invoice-preview-content" class="overflow-y-auto p-8 bg-white dark:bg-gray-800" style="max-height: calc(95vh - 180px);">
            <div class="max-w-3xl mx-auto">
              <!-- En-tête de la société -->
              <div style="margin-bottom: 40px; text-align: center;">
                <h2 style="margin: 0; font-size: 28px; font-weight: bold; color: #2563eb;">{{ invoiceData.companyName }}</h2>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Facture commerciale</p>
              </div>

              <h1 style="text-align: center; margin-bottom: 40px; font-size: 32px; font-weight: bold; color: #1f2937;">FACTURE</h1>
              
              <!-- Numéro et Date -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
                <div>
                  <p style="margin: 0; font-weight: bold; color: #374151; font-size: 14px;">NUMÉRO DE FACTURE</p>
                  <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: bold; color: #1f2937;">{{ invoiceData.invoiceNumber }}</p>
                </div>
                <div>
                  <p style="margin: 0; font-weight: bold; color: #374151; font-size: 14px;">DATE</p>
                  <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: bold; color: #1f2937;">{{ invoiceData.date }}</p>
                </div>
              </div>

              <!-- Société Émettrice et Fournisseur -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
                <!-- Société émettrice -->
                <div style="border: 2px solid #dbeafe; padding: 20px; border-radius: 8px; background-color: #f0f9ff;">
                  <p style="margin: 0; font-weight: bold; color: #0284c7; font-size: 12px; text-transform: uppercase;">De:</p>
                  <p style="margin: 10px 0 0 0; font-size: 16px; font-weight: bold; color: #1f2937;">{{ invoiceData.companyName }}</p>
                </div>
                
                <!-- Client/Fournisseur -->
                <div style="border: 2px solid #fce7f3; padding: 20px; border-radius: 8px; background-color: #fdf2f8;">
                  <p style="margin: 0; font-weight: bold; color: #be185d; font-size: 12px; text-transform: uppercase;">À:</p>
                  <p style="margin: 10px 0 0 0; font-size: 16px; font-weight: bold; color: #1f2937;">{{ invoiceData.clientName }}</p>
                  <p v-if="invoiceData.clientAddress" style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280; white-space: pre-wrap;">{{ invoiceData.clientAddress }}</p>
                </div>
              </div>

              <!-- Tableau des articles -->
              <div style="margin-bottom: 30px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 3px solid #1f2937; background-color: #f3f4f6;">
                      <th style="text-align: left; padding: 15px; font-weight: bold; color: #1f2937; font-size: 13px; text-transform: uppercase;">Désignation</th>
                      <th style="text-align: center; padding: 15px; font-weight: bold; color: #1f2937; font-size: 13px; text-transform: uppercase;">Prix Unitaire (Ar)</th>
                      <th style="text-align: center; padding: 15px; font-weight: bold; color: #1f2937; font-size: 13px; text-transform: uppercase;">Quantité</th>
                      <th style="text-align: right; padding: 15px; font-weight: bold; color: #1f2937; font-size: 13px; text-transform: uppercase;">Montant (Ar)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in selectedItems" :key="item.id" style="border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 15px; color: #1f2937; font-weight: 500;">{{ item.name }}</td>
                      <td style="text-align: center; padding: 15px; color: #1f2937;">{{ item.price.toLocaleString('fr-FR') }}</td>
                      <td style="text-align: center; padding: 15px; color: #1f2937; font-weight: bold;">{{ item.quantity }}</td>
                      <td style="text-align: right; padding: 15px; font-weight: bold; color: #1f2937;">{{ (item.price * item.quantity).toLocaleString('fr-FR') }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Récapitulatif financier -->
              <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
                <div style="width: 400px;">
                  <div style="display: flex; justify-content: space-between; padding: 15px; border-top: 2px solid #e5e7eb; border-bottom: 3px solid #1f2937; background-color: #f9fafb;">
                    <span style="font-weight: bold; font-size: 16px; color: #1f2937;">TOTAL À PAYER:</span>
                    <span style="font-weight: bold; font-size: 20px; color: #2563eb;">{{ invoiceTotal.toLocaleString('fr-FR') }} Ar</span>
                  </div>
                </div>
              </div>

              <!-- Mentions légales -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                  <strong>Merci pour votre confiance et votre achat</strong><br>
                  Facture générée le {{ new Date().toLocaleDateString('fr-FR') }} à {{ new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Footer avec boutons d'action -->
          <div class="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end space-x-3">
            <button 
              @click="printInvoice"
              class="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Imprimer</span>
            </button>
            <button 
              @click="backToInvoiceModal"
              class="px-6 py-3 border border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg shadow-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all flex items-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Retour</span>
            </button>
            <button 
              @click="closeInvoicePreview"
              class="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Fermer
            </button>
            <button 
              @click="downloadInvoicePDF"
              :disabled="isDownloading"
              class="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-lg transform hover:scale-105 transition-all flex items-center space-x-2"
            >
              <svg v-if="!isDownloading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isDownloading ? 'Génération...' : 'Télécharger PDF' }}</span>
            </button>
          </div>
        </div>
      </div>
    </SectionMain>
  </LayoutAuthenticated>
</template>
