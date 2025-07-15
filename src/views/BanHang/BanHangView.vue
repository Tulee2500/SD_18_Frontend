# Hệ thống POS - Bán hàng tại quầy ```vue
<template>
    <div class="pos-system">
        <!-- Toast Component -->
        <Toast />

        <!-- Header -->
        <div class="header-section mb-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="mb-2 text-2xl font-bold">Hệ thống POS - Bán hàng tại quầy</h2>
                    <p class="text-blue-100">Bán hàng nhanh chóng và tiện lợi</p>
                    <p v-if="currentEmployee" class="mt-1 text-sm text-blue-200">
                        Nhân viên: {{ currentEmployee.hoTen }} ({{ currentEmployee.maNhanVien }})
                        <span v-if="currentEmployee.isDemo" class="ml-1 rounded bg-yellow-500 px-1 text-xs text-white">DEMO</span>
                    </p>
                </div>
                <div class="flex gap-3">
                    <Button
                        @click="refreshAllData"
                        :icon="isLoading ? 'pi pi-spinner pi-spin' : 'pi pi-refresh'"
                        :label="isLoading ? 'Đang tải...' : 'Làm mới'"
                        :disabled="isLoading"
                        class="bg-white bg-opacity-20 text-white hover:bg-opacity-30"
                        outlined
                    />
                    <Button @click="exportData" icon="pi pi-download" label="Xuất dữ liệu" severity="success" />
                </div>
            </div>
        </div>

        <!-- Search and Filter -->
        <div class="search-section mb-6 rounded-lg bg-gray-50 p-4">
            <div class="flex flex-wrap items-center gap-4">
                <div class="relative min-w-64 flex-1">
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search"></i>
                        </InputIcon>
                        <InputText v-model="searchKeyword" placeholder="Tìm kiếm sản phẩm theo tên, mã hoặc QR..." @input="onSearch" @keydown.enter="handleEnterSearch" fluid />
                    </IconField>
                </div>

                <!-- QR Scanner Button -->
                <Button @click="showQRModal = true" icon="pi pi-qrcode" label="QR Scanner" severity="info" />

                <!-- Advanced Filter Toggle -->
                <Button @click="showAdvancedFilter = !showAdvancedFilter" icon="pi pi-filter" label="Lọc nâng cao" severity="secondary" />
            </div>

            <!-- Advanced Filters -->
            <div v-if="showAdvancedFilter" class="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                <h4 class="mb-3 font-semibold">Bộ lọc nâng cao</h4>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label class="mb-1 block text-sm font-medium">Khoảng giá</label>
                        <div class="flex gap-2">
                            <InputNumber v-model="minPrice" placeholder="Từ" mode="currency" currency="VND" locale="vi-VN" />
                            <InputNumber v-model="maxPrice" placeholder="Đến" mode="currency" currency="VND" locale="vi-VN" />
                        </div>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Tình trạng kho</label>
                        <Select v-model="stockFilter" :options="stockOptions" optionLabel="label" optionValue="value" placeholder="Tất cả" fluid />
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Thương hiệu</label>
                        <Select v-model="brandFilter" :options="brandOptions" optionLabel="label" optionValue="value" placeholder="Tất cả thương hiệu" fluid />
                    </div>
                </div>
                <div class="mt-4 flex gap-2">
                    <Button @click="applyAdvancedFilters" label="Áp dụng" />
                    <Button @click="clearAllFilters" label="Xóa bộ lọc" severity="secondary" />
                </div>
            </div>
        </div>

        <!-- Main Content Area -->
        <div class="flex gap-6">
            <!-- Left Panel - Product List -->
            <div class="flex-1">
                <!-- Loading State -->
                <div v-if="isLoading" class="py-12 text-center">
                    <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="8" />
                    <p class="mt-4 text-lg text-gray-600">Đang tải sản phẩm...</p>
                    <p class="mt-2 text-sm text-gray-500">{{ loadingMessage }}</p>
                </div>

                <!-- Error State -->
                <div v-else-if="hasError" class="py-12 text-center">
                    <i class="pi pi-exclamation-triangle mb-4 text-4xl text-red-500"></i>
                    <h3 class="mb-2 text-xl font-semibold text-red-600">Lỗi kết nối API</h3>
                    <p class="mb-4 text-gray-600">{{ errorMessage }}</p>
                    <Button @click="retryConnection" icon="pi pi-refresh" label="Thử lại" severity="danger" />
                </div>

                <!-- Product Grid -->
                <div v-else class="overflow-x-auto rounded-lg bg-white shadow-lg">
                    <div v-if="filteredProducts.length === 0" class="p-12 text-center">
                        <i class="pi pi-box mb-4 text-6xl text-gray-400"></i>
                        <h3 class="mb-2 text-xl font-semibold text-gray-600">Không tìm thấy sản phẩm</h3>
                        <p class="text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                    </div>

                    <div v-else class="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <div
                            v-for="product in paginatedProducts"
                            :key="product.id"
                            class="product-card transform cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-500 hover:shadow-lg"
                            @click="addToCart(product)"
                        >
                            <!-- Product Image -->
                            <div class="mb-3 overflow-hidden rounded-lg bg-gray-100">
                                <img v-if="product.hinhAnhs && product.hinhAnhs.length > 0" :src="getProductImageUrl(product.hinhAnhs[0].tenHinhAnh)" :alt="product.sanPham?.tenSanPham" class="h-32 w-full object-cover" @error="handleImageError" />
                                <div v-else class="flex h-32 items-center justify-center">
                                    <i class="pi pi-image text-4xl text-gray-400"></i>
                                </div>
                            </div>

                            <!-- Product Info -->
                            <div class="product-info">
                                <h6 class="mb-2 truncate font-semibold text-gray-800" :title="product.sanPham?.tenSanPham">
                                    {{ product.sanPham?.tenSanPham }}
                                </h6>
                                <p class="mb-2 text-sm text-gray-600">{{ product.sanPham?.thuongHieu?.tenThuongHieu || 'N/A' }}</p>

                                <!-- Product Attributes -->
                                <div class="mb-3 flex flex-wrap gap-1">
                                    <span v-if="product.mauSac" class="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700">
                                        {{ product.mauSac.tenMauSac }}
                                    </span>
                                    <span v-if="product.kichCo" class="rounded bg-blue-200 px-2 py-1 text-xs text-blue-700"> Size {{ product.kichCo.tenKichCo }} </span>
                                </div>

                                <!-- Product Code -->
                                <div class="mb-2 text-xs text-gray-500">Mã: {{ product.maChiTiet }}</div>

                                <!-- Price and Stock -->
                                <div class="flex items-center justify-between">
                                    <div class="flex flex-col">
                                        <span class="font-bold text-blue-600">{{ formatCurrency(parseFloat(product.giaBan || product.giaGoc || 0)) }}</span>
                                        <span v-if="product.giaBan && product.giaBan < product.giaGoc" class="text-xs text-gray-500 line-through">
                                            {{ formatCurrency(parseFloat(product.giaGoc)) }}
                                        </span>
                                    </div>
                                    <span :class="['text-sm', product.soLuong > 0 ? 'text-green-600' : 'text-red-600']"> SL: {{ product.soLuong }} </span>
                                </div>

                                <!-- Stock Status -->
                                <div class="mt-2">
                                    <Tag :value="product.soLuong > 0 ? 'Còn hàng' : 'Hết hàng'" :severity="product.soLuong > 0 ? 'success' : 'danger'" :icon="product.soLuong > 0 ? 'pi pi-check' : 'pi pi-times'" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Pagination -->
                    <div v-if="filteredProducts.length > itemsPerPage" class="border-t border-gray-200 p-4">
                        <Paginator
                            :rows="itemsPerPage"
                            :totalRecords="filteredProducts.length"
                            :rowsPerPageOptions="[12, 24, 36]"
                            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} sản phẩm"
                            @page="onPageChange"
                        />
                    </div>
                </div>
            </div>

            <!-- Right Panel - Cart -->
            <div class="w-96 rounded-lg bg-white shadow-lg">
                <div class="flex h-full flex-col">
                    <!-- Cart Header -->
                    <div class="border-b border-gray-200 p-4">
                        <div class="mb-4 flex items-center justify-between">
                            <h4 class="text-lg font-semibold text-gray-800">Giỏ hàng</h4>
                            <button class="rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50" @click="clearCart" :disabled="cartItems.length === 0">Xóa tất cả</button>
                        </div>

                        <div class="text-sm text-gray-600">
                            <span>{{ cartItems.length }} sản phẩm • </span>
                            <span class="font-semibold text-blue-600">{{ formatCurrency(totalAmount) }}</span>
                        </div>
                    </div>

                    <!-- Cart Items -->
                    <div class="flex-1 overflow-y-auto p-4">
                        <div v-if="cartItems.length === 0" class="flex flex-col items-center justify-center py-12">
                            <i class="pi pi-shopping-cart mb-4 text-6xl text-gray-400"></i>
                            <p class="text-center text-gray-500">
                                Giỏ hàng trống<br />
                                <span class="text-sm">Thêm sản phẩm để bắt đầu</span>
                            </p>
                        </div>
                        <div v-else class="space-y-3">
                            <div v-for="(item, index) in cartItems" :key="index" class="rounded-lg border border-gray-200 p-3">
                                <div class="mb-2 flex items-start justify-between">
                                    <div class="flex-1">
                                        <h6 class="text-sm font-medium">{{ item.sanPham?.tenSanPham || item.tenSanPham }}</h6>
                                        <p class="text-xs text-gray-600">{{ item.mauSac?.tenMauSac || 'N/A' }} - Size {{ item.kichCo?.tenKichCo || 'N/A' }}</p>
                                        <p class="text-xs text-gray-500">{{ item.maChiTiet || item.maSanPham }}</p>
                                    </div>
                                    <button class="rounded p-1 text-red-600 hover:bg-red-50 hover:text-red-800" @click="removeFromCart(index)">
                                        <i class="pi pi-trash text-sm"></i>
                                    </button>
                                </div>
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-2">
                                        <button class="flex h-6 w-6 items-center justify-center rounded bg-gray-200 text-gray-600 hover:bg-gray-300" @click="updateQuantity(index, item.soLuong - 1)">
                                            <i class="pi pi-minus text-xs"></i>
                                        </button>
                                        <span class="w-8 text-center text-sm">{{ item.soLuong }}</span>
                                        <button class="flex h-6 w-6 items-center justify-center rounded bg-gray-200 text-gray-600 hover:bg-gray-300" @click="updateQuantity(index, item.soLuong + 1)">
                                            <i class="pi pi-plus text-xs"></i>
                                        </button>
                                    </div>
                                    <span class="text-sm font-bold text-blue-600">
                                        {{ formatCurrency(parseFloat(item.giaBan || item.giaGoc || 0) * parseInt(item.soLuong || 0)) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Customer Section -->
                    <div v-if="cartItems.length > 0" class="border-t border-gray-200 p-4">
                        <!-- Customer Selection -->
                        <button class="mb-3 w-full rounded-lg border border-gray-300 p-3 text-left hover:bg-gray-50" @click="showCustomerModal = true">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <i class="pi pi-user text-gray-400"></i>
                                    <div>
                                        <p class="text-sm font-medium">
                                            {{ selectedCustomer ? selectedCustomer.hoTen : 'Chọn khách hàng' }}
                                        </p>
                                        <p v-if="selectedCustomer" class="text-xs text-gray-600">{{ selectedCustomer.sdt }} • Email: {{ selectedCustomer.email || 'N/A' }}</p>
                                    </div>
                                </div>
                                <i class="pi pi-chevron-down text-gray-400"></i>
                            </div>
                        </button>
                    </div>

                    <!-- Order Summary -->
                    <div v-if="cartItems.length > 0" class="border-t border-gray-200 p-4">
                        <div class="rounded-lg bg-gray-50 p-4">
                            <h6 class="mb-3 font-semibold text-gray-800">Tổng kết đơn hàng</h6>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span>Tiền hàng:</span>
                                    <span>{{ formatCurrency(totalAmount) }}</span>
                                </div>
                                <hr class="my-2" />
                                <div class="flex justify-between text-lg font-bold">
                                    <span>Tổng cần thanh toán:</span>
                                    <span class="text-red-600">{{ formatCurrency(totalAmount) }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Payment Button -->
                        <button
                            class="mt-4 w-full rounded-lg bg-gradient-to-r from-green-600 to-green-700 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:from-green-700 hover:to-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                            @click="showPaymentModal = true"
                            :disabled="cartItems.length === 0"
                        >
                            <div class="flex items-center justify-center space-x-2">
                                <i class="pi pi-credit-card"></i>
                                <span>Thanh toán ({{ formatCurrency(totalAmount) }})</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Customer Modal -->
        <Dialog v-model:visible="showCustomerModal" :style="{ width: '450px' }" header="Chọn khách hàng" :modal="true">
            <div class="space-y-4">
                <div>
                    <InputText v-model="customerSearchKeyword" placeholder="Tìm kiếm khách hàng..." class="w-full" />
                </div>

                <div class="max-h-64 overflow-y-auto">
                    <button class="mb-2 w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50" @click="selectCustomer(null)">
                        <div class="font-medium">Khách lẻ</div>
                        <div class="text-sm text-gray-500">Không cần thông tin khách hàng</div>
                    </button>

                    <button v-for="customer in filteredCustomers" :key="customer.id" class="mb-2 w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50" @click="selectCustomer(customer)">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium">{{ customer.hoTen }}</div>
                                <div class="text-sm text-gray-500">{{ customer.sdt }} • Email: {{ customer.email || 'N/A' }}</div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </Dialog>

        <!-- Payment Modal -->
        <Dialog v-model:visible="showPaymentModal" :style="{ width: '600px' }" header="Thanh toán" :modal="true">
            <div class="space-y-6">
                <!-- Customer Info -->
                <div class="rounded-lg bg-gray-50 p-4">
                    <h4 class="mb-3 font-medium">Thông tin khách hàng</h4>
                    <div class="grid grid-cols-1 gap-3">
                        <InputText v-model="paymentInfo.tenKhach" placeholder="Tên khách hàng *" />
                        <InputText v-model="paymentInfo.sdt" placeholder="Số điện thoại *" />
                        <InputText v-model="paymentInfo.email" placeholder="Email (tùy chọn)" />
                    </div>
                </div>

                <!-- Payment Method -->
                <div>
                    <h4 class="mb-3 font-medium">Phương thức thanh toán</h4>
                    <div class="grid grid-cols-2 gap-3">
                        <button
                            :class="['rounded-lg border p-3 text-center', paymentInfo.phuongThucThanhToan === 'TIEN_MAT' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50']"
                            @click="paymentInfo.phuongThucThanhToan = 'TIEN_MAT'"
                        >
                            <i class="pi pi-money-bill mb-2 text-2xl"></i>
                            <div class="font-medium">Tiền mặt</div>
                        </button>
                        <button
                            :class="['rounded-lg border p-3 text-center', paymentInfo.phuongThucThanhToan === 'CHUYEN_KHOAN' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50']"
                            @click="paymentInfo.phuongThucThanhToan = 'CHUYEN_KHOAN'"
                        >
                            <i class="pi pi-credit-card mb-2 text-2xl"></i>
                            <div class="font-medium">Chuyển khoản</div>
                        </button>
                    </div>
                </div>

                <!-- Payment Amount -->
                <div v-if="paymentInfo.phuongThucThanhToan === 'TIEN_MAT'">
                    <label class="mb-2 block font-medium">Tiền nhận</label>
                    <InputNumber v-model="paymentInfo.tienNhan" mode="currency" currency="VND" locale="vi-VN" placeholder="Nhập số tiền nhận" class="w-full" />
                    <p v-if="changeAmount > 0" class="mt-2 text-sm text-green-600">Tiền thừa: {{ formatCurrency(changeAmount) }}</p>
                </div>

                <!-- Order Summary -->
                <div class="rounded-lg bg-gray-50 p-4">
                    <h4 class="mb-3 font-medium">Tổng kết đơn hàng</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>Tiền hàng:</span>
                            <span>{{ formatCurrency(totalAmount) }}</span>
                        </div>
                        <hr class="my-2" />
                        <div class="flex justify-between text-lg font-bold">
                            <span>Tổng thanh toán:</span>
                            <span class="text-red-600">{{ formatCurrency(totalAmount) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Note -->
                <div>
                    <label class="mb-2 block font-medium">Ghi chú</label>
                    <Textarea v-model="paymentInfo.ghiChu" rows="3" placeholder="Ghi chú thêm..." class="w-full" />
                </div>
            </div>

            <template #footer>
                <Button @click="showPaymentModal = false" label="Hủy" severity="secondary" />
                <Button @click="processPayment" :label="processing ? 'Đang xử lý...' : 'Xác nhận thanh toán'" :disabled="processing || !isValidPayment" :loading="processing" />
            </template>
        </Dialog>

        <!-- QR Scanner Modal -->
        <Dialog v-model:visible="showQRModal" :style="{ width: '400px' }" header="Quét mã QR" :modal="true">
            <div class="space-y-4">
                <div class="flex h-64 items-center justify-center rounded-lg bg-gray-100">
                    <div class="text-center">
                        <i class="pi pi-camera mb-2 text-4xl text-gray-400"></i>
                        <p class="text-gray-500">Camera QR Scanner</p>
                        <p class="text-sm text-gray-400">Đưa mã QR vào khung hình</p>
                    </div>
                </div>

                <div>
                    <label class="mb-2 block font-medium">Hoặc nhập mã QR thủ công:</label>
                    <InputText v-model="qrCodeInput" placeholder="Nhập mã QR..." @keydown.enter="handleQRInput" class="w-full" />
                </div>
            </div>

            <template #footer>
                <Button @click="showQRModal = false" label="Đóng" severity="secondary" />
                <Button @click="handleQRInput" label="Quét" :disabled="!qrCodeInput.trim()" />
            </template>
        </Dialog>

        <!-- Success Modal -->
        <Dialog v-model:visible="showSuccessModal" :style="{ width: '400px' }" header="Thanh toán thành công!" :modal="true">
            <div v-if="createdInvoice" class="space-y-4 text-center">
                <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <i class="pi pi-check text-2xl text-green-600"></i>
                </div>

                <h3 class="text-xl font-semibold text-gray-900">Thanh toán thành công!</h3>
                <p class="text-gray-600">Hóa đơn {{ createdInvoice.maHoaDon }} đã được tạo thành công</p>

                <div class="rounded-lg bg-gray-50 p-4 text-left">
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>Mã hóa đơn:</span>
                            <span class="font-medium">
                                {{ createdInvoice.maHoaDon }}
                                <span v-if="createdInvoice.isDemo" class="ml-1 rounded bg-yellow-500 px-1 text-xs text-white">DEMO</span>
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span>Khách hàng:</span>
                            <span class="font-medium">{{ createdInvoice.tenKhach }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Tổng tiền:</span>
                            <span class="font-medium text-red-600">{{ formatCurrency(createdInvoice.tongTien) }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Thời gian:</span>
                            <span class="font-medium">{{ formatDate(new Date()) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button @click="showSuccessModal = false" label="Đóng" severity="secondary" />
                <Button @click="printInvoice(createdInvoice)" label="In hóa đơn" icon="pi pi-print" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

// ===== REACTIVE DATA =====
const toast = useToast();

// Loading states
const isLoading = ref(false);
const hasError = ref(false);
const errorMessage = ref('');
const loadingMessage = ref('');
const processing = ref(false);

// Search and filters
const searchKeyword = ref('');
const brandFilter = ref('');
const showAdvancedFilter = ref(false);
const minPrice = ref(null);
const maxPrice = ref(null);
const stockFilter = ref('');

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(12);

// Data
const products = ref([]);
const customers = ref([]);
const cartItems = ref([]);
const selectedCustomer = ref(null);
const currentEmployee = ref(null);

// Modal states
const showCustomerModal = ref(false);
const showPaymentModal = ref(false);
const showQRModal = ref(false);
const showSuccessModal = ref(false);

// Form data
const customerSearchKeyword = ref('');
const qrCodeInput = ref('');
const paymentInfo = ref({
    tenKhach: '',
    sdt: '',
    email: '',
    phuongThucThanhToan: 'TIEN_MAT',
    tienNhan: 0,
    ghiChu: ''
});
const createdInvoice = ref(null);

// Options for dropdowns
const brandOptions = ref([
    { label: 'Tất cả thương hiệu', value: '' },
    { label: 'Nike', value: 'nike' },
    { label: 'Adidas', value: 'adidas' },
    { label: 'Puma', value: 'puma' }
]);

const stockOptions = ref([
    { label: 'Tất cả', value: '' },
    { label: 'Còn hàng', value: 'in-stock' },
    { label: 'Hết hàng', value: 'out-of-stock' },
    { label: 'Sắp hết', value: 'low-stock' }
]);

// API URLs
const API_BASE_URL = 'http://localhost:8080';

// ===== COMPUTED PROPERTIES =====
const filteredProducts = computed(() => {
    let filtered = [...products.value];

    // Search filter
    if (searchKeyword.value.trim()) {
        const keyword = searchKeyword.value.toLowerCase();
        filtered = filtered.filter(
            (product) =>
                product.sanPham?.tenSanPham?.toLowerCase().includes(keyword) ||
                product.sanPham?.maSanPham?.toLowerCase().includes(keyword) ||
                product.maChiTiet?.toLowerCase().includes(keyword) ||
                product.sanPham?.thuongHieu?.tenThuongHieu?.toLowerCase().includes(keyword)
        );
    }

    // Brand filter
    if (brandFilter.value) {
        filtered = filtered.filter((product) => product.sanPham?.thuongHieu?.tenThuongHieu?.toLowerCase().includes(brandFilter.value));
    }

    // Advanced filters
    if (minPrice.value || maxPrice.value) {
        filtered = filtered.filter((product) => {
            const price = parseFloat(product.giaBan) || parseFloat(product.giaGoc) || 0;
            const min = minPrice.value || 0;
            const max = maxPrice.value || Infinity;
            return price >= min && price <= max;
        });
    }

    if (stockFilter.value) {
        if (stockFilter.value === 'in-stock') {
            filtered = filtered.filter((product) => product.soLuong > 0);
        } else if (stockFilter.value === 'out-of-stock') {
            filtered = filtered.filter((product) => product.soLuong === 0);
        } else if (stockFilter.value === 'low-stock') {
            filtered = filtered.filter((product) => product.soLuong > 0 && product.soLuong <= 5);
        }
    }

    return filtered;
});

const paginatedProducts = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    return filteredProducts.value.slice(start, start + itemsPerPage.value);
});

const filteredCustomers = computed(() => {
    if (!customerSearchKeyword.value.trim()) return customers.value;
    const keyword = customerSearchKeyword.value.toLowerCase();
    return customers.value.filter((customer) => customer.hoTen?.toLowerCase().includes(keyword) || customer.sdt?.includes(keyword));
});

// Cart calculations
const totalAmount = computed(() => {
    if (!cartItems.value || cartItems.value.length === 0) {
        return 0;
    }

    return cartItems.value.reduce((sum, item) => {
        const price = parseFloat(item.giaBan) || parseFloat(item.giaGoc) || 0;
        const quantity = parseInt(item.soLuong) || 0;
        return sum + price * quantity;
    }, 0);
});

const changeAmount = computed(() => {
    const received = parseFloat(paymentInfo.value.tienNhan) || 0;
    const total = totalAmount.value || 0;
    return Math.max(0, received - total);
});

const isValidPayment = computed(() => {
    const hasCustomerInfo = paymentInfo.value.tenKhach.trim() && paymentInfo.value.sdt.trim();
    const hasItems = cartItems.value.length > 0;
    const hasValidAmount = paymentInfo.value.phuongThucThanhToan !== 'TIEN_MAT' || (parseFloat(paymentInfo.value.tienNhan) || 0) >= totalAmount.value;

    return hasCustomerInfo && hasItems && hasValidAmount;
});

// ===== METHODS =====

// API Functions
async function fetchWithErrorHandling(url, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error for ${url}:`, error);
        throw error;
    }
}

// Load current employee từ API thật
async function loadCurrentEmployee() {
    try {
        const data = await fetchWithErrorHandling('/api/ban-hang/current-nhan-vien');

        console.log('Current employee response:', data);

        if (data && data.success && data.nhanVien) {
            currentEmployee.value = data.nhanVien;

            toast.add({
                severity: 'success',
                summary: 'Đăng nhập',
                detail: `Chào mừng ${data.nhanVien.hoTen}!`,
                life: 3000
            });
        } else {
            throw new Error('Không lấy được thông tin nhân viên');
        }
    } catch (error) {
        console.error('Lỗi load nhân viên:', error);

        // Fallback to mock data for demo
        currentEmployee.value = {
            id: 1,
            maNhanVien: 'NV001',
            hoTen: 'Nguyễn Văn A (Demo)',
            isDemo: true
        };

        // toast.add({
        //     severity: 'info',
        //     summary: 'Demo Mode',
        //     detail: 'Sử dụng tài khoản demo',
        //     life: 3000
        // });
    }
}

// Load products từ API chi tiết sản phẩm
async function loadProducts() {
    isLoading.value = true;
    hasError.value = false;
    loadingMessage.value = 'Đang tải sản phẩm...';

    try {
        // Gọi API lấy tất cả chi tiết sản phẩm
        const data = await fetchWithErrorHandling('/api/san-pham-chi-tiet');

        // Lọc chỉ lấy sản phẩm còn hàng và có đầy đủ thông tin
        const availableProducts = (data || []).filter((item) => item.soLuong > 0 && item.sanPham && item.giaGoc > 0);

        products.value = availableProducts;

        console.log('Loaded products:', products.value.length);
        console.log('Sample product:', products.value[0]);

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã tải ${products.value.length} sản phẩm`,
            life: 3000
        });
    } catch (error) {
        hasError.value = true;
        errorMessage.value = `Không thể kết nối đến API: ${error.message}`;

        // Fallback to sample data với cấu trúc ChiTietSanPham
        products.value = createSampleChiTietSanPham();

        toast.add({
            severity: 'info',
            summary: 'Dữ liệu mẫu',
            detail: 'Hiển thị dữ liệu mẫu để demo',
            life: 3000
        });
    } finally {
        isLoading.value = false;
        loadingMessage.value = '';
    }
}

// Load customers từ API khách hàng
async function loadCustomers() {
    try {
        const data = await fetchWithErrorHandling('/api/khach-hang/all');
        customers.value = data || [];
    } catch (error) {
        console.error('Lỗi load khách hàng:', error);
        // Fallback to sample data
        customers.value = createSampleCustomers();
    }
}

// Sample data functions với cấu trúc ChiTietSanPham
function createSampleChiTietSanPham() {
    return [
        {
            id: 1,
            maChiTiet: 'CTSP001',
            giaGoc: 1500000,
            giaBan: 1500000,
            soLuong: 10,
            trangThai: 1,
            sanPham: {
                id: 1,
                tenSanPham: 'Giày Nike Air Max',
                maSanPham: 'NK001',
                thuongHieu: { tenThuongHieu: 'Nike' },
                danhMuc: { tenDanhMuc: 'Giày thể thao' }
            },
            mauSac: { id: 1, tenMauSac: 'Đen', maMauSac: '#000000' },
            kichCo: { id: 1, tenKichCo: '42' },
            hinhAnhs: [{ tenHinhAnh: 'nike-air-max.jpg' }]
        },
        {
            id: 2,
            maChiTiet: 'CTSP002',
            giaGoc: 1800000,
            giaBan: 1700000,
            soLuong: 5,
            trangThai: 1,
            sanPham: {
                id: 2,
                tenSanPham: 'Giày Adidas Ultraboost',
                maSanPham: 'AD001',
                thuongHieu: { tenThuongHieu: 'Adidas' },
                danhMuc: { tenDanhMuc: 'Giày thể thao' }
            },
            mauSac: { id: 2, tenMauSac: 'Trắng', maMauSac: '#FFFFFF' },
            kichCo: { id: 2, tenKichCo: '43' },
            hinhAnhs: [{ tenHinhAnh: 'adidas-ultraboost.jpg' }]
        },
        {
            id: 3,
            maChiTiet: 'CTSP003',
            giaGoc: 450000,
            giaBan: 400000,
            soLuong: 15,
            trangThai: 1,
            sanPham: {
                id: 3,
                tenSanPham: 'Áo thun Nike Dri-FIT',
                maSanPham: 'NK002',
                thuongHieu: { tenThuongHieu: 'Nike' },
                danhMuc: { tenDanhMuc: 'Áo thun' }
            },
            mauSac: { id: 3, tenMauSac: 'Xanh', maMauSac: '#0000FF' },
            kichCo: { id: 3, tenKichCo: 'L' },
            hinhAnhs: [{ tenHinhAnh: 'nike-dri-fit.jpg' }]
        },
        {
            id: 4,
            maChiTiet: 'CTSP004',
            giaGoc: 2200000,
            giaBan: 2000000,
            soLuong: 8,
            trangThai: 1,
            sanPham: {
                id: 4,
                tenSanPham: 'Giày Puma RS-X',
                maSanPham: 'PU001',
                thuongHieu: { tenThuongHieu: 'Puma' },
                danhMuc: { tenDanhMuc: 'Giày thể thao' }
            },
            mauSac: { id: 4, tenMauSac: 'Đỏ', maMauSac: '#FF0000' },
            kichCo: { id: 4, tenKichCo: '41' },
            hinhAnhs: [{ tenHinhAnh: 'puma-rs-x.jpg' }]
        }
    ];
}

function createSampleCustomers() {
    return [
        { id: 1, hoTen: 'Nguyễn Văn A', email: 'nguyenvana@email.com', sdt: '0901234567' },
        { id: 2, hoTen: 'Trần Thị B', email: 'tranthib@email.com', sdt: '0912345678' },
        { id: 3, hoTen: 'Lê Văn C', email: 'levanc@email.com', sdt: '0923456789' }
    ];
}

// Cart functions
function addToCart(product) {
    if (!product || product.soLuong <= 0) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Sản phẩm đã hết hàng!',
            life: 3000
        });
        return;
    }

    // Đảm bảo giá được parse đúng từ ChiTietSanPham
    const productPrice = parseFloat(product.giaBan) || parseFloat(product.giaGoc) || 0;
    const productQuantity = parseInt(product.soLuong) || 0;

    const existingIndex = cartItems.value.findIndex((item) => item.id === product.id);
    if (existingIndex !== -1) {
        const currentQuantity = parseInt(cartItems.value[existingIndex].soLuong) || 0;
        if (currentQuantity < productQuantity) {
            cartItems.value[existingIndex].soLuong = currentQuantity + 1;
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã cập nhật ${product.sanPham?.tenSanPham || product.tenSanPham}`,
                life: 3000
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không đủ hàng trong kho!',
                life: 3000
            });
        }
    } else {
        const cartItem = {
            ...product,
            soLuong: 1,
            maxQuantity: productQuantity,
            giaBan: productPrice,
            giaGoc: product.giaGoc || productPrice,
            // Đảm bảo có đầy đủ thông tin hiển thị
            tenSanPham: product.sanPham?.tenSanPham || product.tenSanPham,
            maSanPham: product.sanPham?.maSanPham || product.maSanPham
        };

        cartItems.value.push(cartItem);

        console.log('Added to cart:', cartItem);
        console.log('Current cart:', cartItems.value);
        console.log('Total amount:', totalAmount.value);

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã thêm ${product.sanPham?.tenSanPham || product.tenSanPham} vào giỏ hàng`,
            life: 3000
        });
    }
}

