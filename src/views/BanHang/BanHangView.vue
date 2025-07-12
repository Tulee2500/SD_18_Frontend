<template>
    <div class="pos-container">
        <!-- Header -->
        <div class="header-section">
            <h1 class="page-title">🛒 Quản lý bán hàng</h1>
            <div class="header-actions">
                <button @click="taoHoaDonMoi" class="btn btn-primary"><i class="fas fa-plus"></i> Tạo hóa đơn mới</button>
                <button @click="refreshData" class="btn btn-secondary"><i class="fas fa-sync-alt"></i> Làm mới</button>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Left Panel: Hóa đơn chờ -->
            <div class="left-panel">
                <div class="panel-header">
                    <h3>📋 Hóa đơn chờ ({{ hoaDonChoList.length }})</h3>
                </div>
                <div class="hoa-don-cho-list" v-if="hoaDonChoList.length > 0">
                    <div v-for="hoaDon in hoaDonChoList" :key="hoaDon.id" class="hoa-don-item" :class="{ active: currentInvoice?.id === hoaDon.id }" @click="selectInvoice(hoaDon.id)">
                        <div class="hoa-don-info">
                            <div class="ma-hoa-don">{{ hoaDon.maHoaDon }}</div>
                            <div class="thong-tin">
                                <span class="so-luong">{{ hoaDon.soLuongSanPham }} sản phẩm</span>
                                <span class="tong-tien">{{ formatCurrency(hoaDon.tongTien) }}</span>
                            </div>
                            <div class="khach-hang" v-if="hoaDon.khachHang">👤 {{ hoaDon.khachHang.hoTen }}</div>
                            <div class="ngay-tao">{{ formatDateTime(hoaDon.ngayTao) }}</div>
                        </div>
                        <button @click.stop="deleteInvoice(hoaDon.id)" class="btn-delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div v-else class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Chưa có hóa đơn chờ nào</p>
                </div>
            </div>

            <!-- Center Panel: Chi tiết hóa đơn -->
            <div class="center-panel" v-if="currentInvoice">
                <div class="panel-header">
                    <h3>📄 Chi tiết hóa đơn</h3>
                    <button @click="loadCartSummary" class="btn btn-info btn-sm"><i class="fas fa-chart-line"></i> Tổng quan</button>
                </div>

                <!-- Customer Section -->
                <div class="khach-hang-section">
                    <div class="section-title">👤 Khách hàng</div>
                    <div v-if="selectedCustomer" class="khach-hang-info">
                        <span>{{ selectedCustomer.hoTen }}</span>
                        <span>{{ selectedCustomer.soDienThoai }}</span>
                        <button @click="removeCustomer" class="btn btn-sm btn-outline">Bỏ</button>
                    </div>
                    <div v-else class="khach-hang-select">
                        <button @click="showAddCustomerModal = true" class="btn btn-outline"><i class="fas fa-user-plus"></i> Chọn khách hàng</button>
                    </div>
                </div>

                <!-- Cart Items -->
                <div class="san-pham-section">
                    <div class="section-title">🛍️ Sản phẩm ({{ cartItems.length }})</div>
                    <div v-if="cartItems.length > 0" class="san-pham-list">
                        <div v-for="item in cartItems" :key="item.id" class="san-pham-item">
                            <div class="san-pham-info">
                                <div class="ten-san-pham">{{ item.tenSanPham }}</div>
                                <div class="thuoc-tinh">
                                    <span>{{ item.mauSac }}</span> | <span>{{ item.kichCo }}</span>
                                </div>
                                <div class="gia-tien">{{ formatCurrency(item.donGia) }} x {{ item.soLuong }}</div>
                            </div>
                            <div class="san-pham-actions">
                                <div class="quantity-controls">
                                    <button @click="updateQuantity(item.id, item.soLuong - 1)" class="btn-qty">-</button>
                                    <span class="quantity">{{ item.soLuong }}</span>
                                    <button @click="updateQuantity(item.id, item.soLuong + 1)" class="btn-qty">+</button>
                                </div>
                                <button @click="removeFromCart(item.id)" class="btn-delete-sm">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div v-else class="empty-san-pham">
                        <p>Chưa có sản phẩm nào</p>
                    </div>
                </div>

                <!-- Voucher Section -->
                <div class="voucher-section" v-if="cartSummary">
                    <div class="section-title">🎫 Voucher</div>
                    <div v-if="appliedVoucher" class="voucher-applied">
                        <span>{{ appliedVoucher.tenVoucher }}</span>
                        <span class="giam-gia">-{{ formatCurrency(cartSummary.tongTienVoucher) }}</span>
                        <button @click="removeVoucher" class="btn btn-sm btn-outline">Bỏ</button>
                    </div>
                    <div v-else>
                        <button @click="showVoucherModal = true" class="btn btn-outline"><i class="fas fa-ticket-alt"></i> Áp dụng voucher</button>
                    </div>
                </div>

                <!-- Total Section -->
                <div class="tong-tien-section" v-if="cartSummary">
                    <div class="tong-item">
                        <span>Tổng tiền gốc:</span>
                        <span>{{ formatCurrency(cartSummary.tongTienGoc) }}</span>
                    </div>
                    <div class="tong-item" v-if="cartSummary.tongTienKhuyenMai !== cartSummary.tongTienGoc">
                        <span>Sau khuyến mãi:</span>
                        <span>{{ formatCurrency(cartSummary.tongTienKhuyenMai) }}</span>
                    </div>
                    <div class="tong-item" v-if="cartSummary.tongTienVoucher > 0">
                        <span>Giảm voucher:</span>
                        <span class="giam-gia">-{{ formatCurrency(cartSummary.tongTienVoucher) }}</span>
                    </div>
                    <div class="tong-item final">
                        <span>Tổng thanh toán:</span>
                        <span class="final-amount">{{ formatCurrency(cartSummary.tongTienThanhToan) }}</span>
                    </div>
                </div>

                <!-- Payment Section -->
                <div class="thanh-toan-section">
                    <button @click="showThanhToanModal = true" class="btn btn-success btn-large" :disabled="!cartItems.length"><i class="fas fa-credit-card"></i> Thanh toán</button>
                </div>
            </div>

            <!-- Right Panel: Product List -->
            <div class="right-panel">
                <div class="panel-header">
                    <h3>🛍️ Sản phẩm</h3>
                </div>

                <!-- Search & Filter -->
                <div class="search-section">
                    <div class="search-box">
                        <input v-model="searchForm.keyword" @input="debounceSearch" placeholder="Tìm kiếm sản phẩm..." class="search-input" />
                        <button @click="showScanQR = true" class="btn-scan">
                            <i class="fas fa-qrcode"></i>
                        </button>
                    </div>
                    <div class="filter-section">
                        <select v-model="searchForm.danhMucId" @change="searchProducts">
                            <option value="">Tất cả danh mục</option>
                            <option v-for="dm in danhMucList" :key="dm.id" :value="dm.id">{{ dm.tenDanhMuc }}</option>
                        </select>
                        <select v-model="searchForm.thuongHieuId" @change="searchProducts">
                            <option value="">Tất cả thương hiệu</option>
                            <option v-for="th in thuongHieuList" :key="th.id" :value="th.id">{{ th.tenThuongHieu }}</option>
                        </select>
                    </div>
                </div>

                <!-- Product Grid -->
                <div v-if="loading" class="py-4 text-center">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p class="mt-2">{{ loadingMessage }}</p>
                    </div>
                </div>
                <div v-else class="san-pham-grid">
                    <div v-for="product in products" :key="product.id" class="san-pham-card" @click="addToCart(product)">
                        <div class="san-pham-image">
                            <img :src="product.hinhAnh || 'https://via.placeholder.com/300x200'" :alt="product.tenSanPham" @error="handleImageError" />
                            <div v-if="product.coKhuyenMai" class="sale-badge">-{{ Math.round(product.phanTramGiam) }}%</div>
                        </div>
                        <div class="san-pham-content">
                            <div class="ten-san-pham">{{ product.tenSanPham }}</div>
                            <div class="thuoc-tinh">{{ product.mauSac }} | {{ product.kichCo }}</div>
                            <div class="gia-section">
                                <div v-if="product.coKhuyenMai" class="gia-goc">{{ formatCurrency(product.giaGoc) }}</div>
                                <div class="gia-ban">{{ formatCurrency(product.giaBan) }}</div>
                            </div>
                            <div class="ton-kho">
                                <span :class="getTonKhoClass(product.soLuongTon)">Còn: {{ product.soLuongTon }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <div class="pagination" v-if="pagination.totalPages > 1">
                    <button @click="changePage(pagination.currentPage - 1)" :disabled="pagination.currentPage === 0" class="btn-page"><i class="fas fa-chevron-left"></i></button>
                    <span class="page-info">{{ pagination.currentPage + 1 }} / {{ pagination.totalPages }}</span>
                    <button @click="changePage(pagination.currentPage + 1)" :disabled="pagination.currentPage >= pagination.totalPages - 1" class="btn-page"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <!-- Customer Modal -->
        <div v-if="showAddCustomerModal" class="modal-overlay" @click="showAddCustomerModal = false">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>Chọn khách hàng</h3>
                    <button @click="showAddCustomerModal = false" class="btn-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="search-khach-hang">
                        <input v-model="customerSearch" @input="searchCustomers" placeholder="Tìm kiếm khách hàng..." class="search-input" />
                        <button @click="showCreateCustomerModal = true" class="btn btn-primary">Tạo mới</button>
                    </div>
                    <div class="khach-hang-list">
                        <div v-for="kh in customerResults" :key="kh.id" class="khach-hang-item" @click="selectCustomer(kh.id)">
                            <div class="kh-info">
                                <div class="kh-name">{{ kh.hoTen }}</div>
                                <div class="kh-contact">{{ kh.soDienThoai }} | {{ kh.email }}</div>
                                <div class="kh-diem">Điểm: {{ kh.diemTichLuy || 0 }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Customer Modal -->
        <div v-if="showCreateCustomerModal" class="modal-overlay" @click="showCreateCustomerModal = false">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>Tạo khách hàng mới</h3>
                    <button @click="showCreateCustomerModal = false" class="btn-close">×</button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="createCustomer">
                        <div class="form-group">
                            <label>Họ tên</label>
                            <input v-model="newCustomer.hoTen" class="form-control" required />
                        </div>
                        <div class="form-group">
                            <label>Số điện thoại</label>
                            <input v-model="newCustomer.soDienThoai" class="form-control" required />
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input v-model="newCustomer.email" class="form-control" type="email" />
                        </div>
                        <div class="form-group">
                            <label>Địa chỉ</label>
                            <input v-model="newCustomer.diaChi" class="form-control" />
                        </div>
                        <div class="modal-actions">
                            <button type="button" @click="showCreateCustomerModal = false" class="btn btn-secondary">Hủy</button>
                            <button type="submit" class="btn btn-success">Tạo</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Voucher Modal -->
        <div v-if="showVoucherModal" class="modal-overlay" @click="showVoucherModal = false">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>Chọn voucher</h3>
                    <button @click="showVoucherModal = false" class="btn-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="voucher-list">
                        <div v-for="voucher in availableVouchers" :key="voucher.id" class="voucher-item" @click="selectVoucher(voucher.id)">
                            <div class="voucher-info">
                                <div class="voucher-name">{{ voucher.tenVoucher }}</div>
                                <div class="voucher-desc">{{ voucher.maVoucher }}</div>
                                <div class="voucher-value">Giảm {{ formatCurrency(voucher.giaTriGiamToiDa) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Payment Modal -->
        <div v-if="showThanhToanModal" class="modal-overlay" @click="showThanhToanModal = false">
            <div class="modal-content modal-large" @click.stop>
                <div class="modal-header">
                    <h3>Thanh toán</h3>
                    <button @click="showThanhToanModal = false" class="btn-close">×</button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="processPayment">
                        <div class="form-group">
                            <label>Phương thức thanh toán:</label>
                            <select v-model="paymentMethod" required class="form-control">
                                <option value="TIEN_MAT">Tiền mặt</option>
                                <option value="CHUYEN_KHOAN">Chuyển khoản</option>
                                <option value="THE">Thẻ</option>
                            </select>
                        </div>
                        <div class="form-group" v-if="paymentMethod === 'TIEN_MAT'">
                            <label>Tiền khách đưa:</label>
                            <input v-model.number="customerPaid" type="number" min="0" step="1000" class="form-control" />
                        </div>
                        <div class="form-group">
                            <label>Giảm thêm:</label>
                            <input v-model.number="extraDiscount" type="number" min="0" step="1000" class="form-control" />
                        </div>
                        <div class="form-group">
                            <label>Ghi chú:</label>
                            <textarea v-model="thanhToanForm.ghiChu" class="form-control" rows="3"></textarea>
                        </div>
                        <div class="thanh-toan-summary">
                            <div class="summary-item">
                                <span>Tổng tiền:</span>
                                <span>{{ formatCurrency(cartSummary?.tongTienThanhToan || 0) }}</span>
                            </div>
                            <div class="summary-item" v-if="customerPaid">
                                <span>Tiền khách đưa:</span>
                                <span>{{ formatCurrency(customerPaid) }}</span>
                            </div>
                            <div class="summary-item" v-if="tienThua > 0">
                                <span>Tiền thừa:</span>
                                <span class="tien-thua">{{ formatCurrency(tienThua) }}</span>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button type="button" @click="showThanhToanModal = false" class="btn btn-secondary">Hủy</button>
                            <button type="submit" class="btn btn-success"><i class="fas fa-credit-card"></i> Thanh toán</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Toast Messages -->
        <div class="toast-container">
            <div v-for="toast in toasts" :key="toast.id" :class="['toast', `toast-${toast.type}`]">
                <i :class="getToastIcon(toast.type)"></i>
                <span>{{ toast.message }}</span>
                <button @click="removeToast(toast.id)" class="toast-close">×</button>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import { computed, onMounted, reactive, ref, watch } from 'vue';

export default {
    name: 'POSComponent',
    setup() {
        // API Configuration
        const API_BASE = 'http://localhost:8080/api/ban-hang';
        const apiClient = axios.create({
            baseURL: API_BASE,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // API Service Functions
        const banHangService = {
            async timKiemSanPham(params = {}) {
                const response = await apiClient.get('/san-pham', { params });
                return response.data;
            },
            async layDanhMucActive() {
                const response = await apiClient.get('/danh-muc/active');
                return response.data;
            },
            async layThuongHieuActive() {
                const response = await apiClient.get('/thuong-hieu/active');
                return response.data;
            },
            async layDanhSachHoaDonCho() {
                const response = await apiClient.get('/hoa-don-cho');
                return response.data;
            },
            async taoHoaDonCho(nhanVienId) {
                const response = await apiClient.post('/hoa-don-cho/tao-moi', null, {
                    params: { nhanVienId }
                });
                return response.data;
            },
            async xoaHoaDonCho(id) {
                const response = await apiClient.delete(`/hoa-don-cho/${id}`);
                return response.data;
            },
            async layChiTietHoaDonCho(id) {
                const response = await apiClient.get(`/hoa-don-cho/${id}`);
                return response.data;
            },
            async layTongQuanHoaDonCho(id) {
                const response = await apiClient.get(`/hoa-don-cho/${id}/tong-quan`);
                return response.data;
            },
            async themSanPhamVaoHoaDon(hoaDonId, request) {
                const response = await apiClient.post(`/hoa-don-cho/${hoaDonId}/them-san-pham`, request);
                return response.data;
            },
            async capNhatSanPhamTrongHoaDon(hoaDonId, chiTietId, request) {
                const response = await apiClient.put(`/hoa-don-cho/${hoaDonId}/cap-nhat-san-pham/${chiTietId}`, request);
                return response.data;
            },
            async xoaSanPhamKhoiHoaDon(hoaDonId, chiTietId) {
                const response = await apiClient.delete(`/hoa-don-cho/${hoaDonId}/xoa-san-pham/${chiTietId}`);
                return response.data;
            },
            async timKiemKhachHang(params = {}) {
                const response = await apiClient.get('/khach-hang/search', { params });
                return response.data;
            },
            async taoKhachHangNhanh(request) {
                const response = await apiClient.post('/khach-hang/tao-nhanh', request);
                return response.data;
            },
            async apDungKhachHang(hoaDonId, khachHangId) {
                const response = await apiClient.post(`/hoa-don-cho/${hoaDonId}/ap-dung-khach-hang/${khachHangId}`);
                return response.data;
            },
            async boKhachHang(hoaDonId) {
                const response = await apiClient.delete(`/hoa-don-cho/${hoaDonId}/bo-khach-hang`);
                return response.data;
            },
            async layDanhSachVoucherKhaDung(khachHangId, tongTien) {
                const response = await apiClient.get('/voucher/kha-dung', {
                    params: { khachHangId, tongTien }
                });
                return response.data;
            },
            async apDungVoucher(hoaDonId, voucherId) {
                const response = await apiClient.post(`/hoa-don-cho/${hoaDonId}/ap-dung-voucher/${voucherId}`);
                return response.data;
            },
            async boVoucher(hoaDonId) {
                const response = await apiClient.delete(`/hoa-don-cho/${hoaDonId}/bo-voucher`);
                return response.data;
            },
            async thanhToanHoaDon(hoaDonId, request) {
                const response = await apiClient.post(`/hoa-don-cho/${hoaDonId}/thanh-toan`, request);
                return response.data;
            }
        };

        // Reactive Data
        const loading = ref(false);
        const loadingMessage = ref('');
        const toasts = ref([]);
        const products = ref([]);
        const hoaDonChoList = ref([]);
        const currentInvoice = ref(null);
        const cartItems = ref([]);
        const cartSummary = ref(null);

        // UI State
        const showAddCustomerModal = ref(false);
        const showCreateCustomerModal = ref(false);
        const showVoucherModal = ref(false);
        const showThanhToanModal = ref(false);
        const showScanQR = ref(false);

        // Search & Filter
        const searchForm = reactive({
            keyword: '',
            danhMucId: '',
            thuongHieuId: '',
            page: 0,
            size: 20
        });
        const danhMucList = ref([]);
        const thuongHieuList = ref([]);
        const pagination = ref({
            currentPage: 0,
            totalPages: 0,
            totalElements: 0
        });

        // Customer Data
        const customerSearch = ref('');
        const customerResults = ref([]);
        const selectedCustomer = ref(null);
        const newCustomer = reactive({
            hoTen: '',
            soDienThoai: '',
            email: '',
            diaChi: ''
        });

        // Voucher Data
        const appliedVoucher = ref(null);
        const availableVouchers = ref([]);

        // Payment Data
        const paymentMethod = ref('TIEN_MAT');
        const customerPaid = ref(0);
        const extraDiscount = ref(0);
        const thanhToanForm = reactive({
            ghiChu: '',
            loaiHoaDon: 'OFFLINE'
        });

        // Computed
        const tienThua = computed(() => {
            if (!customerPaid.value || !cartSummary.value) return 0;
            return Math.max(0, customerPaid.value - cartSummary.value.tongTienThanhToan);
        });

        // Methods
        const showToast = (message, type = 'info') => {
            const id = Date.now();
            toasts.value.push({ id, message, type });
            setTimeout(() => removeToast(id), 5000);
        };

        const removeToast = (id) => {
            const index = toasts.value.findIndex((toast) => toast.id === id);
            if (index > -1) toasts.value.splice(index, 1);
        };

        const getToastIcon = (type) => {
            const icons = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-info-circle'
            };
            return icons[type] || icons.info;
        };

        const formatCurrency = (amount) => {
            if (amount == null) return '0 ₫';
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(amount);
        };

        const formatDateTime = (dateString) => {
            if (!dateString) return '';
            return new Date(dateString).toLocaleString('vi-VN');
        };

        const getTonKhoClass = (soLuong) => {
            if (soLuong === 0) return 'text-danger';
            if (soLuong <= 10) return 'text-warning';
            return 'text-success';
        };

        const handleImageError = (event) => {
            event.target.src = 'https://via.placeholder.com/300x200';
        };

        // Product Methods
        const searchProducts = async () => {
            try {
                loading.value = true;
                loadingMessage.value = 'Đang tìm kiếm sản phẩm...';

                const params = {
                    keyword: searchForm.keyword,
                    danhMucId: searchForm.danhMucId || null,
                    thuongHieuId: searchForm.thuongHieuId || null,
                    page: searchForm.page,
                    size: searchForm.size
                };

                const response = await banHangService.timKiemSanPham(params);
                if (response.success) {
                    products.value = response.data;
                    pagination.value = {
                        currentPage: response.currentPage,
                        totalPages: response.totalPages,
                        totalElements: response.totalElements
                    };
                } else {
                    showToast(response.message || 'Lỗi tìm kiếm sản phẩm', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi tìm kiếm sản phẩm', 'error');
                console.error('Lỗi tìm kiếm sản phẩm:', error);
            } finally {
                loading.value = false;
                loadingMessage.value = '';
            }
        };

        let searchTimeout;
        const debounceSearch = () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchForm.page = 0;
                searchProducts();
            }, 500);
        };

        const changePage = (page) => {
            if (page >= 0 && page < pagination.value.totalPages) {
                searchForm.page = page;
                searchProducts();
            }
        };

        const loadDanhMuc = async () => {
            try {
                const response = await banHangService.layDanhMucActive();
                if (response.success) {
                    danhMucList.value = response.data;
                } else {
                    showToast(response.message || 'Lỗi tải danh mục', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi tải danh mục', 'error');
                console.error(error);
            }
        };

        const loadThuongHieu = async () => {
            try {
                const response = await banHangService.layThuongHieuActive();
                if (response.success) {
                    thuongHieuList.value = response.data;
                } else {
                    showToast(response.message || 'Lỗi tải thương hiệu', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi tải thương hiệu', 'error');
                console.error(error);
            }
        };

        // Invoice Methods
        const loadHoaDonCho = async () => {
            try {
                loading.value = true;
                loadingMessage.value = 'Đang tải hóa đơn chờ...';
                const response = await banHangService.layDanhSachHoaDonCho();
                if (response.success) {
                    hoaDonChoList.value = response.data;
                } else {
                    showToast(response.message || 'Lỗi tải hóa đơn chờ', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi tải hóa đơn chờ', 'error');
                console.error(error);
            } finally {
                loading.value = false;
                loadingMessage.value = '';
            }
        };

        const taoHoaDonMoi = async () => {
            try {
                loading.value = true;
                loadingMessage.value = 'Đang tạo hóa đơn mới...';
                const response = await banHangService.taoHoaDonCho(1); // Giả sử nhanVienId = 1
                if (response.success) {
                    showToast('Tạo hóa đơn chờ thành công', 'success');
                    await loadHoaDonCho();
                    selectInvoice(response.data.id);
                } else {
                    showToast(response.message || 'Lỗi tạo hóa đơn', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi tạo hóa đơn', 'error');
                console.error(error);
            } finally {
                loading.value = false;
                loadingMessage.value = '';
            }
        };

        const selectInvoice = async (id) => {
            try {
                const response = await banHangService.layChiTietHoaDonCho(id);
                if (response.success) {
                    currentInvoice.value = response.data;
                    cartItems.value = response.data.chiTiets || [];
                    selectedCustomer.value = response.data.khachHang;
                    await loadCartSummary();
                } else {
                    showToast(response.message || 'Lỗi tải chi tiết hóa đơn', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi tải chi tiết hóa đơn', 'error');
                console.error(error);
            }
        };

        const deleteInvoice = async (id) => {
            if (!confirm('Bạn có chắc muốn xóa hóa đơn này?')) return;
            try {
                loading.value = true;
                const response = await banHangService.xoaHoaDonCho(id);
                if (response.success) {
                    showToast('Xóa hóa đơn thành công', 'success');
                    await loadHoaDonCho();
                    if (currentInvoice.value?.id === id) {
                        currentInvoice.value = null;
                        cartItems.value = [];
                        cartSummary.value = null;
                        selectedCustomer.value = null;
                    }
                } else {
                    showToast(response.message || 'Lỗi xóa hóa đơn', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi xóa hóa đơn', 'error');
                console.error(error);
            } finally {
                loading.value = false;
            }
        };

        const loadCartSummary = async () => {
            if (!currentInvoice.value) return;
            try {
                const response = await banHangService.layTongQuanHoaDonCho(currentInvoice.value.id);
                if (response.success) {
                    cartSummary.value = response.data;
                    appliedVoucher.value = response.data.voucher;
                } else {
                    showToast(response.message || 'Lỗi tải tổng quan hóa đơn', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi tải tổng quan hóa đơn', 'error');
                console.error(error);
            }
        };

        // Cart Methods
        const addToCart = async (product) => {
            if (!currentInvoice.value) {
                showToast('Vui lòng chọn hoặc tạo hóa đơn mới', 'warning');
                return;
            }
            if (product.soLuongTon <= 0) {
                showToast('Sản phẩm đã hết hàng', 'error');
                return;
            }
            try {
                loading.value = true;
                loadingMessage.value = 'Đang thêm sản phẩm...';
                const request = {
                    chiTietSanPhamId: product.id,
                    soLuong: 1,
                    donGia: product.giaBan
                };
                const response = await banHangService.themSanPhamVaoHoaDon(currentInvoice.value.id, request);
                if (response.success) {
                    showToast('Thêm sản phẩm thành công', 'success');
                    await selectInvoice(currentInvoice.value.id);
                    await loadHoaDonCho();
                } else {
                    showToast(response.message || 'Lỗi thêm sản phẩm', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi thêm sản phẩm', 'error');
                console.error(error);
            } finally {
                loading.value = false;
                loadingMessage.value = '';
            }
        };

        const updateQuantity = async (chiTietId, soLuongMoi) => {
            if (soLuongMoi <= 0) {
                await removeFromCart(chiTietId);
                return;
            }
            try {
                loading.value = true;
                const request = { soLuong: soLuongMoi };
                const response = await banHangService.capNhatSanPhamTrongHoaDon(currentInvoice.value.id, chiTietId, request);
                if (response.success) {
                    await selectInvoice(currentInvoice.value.id);
                    await loadHoaDonCho();
                } else {
                    showToast(response.message || 'Lỗi cập nhật số lượng', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi cập nhật số lượng', 'error');
                console.error(error);
            } finally {
                loading.value = false;
            }
        };

        const removeFromCart = async (chiTietId) => {
            if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
            try {
                loading.value = true;
                const response = await banHangService.xoaSanPhamKhoiHoaDon(currentInvoice.value.id, chiTietId);
                if (response.success) {
                    showToast('Xóa sản phẩm thành công', 'success');
                    await selectInvoice(currentInvoice.value.id);
                    await loadHoaDonCho();
                } else {
                    showToast(response.message || 'Lỗi xóa sản phẩm', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi xóa sản phẩm', 'error');
                console.error(error);
            } finally {
                loading.value = false;
            }
        };

        // Customer Methods
        const searchCustomers = async () => {
            try {
                const response = await banHangService.timKiemKhachHang({
                    keyword: customerSearch.value,
                    page: 0,
                    size: 10
                });
                if (response.success) {
                    customerResults.value = response.data;
                } else {
                    showToast(response.message || 'Lỗi tìm kiếm khách hàng', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi tìm kiếm khách hàng', 'error');
                console.error(error);
            }
        };

        const selectCustomer = async (khachHangId) => {
            try {
                loading.value = true;
                const response = await banHangService.apDungKhachHang(currentInvoice.value.id, khachHangId);
                if (response.success) {
                    showToast('Chọn khách hàng thành công', 'success');
                    showAddCustomerModal.value = false;
                    await selectInvoice(currentInvoice.value.id);
                } else {
                    showToast(response.message || 'Lỗi chọn khách hàng', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi chọn khách hàng', 'error');
                console.error(error);
            } finally {
                loading.value = false;
            }
        };

        const removeCustomer = async () => {
            try {
                loading.value = true;
                const response = await banHangService.boKhachHang(currentInvoice.value.id);
                if (response.success) {
                    showToast('Bỏ khách hàng thành công', 'success');
                    await selectInvoice(currentInvoice.value.id);
                } else {
                    showToast(response.message || 'Lỗi bỏ khách hàng', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi bỏ khách hàng', 'error');
                console.error(error);
            } finally {
                loading.value = false;
            }
        };

        const createCustomer = async () => {
            try {
                loading.value = true;
                const response = await banHangService.taoKhachHangNhanh(newCustomer);
                if (response.success) {
                    showToast('Tạo khách hàng thành công', 'success');
                    showCreateCustomerModal.value = false;
                    Object.assign(newCustomer, { hoTen: '', soDienThoai: '', email: '', diaChi: '' });
                    await selectCustomer(response.data.id);
                } else {
                    showToast(response.message || 'Lỗi tạo khách hàng', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi tạo khách hàng', 'error');
                console.error(error);
            } finally {
                loading.value = false;
            }
        };

        // Voucher Methods
        const loadAvailableVouchers = async () => {
            if (!currentInvoice.value) return;
            try {
                const khachHangId = selectedCustomer.value?.id;
                const tongTien = cartSummary.value?.tongTienKhuyenMai || 0;
                const response = await banHangService.layDanhSachVoucherKhaDung(khachHangId, tongTien);
                if (response.success) {
                    availableVouchers.value = response.data;
                } else {
                    showToast(response.message || 'Lỗi tải voucher', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi tải voucher', 'error');
                console.error(error);
            }
        };

        const selectVoucher = async (voucherId) => {
            try {
                loading.value = true;
                const response = await banHangService.apDungVoucher(currentInvoice.value.id, voucherId);
                if (response.success) {
                    showToast('Áp dụng voucher thành công', 'success');
                    showVoucherModal.value = false;
                    await loadCartSummary();
                } else {
                    showToast(response.message || 'Lỗi áp dụng voucher', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi áp dụng voucher', 'error');
                console.error(error);
            } finally {
                loading.value = false;
            }
        };

        const removeVoucher = async () => {
            try {
                loading.value = true;
                const response = await banHangService.boVoucher(currentInvoice.value.id);
                if (response.success) {
                    showToast('Bỏ voucher thành công', 'success');
                    await loadCartSummary();
                } else {
                    showToast(response.message || 'Lỗi bỏ voucher', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi bỏ voucher', 'error');
                console.error(error);
            } finally {
                loading.value = false;
            }
        };

        // Payment Methods
        const processPayment = async () => {
            try {
                loading.value = true;
                loadingMessage.value = 'Đang xử lý thanh toán...';
                const request = {
                    khachHangId: selectedCustomer.value?.id,
                    phuongThucThanhToan: paymentMethod.value,
                    tienMat: paymentMethod.value === 'TIEN_MAT' ? customerPaid.value : 0,
                    giamThem: extraDiscount.value,
                    ghiChu: thanhToanForm.ghiChu,
                    loaiHoaDon: thanhToanForm.loaiHoaDon
                };
                const response = await banHangService.thanhToanHoaDon(currentInvoice.value.id, request);
                if (response.success) {
                    showToast('Thanh toán thành công', 'success');
                    showThanhToanModal.value = false;
                    Object.assign(thanhToanForm, { ghiChu: '', loaiHoaDon: 'OFFLINE' });
                    customerPaid.value = 0;
                    extraDiscount.value = 0;
                    await loadHoaDonCho();
                    currentInvoice.value = null;
                    cartItems.value = [];
                    cartSummary.value = null;
                    selectedCustomer.value = null;
                    if (confirm('Thanh toán thành công! Bạn có muốn in hóa đơn?')) {
                        console.log('Print invoice:', response.data.id);
                    }
                } else {
                    showToast(response.message || 'Lỗi thanh toán', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi thanh toán', 'error');
                console.error(error);
            } finally {
                loading.value = false;
                loadingMessage.value = '';
            }
        };

        const refreshData = async () => {
            try {
                loading.value = true;
                loadingMessage.value = 'Đang làm mới dữ liệu...';
                await Promise.all([loadDanhMuc(), loadThuongHieu(), searchProducts(), loadHoaDonCho(), currentInvoice.value ? selectInvoice(currentInvoice.value.id) : Promise.resolve()]);
            } catch (error) {
                showToast('Lỗi khi làm mới dữ liệu', 'error');
                console.error(error);
            } finally {
                loading.value = false;
                loadingMessage.value = '';
            }
        };

        // Watchers
        watch(
            () => searchForm.keyword,
            () => {
                debounceSearch();
            }
        );

        watch(showVoucherModal, (newVal) => {
            if (newVal) {
                loadAvailableVouchers();
            }
        });

        watch(showAddCustomerModal, (newVal) => {
            if (newVal) {
                customerSearch.value = '';
                searchCustomers();
            }
        });

        // Lifecycle
        onMounted(async () => {
            try {
                loading.value = true;
                loadingMessage.value = 'Đang tải dữ liệu...';
                await Promise.all([loadDanhMuc(), loadThuongHieu(), searchProducts(), loadHoaDonCho()]);
            } catch (error) {
                showToast('Lỗi khi tải dữ liệu ban đầu', 'error');
                console.error(error);
            } finally {
                loading.value = false;
                loadingMessage.value = '';
            }
        });

        return {
            loading,
            loadingMessage,
            toasts,
            products,
            hoaDonChoList,
            currentInvoice,
            cartItems,
            cartSummary,
            showAddCustomerModal,
            showCreateCustomerModal,
            showVoucherModal,
            showThanhToanModal,
            showScanQR,
            searchForm,
            danhMucList,
            thuongHieuList,
            pagination,
            customerSearch,
            customerResults,
            selectedCustomer,
            newCustomer,
            appliedVoucher,
            availableVouchers,
            paymentMethod,
            customerPaid,
            extraDiscount,
            thanhToanForm,
            tienThua,
            showToast,
            removeToast,
            getToastIcon,
            formatCurrency,
            formatDateTime,
            getTonKhoClass,
            handleImageError,
            searchProducts,
            debounceSearch,
            changePage,
            loadDanhMuc,
            loadThuongHieu,
            loadHoaDonCho,
            taoHoaDonMoi,
            selectInvoice,
            deleteInvoice,
            loadCartSummary,
            addToCart,
            updateQuantity,
            removeFromCart,
            searchCustomers,
            selectCustomer,
            removeCustomer,
            createCustomer,
            loadAvailableVouchers,
            selectVoucher,
            removeVoucher,
            processPayment,
            refreshData
        };
    }
};
</script>

<style scoped>
/* Container */
.pos-container {
    padding: 20px;
    background: #f5f5f5;
    min-height: 100vh;
}

/* Header */
.header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-title {
    margin: 0;
    color: #2c3e50;
    font-size: 24px;
    font-weight: 600;
}

.header-actions {
    display: flex;
    gap: 12px;
}

/* Main Layout */
.main-content {
    display: grid;
    grid-template-columns: 300px 1fr 400px;
    gap: 20px;
    height: calc(100vh - 120px);
}

/* Panels */
.left-panel,
.center-panel,
.right-panel {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.panel-header {
    padding: 16px 20px;
    border-bottom: 1px solid #e9ecef;
    background: #f8f9fa;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.panel-header h3 {
    margin: 0;
    color: #495057;
    font-size: 16px;
    font-weight: 600;
}

/* Left Panel - Hóa đơn chờ */
.hoa-don-cho-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
}

.hoa-don-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.hoa-don-item:hover {
    border-color: #007bff;
    background: #f8f9fa;
}

.hoa-don-item.active {
    border-color: #007bff;
    background: #e3f2fd;
}

.hoa-don-info {
    flex: 1;
}

.ma-hoa-don {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 4px;
}

.thong-tin {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #6c757d;
    margin-bottom: 4px;
}

.khach-hang {
    font-size: 13px;
    color: #28a745;
    margin-bottom: 4px;
}

.ngay-tao {
    font-size: 12px;
    color: #6c757d;
}

.btn-delete {
    background: none;
    border: none;
    color: #dc3545;
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    transition: background 0.2s;
}

.btn-delete:hover {
    background: #f8d7da;
}

/* Center Panel */
.center-panel {
    overflow-y: auto;
}

.section-title {
    font-weight: 600;
    color: #495057;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e9ecef;
}

.khach-hang-section,
.san-pham-section,
.voucher-section,
.tong-tien-section,
.thanh-toan-section {
    padding: 16px 20px;
    border-bottom: 1px solid #e9ecef;
}

.khach-hang-info,
.khach-hang-select {
    display: flex;
    align-items: center;
    gap: 12px;
}

.san-pham-list {
    max-height: 300px;
    overflow-y: auto;
}

.san-pham-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    margin-bottom: 8px;
}

.san-pham-info {
    flex: 1;
}

.ten-san-pham {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 4px;
}

.thuoc-tinh {
    font-size: 14px;
    color: #6c757d;
    margin-bottom: 4px;
}

.gia-tien {
    font-weight: 600;
    color: #28a745;
}

.san-pham-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.quantity-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 4px;
}

.btn-qty {
    background: none;
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-qty:hover {
    background: #e9ecef;
}

.quantity {
    min-width: 30px;
    text-align: center;
    font-weight: 600;
}

.btn-delete-sm {
    background: none;
    border: none;
    color: #dc3545;
    padding: 6px;
    border-radius: 4px;
    cursor: pointer;
}

.tong-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
}

.tong-item.final {
    font-weight: 600;
    font-size: 16px;
    color: #2c3e50;
    border-top: 1px solid #e9ecef;
    padding-top: 8px;
    margin-top: 8px;
}

.final-amount {
    color: #28a745;
}

.giam-gia {
    color: #dc3545;
}

/* Right Panel - Sản phẩm */
.search-section {
    padding: 16px 20px;
    border-bottom: 1px solid #e9ecef;
}

.search-box {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.search-input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    font-size: 14px;
}

.search-input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.btn-scan {
    background: #17a2b8;
    color: white;
    border: none;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
}

.filter-section {
    display: flex;
    gap: 8px;
}

.filter-section select {
    flex: 1;
    padding: 8px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    font-size: 14px;
}

.san-pham-grid {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
}

.san-pham-card {
    border: 1px solid #e9ecef;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
}

.san-pham-card:hover {
    border-color: #007bff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.san-pham-image {
    position: relative;
    height: 120px;
    overflow: hidden;
}

.san-pham-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.sale-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #dc3545;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
}

.san-pham-content {
    padding: 12px;
}

.gia-section {
    margin: 8px 0;
}

.gia-goc {
    text-decoration: line-through;
    color: #6c757d;
    font-size: 12px;
}

.gia-ban {
    font-weight: 600;
    color: #28a745;
    font-size: 14px;
}

.ton-kho {
    font-size: 12px;
}

.text-danger {
    color: #dc3545 !important;
}
.text-warning {
    color: #ffc107 !important;
}
.text-success {
    color: #28a745 !important;
}

/* Pagination */
.pagination {
    padding: 16px 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    border-top: 1px solid #e9ecef;
}

.btn-page {
    background: none;
    border: 1px solid #e9ecef;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
}

.btn-page:hover:not(:disabled) {
    background: #e9ecef;
}

.btn-page:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-info {
    font-weight: 600;
    color: #495057;
}

/* Buttons */
.btn {
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.btn-primary {
    background: #007bff;
    color: white;
}

.btn-primary:hover {
    background: #0056b3;
}

.btn-secondary {
    background: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background: #545b62;
}

.btn-success {
    background: #28a745;
    color: white;
}

.btn-success:hover {
    background: #1e7e34;
}

.btn-info {
    background: #17a2b8;
    color: white;
}

.btn-outline {
    background: none;
    border: 1px solid #e9ecef;
    color: #495057;
}

.btn-outline:hover {
    background: #e9ecef;
}

.btn-sm {
    padding: 6px 12px;
    font-size: 12px;
}

.btn-large {
    padding: 16px 24px;
    font-size: 16px;
    width: 100%;
    justify-content: center;
}

/* Modals */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.modal-large {
    max-width: 600px;
}

.modal-header {
    padding: 20px;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    margin: 0;
}

.btn-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6c757d;
}

.modal-body {
    padding: 20px;
    flex: 1;
    overflow-y: auto;
}

.modal-actions {
    padding: 20px;
    border-top: 1px solid #e9ecef;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* Forms */
.form-group {
    margin-bottom: 16px;
}

.form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #495057;
}

.form-control {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    font-size: 14px;
}

.form-control:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* Lists */
.khach-hang-list,
.voucher-list {
    max-height: 300px;
    overflow-y: auto;
}

.khach-hang-item,
.voucher-item {
    padding: 12px;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.khach-hang-item:hover,
.voucher-item:hover {
    border-color: #007bff;
    background: #f8f9fa;
}

/* Loading */
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.loading-spinner {
    text-align: center;
}

.loading-spinner i {
    font-size: 24px;
    color: #007bff;
    margin-bottom: 12px;
}

/* Toast */
.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 3000;
}

.toast {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    margin-bottom: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    animation: slideIn 0.3s ease;
}

.toast-success {
    border-left: 4px solid #28a745;
}
.toast-error {
    border-left: 4px solid #dc3545;
}
.toast-warning {
    border-left: 4px solid #ffc107;
}
.toast-info {
    border-left: 4px solid #17a2b8;
}

.toast-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #6c757d;
    margin-left: auto;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Empty states */
.empty-state,
.empty-san-pham {
    text-align: center;
    padding: 40px 20px;
    color: #6c757d;
}

.empty-state i {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
}

/* Summary section in thanh toan modal */
.thanh-toan-summary {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    margin: 20px 0;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
}

.summary-item:last-child {
    margin-bottom: 0;
    font-weight: 600;
    font-size: 16px;
    padding-top: 8px;
    border-top: 1px solid #dee2e6;
}

.tien-thua {
    color: #28a745;
    font-weight: 600;
}

/* Voucher section styling */
.voucher-applied {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: #d4edda;
    border: 1px solid #c3e6cb;
    border-radius: 6px;
}

.voucher-info {
    flex: 1;
}

.voucher-name {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 4px;
}

.voucher-desc {
    font-size: 12px;
    color: #6c757d;
    margin-bottom: 4px;
}

.voucher-value {
    font-size: 14px;
    color: #28a745;
    font-weight: 600;
}

/* Search khach hang section */
.search-khach-hang {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
}

.search-khach-hang .search-input {
    flex: 1;
}

/* Khach hang item details */
.kh-info {
    flex: 1;
}

.kh-name {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 4px;
}

.kh-contact {
    font-size: 14px;
    color: #6c757d;
    margin-bottom: 4px;
}

.kh-diem {
    font-size: 12px;
    color: #28a745;
}

/* Responsive */
@media (max-width: 1200px) {
    .main-content {
        grid-template-columns: 280px 1fr 350px;
    }
}

@media (max-width: 768px) {
    .main-content {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto;
        height: auto;
    }

    .left-panel,
    .center-panel,
    .right-panel {
        height: 400px;
    }

    .san-pham-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }
}

@media (max-width: 480px) {
    .header-section {
        flex-direction: column;
        gap: 12px;
        text-align: center;
    }

    .header-actions {
        justify-content: center;
    }

    .san-pham-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 8px;
    }

    .modal-content {
        margin: 20px;
        max-width: none;
        width: auto;
    }
}
</style>
