<template>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-6">Trạng Thái Đơn Hàng</h3>
        <div class="space-y-4">
            <div v-for="(status, index) in data" :key="index" class="flex items-center justify-between">
                <div class="flex items-center">
                    <div :class="getStatusColor(status.status)" class="w-3 h-3 rounded-full mr-3"></div>
                    <span class="text-sm text-gray-600">{{ status.status }}</span>
                </div>
                <div class="text-right">
                    <span class="font-semibold text-gray-900">{{ status.count }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    data: {
        type: Array,
        required: true
    }
});

const getStatusColor = (status) => {
    switch (status) {
        case 'Hoàn thành':
            return 'bg-green-500';
        case 'Đang giao':
            return 'bg-blue-500';
        case 'Đã xác nhận':
            return 'bg-yellow-500';
        case 'Đã hủy':
            return 'bg-red-500';
        default:
            return 'bg-gray-500';
    }
};
</script>
