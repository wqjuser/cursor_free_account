<script>
import AccountList from './components/AccountList.vue'
import './index.css'

export default {
  name: 'App',
  components: {
    AccountList
  },
  data() {
    return {
      isDark: false
    }
  },
  watch: {
    isDark: {
      immediate: true,
      handler(newValue) {
        document.documentElement.classList.toggle('dark', newValue)
      }
    }
  },
  mounted() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.isDark = true
    }
  }
}
</script>

<template>
  <div :class="{ 'dark': isDark }" class="min-h-screen">
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
      <button
        @click="isDark = !isDark"
        class="fixed top-4 right-4 p-1.5 rounded-full bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-lg z-50"
      >
        <svg
          v-if="!isDark"
          class="w-4 h-4 text-gray-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
        <svg
          v-else
          class="w-4 h-4 text-yellow-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"
          />
        </svg>
      </button>
      <AccountList />
    </div>
  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
}

#app {
  min-height: 100vh;
  width: 100%;
}

* {
  box-sizing: border-box;
}
</style>
