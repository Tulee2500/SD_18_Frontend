<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const emit = defineEmits(['order-success', 'go-back']);

// API Configuration
const API_BASE_URL = 'http://localhost:8080';

// User & Cart Data
const userInfo = ref(null);
const cartItems = ref([]);
const isLoading = ref(false);
const orderSuccess = ref(false);

// Shipping Information
const shippingInfo = ref({
  fullName: '',
  email: '',
  phone: '',
  address: '',
  district: '',
  province: '',
  ward: '',
  shippingType: 'home',
  note: ''
});

// Payment & Discount
const discountCode = ref('');
const discount = ref(0);
const paymentMethod = ref('cod'); // cod, bank_transfer, etc.

// Location Data
const provinces = ref([]);
const districts = ref([]);
const wards = ref([]);

// Load user info from localStorage
const loadUserInfo = () => {
  const savedUser = localStorage.getItem('user_info');
  if (savedUser) {
    userInfo.value = JSON.parse(savedUser);
    // Pre-fill shipping info with user data
    shippingInfo.value.fullName = userInfo.value.hoTen || '';
    shippingInfo.value.email = userInfo.value.email || '';
    shippingInfo.value.phone = userInfo.value.soDienThoai || '';
  } else {
    // Redirect to login if not authenticated
    router.push('/auth/login');
  }
};

// Load cart from localStorage
const loadCart = () => {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    const parsedCart = JSON.parse(savedCart);
    cartItems.value = parsedCart.map(item => ({
      id: item.productDetailId || item.id,
      name: item.name,
      code: `MSL${item.productDetailId || item.id}`,
      image: item.image,
      price: Number(item.price),
      quantity: Number(item.quantity),
      size: item.size?.name || item.size,
      color: item.color,
      totalPrice: Number(item.price) * Number(item.quantity)
    }));
  } else {
    // Redirect to cart if empty
    router.push('/cart');
  }
};

// Load provinces/cities
const loadProvinces = async () => {
  try {
    // This would typically call your backend API for provinces
    // For demo, using static data
    provinces.value = [
      { id: 1, name: 'Hà Nội' },
      { id: 2, name: 'TP. Hồ Chí Minh' },
      { id: 3, name: 'Đà Nẵng' },
      { id: 4, name: 'Hải Phòng' },
      { id: 5, name: 'Cần Thơ' }
    ];
  } catch (error) {
    console.error('Error loading provinces:', error);
  }
};

// Load districts based on province
const loadDistricts = async (provinceId) => {
  try {
    // This would call your backend API
    districts.value = [
      { id: 1, name: 'Quận Ba Đình' },
      { id: 2, name: 'Quận Hoàn Kiếm' },
      { id: 3, name: 'Quận Đống Đa' },
      { id: 4, name: 'Quận Hai Bà Trưng' },
      { id: 5, name: 'Quận Cầu Giấy' }
    ];
  } catch (error) {
    console.error('Error loading districts:', error);
  }
};

// Load wards based on district
const loadWards = async (districtId) => {
  try {
    // This would call your backend API
    wards.value = [
      { id: 1, name: 'Phường Phúc Xá' },
      { id: 2, name: 'Phường Trúc Bạch' },
      { id: 3, name: 'Phường Vĩnh Phúc' },
      { id: 4, name: 'Phường Cống Vị' },
      { id: 5, name: 'Phường Liễu Giai' }
    ];
  } catch (error) {
    console.error('Error loading wards:', error);
  }
};

// Province change handler
const onProvinceChange = () => {
  shippingInfo.value.district = '';
  shippingInfo.value.ward = '';
  districts.value = [];
  wards.value = [];
  if (shippingInfo.value.province) {
    loadDistricts(shippingInfo.value.province);
  }
};

// District change handler
const onDistrictChange = () => {
  shippingInfo.value.ward = '';
  wards.value = [];
  if (shippingInfo.value.district) {
    loadWards(shippingInfo.value.district);
  }
};

