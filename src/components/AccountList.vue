<template>
  <div class="bg-gray-50 dark:bg-gray-900">
    <div class="py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">Cursor Pro Trail 账号分享</h1>

        <!-- 当前时间 -->
        <div class="text-center text-gray-600 dark:text-gray-400 mb-8 text-lg">
          {{ currentTime }}
        </div>

        <!-- 剩余账号数量和付费提醒 -->
        <div class="text-center mb-8">
          <div class="text-lg mb-2">
            <span class="text-blue-600 dark:text-blue-400 font-medium">当前剩余账号数量：{{ remainingAccounts }}</span>
            <span class="text-gray-700 dark:text-gray-300 ml-4">账号需要配合脚本使用：
              <a href="https://gitee.com/WQJSonder/cursor-auto-free" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">国内地址</a>
              &nbsp;|&nbsp;
              <a href="https://github.com/wqjuser/cursor-auto-free" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">国际地址</a>
            </span>
          </div>
          <div class="text-gray-700 dark:text-gray-300 text-base font-medium mb-3">
            如果出现登陆需要验证码的情况，请访问<a href="https://tempmail.plus/zh/#!" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">临时邮箱</a>，并配置sonder为邮箱前缀即可收到验证码邮件。之前的邮箱前缀有坏人增加了pin码，目前我也不知道他(她)添加的pin是什么，造成大家都无法使用，这次为防止还有坏人增加pin码，所以我提前加上pin了，如果需要验证码，请<span class="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline" @click="showQRCode = true">联系我</span>。
          </div>
          <div class="text-red-600 dark:text-red-400 text-base font-medium mb-3">
            此网站分享的账号均为免费，如果您是通过付费渠道了解的本网站，请立即退款并举报卖家
          </div>
        </div>

        <!-- 二维码模态框 -->
        <div v-if="showQRCode" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="showQRCode = false">
          <div class="relative bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl max-w-3xl mx-4" @click.stop>
            <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" @click="showQRCode = false">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            <img src="../assets/wx_group.jpg" alt="微信群二维码" class="w-full h-auto rounded-lg">
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded relative" role="alert">
          <span class="block sm:inline">{{ error }}</span>
          <span class="absolute top-0 bottom-0 right-0 px-4 py-3" @click="clearMessage">
            <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg"
                 viewBox="0 0 20 20">
              <title>关闭</title>
              <path
                  d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </span>
        </div>

        <!-- 成功提示 -->
        <div v-if="success" class="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded relative"
             role="alert">
          <span class="block sm:inline">{{ success }}</span>
          <span class="absolute top-0 bottom-0 right-0 px-4 py-3" @click="clearMessage">
            <svg class="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg"
                 viewBox="0 0 20 20">
              <title>关闭</title>
              <path
                  d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </span>
        </div>

        <!-- 账号列表 -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <!-- 空数据状态 -->
          <div v-if="loading" class="flex flex-col items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p class="mt-4 text-lg text-gray-500 dark:text-gray-400">加载中...</p>
          </div>
          <div v-else-if="!accounts.length" class="flex flex-col items-center justify-center py-12">
            <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
            <p class="mt-4 text-lg text-gray-500 dark:text-gray-400">暂无账号</p>
          </div>

          <!-- 数据表格 -->
          <div v-else class="relative">
            <div class="overflow-auto" style="max-height: none;">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th class="w-16 px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    序号
                  </th>
                  <th class="w-64 px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    账号
                  </th>
                  <th class="w-32 px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    账号类别
                  </th>
                  <th class="w-24 px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    可用额度
                  </th>
                  <th class="w-40 px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    上传时间
                  </th>
                  <th class="w-24 px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    操作
                  </th>
                </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="(account, index) in accounts" :key="account.id"
                    class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td class="px-4 py-3 text-center text-sm text-gray-900 dark:text-gray-100">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                  <td class="px-4 py-3 text-center text-sm text-gray-900 dark:text-gray-100">{{ account.email }}</td>
                  <td class="px-4 py-3 text-center text-sm text-gray-900 dark:text-gray-100">Pro Trail</td>
                  <td class="px-4 py-3 text-center text-sm text-gray-900 dark:text-gray-100">{{ account.credits }}</td>
                  <td class="px-4 py-3 text-center text-sm text-gray-900 dark:text-gray-100">
                    {{ formatDate(account.uploadTime) }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <button
                        @click="showEmailDialog(account)"
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      使用
                    </button>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
            <!-- 分页控制 -->
            <div v-if="accounts.length"
                 class="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-center">
                <span class="text-sm text-gray-700 dark:text-gray-300">每页显示</span>
                <select
                    v-model="pageSize"
                    @change="handlePageSizeChange"
                    class="ml-2 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
                </select>
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">条</span>
              </div>

              <div class="flex items-center space-x-2">
                <button
                    @click="changePage(currentPage - 1)"
                    :disabled="currentPage === 1"
                    class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
                >
                  上一页
                </button>
                <span class="text-sm text-gray-700 dark:text-gray-300">
                  第 {{ currentPage }} 页 / 共 {{ Math.ceil(total / pageSize) }} 页
                </span>
                <button
                    @click="changePage(currentPage + 1)"
                    :disabled="currentPage >= Math.ceil(total / pageSize)"
                    class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 免责声明 -->
      <div class="max-w-4xl mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white text-center">免责声明</h2>
        <div class="prose dark:prose-invert mx-auto text-center">
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            本项目仅供学习和研究使用。<strong class="text-red-600 dark:text-red-400">强烈建议您购买 <a href="https://cursor.sh/" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">Cursor</a> 的正版授权</strong>以支持开发者。
          </p>
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            使用此账号可能违反 Cursor 的使用条款。作者不对使用账号的任何问题负责，包括但不限于：
          </p>
          <ul class="list-none text-gray-700 dark:text-gray-300 mb-4 space-y-2">
            <li>• 软件授权失效</li>
            <li>• 账号封禁</li>
            <li>• 其他未知风险</li>
          </ul>
          <p class="text-gray-700 dark:text-gray-300">
            如果您认可 Cursor 的价值，请支持正版，为软件开发者的工作付费。
          </p>
        </div>
      </div>

      <!-- 邮箱输入弹窗 -->
      <div v-if="showDialog" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg w-96 overflow-hidden shadow-xl transform transition-all">
          <!-- 弹窗头部 -->
          <div class="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              接收账号信息
            </h3>
          </div>

          <!-- 弹窗内容 -->
          <div class="px-6 py-4">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
              账号信息将发送至您的邮箱，请注意查收
            </p>
            <!-- 错误提示 -->
            <div v-if="dialogError" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
              {{ dialogError }}
            </div>
            <div class="relative">
              <input
                  type="email"
                  v-model="userEmail"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="请输入您的邮箱地址"
                  @keyup.enter="confirmUseAccount"
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                     fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- 弹窗底部 -->
          <div
              class="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-600">
            <button
                @click="closeDialog"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
            >
              取消
            </button>
            <button
                @click="confirmUseAccount"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              确认发送
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 从环境变量中获取配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const FILTERED_EMAIL_SUFFIXES = JSON.parse(import.meta.env.VITE_FILTERED_EMAIL_SUFFIXES)

export default {
  name: 'AccountList',
  data() {
    return {
      currentTime: '',
      accounts: [],
      showDialog: false,
      showQRCode: false,
      userEmail: '',
      selectedAccount: null,
      error: '',
      success: '',
      dialogError: '',
      currentPage: 1,
      pageSize: 10,
      total: 0,
      remainingAccounts: 0,
      pageSizeOptions: [10, 20, 30, 50],
      loading: false,
      accountsCache: new Map(),
      messageTimer: null,
      dialogErrorTimer: null
    }
  },
  async mounted() {
    this.updateCurrentTime()
    setInterval(this.updateCurrentTime, 1000)
    await this.fetchAccounts()
    // 每30秒刷新一次账号列表
    setInterval(this.fetchAccounts, 30000)
  },
  methods: {
    updateCurrentTime() {
      const now = new Date()
      this.currentTime = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    },
    async fetchAccounts() {
      try {
        this.loading = true
        // 尝试从缓存获取数据
        const cacheKey = `${this.currentPage}-${this.pageSize}`
        if (this.accountsCache.has(cacheKey)) {
          const cachedData = this.accountsCache.get(cacheKey)
          this.accounts = cachedData.accounts
          this.total = cachedData.total
          this.remainingAccounts = cachedData.total
          this.loading = false
          // 预加载相邻页面
          this.preloadAdjacentPages()
          return
        }

        // 清空当前数据
        this.accounts = []
        
        // 添加固定的邮箱后缀过滤
        const params = new URLSearchParams({
          page: this.currentPage,
          pageSize: this.pageSize,
          emailSuffixes: JSON.stringify(FILTERED_EMAIL_SUFFIXES)
        })
        
        const response = await fetch(`${API_BASE_URL}/accounts/available?${params}`)
        if (!response.ok) throw new Error('获取账号列表失败')
        const data = await response.json()
        
        // 缓存当前页数据
        this.accountsCache.set(cacheKey, {
          accounts: data.accounts,
          total: data.total,
          timestamp: Date.now()
        })
        
        this.accounts = data.accounts
        this.total = data.total
        this.remainingAccounts = data.total

        // 预加载相邻页面
        this.preloadAdjacentPages()
      } catch (error) {
        console.error('获取账号列表失败:', error)
        this.setMessage('error', '获取账号列表失败')
      } finally {
        this.loading = false
      }
    },
    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    },
    showEmailDialog(account) {
      this.selectedAccount = account
      this.showDialog = true
      this.userEmail = ''
    },
    closeDialog() {
      this.showDialog = false
      this.selectedAccount = null
      this.userEmail = ''
      this.clearDialogError()
    },
    clearDialogError() {
      if (this.dialogErrorTimer) {
        clearTimeout(this.dialogErrorTimer)
        this.dialogErrorTimer = null
      }
      this.dialogError = ''
    },
    setDialogError(message) {
      this.clearDialogError()
      this.dialogError = message
      this.dialogErrorTimer = setTimeout(() => {
        if (this.dialogError === message) {
          this.dialogError = ''
        }
        this.dialogErrorTimer = null
      }, 3000)
    },
    clearMessage() {
      if (this.messageTimer) {
        clearTimeout(this.messageTimer)
        this.messageTimer = null
      }
      this.error = ''
      this.success = ''
    },
    setMessage(type, message) {
      this.clearMessage()
      this[type] = message
      if (this.messageTimer) {
        clearTimeout(this.messageTimer)
      }
      this.messageTimer = setTimeout(() => {
        if (this[type] === message) {  // 只有当消息没有被其他消息覆盖时才清除
          this[type] = ''
        }
        this.messageTimer = null
      }, 10000)
    },
    async confirmUseAccount() {
      this.clearDialogError()
      
      if (!this.userEmail) {
        this.setDialogError('请输入邮箱地址')
        return
      }
      if (!this.validateEmail(this.userEmail)) {
        this.setDialogError('请输入有效的邮箱地址')
        return
      }

      try {
        // 先检查账号是否可用
        const checkResponse = await fetch(`${API_BASE_URL}/accounts/${this.selectedAccount.id}/check`)
        const checkData = await checkResponse.json()
        
        if (!checkResponse.ok || !checkData.available) {
          throw new Error(checkData.error || '该账号已被使用，请选择其他账号')
        }

        // 账号可用，继续发送邮件
        const response = await fetch(`${API_BASE_URL}/accounts/${this.selectedAccount.id}/use`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({email: this.userEmail})
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || '使用账号失败')

        this.setMessage('success', data.message || '账号信息已发送到您的邮箱')
        this.closeDialog()
        this.accountsCache.clear()
        await this.fetchAccounts()
      } catch (error) {
        console.error('使用账号失败:', error)
        this.setDialogError(error.message || '使用账号失败')
        if (error.message.includes('已被使用')) {
          // 如果是账号已被使用的错误，关闭弹窗并刷新列表
          setTimeout(() => {
            this.closeDialog()
            this.accountsCache.clear()
            this.fetchAccounts()
          }, 2000)
        }
      }
    },
    validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return re.test(email)
    },
    // 添加分页相关方法
    async handlePageSizeChange() {
      this.currentPage = 1 // 重置到第一页
      this.accountsCache.clear() // 清空缓存
      await this.fetchAccounts()
      this.scrollToTop()
    },
    async changePage(page) {
      if (page < 1 || page > Math.ceil(this.total / this.pageSize)) return
      this.currentPage = page
      await this.fetchAccounts()
      this.scrollToTop()
    },
    // 添加滚动到顶部的方法
    scrollToTop() {
      // 滚动表格容器
      const tableContainer = document.querySelector('.overflow-auto')
      if (tableContainer) {
        tableContainer.scrollTop = 0
      }
      // 滚动整个页面
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    },
    // 预加载相邻页面数据
    async preloadAdjacentPages() {
      const prevPage = this.currentPage - 1
      const nextPage = this.currentPage + 1
      const maxPage = Math.ceil(this.total / this.pageSize)

      // 清理过期缓存（5分钟过期）
      this.cleanExpiredCache()

      // 预加载上一页
      if (prevPage >= 1) {
        await this.preloadPage(prevPage)
      }

      // 预加载下一页
      if (nextPage <= maxPage) {
        await this.preloadPage(nextPage)
      }
    },
    // 预加载指定页面
    async preloadPage(page) {
      const cacheKey = `${page}-${this.pageSize}`
      if (this.accountsCache.has(cacheKey)) {
        return
      }

      try {
        const params = new URLSearchParams({
          page,
          pageSize: this.pageSize,
          emailSuffixes: JSON.stringify(FILTERED_EMAIL_SUFFIXES)
        })
        
        const response = await fetch(`${API_BASE_URL}/accounts/available?${params}`)
        if (!response.ok) return
        const data = await response.json()
        
        this.accountsCache.set(cacheKey, {
          accounts: data.accounts,
          total: data.total,
          timestamp: Date.now()
        })
      } catch (error) {
        console.error(`预加载第 ${page} 页失败:`, error)
      }
    },
    // 清理过期缓存
    cleanExpiredCache() {
      const now = Date.now()
      const CACHE_EXPIRE_TIME = 5 * 60 * 1000 // 5分钟过期

      for (const [key, value] of this.accountsCache.entries()) {
        if (now - value.timestamp > CACHE_EXPIRE_TIME) {
          this.accountsCache.delete(key)
        }
      }
    }
  },
  beforeDestroy() {
    // 组件销毁前清除所有定时器
    this.clearMessage()
    this.clearDialogError()
  }
}
</script>

<style scoped>
/* 移除可能限制滚动的样式 */
.bg-gray-50 {
  min-height: 100%;
}

table {
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
}

/* 自定义滚动条样式 */
.overflow-auto::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #E5E7EB;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #D1D5DB;
}

/* 深色模式滚动条 */
@media (prefers-color-scheme: dark) {
  .overflow-auto::-webkit-scrollbar-thumb {
    background: #4B5563;
  }
  
  .overflow-auto::-webkit-scrollbar-thumb:hover {
    background: #6B7280;
  }
}

/* 设置表格容器的最大高度 */
.overflow-auto {
  max-height: 70vh;
  overflow-y: auto;
}
</style> 