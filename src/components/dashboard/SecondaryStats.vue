<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="text-center">
        <p class="text-sm font-medium text-gray-600 mb-2">Giá Trị Đơn Hàng TB</p>
        <p class="text-xl font-bold text-gray-900">{{ formatCurrency(stats.avgOrderValue) }}</p>
      </div>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="text-center">
        <p class="text-sm font-medium text-gray-600 mb-2">Tỷ Lệ Chuyển Đổi</p>
        <p class="text-xl font-bold text-gray-900">{{ stats.conversionRate }}%</p>
      </div>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="text-center">
        <p class="text-sm font-medium text-gray-600 mb-2">Tỷ Lệ Trả Hàng</p>
        <p class="text-xl font-bold text-gray-900">{{ stats.returnRate }}%</p>
      </div>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="text-center">
        <p class="text-sm font-medium text-gray-600 mb-2">Khách Hàng Quay Lại</p>
        <p class="text-xl font-bold text-gray-900">{{ stats.customerRetention }}%</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatCurrency } from '@/utils/formatters'

defineProps({
  stats: {
    type: Object,
    required: true
  }
})
</script>