// Apply discount code
const applyDiscountCode = () => {
  const code = discountCode.value.toLowerCase().trim();
  if (code === 'myshoes') {
    discount.value = 55000;
    showNotification('success', 'Áp dụng mã thành công!', 'Bạn đã được giảm 55.000đ');
  } else if (code === 'newcustomer') {
    discount.value = 30000;
    showNotification('success', 'Áp dụng mã thành công!', 'Bạn đã được giảm 30.000đ');
  } else if (code !== '') {
    showNotification('error', 'Mã không hợp lệ', 'Mã giảm giá không tồn tại hoặc đã hết hạn');
    discount.value = 0;
  }
};

// Notification system
const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: ''
});

const showNotification = (type, title, message) => {
  notification.value = { show: true, type, title, message };
  setTimeout(() => {
    notification.value.show = false;
  }, 3000);
};

// Computed properties
const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.totalPrice, 0);
});

const shippingFee = computed(() => {
  return subtotal.value >= 300000 ? 0 : 30000;
});

const total = computed(() => {
  return Math.max(0, subtotal.value - discount.value + shippingFee.value);
});

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

// Validate form
const validateForm = () => {
  if (!shippingInfo.value.fullName) {
    showNotification('error', 'Lỗi', 'Vui lòng nhập họ tên');
    return false;
  }
  if (!shippingInfo.value.phone) {
    showNotification('error', 'Lỗi', 'Vui lòng nhập số điện thoại');
    return false;
  }
  if (!shippingInfo.value.address) {
    showNotification('error', 'Lỗi', 'Vui lòng nhập địa chỉ');
    return false;
  }
  if (!shippingInfo.value.province) {
    showNotification('error', 'Lỗi', 'Vui lòng chọn tỉnh/thành phố');
    return false;
  }
  if (!shippingInfo.value.district) {
    showNotification('error', 'Lỗi', 'Vui lòng chọn quận/huyện');
    return false;
  }
  if (!shippingInfo.value.ward) {
    showNotification('error', 'Lỗi', 'Vui lòng chọn phường/xã');
    return false;
  }
  return true;
};

// Submit order
const submitOrder = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  try {
    const orderData = {
      khachHangId: userInfo.value.id,
      sanPhamChiTiet: cartItems.value.map(item => ({
        sanPhamChiTietId: item.id,
        soLuong: item.quantity,
        donGia: item.price
      })),
      tongTien: total.value,
      phiVanChuyen: shippingFee.value,
      giamGia: discount.value,
      diaChiGiaoHang: {
        hoTen: shippingInfo.value.fullName,
        soDienThoai: shippingInfo.value.phone,
        diaChi: shippingInfo.value.address,
        phuongXa: shippingInfo.value.ward,
        quanHuyen: shippingInfo.value.district,
        tinhThanh: shippingInfo.value.province,
        loaiDiaChi: shippingInfo.value.shippingType
      },
      ghiChu: shippingInfo.value.note,
      phuongThucThanhToan: paymentMethod.value
    };

    const response = await axios.post(`${API_BASE_URL}/api/don-hang`, orderData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      orderSuccess.value = true;
      // Clear cart
      localStorage.removeItem('cart');
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'cart',
        newValue: null
      }));

      showNotification('success', 'Đặt hàng thành công!', 'Đơn hàng của bạn đã được ghi nhận');
      emit('order-success', response.data.data);

      // Redirect to order success page after 2 seconds
      setTimeout(() => {
        router.push(`/order-success/${response.data.data.maDonHang}`);
      }, 2000);
    }
  } catch (error) {
    console.error('Order submission error:', error);
    showNotification('error', 'Lỗi', 'Không thể đặt hàng. Vui lòng thử lại!');
  } finally {
    isLoading.value = false;
  }
};

// Go back to cart
const goBackToCart = () => {
  emit('go-back');
};

