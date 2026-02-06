import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/HomeView.vue'
import Login from '../views/LoginView.vue'
import { useMainStore } from '../stores/main.js'
import authService from '../services/authService.js'

const routes = [
  {
    meta: {
      title: 'Login',
    },
    path: '/',
    name: 'login',
    component: Login,
  },
  {
    // Document title tag
    // We combine it with defaultDocumentTitle set in `src/main.js` on router.afterEach hook
    meta: {
      title: 'Dashboard',
    },
    path: '/dashboard',
    name: 'dashboard',
    component: Home,
  },
  {
    meta: {
      title: 'Tables',
    },
    path: '/tables',
    name: 'tables',
    component: () => import('../views/TablesView.vue'),
  },
  {
    meta: {
      title: 'Articles du fournisseur',
    },
    path: '/supplier/:id/products',
    name: 'supplier-products',
    component: () => import('../views/SupplierProductsView.vue'),
  },
  {
    meta: {
      title: 'Forms',
    },
    path: '/forms',
    name: 'forms',
    component: () => import('../views/FormsView.vue'),
  },
  {
    meta: {
      title: 'Profile',
    },
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
  },
  {
    meta: {
      title: 'Gestion des utilisateurs',
    },
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('../views/AdminUsersView.vue'),
  },

  {
    meta: {
      title: 'Error',
    },
    path: '/error',
    name: 'error',
    component: () => import('../views/ErrorView.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})

// Protection des routes - rediriger vers login si non authentifié
router.beforeEach(async (to, from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  
  // Charger les infos utilisateur si authentifié
  if (isAuthenticated) {
    const mainStore = useMainStore()
    
    // Toujours recharger depuis l'API pour avoir les données à jour (incluant l'avatar)
    try {
      const response = await authService.getProfile()
      console.log('Profile loaded from API:', response.data)
      if (response.data && response.data.user) {
        mainStore.setUser({
          username: response.data.user.username,
          avatar: response.data.user.avatar
        })
        // Mettre à jour localStorage avec les nouvelles données
        authService.saveUser(response.data.user, localStorage.getItem('token'))
      }
    } catch (err) {
      console.error('Erreur chargement profil:', err)
      // Si erreur, utiliser les données de localStorage en fallback
      if (!mainStore.userName) {
        const user = authService.getCurrentUser()
        if (user) {
          mainStore.setUser({
            username: user.username,
            avatar: user.avatar
          })
        }
      }
    }
  }
  
  if (to.path !== '/' && !isAuthenticated) {
    next('/')
  } else if (to.path === '/' && isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