function updateQuantity(index, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(index);
        return;
    }

    const item = cartItems.value[index];
    const maxQty = parseInt(item.maxQuantity) || 0;

    if (newQuantity > maxQty) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không đủ hàng trong kho!',
            life: 3000
        });
        return;
    }

    cartItems.value[index].soLuong = parseInt(newQuantity);

    console.log('Updated quantity:', cartItems.value[index]);
    console.log('New total:', totalAmount.value);
}

function removeFromCart(index) {
    const item = cartItems.value[index];
    cartItems.value.splice(index, 1);

    toast.add({
        severity: 'info',
        summary: 'Thông báo',
        detail: `Đã xóa ${item.tenSanPham}`,
        life: 3000
    });
}

function clearCart() {
    if (cartItems.value.length === 0) return;

    cartItems.value = [];
    selectedCustomer.value = null;
    resetPaymentInfo();

    toast.add({
        severity: 'info',
        summary: 'Thông báo',
        detail: 'Đã xóa tất cả sản phẩm trong giỏ hàng',
        life: 3000
    });
}

function resetPaymentInfo() {
    paymentInfo.value = {
        tenKhach: '',
        sdt: '',
        email: '',
        phuongThucThanhToan: 'TIEN_MAT',
        tienNhan: 0,
        ghiChu: ''
    };
}

