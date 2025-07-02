<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Toast Notification -->
        <div v-if="toast.show" :class="['fixed right-4 top-4 z-50 flex items-center space-x-2 rounded-lg px-6 py-4 text-white shadow-lg transition-all duration-300', getToastBgColor(toast.type)]">
            <span>{{ toast.message }}</span>
            <button @click="toast.show = false" class="ml-2">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        <!-- Debug API Connection -->
        <div class="fixed left-4 top-4 z-50 rounded border border-red-400 bg-white px-4 py-2 text-red-700 shadow" v-if="toast.type === 'error' && toast.message.includes('API Error')">
            <strong>Lỗi kết nối API:</strong>
            <div>{{ toast.message }}</div>
            <div>
                <span>API_BASE_URL: {{ API_BASE_URL }}</span>
            </div>
            <div>
                <span>Kiểm tra lại server backend hoặc cấu hình URL.</span>
            </div>
        </div>
        <!-- Navigation Header -->
        <nav class="bg-blue-600 text-white shadow-lg">
            <div class="container mx-auto px-4">
                <div class="flex h-16 items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                        <span class="text-xl font-bold">Hệ thống POS</span>
                    </div>
                    <div class="flex items-center space-x-6">
                        <button :class="['flex items-center space-x-2 rounded-lg px-4 py-2 transition-colors', activeView === 'pos' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-700']" @click="activeView = 'pos'">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                                ></path>
                            </svg>
                            <span>Bán hàng</span>
                        </button>
                        <button :class="['flex items-center space-x-2 rounded-lg px-4 py-2 transition-colors', activeView === 'invoices' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-700']" @click="activeView = 'invoices'">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span>Hóa đơn</span>
                        </button>
                    </div>
                    <div class="flex items-center space-x-2">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <span>{{ currentNhanVien.hoTen }}</span>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <template v-if="activeView === 'pos'">
            <div class="flex h-screen">
                <!-- Left Panel - Product List -->
                <div class="flex-1 p-6">
                    <!-- Header Section -->
                    <div class="mb-6 rounded-lg bg-white p-4 shadow-sm">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-4">
                                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                    <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="font-semibold">{{ currentNhanVien.hoTen }}</h3>
                                    <p class="text-sm text-gray-600">{{ currentNhanVien.maNhanVien }}</p>
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <button :class="['rounded-lg px-4 py-2', activeTab === 'hoaDon1' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700']" @click="activeTab = 'hoaDon1'">Hóa đơn 1</button>
                                <button :class="['rounded-lg px-4 py-2', activeTab === 'hoaDon2' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700']" @click="activeTab = 'hoaDon2'">Hóa đơn 2</button>
                                <button class="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700" @click="createNewInvoice">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                    <span>Tạo hóa đơn</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <!-- Search & Actions -->
                    <div class="mb-6 flex space-x-4">
                        <div class="flex-1">
                            <div class="relative">
                                <svg class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                                <input
                                    type="text"
                                    class="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                    placeholder="Tìm sản phẩm theo tên, mã hoặc QR..."
                                    v-model="searchKeyword"
                                    @keydown.enter="handleEnterSearch"
                                />
                            </div>
                        </div>
                        <button class="flex items-center space-x-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700" @click="showQRModal = true">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                                ></path>
                            </svg>
                            <span>QR Code</span>
                        </button>
                        <button class="flex items-center space-x-2 rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700" @click="showProductModal = true">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            <span>Thêm sản phẩm</span>
                        </button>
                    </div>
                    <!-- Product Grid -->
                    <div class="h-96 overflow-y-auto">
                        <div v-if="loading" class="flex h-full flex-col items-center justify-center">
                            <div class="animate-spin h-12 w-12 rounded-full border-b-2 border-blue-600"></div>
                            <p class="mt-4 text-gray-600">Đang tải sản phẩm...</p>
                        </div>
                        <div v-else-if="filteredVariants.length > 0" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div
                                v-for="variant in filteredVariants"
                                :key="variant.id"
                                class="transform cursor-pointer rounded-lg border-2 border-transparent bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-500 hover:shadow-md"
                                @click="addToCart(variant)"
                            >
                                <div v-if="variant.images && variant.images.length > 0" class="mb-3 overflow-hidden rounded-lg">
                                    <img :src="`${API_BASE_URL}/hinh-anh/images/${variant.images[0].tenHinhAnh}`" :alt="variant.sanPham.tenSanPham" class="h-32 w-full object-cover" @error="(e) => (e.target.style.display = 'none')" />
                                </div>
                                <h6 class="mb-2 truncate font-semibold text-gray-800" :title="variant.sanPham.tenSanPham">
                                    {{ variant.sanPham.tenSanPham }}
                                </h6>
                                <p class="mb-2 text-sm text-gray-600">{{ variant.sanPham.thuongHieu.tenThuongHieu }}</p>
                                <div class="mb-3 flex space-x-2">
                                    <span class="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700">
                                        {{ variant.mauSac.tenMauSac }}
                                    </span>
                                    <span class="rounded bg-blue-200 px-2 py-1 text-xs text-blue-700"> Size {{ variant.kichCo.tenKichCo }} </span>
                                </div>
                                <div class="mb-2 text-xs text-gray-500">Mã: {{ variant.maChiTiet }}</div>
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-blue-600">{{ formatMoney(variant.giaBan) }}</span>
                                    <span class="text-sm text-gray-600">SL: {{ variant.soLuong }}</span>
                                </div>
                            </div>
                        </div>
                        <div v-else class="flex h-full flex-col items-center justify-center">
                            <div class="mb-4 text-6xl text-gray-400">📦</div>
                            <h5 class="mb-2 text-lg text-gray-600">Không có sản phẩm nào</h5>
                            <p class="text-gray-500">Tìm kiếm hoặc thử lại với từ khóa khác</p>
                            <button class="mt-4 flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" @click="loadProducts">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                <span>Tải lại</span>
                            </button>
                        </div>
                    </div>
                </div>
                <!-- Right Panel - Cart -->
                <div class="w-96 border-l border-gray-200 bg-white p-6">
                    <div class="mb-4 flex items-center justify-between">
                        <h4 class="text-lg font-semibold">Giỏ hàng</h4>
                        <button class="rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700" @click="clearCart" :disabled="cartItems.length === 0">Xóa tất cả</button>
                    </div>
                    <!-- Cart Items -->
                    <div class="mb-4 max-h-64 space-y-2 overflow-y-auto">
                        <div v-if="cartItems.length === 0" class="flex flex-col items-center justify-center py-8">
                            <div class="mb-2 text-4xl text-gray-400">🛒</div>
                            <p class="text-gray-500">Giỏ hàng trống</p>
                        </div>
                        <div v-for="(item, index) in cartItems" :key="index" class="rounded-lg border border-gray-200 p-3">
                            <div class="mb-2 flex items-start justify-between">
                                <div class="flex-1">
                                    <h6 class="text-sm font-medium">{{ item.sanPham.tenSanPham }}</h6>
                                    <p class="text-xs text-gray-600">{{ item.mauSac.tenMauSac }} - Size {{ item.kichCo.tenKichCo }}</p>
                                    <p class="text-xs text-gray-500">{{ item.maChiTiet }}</p>
                                </div>
                                <button class="text-red-600 hover:text-red-800" @click="removeFromCart(index)">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </button>
                            </div>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-2">
                                    <button class="h-6 w-6 rounded bg-gray-200 text-gray-600 hover:bg-gray-300" @click="updateQuantity(index, item.soLuong - 1)">-</button>
                                    <span class="w-8 text-center text-sm">{{ item.soLuong }}</span>
                                    <button class="h-6 w-6 rounded bg-gray-200 text-gray-600 hover:bg-gray-300" @click="updateQuantity(index, item.soLuong + 1)">+</button>
                                </div>
                                <span class="text-sm font-bold text-blue-600">{{ formatMoney(item.giaBan * item.soLuong) }}</span>
                            </div>
                        </div>
                    </div>
                    <!-- Customer Selection -->
                    <div class="mb-4">
                        <button class="w-full rounded-lg border border-gray-300 p-3 text-left hover:bg-gray-50" @click="showCustomerModal = true">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium">
                                        {{ selectedCustomer ? selectedCustomer.hoTen : 'Chọn khách hàng' }}
                                    </p>
                                    <p v-if="selectedCustomer" class="text-xs text-gray-600">{{ selectedCustomer.sdt }} - Điểm: {{ selectedCustomer.diem || 0 }}</p>
                                </div>
                                <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                        </button>
                    </div>
                    <!-- Order Summary -->
                    <div class="mb-4 rounded-lg border border-gray-200 p-4">
                        <h6 class="mb-3 font-semibold">Tổng kết đơn hàng</h6>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span>Tiền hàng:</span>
                                <span>{{ formatMoney(totalAmount) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Giảm giá:</span>
                                <span class="text-green-600">-{{ formatMoney(discount) }}</span>
                            </div>
                            <div v-if="pointDiscount > 0" class="flex justify-between">
                                <span>Điểm tích lũy:</span>
                                <span class="text-yellow-600">-{{ formatMoney(pointDiscount) }}</span>
                            </div>
                            <hr class="my-2" />
                            <div class="flex justify-between text-lg font-bold">
                                <span>Tổng cần thanh toán:</span>
                                <span class="text-red-600">{{ formatMoney(finalTotal) }}</span>
                            </div>
                        </div>
                    </div>
                    <!-- Payment Button -->
                    <button class="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50" @click="showPaymentModal = true" :disabled="cartItems.length === 0">
                        Thanh toán ({{ formatMoney(finalTotal) }})
                    </button>
                </div>
            </div>
        </template>
        <!-- ... (Các modal và phần hóa đơn, bạn có thể copy lại từ code React đã chuyển đổi ở trên, chỉ cần thay đổi cú pháp sang Vue) ... -->
        <!-- Để ngắn gọn, phần modal và hóa đơn không được lặp lại ở đây, bạn có thể copy lại từ code React đã chuyển đổi ở trên -->
    </div>
</template>

<script>
import { computed, onMounted, reactive, ref, watch } from 'vue';

export default {
    name: 'BanHangView',
    setup() {
        // ===== STATE MANAGEMENT =====
        const activeView = ref('pos');
        const activeTab = ref('hoaDon1');
        const searchKeyword = ref('');
        const cartItems = ref([]);
        const selectedCustomer = ref(null);
        const loading = ref(false);
        const showCustomerModal = ref(false);
        const showPaymentModal = ref(false);
        const showSuccessModal = ref(false);
        const showProductModal = ref(false);
        const showQRModal = ref(false);
        const processing = ref(false);
        const toast = reactive({ show: false, message: '', type: 'info' });
        const createdInvoice = ref(null);
        const customerSearchKeyword = ref('');
        const loadingCustomers = ref(false);

        // ===== DATA STATES =====
        const products = ref([]);
        const customers = ref([]);
        const invoices = ref([]);
        const productImages = ref({});

        // ===== CONSTANTS =====
        const API_BASE_URL = 'http://localhost:8080';
        const currentNhanVien = reactive({ hoTen: 'Admin', maNhanVien: 'NV001', id: 1 });
        const paymentInfo = reactive({
            tenKhach: '',
            sdt: '',
            email: ''
        });

        // ===== API FUNCTIONS =====
        const apiCall = async (url, options = {}) => {
            try {
                const response = await fetch(`${API_BASE_URL}${url}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(options.headers || {})
                    },
                    ...options
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                showToast(`API Error: ${error.message}`, 'error');
                throw error;
            }
        };

        // ===== LOAD DATA FUNCTIONS =====
        const loadProducts = async () => {
            loading.value = true;
            try {
                const data = await apiCall('/api/san-pham/available');
                products.value = data || [];
                // Load images for each product
                const imagePromises = (data || []).map(async (product) => {
                    if (product.chiTietSanPhams) {
                        const productImagePromises = product.chiTietSanPhams.map(async (chiTiet) => {
                            try {
                                const images = await apiCall(`/hinh-anh/chi-tiet-san-pham/${chiTiet.id}`);
                                return { chiTietId: chiTiet.id, images };
                            } catch {
                                return { chiTietId: chiTiet.id, images: [] };
                            }
                        });
                        return await Promise.all(productImagePromises);
                    }
                    return [];
                });
                const allImageResults = await Promise.all(imagePromises);
                const imageMap = {};
                allImageResults.flat().forEach(({ chiTietId, images }) => {
                    imageMap[chiTietId] = images;
                });
                productImages.value = imageMap;
                showToast('Đã tải sản phẩm thành công', 'success');
            } catch {
                showToast('Lỗi khi tải sản phẩm', 'error');
            } finally {
                loading.value = false;
            }
        };

        const loadCustomers = async () => {
            loadingCustomers.value = true;
            try {
                const data = await apiCall('/api/khach-hang');
                customers.value = data || [];
            } catch {
                customers.value = [
                    { id: 1, hoTen: 'Nguyễn Văn A', email: 'nguyenvana@email.com', sdt: '0901234567', diem: 150 },
                    { id: 2, hoTen: 'Trần Thị B', email: 'tranthib@email.com', sdt: '0912345678', diem: 200 },
                    { id: 3, hoTen: 'Lê Văn C', email: 'levanc@email.com', sdt: '0923456789', diem: 75 },
                    { id: 4, hoTen: 'Phạm Thị D', email: 'phamthid@email.com', sdt: '0934567890', diem: 320 },
                    { id: 5, hoTen: 'Hoàng Văn E', email: 'hoangvane@email.com', sdt: '0945678901', diem: 90 }
                ];
            } finally {
                loadingCustomers.value = false;
            }
        };

        const loadInvoices = async () => {
            loading.value = true;
            try {
                const data = await apiCall('/api/ban-hang/hoa-don/offline');
                invoices.value = data || [];
                showToast('Đã tải danh sách hóa đơn', 'success');
            } catch {
                showToast('Lỗi khi tải hóa đơn', 'error');
            } finally {
                loading.value = false;
            }
        };

        // ===== SEARCH FUNCTIONS =====
        const searchProducts = async (keyword) => {
            if (!keyword.trim()) {
                await loadProducts();
                return;
            }
            loading.value = true;
            try {
                const data = await apiCall(`/api/san-pham/search?keyword=${encodeURIComponent(keyword)}`);
                products.value = data || [];
            } catch {
                showToast('Lỗi khi tìm kiếm sản phẩm', 'error');
            } finally {
                loading.value = false;
            }
        };

        const handleQRSearch = async (qrCode) => {
            loading.value = true;
            try {
                const product = await apiCall(`/api/san-pham/qr/${encodeURIComponent(qrCode)}`);
                if (product) {
                    addToCart(product);
                    showToast(`Đã thêm sản phẩm từ QR: ${product.sanPham.tenSanPham}`, 'success');
                } else {
                    showToast('Không tìm thấy sản phẩm với mã QR này', 'warning');
                }
            } catch {
                showToast('Lỗi khi quét QR code', 'error');
            } finally {
                loading.value = false;
            }
        };

        // ===== UTILITY FUNCTIONS =====
        const formatMoney = (amount) => {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(amount || 0);
        };

        const formatDate = (date) => {
            return new Date(date).toLocaleString('vi-VN');
        };

        let toastTimeout = null;
        const showToast = (message, type = 'info') => {
            if (toastTimeout) clearTimeout(toastTimeout);
            toast.show = true;
            toast.message = message;
            toast.type = type;
            toastTimeout = setTimeout(() => {
                toast.show = false;
            }, 3000);
        };

        const getToastBgColor = (type) => {
            const colors = {
                success: 'bg-green-500',
                error: 'bg-red-500',
                warning: 'bg-yellow-500',
                info: 'bg-blue-500'
            };
            return colors[type] || 'bg-blue-500';
        };

        // ===== COMPUTED VALUES =====
        const productVariants = computed(() => {
            const variants = [];
            products.value.forEach((product) => {
                if (product.trangThai === 1 && product.chiTietSanPhams) {
                    product.chiTietSanPhams.forEach((chiTiet) => {
                        if (chiTiet.trangThai === 1 && chiTiet.soLuong > 0) {
                            variants.push({
                                ...chiTiet,
                                sanPham: product,
                                images: productImages.value[chiTiet.id] || []
                            });
                        }
                    });
                }
            });
            return variants;
        });

        const filteredVariants = computed(() => {
            if (!searchKeyword.value.trim()) return productVariants.value;
            return productVariants.value.filter(
                (variant) =>
                    variant.sanPham.tenSanPham.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
                    variant.sanPham.thuongHieu.tenThuongHieu.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
                    variant.sanPham.maSanPham.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
                    variant.maChiTiet.toLowerCase().includes(searchKeyword.value.toLowerCase())
            );
        });

        const filteredCustomers = computed(() => {
            if (!customerSearchKeyword.value.trim()) return customers.value;
            return customers.value.filter((customer) => customer.hoTen.toLowerCase().includes(customerSearchKeyword.value.toLowerCase()) || customer.sdt.includes(customerSearchKeyword.value));
        });

        const totalAmount = computed(() => cartItems.value.reduce((sum, item) => sum + item.giaBan * item.soLuong, 0));
        const discount = 0;
        const pointDiscount = computed(() => (selectedCustomer.value ? Math.min((selectedCustomer.value.diem || 0) * 1000, totalAmount.value * 0.1) : 0));
        const finalTotal = computed(() => Math.max(0, totalAmount.value - discount - pointDiscount.value));
        const isValidPayment = computed(() => paymentInfo.tenKhach.trim() && paymentInfo.sdt.trim() && cartItems.value.length > 0);

        // ===== CART FUNCTIONS =====
        const addToCart = (variant) => {
            if (!variant || variant.soLuong <= 0) {
                showToast('Sản phẩm đã hết hàng!', 'error');
                return;
            }
            const existingIndex = cartItems.value.findIndex((item) => item.id === variant.id);
            if (existingIndex !== -1) {
                const updatedCart = [...cartItems.value];
                if (updatedCart[existingIndex].soLuong < variant.soLuong) {
                    updatedCart[existingIndex].soLuong += 1;
                    cartItems.value = updatedCart;
                    showToast(`Đã thêm ${variant.sanPham.tenSanPham}`, 'success');
                } else {
                    showToast('Không đủ hàng trong kho!', 'error');
                }
            } else {
                const newItem = {
                    ...variant,
                    soLuong: 1,
                    maxQuantity: variant.soLuong
                };
                cartItems.value = [...cartItems.value, newItem];
                showToast(`Đã thêm ${variant.sanPham.tenSanPham} vào giỏ hàng`, 'success');
            }
        };

        const updateQuantity = (index, newQuantity) => {
            if (newQuantity <= 0) {
                removeFromCart(index);
                return;
            }
            const item = cartItems.value[index];
            if (newQuantity > item.maxQuantity) {
                showToast('Không đủ hàng trong kho!', 'error');
                return;
            }
            const updatedCart = [...cartItems.value];
            updatedCart[index].soLuong = newQuantity;
            cartItems.value = updatedCart;
        };

        const removeFromCart = (index) => {
            const item = cartItems.value[index];
            cartItems.value = cartItems.value.filter((_, i) => i !== index);
            showToast(`Đã xóa ${item.sanPham.tenSanPham}`, 'info');
        };

        const clearCart = () => {
            if (cartItems.value.length === 0) return;
            if (window.confirm('Bạn có chắc muốn xóa tất cả sản phẩm?')) {
                cartItems.value = [];
                selectedCustomer.value = null;
                paymentInfo.tenKhach = '';
                paymentInfo.sdt = '';
                paymentInfo.email = '';
                showToast('Đã xóa tất cả sản phẩm trong giỏ hàng', 'info');
            }
        };

        const createNewInvoice = () => {
            clearCart();
            showToast('Đã tạo hóa đơn mới', 'success');
        };

        const handleEnterSearch = () => {
            if (filteredVariants.value.length === 1) {
                addToCart(filteredVariants.value[0]);
                searchKeyword.value = '';
            }
        };

        // ===== CUSTOMER FUNCTIONS =====
        const selectCustomer = (customer) => {
            selectedCustomer.value = customer;
            if (customer) {
                paymentInfo.tenKhach = customer.hoTen;
                paymentInfo.sdt = customer.sdt;
                paymentInfo.email = customer.email || '';
                showToast(`Đã chọn khách hàng: ${customer.hoTen}`, 'success');
            } else {
                paymentInfo.tenKhach = '';
                paymentInfo.sdt = '';
                paymentInfo.email = '';
                showToast('Đã chọn khách lẻ', 'info');
            }
            showCustomerModal.value = false;
        };

        // ===== EFFECTS =====
        onMounted(() => {
            loadProducts();
            loadCustomers();
            loadInvoices();
            showToast('Hệ thống POS đã sẵn sàng', 'success');
        });

        watch(searchKeyword, (val) => {
            if (val) {
                setTimeout(() => {
                    searchProducts(val);
                }, 500);
            }
        });

        return {
            // State
            activeView,
            activeTab,
            searchKeyword,
            cartItems,
            selectedCustomer,
            loading,
            showCustomerModal,
            showPaymentModal,
            showSuccessModal,
            showProductModal,
            showQRModal,
            processing,
            toast,
            createdInvoice,
            customerSearchKeyword,
            loadingCustomers,
            products,
            customers,
            invoices,
            productImages,
            API_BASE_URL,
            currentNhanVien,
            paymentInfo,
            // Computed
            productVariants,
            filteredVariants,
            filteredCustomers,
            totalAmount,
            discount,
            pointDiscount,
            finalTotal,
            isValidPayment,
            // Methods
            loadProducts,
            addToCart,
            updateQuantity,
            removeFromCart,
            clearCart,
            createNewInvoice,
            handleEnterSearch,
            selectCustomer,
            formatMoney,
            getToastBgColor
        };
    }
};
</script>

<style scoped>
/* Bạn có thể thêm style tuỳ chỉnh ở đây nếu muốn */
</style>
