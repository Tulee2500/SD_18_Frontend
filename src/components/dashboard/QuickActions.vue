<template>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-6">Thao Tác Nhanh</h3>
        <div class="space-y-3">
            <button v-for="action in actions" :key="action.name" @click="action.onClick" class="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="flex items-center">
                    <component :is="action.icon" :class="action.iconColor" class="w-5 h-5 mr-3" />
                    <span class="text-sm font-medium">{{ action.name }}</span>
                </div>
                <ChevronRightIcon class="w-4 h-4 text-gray-400" />
            </button>
        </div>
    </div>
</template>

<script setup>
import { Award as AwardIcon, ChevronRight as ChevronRightIcon, Eye as EyeIcon, Package as PackageIcon, Users as UsersIcon } from 'lucide-vue-next';

const actions = [
    {
        name: 'Quản lý kho',
        icon: PackageIcon,
        iconColor: 'text-blue-600',
        onClick: () => console.log('Navigate to inventory')
    },
    {
        name: 'Quản lý khách hàng',
        icon: UsersIcon,
        iconColor: 'text-green-600',
        onClick: () => console.log('Navigate to customers')
    },
    {
        name: 'Chương trình khuyến mãi',
        icon: AwardIcon,
        iconColor: 'text-purple-600',
        onClick: () => console.log('Navigate to promotions')
    },
    {
        name: 'Báo cáo chi tiết',
        icon: EyeIcon,
        iconColor: 'text-orange-600',
        onClick: () => console.log('Navigate to reports')
    }
];
</script>
