<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import axios from 'axios';

// Reactive data
const cartItems = ref([]);
const loadingImages = ref(new Set());
const isLoadingCart = ref(false);
const isSavingCart = ref(false); // Thêm flag để tránh infinite loop

// API Configuration
const API_BASE_URL = 'http://localhost:8080';

// Helper function for color mapping
const getColorHex = (tenMau) => {
  const colorMap = {
    'Trắng': '#ffffff',
    'Đen': '#000000',
    'Đỏ': '#ff0000',
    'Xanh Dương': '#0000ff',
    'Xanh Navy': '#001f3f',
    'Xanh Lá': '#008000',
    'Vàng': '#ffff00',
    'Cam': '#ffa500',
    'Hồng': '#ff69b4',
    'Tím': '#800080',
    'Nâu': '#8b4513',
    'Xám': '#808080',
    'Bạc': '#c0c0c0',
    'Vàng Gold': '#ffd700',
    'Be': '#f5f5dc'
  };
  return colorMap[tenMau] || '#cccccc';
};

// Build full image URL from backend path
const buildImageUrl = (imagePath) => {
  if (!imagePath) return '/placeholder-shoe.png';

  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// Fetch product detail to get updated image and info
const fetchProductDetail = async (productDetailId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/san-pham-chi-tiet/${productDetailId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product detail ${productDetailId}:`, error);
    return null;
  }
};

// Update cart item with fresh data from backend
const updateCartItemWithBackendData = async (cartItem) => {
  try {
    loadingImages.value.add(cartItem.id);

    const productDetail = await fetchProductDetail(cartItem.id);
    if (productDetail) {
      const imageUrl = productDetail.hinhAnh?.duongDan
        ? buildImageUrl(productDetail.hinhAnh.duongDan)
        : '/placeholder-shoe.png';

      const updatedItem = {
        ...cartItem,
        name: productDetail.sanPham?.tenSanPham || cartItem.name,
        image: imageUrl,
        price: productDetail.giaBan || cartItem.price,
        stock: productDetail.soLuong || cartItem.stock,
        color: productDetail.mauSac ? {
          id: productDetail.mauSac.id,
          name: productDetail.mauSac.tenMauSac,
          code: productDetail.mauSac.maMauSac
        } : cartItem.color,
        size: productDetail.kichCo?.tenKichCo || cartItem.size,
        code: `MSL${productDetail.id || cartItem.id}`,
        points: Math.floor((productDetail.giaBan || cartItem.price) / 100)
      };

      return updatedItem;
    }

    return cartItem;
  } catch (error) {
    console.error('Error updating cart item with backend data:', error);
    return cartItem;
  } finally {
    loadingImages.value.delete(cartItem.id);
  }
};

// Load cart from localStorage - FIXED VERSION
const loadCartFromStorage = async () => {
  if (isLoadingCart.value) return; // Tránh load đồng thời

  try {
    isLoadingCart.value = true;
    const savedCart = localStorage.getItem('cart');

    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);

      // Chỉ load dữ liệu cơ bản từ localStorage trước
      const initialCartItems = parsedCart.map(item => ({
        id: item.productDetailId || item.productId || item.id,
        name: item.name || 'Sản phẩm không xác định',
        code: `MSL${item.productDetailId || item.productId || Math.floor(Math.random() * 1000)}`,
        image: buildImageUrl(item.image) || '/placeholder-shoe.png',
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        points: Math.floor((Number(item.price) || 0) / 100),
        size: item.size?.name || item.size || null,
        color: item.color || null,
        stock: Number(item.stock) || 10,
        totalPrice: item.totalPrice || ((Number(item.price) || 0) * (Number(item.quantity) || 1))
      }));

      cartItems.value = initialCartItems;

      // Chỉ update backend data khi cần thiết (không phải lúc nào cũng gọi API)
      // Có thể thêm flag để kiểm soát việc này
      const shouldRefreshFromBackend = sessionStorage.getItem('shouldRefreshCart') === 'true';

      if (shouldRefreshFromBackend) {
        const updatedCartItems = await Promise.all(
          initialCartItems.map(item => updateCartItemWithBackendData(item))
        );

        cartItems.value = updatedCartItems;
        sessionStorage.removeItem('shouldRefreshCart'); // Chỉ refresh 1 lần

        // Lưu lại với dữ liệu mới NHƯNG KHÔNG trigger storage event
        saveCartToStorageQuiet();
      }
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    cartItems.value = [];
  } finally {
    isLoadingCart.value = false;
  }
};

// Save cart to localStorage - FIXED VERSION
const saveCartToStorage = () => {
  if (isSavingCart.value) return; // Tránh save đồng thời

  try {
    isSavingCart.value = true;
    const cartData = cartItems.value.map(item => ({
      productId: item.id,
      productDetailId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      totalPrice: item.price * item.quantity,
      color: item.color,
      size: item.size ? { name: item.size } : null,
      image: item.image,
      stock: item.stock
    }));

    localStorage.setItem('cart', JSON.stringify(cartData));

    // Dispatch storage event cho other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cart',
      newValue: JSON.stringify(cartData)
    }));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  } finally {
    isSavingCart.value = false;
  }
};

// Save without triggering storage event - để tránh infinite loop
const saveCartToStorageQuiet = () => {
  try {
    const cartData = cartItems.value.map(item => ({
      productId: item.id,
      productDetailId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      totalPrice: item.price * item.quantity,
      color: item.color,
      size: item.size ? { name: item.size } : null,
      image: item.image,
      stock: item.stock
    }));

    localStorage.setItem('cart', JSON.stringify(cartData));
    // KHÔNG dispatch storage event
  } catch (error) {
    console.error('Error saving cart to localStorage quietly:', error);
  }
};

// Notification system
const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: '',
  duration: 3000
});

const showNotification = (type, title, message, duration = 3000) => {
  notification.value = {
    show: true,
    type,
    title,
    message,
    duration
  };

  setTimeout(() => {
    hideNotification();
  }, duration);
};

const hideNotification = () => {
  notification.value.show = false;
};

// Cart operations with notifications
const updateQuantity = (id, newQuantity) => {
  if (newQuantity < 1) return;

  const item = cartItems.value.find(item => item.id === id);
  if (item && newQuantity > item.stock) {
    showNotification(
      'warning',
      'Vượt quá số lượng',
      `Số lượng không được vượt quá ${item.stock} sản phẩm có sẵn!`
    );
    return;
  }

  cartItems.value = cartItems.value.map(item =>
    item.id === id ? { ...item, quantity: newQuantity } : item
  );
  saveCartToStorage();

  showNotification(
    'success',
    'Cập nhật thành công',
    `Đã cập nhật số lượng sản phẩm`
  );
};

const removeItem = (id) => {
  const item = cartItems.value.find(item => item.id === id);
  if (confirm(`Bạn có chắc chắn muốn xóa "${item?.name || 'sản phẩm này'}"?`)) {
    cartItems.value = cartItems.value.filter(item => item.id !== id);
    saveCartToStorage();

    showNotification(
      'success',
      'Đã xóa sản phẩm',
      `"${item?.name || 'Sản phẩm'}" đã được xóa khỏi giỏ hàng`
    );
  }
};

const refreshItem = (id) => {
  const item = cartItems.value.find(item => item.id === id);
  cartItems.value = cartItems.value.map(item =>
    item.id === id ? { ...item, quantity: 1 } : item
  );
  saveCartToStorage();

  showNotification(
    'info',
    'Đã reset số lượng',
    `"${item?.name || 'Sản phẩm'}" đã được reset về số lượng 1`
  );
};

const clearCart = () => {
  if (confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
    const itemCount = cartItems.value.length;
    cartItems.value = [];
    localStorage.removeItem('cart');

    // Dispatch event để notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cart',
      newValue: null
    }));

    showNotification(
      'success',
      'Đã xóa giỏ hàng',
      `Đã xóa ${itemCount} sản phẩm khỏi giỏ hàng`
    );
  }
};

// Discount operations with notifications - REMOVED

// Navigation functions
const continueShopping = () => {
  window.location.href = '/products';
};

const proceedToCheckout = () => {
  if (cartItems.value.length === 0) {
    showNotification(
      'warning',
      'Giỏ hàng trống',
      'Vui lòng thêm sản phẩm trước khi thanh toán'
    );
    return;
  }
  window.location.href = '/checkout';
};

// Handle image loading error
const handleImageError = (event, fallbackSrc = '/placeholder-shoe.png') => {
  if (event.target.src !== fallbackSrc) {
    event.target.src = fallbackSrc;
  } else {
    event.target.style.display = 'none';
    const placeholder = event.target.parentElement;
    if (placeholder) {
      placeholder.innerHTML = `
        <div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        </div>
      `;
    }
  }
};

// Computed properties
const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

const shippingFee = computed(() => {
  return subtotal.value >= 300000 ? 0 : 30000;
});

const total = computed(() => {
  return Math.max(0, subtotal.value + shippingFee.value);
});

const totalQuantity = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.quantity, 0);
});

// Utility functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

// Storage event handler - FIXED VERSION
const handleStorageChange = (e) => {
  if (e.key === 'card' && !isSavingCart.value && !isLoadingCart.value) {
    // Chỉ reload khi không phải do chính component này trigger
    loadCartFromStorage();
  }
};

// Lifecycle hooks
onMounted(() => {
  // Set flag để refresh data từ backend 1 lần khi mount
  sessionStorage.setItem('shouldRefreshCart', 'true');
  loadCartFromStorage();
  window.addEventListener('storage', handleStorageChange);
});

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange);
});
</script>

<template>
  <div class="w-full mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
      <!-- Header -->
      <div class="border-b border-gray-200 p-4 sm:p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 text-orange-500 text-2xl">🛒</div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">Giỏ hàng của bạn</h1>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-gray-600">
              <span class="font-semibold">{{ cartItems.length }}</span> sản phẩm
              <span class="text-sm">| {{ totalQuantity }} món</span>
            </span>
            <button
              v-if="cartItems.length > 0"
              @click="clearCart"
              class="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
            >
              Xóa tất cả
            </button>
          </div>
        </div>
      </div>

      <div class="flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
        <!-- Cart Items -->
        <div class="flex-1">
          <!-- Empty Cart State -->
          <div v-if="cartItems.length === 0" class="text-center py-12 sm:py-20">
            <div class="text-6xl mb-4">🛒</div>
            <h3 class="text-xl font-medium text-gray-800 mb-2">Giỏ hàng trống</h3>
            <p class="text-gray-600 mb-6">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
            <button
              @click="continueShopping"
              class="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Tiếp tục mua sắm
            </button>
          </div>

          <!-- Cart Items Header - Desktop only -->
          <div v-else class="hidden lg:block bg-gray-50 rounded-lg p-4 mb-4">
            <div class="grid grid-cols-13 gap-4 text-sm font-medium text-gray-600">
              <div class="col-span-1">Hình ảnh</div>
              <div class="col-span-3">Tên sản phẩm</div>
              <div class="col-span-2">Mã hàng</div>
              <div class="col-span-2">Số lượng</div>
              <div class="col-span-2">Đơn giá</div>
              <div class="col-span-2">Thành tiền</div>
              <div class="col-span-1">Thao tác</div>
            </div>
          </div>

          <!-- Cart Items List -->
          <div class="space-y-4">
            <div
              v-for="item in cartItems"
              :key="item.id"
              class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cart-item"
            >
              <!-- Desktop Layout -->
              <div class="hidden lg:grid grid-cols-13 gap-4 items-center">
                <!-- Product Image -->
                <div class="col-span-1">
                  <div class="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      :src="item.image"
                      :alt="item.name"
                      class="w-full h-full object-cover rounded-lg"
                      @error="$event.target.src = '/api/placeholder/80/80'"
                    />
                  </div>
                </div>

                <!-- Product Info -->
                <div class="col-span-3">
                  <h3 class="font-medium text-gray-800 mb-1 line-clamp-2 text-sm">{{ item.name }}</h3>
                  <div class="flex flex-wrap gap-1 text-xs text-gray-500 mb-1">
                    <span v-if="item.size" class="bg-gray-100 px-2 py-1 rounded">
                      Size: {{ item.size }}
                    </span>
                    <span v-if="item.color?.name" class="bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                      <div
                        class="w-2 h-2 rounded-full border border-gray-300"
                        :style="{ backgroundColor: getColorHex(item.color.name) }"
                      ></div>
                      {{ item.color.name }}
                    </span>
                  </div>
                  <p class="text-xs text-green-600">Điểm: +{{ item.points }}</p>
                  <p class="text-xs text-gray-500">Kho: {{ item.stock }}</p>
                </div>

                <!-- Product Code -->
                <div class="col-span-2">
                  <div class="text-gray-600 font-mono text-xs break-all">{{ item.code }}</div>
                </div>

                <!-- Quantity Controls -->
                <div class="col-span-2">
                  <div class="space-y-2">
                    <!-- Quantity Input with buttons -->
                    <div class="flex border rounded-md overflow-hidden bg-white max-w-40">
                      <button
                        @click="updateQuantity(item.id, item.quantity - 1)"
                        class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold"
                        :disabled="item.quantity <= 1"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        :value="item.quantity"
                        @input="updateQuantity(item.id, parseInt($event.target.value) || 1)"
                        class="w-16 h-8 text-center border-x text-sm focus:outline-none focus:bg-blue-50"
                        min="1"
                        :max="item.stock"
                      />
                      <button
                        @click="updateQuantity(item.id, item.quantity + 1)"
                        class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold"
                        :disabled="item.quantity >= item.stock"
                      >
                        +
                      </button>
                    </div>
                    <!-- Stock info -->
                    <div class="text-xs text-gray-500">
                      {{ item.quantity }} / {{ item.stock }}
                    </div>
                  </div>
                </div>

                <!-- Unit Price -->
                <div class="col-span-2">
                  <div class="font-medium text-gray-800 text-sm">
                    {{ formatCurrency(item.price) }}đ
                  </div>
                  <div class="text-xs text-gray-500">đơn giá</div>
                </div>

                <!-- Total Price -->
                <div class="col-span-2">
                  <div class="font-bold text-orange-600 text-base">
                    {{ formatCurrency(item.price * item.quantity) }}đ
                  </div>
                  <div class="text-xs text-gray-500">{{ item.quantity }} x {{ formatCurrency(item.price) }}đ</div>
                </div>

                <!-- Actions -->
                <div class="col-span-1">
                  <div class="flex flex-col gap-2 items-center">
                    <button
                      @click="refreshItem(item.id)"
                      class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
                      title="Reset về 1"
                    >
                      Reset
                    </button>
                    <button
                      @click="removeItem(item.id)"
                      class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
                      title="Xóa sản phẩm"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>

              <!-- Mobile Layout -->
              <div class="lg:hidden">
                <div class="flex gap-4">
                  <!-- Product Image -->
                  <div class="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      :src="item.image"
                      :alt="item.name"
                      class="w-full h-full object-cover rounded-lg"
                      @error="$event.target.src = '/api/placeholder/80/80'"
                    />
                  </div>

                  <!-- Product Info -->
                  <div class="flex-1">
                    <h3 class="font-medium text-gray-800 mb-2">{{ item.name }}</h3>
                    <div class="flex flex-wrap gap-2 text-sm text-gray-500 mb-2">
                      <span v-if="item.size" class="bg-gray-100 px-2 py-1 rounded text-xs">
                        Size: {{ item.size }}
                      </span>
                      <span v-if="item.color?.name" class="bg-gray-100 px-2 py-1 rounded flex items-center gap-1 text-xs">
                        <div
                          class="w-3 h-3 rounded-full border border-gray-300"
                          :style="{ backgroundColor: getColorHex(item.color.name) }"
                        ></div>
                        {{ item.color.name }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 mb-1">Mã: {{ item.code }}</p>
                    <p class="text-xs text-green-600">Điểm thưởng: +{{ item.points }}</p>
                  </div>

                  <!-- Actions -->
                  <div class="flex flex-col gap-1">
                    <button
                      @click="refreshItem(item.id)"
                      class="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
                      title="Reset về 1"
                    >
                      Reset
                    </button>
                    <button
                      @click="removeItem(item.id)"
                      class="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                      title="Xóa sản phẩm"
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                <!-- Mobile Quantity and Price -->
                <div class="mt-4 space-y-3">
                  <!-- Quantity Control -->
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">Số lượng:</span>
                    <div class="flex items-center gap-3">
                      <div class="flex border rounded-lg overflow-hidden bg-white">
                        <button
                          @click="updateQuantity(item.id, item.quantity - 1)"
                          class="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 text-lg font-bold"
                          :disabled="item.quantity <= 1"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          :value="item.quantity"
                          @input="updateQuantity(item.id, parseInt($event.target.value) || 1)"
                          class="w-12 text-center border-x py-2 text-sm focus:outline-none focus:bg-blue-50"
                          min="1"
                          :max="item.stock"
                        />
                        <button
                          @click="updateQuantity(item.id, item.quantity + 1)"
                          class="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 text-lg font-bold"
                          :disabled="item.quantity >= item.stock"
                        >
                          +
                        </button>
                      </div>
                      <span class="text-xs text-gray-400">/ {{ item.stock }}</span>
                    </div>
                  </div>

                  <!-- Price Information -->
                  <div class="flex justify-between">
                    <div class="text-left">
                      <div class="text-sm text-gray-600">Đơn giá:</div>
                      <div class="font-medium text-gray-800">{{ formatCurrency(item.price) }}đ</div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm text-gray-600">Thành tiền:</div>
                      <div class="font-bold text-orange-600 text-lg">{{ formatCurrency(item.price * item.quantity) }}đ</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="w-full lg:w-96" v-if="cartItems.length > 0">
          <!-- Order Summary -->
          <div class="bg-white border rounded-lg p-6 sticky top-6">
            <h3 class="font-bold text-lg text-gray-800 mb-4">📋 Tóm tắt đơn hàng</h3>

            <div class="space-y-3 mb-4">
              <div class="flex justify-between">
                <span class="text-gray-600">Tạm tính ({{ totalQuantity }} món):</span>
                <span class="font-medium">{{ formatCurrency(subtotal) }}đ</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">🚚 Phí vận chuyển:</span>
                <span class="font-medium" :class="shippingFee === 0 ? 'text-green-600' : ''">
                  {{ shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee) + 'đ' }}
                </span>
              </div>

              <div v-if="subtotal < 300000 && subtotal > 0" class="text-xs text-orange-600 bg-orange-50 p-3 rounded">
                🎁 Thêm {{ formatCurrency(300000 - subtotal) }}đ để được <strong>miễn phí vận chuyển</strong>
              </div>
            </div>

            <hr class="my-4" />

            <div class="flex justify-between text-xl font-bold mb-6">
              <span>💳 Tổng cộng:</span>
              <span class="text-orange-600">{{ formatCurrency(total) }}đ</span>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-3">
              <button
                @click="proceedToCheckout"
                class="w-full bg-red-600 text-white py-4 rounded-lg font-bold hover:bg-red-700 transition-colors text-lg"
              >
                🛒 THANH TOÁN NGAY
              </button>

              <button
                @click="continueShopping"
                class="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:border-gray-400 transition-colors"
              >
                🛍️ TIẾP TỤC MUA SẮM
              </button>
            </div>

            <!-- Security Badge -->
            <!-- <div class="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <span>🔒</span>
              <span>Thanh toán bảo mật SSL</span>
            </div> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tooltip {
  position: relative;
}

.tooltip:hover::after {
  content: attr(title);
  position: absolute;
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Animation for items */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cart-item {
  animation: slideIn 0.3s ease-out;
}

.cart-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Fixed width for action buttons */
.cart-item button {
  flex-shrink: 0;
}

/* Quantity input styling */
.cart-item input[type="number"]::-webkit-outer-spin-button,
.cart-item input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.cart-item input[type="number"] {
  -moz-appearance: textfield;
}

/* Better text wrapping */
.break-all {
  word-break: break-all;
}

/* Grid layout for desktop - 13 columns */
.grid-cols-13 {
  grid-template-columns: repeat(13, 1fr);
}
</style>