// Customer selection
function selectCustomer(customer) {
    selectedCustomer.value = customer;
    if (customer) {
        paymentInfo.value.tenKhach = customer.hoTen;
        paymentInfo.value.sdt = customer.sdt;
        paymentInfo.value.email = customer.email || '';

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã chọn khách hàng: ${customer.hoTen}`,
            life: 3000
        });
    } else {
        paymentInfo.value.tenKhach = '';
        paymentInfo.value.sdt = '';
        paymentInfo.value.email = '';

        toast.add({
            severity: 'info',
            summary: 'Thông báo',
            detail: 'Đã chọn khách lẻ',
            life: 3000
        });
    }
    showCustomerModal.value = false;
}

// Payment processing với API thật
async function processPayment() {
    if (!isValidPayment.value) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Vui lòng kiểm tra thông tin thanh toán!',
            life: 3000
        });
        return;
    }

    processing.value = true;

    try {
        // Chuẩn bị dữ liệu hóa đơn theo cấu trúc HoaDonRequest
        const hoaDonData = {
            // Thông tin khách hàng
            tenKhach: paymentInfo.value.tenKhach,
            sdt: paymentInfo.value.sdt,
            email: paymentInfo.value.email || '',

            // Thông tin thanh toán
            phuongThucThanhToan: paymentInfo.value.phuongThucThanhToan,
            tienNhan: parseFloat(paymentInfo.value.tienNhan) || 0,
            ghiChu: paymentInfo.value.ghiChu || '',

            // Thông tin hóa đơn
            tongTien: totalAmount.value,
            loaiHoaDon: 'OFFLINE', // Bán hàng tại quầy
            trangThai: 'CHO_XAC_NHAN',

            // ID liên quan
            khachHangId: selectedCustomer.value?.id || null,
            nhanVienId: currentEmployee.value?.id || 1, // Fallback nếu không có nhân viên

            // Chi tiết sản phẩm
            chiTiets: cartItems.value.map((item) => ({
                chiTietSanPhamId: item.id,
                soLuong: parseInt(item.soLuong),
                donGia: parseFloat(item.giaBan) || parseFloat(item.giaGoc),
                thanhTien: (parseFloat(item.giaBan) || parseFloat(item.giaGoc)) * parseInt(item.soLuong)
            }))
        };

        console.log('Sending invoice data:', hoaDonData);

        // Gọi API tạo hóa đơn thật
        const response = await fetchWithErrorHandling('/api/ban-hang/tao-hoa-don', {
            method: 'POST',
            body: JSON.stringify(hoaDonData)
        });

        console.log('API Response:', response);

        if (response && (response.success || response.id)) {
            // API trả về thành công
            createdInvoice.value = {
                id: response.id || response.hoaDon?.id,
                maHoaDon: response.maHoaDon || response.hoaDon?.maHoaDon,
                tenKhach: paymentInfo.value.tenKhach,
                tongTien: totalAmount.value,
                ngayTao: new Date(),
                success: true
            };

            showPaymentModal.value = false;
            showSuccessModal.value = true;
            clearCart();

            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Hóa đơn ${createdInvoice.value.maHoaDon} đã được tạo thành công!`,
                life: 5000
            });
        } else {
            throw new Error(response?.message || 'Có lỗi xảy ra khi tạo hóa đơn');
        }
    } catch (error) {
        console.error('Lỗi thanh toán:', error);

        toast.add({
            severity: 'error',
            summary: 'Lỗi thanh toán',
            detail: error.message || 'Không thể tạo hóa đơn. Vui lòng thử lại!',
            life: 5000
        });

        // Nếu có lỗi mạng, có thể tạo mock để demo
        if (error.message.includes('Failed to fetch') || error.message.includes('HTTP')) {
            const userConfirm = confirm('Không thể kết nối server. Bạn có muốn tạo hóa đơn demo không?');

            if (userConfirm) {
                const mockInvoice = {
                    id: Date.now(),
                    maHoaDon: 'HD' + Date.now().toString().slice(-6),
                    tenKhach: paymentInfo.value.tenKhach,
                    tongTien: totalAmount.value,
                    ngayTao: new Date(),
                    success: true,
                    isDemo: true
                };

                createdInvoice.value = mockInvoice;
                showPaymentModal.value = false;
                showSuccessModal.value = true;
                clearCart();

                toast.add({
                    severity: 'info',
                    summary: 'Demo Mode',
                    detail: 'Hóa đơn demo đã được tạo!',
                    life: 5000
                });
            }
        }
    } finally {
        processing.value = false;
    }
}

