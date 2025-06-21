<template>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-gray-900">Sản Phẩm Bán Chạy</h3>
            <select :value="selectedCategory" @change="$emit('categoryChange', $event.target.value)" class="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500">
                <option value="all">Tất cả</option>
                <option value="Nike">Nike</option>
                <option value="Adidas">Adidas</option>
                <option value="Converse">Converse</option>
                <option value="Vans">Vans</option>
                <option value="Puma">Puma</option>
            </select>
        </div>
        <div class="space-y-4">
            <div v-for="(product, index) in filteredProducts" :key="index" class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span class="text-sm font-semibold text-blue-600">#{{ index + 1 }}</span>
                    </div>
                    <div>
                        <p class="font-medium text-gray-900">{{ product.productName }}</p>
                        <p class="text-sm text-gray-500">Kho: {{ product.stock }} đôi</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-gray-900">{{ product.soldQuantity }} đôi</p>
                    <p class="text-sm text-gray-500">{{ formatCurrency(product.revenue) }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup>
import { computed } from 'vue'
import { formatCurrency } from '@/utils/formatters'

const props = defineProps({
  products: {
    type: Array,
    required: true
  },
  selectedCategory: {
    type: String,
    default: 'all'
  }
})

defineEmits(['categoryChange'])

const filteredProducts = computed(() => {
  if (props.selectedCategory === 'all') {
    return props.products.slice(0, 5)
  }
  return props.products
    .filter(product => product.brandName === props.selectedCategory)
    .slice(0, 5)
})
</script>