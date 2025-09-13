<script>
import { computed, nextTick, onMounted, ref, watch } from 'vue';

// Load jsQR từ CDN
const loadJsQRFromCDN = () => {
    return new Promise((resolve, reject) => {
        if (window.jsQR && typeof window.jsQR === 'function') {
            console.log('jsQR already loaded');
            resolve(window.jsQR);
            return;
        }

        console.log('Loading jsQR from CDN...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';

        script.onload = () => {
            console.log('jsQR CDN loaded successfully');
            if (window.jsQR && typeof window.jsQR === 'function') {
                resolve(window.jsQR);
            } else {
                reject(new Error('jsQR not found after loading'));
            }
        };

        script.onerror = (error) => {
            console.error('Failed to load jsQR from CDN:', error);
            reject(new Error('Failed to load jsQR library'));
        };

        document.head.appendChild(script);
    });
};

export default {
    name: 'BanHangTaiQuay',
    setup() {
        // =================== CONSTANTS ===================
        const API_BASE_URL = 'http://localhost:8080/api/ban-hang';

        // =================== REFS ===================
        const nhanVienInfo = ref({
            tenNhanVien: 'Nguyễn Văn A',
            maNhanVien: 'NV001'
        });

        // QR Scanner refs
        const qrStream = ref(null);
        const scanInterval = ref(null);
        const qrInput = ref(null);

        // Invoice & Products
        const hoaDonCho = ref([]);
        const hoaDonDangChon = ref(null);
        const danhSachSanPham = ref([]);
        const sanPhamDaChon = ref([]);
        const khachHang = ref(null);
        const voucher = ref(null);

        // UI States
        const loading = ref(false);
        const error = ref('');
        const searchKeyword = ref('');
        const customerSearchKeyword = ref('');
        const voucherCode = ref('');
        const soLuongChon = ref(1);
        const qrCode = ref('');

        // Pagination
        const trangHienTai = ref(0);
        const tongSoTrang = ref(0);
        const tongSoPhanTu = ref(0);

        // Modals
        const showCustomerModal = ref(false);
        const showVoucherModal = ref(false);
        const showPaymentModal = ref(false);
        const showProductDetail = ref(false);
        const showProductModal = ref(false);
        const showQrScanner = ref(false);
        const showCreateCustomerForm = ref(false);
        const showInvoicePrint = ref(false);
        const sanPhamDangXem = ref(null);

        // Loading states
        const loadingCustomers = ref(false);
        const loadingVouchers = ref(false);
        const loadingCreateCustomer = ref(false);
        const loadingVoucherCheck = ref(false);
        const loadingPayment = ref(false);
        const loadingDelete = ref(null);
        const loadingCreateInvoice = ref(false);

        // QR Scanner states
        const qrMode = ref('manual');
        const cameraError = ref('');
        const cameraStarted = ref(false);
        const loadingQR = ref(false);

        // Toast
        const showToast = ref(false);
        const toastMessage = ref('');
        const toastType = ref('success');

        // Filters
        const filters = ref({
            danhMucId: '',
            thuongHieuId: '',
            minPrice: '',
            maxPrice: ''
        });

        // Master data
        const danhSachDanhMuc = ref([]);
        const danhSachThuongHieu = ref([]);
        const danhSachKhachHang = ref([]);
        const danhSachVoucher = ref([]);

        // Forms
        const newCustomer = ref({
            hoTen: '',
            sdt: '',
            email: '',
            diaChi: ''
        });
        const newCustomerErrors = ref({});

        // Payment
        const thongTinThanhToan = ref({
            tienMat: 0,
            chuyenKhoan: 0,
            ghiChu: '',
            diemSuDung: 0
        });
        const quickAmounts = ref([1000000, 2000000, 3000000, 5000000, 10000000]);

        // Invoice print data
        const hoaDonDaThanhToan = ref(null);
        const sanPhamDaThanhToan = ref([]);
        const tongQuanDaThanhToan = ref({});
        const voucherDaThanhToan = ref(null);
        const thongTinThanhToanCuoi = ref({});

        // =================== COMPUTED ===================
        const tongQuan = computed(() => {
            if (!sanPhamDaChon.value.length) {
                return {
                    soLuongSanPham: 0,
                    tongSoLuong: 0,
                    tongTienGoc: 0,
                    tongTienKhuyenMai: 0,
                    tongTienVoucher: 0,
                    tongTienThanhToan: 0
                };
            }

            const soLuongSanPham = sanPhamDaChon.value.length;
            const tongSoLuong = sanPhamDaChon.value.reduce((sum, item) => {
                return sum + (Number(item.soLuongDaChon) || 0);
            }, 0);

            const tongTienGoc = sanPhamDaChon.value.reduce((sum, item) => {
                const soLuong = Number(item.soLuongDaChon) || 0;
                const gia = Number(item.giaGoc || item.giaBan) || 0;
                return sum + gia * soLuong;
            }, 0);

            const tongTienKhuyenMai = sanPhamDaChon.value.reduce((sum, item) => {
                const soLuong = Number(item.soLuongDaChon) || 0;
                const gia = Number(item.giaBan) || 0;
                return sum + gia * soLuong;
            }, 0);

            const tongTienVoucher = voucher.value ? Number(voucher.value.giaTriGiam) || 0 : 0;
            const tongTienThanhToan = Math.max(0, tongTienKhuyenMai - tongTienVoucher);

            return {
                soLuongSanPham,
                tongSoLuong,
                tongTienGoc,
                tongTienKhuyenMai,
                tongTienVoucher,
                tongTienThanhToan
            };
        });

        // =================== UTILITY FUNCTIONS ===================
        const showToastMessage = (message, type = 'success') => {
            toastMessage.value = message;
            toastType.value = type;
            showToast.value = true;
            setTimeout(() => (showToast.value = false), 3000);
        };

        const formatPrice = (price) => {
            if (!price && price !== 0) return '0₫';
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(price);
        };

        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('vi-VN');
            } catch {
                return 'N/A';
            }
        };

        const formatDateTime = (date) => {
            return date.toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const getMauHex = (tenMau) => {
            if (!tenMau) return '#6c757d';
            const colorMap = {
                đỏ: '#dc3545',
                red: '#dc3545',
                xanh: '#0066cc',
                blue: '#0066cc',
                đen: '#000000',
                black: '#000000',
                trắng: '#ffffff',
                white: '#ffffff',
                vàng: '#ffc107',
                yellow: '#ffc107',
                'xanh lá': '#28a745',
                green: '#28a745',
                tím: '#6f42c1',
                purple: '#6f42c1',
                hồng: '#e83e8c',
                pink: '#e83e8c',
                nâu: '#8b4513',
                brown: '#8b4513',
                cam: '#fd7e14',
                orange: '#fd7e14',
                xám: '#6c757d',
                gray: '#6c757d'
            };
            return colorMap[tenMau.toLowerCase()] || '#6c757d';
        };

        const getProductImage = (product) => {
            if (product?.hinhAnhChinh && product.hinhAnhChinh !== 'null') {
                return product.hinhAnhChinh.startsWith('http') ? product.hinhAnhChinh : `http://localhost:8080${product.hinhAnhChinh}`;
            }
            return 'https://via.placeholder.com/200x200?text=No+Image';
        };

        const handleImageError = (event) => {
            event.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
        };

        // =================== API FUNCTIONS ===================
        const apiCall = async (url, options = {}) => {
            try {
                const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
                const headers = {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` })
                };

                const response = await fetch(url, {
                    ...options,
                    headers: headers
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return await response.json();
            } catch (error) {
                console.error('API Error:', error);
                throw error;
            }
        };

        // =================== EMPLOYEE FUNCTIONS ===================
        const loadEmployeeInfo = () => {
            try {
                const userInfo = localStorage.getItem('user_info');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    nhanVienInfo.value = {
                        tenNhanVien: user.tenNhanVien || user.hoTen || 'Nhân viên',
                        maNhanVien: user.maNhanVien || user.id || 'NV001'
                    };
                }
            } catch (error) {
                console.error('Error loading employee info:', error);
            }
        };

        // =================== INVOICE FUNCTIONS ===================
        const layDanhSachHoaDonCho = async () => {
            try {
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho`);
                if (data.success) {
                    hoaDonCho.value = data.data;
                    if (data.data.length > 0 && !hoaDonDangChon.value) {
                        chonHoaDon(data.data[0]);
                    }
                }
            } catch (error) {
                showToastMessage('Lỗi tải danh sách hóa đơn', 'error');
            }
        };

        const chonHoaDon = async (hoaDon) => {
            hoaDonDangChon.value = hoaDon;
            await layTongQuanHoaDon(hoaDon.id);
        };

        const layTongQuanHoaDon = async (hoaDonId) => {
            try {
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonId}/tong-quan`);
                if (data.success && data.data) {
                    const tongQuanData = data.data;
                    if (tongQuanData.danhSachSanPham && Array.isArray(tongQuanData.danhSachSanPham)) {
                        sanPhamDaChon.value = tongQuanData.danhSachSanPham.map((item, index) => ({
                            id: item.id || `temp_${Date.now()}_${index}`,
                            chiTietSanPhamId: item.chiTietSanPhamId || item.id,
                            tenSanPham: item.tenSanPham || 'Sản phẩm không xác định',
                            maSanPham: item.maSanPham || item.id,
                            soLuongDaChon: Number(item.soLuong) || 1,
                            giaBan: Number(item.giaBan) || 0,
                            giaGoc: Number(item.giaGoc) || Number(item.giaBan) || 0,
                            soLuong: 999,
                            mauSac: {
                                tenMau: item.mauSac || 'N/A',
                                maMau: getMauHex(item.mauSac)
                            },
                            kichCo: {
                                tenKichCo: item.kichCo || 'N/A'
                            },
                            thuongHieu: {
                                tenThuongHieu: item.thuongHieu || 'N/A'
                            },
                            hinhAnhChinh: item.hinhAnhChinh || null
                        }));
                    } else {
                        sanPhamDaChon.value = [];
                    }
                    khachHang.value = tongQuanData.khachHang || null;
                    voucher.value = tongQuanData.voucher || null;
                } else {
                    sanPhamDaChon.value = [];
                }
            } catch (error) {
                console.error('Lỗi lấy tổng quan hóa đơn:', error);
                sanPhamDaChon.value = [];
                showToastMessage('Lỗi tải thông tin hóa đơn', 'error');
            }
        };

        const taoHoaDonMoi = async () => {
            if (loadingCreateInvoice.value) return;
            loadingCreateInvoice.value = true;

            try {
                const nhanVienId = nhanVienInfo.value.maNhanVien || 1;
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/tao-moi?nhanVienId=${nhanVienId}`, {
                    method: 'POST'
                });

                if (data.success) {
                    await layDanhSachHoaDonCho();
                    showToastMessage('Tạo hóa đơn mới thành công!');

                    const newInvoice = hoaDonCho.value[hoaDonCho.value.length - 1];
                    if (newInvoice) {
                        await chonHoaDon(newInvoice);
                    }
                } else {
                    showToastMessage(data.message || 'Lỗi tạo hóa đơn', 'error');
                }
            } catch (error) {
                showToastMessage(`Lỗi tạo hóa đơn: ${error.message}`, 'error');
            } finally {
                loadingCreateInvoice.value = false;
            }
        };

        const confirmDeleteHoaDon = async (hoaDon) => {
            const index = hoaDonCho.value.findIndex((hd) => hd.id === hoaDon.id) + 1;
            if (!confirm(`Bạn có chắc muốn xóa hóa đơn ${index}?`)) return;

            loadingDelete.value = hoaDon.id;
            try {
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDon.id}`, {
                    method: 'DELETE'
                });

                if (data.success) {
                    if (hoaDonDangChon.value?.id === hoaDon.id) {
                        const otherInvoice = hoaDonCho.value.find((hd) => hd.id !== hoaDon.id);
                        if (otherInvoice) {
                            hoaDonDangChon.value = otherInvoice;
                        }
                    }
                    await layDanhSachHoaDonCho();
                    showToastMessage('Đã xóa hóa đơn thành công!');
                } else {
                    showToastMessage(data.message || 'Lỗi xóa hóa đơn', 'error');
                }
            } catch (error) {
                showToastMessage(`Lỗi xóa hóa đơn: ${error.message}`, 'error');
                await layDanhSachHoaDonCho();
            } finally {
                loadingDelete.value = null;
            }
        };

        // =================== PRODUCT FUNCTIONS ===================
        const loadMasterData = async () => {
            try {
                const [danhMucData, thuongHieuData] = await Promise.all([
                    apiCall(`${API_BASE_URL}/master-data/danh-muc`).catch(() => ({ success: false, data: [] })),
                    apiCall(`${API_BASE_URL}/master-data/thuong-hieu`).catch(() => ({ success: false, data: [] }))
                ]);

                if (danhMucData.success) danhSachDanhMuc.value = danhMucData.data;
                if (thuongHieuData.success) danhSachThuongHieu.value = thuongHieuData.data;
            } catch (error) {
                console.error('Lỗi load master data:', error);
            }
        };

        const timKiemSanPham = async (page = 0) => {
            loading.value = true;
            error.value = '';

            try {
                const params = new URLSearchParams({
                    keyword: searchKeyword.value || '',
                    page: page.toString(),
                    size: '20',
                    sortBy: 'ngayTao',
                    sortDir: 'desc'
                });

                if (filters.value.danhMucId) params.append('danhMucId', filters.value.danhMucId);
                if (filters.value.thuongHieuId) params.append('thuongHieuId', filters.value.thuongHieuId);
                if (filters.value.minPrice) params.append('minPrice', filters.value.minPrice);
                if (filters.value.maxPrice) params.append('maxPrice', filters.value.maxPrice);

                const url = `${API_BASE_URL}/san-pham?${params}`;
                const data = await apiCall(url);

                if (data.success) {
                    danhSachSanPham.value = data.data || [];
                    trangHienTai.value = data.currentPage || 0;
                    tongSoTrang.value = data.totalPages || 0;
                    tongSoPhanTu.value = data.totalElements || 0;
                } else {
                    error.value = data.message || 'Có lỗi xảy ra khi tải sản phẩm';
                    danhSachSanPham.value = [];
                }
            } catch (err) {
                error.value = 'Không thể kết nối đến server';
                danhSachSanPham.value = [];
                showToastMessage(`Lỗi tải sản phẩm: ${err.message}`, 'error');
            } finally {
                loading.value = false;
            }
        };

        const debounceSearch = () => {
            if (window.searchTimer) clearTimeout(window.searchTimer);
            window.searchTimer = setTimeout(() => timKiemSanPham(0), 500);
        };

        const debouncePriceFilter = () => {
            if (window.priceFilterTimer) clearTimeout(window.priceFilterTimer);
            window.priceFilterTimer = setTimeout(() => timKiemSanPham(0), 800);
        };

        const applyFilters = () => {
            timKiemSanPham(0);
        };

        const chuyenTrang = (page) => {
            if (page >= 0 && page < tongSoTrang.value) {
                timKiemSanPham(page);
            }
        };

        const xemChiTietSanPham = (product) => {
            sanPhamDangXem.value = product;
            soLuongChon.value = 1;
            showProductDetail.value = true;
        };

        const themVaoHoaDon = async (product, soLuong = 1) => {
            if (!hoaDonDangChon.value) {
                showToastMessage('Vui lòng chọn hóa đơn trước', 'error');
                return;
            }

            if (!product || (!product.id && !product.chiTietSanPhamId)) {
                showToastMessage('Thông tin sản phẩm không hợp lệ', 'error');
                return;
            }

            try {
                const productId = product.chiTietSanPhamId || product.id;
                const request = {
                    chiTietSanPhamId: Number(productId),
                    soLuong: Number(soLuong),
                    donGia: Number(product.giaBan) || 0
                };

                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/them-san-pham`, {
                    method: 'POST',
                    body: JSON.stringify(request)
                });

                if (data.success) {
                    showToastMessage(`Đã thêm ${product.tenSanPham} vào hóa đơn!`);
                    setTimeout(() => {
                        layTongQuanHoaDon(hoaDonDangChon.value.id);
                    }, 500);
                } else {
                    showToastMessage(data.message || 'Lỗi thêm sản phẩm', 'error');
                }
            } catch (error) {
                showToastMessage(`Lỗi thêm sản phẩm: ${error.message}`, 'error');
            }
        };

        const themVaoHoaDonTuModal = () => {
            themVaoHoaDon(sanPhamDangXem.value, soLuongChon.value);
            showProductDetail.value = false;
        };

        const tangSoLuong = async (item) => {
            if (!item || !item.id || !hoaDonDangChon.value?.id) return;

            const soLuongHienTai = Number(item.soLuongDaChon) || 0;
            try {
                const soLuongMoi = soLuongHienTai + 1;
                const request = {
                    soLuong: soLuongMoi,
                    donGia: Number(item.giaBan) || 0
                };

                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/cap-nhat-san-pham/${item.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(request)
                });

                if (data.success) {
                    const index = sanPhamDaChon.value.findIndex((sp) => sp.id === item.id);
                    if (index > -1) {
                        sanPhamDaChon.value[index].soLuongDaChon = soLuongMoi;
                    }
                    setTimeout(() => layTongQuanHoaDon(hoaDonDangChon.value.id), 300);
                } else {
                    showToastMessage(data.message || 'Lỗi cập nhật số lượng', 'error');
                }
            } catch (error) {
                showToastMessage(`Lỗi cập nhật: ${error.message}`, 'error');
            }
        };

        const giamSoLuong = async (item) => {
            if (!item || !item.id || !hoaDonDangChon.value?.id) return;

            const soLuongHienTai = Number(item.soLuongDaChon) || 0;
            if (soLuongHienTai <= 1) {
                xoaKhoiGioHang(item);
                return;
            }

            try {
                const soLuongMoi = soLuongHienTai - 1;
                const request = {
                    soLuong: soLuongMoi,
                    donGia: Number(item.giaBan) || 0
                };

                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/cap-nhat-san-pham/${item.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(request)
                });

                if (data.success) {
                    const index = sanPhamDaChon.value.findIndex((sp) => sp.id === item.id);
                    if (index > -1) {
                        sanPhamDaChon.value[index].soLuongDaChon = soLuongMoi;
                    }
                    setTimeout(() => layTongQuanHoaDon(hoaDonDangChon.value.id), 300);
                } else {
                    showToastMessage(data.message || 'Lỗi cập nhật số lượng', 'error');
                }
            } catch (error) {
                showToastMessage(`Lỗi cập nhật: ${error.message}`, 'error');
            }
        };

        const xoaKhoiGioHang = async (item) => {
            if (!item || !item.id || !hoaDonDangChon.value?.id) return;

            const tenSanPham = item.tenSanPham || 'sản phẩm này';
            if (!confirm(`Bạn có chắc muốn xóa "${tenSanPham}" khỏi hóa đơn?`)) {
                return;
            }

            try {
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/xoa-san-pham/${item.id}`, {
                    method: 'DELETE'
                });

                if (data.success) {
                    const index = sanPhamDaChon.value.findIndex((sp) => sp.id === item.id);
                    if (index > -1) {
                        sanPhamDaChon.value.splice(index, 1);
                    }
                    showToastMessage(`Đã xóa ${tenSanPham} khỏi hóa đơn`);
                    setTimeout(() => layTongQuanHoaDon(hoaDonDangChon.value.id), 300);
                } else {
                    showToastMessage(data.message || 'Lỗi xóa sản phẩm', 'error');
                }
            } catch (error) {
                showToastMessage(`Lỗi xóa sản phẩm: ${error.message}`, 'error');
            }
        };

        const tangSoLuongModal = () => {
            if (soLuongChon.value < sanPhamDangXem.value.soLuong) {
                soLuongChon.value++;
            }
        };

        const giamSoLuongModal = () => {
            if (soLuongChon.value > 1) {
                soLuongChon.value--;
            }
        };

        // =================== CUSTOMER FUNCTIONS ===================
        const loadDanhSachKhachHang = async () => {
            if (loadingCustomers.value) return;

            loadingCustomers.value = true;
            try {
                const params = new URLSearchParams({
                    keyword: customerSearchKeyword.value.trim() || '',
                    page: '0',
                    size: '50'
                });

                const data = await apiCall(`${API_BASE_URL}/khach-hang/search?${params}`);
                if (data.success) {
                    danhSachKhachHang.value = data.data || [];
                } else {
                    danhSachKhachHang.value = [];
                }
            } catch (error) {
                console.error('Lỗi load khách hàng:', error);
                danhSachKhachHang.value = [];
                showToastMessage('Lỗi tải danh sách khách hàng', 'error');
            } finally {
                loadingCustomers.value = false;
            }
        };

        const debounceCustomerSearch = () => {
            if (window.customerSearchTimer) clearTimeout(window.customerSearchTimer);
            window.customerSearchTimer = setTimeout(() => loadDanhSachKhachHang(), 500);
        };

        const validateNewCustomer = () => {
            const errors = {};

            if (!newCustomer.value.hoTen.trim()) {
                errors.hoTen = 'Vui lòng nhập họ tên';
            } else if (newCustomer.value.hoTen.trim().length < 2) {
                errors.hoTen = 'Họ tên phải có ít nhất 2 ký tự';
            }

            if (!newCustomer.value.sdt.trim()) {
                errors.sdt = 'Vui lòng nhập số điện thoại';
            } else if (!/^[0-9]{10,11}$/.test(newCustomer.value.sdt.trim())) {
                errors.sdt = 'Số điện thoại không hợp lệ (10-11 số)';
            }

            if (newCustomer.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.value.email)) {
                errors.email = 'Email không hợp lệ';
            }

            newCustomerErrors.value = errors;
            return Object.keys(errors).length === 0;
        };

        const taoKhachHangMoi = async () => {
            if (!validateNewCustomer()) {
                showToastMessage('Vui lòng kiểm tra lại thông tin', 'error');
                return;
            }

            loadingCreateCustomer.value = true;
            try {
                const request = {
                    hoTen: newCustomer.value.hoTen.trim(),
                    sdt: newCustomer.value.sdt.trim(),
                    email: newCustomer.value.email.trim() || null,
                    diaChi: newCustomer.value.diaChi.trim() || null
                };

                const data = await apiCall(`${API_BASE_URL}/khach-hang/tao-nhanh`, {
                    method: 'POST',
                    body: JSON.stringify(request)
                });

                if (data.success) {
                    const newCustomerData = data.data;
                    await chonKhachHang(newCustomerData);

                    newCustomer.value = { hoTen: '', sdt: '', email: '', diaChi: '' };
                    newCustomerErrors.value = {};
                    showCreateCustomerForm.value = false;
                    showCustomerModal.value = false;

                    showToastMessage(`Tạo và áp dụng khách hàng ${newCustomerData.hoTen} thành công!`);
                } else {
                    showToastMessage(data.message || 'Lỗi tạo khách hàng', 'error');
                }
            } catch (error) {
                console.error('Lỗi tạo khách hàng:', error);
                showToastMessage('Lỗi tạo khách hàng', 'error');
            } finally {
                loadingCreateCustomer.value = false;
            }
        };

        const chonKhachHang = async (customer) => {
            try {
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/ap-dung-khach-hang/${customer.id}`, {
                    method: 'POST'
                });

                if (data.success) {
                    khachHang.value = customer;
                    showCustomerModal.value = false;
                    customerSearchKeyword.value = '';
                    showToastMessage(`Đã áp dụng khách hàng ${customer.hoTen}`);
                } else {
                    showToastMessage(data.message || 'Lỗi áp dụng khách hàng', 'error');
                }
            } catch (error) {
                showToastMessage('Lỗi áp dụng khách hàng', 'error');
            }
        };

        const boKhachHang = async () => {
            try {
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/bo-khach-hang`, {
                    method: 'DELETE'
                });

                if (data.success) {
                    khachHang.value = null;
                    showToastMessage('Đã bỏ khách hàng');
                } else {
                    showToastMessage(data.message || 'Lỗi bỏ khách hàng', 'error');
                }
            } catch (error) {
                showToastMessage('Lỗi bỏ khách hàng', 'error');
            }
        };

        // =================== VOUCHER FUNCTIONS ===================
        const layDanhSachVoucher = async () => {
            if (loadingVouchers.value) return;

            loadingVouchers.value = true;
            try {
                const tongTien = tongQuan.value.tongTienKhuyenMai;
                const khachHangId = khachHang.value?.id;

                const params = new URLSearchParams();
                if (khachHangId) params.append('khachHangId', khachHangId);
                if (tongTien) params.append('tongTien', tongTien);

                const data = await apiCall(`${API_BASE_URL}/voucher/kha-dung?${params}`);
                if (data.success) {
                    danhSachVoucher.value = data.data || [];
                } else {
                    danhSachVoucher.value = [];
                }
            } catch (error) {
                console.error('Lỗi load voucher:', error);
                danhSachVoucher.value = [];
                showToastMessage('Lỗi tải danh sách voucher', 'error');
            } finally {
                loadingVouchers.value = false;
            }
        };

        const kiemTraVoucher = async () => {
            if (!voucherCode.value.trim()) {
                showToastMessage('Vui lòng nhập mã voucher', 'error');
                return;
            }

            loadingVoucherCheck.value = true;
            try {
                const request = {
                    maVoucher: voucherCode.value.trim(),
                    tongTien: tongQuan.value.tongTienKhuyenMai,
                    khachHangId: khachHang.value?.id
                };

                const data = await apiCall(`${API_BASE_URL}/voucher/kiem-tra`, {
                    method: 'POST',
                    body: JSON.stringify(request)
                });

                if (data.valid && data.voucher) {
                    await chonVoucher(data.voucher);
                    voucherCode.value = '';
                } else {
                    showToastMessage(data.message || 'Mã voucher không hợp lệ', 'error');
                }
            } catch (error) {
                showToastMessage('Lỗi kiểm tra voucher', 'error');
            } finally {
                loadingVoucherCheck.value = false;
            }
        };

        const chonVoucher = async (selectedVoucher) => {
            try {
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/ap-dung-voucher/${selectedVoucher.id}`, {
                    method: 'POST'
                });

                if (data.success) {
                    voucher.value = selectedVoucher;
                    showVoucherModal.value = false;
                    voucherCode.value = '';
                    showToastMessage(`Đã áp dụng voucher ${selectedVoucher.tenVoucher}`);
                } else {
                    showToastMessage(data.message || 'Lỗi áp dụng voucher', 'error');
                }
            } catch (error) {
                showToastMessage('Lỗi áp dụng voucher', 'error');
            }
        };

        const boVoucher = async () => {
            try {
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/bo-voucher`, {
                    method: 'DELETE'
                });

                if (data.success) {
                    voucher.value = null;
                    showToastMessage('Đã bỏ voucher');
                } else {
                    showToastMessage(data.message || 'Lỗi bỏ voucher', 'error');
                }
            } catch (error) {
                showToastMessage('Lỗi bỏ voucher', 'error');
            }
        };

        // =================== PAYMENT FUNCTIONS ===================
        const tinhTongThanhToan = () => {
            let tong = tongQuan.value.tongTienThanhToan;
            if (thongTinThanhToan.value.diemSuDung > 0) {
                tong -= thongTinThanhToan.value.diemSuDung * 1000;
            }
            return Math.max(0, tong);
        };

        const tinhTienThua = () => {
            const tongNhan = thongTinThanhToan.value.tienMat + thongTinThanhToan.value.chuyenKhoan;
            return tongNhan - tinhTongThanhToan();
        };

        const coTheThanhToan = () => {
            return tinhTienThua() >= 0 && sanPhamDaChon.value.length > 0;
        };

        const chonTienNhanh = (amount) => {
            thongTinThanhToan.value.tienMat = amount;
            thongTinThanhToan.value.chuyenKhoan = 0;
        };

        const chonTienVuaVua = () => {
            thongTinThanhToan.value.tienMat = tinhTongThanhToan();
            thongTinThanhToan.value.chuyenKhoan = 0;
        };

        const xuLyThanhToan = async () => {
            if (loadingPayment.value) return;

            try {
                if (!hoaDonDangChon.value?.id) {
                    showToastMessage('Chưa chọn hóa đơn để thanh toán', 'error');
                    return;
                }

                if (!coTheThanhToan()) {
                    showToastMessage('Thông tin thanh toán chưa đủ', 'error');
                    return;
                }

                loadingPayment.value = true;

                const requestData = {
                    loaiHoaDon: 'OFFLINE',
                    ghiChu: String(thongTinThanhToan.value.ghiChu || '').trim()
                };

                if (khachHang.value?.id) {
                    requestData.khachHangId = Number(khachHang.value.id);
                }

                if (voucher.value?.id) {
                    requestData.voucherId = Number(voucher.value.id);
                }

                const diemSuDung = Number(thongTinThanhToan.value.diemSuDung) || 0;
                if (diemSuDung > 0) {
                    const maxDiem = khachHang.value?.diemTichLuy || 0;
                    if (diemSuDung > maxDiem) {
                        showToastMessage(`Chỉ có thể sử dụng tối đa ${maxDiem} điểm`, 'error');
                        return;
                    }
                    requestData.diemSuDung = diemSuDung;
                }

                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/thanh-toan`, {
                    method: 'POST',
                    body: JSON.stringify(requestData)
                });

                if (data.success) {
                    hoaDonDaThanhToan.value = data.data;
                    sanPhamDaThanhToan.value = [...sanPhamDaChon.value];
                    tongQuanDaThanhToan.value = { ...tongQuan.value };
                    voucherDaThanhToan.value = voucher.value ? { ...voucher.value } : null;

                    const khachHangDaThanhToan = khachHang.value
                        ? {
                              id: khachHang.value.id,
                              hoTen: khachHang.value.hoTen || 'Khách lẻ',
                              sdt: khachHang.value.sdt || 'N/A',
                              email: khachHang.value.email || 'N/A',
                              diemTichLuy: khachHang.value.diemTichLuy || 0
                          }
                        : {
                              id: null,
                              hoTen: 'Khách lẻ',
                              sdt: 'N/A',
                              email: 'N/A',
                              diemTichLuy: 0
                          };

                    thongTinThanhToanCuoi.value = {
                        ...thongTinThanhToan.value,
                        tienThua: tinhTienThua(),
                        khachHangInfo: khachHangDaThanhToan
                    };

                    showPaymentModal.value = false;

                    // Reset form
                    thongTinThanhToan.value = {
                        tienMat: 0,
                        chuyenKhoan: 0,
                        ghiChu: '',
                        diemSuDung: 0
                    };

                    voucher.value = null;
                    await layDanhSachHoaDonCho();
                    showToastMessage('Thanh toán thành công!');
                    showInvoicePrint.value = true;
                } else {
                    showToastMessage(data.message || 'Thanh toán thất bại', 'error');
                }
            } catch (error) {
                console.error('Lỗi xử lý thanh toán:', error);
                let errorMessage = 'Lỗi xử lý thanh toán';
                if (error.message.includes('HTTP 400')) {
                    errorMessage = 'Dữ liệu thanh toán không hợp lệ';
                } else if (error.message.includes('HTTP 404')) {
                    errorMessage = 'Không tìm thấy hóa đơn';
                } else if (error.message.includes('HTTP 500')) {
                    errorMessage = 'Lỗi hệ thống';
                }
                showToastMessage(errorMessage, 'error');
            } finally {
                loadingPayment.value = false;
            }
        };

        const printInvoice = () => {
            const printContent = document.getElementById('invoice-print');
            const originalContent = document.body.innerHTML;

            document.body.innerHTML = printContent.outerHTML;
            window.print();
            document.body.innerHTML = originalContent;
            window.location.reload();
        };

        // =================== QR SCANNER FUNCTIONS ===================
        const switchQrMode = async (mode) => {
            if (qrMode.value === mode) return;

            if (qrMode.value === 'camera' && cameraStarted.value) {
                await stopCamera();
            }

            qrMode.value = mode;

            if (mode === 'manual') {
                await nextTick();
                qrInput.value?.focus();
            } else if (mode === 'camera') {
                await nextTick();
                setTimeout(() => {
                    startCamera();
                }, 100);
            }
        };

        const startCamera = async () => {
            try {
                cameraError.value = '';
                console.log('Loading jsQR...');
                await loadJsQRFromCDN();
                console.log('jsQR loaded, starting camera...');

                cameraStarted.value = true;
                await nextTick();
                await new Promise((resolve) => setTimeout(resolve, 200));

                const video = document.getElementById('qr-video');
                const canvas = document.getElementById('qr-canvas');

                if (!video || !canvas) {
                    throw new Error('Video hoặc Canvas element không tìm thấy');
                }

                qrStream.value = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    }
                });

                video.srcObject = qrStream.value;

                await new Promise((resolve) => {
                    video.onloadedmetadata = () => {
                        video.play().then(resolve).catch(resolve);
                    };
                });

                await startQrScan(video, canvas);
                console.log('Camera and QR scanning started successfully');
            } catch (error) {
                console.error('Camera start error:', error);
                cameraStarted.value = false;

                if (error.name === 'NotAllowedError') {
                    cameraError.value = 'Bạn cần cho phép truy cập camera';
                } else if (error.name === 'NotFoundError') {
                    cameraError.value = 'Không tìm thấy camera';
                } else {
                    cameraError.value = `Lỗi: ${error.message}`;
                }
            }
        };

        const startQrScan = async (video, canvas) => {
            const ctx = canvas.getContext('2d');

            if (!window.jsQR) {
                try {
                    await loadJsQRFromCDN();
                } catch (error) {
                    cameraError.value = 'Không thể tải thư viện quét QR';
                    return;
                }
            }

            const scan = () => {
                if (!cameraStarted.value || !video.videoWidth || !video.videoHeight) {
                    return;
                }

                try {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = window.jsQR(imageData.data, imageData.width, imageData.height);

                    if (code && code.data) {
                        console.log('QR Code detected:', code.data);
                        qrCode.value = code.data;

                        if (scanInterval.value) {
                            clearInterval(scanInterval.value);
                            scanInterval.value = null;
                        }

                        setTimeout(() => {
                            stopCamera();
                            quetQR();
                        }, 1000);

                        return;
                    }
                } catch (error) {
                    console.warn('QR scan error:', error);
                }
            };

            scanInterval.value = setInterval(scan, 200);
            console.log('QR scanning started');
        };

        const stopCamera = async () => {
            try {
                console.log('Stopping camera...');

                if (scanInterval.value) {
                    clearInterval(scanInterval.value);
                    scanInterval.value = null;
                }

                if (qrStream.value) {
                    qrStream.value.getTracks().forEach((track) => track.stop());
                    qrStream.value = null;
                }

                const video = document.getElementById('qr-video');
                if (video) {
                    video.srcObject = null;
                }

                cameraStarted.value = false;
                cameraError.value = '';
                console.log('Camera stopped successfully');
            } catch (error) {
                console.warn('Lỗi dừng camera:', error);
                cameraStarted.value = false;
            }
        };

        const retryCamera = () => {
            cameraError.value = '';
            cameraStarted.value = false;
            startCamera();
        };

        const clearQrCode = () => {
            qrCode.value = '';
        };

        const quetQR = async () => {
            if (!qrCode.value.trim() || loadingQR.value) return;

            loadingQR.value = true;
            try {
                console.log('Scanning QR code:', qrCode.value);

                const data = await apiCall(`${API_BASE_URL}/san-pham/scan-qr`, {
                    method: 'POST',
                    body: JSON.stringify({ qrCode: qrCode.value.trim() })
                });

                if (data.success && data.data) {
                    if (cameraStarted.value) {
                        stopCamera();
                    }

                    showQrScanner.value = false;
                    qrCode.value = '';

                    await themVaoHoaDon(data.data);
                    showToastMessage(`Đã thêm ${data.data.tenSanPham} vào hóa đơn!`);
                } else {
                    showToastMessage(data.message || 'Không tìm thấy sản phẩm với mã QR này', 'error');
                }
            } catch (error) {
                console.error('QR scan error:', error);
                showToastMessage('Lỗi quét QR code: ' + error.message, 'error');
            } finally {
                loadingQR.value = false;
            }
        };

        // =================== LIFECYCLE ===================
        onMounted(async () => {
            console.log('Khởi tạo ứng dụng POS...');

            try {
                loadEmployeeInfo();
                await loadMasterData();
                await layDanhSachHoaDonCho();

                if (hoaDonCho.value.length === 0) {
                    await taoHoaDonMoi();
                }

                await timKiemSanPham(0);
                showToastMessage('Khởi tạo thành công');
            } catch (error) {
                console.error('Lỗi khởi tạo:', error);
                showToastMessage('Lỗi khởi tạo ứng dụng', 'error');
            }
        });

        // =================== WATCHERS ===================
        watch(showProductModal, (newVal) => {
            if (newVal) {
                timKiemSanPham(0);
            }
        });

        watch(showCustomerModal, async (newVal) => {
            if (newVal) {
                customerSearchKeyword.value = '';
                await loadDanhSachKhachHang();
            } else {
                danhSachKhachHang.value = [];
                customerSearchKeyword.value = '';
            }
        });

        watch(showVoucherModal, async (newVal) => {
            if (newVal) {
                voucherCode.value = '';
                await layDanhSachVoucher();
            } else {
                danhSachVoucher.value = [];
                voucherCode.value = '';
            }
        });

        watch(showQrScanner, (newVal) => {
            if (newVal) {
                qrCode.value = '';
                qrMode.value = 'manual';
                cameraError.value = '';
                cameraStarted.value = false;
                loadingQR.value = false;

                nextTick(() => {
                    qrInput.value?.focus();
                });

                console.log('QR Scanner modal opened');
            } else {
                stopCamera();
                qrCode.value = '';
                qrMode.value = 'manual';
                cameraError.value = '';
                loadingQR.value = false;
                console.log('QR Scanner modal closed');
            }
        });

        watch(showCreateCustomerForm, (newVal) => {
            if (newVal) {
                newCustomer.value = { hoTen: '', sdt: '', email: '', diaChi: '' };
                newCustomerErrors.value = {};
            }
        });

        // =================== RETURN ===================
        return {
            // Data
            nhanVienInfo,
            hoaDonCho,
            hoaDonDangChon,
            danhSachSanPham,
            sanPhamDaChon,
            khachHang,
            voucher,

            // UI States
            loading,
            error,
            searchKeyword,
            customerSearchKeyword,
            voucherCode,
            soLuongChon,
            qrCode,
            loadingDelete,
            loadingCreateInvoice,

            // Pagination
            trangHienTai,
            tongSoTrang,
            tongSoPhanTu,

            // Modals
            showCustomerModal,
            showVoucherModal,
            showPaymentModal,
            showProductDetail,
            showProductModal,
            showQrScanner,
            showCreateCustomerForm,
            showInvoicePrint,
            sanPhamDangXem,

            // Loading states
            loadingCustomers,
            loadingVouchers,
            loadingCreateCustomer,
            loadingVoucherCheck,
            loadingPayment,

            // QR Scanner
            qrMode,
            cameraError,
            cameraStarted,
            loadingQR,
            qrInput,

            // Toast
            showToast,
            toastMessage,
            toastType,

            // Filters
            filters,
            danhSachDanhMuc,
            danhSachThuongHieu,
            danhSachKhachHang,
            danhSachVoucher,

            // Forms
            newCustomer,
            newCustomerErrors,

            // Payment
            thongTinThanhToan,
            quickAmounts,

            // Invoice print
            hoaDonDaThanhToan,
            sanPhamDaThanhToan,
            tongQuanDaThanhToan,
            voucherDaThanhToan,
            thongTinThanhToanCuoi,

            // Computed
            tongQuan,

            // Methods
            showToastMessage,
            formatPrice,
            formatDate,
            formatDateTime,
            getMauHex,
            getProductImage,
            handleImageError,

            // Invoice methods
            layDanhSachHoaDonCho,
            chonHoaDon,
            taoHoaDonMoi,
            confirmDeleteHoaDon,

            // Product methods
            timKiemSanPham,
            debounceSearch,
            debouncePriceFilter,
            applyFilters,
            chuyenTrang,
            xemChiTietSanPham,
            themVaoHoaDon,
            themVaoHoaDonTuModal,
            tangSoLuong,
            giamSoLuong,
            xoaKhoiGioHang,
            tangSoLuongModal,
            giamSoLuongModal,

            // Customer methods
            loadDanhSachKhachHang,
            debounceCustomerSearch,
            validateNewCustomer,
            taoKhachHangMoi,
            chonKhachHang,
            boKhachHang,

            // Voucher methods
            layDanhSachVoucher,
            kiemTraVoucher,
            chonVoucher,
            boVoucher,

            // Payment methods
            tinhTongThanhToan,
            tinhTienThua,
            coTheThanhToan,
            chonTienNhanh,
            chonTienVuaVua,
            xuLyThanhToan,
            printInvoice,

            // QR Scanner methods
            switchQrMode,
            startCamera,
            stopCamera,
            retryCamera,
            clearQrCode,
            quetQR
        };
    }
};
</script>
<template>
    <div class="pos-container">
        <!-- Toast Notifications -->
        <div class="toast-container position-fixed end-0 top-0 p-3" style="z-index: 1100">
            <div
                v-if="showToast"
                class="toast show"
                :class="{
                    'text-bg-success': toastType === 'success',
                    'text-bg-danger': toastType === 'error',
                    'text-bg-warning': toastType === 'warning'
                }"
            >
                <div class="toast-body">{{ toastMessage }}</div>
            </div>
        </div>

        <!-- Main Layout -->
        <div class="main-layout">
            <!-- Header -->
            <div class="pos-header bg-primary p-3 text-white">
                <div class="container-fluid">
                    <div class="row align-items-center">
                        <div class="col">
                            <h3 class="mb-0">
                                <i class="bi bi-shop me-2"></i>
                                Bán Hàng Tại Quầy
                            </h3>
                        </div>
                        <div class="col-auto">
                            <div class="d-flex align-items-center text-white-50">
                                <i class="bi bi-person-circle me-2"></i>
                                <div>
                                    <div class="fw-semibold">{{ nhanVienInfo.tenNhanVien }}</div>
                                    <small>{{ nhanVienInfo.maNhanVien }}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 1. HÓA ĐƠN CHỜ - Tabs ở trên cùng -->
            <div class="invoice-tabs-section border-bottom bg-white">
                <div class="container-fluid py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex flex-grow-1 gap-2 overflow-auto">
                            <button
                                v-for="(hoaDon, index) in hoaDonCho"
                                :key="hoaDon.id"
                                @click="chonHoaDon(hoaDon)"
                                class="btn btn-sm position-relative invoice-tab"
                                :class="hoaDonDangChon?.id === hoaDon.id ? 'btn-primary' : 'btn-outline-primary'"
                                :disabled="loadingDelete === hoaDon.id"
                            >
                                <span v-if="loadingDelete === hoaDon.id" class="spinner-border spinner-border-sm me-1"></span>
                                <i v-else class="bi bi-file-text me-1"></i>
                                Hóa đơn {{ index + 1 }}

                                <!-- Nút xóa -->
                                <button
                                    v-if="hoaDonCho.length > 1"
                                    @click.stop="confirmDeleteHoaDon(hoaDon)"
                                    :disabled="loadingDelete === hoaDon.id"
                                    class="btn btn-danger btn-xs position-absolute translate-middle rounded-circle end-0 top-0"
                                    style="width: 18px; height: 18px; font-size: 10px; padding: 0"
                                >
                                    <i class="bi bi-x"></i>
                                </button>
                            </button>
                        </div>

                        <button @click="taoHoaDonMoi" :disabled="loadingCreateInvoice" class="btn btn-success btn-sm ms-3">
                            <span v-if="loadingCreateInvoice" class="spinner-border spinner-border-sm me-1"></span>
                            <i v-else class="bi bi-plus-lg me-1"></i>
                            Tạo mới
                        </button>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="main-content">
                <div class="container-fluid h-100">
                    <div class="row h-100">
                        <!-- Left Panel -->
                        <div class="col-lg-8 left-panel">
                            <!-- 2. DANH SÁCH SẢN PHẨM - Bảng -->
                            <div class="card h-100">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0">
                                        <i class="bi bi-cart3 me-2"></i>
                                        Danh sách sản phẩm ({{ tongQuan.soLuongSanPham }} loại - {{ tongQuan.tongSoLuong }} sp)
                                    </h5>
                                    <div class="d-flex gap-2">
                                        <button @click="showQrScanner = true" class="btn btn-outline-primary btn-sm">
                                            <i class="bi bi-qr-code-scan me-1"></i>
                                            QR
                                        </button>
                                        <button @click="showProductModal = true" class="btn btn-primary btn-sm">
                                            <i class="bi bi-plus-lg me-1"></i>
                                            Thêm sản phẩm
                                        </button>
                                    </div>
                                </div>

                                <div class="card-body p-0">
                                    <!-- Empty State -->
                                    <div v-if="sanPhamDaChon.length === 0" class="text-muted py-5 text-center">
                                        <i class="bi bi-cart display-4 mb-3"></i>
                                        <h5>Chưa có sản phẩm nào</h5>
                                        <p>Nhấn "Thêm sản phẩm" để bắt đầu</p>
                                    </div>

                                    <!-- Products Table -->
                                    <div v-else class="table-responsive" style="max-height: 400px">
                                        <table class="table-hover mb-0 table">
                                            <thead class="table-light sticky-top">
                                                <tr>
                                                    <th width="60">STT</th>
                                                    <th width="80">Hình</th>
                                                    <th width="120">Mã SP</th>
                                                    <th>Tên sản phẩm</th>
                                                    <th width="80">Màu</th>
                                                    <th width="70">Size</th>
                                                    <th width="100">Đơn giá</th>
                                                    <th width="120">Số lượng</th>
                                                    <th width="120">Thành tiền</th>
                                                    <th width="80">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="(item, index) in sanPhamDaChon" :key="item.id">
                                                    <td class="text-center">{{ index + 1 }}</td>
                                                    <td>
                                                        <img :src="getProductImage(item)" :alt="item.tenSanPham" @error="handleImageError" class="rounded" style="width: 50px; height: 50px; object-fit: cover" />
                                                    </td>
                                                    <td>
                                                        <code class="small">{{ item.maSanPham || item.id }}</code>
                                                    </td>
                                                    <td>
                                                        <div class="fw-semibold">{{ item.tenSanPham }}</div>
                                                        <small class="text-muted">{{ item.thuongHieu?.tenThuongHieu }}</small>
                                                    </td>
                                                    <td>
                                                        <div class="d-flex align-items-center">
                                                            <span
                                                                class="rounded-circle me-2"
                                                                :style="{
                                                                    backgroundColor: getMauHex(item.mauSac?.tenMau),
                                                                    width: '16px',
                                                                    height: '16px',
                                                                    border: '2px solid #fff',
                                                                    boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
                                                                }"
                                                            ></span>
                                                            <small>{{ item.mauSac?.tenMau || 'N/A' }}</small>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span class="badge bg-light text-dark">{{ item.kichCo?.tenKichCo || 'N/A' }}</span>
                                                    </td>
                                                    <td>
                                                        <div class="fw-semibold text-primary">{{ formatPrice(item.giaBan) }}</div>
                                                    </td>
                                                    <td>
                                                        <div class="d-flex align-items-center justify-content-center">
                                                            <button @click="giamSoLuong(item)" class="btn btn-outline-secondary btn-sm rounded-circle" style="width: 28px; height: 28px; padding: 0">
                                                                <i class="bi bi-dash"></i>
                                                            </button>
                                                            <span class="fw-bold mx-3">{{ item.soLuongDaChon }}</span>
                                                            <button @click="tangSoLuong(item)" class="btn btn-outline-secondary btn-sm rounded-circle" style="width: 28px; height: 28px; padding: 0" :disabled="item.soLuongDaChon >= item.soLuong">
                                                                <i class="bi bi-plus"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div class="fw-bold text-success">
                                                            {{ formatPrice(item.giaBan * item.soLuongDaChon) }}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button @click="xoaKhoiGioHang(item)" class="btn btn-outline-danger btn-sm" title="Xóa sản phẩm">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right Panel -->
                        <div class="col-lg-4 right-panel">
                            <div class="d-flex flex-column h-100">
                                <!-- 3. THÔNG TIN KHÁCH HÀNG -->
                                <div class="card mb-3">
                                    <div class="card-header d-flex justify-content-between align-items-center">
                                        <h6 class="mb-0">
                                            <i class="bi bi-person me-2"></i>
                                            Khách hàng
                                        </h6>
                                        <button @click="showCustomerModal = true" class="btn btn-outline-primary btn-sm">
                                            <i class="bi bi-search me-1"></i>
                                            Chọn
                                        </button>
                                    </div>
                                    <div class="card-body">
                                        <div v-if="khachHang" class="d-flex justify-content-between align-items-start">
                                            <div class="flex-grow-1">
                                                <div class="fw-bold">{{ khachHang.hoTen }}</div>
                                                <div class="text-muted small">{{ khachHang.sdt }}</div>
                                                <div class="small mt-1 text-primary">
                                                    <i class="bi bi-gem me-1"></i>
                                                    {{ khachHang.diemTichLuy || 0 }} điểm
                                                </div>
                                            </div>
                                            <button @click="boKhachHang" class="btn btn-outline-danger btn-sm">
                                                <i class="bi bi-x-lg"></i>
                                            </button>
                                        </div>
                                        <div v-else class="text-muted py-3 text-center">
                                            <i class="bi bi-person-circle display-6"></i>
                                            <div class="mt-2">Khách lẻ</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 4. THANH TOÁN - Voucher và tổng tiền -->
                                <div class="card flex-grow-1">
                                    <div class="card-header">
                                        <h6 class="mb-0">
                                            <i class="bi bi-credit-card me-2"></i>
                                            Thanh toán
                                        </h6>
                                    </div>
                                    <div class="card-body">
                                        <!-- Voucher Section -->
                                        <div class="mb-4">
                                            <div class="d-flex justify-content-between align-items-center mb-2">
                                                <label class="form-label mb-0">Voucher</label>
                                                <button @click="showVoucherModal = true" class="btn btn-outline-success btn-sm">
                                                    <i class="bi bi-ticket me-1"></i>
                                                    Áp dụng
                                                </button>
                                            </div>

                                            <div v-if="voucher" class="voucher-selected bg-light rounded border p-2">
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <div class="flex-grow-1">
                                                        <div class="fw-semibold">{{ voucher.tenVoucher }}</div>
                                                        <div class="text-success small">
                                                            <i class="bi bi-tag-fill me-1"></i>
                                                            <span v-if="voucher.loaiGiamGia === 'PHAN_TRAM'"> Giảm {{ voucher.giaTriGiam }}% </span>
                                                            <span v-else> Giảm {{ formatPrice(voucher.giaTriGiam) }} </span>
                                                        </div>
                                                    </div>
                                                    <button @click="boVoucher" class="btn btn-outline-danger btn-sm">
                                                        <i class="bi bi-x-lg"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            <div v-else class="text-muted rounded border py-2 text-center">
                                                <i class="bi bi-ticket"></i>
                                                Chưa có voucher
                                            </div>
                                        </div>

                                        <!-- Summary -->
                                        <div class="summary-section">
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Tạm tính:</span>
                                                <span>{{ formatPrice(tongQuan.tongTienGoc) }}</span>
                                            </div>

                                            <div v-if="voucher" class="d-flex justify-content-between text-success mb-2">
                                                <span>Voucher:</span>
                                                <span>-{{ formatPrice(tongQuan.tongTienVoucher) }}</span>
                                            </div>

                                            <hr />

                                            <div class="d-flex justify-content-between fw-bold h5 mb-0">
                                                <span>Tổng thanh toán:</span>
                                                <span class="text-danger">{{ formatPrice(tongQuan.tongTienThanhToan) }}</span>
                                            </div>
                                        </div>

                                        <!-- Payment Button -->
                                        <button @click="showPaymentModal = true" :disabled="sanPhamDaChon.length === 0" class="btn w-100 btn-lg mt-3" :class="sanPhamDaChon.length === 0 ? 'btn-secondary' : 'btn-success'">
                                            <i class="bi bi-credit-card me-2"></i>
                                            Thanh toán
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- MODAL THÊM SẢN PHẨM -->
        <div v-if="showProductModal" class="modal d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-grid-3x3-gap me-2"></i>
                            Chọn sản phẩm
                        </h5>
                        <button @click="showProductModal = false" class="btn-close"></button>
                    </div>

                    <div class="modal-body">
                        <!-- Search & Filters -->
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <input v-model="searchKeyword" @input="debounceSearch" type="text" placeholder="Tìm sản phẩm..." class="form-control" />
                            </div>
                            <div class="col-md-2">
                                <select v-model="filters.danhMucId" @change="applyFilters" class="form-select">
                                    <option value="">Tất cả danh mục</option>
                                    <option v-for="dm in danhSachDanhMuc" :key="dm.id" :value="dm.id">
                                        {{ dm.tenDanhMuc }}
                                    </option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select v-model="filters.thuongHieuId" @change="applyFilters" class="form-select">
                                    <option value="">Tất cả thương hiệu</option>
                                    <option v-for="th in danhSachThuongHieu" :key="th.id" :value="th.id">
                                        {{ th.tenThuongHieu }}
                                    </option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <input v-model="filters.minPrice" @input="debouncePriceFilter" type="number" placeholder="Giá từ" class="form-control" />
                            </div>
                            <div class="col-md-2">
                                <input v-model="filters.maxPrice" @input="debouncePriceFilter" type="number" placeholder="Giá đến" class="form-control" />
                            </div>
                        </div>

                        <!-- Product Grid -->
                        <div style="max-height: 500px; overflow-y: auto">
                            <div v-if="loading" class="py-5 text-center">
                                <div class="spinner-border text-primary"></div>
                                <p class="mt-2">Đang tải sản phẩm...</p>
                            </div>

                            <div v-else-if="danhSachSanPham.length === 0" class="text-muted py-5 text-center">
                                <i class="bi bi-search display-4"></i>
                                <p class="mt-2">Không tìm thấy sản phẩm</p>
                            </div>

                            <div v-else class="row g-3">
                                <div v-for="product in danhSachSanPham" :key="product.id" class="col-md-4 col-lg-3">
                                    <div class="card product-card h-100" @click="xemChiTietSanPham(product)">
                                        <div class="position-relative" style="height: 200px">
                                            <img :src="getProductImage(product)" :alt="product.tenSanPham" @error="handleImageError" class="card-img-top w-100 h-100" style="object-fit: cover" />

                                            <div v-if="product.soLuong <= 0" class="position-absolute end-0 top-0 m-2">
                                                <span class="badge bg-danger">Hết hàng</span>
                                            </div>
                                        </div>

                                        <div class="card-body p-3">
                                            <h6 class="card-title text-truncate mb-2">{{ product.tenSanPham }}</h6>

                                            <div class="d-flex justify-content-between align-items-center mb-2">
                                                <small>{{ product.mauSac?.tenMau || 'N/A' }}</small>
                                                <small class="badge bg-light text-dark">{{ product.kichCo?.tenKichCo || 'N/A' }}</small>
                                            </div>

                                            <div class="mb-3">
                                                <div class="fw-bold text-primary">{{ formatPrice(product.giaBan) }}</div>
                                            </div>

                                            <button @click.stop="themVaoHoaDon(product)" :disabled="product.soLuong <= 0" class="btn btn-sm w-100" :class="product.soLuong <= 0 ? 'btn-secondary' : 'btn-primary'">
                                                <i class="bi bi-cart-plus me-1"></i>
                                                {{ product.soLuong <= 0 ? 'Hết hàng' : 'Thêm vào hóa đơn' }}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Pagination -->
                            <nav v-if="tongSoTrang > 1" class="mt-4">
                                <ul class="pagination justify-content-center">
                                    <li class="page-item" :class="{ disabled: trangHienTai === 0 }">
                                        <a class="page-link" @click.prevent="chuyenTrang(trangHienTai - 1)">
                                            <i class="bi bi-chevron-left"></i>
                                        </a>
                                    </li>
                                    <li class="page-item active">
                                        <span class="page-link">{{ trangHienTai + 1 }} / {{ tongSoTrang }}</span>
                                    </li>
                                    <li class="page-item" :class="{ disabled: trangHienTai >= tongSoTrang - 1 }">
                                        <a class="page-link" @click.prevent="chuyenTrang(trangHienTai + 1)">
                                            <i class="bi bi-chevron-right"></i>
                                        </a>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Customer Modal -->
        <div v-if="showCustomerModal" class="modal d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-person me-2"></i>
                            Chọn khách hàng
                        </h5>
                        <button @click="showCustomerModal = false" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <div class="input-group">
                                <input v-model="customerSearchKeyword" @input="debounceCustomerSearch" type="text" placeholder="Tìm khách hàng..." class="form-control" />
                                <button @click="showCreateCustomerForm = true" class="btn btn-success">
                                    <i class="bi bi-person-plus me-1"></i>
                                    Tạo mới
                                </button>
                            </div>
                        </div>

                        <div style="max-height: 400px; overflow-y: auto">
                            <div v-if="loadingCustomers" class="py-4 text-center">
                                <div class="spinner-border text-primary"></div>
                                <p class="mt-2">Đang tìm kiếm...</p>
                            </div>

                            <div v-else-if="danhSachKhachHang.length === 0" class="text-muted py-4 text-center">
                                <i class="bi bi-people display-4"></i>
                                <p class="mt-2">Không tìm thấy khách hàng</p>
                            </div>

                            <div v-else class="list-group">
                                <button v-for="customer in danhSachKhachHang" :key="customer.id" @click="chonKhachHang(customer)" class="list-group-item list-group-item-action">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="mb-1">{{ customer.hoTen }}</h6>
                                            <p class="text-muted mb-1">{{ customer.sdt }}</p>
                                            <small class="text-muted">{{ customer.email || 'Chưa có email' }}</small>
                                        </div>
                                        <span class="badge bg-primary">{{ customer.diemTichLuy || 0 }} điểm</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Voucher Modal -->
        <div v-if="showVoucherModal" class="modal d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-ticket me-2"></i>
                            Áp dụng voucher
                        </h5>
                        <button @click="showVoucherModal = false" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <div class="input-group">
                                <input v-model="voucherCode" type="text" placeholder="Nhập mã voucher" class="form-control" @keyup.enter="kiemTraVoucher" />
                                <button @click="kiemTraVoucher" :disabled="!voucherCode.trim() || loadingVoucherCheck" class="btn btn-success">
                                    <span v-if="loadingVoucherCheck" class="spinner-border spinner-border-sm me-2"></span>
                                    {{ loadingVoucherCheck ? 'Đang kiểm tra...' : 'Kiểm tra' }}
                                </button>
                            </div>
                        </div>

                        <div style="max-height: 400px; overflow-y: auto">
                            <div v-if="loadingVouchers" class="py-4 text-center">
                                <div class="spinner-border text-success"></div>
                                <p class="mt-2">Đang tải voucher...</p>
                            </div>

                            <div v-else-if="danhSachVoucher.length === 0" class="text-muted py-4 text-center">
                                <i class="bi bi-ticket display-4"></i>
                                <p class="mt-2">Không có voucher khả dụng</p>
                            </div>

                            <div v-else class="list-group">
                                <button v-for="voucher_item in danhSachVoucher" :key="voucher_item.id" @click="chonVoucher(voucher_item)" class="list-group-item list-group-item-action">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="flex-grow-1">
                                            <h6 class="fw-bold mb-1">{{ voucher_item.tenVoucher }}</h6>
                                            <p class="text-muted small mb-1">
                                                <i class="bi bi-tag-fill text-success me-1"></i>
                                                <span v-if="voucher_item.loaiGiamGia === 'PHAN_TRAM'"> Giảm {{ voucher_item.giaTriGiam }}% </span>
                                                <span v-else> Giảm {{ formatPrice(voucher_item.giaTriGiam) }} </span>
                                            </p>
                                        </div>
                                        <div class="text-end">
                                            <span v-if="voucher_item.loaiGiamGia === 'PHAN_TRAM'" class="badge bg-primary"> -{{ voucher_item.giaTriGiam }}% </span>
                                            <span v-else class="badge bg-success"> -{{ formatPrice(voucher_item.giaTriGiam) }} </span>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Payment Modal -->
        <div v-if="showPaymentModal" class="modal d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-credit-card me-2"></i>
                            Thanh toán
                        </h5>
                        <button @click="showPaymentModal = false" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h5 class="mb-3">Thông tin thanh toán</h5>

                                <div class="mb-3">
                                    <label class="form-label">Tổng tiền</label>
                                    <input type="text" :value="formatPrice(tongQuan.tongTienThanhToan)" readonly class="form-control bg-light fw-bold text-danger" />
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Tiền mặt</label>
                                    <input v-model.number="thongTinThanhToan.tienMat" type="number" min="0" class="form-control" />
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Chuyển khoản</label>
                                    <input v-model.number="thongTinThanhToan.chuyenKhoan" type="number" min="0" class="form-control" />
                                </div>

                                <div v-if="khachHang && khachHang.diemTichLuy > 0" class="mb-3">
                                    <label class="form-label"> Sử dụng điểm ({{ khachHang.diemTichLuy }} điểm có sẵn) </label>
                                    <input v-model.number="thongTinThanhToan.diemSuDung" type="number" min="0" :max="khachHang.diemTichLuy" class="form-control" />
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Ghi chú</label>
                                    <textarea v-model="thongTinThanhToan.ghiChu" class="form-control" rows="3"></textarea>
                                </div>

                                <!-- Quick amount buttons -->
                                <div class="mb-3">
                                    <label class="form-label">Tiền mặt nhanh:</label>
                                    <div class="d-flex flex-wrap gap-2">
                                        <button v-for="amount in quickAmounts" :key="amount" @click="chonTienNhanh(amount)" class="btn btn-outline-primary btn-sm">
                                            {{ formatPrice(amount) }}
                                        </button>
                                        <button @click="chonTienVuaVua" class="btn btn-primary btn-sm">Vừa vặn</button>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-6">
                                <h5 class="mb-3">Tóm tắt đơn hàng</h5>
                                <div class="card">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between mb-2">
                                            <span>Tạm tính:</span>
                                            <span>{{ formatPrice(tongQuan.tongTienGoc) }}</span>
                                        </div>
                                        <div v-if="voucher" class="d-flex justify-content-between text-success mb-2">
                                            <span>Voucher:</span>
                                            <span>-{{ formatPrice(tongQuan.tongTienVoucher) }}</span>
                                        </div>
                                        <hr />
                                        <div class="d-flex justify-content-between fw-bold h5 mb-3">
                                            <span>Tổng thanh toán:</span>
                                            <span class="text-danger">{{ formatPrice(tinhTongThanhToan()) }}</span>
                                        </div>
                                        <hr />
                                        <div class="d-flex justify-content-between mb-2">
                                            <span>Tiền nhận:</span>
                                            <span>{{ formatPrice(thongTinThanhToan.tienMat + thongTinThanhToan.chuyenKhoan) }}</span>
                                        </div>
                                        <div class="d-flex justify-content-between" :class="tinhTienThua() >= 0 ? 'text-success' : 'text-danger'">
                                            <span>{{ tinhTienThua() >= 0 ? 'Tiền thừa:' : 'Còn thiếu:' }}</span>
                                            <span class="fw-bold">{{ formatPrice(Math.abs(tinhTienThua())) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="showPaymentModal = false" class="btn btn-secondary">Hủy</button>
                        <button @click="xuLyThanhToan" :disabled="!coTheThanhToan() || loadingPayment" class="btn btn-success">
                            <span v-if="loadingPayment" class="spinner-border spinner-border-sm me-2"></span>
                            {{ loadingPayment ? 'Đang xử lý...' : 'Xác nhận thanh toán' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- QR Scanner Modal -->
        <div v-if="showQrScanner" class="modal d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-qr-code-scan me-2"></i>
                            Quét mã QR
                        </h5>
                        <button @click="showQrScanner = false" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <ul class="nav nav-tabs mb-3">
                            <li class="nav-item">
                                <button class="nav-link" :class="{ active: qrMode === 'manual' }" @click="switchQrMode('manual')">
                                    <i class="bi bi-keyboard me-1"></i>
                                    Nhập thủ công
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" :class="{ active: qrMode === 'camera' }" @click="switchQrMode('camera')">
                                    <i class="bi bi-camera me-1"></i>
                                    Quét bằng camera
                                </button>
                            </li>
                        </ul>

                        <div v-if="qrMode === 'manual'" class="mb-3">
                            <label class="form-label">Mã QR sản phẩm</label>
                            <input ref="qrInput" v-model="qrCode" type="text" placeholder="Nhập mã QR sản phẩm" class="form-control" @keyup.enter="quetQR" />
                        </div>

                        <div v-if="qrMode === 'camera'" class="mb-3">
                            <div class="rounded border p-2" style="min-height: 300px">
                                <div v-if="!cameraStarted && !cameraError" class="py-5 text-center">
                                    <i class="bi bi-camera display-4 text-muted"></i>
                                    <p class="text-muted mt-3">Nhấn "Bắt đầu quét" để khởi động camera</p>
                                    <button @click="startCamera" class="btn btn-success">
                                        <i class="bi bi-play me-1"></i>
                                        Bắt đầu quét
                                    </button>
                                </div>

                                <div v-show="cameraStarted && !cameraError" class="text-center">
                                    <video id="qr-video" autoplay playsinline muted style="width: 100%; max-width: 400px; border-radius: 8px"></video>
                                    <canvas id="qr-canvas" style="display: none"></canvas>

                                    <div class="mt-2">
                                        <button @click="stopCamera" class="btn btn-danger btn-sm">
                                            <i class="bi bi-stop me-1"></i>
                                            Dừng camera
                                        </button>
                                    </div>
                                </div>

                                <div v-if="cameraError" class="text-danger py-5 text-center">
                                    <i class="bi bi-exclamation-triangle display-4"></i>
                                    <p class="mt-3">{{ cameraError }}</p>
                                    <button @click="retryCamera" class="btn btn-warning btn-sm">
                                        <i class="bi bi-arrow-clockwise me-1"></i>
                                        Thử lại
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="d-flex gap-2">
                            <button @click="quetQR" :disabled="!qrCode.trim() || loadingQR" class="btn btn-primary flex-grow-1">
                                <span v-if="loadingQR" class="spinner-border spinner-border-sm me-2"></span>
                                <i v-else class="bi bi-search me-1"></i>
                                {{ loadingQR ? 'Đang tìm...' : 'Tìm sản phẩm' }}
                            </button>
                            <button v-if="qrCode" @click="clearQrCode" class="btn btn-outline-secondary">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Product Detail Modal -->
        <div v-if="showProductDetail" class="modal d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-eye me-2"></i>
                            Chi tiết sản phẩm
                        </h5>
                        <button @click="showProductDetail = false" class="btn-close"></button>
                    </div>
                    <div class="modal-body" v-if="sanPhamDangXem">
                        <div class="row">
                            <div class="col-md-6">
                                <img :src="getProductImage(sanPhamDangXem)" :alt="sanPhamDangXem.tenSanPham" class="img-fluid rounded shadow" />
                            </div>
                            <div class="col-md-6">
                                <h2 class="mb-3">{{ sanPhamDangXem.tenSanPham }}</h2>
                                <h3 class="text-danger mb-3">{{ formatPrice(sanPhamDangXem.giaBan) }}</h3>

                                <div class="row mb-4">
                                    <div class="col-sm-6">
                                        <label class="form-label text-muted">Màu sắc</label>
                                        <div class="d-flex align-items-center">
                                            <div
                                                class="rounded-circle me-2"
                                                :style="{
                                                    backgroundColor: getMauHex(sanPhamDangXem.mauSac?.tenMau),
                                                    width: '24px',
                                                    height: '24px',
                                                    border: '2px solid #fff',
                                                    boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
                                                }"
                                            ></div>
                                            <span>{{ sanPhamDangXem.mauSac?.tenMau || 'Chưa có' }}</span>
                                        </div>
                                    </div>
                                    <div class="col-sm-6">
                                        <label class="form-label text-muted">Kích cỡ</label>
                                        <div>
                                            <span class="badge bg-light text-dark fs-6">
                                                {{ sanPhamDangXem.kichCo?.tenKichCo || 'Chưa có' }}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-4">
                                    <label class="form-label">Số lượng</label>
                                    <div class="d-flex align-items-center gap-2" style="width: 160px">
                                        <button @click="giamSoLuongModal" :disabled="soLuongChon <= 1" class="btn btn-outline-secondary rounded-circle" style="width: 32px; height: 32px; padding: 0">
                                            <i class="bi bi-dash"></i>
                                        </button>
                                        <input v-model.number="soLuongChon" type="number" min="1" :max="sanPhamDangXem.soLuong" class="form-control text-center" />
                                        <button @click="tangSoLuongModal" :disabled="soLuongChon >= sanPhamDangXem.soLuong" class="btn btn-outline-secondary rounded-circle" style="width: 32px; height: 32px; padding: 0">
                                            <i class="bi bi-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="showProductDetail = false" class="btn btn-secondary">Đóng</button>
                        <button @click="themVaoHoaDonTuModal" :disabled="!sanPhamDangXem || sanPhamDangXem.soLuong <= 0" class="btn btn-primary">
                            <i class="bi bi-cart-plus me-1"></i>
                            Thêm {{ soLuongChon }} vào hóa đơn
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Customer Form Modal -->
        <div v-if="showCreateCustomerForm" class="modal d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-person-plus me-2"></i>
                            Tạo khách hàng mới
                        </h5>
                        <button @click="showCreateCustomerForm = false" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Họ tên <span class="text-danger">*</span></label>
                            <input v-model="newCustomer.hoTen" type="text" class="form-control" :class="{ 'is-invalid': newCustomerErrors.hoTen }" />
                            <div v-if="newCustomerErrors.hoTen" class="invalid-feedback">
                                {{ newCustomerErrors.hoTen }}
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Số điện thoại <span class="text-danger">*</span></label>
                            <input v-model="newCustomer.sdt" type="tel" class="form-control" :class="{ 'is-invalid': newCustomerErrors.sdt }" />
                            <div v-if="newCustomerErrors.sdt" class="invalid-feedback">
                                {{ newCustomerErrors.sdt }}
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <input v-model="newCustomer.email" type="email" class="form-control" :class="{ 'is-invalid': newCustomerErrors.email }" />
                            <div v-if="newCustomerErrors.email" class="invalid-feedback">
                                {{ newCustomerErrors.email }}
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Địa chỉ</label>
                            <textarea v-model="newCustomer.diaChi" class="form-control" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="showCreateCustomerForm = false" class="btn btn-secondary">Hủy</button>
                        <button @click="taoKhachHangMoi" :disabled="loadingCreateCustomer" class="btn btn-primary">
                            <span v-if="loadingCreateCustomer" class="spinner-border spinner-border-sm me-2"></span>
                            {{ loadingCreateCustomer ? 'Đang tạo...' : 'Tạo khách hàng' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Invoice Print Modal -->
        <div v-if="showInvoicePrint" class="modal d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-printer me-2"></i>
                            Hóa đơn bán hàng
                        </h5>
                        <button @click="showInvoicePrint = false" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <div id="invoice-print" class="invoice-print">
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <h2 class="fw-bold">BEE SHOES STORE</h2>
                                    <p class="mb-1">Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</p>
                                    <p class="mb-1">Điện thoại: 0123-456-789</p>
                                    <p class="mb-0">Email: contact@beeshoes.com</p>
                                </div>
                                <div class="col-md-6 text-end">
                                    <h3 class="fw-bold">HÓA ĐƠN BÁN HÀNG</h3>
                                    <p class="mb-1"><strong>Số:</strong> {{ hoaDonDaThanhToan?.maHoaDon || 'HD001' }}</p>
                                    <p class="mb-1"><strong>Ngày:</strong> {{ formatDateTime(new Date()) }}</p>
                                    <p class="mb-0"><strong>Nhân viên:</strong> {{ nhanVienInfo.tenNhanVien }}</p>
                                </div>
                            </div>

                            <div class="table-responsive mb-4">
                                <table class="table-bordered table">
                                    <thead class="table-light">
                                        <tr>
                                            <th>STT</th>
                                            <th>Mã sản phẩm</th>
                                            <th>Tên sản phẩm</th>
                                            <th>Màu sắc</th>
                                            <th>Kích cỡ</th>
                                            <th class="text-end">Số lượng</th>
                                            <th class="text-end">Đơn giá</th>
                                            <th class="text-end">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(item, index) in sanPhamDaThanhToan" :key="index">
                                            <td>{{ index + 1 }}</td>
                                            <td>{{ item.maSanPham || item.id }}</td>
                                            <td>{{ item.tenSanPham }}</td>
                                            <td>{{ item.mauSac?.tenMau || 'N/A' }}</td>
                                            <td>{{ item.kichCo?.tenKichCo || 'N/A' }}</td>
                                            <td class="text-end">{{ item.soLuongDaChon }}</td>
                                            <td class="text-end">{{ formatPrice(item.giaBan) }}</td>
                                            <td class="text-end">{{ formatPrice(item.giaBan * item.soLuongDaChon) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div class="my-4 text-center">
                                <p class="fw-bold">Cảm ơn quý khách đã mua hàng!</p>
                                <p>Hàng đã mua chỉ được đổi trả trong vòng 7 ngày.</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="showInvoicePrint = false" class="btn btn-secondary">Đóng</button>
                        <button @click="printInvoice" class="btn btn-primary">
                            <i class="bi bi-printer me-1"></i>
                            In hóa đơn
                        </button>
                    </div>
                    <!-- Đóng modal cuối cùng -->
                </div>
                <!-- Đóng modal-dialog -->
            </div>
            <!-- Đóng modal cuối cùng -->
        </div>
        <!-- Đóng toast-container -->
    </div>
    <!-- Đóng main-layout -->
    <!-- Extra closing div removed -->
</template>
<style scoped>
/* =================== GLOBAL STYLES =================== */
.pos-container {
    height: 100vh;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f8fafc;
}

.main-layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.main-content {
    flex: 1;
    overflow: hidden;
    padding: 1rem 0;
}

/* =================== HEADER STYLES =================== */
.pos-header {
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%) !important;
}

.pos-header h3 {
    font-weight: 700;
    letter-spacing: -0.5px;
}

/* =================== INVOICE TABS =================== */
.invoice-tabs-section {
    flex-shrink: 0;
    border-bottom: 2px solid #e9ecef;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    background: #ffffff;
}

.invoice-tab {
    min-width: 120px;
    position: relative;
    transition: all 0.2s ease;
    white-space: nowrap;
    border-radius: 8px !important;
    font-weight: 500;
    font-size: 0.875rem;
}

.invoice-tab:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.invoice-tab:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.invoice-tab.btn-primary {
    background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
    border-color: #0d6efd;
    box-shadow: 0 2px 8px rgba(13, 110, 253, 0.3);
}

.btn-xs {
    font-size: 0.6rem;
    line-height: 1;
    padding: 2px;
}

/* =================== PANEL STYLES =================== */
.left-panel,
.right-panel {
    height: calc(100vh - 160px);
    overflow: hidden;
}

.left-panel {
    border-right: 1px solid #dee2e6;
}

.left-panel .card,
.right-panel .card {
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    border-radius: 0.75rem;
}

.card-header {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-bottom: 1px solid #dee2e6;
    font-weight: 600;
    font-size: 0.9rem;
    border-radius: 0.75rem 0.75rem 0 0 !important;
}

/* =================== PRODUCT TABLE =================== */
.table-responsive {
    border-radius: 0.75rem;
    border: 1px solid #dee2e6;
    overflow: hidden;
}

.table {
    margin-bottom: 0;
    font-size: 0.875rem;
}

.table thead th {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-bottom: 2px solid #dee2e6;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    position: sticky;
    top: 0;
    z-index: 10;
    color: #495057;
}

.table tbody tr {
    transition: all 0.15s ease;
}

.table tbody tr:hover {
    background-color: rgba(13, 110, 253, 0.05);
    transform: translateX(2px);
}

.table td {
    vertical-align: middle;
    padding: 0.75rem 0.5rem;
    border-color: #f1f3f4;
}

/* =================== PRODUCT MODAL STYLES =================== */
.product-card {
    transition: all 0.3s ease;
    cursor: pointer;
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    border-radius: 0.75rem;
    overflow: hidden;
}

.product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.15);
}

.product-card .card-img-top {
    transition: transform 0.3s ease;
    border-radius: 0.75rem 0.75rem 0 0;
}

.product-card:hover .card-img-top {
    transform: scale(1.05);
}

.product-card .card-body {
    padding: 1rem;
}

.product-card .card-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: #495057;
}

/* =================== RIGHT PANEL STYLES =================== */
.right-panel .card-header h6 {
    color: #495057;
    font-weight: 600;
}

.voucher-selected {
    background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%) !important;
    border: 2px solid #28a745 !important;
    box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
    border-radius: 0.5rem;
}

.summary-section {
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    padding: 1rem;
    border-radius: 0.75rem;
    border: 1px solid #e9ecef;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.summary-section hr {
    border-color: #dee2e6;
    opacity: 0.5;
}

/* =================== MODAL STYLES =================== */
.modal {
    backdrop-filter: blur(4px);
}

.modal-content {
    border: none;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    border-radius: 0.75rem;
    overflow: hidden;
}

.modal-header {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-bottom: 1px solid #dee2e6;
    border-radius: 0.75rem 0.75rem 0 0;
    padding: 1rem 1.5rem;
}

.modal-title {
    font-weight: 600;
    color: #495057;
    font-size: 1.1rem;
}

.modal-body {
    padding: 1.5rem;
}

.modal-footer {
    padding: 1rem 1.5rem;
    background: #f8f9fa;
    border-top: 1px solid #dee2e6;
}

/* =================== BUTTON STYLES =================== */
.btn {
    border-radius: 0.5rem;
    font-weight: 500;
    transition: all 0.2s ease;
    font-size: 0.875rem;
}

.btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-primary {
    background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
    border-color: #0d6efd;
    box-shadow: 0 2px 4px rgba(13, 110, 253, 0.2);
}

.btn-success {
    background: linear-gradient(135deg, #198754 0%, #157347 100%);
    border-color: #198754;
    box-shadow: 0 2px 4px rgba(25, 135, 84, 0.2);
}

.btn-danger {
    background: linear-gradient(135deg, #dc3545 0%, #bb2d3b 100%);
    border-color: #dc3545;
    box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
}

.btn-warning {
    background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%);
    border-color: #ffc107;
    color: #212529;
    box-shadow: 0 2px 4px rgba(255, 193, 7, 0.2);
}

.btn-outline-primary {
    border: 2px solid #0d6efd;
    color: #0d6efd;
}

.btn-outline-primary:hover {
    background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
    border-color: #0d6efd;
    color: white;
}

.btn-outline-success {
    border: 2px solid #198754;
    color: #198754;
}

.btn-outline-success:hover {
    background: linear-gradient(135deg, #198754 0%, #157347 100%);
    border-color: #198754;
    color: white;
}

.btn-outline-danger {
    border: 2px solid #dc3545;
    color: #dc3545;
}

.btn-outline-danger:hover {
    background: linear-gradient(135deg, #dc3545 0%, #bb2d3b 100%);
    border-color: #dc3545;
    color: white;
}

.btn-outline-secondary {
    border: 1px solid #6c757d;
    color: #6c757d;
}

.btn-outline-secondary:hover {
    background: #6c757d;
    border-color: #6c757d;
    color: white;
}

.btn-lg {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 0.75rem;
}

.btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
    border-radius: 0.375rem;
}

/* =================== FORM STYLES =================== */
.form-control,
.form-select {
    border-radius: 0.5rem;
    border: 1px solid #ced4da;
    transition: all 0.15s ease-in-out;
    font-size: 0.875rem;
}

.form-control:focus,
.form-select:focus {
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
    transform: translateY(-1px);
}

.form-label {
    font-weight: 600;
    color: #495057;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
}

.input-group .form-control {
    border-radius: 0.5rem 0 0 0.5rem;
}

.input-group .btn {
    border-radius: 0 0.5rem 0.5rem 0;
}

.is-invalid {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25) !important;
}

.invalid-feedback {
    display: block;
    width: 100%;
    margin-top: 0.25rem;
    font-size: 0.875em;
    color: #dc3545;
    font-weight: 500;
}

/* =================== BADGE STYLES =================== */
.badge {
    font-weight: 500;
    font-size: 0.75rem;
    padding: 0.375em 0.75em;
    border-radius: 0.375rem;
}

.badge.bg-light {
    color: #495057 !important;
    background-color: #f8f9fa !important;
    border: 1px solid #e9ecef;
}

.badge.bg-primary {
    background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%) !important;
}

.badge.bg-success {
    background: linear-gradient(135deg, #198754 0%, #157347 100%) !important;
}

.badge.bg-danger {
    background: linear-gradient(135deg, #dc3545 0%, #bb2d3b 100%) !important;
}

.badge.bg-warning {
    background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%) !important;
    color: #212529 !important;
}

/* =================== TOAST STYLES =================== */
.toast-container {
    z-index: 1100;
}

.toast {
    border: none;
    border-radius: 0.75rem;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    min-width: 300px;
    font-weight: 500;
}

.toast.text-bg-success {
    background: linear-gradient(135deg, #198754 0%, #157347 100%) !important;
}

.toast.text-bg-danger {
    background: linear-gradient(135deg, #dc3545 0%, #bb2d3b 100%) !important;
}

.toast.text-bg-warning {
    background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%) !important;
    color: #212529 !important;
}

.toast-body {
    padding: 1rem 1.25rem;
    font-size: 0.9rem;
}

/* =================== LIST GROUP STYLES =================== */
.list-group-item {
    border: 1px solid #dee2e6;
    transition: all 0.15s ease-in-out;
    border-radius: 0.5rem !important;
    margin-bottom: 0.5rem;
}

.list-group-item:last-child {
    margin-bottom: 0;
}

.list-group-item:hover {
    background-color: #f8f9fa;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.list-group-item-action {
    cursor: pointer;
    border-left: 3px solid transparent;
}

.list-group-item-action:hover {
    border-left-color: #0d6efd;
}

/* =================== PAGINATION STYLES =================== */
.pagination {
    gap: 0.5rem;
}

.page-item .page-link {
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    color: #6c757d;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.15s ease;
}

.page-item.active .page-link {
    background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(13, 110, 253, 0.3);
}

.page-item:not(.disabled) .page-link:hover {
    color: #0d6efd;
    background: #e7f1ff;
    transform: translateY(-1px);
}

.page-item.disabled .page-link {
    opacity: 0.5;
    cursor: not-allowed;
}

/* =================== SPINNER STYLES =================== */
.spinner-border-sm {
    width: 1rem;
    height: 1rem;
    border-width: 0.125em;
}

.spinner-border {
    animation: spinner-border-animation 0.75s linear infinite;
}

@keyframes spinner-border-animation {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

/* =================== QR SCANNER STYLES =================== */
.nav-tabs {
    border-bottom: 2px solid #dee2e6;
}

.nav-tabs .nav-link {
    border: none;
    border-radius: 0.5rem 0.5rem 0 0;
    color: #6c757d;
    font-weight: 500;
    padding: 0.75rem 1.5rem;
    margin-bottom: -2px;
}

.nav-tabs .nav-link.active {
    background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
    color: white;
    border-bottom: 2px solid #0d6efd;
}

.nav-tabs .nav-link:hover:not(.active) {
    background: #e7f1ff;
    color: #0d6efd;
}

#qr-video {
    border-radius: 0.75rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* =================== INVOICE PRINT STYLES =================== */
.invoice-print {
    background: white;
    color: black !important;
    font-family: 'Times New Roman', serif;
    padding: 2rem;
}

.invoice-print h1,
.invoice-print h2,
.invoice-print h3,
.invoice-print h4,
.invoice-print h5,
.invoice-print h6 {
    color: black !important;
    font-weight: bold;
}

.invoice-print .table {
    color: black !important;
    border-collapse: collapse;
}

.invoice-print .table th {
    background-color: #f8f9fa !important;
    color: black !important;
    font-weight: bold;
    padding: 0.75rem;
    text-align: center;
}

.invoice-print .table td {
    color: black !important;
    padding: 0.75rem;
    border: 1px solid #dee2e6;
}

.invoice-print .table-bordered th,
.invoice-print .table-bordered td {
    border: 1px solid #000 !important;
}

.invoice-print .text-end {
    text-align: right !important;
}

/* =================== ANIMATIONS =================== */
.fade-in {
    animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.slide-in {
    animation: slideIn 0.3s ease-out;
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

.bounce-in {
    animation: bounceIn 0.6s ease-out;
}

@keyframes bounceIn {
    0% {
        opacity: 0;
        transform: scale(0.3);
    }
    50% {
        opacity: 1;
        transform: scale(1.05);
    }
    70% {
        transform: scale(0.9);
    }
    100% {
        opacity: 1;
        transform: scale(1);
    }
}

/* =================== SCROLLBAR STYLES =================== */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
}

::-webkit-scrollbar-corner {
    background: #f1f5f9;
}

/* =================== RESPONSIVE STYLES =================== */
@media (max-width: 992px) {
    .main-content .row {
        flex-direction: column;
    }

    .left-panel {
        height: auto;
        min-height: 50vh;
        border-right: none;
        border-bottom: 1px solid #dee2e6;
    }

    .right-panel {
        height: auto;
        min-height: 40vh;
    }
}

@media (max-width: 768px) {
    .pos-header h3 {
        font-size: 1.25rem;
    }

    .modal-dialog {
        margin: 0.5rem;
    }

    .modal-xl,
    .modal-lg {
        max-width: calc(100vw - 1rem);
    }

    .btn {
        font-size: 0.8rem;
        padding: 0.5rem 1rem;
    }

    .btn-sm {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
    }

    .table {
        font-size: 0.8rem;
    }

    .card-body {
        padding: 0.75rem;
    }
}

@media (max-width: 576px) {
    .pos-container {
        font-size: 14px;
    }

    .invoice-tab {
        min-width: 80px;
        font-size: 0.75rem;
    }

    .table th,
    .table td {
        padding: 0.5rem 0.25rem;
        font-size: 0.75rem;
    }

    .modal-body {
        padding: 1rem;
    }

    .form-control,
    .form-select {
        font-size: 0.8rem;
    }
}

/* =================== PRINT STYLES =================== */
@media print {
    .modal-header,
    .modal-footer,
    .btn,
    .no-print {
        display: none !important;
    }

    .modal-body {
        padding: 0 !important;
    }

    .invoice-print {
        margin: 0;
        padding: 20px;
        box-shadow: none !important;
    }

    .modal-content {
        border: none !important;
        box-shadow: none !important;
    }

    .modal-dialog {
        margin: 0 !important;
        max-width: 100% !important;
    }

    body {
        font-size: 12px !important;
    }

    .table {
        font-size: 11px !important;
    }
}

/* =================== UTILITY CLASSES =================== */
.text-truncate-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.text-truncate-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.cursor-pointer {
    cursor: pointer;
}

.cursor-not-allowed {
    cursor: not-allowed;
}

.user-select-none {
    user-select: none;
}

.shadow-sm-hover:hover {
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.1) !important;
}

.shadow-hover:hover {
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}

/* =================== ACCESSIBILITY =================== */
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}

@media (prefers-contrast: high) {
    .card,
    .modal-content,
    .btn {
        border: 2px solid #000000;
    }

    .form-control,
    .form-select {
        border: 2px solid #000000;
    }
}

/* =================== FOCUS STYLES =================== */
.btn:focus,
.form-control:focus,
.form-select:focus {
    outline: 2px solid #0d6efd;
    outline-offset: 2px;
}

/* =================== LOADING STATES =================== */
.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    border-radius: 0.75rem;
}

.loading-backdrop {
    backdrop-filter: blur(2px);
}

/* =================== ERROR STATES =================== */
.error-container {
    background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
    border: 2px solid #feb2b2;
    border-radius: 0.75rem;
    padding: 2rem;
    text-align: center;
    color: #742a2a;
}

.error-container i {
    font-size: 3rem;
    color: #e53e3e;
    margin-bottom: 1rem;
}

/* =================== SUCCESS STATES =================== */
.success-container {
    background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
    border: 2px solid #9ae6b4;
    border-radius: 0.75rem;
    padding: 2rem;
    text-align: center;
    color: #1a202c;
}

.success-container i {
    font-size: 3rem;
    color: #38a169;
    margin-bottom: 1rem;
}
</style>
