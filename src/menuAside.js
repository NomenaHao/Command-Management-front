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
    to: '/admin/users',
    label: 'Admins',
    icon: mdiAccountMultiple,
  },
  {
    to: '/tables',
    label: 'Liste des clients',
    icon: mdiTable,
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
