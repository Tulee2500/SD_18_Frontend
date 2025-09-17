<template>
    <div class="max-w-2xl mx-auto mt-10 p-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-gray-600">Đang xử lý kết quả thanh toán...</p>
      </div>

      <!-- Success State -->
      <div v-else-if="paymentResult && paymentResult.success" class="text-center">
        <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div class="text-green-600 text-6xl mb-4">✅</div>
          <h1 class="text-2xl font-bold text-green-800 mb-2">Thanh toán thành công!</h1>
          <p class="text-green-600">{{ paymentResult.message }}</p>
        </div>

        <div class="bg-white border rounded-lg p-6 text-left">
          <h3 class="font-semibold mb-4">Thông tin giao dịch:</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Mã đơn hàng:</span>
              <span class="font-medium">{{ paymentResult.orderCode }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Số tiền:</span>
              <span class="font-medium">{{ formatCurrency(paymentResult.amount) }}đ</span>
            </div>
            <div class="flex justify-between" v-if="paymentResult.transactionNo">
              <span class="text-gray-600">Mã giao dịch:</span>
              <span class="font-medium">{{ paymentResult.transactionNo }}</span>
            </div>
            <div class="flex justify-between" v-if="paymentResult.bankCode">
              <span class="text-gray-600">Ngân hàng:</span>
              <span class="font-medium">{{ paymentResult.bankCode }}</span>
            </div>
          </div>
        </div>

        <div class="mt-6 space-y-3">
          <button
            @click="goToOrderDetail"
            class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition"
          >
            Xem chi tiết đơn hàng
          </button>
          <button
            @click="goHome"
            class="w-full border border-gray-300 py-3 px-6 rounded-lg hover:bg-gray-50 transition"
          >
            Về trang chủ
          </button>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="text-center">
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div class="text-red-600 text-6xl mb-4">❌</div>
          <h1 class="text-2xl font-bold text-red-800 mb-2">Thanh toán thất bại!</h1>
          <p class="text-red-600">{{ paymentResult?.message || 'Đã có lỗi xảy ra' }}</p>
        </div>

        <div class="bg-white border rounded-lg p-6 text-left" v-if="paymentResult?.orderCode">
          <h3 class="font-semibold mb-4">Thông tin giao dịch:</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Mã đơn hàng:</span>
              <span class="font-medium">{{ paymentResult.orderCode }}</span>
            </div>
          </div>
        </div>

        <div class="mt-6 space-y-3">
          <button
            @click="retryPayment"
            class="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition"
          >
            Thử thanh toán lại
          </button>
          <button
            @click="goHome"
            class="w-full border border-gray-300 py-3 px-6 rounded-lg hover:bg-gray-50 transition"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  </template>

  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import axios from 'axios'

  const router = useRouter()
  const route = useRoute()

  const isLoading = ref(true)
  const paymentResult = ref(null)

  const API_BASE_URL = 'http://localhost:8080'

  const processPaymentResult = async () => {
    try {
      console.log('=== Processing Payment Return ===')
      console.log('Route query:', route.query)

      // Lấy tất cả query parameters từ URL
      const params = { ...route.query }

      console.log('Sending params to backend:', params)

      // Gọi API xử lý kết quả
      const response = await axios.post(`${API_BASE_URL}/api/vnpay/payment-return`, params)

      console.log('Backend response:', response.data)

      paymentResult.value = response.data

      if (response.data.success) {
        // Xóa giỏ hàng nếu thanh toán thành công
        await clearCart()
      }

    } catch (error) {
      console.error('Error processing payment result:', error)
      paymentResult.value = {
        success: false,
        message: 'Không thể xử lý kết quả thanh toán: ' + (error.response?.data?.message || error.message)
      }
    } finally {
      isLoading.value = false
    }
  }

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        await axios.delete(`${API_BASE_URL}/api/gio-hang/clear`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        console.log('Cart cleared successfully')
      }
      localStorage.removeItem('cart')

      // Dispatch events để update UI
      window.dispatchEvent(new StorageEvent('storage', { key: 'cart', newValue: null }))
      window.dispatchEvent(new CustomEvent('cartUpdated'))

    } catch (error) {
      console.error('Error clearing cart:', error)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount)
  }

  const goToOrderDetail = () => {
    if (paymentResult.value?.orderCode) {
      router.push(`/order-success/${paymentResult.value.orderCode}`)
    } else {
      goHome()
    }
  }

  const goHome = () => {
    router.push('/')
  }

  const retryPayment = () => {
    router.push('/checkout')
  }

  onMounted(() => {
    console.log('PaymentReturn component mounted')
    processPaymentResult()
  })
  </script>

  <style scoped>
  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .transition {
    transition: all 0.3s ease;
  }
  </style>
