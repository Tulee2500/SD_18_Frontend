<template>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-gray-900">Phân Tích Theo Thương Hiệu</h3>
        </div>
        <div class="h-80">
            <canvas ref="chartCanvas"></canvas>
        </div>
    </div>
</template>

<script setup>
import { Chart, registerables } from 'chart.js';
import { nextTick, onMounted, ref, watch } from 'vue';

Chart.register(...registerables);

const props = defineProps({
    data: {
        type: Array,
        required: true
    }
});

const chartCanvas = ref(null);
let chartInstance = null;

const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];

const createChart = async () => {
    await nextTick();

    if (!chartCanvas.value || !props.data?.length) return;

    const ctx = chartCanvas.value.getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: props.data.map((item) => item.brandName),
            datasets: [
                {
                    data: props.data.map((item) => item.percentage),
                    backgroundColor: colors.slice(0, props.data.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label;
                            const value = context.parsed;
                            return `${label}: ${value}%`;
                        }
                    }
                }
            }
        }
    });
};

onMounted(() => {
    createChart();
});

watch(
    () => props.data,
    () => {
        createChart();
    },
    { deep: true }
);
</script>
