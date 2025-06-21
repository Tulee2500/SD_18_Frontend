<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <StatCard
      title="Tổng Doanh Thu"
      :value="formatCurrency(stats.totalRevenue)"
      change="+12.5% so với tháng trước"
      :icon="DollarSignIcon"
      trend="up"
      color="green"
    />
    <StatCard
      title="Đơn Hàng"
      :value="formatNumber(stats.totalOrders)"
      change="+8.3% so với tháng trước"
      :icon="ShoppingCartIcon"
      trend="up"
      color="blue"
    />
    <StatCard
      title="Khách Hàng"
      :value="formatNumber(stats.totalCustomers)"
      change="+15.2% so với tháng trước"
      :icon="UsersIcon"
      trend="up"
      color="purple"
    />
    <StatCard
      title="Sản Phẩm"
      :value="formatNumber(stats.totalProducts)"
      change="+5.1% so với tháng trước"
      :icon="PackageIcon"
      trend="up"
      color="orange"
    />
  </div>
</template>

<script setup>
import { 
  DollarSign as DollarSignIcon, 
  ShoppingCart as ShoppingCartIcon, 
  Users as UsersIcon, 
  Package as PackageIcon 
} from 'lucide-vue-next'
import StatCard from '@/components/common/StatCard.vue'
import { formatCurrency, formatNumber } from '@/utils/formatters'

defineProps({
  stats: {
    type: Object,
    required: true
  }
})
</script>