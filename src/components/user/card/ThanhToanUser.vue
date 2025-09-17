

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

  /* Custom scrollbar */
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

  /* Loading animation */
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  /* Additional CSS classes for better styling */
  .max-w-7xl { max-width: 80rem; }
  .mx-auto { margin-left: auto; margin-right: auto; }
  .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
  .font-bold { font-weight: 700; }
  .text-gray-800 { color: #1f2937; }
  .mb-8 { margin-bottom: 2rem; }
  .grid { display: grid; }
  .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  .gap-8 { gap: 2rem; }
  .bg-white { background-color: #ffffff; }
  .rounded-lg { border-radius: 0.5rem; }
  .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
  .p-6 { padding: 1.5rem; }
  .mb-6 { margin-bottom: 1.5rem; }
  .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
  .font-semibold { font-weight: 600; }
  .mb-4 { margin-bottom: 1rem; }
  .flex { display: flex; }
  .items-center { align-items: center; }
  .text-2xl { font-size: 1.5rem; line-height: 2rem; }
  .mr-2 { margin-right: 0.5rem; }
  .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }
  .block { display: block; }
  .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
  .font-medium { font-weight: 500; }
  .text-gray-700 { color: #374151; }
  .mb-2 { margin-bottom: 0.5rem; }
  .text-red-500 { color: #ef4444; }
  .w-full { width: 100%; }
  .px-4 { padding-left: 1rem; padding-right: 1rem; }
  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  .border { border-width: 1px; }
  .border-orange-300 { border-color: #fed7aa; }
  .focus\:ring-2:focus { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); }
  .focus\:ring-orange-500:focus { box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.5); }
  .focus\:border-orange-500:focus { border-color: #f97316; }
  .focus\:outline-none:focus { outline: none; }

  /* Responsive design */
  @media (min-width: 768px) {
    .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (min-width: 1024px) {
    .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .lg\:col-span-2 { grid-column: span 2 / span 2; }
    .lg\:col-span-1 { grid-column: span 1 / span 1; }
  }

  /* Custom styles for the new address system */
  .border-t { border-top-width: 1px; }
  .pt-4 { padding-top: 1rem; }
  .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
  .justify-between { justify-content: space-between; }
  .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
  .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
  .bg-orange-50 { background-color: #fff7ed; }
  .border-orange-200 { border-color: #fed7aa; }
  .text-green-800 { color: #166534; }
  .bg-green-100 { background-color: #dcfce7; }
  .text-xs { font-size: 0.75rem; line-height: 1rem; }
  .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
  .py-0\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
  .rounded-full { border-radius: 9999px; }
  .ml-2 { margin-left: 0.5rem; }
  .text-gray-600 { color: #4b5563; }
  .mt-1 { margin-top: 0.25rem; }
  .flex-1 { flex: 1 1 0%; }
  .gap-2 { gap: 0.5rem; }
  .ml-3 { margin-left: 0.75rem; }
  .text-blue-600 { color: #2563eb; }
  .hover\:text-blue-800:hover { color: #1e40af; }
  .hover\:text-red-800:hover { color: #991b1b; }
  .text-center { text-align: center; }
  .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
  .bg-gray-50 { background-color: #f9fafb; }
  .text-gray-400 { color: #9ca3af; }
  .mb-3 { margin-bottom: 0.75rem; }
  .py-2\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
  .border-dashed { border-style: dashed; }
  .border-orange-400 { border-color: #fb923c; }
  .text-orange-600 { color: #ea580c; }
  .hover\:bg-orange-50:hover { background-color: #fff7ed; }
  .transition { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
  .justify-center { justify-content: center; }
  .gap-2 { gap: 0.5rem; }
  </style><template>
    <!-- Notification -->
    <Transition name="slide-fade">
      <div v-if="notification.show"
           :class="[
             'fixed top-20 right-6 z-50 p-4 rounded-lg shadow-lg max-w-sm',
             notification.type === 'success' ? 'bg-green-500 text-white' :
             notification.type === 'warning' ? 'bg-yellow-500 text-white' :
             notification.type === 'info' ? 'bg-blue-500 text-white' :
             'bg-red-500 text-white'
           ]">
        <h4 class="font-bold">{{ notification.title }}</h4>
        <p class="text-sm">{{ notification.message }}</p>
      </div>
    </Transition>

    <!-- Loading State -->
    <div v-if="isLoadingCart" class="max-w-7xl mx-auto text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
      <p class="text-gray-600">Đang tải thông tin thanh toán...</p>
    </div>

    <div v-else class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-800 mb-8">💳 Thanh toán</h1>

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
                    EMAIL <span class="text-red-500">*</span>
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
                    placeholder="Số điện thoại (10 số)"
                  />
                </div>
              </div>

              <!-- Address Selection Section -->
              <div class="border-t pt-4">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-medium text-gray-800">📍 Địa chỉ giao hàng</h3>
                </div>

                <!-- Compact Address Selection -->
                <div class="space-y-4">
                  <!-- Dropdown Select for Saved Addresses -->
                  <div v-if="savedAddresses.length > 0">
                    <select
                      v-model="selectedAddressId"
                      @change="onAddressSelect"
                      class="w-full px-4 py-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none bg-white"
                    >
                      <option value="" disabled>-- Chọn địa chỉ giao hàng --</option>
                      <option
                        v-for="address in savedAddresses"
                        :key="address.id"
                        :value="address.id"
                      >
                        {{ formatAddressOption(address) }}
                      </option>
                    </select>

                    <!-- Selected Address Display -->
                    <div v-if="selectedShippingAddress" class="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <p class="font-medium text-gray-800">
                            {{ selectedShippingAddress.tenNguoiNhan || shippingInfo.fullName }} - {{ selectedShippingAddress.sdt || shippingInfo.phone }}
                            <span v-if="selectedShippingAddress.isDefault" class="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Mặc định</span>
                          </p>
                          <p class="text-sm text-gray-600 mt-1">
                            {{ selectedShippingAddress.diaChiChiTiet }}, {{ selectedShippingAddress.tenPhuong }}, {{ selectedShippingAddress.tenTinh }}
                          </p>
                        </div>
                        <div class="flex gap-2 ml-3">
                          <button
                            @click="editAddress(selectedShippingAddress)"
                            class="text-blue-600 hover:text-blue-800"
                            title="Sửa"
                          >
                            <i class="pi pi-pencil text-sm"></i>
                          </button>
                          <button
                            v-if="!selectedShippingAddress.isDefault && savedAddresses.length > 1"
                            @click="deleteAddress(selectedShippingAddress.id)"
                            class="text-red-600 hover:text-red-800"
                            title="Xóa"
                          >
                            <i class="pi pi-trash text-sm"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- No Address Message -->
                  <div v-else class="text-center py-6 bg-gray-50 rounded-lg">
                    <i class="pi pi-map-marker text-gray-400 text-2xl mb-2"></i>
                    <p class="text-gray-600 mb-3">Bạn chưa có địa chỉ giao hàng nào</p>
                  </div>

                  <!-- Add New Address Button -->
                  <button
                    @click="showAddAddressDialog = true"
                    class="w-full py-2.5 border border-dashed border-orange-400 rounded-lg text-orange-600 hover:bg-orange-50 transition flex items-center justify-center gap-2"
                  >
                    <i class="pi pi-plus text-sm"></i>
                    Thêm địa chỉ mới
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Ghi chú giao hàng (tùy chọn)</label>
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
                  <p class="font-medium">💰 Thanh toán khi nhận hàng (COD)</p>
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
                  <p class="font-medium">🏦 Chuyển khoản ngân hàng</p>
                  <p class="text-sm text-gray-600">Chuyển khoản qua tài khoản ngân hàng</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Right Column - Order Summary -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 class="text-xl font-semibold mb-4">📋 TÓM TẮT ĐƠN HÀNG</h2>

            <!-- Cart Items Summary -->
            <div class="space-y-3 mb-4 max-h-64 overflow-y-auto">
              <div v-for="item in cartItems" :key="item.cartDetailId || item.productDetailId" class="flex gap-3 pb-3 border-b last:border-0">
                <img
                  :src="item.image || '/placeholder-shoe.png'"
                  :alt="item.name"
                  class="w-16 h-16 object-cover rounded"
                  @error="handleImageError"
                />
                <div class="flex-1">
                  <h4 class="text-sm font-medium line-clamp-1">{{ item.name }}</h4>
                  <p class="text-xs text-gray-500">
                    {{ item.code }} | Size: {{ item.size }}
                    <span v-if="item.color"> | {{ item.color.name || item.color }}</span>
                  </p>
                  <div class="flex justify-between items-center mt-1">
                    <span class="text-xs text-gray-600">SL: {{ item.quantity }}</span>
                    <span class="text-sm font-medium text-orange-600">{{ formatCurrency(item.totalPrice) }}đ</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Discount Code -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-gray-700">🎟️ MÃ GIẢM GIÁ</label>
                <button
                  @click="toggleVoucherSelection"
                  class="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  {{ showVoucherSelection ? 'Ẩn danh sách' : 'Chọn từ danh sách' }}
                </button>
              </div>

              <!-- Voucher Selection Dropdown -->
              <div v-if="showVoucherSelection" class="mb-3 p-4 bg-gray-50 rounded-lg border">
                <div v-if="isLoadingVouchers" class="text-center py-4">
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
                  <p class="text-sm text-gray-600">Đang tải voucher...</p>
                </div>

                <div v-else-if="availableVouchers.length === 0" class="text-center py-4">
                  <i class="pi pi-gift text-gray-400 text-2xl mb-2"></i>
                  <p class="text-sm text-gray-600">Không có voucher khả dụng</p>
                </div>

                <div v-else class="space-y-2 max-h-48 overflow-y-auto">
                  <div
                    v-for="voucher in availableVouchers"
                    :key="voucher.id"
                    @click="selectVoucher(voucher)"
                    class="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-white transition group"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-sm font-semibold text-orange-600">{{ voucher.maVoucher }}</span>
                          <span v-if="voucher.loaiGiamGia === 'PHAN_TRAM'" class="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                            -{{ voucher.giaTriGiam }}%
                          </span>
                          <span v-else class="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">
                            -{{ formatCurrency(voucher.giaTriGiam) }}đ
                          </span>
                        </div>
                        <p class="text-xs text-gray-700 font-medium">{{ voucher.tenVoucher }}</p>
                        <div class="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>Tối thiểu: {{ formatCurrency(voucher.giaTriGiamToiThieu) }}đ</span>
                          <span v-if="voucher.giaTriGiamToiDa">Tối đa: {{ formatCurrency(voucher.giaTriGiamToiDa) }}đ</span>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text font-bold text-green-600">
                          -{{ formatCurrency(calculateVoucherValue(voucher)) }}đ
                        </div>
                        <div class="text-xs text-gray-500">cho đơn này</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Manual Input -->
              <div class="flex gap-2">
                <input
                  v-model="discountCode"
                  type="text"
                  class="flex-1 px-3 py-2 border border-orange-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-sm"
                  placeholder="Nhập mã giảm giá"
                  @keypress.enter="applyDiscountCode"
                  :disabled="isValidatingVoucher"
                />
                <button
                  @click="applyDiscountCode"
                  :disabled="isValidatingVoucher || !discountCode.trim()"
                  class="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="isValidatingVoucher">⏳</span>
                  <span v-else>SỬ DỤNG</span>
                </button>
              </div>

              <!-- Applied Voucher Display -->
              <div v-if="discount.voucher" class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <p class="text-sm font-medium text-green-800">✅ {{ discount.voucher.tenVoucher }}</p>
                    <p class="text-xs text-green-600">
                      Mã: {{ discount.code.toUpperCase() }} •
                      Giảm: {{ formatCurrency(discount.value) }}đ
                      <span v-if="discount.voucher.loaiGiamGia === 'PHAN_TRAM'">
                        ({{ discount.voucher.giaTriGiam }}%)
                      </span>
                    </p>
                  </div>
                  <button
                    @click="removeDiscount"
                    class="text-green-600 hover:text-green-800 ml-2"
                    title="Hủy mã giảm giá"
                  >
                    <i class="pi pi-times text-sm"></i>
                  </button>
                </div>
              </div>

              <p class="text-xs text-gray-500 mt-1">💡 Chọn từ danh sách hoặc nhập mã giảm giá</p>
            </div>

            <!-- Order Total -->
            <div class="space-y-2 pt-4 border-t">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Tạm tính:</span>
                <span>{{ formatCurrency(subtotal) }}đ</span>
              </div>
              <div v-if="discount.value > 0" class="flex justify-between text-sm text-green-600">
                <span>
                  🎁 {{ discount.voucher?.tenVoucher || 'Giảm giá' }}
                  <span v-if="discount.code" class="text-xs">({{ discount.code.toUpperCase() }})</span>:
                </span>
                <span>-{{ formatCurrency(discount.value) }}đ</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">🚚 Phí vận chuyển:</span>
                <span :class="shippingFee === 0 ? 'text-green-600' : ''">
                  {{ shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee) + 'đ' }}
                </span>
              </div>
              <div v-if="subtotal < 300000 && subtotal > 0" class="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                🎁 Thêm {{ formatCurrency(300000 - subtotal) }}đ để được <strong>miễn phí ship</strong>
              </div>
              <div class="flex justify-between text-lg font-bold pt-2 border-t">
                <span>💰 THÀNH TIỀN:</span>
                <span class="text-orange-600">{{ formatCurrency(total) }}đ</span>
              </div>
            </div>

            <!-- Selected Address Display -->
            <div v-if="selectedShippingAddress" class="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 class="text-sm font-medium text-blue-800 mb-2">📍 Giao đến:</h4>
              <p class="text-sm text-blue-700">{{ selectedShippingAddress.tenNguoiNhan || shippingInfo.fullName }} - {{ selectedShippingAddress.sdt || shippingInfo.phone }}</p>
              <p class="text-xs text-blue-600">{{ formatFullAddress(selectedShippingAddress) }}</p>
            </div>

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
                :disabled="isLoading || cartItems.length === 0 || !selectedShippingAddress"
                class="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span v-if="isLoading">⏳</span>
                <span v-else>🛒</span>
                {{ isLoading ? 'ĐANG XỬ LÝ...' : 'HOÀN TẤT ĐƠN HÀNG' }}
              </button>
            </div>

            <!-- Security Badge -->
            <div class="mt-4 text-center">
              <p class="text-xs text-gray-500 flex items-center justify-center gap-1">
                🔒 Thông tin của bạn được bảo mật
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Address Dialog -->
    <div v-if="showAddAddressDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold">📍 {{ editingAddress ? 'Chỉnh sửa' : 'Thêm' }} địa chỉ</h3>
            <button
              @click="closeAddressDialog"
              class="p-2 hover:bg-gray-100 rounded-full"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Tên người nhận <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="newAddress.tenNguoiNhan"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="newAddress.sdt"
                  type="tel"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ cụ thể <span class="text-red-500">*</span>
              </label>
              <input
                v-model="newAddress.diaChiChiTiet"
                type="text"
                placeholder="Số nhà, tên đường..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <!-- Simplified Address Selection: Only Province and Ward -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Tỉnh/Thành phố <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="newAddress.maTinh"
                  @change="onNewProvinceChange"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  <option v-for="province in provinces" :key="province.code" :value="province.code">
                    {{ province.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Phường/Xã <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="newAddress.maPhuong"
                  @change="onNewWardChange"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                  :disabled="!newAddress.maTinh"
                >
                  <option value="">Chọn phường/xã</option>
                  <option v-for="ward in newWards" :key="ward.code" :value="ward.code">
                    {{ ward.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <input
                v-model="newAddress.isDefault"
                type="checkbox"
                class="text-orange-500"
              />
              <label class="text-sm text-gray-700">Đặt làm địa chỉ mặc định</label>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button
              @click="closeAddressDialog"
              class="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Hủy
            </button>
            <button
              @click="saveNewAddress"
              :disabled="!isNewAddressValid || isSavingAddress"
              class="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
            >
              {{ isSavingAddress ? 'Đang lưu...' : (editingAddress ? 'Cập nhật' : 'Lưu địa chỉ') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>

  <script setup>
 import { ref, computed, onMounted, watch } from 'vue';
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
const isLoadingCart = ref(false);
const orderSuccess = ref(false);

// Shipping Information
const shippingInfo = ref({
  fullName: '',
  email: '',
  phone: '',
  note: ''
});

// Address Management
const savedAddresses = ref([]);
const selectedAddressId = ref(null);
const selectedShippingAddress = ref(null);
const showAddAddressDialog = ref(false);
const editingAddress = ref(false);

// New Address Form (Dialog) - Updated for new structure
const newAddress = ref({
  tenNguoiNhan: '',
  sdt: '',
  diaChiChiTiet: '',
  maTinh: '',      // Province code
  maPhuong: '',    // Ward code
  tenTinh: '',     // Province name
  tenPhuong: '',   // Ward name
  isDefault: false
});

const isSavingAddress = ref(false);

// Discount & Voucher
const discountCode = ref('');
const discount = ref({
  value: 0,
  code: '',
  voucher: null
});
const isValidatingVoucher = ref(false);
const paymentMethod = ref('cod');

// Available Vouchers
const availableVouchers = ref([]);
const isLoadingVouchers = ref(false);
const showVoucherSelection = ref(false);

// Location Data - Updated for API v2
const provinces = ref([]);
const newWards = ref([]);

// Auth helpers
const getAuthToken = () => localStorage.getItem('auth_token');
const getUserId = () => {
  const userInfo = localStorage.getItem('user_info');
  return userInfo ? JSON.parse(userInfo).id : null;
};

// Toggle voucher selection
const toggleVoucherSelection = () => {
  showVoucherSelection.value = !showVoucherSelection.value;
  if (showVoucherSelection.value && availableVouchers.value.length === 0) {
    loadAvailableVouchers();
  }
};

// Load available vouchers from backend
const loadAvailableVouchers = async () => {
  isLoadingVouchers.value = true;
  try {
    console.log('Loading available vouchers...');

    const response = await axios.get(`${API_BASE_URL}/voucher`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('All vouchers loaded:', response.data);

    let vouchers = response.data || [];

    // Filter voucher khả dụng ở client-side
    const currentDate = new Date();
    vouchers = vouchers.filter(voucher => {
      if (voucher.trangThai !== 1) return false;
      const endDate = new Date(voucher.ngayKetThuc);
      if (endDate < currentDate) return false;
      const startDate = new Date(voucher.ngayBatDau);
      if (startDate > currentDate) return false;
      if (voucher.soLuong <= 0) return false;
      if (voucher.giaTriGiamToiThieu > subtotal.value) return false;
      return true;
    });

    vouchers = vouchers.sort((a, b) => {
      const valueA = calculateVoucherValueForSort(a);
      const valueB = calculateVoucherValueForSort(b);
      return valueB - valueA;
    });

    availableVouchers.value = vouchers;
    console.log('Available vouchers after filter:', vouchers);

  } catch (error) {
    console.error('Error loading vouchers:', error);
    availableVouchers.value = [];
  } finally {
    isLoadingVouchers.value = false;
  }
};

// Helper function để tính voucher value cho sorting
const calculateVoucherValueForSort = (voucher) => {
  if (!voucher) return 0;

  let discountValue = 0;
  if (voucher.loaiGiamGia === 'PHAN_TRAM') {
    discountValue = (subtotal.value * voucher.giaTriGiam) / 100;
    if (voucher.giaTriGiamToiDa && discountValue > voucher.giaTriGiamToiDa) {
      discountValue = voucher.giaTriGiamToiDa;
    }
  } else if (voucher.loaiGiamGia === 'SO_TIEN_CO_DINH') {
    discountValue = voucher.giaTriGiam;
  }

  return Math.floor(discountValue);
};

// Select voucher from dropdown
const selectVoucher = (voucher) => {
  if (!voucher) return;

  isValidatingVoucher.value = true;
  try {
    let discountValue = 0;
    if (voucher.loaiGiamGia === 'PHAN_TRAM') {
      discountValue = (subtotal.value * voucher.giaTriGiam) / 100;
      if (voucher.giaTriGiamToiDa && discountValue > voucher.giaTriGiamToiDa) {
        discountValue = voucher.giaTriGiamToiDa;
      }
    } else if (voucher.loaiGiamGia === 'SO_TIEN_CO_DINH') {
      discountValue = voucher.giaTriGiam;
    }

    discount.value = {
      value: Math.floor(discountValue),
      code: voucher.maVoucher,
      voucher: voucher
    };

    discountCode.value = voucher.maVoucher;
    showVoucherSelection.value = false;

    showNotification('success', 'Áp dụng mã thành công!',
      `Bạn đã được giảm ${formatCurrency(discountValue)}đ với mã "${voucher.tenVoucher}"`);

  } catch (error) {
    console.error('Error selecting voucher:', error);
    showNotification('error', 'Lỗi', 'Không thể áp dụng voucher');
  } finally {
    isValidatingVoucher.value = false;
  }
};

// Apply discount code
const applyDiscountCode = async () => {
  const code = discountCode.value.trim();
  if (!code) {
    showNotification('warning', 'Lỗi', 'Vui lòng nhập mã giảm giá');
    return;
  }

  isValidatingVoucher.value = true;
  try {
    console.log('Validating voucher:', code);

    if (availableVouchers.value.length === 0) {
      await loadAvailableVouchers();
    }

    const voucher = availableVouchers.value.find(v =>
      v.maVoucher.toLowerCase() === code.toLowerCase()
    );

    if (!voucher) {
      throw new Error('Mã voucher không tồn tại hoặc không khả dụng');
    }

    console.log('Voucher found:', voucher);

    let discountValue = 0;
    if (voucher.loaiGiamGia === 'PHAN_TRAM') {
      discountValue = (subtotal.value * voucher.giaTriGiam) / 100;
      if (voucher.giaTriGiamToiDa && discountValue > voucher.giaTriGiamToiDa) {
        discountValue = voucher.giaTriGiamToiDa;
      }
    } else if (voucher.loaiGiamGia === 'SO_TIEN_CO_DINH') {
      discountValue = voucher.giaTriGiam;
    }

    discount.value = {
      value: Math.floor(discountValue),
      code: code,
      voucher: voucher
    };

    showNotification('success', 'Áp dụng mã thành công!',
      `Bạn đã được giảm ${formatCurrency(discountValue)}đ với mã "${voucher.tenVoucher}"`);

  } catch (error) {
    console.error('Voucher validation error:', error);

    let errorMessage = 'Mã giảm giá không hợp lệ';
    if (error.message) {
      errorMessage = error.message;
    }

    discount.value = { value: 0, code: '', voucher: null };
    showNotification('error', 'Mã không hợp lệ', errorMessage);
  } finally {
    isValidatingVoucher.value = false;
  }
};

// Remove discount
const removeDiscount = () => {
  discount.value = { value: 0, code: '', voucher: null };
  discountCode.value = '';
  showNotification('info', 'Đã hủy', 'Đã hủy mã giảm giá');
};

// Calculate voucher value for current order
const calculateVoucherValue = (voucher) => {
  if (!voucher) return 0;

  let discountValue = 0;
  if (voucher.loaiGiamGia === 'PHAN_TRAM') {
    discountValue = (subtotal.value * voucher.giaTriGiam) / 100;
    if (voucher.giaTriGiamToiDa && discountValue > voucher.giaTriGiamToiDa) {
      discountValue = voucher.giaTriGiamToiDa;
    }
  } else if (voucher.loaiGiamGia === 'SO_TIEN_CO_DINH') {
    discountValue = voucher.giaTriGiam;
  }

  return Math.floor(discountValue);
};

// Load provinces từ API v2
const loadAddressData = async () => {
  console.log('Loading provinces from API v2 (after merge 07/2025)...');
  try {
    const response = await fetch("https://provinces.open-api.vn/api/v2/");
    const provincesData = await response.json();

    console.log('Loaded provinces data v2:', provincesData);

    provinces.value = provincesData.map(province => ({
      code: province.code.toString(),
      name: province.name,
      codename: province.codename,
      division_type: province.division_type,
      phone_code: province.phone_code
    }));

    console.log(`Successfully loaded ${provinces.value.length} provinces`);

  } catch (error) {
    console.error('Error loading provinces from v2 API:', error);

    // Fallback data theo cấu trúc v2
    provinces.value = [
      { code: "1", name: "Thành phố Hà Nội", codename: "ha_noi", division_type: "thành phố trung ương", phone_code: 24 },
      { code: "79", name: "Thành phố Hồ Chí Minh", codename: "ho_chi_minh", division_type: "thành phố trung ương", phone_code: 28 },
      { code: "48", name: "Thành phố Đà Nẵng", codename: "da_nang", division_type: "thành phố trung ương", phone_code: 236 },
      { code: "92", name: "Thành phố Cần Thơ", codename: "can_tho", division_type: "thành phố trung ương", phone_code: 292 },
      { code: "2", name: "Tỉnh Hà Giang", codename: "ha_giang", division_type: "tỉnh", phone_code: 219 },
      { code: "4", name: "Tỉnh Cao Bằng", codename: "cao_bang", division_type: "tỉnh", phone_code: 206 },
      { code: "6", name: "Tỉnh Bắc Kạn", codename: "bac_kan", division_type: "tỉnh", phone_code: 209 },
      { code: "8", name: "Tỉnh Tuyên Quang", codename: "tuyen_quang", division_type: "tỉnh", phone_code: 207 },
      { code: "10", name: "Tỉnh Lào Cai", codename: "lao_cai", division_type: "tỉnh", phone_code: 214 }
    ];

    showNotification('warning', 'Sử dụng dữ liệu offline', 'API v2 không khả dụng');
  }
};

// Load wards từ API v2 với code mapping
const loadNewWards = async (provinceCode) => {
  newWards.value = [];
  if (!provinceCode) return;

  try {
    console.log(`Loading wards for province ${provinceCode} from API v2...`);

    // Convert province code nếu cần (01 -> 1)
    let apiProvinceCode = provinceCode;
    if (provinceCode.startsWith('0') && provinceCode.length === 2) {
      apiProvinceCode = parseInt(provinceCode).toString();
    }

    const response = await fetch(`https://provinces.open-api.vn/api/v2/p/${apiProvinceCode}?depth=2`);
    const provinceData = await response.json();

    console.log(`Province data v2 for ${provinceCode} (API: ${apiProvinceCode}):`, provinceData);

    let allWards = [];

    if (provinceData.districts && Array.isArray(provinceData.districts)) {
      // Có districts (cấu trúc cũ)
      provinceData.districts.forEach(district => {
        if (district.wards && Array.isArray(district.wards)) {
          district.wards.forEach(ward => {
            // Thêm cả version với leading zero và không leading zero
            allWards.push({
              code: ward.code.toString(),
              name: ward.name,
              codename: ward.codename || '',
              division_type: ward.division_type || 'phường',
              district_code: district.code.toString(),
              district_name: district.name
            });

            // Thêm version với leading zero nếu chưa có
            const paddedCode = ward.code.toString().padStart(5, '0');
            if (paddedCode !== ward.code.toString()) {
              allWards.push({
                code: paddedCode,
                name: ward.name,
                codename: ward.codename || '',
                division_type: ward.division_type || 'phường',
                district_code: district.code.toString(),
                district_name: district.name
              });
            }
          });
        }
      });
    } else if (provinceData.wards && Array.isArray(provinceData.wards)) {
      // Trực tiếp có wards (cấu trúc mới sau sáp nhập)
      provinceData.wards.forEach(ward => {
        allWards.push({
          code: ward.code.toString(),
          name: ward.name,
          codename: ward.codename || '',
          division_type: ward.division_type || 'phường'
        });

        // Thêm version với leading zero
        const paddedCode = ward.code.toString().padStart(5, '0');
        if (paddedCode !== ward.code.toString()) {
          allWards.push({
            code: paddedCode,
            name: ward.name,
            codename: ward.codename || '',
            division_type: ward.division_type || 'phường'
          });
        }
      });
    }

    // Remove duplicates và sort
    const uniqueWards = allWards.filter((ward, index, self) =>
      index === self.findIndex(w => w.code === ward.code)
    );

    uniqueWards.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    newWards.value = uniqueWards;
    console.log(`Successfully loaded ${newWards.value.length} wards for province ${provinceCode}`);

    // Debug: log một vài ward codes để check
    console.log('Sample ward codes:', newWards.value.slice(0, 5).map(w => `${w.code}: ${w.name}`));

  } catch (error) {
    console.warn(`API v2 failed for province ${provinceCode}:`, error.message);

    // Fallback với ward code 00010 cho Hà Nội
    const fallbackWards = {
      "1": [
        { code: "1", name: "Phường Ba Đình", codename: "ba_dinh", division_type: "phường" },
        { code: "00001", name: "Phường Ba Đình", codename: "ba_dinh", division_type: "phường" },
        { code: "00010", name: "Phường Cống Vị", codename: "cong_vi", division_type: "phường" }
      ],
      "01": [
        { code: "1", name: "Phường Ba Đình", codename: "ba_dinh", division_type: "phường" },
        { code: "00001", name: "Phường Ba Đình", codename: "ba_dinh", division_type: "phường" },
        { code: "00010", name: "Phường Cống Vị", codename: "cong_vi", division_type: "phường" }
      ]
    };

    newWards.value = fallbackWards[provinceCode] || [
      { code: `${provinceCode}001`, name: "Phường/Xã Trung tâm", codename: "trung_tam", division_type: "phường" }
    ];

    console.log(`Using fallback wards for province ${provinceCode}: ${newWards.value.length} wards`);
  }
};

// Load saved addresses
const loadSavedAddresses = async () => {
  try {
    let taiKhoanId = null;

    if (userInfo.value?.taiKhoan?.id) {
      taiKhoanId = userInfo.value.taiKhoan.id;
    } else if (userInfo.value?.idTaiKhoan) {
      taiKhoanId = userInfo.value.idTaiKhoan;
    } else if (userInfo.value?.id) {
      taiKhoanId = userInfo.value.id;
    } else {
      const savedUser = localStorage.getItem('user_info');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        taiKhoanId = user.taiKhoanId || user.id;
      }
    }

    if (!taiKhoanId) {
      console.error('Cannot find taiKhoanId');
      savedAddresses.value = [];
      return;
    }

    console.log('Loading saved addresses for taiKhoanId:', taiKhoanId);

    const response = await axios.get(`${API_BASE_URL}/api/dia-chi/tai-khoan/${taiKhoanId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Raw address data:', response.data);

    if (!response.data || !Array.isArray(response.data)) {
      console.warn('⚠️ API không trả về mảng địa chỉ:', response.data);
      savedAddresses.value = [];
      return;
    }

    console.log('📊 Raw addresses count:', response.data.length);

    // Process addresses - CHỈ hiển thị địa chỉ active (trangThai = 1)
    const processedAddresses = response.data
      .filter(addr => {
        console.log('🔍 Filtering address:', {
          id: addr.id,
          trangThai: addr.trangThai,
          isDefault: addr.isDefault,
          diaChiChiTiet: addr.diaChiChiTiet
        });
        // Chỉ lấy địa chỉ có ID và trạng thái active
        return addr && addr.id && addr.trangThai === 1;
      })
      .map(addr => ({
  id: addr.id,
  // FIX: Lấy từ userInfo thay vì addr
  tenNguoiNhan: userInfo.value?.hoTen || shippingInfo.value.fullName || 'Khách hàng',
  sdt: userInfo.value?.sdt || shippingInfo.value.phone || '',
  diaChiChiTiet: addr.diaChiChiTiet || '',
  maTinh: addr.maTinh || '',
  maPhuong: addr.maPhuong || '',
  tenTinh: addr.tenTinh || '',
  tenPhuong: addr.tenPhuong || '',
  trangThai: addr.trangThai,
  isDefault: Boolean(addr.isDefault)
}))
      .sort((a, b) => {
        // Sort: isDefault trước, sau đó theo ID mới nhất
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return b.id - a.id;
      });

    savedAddresses.value = processedAddresses;
    console.log('📍 Processed addresses count:', savedAddresses.value.length);
    console.log('📍 Processed addresses:', savedAddresses.value);

    // Auto select default address
    if (savedAddresses.value.length > 0) {
      const defaultAddress = savedAddresses.value.find(addr => addr.isDefault);
      if (defaultAddress) {
        selectSavedAddress(defaultAddress);
      } else {
        selectSavedAddress(savedAddresses.value[0]);
      }
    }

  } catch (error) {
    console.error('Error loading saved addresses:', error);
    savedAddresses.value = [];

    if (error.response?.status === 401) {
      showNotification('error', 'Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại');
    } else if (error.response?.status === 404) {
      console.log('No saved addresses found');
    } else {
      showNotification('warning', 'Không tải được địa chỉ', 'Vui lòng thử tải lại trang');
    }
  }
};

// Select saved address
const selectSavedAddress = (address) => {
  selectedAddressId.value = address.id;
  selectedShippingAddress.value = address;
  console.log('Selected address:', address);
};

// Load thông tin khách hàng từ backend
const loadUserInfo = async () => {
  try {
    console.log('Loading customer info from backend...');

    const response = await axios.get(`${API_BASE_URL}/api/khach-hang/current`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    const customer = response.data.data || response.data;
    userInfo.value = customer;

    console.log('Customer info loaded:', customer);

    // Pre-fill form với thông tin khách hàng
    shippingInfo.value.fullName = customer.hoTen || '';
    shippingInfo.value.phone = customer.sdt || '';

    // Lấy email từ nhiều nguồn
    if (customer.taiKhoan?.email) {
      shippingInfo.value.email = customer.taiKhoan.email;
    } else if (customer.email) {
      shippingInfo.value.email = customer.email;
    } else {
      const savedUser = localStorage.getItem('user_info');
      if (savedUser) {
        const localUser = JSON.parse(savedUser);
        shippingInfo.value.email = localUser.email || '';
      }
    }

    console.log('Final email:', shippingInfo.value.email);

    // Pre-fill new address form
    newAddress.value.tenNguoiNhan = shippingInfo.value.fullName;
    newAddress.value.sdt = shippingInfo.value.phone;

  } catch (error) {
    console.error('Error loading customer info:', error);
    if (error.response?.status === 401) {
      showNotification('error', 'Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại');
      setTimeout(() => router.push('/auth/login'), 2000);
    }
  }
};

// Load giỏ hàng từ backend
const loadCartFromBackend = async () => {
  if (isLoadingCart.value) return;

  try {
    isLoadingCart.value = true;
    console.log('Loading cart from backend...');

    const response = await axios.get(`${API_BASE_URL}/api/gio-hang/current`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Cart data received:', response.data);

    cartItems.value = response.data.map(item => ({
      cartDetailId: item.id,
      productDetailId: item.productDetailId,
      name: item.name,
      code: item.code,
      image: buildImageUrl(item.image),
      price: Number(item.price),
      quantity: Number(item.quantity),
      size: item.size,
      color: item.color,
      stock: item.stock,
      points: item.points || 0,
      totalPrice: Number(item.price) * Number(item.quantity)
    }));

    if (cartItems.value.length === 0) {
      showNotification('warning', 'Giỏ hàng trống', 'Vui lòng thêm sản phẩm trước khi thanh toán');
      setTimeout(() => router.push('/cart'), 2000);
    }

  } catch (error) {
    console.error('Error loading cart from backend:', error);
    if (error.response?.status === 401) {
      showNotification('error', 'Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại');
      setTimeout(() => router.push('/auth/login'), 2000);
    }
  } finally {
    isLoadingCart.value = false;
  }
};

// Build image URL
const buildImageUrl = (imagePath) => {
  if (!imagePath) return '/placeholder-shoe.png';
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// Province change handler đã được cập nhật ở trên

// Ward change handler
const onNewWardChange = () => {
  if (newAddress.value.maPhuong) {
    const ward = newWards.value.find(w => w.code === newAddress.value.maPhuong);
    newAddress.value.tenPhuong = ward?.name || '';
  }
};

// Save new address
const saveNewAddress = async () => {
  if (!isNewAddressValid.value) return;

  isSavingAddress.value = true;
  try {
    let taiKhoanId = null;
    if (userInfo.value?.taiKhoan?.id) {
      taiKhoanId = userInfo.value.taiKhoan.id;
    } else if (userInfo.value?.idTaiKhoan) {
      taiKhoanId = userInfo.value.idTaiKhoan;
    } else {
      const savedUser = localStorage.getItem('user_info');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        taiKhoanId = user.taiKhoanId || user.id;
      }
    }

    const addressData = {
      tenNguoiNhan: newAddress.value.tenNguoiNhan,
      sdt: newAddress.value.sdt,
      diaChiChiTiet: newAddress.value.diaChiChiTiet,
      maTinh: newAddress.value.maTinh,
      maPhuong: newAddress.value.maPhuong,
      tenTinh: newAddress.value.tenTinh,
      tenPhuong: newAddress.value.tenPhuong,
      trangThai: 1, // Luôn active khi tạo mới
      idTaiKhoan: taiKhoanId
    };

    let response;
    if (editingAddress.value && newAddress.value.id) {
      response = await axios.put(`${API_BASE_URL}/api/dia-chi/${newAddress.value.id}`, addressData, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      response = await axios.post(`${API_BASE_URL}/api/dia-chi`, addressData, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
    }

    if (response.data) {
      await loadSavedAddresses();

      const savedAddress = savedAddresses.value.find(addr => addr.id === response.data.data?.id);
      if (savedAddress) {
        selectSavedAddress(savedAddress);
      }

      showNotification('success', 'Thành công', editingAddress.value ? 'Đã cập nhật địa chỉ' : 'Đã lưu địa chỉ mới');
      closeAddressDialog();
    }

  } catch (error) {
    console.error('Error saving address:', error);
    showNotification('error', 'Lỗi', 'Không thể lưu địa chỉ');
  } finally {
    isSavingAddress.value = false;
  }
};

// Close address dialog
const closeAddressDialog = () => {
  showAddAddressDialog.value = false;
  editingAddress.value = false;
  newAddress.value = {
    tenNguoiNhan: shippingInfo.value.fullName,
    sdt: shippingInfo.value.phone,
    diaChiChiTiet: '',
    maTinh: '',
    maPhuong: '',
    tenTinh: '',
    tenPhuong: '',
    isDefault: false
  };
  newWards.value = [];
};

// Delete address
const deleteAddress = async (addressId) => {
  if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;

  try {
    await axios.delete(`${API_BASE_URL}/api/dia-chi/${addressId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    await loadSavedAddresses();
    if (selectedAddressId.value === addressId) {
      selectedAddressId.value = null;
      selectedShippingAddress.value = null;
    }

    showNotification('success', 'Thành công', 'Đã xóa địa chỉ');
  } catch (error) {
    console.error('Error deleting address:', error);
    showNotification('error', 'Lỗi', 'Không thể xóa địa chỉ');
  }
};

// Edit address - Fixed version
const editAddress = async (address) => {
  console.log('🔧 Editing address:', address);

  editingAddress.value = true;

  // Reset trước khi set data mới
  newWards.value = [];

  // Set address data
  newAddress.value = {
    id: address.id,
    tenNguoiNhan: address.tenNguoiNhan,
    sdt: address.sdt,
    diaChiChiTiet: address.diaChiChiTiet,
    maTinh: address.maTinh,
    maPhuong: '', // Reset ward trước
    tenTinh: address.tenTinh,
    tenPhuong: address.tenPhuong,
    isDefault: address.trangThai === 1
  };

  console.log('📋 Set newAddress (before ward):', newAddress.value);

  // Show dialog trước
  showAddAddressDialog.value = true;

  // Đợi DOM render xong rồi mới set province và load wards
  await nextTick();

  if (address.maTinh) {
    console.log('🌍 Loading wards for province:', address.maTinh);
    await loadNewWards(address.maTinh);

    // Đợi một chút để wards load xong, rồi set ward
    setTimeout(() => {
      newAddress.value.maPhuong = address.maPhuong;
      console.log('✅ Ward selected after delay:', address.maPhuong);

      // Force reactivity update
      newAddress.value = { ...newAddress.value };
    }, 200);
  }
};

// Improved province change handler cho edit
const onNewProvinceChange = async () => {
  console.log('🌍 Province changed to:', newAddress.value.maTinh);

  // Reset ward selection
  newAddress.value.maPhuong = '';
  newWards.value = [];

  if (newAddress.value.maTinh) {
    // Update province name
    const province = provinces.value.find(p => p.code === newAddress.value.maTinh);
    newAddress.value.tenTinh = province?.name || '';

    // Load wards
    await loadNewWards(newAddress.value.maTinh);
  }
};

// Submit order - Updated version with stock reduction
const submitOrder = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  try {
    const maHoaDon = `HD${Date.now()}`;

    const orderData = {
      khachHangId: userInfo.value.id,
      tenNguoiDung: selectedShippingAddress.value.tenNguoiNhan,
      email: shippingInfo.value.email,
      sdt: selectedShippingAddress.value.sdt,
      diaChi: formatFullAddress(selectedShippingAddress.value),

      maHoaDon: maHoaDon,
      ghiChu: shippingInfo.value.note || '',
      phuongThucThanhToan: paymentMethod.value === 'cod' ? 'COD' : 'VNPAY',
      loaiHoaDon: 'ONLINE',
      trangThaiHoaDon: 'CHO_XAC_NHAN',

      tongTien: subtotal.value,
      phiVanChuyen: shippingFee.value,
      tongThanhToan: total.value,
      diemSuDung: 0,
      giaTriDiem: discount.value.value,

      voucherId: discount.value.voucher?.id || null,
      maVoucher: discount.value.code || null,

      ngayTao: new Date().toISOString(),
      ngayXacNhan: null,
      ngayHoanThanh: null,
      ngayGiaoHang: null,
      ngayNhanHang: null,
      thoiGianVanChuyen: null,

      chiTietSanPham: cartItems.value.map(item => ({
        idChiTietSanPham: item.productDetailId,
        soLuong: item.quantity,
        giaBan: item.price
      }))
    };

    const successPageData = {
      customerName: selectedShippingAddress.value.tenNguoiNhan,
      customerEmail: shippingInfo.value.email,
      customerPhone: selectedShippingAddress.value.sdt,
      shippingAddress: formatFullAddress(selectedShippingAddress.value),
      paymentMethod: paymentMethod.value,
      orderNote: shippingInfo.value.note,

      totalItems: cartItems.value.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: subtotal.value,
      discount: discount.value.value || 0,
      shippingFee: shippingFee.value,
      total: total.value,

      cartItems: cartItems.value.map(item => ({
        name: item.name,
        code: item.code,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      }))
    };

    // Lưu dữ liệu vào session storage
    sessionStorage.setItem('order_success_data', JSON.stringify(successPageData));

    console.log('Sending order data:', orderData);

    // KIỂM TRA PHƯƠNG THỨC THANH TOÁN
    if (paymentMethod.value === 'bank_transfer') {
      // === THANH TOÁN VNPAY ===

      // Bước 1: Tạo đơn hàng trước
      const response = await axios.post(`${API_BASE_URL}/hoa-don/create`, orderData, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Order response:', response.data);

      if (response.data) {
        // *** THÊM CHỨC NĂNG TRỪ SỐ LƯỢNG NGAY SAU KHI TạO ĐƠN HÀNG ***
        try {
          await reduceProductStock();
          console.log('✅ Stock reduction completed for VNPay order');
        } catch (stockError) {
          console.error('❌ Stock reduction failed for VNPay:', stockError);
          // Có thể thông báo warning nhưng vẫn tiếp tục thanh toán
          showNotification('warning', 'Cảnh báo', 'Đơn hàng đã tạo nhưng có lỗi cập nhật tồn kho');
        }

        // Bước 2: Tạo URL thanh toán VNPay
        const vnpayRequest = {
          orderId: response.data.maHoaDon || maHoaDon,
          amount: total.value,
          orderInfo: `Thanh toan don hang ${response.data.maHoaDon || maHoaDon}`
        };

        console.log('Creating VNPay payment with:', vnpayRequest);

        const vnpayResponse = await axios.post(`${API_BASE_URL}/api/vnpay/create-payment`, vnpayRequest, {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('VNPay response:', vnpayResponse.data);

        if (vnpayResponse.data.success && vnpayResponse.data.paymentUrl) {
          // Bước 3: Thông báo và redirect đến VNPay
          showNotification('info', 'Đang chuyển đến VNPay...', 'Vui lòng đợi trong giây lát');

          // Delay 1.5 giây rồi chuyển sang trang VNPay
          setTimeout(() => {
            console.log('Redirecting to VNPay:', vnpayResponse.data.paymentUrl);
            window.location.href = vnpayResponse.data.paymentUrl;
          }, 1500);

          return;
        } else {
          throw new Error(vnpayResponse.data.message || 'Không thể tạo thanh toán VNPay');
        }
      } else {
        throw new Error('Không thể tạo đơn hàng');
      }

    } else {
      // === THANH TOÁN COD ===
      const response = await axios.post(`${API_BASE_URL}/hoa-don/create`, orderData, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Order response:', response.data);

      if (response.data) {
        // *** THÊM CHỨC NĂNG TRỪ SỐ LƯỢNG NGAY SAU KHI TạO ĐƠN HÀNG COD ***
        try {
          await reduceProductStock();
          console.log('✅ Stock reduction completed for COD order');
        } catch (stockError) {
          console.error('❌ Stock reduction failed for COD:', stockError);
          showNotification('warning', 'Cảnh báo', 'Đơn hàng đã tạo nhưng có lỗi cập nhật tồn kho');
        }

        orderSuccess.value = true;

        await clearCartAfterOrder();

        showNotification('success', 'Đặt hàng thành công!', `Mã hóa đơn: ${response.data.maHoaDon || maHoaDon}`);

        setTimeout(() => {
          const orderId = response.data.id || response.data.data?.id || response.data.maHoaDon || maHoaDon;
          router.push(`/order-success/${orderId}`);
        }, 2000);
      }
    }

  } catch (error) {
    console.error('Order creation error:', error);

    let errorMessage = 'Không thể tạo hóa đơn. Vui lòng thử lại!';

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    showNotification('error', 'Lỗi đặt hàng', errorMessage);
  } finally {
    isLoading.value = false;
  }
};

// *** HÀM MỚI: TRỪ SỐ LƯỢNG SẢN PHẨM ***
const reduceProductStock = async () => {
  console.log('🔄 Starting stock reduction process...');

  try {
    // Prepare stock reduction data
    const stockReductions = cartItems.value.map(item => ({
      productDetailId: item.productDetailId,
      quantity: item.quantity,
      productName: item.name,
      productCode: item.code,
      size: item.size,
      color: item.color?.name || item.color
    }));

    let allSuccess = true;
    let failedProducts = [];

    // Duyệt qua từng sản phẩm trong giỏ hàng và trừ tồn kho
    for (const item of cartItems.value) {
      try {
        console.log(`📦 Reducing stock for product ID: ${item.productDetailId}, quantity: ${item.quantity}`);

        // Lấy thông tin chi tiết sản phẩm hiện tại
        const currentProduct = await axios.get(`${API_BASE_URL}/api/san-pham-chi-tiet/${item.productDetailId}`, {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        });

        if (currentProduct.data) {
          const currentStock = currentProduct.data.soLuong || 0;
          const newStock = Math.max(0, currentStock - item.quantity);

          console.log(`   Current stock: ${currentStock}, Order quantity: ${item.quantity}, New stock: ${newStock}`);

          // Kiểm tra tồn kho đủ không
          if (currentStock < item.quantity) {
            console.warn(`⚠️ Not enough stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}`);
            failedProducts.push({
              name: item.name,
              code: item.code,
              availableStock: currentStock,
              requestedQuantity: item.quantity
            });
            allSuccess = false;
            continue;
          }

          // Cập nhật số lượng thông qua API update có sẵn
          const updateData = {
            soLuong: newStock
          };

          const updateResponse = await axios.put(`${API_BASE_URL}/api/san-pham-chi-tiet/update/${item.productDetailId}`, updateData, {
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`,
              'Content-Type': 'application/json'
            }
          });

          if (updateResponse.data) {
            console.log(`✅ Successfully reduced stock for ${item.name}: ${currentStock} -> ${newStock}`);
          } else {
            throw new Error(`Failed to update stock for product ${item.name}`);
          }
        }

      } catch (error) {
        console.error(`❌ Failed to reduce stock for product ${item.name}:`, error);
        failedProducts.push({
          name: item.name,
          code: item.code,
          error: error.message
        });
        allSuccess = false;
      }
    }

    // Thông báo kết quả
    if (failedProducts.length > 0) {
      console.warn('⚠️ Some stock reductions failed:', failedProducts);

      const failedProductNames = failedProducts.map(f => f.name).join(', ');
      showNotification('warning', 'Cập nhật tồn kho một phần',
        `Một số sản phẩm không cập nhật được: ${failedProductNames}`);
    }

    return {
      success: allSuccess,
      failures: failedProducts,
      message: allSuccess ? 'All stock reductions completed successfully' : 'Some stock reductions failed'
    };

  } catch (error) {
    console.error('❌ Stock reduction error:', error);

    // Log chi tiết lỗi
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
    }

    // Throw error để parent function xử lý
    throw new Error(`Stock reduction failed: ${error.message}`);
  }
};

// Hàm kiểm tra tồn kho đơn giản
const checkStockAvailability = (item) => {
  const currentStock = item.stock || 0;
  const requestedQty = item.quantity || 0;

  if (currentStock < requestedQty) {
    console.warn(`⚠️ Insufficient stock for ${item.name}: Available ${currentStock}, Requested ${requestedQty}`);
    return false;
  }

  return true;
};

// Clear cart after order
const clearCartAfterOrder = async () => {
  try {
    await axios.delete(`${API_BASE_URL}/api/gio-hang/clear`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    localStorage.removeItem('cart');
    window.dispatchEvent(new StorageEvent('storage', { key: 'cart', newValue: null }));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  } catch (error) {
    console.error('Error clearing cart:', error);
  }
};

// Computed properties
const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.totalPrice, 0);
});

const shippingFee = computed(() => {
  return subtotal.value >= 300000 ? 0 : 30000;
});

const total = computed(() => {
  return Math.max(0, subtotal.value - discount.value.value + shippingFee.value);
});

const isNewAddressValid = computed(() => {
  return newAddress.value.tenNguoiNhan &&
         newAddress.value.sdt &&
         newAddress.value.diaChiChiTiet &&
         newAddress.value.maTinh &&
         newAddress.value.maPhuong;
});

// Format address for select option
const formatAddressOption = (address) => {
  const name = address.tenNguoiNhan || shippingInfo.value.fullName;
  const phone = address.sdt || shippingInfo.value.phone;
  const shortAddress = `${address.diaChiChiTiet}, ${address.tenPhuong}`;
  const isDefault = address.isDefault ? ' (Mặc định)' : '';
  return `${name} - ${phone} - ${shortAddress}${isDefault}`;
};

// Handle address selection from dropdown
const onAddressSelect = () => {
  const address = savedAddresses.value.find(addr => addr.id === selectedAddressId.value);
  if (address) {
    selectSavedAddress(address);
  }
};

// Format full address (2 cấp)
const formatFullAddress = (address) => {
  if (!address) return '';
  return [
    address.diaChiChiTiet,
    address.tenPhuong,
    address.tenTinh
  ].filter(Boolean).join(', ');
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

const validateForm = () => {
  if (!shippingInfo.value.fullName) {
    showNotification('error', 'Lỗi', 'Vui lòng nhập họ tên');
    return false;
  }
  if (!shippingInfo.value.phone) {
    showNotification('error', 'Lỗi', 'Vui lòng nhập số điện thoại');
    return false;
  }
  if (!/^\d{10}$/.test(shippingInfo.value.phone)) {
    showNotification('error', 'Lỗi', 'Số điện thoại phải có 10 chữ số');
    return false;
  }
  if (!shippingInfo.value.email) {
    showNotification('error', 'Lỗi', 'Vui lòng nhập email');
    return false;
  }
  if (!selectedShippingAddress.value) {
    showNotification('error', 'Lỗi', 'Vui lòng chọn địa chỉ giao hàng');
    return false;
  }
  return true;
};

// Handle image error
const handleImageError = (event) => {
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTI4IDI4TDM2IDM2TDQwIDMyIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
};

// Go back to cart
const goBackToCart = () => {
  emit('go-back');
};

// Check auth
const checkAuth = () => {
  if (!getAuthToken()) {
    showNotification('error', 'Chưa đăng nhập', 'Vui lòng đăng nhập để thanh toán');
    setTimeout(() => router.push('/auth/login'), 2000);
    return false;
  }
  return true;
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

// Watch for ward selection to update name
watch(() => newAddress.value.maPhuong, (newWardId) => {
  if (newWardId) {
    const ward = newWards.value.find(w => w.code === newWardId);
    newAddress.value.tenPhuong = ward?.name || '';
    console.log('👁️ Ward watcher triggered:', newWardId, ward?.name);
  }
});

// Watch newAddress changes for debugging
watch(() => newAddress.value, (newVal) => {
  console.log('👁️ NewAddress changed:', {
    maTinh: newVal.maTinh,
    maPhuong: newVal.maPhuong,
    tenTinh: newVal.tenTinh,
    tenPhuong: newVal.tenPhuong
  });
}, { deep: true });

// Watch wards array changes
watch(() => newWards.value, (wards) => {
  console.log('👁️ Wards changed:', wards.length, 'wards loaded');
  if (wards.length > 0) {
    console.log('First few wards:', wards.slice(0, 3));
  }
});

// Watch subtotal changes to reload vouchers
watch(() => subtotal.value, (newSubtotal) => {
  if (newSubtotal > 0 && showVoucherSelection.value) {
    loadAvailableVouchers();
  }
});

// Initialize checkout with API v2
const initializeCheckout = async () => {
  console.log('Initializing checkout with API v2...');

  if (!checkAuth()) {
    console.error('Authentication failed');
    return;
  }

  try {
    console.log('Step 1: Loading user info...');
    await loadUserInfo();

    console.log('Step 2: Loading address data from API v2...');
    await loadAddressData();

    console.log('Step 3: Loading cart...');
    await loadCartFromBackend();

    console.log('Step 4: Loading saved addresses...');
    await loadSavedAddresses();

    if (subtotal.value > 0) {
      console.log('Step 5: Loading vouchers...');
      await loadAvailableVouchers();
    }

    console.log('Checkout initialization completed with API v2');

  } catch (error) {
    console.error('Checkout initialization failed:', error);
    showNotification('error', 'Lỗi khởi tạo', 'Không thể tải dữ liệu trang thanh toán');
  }
};

// Initialize
onMounted(() => {
    window.timer =null;
  console.log('Checkout component mounted - Using API v2');
  initializeCheckout();
});
  </script>
