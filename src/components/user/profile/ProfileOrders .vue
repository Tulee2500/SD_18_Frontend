<template>
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h4 class="text-xl font-semibold text-gray-800 mb-6">HÓA ĐƠN CỦA TÔI</h4>

      <div v-if="isLoadingOrders" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>

      <div v-else-if="orders.length === 0" class="text-center py-12">
        <i class="pi pi-file-text text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500">Bạn chưa có hóa đơn nào</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Hiển thị hóa đơn (3 đầu tiên hoặc tất cả) -->
        <div v-for="order in getDisplayedOrders()" :key="order.id" class="border border-gray-200 rounded-lg overflow-hidden">
          <!-- Header hóa đơn -->
          <div class="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <div class="flex items-center space-x-4">
              <span class="text-sm font-semibold text-gray-800">{{ order.maHoaDon }}</span>
              <span class="text-sm text-gray-500">{{ formatDate(order.ngayTao) }}</span>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <i class="pi pi-globe mr-1"></i>
                Online
              </span>
            </div>
            <div class="flex items-center space-x-3">
              <span :class="['px-3 py-1 rounded-full text-sm font-medium', getStatusClass(order.trangThaiHoaDon)]">
                {{ getStatusLabel(order.trangThaiHoaDon) }}
              </span>
            </div>
          </div>

          <!-- Danh sách sản phẩm -->
          <div class="p-6">
            <div v-if="loadingOrderDetails[order.id]" class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>

            <div v-else-if="orderDetails[order.id]" class="space-y-4 mb-6">
              <!-- Hiển thị sản phẩm (2 đầu tiên hoặc tất cả) -->
              <div v-for="item in getDisplayedProducts(order.id)" :key="item.id"
                   class="flex items-center space-x-4">
                <!-- Hình ảnh sản phẩm -->
                <div class="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    :src="getProductImage(item)"
                    :alt="item.tenSanPham"
                    class="w-full h-full object-cover"
                    @error="handleImageError"
                  />
                </div>

                <!-- Thông tin sản phẩm -->
                <div class="flex-1">
                  <h5 class="font-medium text-gray-900 mb-1">{{ item.tenSanPham }}</h5>
                  <div class="text-sm text-gray-500">
                    <span v-if="item.giaGiam" class="line-through mr-2">{{ formatCurrency(item.giaGoc) }}</span>
                  </div>
                </div>

                <!-- Số lượng và giá -->
                <div class="text-right">
                  <p class="text-sm font-semibold text-black-500">{{ item.soLuong }} x {{ formatCurrency(item.giaBan) }}</p>
                </div>
              </div>

              <!-- Nút "Xem thêm" nếu có nhiều hơn 2 sản phẩm -->
              <div v-if="getRemainingProductsCount(order.id) > 0 && !showAllProducts[order.id]"
                   class="text-center pt-2">
                <button
                  @click="toggleShowAllProducts(order.id)"
                  class="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <span>Xem thêm {{ getRemainingProductsCount(order.id) }} sản phẩm</span>
                  <i class="pi pi-chevron-down"></i>
                </button>
              </div>

              <!-- Nút "Thu gọn" nếu đang hiển thị tất cả -->
              <div v-if="showAllProducts[order.id] && orderDetails[order.id].chiTietSanPham.length > 2"
                   class="text-center pt-2">
                <button
                  @click="toggleShowAllProducts(order.id)"
                  class="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <span>Thu gọn</span>
                  <i class="pi pi-chevron-up"></i>
                </button>
              </div>
            </div>

            <!-- Tổng tiền và nút xem chi tiết -->
            <div class="flex justify-between items-center pt-4 border-t border-gray-200">
              <div class="text-right">
                <p class="text-sm text-red-500">Tổng tiền : {{ formatCurrency(getTotalAmount(order)) }}</p>
              </div>

              <button
                @click="viewOrderDetail(order.id)"
                class="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Xem chi tiết
              </button>
            </div>
          </div>
        </div>

        <!-- Nút "Xem thêm hóa đơn" nếu có nhiều hơn 3 hóa đơn -->
        <div v-if="getRemainingOrdersCount() > 0 && !showAllOrders" class="text-center pt-6">
          <button
            @click="toggleShowAllOrders"
            class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center space-x-2 mx-auto"
          >
            <span>Xem thêm {{ getRemainingOrdersCount() }} hóa đơn</span>
            <i class="pi pi-chevron-down"></i>
          </button>
        </div>

        <!-- Nút "Thu gọn" nếu đang hiển thị tất cả hóa đơn -->
        <div v-if="showAllOrders && orders.length > 3" class="text-center pt-6">
          <button
            @click="toggleShowAllOrders"
            class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center space-x-2 mx-auto"
          >
            <span>Thu gọn danh sách</span>
            <i class="pi pi-chevron-up"></i>
          </button>
        </div>
      </div>
    </div>
  </template>

  <script setup>
  import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

  const router = useRouter();
  const toast = useToast();

  // State
  const orders = ref([]);
  const isLoadingOrders = ref(false);
  const orderDetails = reactive({});
  const loadingOrderDetails = reactive({});
  const showAllProducts = reactive({});
  const showAllOrders = ref(false);

  // State để cache URL ảnh
  const imageCache = ref({});
  const loadingImages = ref(new Set());

  // API Configuration
  const API_BASE_URL = 'http://localhost:8080';

  // Auth helpers
  const getAuthToken = () => localStorage.getItem('auth_token');

  // Load orders và tự động load chi tiết
  const loadOrders = async () => {
    isLoadingOrders.value = true;
    try {
      const response = await axios.get(`${API_BASE_URL}/hoa-don/my-orders`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      const allOrders = response.data || [];
      orders.value = allOrders.filter(order => {
        return order.loaiHoaDon === 'ONLINE' ||
               order.phuongThucDatHang === 'ONLINE' ||
               order.isOnline === true ||
               order.type === 'ONLINE';
      });

      // Khởi tạo state showAllProducts cho mỗi order
      orders.value.forEach(order => {
        showAllProducts[order.id] = false;
      });

      // Tự động load chi tiết cho tất cả đơn hàng
      for (const order of orders.value) {
        await loadOrderDetails(order.id);
      }

      console.log(`Loaded ${orders.value.length} online orders with details`);

    } catch (error) {
      console.error('Error loading orders:', error);
      if (error.response?.status === 401) {
        toast.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Phiên đăng nhập hết hạn',
          life: 3000
        });
      }
      orders.value = [];
    } finally {
      isLoadingOrders.value = false;
    }
  };

  // Load order details
  const loadOrderDetails = async (orderId) => {
    if (orderDetails[orderId]) return; // Đã load rồi

    loadingOrderDetails[orderId] = true;
    try {
      const response = await axios.get(`${API_BASE_URL}/hoa-don/${orderId}/chi-tiet`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      orderDetails[orderId] = response.data.data;

    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      loadingOrderDetails[orderId] = false;
    }
  };

  // Lấy danh sách hóa đơn hiển thị (3 đầu tiên hoặc tất cả)
  const getDisplayedOrders = () => {
    if (showAllOrders.value || orders.value.length <= 3) {
      return orders.value;
    }
    return orders.value.slice(0, 3);
  };

  // Đếm số hóa đơn còn lại chưa hiển thị
  const getRemainingOrdersCount = () => {
    return Math.max(0, orders.value.length - 3);
  };

  // Toggle hiển thị tất cả hóa đơn
  const toggleShowAllOrders = () => {
    showAllOrders.value = !showAllOrders.value;
  };

  // Lấy danh sách sản phẩm hiển thị (2 sản phẩm đầu hoặc tất cả)
  const getDisplayedProducts = (orderId) => {
    const products = orderDetails[orderId]?.chiTietSanPham || [];
    if (showAllProducts[orderId] || products.length <= 2) {
      return products;
    }
    return products.slice(0, 2);
  };

  // Đếm số sản phẩm còn lại chưa hiển thị
  const getRemainingProductsCount = (orderId) => {
    const products = orderDetails[orderId]?.chiTietSanPham || [];
    return Math.max(0, products.length - 2);
  };

  // Toggle hiển thị tất cả sản phẩm
  const toggleShowAllProducts = (orderId) => {
    showAllProducts[orderId] = !showAllProducts[orderId];
  };

  // ========== GỌI API LẤY ĐƯỜNG DẪN THỰC TẾ ==========
  const getProductImage = (item) => {
    console.log('Getting image URL for item:', item);

    const key = item.idHinhAnh || item.tenHinhAnh;

    // Nếu đã có trong cache
    if (key && imageCache.value[key]) {
      console.log('Using cached URL:', imageCache.value[key]);
      return imageCache.value[key];
    }

    // Nếu đang load, trả về placeholder
    if (key && loadingImages.value.has(key)) {
      console.log('Loading in progress, using placeholder');
      return getPlaceholderImage(item);
    }

    // Nếu có key thì load async
    if (key) {
      console.log('Starting async load for key:', key);
      loadImageUrl(key, item);
      return getPlaceholderImage(item);
    }

    console.log('No image key found, using placeholder');
    return getPlaceholderImage(item);
  };

  // Load đường dẫn ảnh từ API
  const loadImageUrl = async (key, item) => {
    if (loadingImages.value.has(key)) return;

    loadingImages.value.add(key);

    try {
      console.log('Loading image URL for key:', key);

      // Gọi API để lấy đường dẫn thực tế
      const response = await axios.get(`${API_BASE_URL}/hinh-anh/duong-dan/${key}`);

      if (response.data) {
        console.log('Got image URL from API:', response.data);
        // Cache URL để dùng cho lần sau
        imageCache.value[key] = response.data;

        // Force re-render để cập nhật ảnh
        orderDetails[Object.keys(orderDetails)[0]] = {...orderDetails[Object.keys(orderDetails)[0]]};
      }

    } catch (error) {
      console.error('Error loading image URL for', key, ':', error);
    } finally {
      loadingImages.value.delete(key);
    }
  };

  const getPlaceholderImage = (item) => {
    const productName = item?.tenSanPham || 'Sản phẩm';
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" fill="#f3f4f6"/>
        <text x="32" y="28" text-anchor="middle" dominant-baseline="middle"
              font-family="Arial" font-size="8" fill="#9ca3af">
          ${productName.substring(0, 10)}
        </text>
        <text x="32" y="40" text-anchor="middle" dominant-baseline="middle"
              font-family="Arial" font-size="6" fill="#9ca3af">
          No Image
        </text>
      </svg>
    `)}`;
  };

  // View order detail - chuyển sang trang chi tiết
  const viewOrderDetail = (orderId) => {
    router.push(`/profile/orders/${orderId}`);
  };

  // Handle image error
  const handleImageError = (event) => {
    event.target.src = getPlaceholderImage();
  };

  // Utility functions
  const formatDate = (date) => {
    if (!date) return '';
    
    try {
      let parsedDate;
      
      if (typeof date === 'string') {
        // Xử lý format dd/mm/yyyy hh:mm:ss
        if (date.includes('/') && date.includes(' ')) {
          const [datePart, timePart] = date.split(' ');
          const [day, month, year] = datePart.split('/');
          const [hour, minute, second] = timePart.split(':');
          
          // Tạo Date object với format yyyy-mm-ddThh:mm:ss và cộng thêm 7 giờ
          const dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${(second || '00').padStart(2, '0')}`;
          parsedDate = new Date(dateString);
          
          // Cộng thêm 7 giờ (7 * 60 * 60 * 1000 milliseconds)
          parsedDate.setTime(parsedDate.getTime() + (7 * 60 * 60 * 1000));
        } else {
          // Thử parse trực tiếp và cộng thêm 7 giờ
          parsedDate = new Date(date);
          parsedDate.setTime(parsedDate.getTime() + (7 * 60 * 60 * 1000));
        }
      } else {
        parsedDate = new Date(date);
        parsedDate.setTime(parsedDate.getTime() + (7 * 60 * 60 * 1000));
      }
      
      if (isNaN(parsedDate.getTime())) {
        return '';
      }
      
      return parsedDate.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', date);
      return '';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + 'đ';
  };

  const getTotalAmount = (order) => {
    return order.tongThanhToan ||
           order.tongTien ||
           order.totalAmount ||
           order.amount ||
           order.total ||
           order.thanhTien ||
           order.soTien ||
           0;
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'CHO_XAC_NHAN': 'Chờ xác nhận',
      'CHO_THANH_TOAN': 'Chờ thanh toán',
      'DA_XAC_NHAN': 'Đã xác nhận',
      'DANG_GIAO': 'Đang giao',
      'DA_GIAO': 'Đã giao',
      'HOAN_THANH': 'Hoàn thành',
      'DA_HUY': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      'CHO_XAC_NHAN': 'bg-yellow-100 text-yellow-800',
      'CHO_THANH_TOAN': 'bg-orange-100 text-orange-800',
      'DA_XAC_NHAN': 'bg-blue-100 text-blue-800',
      'DANG_GIAO': 'bg-purple-100 text-purple-800',
      'DA_GIAO': 'bg-green-100 text-green-800',
      'HOAN_THANH': 'bg-green-100 text-green-800',
      'DA_HUY': 'bg-red-100 text-red-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  };

  // Lifecycle
  onMounted(() => {
    loadOrders();
  });
  </script>

  <style scoped>
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  .bg-yellow-100 { background-color: #fef3c7; }
  .text-yellow-800 { color: #92400e; }
  .bg-orange-100 { background-color: #fed7aa; }
  .text-orange-800 { color: #9a3412; }
  .bg-blue-100 { background-color: #dbeafe; }
  .text-blue-800 { color: #1e40af; }
  .bg-purple-100 { background-color: #ede9fe; }
  .text-purple-800 { color: #5b21b6; }
  .bg-green-100 { background-color: #d1fae5; }
  .text-green-800 { color: #065f46; }
  .bg-red-100 { background-color: #fee2e2; }
  .text-red-800 { color: #991b1b; }
  .bg-gray-100 { background-color: #f3f4f6; }
  .text-gray-800 { color: #1f2937; }

  button {
    transition: all 0.2s ease;
  }

  .transition {
    transition: all 0.3s ease;
  }

  /* Thêm style cho nút xem thêm */
  button:hover {
    transform: translateY(-1px);
  }

  .pi-chevron-down, .pi-chevron-up {
    font-size: 12px;
  }
  </style> 