// Search and filter functions
let searchTimeout;
function onSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage.value = 1;
    }, 300);
}

function applyAdvancedFilters() {
    currentPage.value = 1;
    toast.add({
        severity: 'info',
        summary: 'Bộ lọc',
        detail: 'Đã áp dụng bộ lọc nâng cao',
        life: 3000
    });
}

function clearAllFilters() {
    searchKeyword.value = '';
    brandFilter.value = '';
    minPrice.value = null;
    maxPrice.value = null;
    stockFilter.value = '';
    currentPage.value = 1;

    toast.add({
        severity: 'info',
        summary: 'Bộ lọc',
        detail: 'Đã xóa tất cả bộ lọc',
        life: 3000
    });
}

// QR Code handling với API
async function handleQRInput() {
    if (!qrCodeInput.value.trim()) return;

    try {
        // Gọi API tìm sản phẩm theo QR code
        const foundProduct = await fetchWithErrorHandling(`/api/san-pham/qr/${qrCodeInput.value}`);

        if (foundProduct) {
            addToCart(foundProduct);
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã thêm sản phẩm từ QR: ${foundProduct.tenSanPham}`,
                life: 3000
            });
        }
    } catch (error) {
        // Fallback tìm trong danh sách hiện tại
        const foundProduct = products.value.find((p) => p.maSanPham?.toLowerCase() === qrCodeInput.value.toLowerCase() || p.maChiTiet?.toLowerCase() === qrCodeInput.value.toLowerCase());

        if (foundProduct) {
            addToCart(foundProduct);
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã thêm sản phẩm từ QR: ${foundProduct.tenSanPham}`,
                life: 3000
            });
        } else {
            toast.add({
                severity: 'warning',
                summary: 'Không tìm thấy',
                detail: 'Không tìm thấy sản phẩm với mã QR này',
                life: 3000
            });
        }
    }

    qrCodeInput.value = '';
    showQRModal.value = false;
}

