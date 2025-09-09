<template>
    <div class="order-detail-container max-w-4xl mx-auto">
      <!-- Custom Confirmation Modal -->
      <Transition name="modal">
        <div v-if="confirmModal.show" class="fixed inset-0 z-50 overflow-y-auto">
          <!-- Backdrop -->
          <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 transition-opacity" aria-hidden="true" @click="hideConfirmModal">
              <div class="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>

            <!-- Modal -->
            <div class="inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <!-- Icon -->
              <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4"
                   :class="{
                     'bg-red-100': confirmModal.type === 'danger',
                     'bg-yellow-100': confirmModal.type === 'warning',
                     'bg-blue-100': confirmModal.type === 'info'
                   }">
                <svg v-if="confirmModal.type === 'danger'" class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <svg v-else-if="confirmModal.type === 'warning'" class="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <svg v-else class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <!-- Content -->
              <div class="text-center">
                <h3 class="text-lg leading-6 font-bold text-gray-900 mb-2">
                  {{ confirmModal.title }}
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-600" v-html="confirmModal.message"></p>
                </div>
              </div>

              <!-- Actions -->
              <div class="mt-6 flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
                <button
                  type="button"
                  class="w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 sm:w-auto sm:text-sm transition-all"
                  @click="hideConfirmModal"
                  :disabled="confirmModal.loading"
                >
                  {{ confirmModal.cancelText }}
                </button>
                <button
                  type="button"
                  class="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-sm px-4 py-3 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="{
                    'bg-red-600 hover:bg-red-700 focus:ring-red-500': confirmModal.type === 'danger',
                    'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500': confirmModal.type === 'warning',
                    'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500': confirmModal.type === 'info'
                  }"
                  @click="handleConfirm"
                  :disabled="confirmModal.loading"
                >
                  <svg v-if="confirmModal.loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ confirmModal.loading ? 'Đang xử lý...' : confirmModal.confirmText }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>

      <!-- Order Not Found -->
      <div v-else-if="!order" class="text-center py-20">
        <i class="pi pi-exclamation-triangle text-6xl text-gray-400 mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy đơn hàng</h3>
        <p class="text-gray-500 mb-6">Đơn hàng không tồn tại hoặc đã bị xóa.</p>
        <button
          @click="goBack"
          class="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
        >
          Quay lại
        </button>
      </div>

      <!-- Order Detail Content -->
      <div v-else class="bg-white rounded-lg shadow-sm overflow-hidden">
        <!-- Header -->
        <div class="bg-white border-b border-gray-200 px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-xl font-semibold text-gray-800">
                CHI TIẾT ĐƠN HÀNG - #{{ order.maHoaDon || order.id }}
              </h1>
              <div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>Ngày đặt hàng: <strong>{{ formatDate(order.ngayTao) }}</strong></span>
                <span>Trạng thái:
                  <span :class="['font-medium', getStatusColor(order.trangThaiHoaDon)]">
                    {{ getStatusLabel(order.trangThaiHoaDon) }}
                  </span>
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <!-- Nút hủy đơn hàng -->
              <button
                v-if="canCancelOrder()"
                @click="showCancelConfirmation"
                :disabled="isCancelling"
                class="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                <i class="pi pi-times"></i>
                <span>{{ isCancelling ? 'Đang hủy...' : 'Hủy đơn' }}</span>
              </button>

              <button
                @click="goBack"
                class="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <i class="pi pi-arrow-left"></i>
                <span>Quay lại</span>
              </button>
            </div>
          </div>
        </div>

        <div class="p-6">
          <!-- Customer & Payment Info -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- Customer Info -->
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-4">
                <i class="pi pi-user text-gray-600"></i>
                <h3 class="font-semibold text-gray-800">THÔNG TIN KHÁCH HÀNG</h3>
              </div>
              <div class="space-y-3">
                <div>
                  <span class="text-sm text-gray-600">Người nhận:</span>
                  <p class="font-medium text-gray-800">
                    {{ order.tenKhachHang || order.tenNguoiNhan || order.khachHang?.hoTen || 'Chưa có thông tin' }}
                  </p>
                </div>
                <div v-if="order.sdt || order.khachHang?.sdt">
                  <span class="text-sm text-gray-600">Số điện thoại:</span>
                  <p class="font-medium text-gray-800">{{ order.sdt || order.khachHang?.sdt }}</p>
                </div>
                <div>
                  <span class="text-sm text-gray-600">Địa chỉ nhận hàng:</span>
                  <p class="font-medium text-gray-800">{{ order.diaChi || 'Chưa có địa chỉ' }}</p>
                </div>
              </div>
            </div>

            <!-- Payment Info -->
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-4">
                <i class="pi pi-credit-card text-gray-600"></i>
                <h3 class="font-semibold text-gray-800">HÌNH THỨC THANH TOÁN</h3>
              </div>
              <div class="space-y-3">
                <p class="font-medium text-gray-800">
                  {{ getPaymentMethodLabel(order.phuongThucThanhToan) }}
                </p>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full" :class="getPaymentStatusColor(getActualPaymentStatus())"></div>
                  <span class="text-sm font-medium" :class="getPaymentStatusTextColor(getActualPaymentStatus())">
                    {{ getPaymentStatusLabel(getActualPaymentStatus()) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Product Info -->
          <div class="mb-8">
            <div class="flex items-center gap-2 mb-4">
              <i class="pi pi-box text-gray-600"></i>
              <h3 class="font-semibold text-gray-800">THÔNG TIN SẢN PHẨM</h3>
            </div>

            <div v-if="orderItems.length === 0" class="text-center py-8 text-gray-500">
              Không có sản phẩm nào trong đơn hàng này
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="item in orderItems"
                :key="item.id"
                class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
              >
                <!-- Product Image -->
                <div class="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    v-if="item.idHinhAnh || item.tenHinhAnh"
                    :src="getImageUrl(item)"
                    :alt="getProductName(item)"
                    class="w-full h-full object-cover"
                    @error="handleImageError"
                  />
                  <i v-else class="pi pi-image text-gray-400 text-2xl"></i>
                </div>

                <!-- Product Details -->
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-800 uppercase text-sm mb-1">
                    {{ getProductName(item) }}
                  </h4>
                  <div class="text-sm text-gray-600">
                    <span v-if="item.mauSac || item.color">{{ item.mauSac || item.color }}</span>
                    <span v-if="item.kichThuoc || item.size"> / Size: {{ item.kichThuoc || item.size }}</span>
                    <span v-if="item.chatLieu || item.material"> / {{ item.chatLieu || item.material }}</span>
                  </div>
                </div>

                <!-- Quantity & Price -->
                <div class="text-right">
                  <p class="font-semibold text-gray-800">
                    {{ getItemQuantity(item) }} x {{ formatCurrency(getItemPrice(item)) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Order Summary -->
          <div class="border-t border-gray-200 pt-6 mb-8">
            <div class="max-w-md ml-auto space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">Giá tạm tính:</span>
                <span class="font-medium">{{ formatCurrency(getSubtotal()) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Phí vận chuyển:</span>
                <span class="font-medium">
                  {{ (order.phiVanChuyen || 0) > 0 ? formatCurrency(order.phiVanChuyen) : 'Miễn phí' }}
                </span>
              </div>
              <div v-if="order.giamGia" class="flex justify-between">
                <span class="text-gray-600">Giảm giá:</span>
                <span class="font-medium text-red-600">-{{ formatCurrency(order.giamGia) }}</span>
              </div>
              <div class="flex justify-between text-lg font-semibold border-t border-gray-200 pt-3">
                <span>Tổng tiền:</span>
                <span class="text-gray-800">{{ formatCurrency(getTotalAmount()) }}</span>
              </div>
            </div>
          </div>

          <!-- Order Status Timeline -->
          <div>
            <div class="flex items-center gap-2 mb-4">
              <i class="pi pi-clock text-gray-600"></i>
              <h3 class="font-semibold text-gray-800">TÌNH TRẠNG ĐƠN HÀNG</h3>
            </div>

            <div class="flex justify-center">
              <div class="flex flex-col items-center">
                <!-- Status Icon -->
                <div class="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                     :class="getStatusIconClass(order.trangThaiHoaDon)">
                  <i :class="getStatusIcon(order.trangThaiHoaDon)" class="text-2xl text-gray-800"></i>
                </div>

                <!-- Status Text -->
                <h4 class="font-semibold text-gray-800 mb-1">
                  {{ getStatusLabel(order.trangThaiHoaDon) }}
                </h4>

                <!-- Status Time -->
                <p class="text-sm text-gray-500">
                  {{ formatDateTime(order.ngayCapNhat || order.ngayTao) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <script setup>
  import { ref, onMounted, computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import axios from 'axios';
  import { useToast } from 'primevue/usetoast';

  const route = useRoute();
  const router = useRouter();
  const toast = useToast();

  // State
  const order = ref(null);
  const orderDetails = ref([]);
  const isLoading = ref(true);
  const isCancelling = ref(false);

  // Confirmation Modal State
  const confirmModal = ref({
    show: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy',
    type: 'danger', // 'danger', 'warning', 'info'
    onConfirm: null,
    loading: false
  });

  // State để cache URL ảnh
  const imageCache = ref({});
  const loadingImages = ref(new Set());

  // API Configuration
  const API_BASE_URL = 'http://localhost:8080';

  // Auth helpers
  const getAuthToken = () => localStorage.getItem('auth_token');

  // Computed property for order items
  const orderItems = computed(() => {
    return orderDetails.value || [];
  });

  // Confirmation Modal Functions
  const showConfirmModal = (title, message, onConfirm, options = {}) => {
    confirmModal.value = {
      show: true,
      title,
      message,
      confirmText: options.confirmText || 'Xác nhận',
      cancelText: options.cancelText || 'Hủy',
      type: options.type || 'danger',
      onConfirm,
      loading: false
    };
  };

  const hideConfirmModal = () => {
    confirmModal.value.show = false;
    confirmModal.value.loading = false;
    confirmModal.value.onConfirm = null;
  };

  const handleConfirm = async () => {
    if (confirmModal.value.onConfirm) {
      confirmModal.value.loading = true;
      try {
        await confirmModal.value.onConfirm();
        hideConfirmModal();
      } catch (error) {
        confirmModal.value.loading = false;
        console.error('Error in confirmation action:', error);
      }
    }
  };

  // Show cancel confirmation modal
  const showCancelConfirmation = () => {
    const orderNumber = order.value.maHoaDon || order.value.id;

    showConfirmModal(
      'Xác nhận hủy đơn hàng',
      `Bạn có chắc chắn muốn hủy đơn hàng <strong>#${orderNumber}</strong> không?<br><br><span class="text-amber-600">⚠️ Hành động này không thể hoàn tác!</span>`,
      async () => {
        await cancelOrder();
      },
      {
        confirmText: 'Hủy đơn hàng',
        cancelText: 'Giữ lại đơn',
        type: 'danger'
      }
    );
  };

  // Load order detail
  const loadOrderDetail = async () => {
    isLoading.value = true;
    try {
      const orderId = route.params.id;

      if (!orderId) {
        throw new Error('Order ID not found');
      }

      // Load order basic info
      const orderResponse = await axios.get(`${API_BASE_URL}/hoa-don/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      order.value = orderResponse.data;

      // Load order details
      try {
        const detailResponse = await axios.get(`${API_BASE_URL}/hoa-don/${orderId}/chi-tiet`, {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        });

        orderDetails.value = detailResponse.data?.data?.chiTietSanPham || detailResponse.data || [];

        console.log('Order loaded:', order.value);
        console.log('Order details loaded:', orderDetails.value);

      } catch (detailError) {
        console.warn('Could not load order details:', detailError);
        orderDetails.value = [];
      }

    } catch (error) {
      console.error('Error loading order detail:', error);

      if (error.response?.status === 404) {
        toast.add({
          severity: 'error',
          summary: 'Không tìm thấy',
          detail: 'Đơn hàng không tồn tại',
          life: 3000
        });
      } else if (error.response?.status === 401) {
        toast.add({
          severity: 'error',
          summary: 'Lỗi xác thực',
          detail: 'Vui lòng đăng nhập lại',
          life: 3000
        });
        router.push('/auth/login');
      } else {
        toast.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải thông tin đơn hàng',
          life: 3000
        });
      }

      order.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  // Navigation
  const goBack = () => {
    router.push('/profile/orders');
  };

  // Product helper functions
  const getProductName = (item) => {
    return item.tenSanPham ||
           item.sanPham?.tenSanPham ||
           item.product?.name ||
           item.name ||
           'Sản phẩm không xác định';
  };

  // ========== GỌI API LẤY ĐƯỜNG DẪN THỰC TẾ ==========
  const getImageUrl = (item) => {
    console.log('FIXED VERSION - Getting image URL for item:', item);

    const key = item.idHinhAnh || item.tenHinhAnh;

    // Nếu đã có trong cache
    if (key && imageCache.value[key]) {
      console.log('FIXED VERSION - Using cached URL:', imageCache.value[key]);
      return imageCache.value[key];
    }

    // Nếu đang load, trả về placeholder
    if (key && loadingImages.value.has(key)) {
      console.log('FIXED VERSION - Loading in progress, using placeholder');
      return getPlaceholderImage(item);
    }

    // Nếu có key thì load async
    if (key) {
      console.log('FIXED VERSION - Starting async load for key:', key);
      loadImageUrl(key, item);
      return getPlaceholderImage(item);
    }

    console.log('FIXED VERSION - No image key found, using placeholder');
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
        orderDetails.value = [...orderDetails.value];
      }

    } catch (error) {
      console.error('Error loading image URL for', key, ':', error);
    } finally {
      loadingImages.value.delete(key);
    }
  };

  const getPlaceholderImage = (item) => {
    const productName = getProductName(item);
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="80" fill="#f3f4f6"/>
        <text x="40" y="35" text-anchor="middle" dominant-baseline="middle"
              font-family="Arial" font-size="8" fill="#9ca3af">
          ${productName.substring(0, 15)}
        </text>
        <text x="40" y="50" text-anchor="middle" dominant-baseline="middle"
              font-family="Arial" font-size="6" fill="#9ca3af">
          No Image
        </text>
      </svg>
    `)}`;
  };

  const getItemQuantity = (item) => {
    return item.soLuong || item.quantity || 1;
  };

  const getItemPrice = (item) => {
    return item.giaBan || item.donGia || item.price || 0;
  };

  // Handle image error
  const handleImageError = (event) => {
    const img = event.target;
    const productText = getProductName({ tenSanPham: 'Product' });

    img.src = `data:image/svg+xml;base64,${btoa(`
      <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="80" fill="#f3f4f6"/>
        <text x="40" y="35" text-anchor="middle" dominant-baseline="middle"
              font-family="Arial" font-size="8" fill="#9ca3af">
          ${productText}
        </text>
        <text x="40" y="50" text-anchor="middle" dominant-baseline="middle"
              font-family="Arial" font-size="6" fill="#9ca3af">
          Image Error
        </text>
      </svg>
    `)}`;

    console.log('Image error handled with placeholder');
  };

  // ========== LOGIC THANH TOÁN VÀ HỦY ĐƠN HÀNG ==========

  // Kiểm tra trạng thái thanh toán thực tế
  const getActualPaymentStatus = () => {
    const paymentMethod = order.value?.phuongThucThanhToan;

    // Nếu thanh toán online (ONLINE, VNPAY, BANK_TRANSFER, etc.) thì coi như đã thanh toán
    if (paymentMethod && paymentMethod !== 'COD' && paymentMethod !== 'CASH') {
      return 'DA_THANH_TOAN';
    }

    // Debug log để xem giá trị thực tế
    console.log('Payment method:', paymentMethod);
    console.log('Payment status:', order.value?.trangThaiThanhToan);

    // Nếu là COD/CASH thì theo trạng thái gốc
    return order.value?.trangThaiThanhToan || 'CHUA_THANH_TOAN';
  };

  // Kiểm tra có thể hủy đơn hàng không
  const canCancelOrder = () => {
    if (!order.value) return false;

    const status = order.value.trangThaiHoaDon;
    const allowedStatuses = ['CHO_XAC_NHAN', 'CHO_THANH_TOAN'];

    return allowedStatuses.includes(status);
  };

  // Hủy đơn hàng
  const cancelOrder = async () => {
    if (!canCancelOrder()) return;

    isCancelling.value = true;

    try {
      await axios.put(`${API_BASE_URL}/hoa-don/${order.value.id}/cancel`, {}, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      // Cập nhật trạng thái local
      order.value.trangThaiHoaDon = 'DA_HUY';

      toast.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đơn hàng đã được hủy',
        life: 3000
      });

    } catch (error) {
      console.error('Error cancelling order:', error);

      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể hủy đơn hàng. Vui lòng thử lại.',
        life: 3000
      });
    } finally {
      isCancelling.value = false;
    }
  };

  // Utility functions
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${d.toLocaleDateString('vi-VN')}`;
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0đ';
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  // Calculate totals
  const getSubtotal = () => {
    return orderItems.value.reduce((total, item) => {
      const quantity = getItemQuantity(item);
      const price = getItemPrice(item);
      return total + (quantity * price);
    }, 0);
  };

  const getTotalAmount = () => {
    return order.value?.tongThanhToan ||
           order.value?.tongTien ||
           order.value?.totalAmount ||
           order.value?.total ||
           (getSubtotal() + (order.value?.phiVanChuyen || 0) - (order.value?.giamGia || 0));
  };

  // Status functions
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
    return statusMap[status] || status || 'Không xác định';
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'CHO_XAC_NHAN': 'text-yellow-600',
      'CHO_THANH_TOAN': 'text-orange-600',
      'DA_XAC_NHAN': 'text-blue-600',
      'DANG_GIAO': 'text-purple-600',
      'DA_GIAO': 'text-green-600',
      'HOAN_THANH': 'text-green-600',
      'DA_HUY': 'text-red-600'
    };
    return colorMap[status] || 'text-gray-600';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      'CHO_XAC_NHAN': 'pi pi-clock',
      'CHO_THANH_TOAN': 'pi pi-credit-card',
      'DA_XAC_NHAN': 'pi pi-check-circle',
      'DANG_GIAO': 'pi pi-send',
      'DA_GIAO': 'pi pi-check',
      'HOAN_THANH': 'pi pi-check-circle',
      'DA_HUY': 'pi pi-times-circle'
    };
    return iconMap[status] || 'pi pi-info-circle';
  };

  const getStatusIconClass = (status) => {
    const classMap = {
      'CHO_XAC_NHAN': 'bg-yellow-100',
      'CHO_THANH_TOAN': 'bg-orange-100',
      'DA_XAC_NHAN': 'bg-blue-100',
      'DANG_GIAO': 'bg-purple-100',
      'DA_GIAO': 'bg-green-100',
      'HOAN_THANH': 'bg-green-100',
      'DA_HUY': 'bg-red-100'
    };
    return classMap[status] || 'bg-gray-100';
  };

  // Payment functions
  const getPaymentMethodLabel = (method) => {
    const methodMap = {
      'COD': 'Thanh toán khi giao hàng (COD)',
      'BANK_TRANSFER': 'Chuyển khoản ngân hàng',
      'CASH': 'Thanh toán tiền mặt',
      'CARD': 'Thanh toán bằng thẻ',
      'ONLINE': 'Thanh toán online'
    };
    return methodMap[method] || method || 'Thanh toán khi giao hàng (COD)';
  };

  const getPaymentStatusLabel = (status) => {
    const statusMap = {
      'CHUA_THANH_TOAN': 'Chưa thanh toán',
      'DA_THANH_TOAN': 'Đã thanh toán',
      'DANG_CHO': 'Đang chờ thanh toán'
    };
    return statusMap[status] || status || 'Chưa thanh toán';
  };

  const getPaymentStatusColor = (status) => {
    const colorMap = {
      'CHUA_THANH_TOAN': 'bg-gray-400',
      'DA_THANH_TOAN': 'bg-green-500',
      'DANG_CHO': 'bg-yellow-500'
    };
    return colorMap[status] || 'bg-gray-400';
  };

  const getPaymentStatusTextColor = (status) => {
    const colorMap = {
      'CHUA_THANH_TOAN': 'text-gray-600',
      'DA_THANH_TOAN': 'text-green-600',
      'DANG_CHO': 'text-yellow-600'
    };
    return colorMap[status] || 'text-gray-600';
  };

  // Lifecycle
  onMounted(() => {
    loadOrderDetail();
  });
  </script>

  <style scoped>
  /* Modal animations */
  .modal-enter-active, .modal-leave-active {
    transition: opacity 0.3s ease;
  }

  .modal-enter-active .modal-container,
  .modal-leave-active .modal-container {
    transition: all 0.3s ease;
  }

  .modal-enter-from, .modal-leave-to {
    opacity: 0;
  }

  .modal-enter-from .modal-container,
  .modal-leave-to .modal-container {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }

  /* Loading animation */
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  /* Status colors */
  .text-yellow-600 { color: #d97706; }
  .text-orange-600 { color: #ea580c; }
  .text-blue-600 { color: #2563eb; }
  .text-purple-600 { color: #9333ea; }
  .text-green-600 { color: #16a34a; }
  .text-red-600 { color: #dc2626; }
  .text-gray-600 { color: #4b5563; }
  .text-gray-800 { color: #1f2937; }

  .bg-yellow-100 { background-color: #fef3c7; }
  .bg-orange-100 { background-color: #fed7aa; }
  .bg-blue-100 { background-color: #dbeafe; }
  .bg-purple-100 { background-color: #ede9fe; }
  .bg-green-100 { background-color: #d1fae5; }
  .bg-red-100 { background-color: #fee2e2; }
  .bg-gray-100 { background-color: #f3f4f6; }

  .bg-orange-600 { background-color: #ea580c; }
  .hover\:bg-orange-700:hover { background-color: #c2410c; }
  .bg-red-600 { background-color: #dc2626; }
  .hover\:bg-red-700:hover { background-color: #b91c1c; }

  /* Payment status colors */
  .bg-gray-400 { background-color: #9ca3af; }
  .bg-green-500 { background-color: #10b981; }
  .bg-yellow-500 { background-color: #f59e0b; }

  /* Responsive design */
  @media (max-width: 1024px) {
    .lg\:grid-cols-2 {
      grid-template-columns: 1fr;
    }
  }

  /* Transitions */
  button {
    transition: all 0.2s ease;
  }

  .hover\:bg-gray-100:hover {
    background-color: #f3f4f6;
  }

  /* Utility classes */
  .max-w-4xl {
    max-width: 56rem;
  }

  .mx-auto {
    margin-left: auto;
    margin-right: auto;
  }

  .flex-shrink-0 {
    flex-shrink: 0;
  }

  .border-gray-200 {
    border-color: #e5e7eb;
  }

  .border-t {
    border-top-width: 1px;
  }
  </style>
