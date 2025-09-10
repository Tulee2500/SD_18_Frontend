  <template>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Tăng Trưởng Khách Hàng</h3>
      </div>
      <div class="h-80">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>
  </template>

  <script setup>
  import { ref, onMounted, watch, nextTick } from 'vue'
  import { Chart, registerables } from 'chart.js'

  Chart.register(...registerables)

  const props = defineProps({
    data: {
      type: Array,
      required: true
    }
  })

  const chartCanvas = ref(null)
  let chartInstance = null

  const createChart = async () => {
    await nextTick()
    
    if (!chartCanvas.value || !props.data?.length) return

    const ctx = chartCanvas.value.getContext('2d')
    
    if (chartInstance) {
      chartInstance.destroy()
    }

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: props.data.map(item => item.month),
        datasets: [
          {
            label: 'Khách hàng mới',
            data: props.data.map(item => item.newCustomers),
            backgroundColor: '#3B82F6',
            borderRadius: 4
          },
          {
            label: 'Khách hàng quay lại',
            data: props.data.map(item => item.returningCustomers),
            backgroundColor: '#10B981',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 10
            }
          }
        }
      }
    })
  }

  onMounted(() => {
    createChart()
  })

  watch(() => props.data, () => {
    createChart()
  }, { deep: true })
  </script>