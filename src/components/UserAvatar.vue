<script setup>
import { computed } from 'vue'

const props = defineProps({
  username: {
    type: String,
    required: true,
  },
  avatar: String,
  api: {
    type: String,
    default: 'avataaars',
  },
})

const avatar = computed(() => {
  // Si pas d'avatar ou chaîne vide, utiliser Dicebear
  if (!props.avatar || props.avatar.trim() === '') {
    return `https://api.dicebear.com/7.x/${props.api}/svg?seed=${props.username.replace(/[^a-z0-9]+/gi, '-')}`
  }
  
  // Si l'avatar est une URL complète, l'utiliser directement
  if (props.avatar.startsWith('http')) {
    return props.avatar
  }
  
  // Sinon, ajouter le préfixe du backend
  return `http://localhost:3001${props.avatar}`
})

const username = computed(() => props.username)
</script>

<template>
  <div>
    <img
      :src="avatar"
      :alt="username"
      class="block h-auto w-full max-w-full rounded-full bg-gray-100 dark:bg-slate-800"
    />
    <slot />
  </div>
</template>