function handleEnterSearch() {
    if (filteredProducts.value.length === 1) {
        addToCart(filteredProducts.value[0]);
        searchKeyword.value = '';
    }
}

// Pagination
function onPageChange(event) {
    currentPage.value = event.page + 1;
}

// Utility functions
function formatCurrency(amount) {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(numAmount);
}

function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getProductImageUrl(imageName) {
    return `${API_BASE_URL}/hinh-anh/images/${imageName}`;
}

function handleImageError(event) {
    event.target.style.display = 'none';
}

async function refreshAllData() {
    await Promise.all([loadCurrentEmployee(), loadProducts(), loadCustomers()]);
}

async function retryConnection() {
    hasError.value = false;
    await refreshAllData();
}

function exportData() {
    try {
        const headers = ['ID', 'Tên sản phẩm', 'Mã sản phẩm', 'Thương hiệu', 'Giá bán', 'Số lượng', 'Trạng thái'];

        const csvData = filteredProducts.value.map((product) => [
            product.id,
            product.tenSanPham || '',
            product.maSanPham || product.maChiTiet || '',
            product.thuongHieu?.tenThuongHieu || '',
            product.giaBan || product.giaGoc || 0,
            product.soLuong || 0,
            product.soLuong > 0 ? 'Còn hàng' : 'Hết hàng'
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map((row) =>
                row
                    .map((field) => {
                        const stringField = String(field);
                        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                            return `"${stringField.replace(/"/g, '""')}"`;
                        }
                        return stringField;
                    })
                    .join(',')
            )
        ].join('\n');

        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const filename = `SanPham_${dateStr}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.add({
            severity: 'success',
            summary: 'Xuất dữ liệu thành công',
            detail: `Đã xuất ${filteredProducts.value.length} sản phẩm ra file ${filename}`,
            life: 3000
        });
    } catch (error) {
        console.error('Error exporting data:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi xuất dữ liệu',
            detail: 'Có lỗi xảy ra khi xuất file',
            life: 3000
        });
    }
}

function printInvoice(invoice) {
    if (invoice.isDemo) {
        toast.add({
            severity: 'info',
            summary: 'Demo Mode',
            detail: 'Chức năng in hóa đơn chỉ khả dụng khi kết nối với server thật',
            life: 3000
        });
        return;
    }

    toast.add({
        severity: 'info',
        summary: 'In hóa đơn',
        detail: `Đang in hóa đơn ${invoice.maHoaDon}...`,
        life: 3000
    });

    // Simulate printing
    setTimeout(() => {
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'In hóa đơn thành công!',
            life: 3000
        });
    }, 1000);
}

// Watch for filter changes
watch([brandFilter, stockFilter], () => {
    currentPage.value = 1;
});

// Initialize
onMounted(() => {
    refreshAllData();
});
</script>

<style scoped>
.pos-system {
    padding: 1rem;
    min-height: 100vh;
    background-color: #f8fafc;
}

.product-card {
    position: relative;
    background: white;
    border-radius: 0.5rem;
    overflow: hidden;
}

.product-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.product-info h6 {
    color: #1f2937;
    line-height: 1.4;
}

.grid {
    display: grid;
}

.grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
}

.grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
}

.gap-2 {
    gap: 0.5rem;
}

.gap-3 {
    gap: 0.75rem;
}

.gap-4 {
    gap: 1rem;
}

.gap-6 {
    gap: 1.5rem;
}

@media (min-width: 768px) {
    .md\:grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .md\:grid-cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .md\:grid-cols-4 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

@media (min-width: 1024px) {
    .lg\:grid-cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .lg\:grid-cols-4 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

@media (min-width: 1280px) {
    .xl\:grid-cols-4 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

.min-w-64 {
    min-width: 16rem;
}

.w-96 {
    width: 24rem;
}

.space-y-2 > * + * {
    margin-top: 0.5rem;
}

.space-y-3 > * + * {
    margin-top: 0.75rem;
}

.space-y-4 > * + * {
    margin-top: 1rem;
}

.space-y-6 > * + * {
    margin-top: 1.5rem;
}

.flex-1 {
    flex: 1 1 0%;
}

.overflow-y-auto {
    overflow-y: auto;
}

.overflow-x-auto {
    overflow-x: auto;
}

/* Custom scrollbar */
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* Transitions */
.transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
}

/* Shadow utilities */
.shadow-sm {
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.shadow-lg {
    box-shadow:
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Border radius utilities */
.rounded-lg {
    border-radius: 0.5rem;
}

/* Background utilities */
.bg-gradient-to-r {
    background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

.from-blue-500 {
    --tw-gradient-from: #3b82f6;
    --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(59, 130, 246, 0));
}

.to-purple-600 {
    --tw-gradient-to: #9333ea;
}

.from-green-600 {
    --tw-gradient-from: #16a34a;
    --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(22, 163, 74, 0));
}

.to-green-700 {
    --tw-gradient-to: #15803d;
}

.hover\:from-green-700:hover {
    --tw-gradient-from: #15803d;
    --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(21, 128, 61, 0));
}

.hover\:to-green-800:hover {
    --tw-gradient-to: #166534;
}

/* Text utilities */
.truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Hover effects */
.hover\:-translate-y-1:hover {
    --tw-translate-y: -0.25rem;
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.hover\:border-blue-500:hover {
    border-color: #3b82f6;
}

.hover\:shadow-lg:hover {
    box-shadow:
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Disabled states */
.disabled\:opacity-50:disabled {
    opacity: 0.5;
}

.disabled\:cursor-not-allowed:disabled {
    cursor: not-allowed;
}
</style>