// Initialize
onMounted(() => {
  loadUserInfo();
  loadCart();
  loadProvinces();
});
</script>

<template>
  <!-- Notification -->
  <Transition name="slide-fade">
    <div v-if="notification.show"
         :class="[
           'fixed top-20 right-6 z-50 p-4 rounded-lg shadow-lg max-w-sm',
           notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
         ]">
      <h4 class="font-bold">{{ notification.title }}</h4>
      <p class="text-sm">{{ notification.message }}</p>
    </div>
  </Transition>

  <div class="max-w-7xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-800 mb-8">Thanh toán</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Column - Shipping Information -->
      <div class="lg:col-span-2">
        <!-- Shipping Information Card -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4 flex items-center">
            <span class="text-2xl mr-2">📦</span>
            THÔNG TIN GIAO HÀNG
          </h2>

          <!-- Customer Info -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                HỌ VÀ TÊN <span class="text-red-500">*</span>
              </label>
              <input
                v-model="shippingInfo.fullName"
                type="text"
                class="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                placeholder="Nhập họ và tên"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  EMAIL
                </label>
                <input
                  v-model="shippingInfo.email"
                  type="email"
                  class="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  SỐ ĐIỆN THOẠI <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="shippingInfo.phone"
                  type="tel"
                  class="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                  placeholder="Số điện thoại"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ĐỊA CHỈ <span class="text-red-500">*</span>
              </label>
              <input
                v-model="shippingInfo.address"
                type="text"
                class="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                placeholder="Địa chỉ"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  TỈNH / THÀNH <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="shippingInfo.province"
                  @change="onProvinceChange"
                  class="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Chọn tỉnh / thành</option>
                  <option v-for="province in provinces" :key="province.id" :value="province.id">
                    {{ province.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  QUẬN / HUYỆN <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="shippingInfo.district"
                  @change="onDistrictChange"
                  class="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                  :disabled="!shippingInfo.province"
                >
                  <option value="">Chọn quận / huyện</option>
                  <option v-for="district in districts" :key="district.id" :value="district.id">
                    {{ district.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  PHƯỜNG / XÃ <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="shippingInfo.ward"
                  class="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                  :disabled="!shippingInfo.district"
                >
                  <option value="">Chọn phường / xã</option>
                  <option v-for="ward in wards" :key="ward.id" :value="ward.id">
                    {{ ward.name }}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Loại địa chỉ</label>
              <div class="flex gap-6">
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="shippingInfo.shippingType"
                    type="radio"
                    value="home"
                    class="mr-2 text-orange-500 focus:ring-orange-500"
                  />
                  <span class="flex items-center">
                    <span class="mr-1">🏠</span> Nhà
                  </span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="shippingInfo.shippingType"
                    type="radio"
                    value="office"
                    class="mr-2 text-orange-500 focus:ring-orange-500"
                  />
                  <span class="flex items-center">
                    <span class="mr-1">🏢</span> Công ty
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Ghi chú (tùy chọn)</label>
              <textarea
                v-model="shippingInfo.note"
                rows="3"
                class="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                placeholder="Ghi chú cho người giao hàng..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Payment Method Card -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4 flex items-center">
            <span class="text-2xl mr-2">💳</span>
            PHƯƠNG THỨC THANH TOÁN
          </h2>
          <div class="space-y-3">
            <label class="flex items-center p-4 border border-orange-300 rounded-lg cursor-pointer hover:bg-orange-50 hover:border-orange-400 transition">
              <input
                v-model="paymentMethod"
                type="radio"
                value="cod"
                class="mr-3 text-orange-500 focus:ring-orange-500"
              />
              <div class="flex-1">
                <p class="font-medium">Thanh toán khi nhận hàng (COD)</p>
                <p class="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận hàng</p>
              </div>
            </label>
            <label class="flex items-center p-4 border border-orange-300 rounded-lg cursor-pointer hover:bg-orange-50 hover:border-orange-400 transition">
              <input
                v-model="paymentMethod"
                type="radio"
                value="bank_transfer"
                class="mr-3 text-orange-500 focus:ring-orange-500"
              />
              <div class="flex-1">
                <p class="font-medium">Chuyển khoản ngân hàng</p>
                <p class="text-sm text-gray-600">Chuyển khoản qua tài khoản ngân hàng</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Right Column - Order Summary -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-md p-6 sticky top-6">
          <h2 class="text-xl font-semibold mb-4">TÓM TẮT ĐƠN HÀNG</h2>

          <!-- Cart Items Summary -->
          <div class="space-y-3 mb-4 max-h-64 overflow-y-auto">
            <div v-for="item in cartItems" :key="item.id" class="flex gap-3 pb-3 border-b last:border-0">
              <img
                :src="item.image"
                :alt="item.name"
                class="w-16 h-16 object-cover rounded"
                @error="$event.target.src = '/placeholder-shoe.png'"
              />
              <div class="flex-1">
                <h4 class="text-sm font-medium line-clamp-1">{{ item.name }}</h4>
                <p class="text-xs text-gray-500">
                  {{ item.code }} | Size: {{ item.size }}
                  <span v-if="item.color"> | {{ item.color.name || item.color }}</span>
                </p>
                <div class="flex justify-between items-center mt-1">
                  <span class="text-xs text-gray-600">Số lượng: {{ item.quantity }}</span>
                  <span class="text-sm font-medium">{{ formatCurrency(item.totalPrice) }}đ</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Discount Code -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">MÃ GIẢM GIÁ</label>
            <div class="flex gap-2">
              <input
                v-model="discountCode"
                type="text"
                class="flex-1 px-3 py-2 border border-orange-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-sm"
                placeholder="Nhập mã giảm giá"
                @keypress.enter="applyDiscountCode"
              />
              <button
                @click="applyDiscountCode"
                class="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition text-sm font-medium"
              >
                SỬ DỤNG
              </button>
            </div>
          </div>

          <!-- Order Total -->
          <div class="space-y-2 pt-4 border-t">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Tạm tính:</span>
              <span>{{ formatCurrency(subtotal) }}đ</span>
            </div>
            <div v-if="discount > 0" class="flex justify-between text-sm text-green-600">
              <span>Giảm giá:</span>
              <span>-{{ formatCurrency(discount) }}đ</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Phí vận chuyển:</span>
              <span :class="shippingFee === 0 ? 'text-green-600' : ''">
                {{ shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee) + 'đ' }}
              </span>
            </div>
            <div class="flex justify-between text-lg font-bold pt-2 border-t">
              <span>THÀNH TIỀN:</span>
              <span class="text-orange-600">{{ formatCurrency(total) }}đ</span>
            </div>
          </div>

          <!-- Notice -->
          <p class="text-xs text-red-600 mt-4 text-center">
            Do lượng đơn hàng tăng cao, thời gian giao hàng dự kiến sẽ tăng thêm 2-3 ngày.
            Rất mong Quý Khách thông cảm.
          </p>

          <!-- Action Buttons -->
          <div class="mt-6 space-y-3">
            <button
              @click="goBackToCart"
              class="w-full py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              ← QUAY LẠI GIỎ HÀNG
            </button>
            <button
              @click="submitOrder"
              :disabled="isLoading || cartItems.length === 0"
              class="w-full py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? 'ĐANG XỬ LÝ...' : 'HOÀN TẤT ĐƠN HÀNG' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Remove default browser outline */
input:focus,
select:focus,
textarea:focus {
  outline: none !important;
  box-shadow: none !important;
}

/* Line clamp utility */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Transitions */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

/* Custom scrollbar for order items */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Override default focus styles */
input[type="text"]:focus,
input[type="email"]:focus,
input[type="tel"]:focus,
textarea:focus,
select:focus {
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.1) !important;
}
</style>
