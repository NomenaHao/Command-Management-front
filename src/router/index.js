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
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  
  // Charger les infos utilisateur si authentifié et pas encore chargées
  if (isAuthenticated) {
    const mainStore = useMainStore()
    if (!mainStore.userName) {
      const user = authService.getCurrentUser()
      if (user) {
        mainStore.setUser({
          username: user.username
        })
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
