import {
  mdiAccountCircle,
  mdiMonitor,
  mdiLock,
  mdiAlertCircle,
  mdiSquareEditOutline,
  mdiTable,
  mdiViewList,
  mdiTelevisionGuide,
  mdiPalette,
  mdiLogout,
  mdiAccountMultiple,
} from '@mdi/js'

export const menuAsideMain = [
  {
    to: '/dashboard',
    icon: mdiMonitor,
    label: 'Tableau de bord',
  },
  {
    to: '/tables',
    label: 'Liste des clients',
    icon: mdiTable,
  },
  {
    to: '/admin/users',
    label: 'Gestion des utilisateurs',
    icon: mdiAccountMultiple,
  },
]

export const menuAsideBottom = [
  {
    label: 'Logout',
    icon: mdiLogout,
    color: 'info',
    isLogout: true,
  },
]
