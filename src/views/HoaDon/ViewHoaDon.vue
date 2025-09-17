<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

// ===== AUTHENTICATION & API SETUP =====
const API_BASE_URL = 'http://localhost:8080';
const API_ENDPOINTS = {
    hoaDon: `${API_BASE_URL}/hoa-don`,
    hoaDonPOS: `${API_BASE_URL}/hoa-don/pos`,
    hoaDonOnline: `${API_BASE_URL}/hoa-don/online`,
    hoaDonChiTiet: `${API_BASE_URL}/api/hoa-don-chi-tiet`
};

function getAuthHeaders() {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

    if (token) {
        return {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        };
    }

    return {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    };
}

async function fetchWithErrorHandling(url, options = {}) {
    try {
        const authHeaders = getAuthHeaders();

        const response = await fetch(url, {
            headers: {
                ...authHeaders,
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication failed - Token không hợp lệ hoặc đã hết hạn');
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error for ${url}:`, error);
        throw error;
    }
}

// ===== REACTIVE DATA =====
const toast = useToast();

// Main data
const hoaDons = ref([]);
const isLoading = ref(false);
const hasError = ref(false);
const errorMessage = ref('');
const loadingMessage = ref('');

// Filter & Search
const searchKeyword = ref('');
const statusFilter = ref('');
const typeFilter = ref('');
const dateFilter = ref(null);
const showAdvancedFilter = ref(false);
const minAmount = ref(null);
const maxAmount = ref(null);
const staffFilter = ref('');
const paymentMethodFilter = ref('');

// Tab management
const activeTab = ref('all');
const tabs = ref([
    { id: 'all', label: 'Tất cả', icon: 'pi pi-list', count: 0 },
    { id: 'pos', label: 'POS', icon: 'pi pi-desktop', count: 0 },
    { id: 'online', label: 'Online', icon: 'pi pi-globe', count: 0 },
    { id: 'pending', label: 'Cần xử lý', icon: 'pi pi-clock', count: 0 }
]);

// Sorting & Pagination
const sortField = ref('');
const sortOrder = ref('asc');
const itemsPerPage = ref(10);

// Modal refs
const detailModal = ref(null);
const statusModal = ref(null);

// Chi tiết hóa đơn
const showChiTietDialog = ref(false);
const selectedHoaDon = ref(null);
const hoaDonChiTiets = ref([]);
const isLoadingChiTiet = ref(false);
const searchChiTietKeyword = ref('');
const editingItemId = ref(null);
const editQuantity = ref(1);

// Status update
const showStatusUpdateDialog = ref(false);
const selectedInvoiceForUpdate = ref(null);
const newStatus = ref('');
const statusNote = ref('');

// Static data
const staffList = ref([
    { id: 1, name: 'Nhân viên A' },
    { id: 2, name: 'Nhân viên B' }
]);

// ===== API FUNCTIONS =====
async function fetchAllData() {
    isLoading.value = true;
    hasError.value = false;
    loadingMessage.value = 'Đang kết nối đến server...';

    try {
        loadingMessage.value = 'Đang tải danh sách hóa đơn...';
        const response = await fetchWithErrorHandling(API_ENDPOINTS.hoaDon);

        let data = [];
        if (Array.isArray(response)) {
            data = response;
        } else if (response.success && response.data) {
            data = Array.isArray(response.data) ? response.data : [];
        }

        hoaDons.value = data.map(normalizeHoaDon);

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã tải ${hoaDons.value.length} hóa đơn`,
            life: 3000
        });
    } catch (error) {
        console.error('Error in fetchAllData:', error);
        hasError.value = true;

        if (error.message.includes('Authentication failed') || error.message.includes('401')) {
            errorMessage.value = 'Phiên đăng nhập đã hết hạn';
            toast.add({
                severity: 'error',
                summary: 'Lỗi xác thực',
                detail: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                life: 5000
            });
        } else {
            errorMessage.value = `Không thể kết nối đến API: ${error.message}`;
            toast.add({
                severity: 'error',
                summary: 'Lỗi kết nối',
                detail: 'Không thể tải dữ liệu từ server.',
                life: 3000
            });

            hoaDons.value = createSampleData();
        }
    } finally {
        isLoading.value = false;
        loadingMessage.value = '';
    }
}

async function fetchChiTietHoaDon(hoaDonId) {
    isLoadingChiTiet.value = true;
    try {
        const endpoint = `${API_ENDPOINTS.hoaDonChiTiet}/by-hoa-don/${hoaDonId}`;
        const response = await fetchWithErrorHandling(endpoint);

        let data = [];
        if (response.success && response.data) {
            data = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
            data = response;
        }

        hoaDonChiTiets.value = data;

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã tải ${hoaDonChiTiets.value.length} chi tiết sản phẩm`,
            life: 3000
        });
    } catch (error) {
        console.error('Error fetching chi tiet:', error);
        hoaDonChiTiets.value = createSampleChiTietData(hoaDonId);

        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Không thể tải chi tiết từ API, hiển thị dữ liệu mẫu',
            life: 3000
        });
    } finally {
        isLoadingChiTiet.value = false;
    }
}

async function processNextStep(hoaDon) {
    try {
        const currentStep = normalizeStatus(hoaDon.trangThaiHoaDon);
        const steps = getWorkflowSteps(hoaDon.loaiHoaDon);
        const currentIndex = steps.indexOf(currentStep);

        if (currentIndex >= 0 && currentIndex < steps.length - 1) {
            const nextStep = steps[currentIndex + 1];

            // ✅ FIX: Sử dụng đúng endpoint format từ backend
            const endpoint = `${API_ENDPOINTS.hoaDon}/${hoaDon.id}/trang-thai`;
            const requestData = {
                trangThai: nextStep,
                ghiChu: `Cập nhật trạng thái từ ${getStatusLabel(currentStep)} sang ${getStatusLabel(nextStep)}`
            };

            const response = await fetchWithErrorHandling(endpoint, {
                method: 'PUT',
                body: JSON.stringify(requestData)
            });

            // ✅ FIX: Xử lý response đúng cách
            let updatedHoaDon = null;
            if (response && response.id) {
                // Response trả về trực tiếp HoaDonDTO
                updatedHoaDon = normalizeHoaDon(response);
            } else if (response && response.data) {
                // Response có wrapper
                updatedHoaDon = normalizeHoaDon(response.data);
            }

            if (updatedHoaDon) {
                // ✅ FIX: Cập nhật dữ liệu trong danh sách
                const index = hoaDons.value.findIndex((hd) => hd.id === hoaDon.id);
                if (index !== -1) {
                    hoaDons.value[index] = updatedHoaDon;
                }

                // ✅ FIX: Cập nhật selectedHoaDon nếu đang xem chi tiết
                if (selectedHoaDon.value && selectedHoaDon.value.id === hoaDon.id) {
                    selectedHoaDon.value = updatedHoaDon;
                }

                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: `Đã cập nhật trạng thái sang ${getStatusLabel(nextStep)}`,
                    life: 3000
                });
            } else {
                throw new Error('Không nhận được dữ liệu cập nhật từ server');
            }
        } else {
            throw new Error('Không thể chuyển sang bước tiếp theo');
        }
    } catch (error) {
        console.error('Error processing next step:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: `Không thể cập nhật trạng thái: ${error.message}`,
            life: 3000
        });
    }
}

async function cancelInvoice(hoaDon) {
    const reason = prompt('Nhập lý do hủy đơn hàng:');
    if (!reason || reason.trim() === '') {
        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Vui lòng nhập lý do hủy đơn',
            life: 3000
        });
        return;
    }

    try {
        const endpoint = `${API_ENDPOINTS.hoaDon}/${hoaDon.id}/huy`;
        const requestData = { lyDo: reason };

        const response = await fetchWithErrorHandling(endpoint, {
            method: 'PUT',
            body: JSON.stringify(requestData)
        });

        // ✅ FIX: Xử lý response đúng cách
        let updatedHoaDon = null;
        if (response && response.id) {
            updatedHoaDon = normalizeHoaDon(response);
        } else if (response && response.data) {
            updatedHoaDon = normalizeHoaDon(response.data);
        }

        if (updatedHoaDon) {
            const index = hoaDons.value.findIndex((hd) => hd.id === hoaDon.id);
            if (index !== -1) {
                hoaDons.value[index] = updatedHoaDon;
            }

            if (selectedHoaDon.value && selectedHoaDon.value.id === hoaDon.id) {
                selectedHoaDon.value = updatedHoaDon;
            }

            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Đã hủy đơn hàng thành công',
                life: 3000
            });
        } else {
            throw new Error('Không nhận được dữ liệu cập nhật từ server');
        }
    } catch (error) {
        console.error('Error cancelling invoice:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: `Không thể hủy đơn hàng: ${error.message}`,
            life: 3000
        });
    }
}

async function confirmStatusUpdate() {
    if (!newStatus.value) {
        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Vui lòng chọn trạng thái mới',
            life: 3000
        });
        return;
    }

    try {
        const endpoint = `${API_ENDPOINTS.hoaDon}/${selectedInvoiceForUpdate.value.id}/trang-thai`;
        const requestData = {
            trangThai: newStatus.value,
            ghiChu: statusNote.value || `Cập nhật trạng thái sang ${getStatusLabel(newStatus.value)}`
        };

        console.log('Sending request:', requestData); // Debug log

        const response = await fetchWithErrorHandling(endpoint, {
            method: 'PUT',
            body: JSON.stringify(requestData)
        });

        console.log('Received response:', response); // Debug log

        // ✅ FIX: Xử lý response đúng cách
        let updatedHoaDon = null;
        if (response && response.id) {
            updatedHoaDon = normalizeHoaDon(response);
        } else if (response && response.data) {
            updatedHoaDon = normalizeHoaDon(response.data);
        }

        if (updatedHoaDon) {
            // ✅ FIX: Cập nhật dữ liệu
            const index = hoaDons.value.findIndex((hd) => hd.id === selectedInvoiceForUpdate.value.id);
            if (index !== -1) {
                hoaDons.value[index] = updatedHoaDon;
                console.log('Updated invoice in list:', hoaDons.value[index]); // Debug log
            }

            if (selectedHoaDon.value && selectedHoaDon.value.id === selectedInvoiceForUpdate.value.id) {
                selectedHoaDon.value = updatedHoaDon;
                console.log('Updated selectedHoaDon:', selectedHoaDon.value); // Debug log
            }

            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Cập nhật trạng thái thành công sang ${getStatusLabel(newStatus.value)}`,
                life: 3000
            });

            closeStatusUpdateDialog();
        } else {
            throw new Error('Không nhận được dữ liệu cập nhật từ server');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: `Không thể cập nhật trạng thái: ${error.message}`,
            life: 3000
        });
    }
}

async function saveQuantity(itemId) {
    try {
        const endpoint = `${API_ENDPOINTS.hoaDonChiTiet}/${itemId}/quantity`;
        const response = await fetchWithErrorHandling(endpoint, {
            method: 'PUT',
            body: JSON.stringify({ soLuong: editQuantity.value })
        });

        if (response.success) {
            const index = hoaDonChiTiets.value.findIndex((item) => item.id === itemId);
            if (index !== -1) {
                if (response.data) {
                    hoaDonChiTiets.value[index] = response.data;
                } else {
                    hoaDonChiTiets.value[index].soLuong = editQuantity.value;
                    hoaDonChiTiets.value[index].thanhTien = hoaDonChiTiets.value[index].giaBan * editQuantity.value;
                }
            }

            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: response.message || 'Cập nhật số lượng thành công',
                life: 3000
            });
            cancelEdit();
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể cập nhật số lượng',
            life: 3000
        });
    }
}

async function removeItem(itemId) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    try {
        const endpoint = `${API_ENDPOINTS.hoaDonChiTiet}/remove-product/${itemId}`;
        const response = await fetchWithErrorHandling(endpoint, { method: 'DELETE' });

        if (response.success) {
            const index = hoaDonChiTiets.value.findIndex((item) => item.id === itemId);
            if (index !== -1) {
                hoaDonChiTiets.value.splice(index, 1);
            }

            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: response.message || 'Đã xóa sản phẩm',
                life: 3000
            });
        }
    } catch (error) {
        console.error('Error removing item:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể xóa sản phẩm',
            life: 3000
        });
    }
}

// ===== SAMPLE DATA FUNCTIONS =====
function createSampleData() {
    return [
        {
            id: 1,
            maHoaDon: 'HD001',
            tenKhachHang: 'Nguyễn Văn A',
            sdt: '0912345671',
            email: 'user1@example.com',
            tongTien: 2400000.0,
            trangThaiHoaDon: 'COMPLETED',
            loaiHoaDon: 'ONLINE',
            ngayTao: new Date('2025-01-01T10:00:00.000Z'),
            phuongThucThanhToan: 'BANK_TRANSFER'
        },
        {
            id: 2,
            maHoaDon: 'HD002',
            tenKhachHang: 'Trần Văn B',
            sdt: '0912345672',
            email: 'user2@example.com',
            tongTien: 900000.0,
            trangThaiHoaDon: 'PENDING',
            loaiHoaDon: 'ONLINE',
            ngayTao: new Date('2025-01-01T11:00:00.000Z'),
            phuongThucThanhToan: 'COD'
        },
        {
            id: 3,
            maHoaDon: 'HD003',
            tenKhachHang: 'Lê Văn C',
            sdt: '0912345673',
            tongTien: 1200000.0,
            trangThaiHoaDon: 'COMPLETED',
            loaiHoaDon: 'OFFLINE',
            ngayTao: new Date('2025-01-01T12:00:00.000Z'),
            phuongThucThanhToan: 'CASH'
        }
    ];
}

function createSampleChiTietData(hoaDonId) {
    return [
        {
            id: 1,
            hoaDonId: hoaDonId,
            tenSanPham: 'Giày Nike Air Max',
            maSanPham: 'SP001',
            mauSac: 'Đen',
            kichThuoc: '42',
            giaBan: 1200000.0,
            giaGoc: 1500000.0,
            soLuong: 1,
            thanhTien: 1200000.0,
            tienTietKiem: 300000.0
        },
        {
            id: 2,
            hoaDonId: hoaDonId,
            tenSanPham: 'Áo thun Adidas',
            maSanPham: 'SP002',
            mauSac: 'Trắng',
            kichThuoc: 'L',
            giaBan: 600000.0,
            giaGoc: 800000.0,
            soLuong: 2,
            thanhTien: 1200000.0,
            tienTietKiem: 400000.0
        }
    ];
}

// ===== COMPUTED PROPERTIES =====
const filteredHoaDons = computed(() => {
    let filtered = [...hoaDons.value];

    if (activeTab.value === 'pos') {
        filtered = filtered.filter((hd) => hd.loaiHoaDon && hd.loaiHoaDon.toUpperCase() === 'OFFLINE');
    } else if (activeTab.value === 'online') {
        filtered = filtered.filter((hd) => hd.loaiHoaDon && hd.loaiHoaDon.toUpperCase() === 'ONLINE');
    } else if (activeTab.value === 'pending') {
        filtered = filtered.filter((hd) => {
            const status = normalizeStatus(hd.trangThaiHoaDon);
            return ['PENDING', 'CONFIRMED', 'SHIPPING'].includes(status);
        });
    }

    if (searchKeyword.value.trim()) {
        const keyword = searchKeyword.value.toLowerCase();
        filtered = filtered.filter(
            (hd) => (hd.maHoaDon && hd.maHoaDon.toLowerCase().includes(keyword)) || getCustomerName(hd).toLowerCase().includes(keyword) || (hd.sdt && hd.sdt.includes(keyword)) || (hd.email && hd.email.toLowerCase().includes(keyword))
        );
    }

    if (typeFilter.value) {
        filtered = filtered.filter((hd) => hd.loaiHoaDon && hd.loaiHoaDon.toUpperCase() === typeFilter.value);
    }

    if (statusFilter.value) {
        filtered = filtered.filter((hd) => {
            const status = normalizeStatus(hd.trangThaiHoaDon);
            return status === statusFilter.value;
        });
    }

    if (dateFilter.value) {
        const filterDate = new Date(dateFilter.value).toDateString();
        filtered = filtered.filter((hd) => {
            const hoaDonDate = new Date(hd.ngayTao).toDateString();
            return hoaDonDate === filterDate;
        });
    }

    if (minAmount.value || maxAmount.value) {
        filtered = filtered.filter((hd) => {
            const amount = parseFloat(hd.tongTien) || 0;
            const min = minAmount.value ? parseFloat(minAmount.value) : 0;
            const max = maxAmount.value ? parseFloat(maxAmount.value) : Infinity;
            return amount >= min && amount <= max;
        });
    }

    if (staffFilter.value) {
        filtered = filtered.filter((hd) => hd.nhanVienId === staffFilter.value);
    }

    if (paymentMethodFilter.value) {
        filtered = filtered.filter((hd) => hd.phuongThucThanhToan === paymentMethodFilter.value);
    }

    return filtered;
});

const filteredChiTiets = computed(() => {
    if (!searchChiTietKeyword.value.trim()) {
        return hoaDonChiTiets.value;
    }

    const keyword = searchChiTietKeyword.value.toLowerCase();
    return hoaDonChiTiets.value.filter((item) => (item.id && item.id.toString().includes(keyword)) || (item.tenSanPham && item.tenSanPham.toLowerCase().includes(keyword)) || (item.maSanPham && item.maSanPham.toLowerCase().includes(keyword)));
});

// Statistics
const posInvoices = computed(() => {
    return hoaDons.value.filter((hd) => {
        const type = hd.loaiHoaDon ? hd.loaiHoaDon.toUpperCase() : '';
        return type === 'OFFLINE';
    });
});

const onlineInvoices = computed(() => {
    return hoaDons.value.filter((hd) => {
        const type = hd.loaiHoaDon ? hd.loaiHoaDon.toUpperCase() : '';
        return type === 'ONLINE';
    });
});

const totalRevenue = computed(() => {
    return hoaDons.value
        .filter((hd) => {
            const status = normalizeStatus(hd.trangThaiHoaDon);
            return status === 'COMPLETED';
        })
        .reduce((sum, hd) => sum + (parseFloat(hd.tongTien) || 0), 0);
});

const posRevenue = computed(() => {
    return posInvoices.value
        .filter((hd) => {
            const status = normalizeStatus(hd.trangThaiHoaDon);
            return status === 'COMPLETED';
        })
        .reduce((sum, hd) => sum + (parseFloat(hd.tongTien) || 0), 0);
});

const onlineRevenue = computed(() => {
    return onlineInvoices.value
        .filter((hd) => {
            const status = normalizeStatus(hd.trangThaiHoaDon);
            return status === 'COMPLETED';
        })
        .reduce((sum, hd) => sum + (parseFloat(hd.tongTien) || 0), 0);
});

const completedInvoices = computed(() => {
    return hoaDons.value.filter((hd) => {
        const status = normalizeStatus(hd.trangThaiHoaDon);
        return status === 'COMPLETED';
    }).length;
});

const pendingInvoices = computed(() => {
    return hoaDons.value.filter((hd) => {
        const status = normalizeStatus(hd.trangThaiHoaDon);
        return ['PENDING', 'CONFIRMED', 'SHIPPING'].includes(status);
    }).length;
});

const urgentInvoices = computed(() => {
    const urgentStatuses = ['PENDING'];
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return hoaDons.value.filter((hd) => {
        const status = normalizeStatus(hd.trangThaiHoaDon);
        return urgentStatuses.includes(status) && new Date(hd.ngayTao) < oneDayAgo;
    }).length;
});

const completionRate = computed(() => {
    if (hoaDons.value.length === 0) return 0;
    return Math.round((completedInvoices.value / hoaDons.value.length) * 100);
});

// ===== UTILITY FUNCTIONS =====
function normalizeHoaDon(hd) {
    let ngayTaoDate = null;
    if (hd.ngayTao) {
        ngayTaoDate = new Date(hd.ngayTao);
        if (isNaN(ngayTaoDate.getTime())) {
            ngayTaoDate = new Date();
        }
    } else {
        ngayTaoDate = new Date();
    }

    return {
        ...hd,
        ngayTao: ngayTaoDate,
        ngayXacNhan: hd.ngayXacNhan ? new Date(hd.ngayXacNhan) : null
    };
}

function goToLogin() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('token');
    sessionStorage.clear();
    window.location.href = '/login';
}

function formatDate(date) {
    if (!date) return 'N/A';
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return 'N/A';
    return parsedDate.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCurrency(amount) {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function getInitials(name) {
    if (!name) return 'KH';
    return name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getCustomerName(hoaDon) {
    return hoaDon.tenKhachHang || hoaDon.tenNguoiDung || hoaDon.customerName || hoaDon.userName || (hoaDon.khachHang && hoaDon.khachHang.hoTen) || 'Khách lẻ';
}

function getStatusLabel(status) {
    if (!status) return 'Không xác định';

    const statusMap = {
        PENDING: 'Chờ xác nhận',
        CONFIRMED: 'Đã xác nhận',
        SHIPPING: 'Đang giao',
        DELIVERED: 'Đã giao',
        COMPLETED: 'Hoàn thành',
        CANCELLED: 'Đã hủy',
        RETURNED: 'Hoàn trả'
    };

    return statusMap[status.toUpperCase()] || statusMap[status] || status;
}

function getStatusColor(status) {
    if (!status) return 'secondary';

    const statusLower = status.toString().toLowerCase();

    if (statusLower.includes('pending') || statusLower.includes('chờ')) {
        return 'warning';
    } else if (statusLower.includes('confirmed') || statusLower.includes('xác nhận')) {
        return 'info';
    } else if (statusLower.includes('shipping') || statusLower.includes('giao')) {
        return 'dark';
    } else if (statusLower.includes('completed') || statusLower.includes('hoàn thành')) {
        return 'success';
    } else if (statusLower.includes('cancelled') || statusLower.includes('hủy')) {
        return 'danger';
    } else if (statusLower.includes('delivered')) {
        return 'primary';
    } else {
        return 'secondary';
    }
}

function getStatusIcon(status) {
    if (!status) return 'pi pi-question-circle';

    const statusLower = status.toString().toLowerCase();

    if (statusLower.includes('pending') || statusLower.includes('chờ')) {
        return 'pi pi-clock';
    } else if (statusLower.includes('confirmed') || statusLower.includes('xác nhận')) {
        return 'pi pi-check-circle';
    } else if (statusLower.includes('shipping') || statusLower.includes('giao')) {
        return 'pi pi-truck';
    } else if (statusLower.includes('completed') || statusLower.includes('hoàn thành')) {
        return 'pi pi-verified';
    } else if (statusLower.includes('cancelled') || statusLower.includes('hủy')) {
        return 'pi pi-times-circle';
    } else if (statusLower.includes('delivered')) {
        return 'pi pi-home';
    } else {
        return 'pi pi-circle';
    }
}

// ===== WORKFLOW FUNCTIONS =====
function getWorkflowSteps(loaiHoaDon) {
    const normalizedType = loaiHoaDon ? loaiHoaDon.toUpperCase() : '';
    if (normalizedType === 'OFFLINE') {
        return ['PENDING', 'COMPLETED'];
    } else {
        return ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'COMPLETED'];
    }
}

function getStepBootstrapClass(hoaDon, step) {
    const normalizedCurrentStep = normalizeStatus(hoaDon.trangThaiHoaDon);
    const steps = getWorkflowSteps(hoaDon.loaiHoaDon);
    const currentIndex = steps.indexOf(normalizedCurrentStep);
    const stepIndex = steps.indexOf(step);

    if (stepIndex < currentIndex) {
        return 'bg-success text-white';
    } else if (stepIndex === currentIndex) {
        return 'bg-primary text-white';
    } else {
        return 'bg-light text-muted border';
    }
}

function getDetailStepBootstrapClass(hoaDon, step) {
    const normalizedCurrentStep = normalizeStatus(hoaDon.trangThaiHoaDon);
    const steps = getWorkflowSteps(hoaDon.loaiHoaDon);
    const currentIndex = steps.indexOf(normalizedCurrentStep);
    const stepIndex = steps.indexOf(step);

    if (stepIndex < currentIndex) {
        return 'bg-success border-success text-white';
    } else if (stepIndex === currentIndex) {
        return 'bg-primary border-primary text-white';
    } else {
        return 'bg-white border-secondary text-muted';
    }
}

function isStepCompleted(hoaDon, step) {
    const normalizedCurrentStep = normalizeStatus(hoaDon.trangThaiHoaDon);
    const steps = getWorkflowSteps(hoaDon.loaiHoaDon);
    const currentIndex = steps.indexOf(normalizedCurrentStep);
    const stepIndex = steps.indexOf(step);
    return stepIndex < currentIndex;
}

function isStepActive(hoaDon, step) {
    const normalizedCurrentStep = normalizeStatus(hoaDon.trangThaiHoaDon);
    return normalizedCurrentStep === step;
}

function getStepIcon(step) {
    const iconMap = {
        PENDING: 'pi pi-clock',
        CONFIRMED: 'pi pi-check',
        SHIPPING: 'pi pi-truck',
        DELIVERED: 'pi pi-home',
        COMPLETED: 'pi pi-check-circle'
    };
    return iconMap[step] || 'pi pi-circle';
}

function getStepLabel(step) {
    const labelMap = {
        PENDING: 'Chờ xác nhận',
        CONFIRMED: 'Đã xác nhận',
        SHIPPING: 'Đang giao',
        DELIVERED: 'Đã giao',
        COMPLETED: 'Hoàn thành'
    };
    return labelMap[step] || step;
}

// ===== STATUS FUNCTIONS =====
function canUpdateStatus(hoaDon) {
    if (!hoaDon) return false;

    const normalizedStatus = normalizeStatus(hoaDon.trangThaiHoaDon);
    const terminalStates = ['COMPLETED', 'CANCELLED', 'RETURNED'];
    const hasTerminalStatus = terminalStates.includes(normalizedStatus);

    const availableStatuses = getAvailableStatuses(hoaDon);
    const hasAvailableTransitions = availableStatuses.length > 0;

    return !hasTerminalStatus && hasAvailableTransitions;
}

function canProcessNextStep(hoaDon) {
    const steps = getWorkflowSteps(hoaDon.loaiHoaDon);
    const normalizedStatus = normalizeStatus(hoaDon.trangThaiHoaDon);
    const currentIndex = steps.indexOf(normalizedStatus);
    return currentIndex >= 0 && currentIndex < steps.length - 1;
}

function getNextStepAction(hoaDon) {
    const normalizedStatus = normalizeStatus(hoaDon.trangThaiHoaDon);
    const actionMap = {
        PENDING: 'Xác nhận',
        CONFIRMED: 'Giao hàng',
        SHIPPING: 'Đã giao',
        DELIVERED: 'Hoàn thành'
    };
    return actionMap[normalizedStatus] || 'Tiếp theo';
}

function canCancelInvoice(hoaDon) {
    const normalizedStatus = normalizeStatus(hoaDon.trangThaiHoaDon);
    const cancelableStates = ['PENDING', 'CONFIRMED'];
    return cancelableStates.includes(normalizedStatus);
}

function canEditItems(hoaDon) {
    const normalizedStatus = normalizeStatus(hoaDon.trangThaiHoaDon);
    const normalizedType = hoaDon.loaiHoaDon ? hoaDon.loaiHoaDon.toUpperCase() : '';
    if (normalizedType === 'OFFLINE') {
        return normalizedStatus === 'PENDING';
    } else {
        return normalizedStatus === 'PENDING';
    }
}

function getAvailableStatuses(hoaDon) {
    if (!hoaDon) return [];

    const currentStatus = normalizeStatus(hoaDon.trangThaiHoaDon);
    const availableSteps = [];

    switch (currentStatus) {
        case 'PENDING':
            availableSteps.push({ value: 'CONFIRMED', label: 'Đã xác nhận' });
            break;
        case 'CONFIRMED':
            availableSteps.push({ value: 'SHIPPING', label: 'Đang giao' });
            break;
        case 'SHIPPING':
            availableSteps.push({ value: 'DELIVERED', label: 'Đã giao' });
            break;
        case 'DELIVERED':
            availableSteps.push({ value: 'COMPLETED', label: 'Hoàn thành' });
            break;
    }

    const terminalStates = ['COMPLETED', 'CANCELLED', 'RETURNED'];
    if (!terminalStates.includes(currentStatus)) {
        availableSteps.push({
            value: 'CANCELLED',
            label: 'Hủy đơn'
        });
    }

    return availableSteps;
}

function normalizeStatus(status) {
    if (!status) return '';

    const statusStr = status.toString().trim().toUpperCase();

    // Map các trạng thái tiếng Việt sang tiếng Anh
    const vietnameseToEnglish = {
        CHO_XAC_NHAN: 'PENDING',
        DA_XAC_NHAN: 'CONFIRMED',
        DANG_GIAO: 'SHIPPING',
        DA_GIAO: 'DELIVERED',
        HOAN_THANH: 'COMPLETED',
        DA_HUY: 'CANCELLED',
        HOAN_TRA: 'RETURNED'
    };

    // Nếu có mapping thì dùng, không thì giữ nguyên
    return vietnameseToEnglish[statusStr] || statusStr;
}

function needsNote(status) {
    return status === 'CANCELLED';
}

// ===== MODAL FUNCTIONS =====
function showModal(modalRef) {
    if (modalRef.value) {
        const modalInstance = new bootstrap.Modal(modalRef.value);
        modalInstance.show();
    }
}

function hideModal(modalRef) {
    if (modalRef.value) {
        const modalInstance = bootstrap.Modal.getInstance(modalRef.value);
        if (modalInstance) {
            modalInstance.hide();
        }
    }
}

async function viewChiTiet(hoaDon) {
    selectedHoaDon.value = { ...hoaDon };
    searchChiTietKeyword.value = '';
    showChiTietDialog.value = true;

    await nextTick();
    showModal(detailModal);

    await fetchChiTietHoaDon(hoaDon.id);
}

function closeChiTietDialog() {
    hideModal(detailModal);
    showChiTietDialog.value = false;
    selectedHoaDon.value = null;
    hoaDonChiTiets.value = [];
    searchChiTietKeyword.value = '';
    editingItemId.value = null;
}

function updateInvoiceStatus(hoaDon) {
    selectedInvoiceForUpdate.value = { ...hoaDon };
    newStatus.value = '';
    statusNote.value = '';
    showStatusUpdateDialog.value = true;

    nextTick(() => {
        showModal(statusModal);
    });
}

function closeStatusUpdateDialog() {
    hideModal(statusModal);
    showStatusUpdateDialog.value = false;
    selectedInvoiceForUpdate.value = null;
    newStatus.value = '';
    statusNote.value = '';
}

// ===== ITEM EDITING FUNCTIONS =====
function isEditingItem(itemId) {
    return editingItemId.value === itemId;
}

function editItem(item) {
    editingItemId.value = item.id;
    editQuantity.value = item.soLuong;
}

function cancelEdit() {
    editingItemId.value = null;
    editQuantity.value = 1;
}

// ===== CALCULATION FUNCTIONS =====
function getTotalQuantity() {
    return filteredChiTiets.value.reduce((sum, item) => sum + (item.soLuong || 0), 0);
}

function getTotalAmount() {
    return filteredChiTiets.value.reduce((sum, item) => {
        const thanhTien = item.thanhTien || (item.giaBan || 0) * (item.soLuong || 0);
        return sum + thanhTien;
    }, 0);
}

// ===== ENHANCED FUNCTIONS =====
async function processNextStepWithRefresh(hoaDon) {
    await processNextStep(hoaDon);
    setTimeout(() => {
        refreshSingleInvoice(hoaDon.id);
    }, 1000);
}

async function refreshSingleInvoice(hoaDonId) {
    try {
        const endpoint = `${API_ENDPOINTS.hoaDon}/${hoaDonId}`;
        const response = await fetchWithErrorHandling(endpoint);

        console.log('Refresh response:', response); // Debug log

        let updatedHoaDon = null;
        if (response && response.id) {
            updatedHoaDon = normalizeHoaDon(response);
        } else if (response && response.data) {
            updatedHoaDon = normalizeHoaDon(response.data);
        }

        if (updatedHoaDon) {
            const index = hoaDons.value.findIndex((hd) => hd.id === hoaDonId);
            if (index !== -1) {
                hoaDons.value[index] = updatedHoaDon;
                console.log('Refreshed invoice:', hoaDons.value[index]);
            }

            if (selectedHoaDon.value && selectedHoaDon.value.id === hoaDonId) {
                selectedHoaDon.value = updatedHoaDon;
                console.log('Refreshed selectedHoaDon:', selectedHoaDon.value);
            }

            // ✅ FIX: Force reactivity update
            hoaDons.value = [...hoaDons.value];
        }
    } catch (error) {
        console.error('Error refreshing invoice:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể làm mới thông tin hóa đơn',
            life: 3000
        });
    }
}

// ===== ADDITIONAL UTILITY FUNCTIONS =====
function printInvoice(hoaDon) {
    toast.add({
        severity: 'info',
        summary: 'In hóa đơn',
        detail: `Đang in hóa đơn ${hoaDon.maHoaDon}`,
        life: 3000
    });
}

function trackingInfo(hoaDon) {
    toast.add({
        severity: 'info',
        summary: 'Thông tin vận chuyển',
        detail: `Đang tải thông tin vận chuyển cho ${hoaDon.maHoaDon}`,
        life: 3000
    });
}

function editPOSItems(hoaDon) {
    toast.add({
        severity: 'info',
        summary: 'Chỉnh sửa',
        detail: `Chỉnh sửa sản phẩm cho ${hoaDon.maHoaDon}`,
        life: 3000
    });
}

// ===== FILTER AND SEARCH FUNCTIONS =====
function applyAdvancedFilters() {
    toast.add({
        severity: 'info',
        summary: 'Bộ lọc',
        detail: 'Đã áp dụng bộ lọc nâng cao',
        life: 3000
    });
}

function clearAllFilters() {
    searchKeyword.value = '';
    typeFilter.value = '';
    statusFilter.value = '';
    dateFilter.value = null;
    minAmount.value = null;
    maxAmount.value = null;
    staffFilter.value = '';
    paymentMethodFilter.value = '';
    toast.add({
        severity: 'info',
        summary: 'Bộ lọc',
        detail: 'Đã xóa tất cả bộ lọc',
        life: 3000
    });
}

// ===== EVENT HANDLERS =====
async function refreshAllData() {
    await fetchAllData();
}

async function retryConnection() {
    hasError.value = false;
    await fetchAllData();
}

let searchTimeout;
function onSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        // DataTable tự động reset về trang đầu khi data thay đổi
    }, 300);
}

function applyFilters() {
    // DataTable tự động reset về trang đầu khi data thay đổi
}

function onSort(event) {
    sortField.value = event.sortField;
    sortOrder.value = event.sortOrder === 1 ? 'asc' : 'desc';
}

function exportData() {
    try {
        const headers = ['ID', 'Mã hóa đơn', 'Loại', 'Ngày tạo', 'Tên khách hàng', 'Số điện thoại', 'Email', 'Tổng tiền', 'Trạng thái', 'Phương thức thanh toán'];

        const csvData = filteredHoaDons.value.map((hd) => [
            hd.id,
            hd.maHoaDon || '',
            hd.loaiHoaDon && hd.loaiHoaDon.toUpperCase() === 'OFFLINE' ? 'POS' : 'Online',
            formatDate(hd.ngayTao),
            getCustomerName(hd),
            hd.sdt || '',
            hd.email || '',
            hd.tongTien || 0,
            getStatusLabel(hd.trangThaiHoaDon),
            hd.phuongThucThanhToan || ''
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
        const filename = `HoaDon_${dateStr}.csv`;

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
            detail: `Đã xuất ${filteredHoaDons.value.length} hóa đơn ra file ${filename}`,
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

// ===== WATCHERS =====
watch([hoaDons], () => {
    tabs.value[0].count = hoaDons.value.length;
    tabs.value[1].count = posInvoices.value.length;
    tabs.value[2].count = onlineInvoices.value.length;
    tabs.value[3].count = pendingInvoices.value;
});

// ===== LIFECYCLE HOOKS =====
onMounted(() => {
    fetchAllData();
});
</script>
<template>
    <div class="invoice-management">
        <!-- Toast Component -->
        <Toast />

        <!-- Header Section -->
        <div class="header-section bg-gradient-primary mb-4 rounded p-4 text-white">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 class="h3 fw-bold mb-2">Quản Lý Hóa Đơn</h2>
                    <p class="text-white-50 mb-0">Hệ thống quản lý hóa đơn POS & Online</p>
                </div>
                <div class="d-flex gap-2">
                    <button @click="refreshAllData" :disabled="isLoading" class="btn btn-outline-light btn-sm">
                        <i :class="isLoading ? 'pi pi-spinner pi-spin' : 'pi pi-refresh'" class="me-1"></i>
                        {{ isLoading ? 'Đang tải...' : 'Làm mới' }}
                    </button>
                    <button @click="exportData" class="btn btn-success btn-sm">
                        <i class="pi pi-download me-1"></i>
                        Xuất dữ liệu
                    </button>
                </div>
            </div>

            <!-- Tab Navigation -->
            <ul class="nav nav-pills">
                <li class="nav-item" v-for="tab in tabs" :key="tab.id">
                    <button @click="activeTab = tab.id" :class="['nav-link', { active: activeTab === tab.id }]" class="text-white">
                        <i :class="tab.icon" class="me-1"></i>
                        {{ tab.label }}
                        <span v-if="tab.count !== undefined" class="badge bg-light text-dark ms-1">
                            {{ tab.count }}
                        </span>
                    </button>
                </li>
            </ul>
        </div>

        <!-- Statistics Cards -->
        <div class="row g-3 mb-4">
            <div class="col-md-6 col-lg-3">
                <div class="card border-start border-3 bg-light border-primary">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1 text-primary">Tổng hóa đơn</h6>
                                <h3 class="mb-2 text-primary">{{ hoaDons.length }}</h3>
                                <div class="d-flex gap-2">
                                    <span class="badge bg-info">POS: {{ posInvoices.length }}</span>
                                    <span class="badge bg-success">Online: {{ onlineInvoices.length }}</span>
                                </div>
                            </div>
                            <i class="pi pi-file-text text-primary" style="font-size: 2rem"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 col-lg-3">
                <div class="card border-start border-success border-3 bg-light">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-success mb-1">Tổng doanh thu</h6>
                                <h3 class="text-success mb-2">{{ formatCurrency(totalRevenue) }}</h3>
                                <div class="d-flex gap-2">
                                    <span class="badge bg-warning">POS: {{ formatCurrency(posRevenue) }}</span>
                                    <span class="badge bg-info">Online: {{ formatCurrency(onlineRevenue) }}</span>
                                </div>
                            </div>
                            <i class="pi pi-money-bill text-success" style="font-size: 2rem"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 col-lg-3">
                <div class="card border-start border-info border-3 bg-light">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-info mb-1">Hoàn thành</h6>
                                <h3 class="text-info mb-2">{{ completedInvoices }}</h3>
                                <span class="badge bg-secondary">Tỷ lệ: {{ completionRate }}%</span>
                            </div>
                            <i class="pi pi-check-circle text-info" style="font-size: 2rem"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 col-lg-3">
                <div class="card border-start border-warning border-3 bg-light">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-warning mb-1">Cần xử lý</h6>
                                <h3 class="text-warning mb-2">{{ pendingInvoices }}</h3>
                                <span class="badge bg-danger">Khẩn cấp: {{ urgentInvoices }}</span>
                            </div>
                            <i class="pi pi-clock text-warning" style="font-size: 2rem"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Search and Filter -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-md-4">
                        <label class="form-label">Tìm kiếm</label>
                        <div class="input-group">
                            <span class="input-group-text">
                                <i class="pi pi-search"></i>
                            </span>
                            <input v-model="searchKeyword" @input="onSearch" class="form-control" placeholder="Tìm kiếm hóa đơn, khách hàng..." />
                        </div>
                    </div>

                    <div class="col-md-2">
                        <label class="form-label">Loại hóa đơn</label>
                        <select v-model="typeFilter" @change="applyFilters" class="form-select">
                            <option value="">Tất cả loại</option>
                            <option value="OFFLINE">POS (Tại quầy)</option>
                            <option value="ONLINE">Online</option>
                        </select>
                    </div>

                    <div class="col-md-2">
                        <label class="form-label">Trạng thái</label>
                        <select v-model="statusFilter" @change="applyFilters" class="form-select">
                            <option value="">Tất cả trạng thái</option>
                            <option value="PENDING">Chờ xác nhận</option>
                            <option value="CONFIRMED">Đã xác nhận</option>
                            <option value="SHIPPING">Đang giao</option>
                            <option value="COMPLETED">Hoàn thành</option>
                            <option value="CANCELLED">Đã hủy</option>
                        </select>
                    </div>

                    <div class="col-md-2">
                        <label class="form-label">Ngày tạo</label>
                        <Calendar v-model="dateFilter" @date-select="applyFilters" placeholder="Chọn ngày" dateFormat="dd/mm/yy" class="w-100" />
                    </div>

                    <div class="col-md-2">
                        <button @click="showAdvancedFilter = !showAdvancedFilter" class="btn btn-outline-secondary w-100">
                            <i class="pi pi-filter me-1"></i>
                            Lọc nâng cao
                        </button>
                    </div>
                </div>

                <!-- Advanced Filters -->
                <div v-if="showAdvancedFilter" class="border-top mt-3 pt-3">
                    <h6 class="mb-3">Bộ lọc nâng cao</h6>
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Khoảng tiền</label>
                            <div class="row g-2">
                                <div class="col">
                                    <InputNumber v-model="minAmount" placeholder="Từ" mode="currency" currency="VND" locale="vi-VN" class="form-control" />
                                </div>
                                <div class="col">
                                    <InputNumber v-model="maxAmount" placeholder="Đến" mode="currency" currency="VND" locale="vi-VN" class="form-control" />
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Nhân viên xử lý</label>
                            <select v-model="staffFilter" class="form-select">
                                <option value="">Tất cả nhân viên</option>
                                <option v-for="staff in staffList" :key="staff.id" :value="staff.id">
                                    {{ staff.name }}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Phương thức thanh toán</label>
                            <select v-model="paymentMethodFilter" class="form-select">
                                <option value="">Tất cả</option>
                                <option value="CASH">Tiền mặt</option>
                                <option value="CARD">Thẻ</option>
                                <option value="BANK_TRANSFER">Chuyển khoản</option>
                                <option value="E_WALLET">Ví điện tử</option>
                                <option value="COD">COD</option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-3">
                        <button @click="applyAdvancedFilters" class="btn btn-primary me-2">Áp dụng</button>
                        <button @click="clearAllFilters" class="btn btn-secondary">Xóa bộ lọc</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="py-5 text-center">
            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="8" />
            <p class="h5 text-muted mt-3">Đang tải dữ liệu từ API...</p>
            <p class="text-muted">{{ loadingMessage }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="hasError" class="py-5 text-center">
            <i class="pi pi-exclamation-triangle text-danger display-1 mb-3"></i>
            <h4 class="text-danger mb-2">Lỗi kết nối API</h4>
            <p class="text-muted mb-3">{{ errorMessage }}</p>
            <div class="d-flex justify-content-center gap-2">
                <button @click="retryConnection" class="btn btn-danger">
                    <i class="pi pi-refresh me-1"></i>
                    Thử lại
                </button>
                <button @click="goToLogin" class="btn btn-outline-primary" v-if="errorMessage.includes('xác thực')">
                    <i class="pi pi-sign-in me-1"></i>
                    Đăng nhập lại
                </button>
            </div>
        </div>

        <!-- Data Table -->
        <div v-else class="card">
            <div class="card-header">
                <h5 class="card-title mb-0">Danh sách hóa đơn</h5>
            </div>
            <div class="card-body p-0">
                <DataTable
                    ref="dt"
                    :value="filteredHoaDons"
                    dataKey="id"
                    :paginator="true"
                    :rows="itemsPerPage"
                    :totalRecords="filteredHoaDons.length"
                    :loading="isLoading"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25, 50]"
                    currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} hóa đơn"
                    tableStyle="min-width: 60rem"
                    sortMode="single"
                    @sort="onSort"
                    class="table-responsive"
                >
                    <Column field="id" header="ID" sortable style="min-width: 8rem">
                        <template #body="slotProps">
                            <span class="fw-bold text-primary">#{{ slotProps.data.id }}</span>
                        </template>
                    </Column>

                    <Column field="maHoaDon" header="Mã HĐ" sortable style="min-width: 10rem">
                        <template #body="slotProps">
                            <span class="badge bg-secondary">{{ slotProps.data.maHoaDon }}</span>
                        </template>
                    </Column>

                    <Column field="loaiHoaDon" header="Loại" style="min-width: 8rem">
                        <template #body="slotProps">
                            <span :class="['badge', slotProps.data.loaiHoaDon === 'OFFLINE' ? 'bg-warning' : 'bg-success']">
                                <i :class="slotProps.data.loaiHoaDon === 'OFFLINE' ? 'pi pi-desktop' : 'pi pi-globe'" class="me-1"></i>
                                {{ slotProps.data.loaiHoaDon === 'OFFLINE' ? 'POS' : 'Online' }}
                            </span>
                        </template>
                    </Column>

                    <Column field="ngayTao" header="Ngày tạo" sortable style="min-width: 12rem">
                        <template #body="slotProps">
                            <div class="d-flex align-items-center">
                                <i class="pi pi-calendar text-muted me-2"></i>
                                <small>{{ formatDate(slotProps.data.ngayTao) }}</small>
                            </div>
                        </template>
                    </Column>

                    <Column field="tenKhachHang" header="Khách hàng" style="min-width: 16rem">
                        <template #body="slotProps">
                            <div class="d-flex align-items-center">
                                <div class="avatar rounded-circle d-flex align-items-center justify-content-center me-2 bg-primary text-white" style="width: 32px; height: 32px; font-size: 12px">
                                    {{ getInitials(getCustomerName(slotProps.data)) }}
                                </div>
                                <div>
                                    <div class="fw-semibold">{{ getCustomerName(slotProps.data) }}</div>
                                    <small v-if="slotProps.data.sdt" class="text-muted"> <i class="pi pi-phone me-1"></i>{{ slotProps.data.sdt }} </small>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column field="tongTien" header="Tổng tiền" sortable style="min-width: 12rem">
                        <template #body="slotProps">
                            <div class="d-flex align-items-center">
                                <i class="pi pi-money-bill text-success me-2"></i>
                                <span class="fw-bold text-success">{{ formatCurrency(slotProps.data.tongTien) }}</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="trangThaiHoaDon" header="Trạng thái" style="min-width: 12rem">
                        <template #body="slotProps">
                            <span :class="['badge', 'bg-' + getStatusColor(slotProps.data.trangThaiHoaDon)]">
                                <i :class="getStatusIcon(slotProps.data.trangThaiHoaDon)" class="me-1"></i>
                                {{ getStatusLabel(slotProps.data.trangThaiHoaDon) }}
                            </span>
                        </template>
                    </Column>

                    <Column header="Thao tác" style="min-width: 12rem">
                        <template #body="slotProps">
                            <div class="d-flex gap-1">
                                <button @click="viewChiTiet(slotProps.data)" class="btn btn-outline-primary btn-sm" title="Xem chi tiết">
                                    <i class="pi pi-eye"></i>
                                </button>
                                <button v-if="canUpdateStatus(slotProps.data)" @click="updateInvoiceStatus(slotProps.data)" class="btn btn-outline-success btn-sm" title="Cập nhật trạng thái">
                                    <i class="pi pi-arrow-right"></i>
                                </button>
                            </div>
                        </template>
                    </Column>
                </DataTable>

                <!-- Empty State -->
                <div v-if="filteredHoaDons.length === 0 && !isLoading" class="py-5 text-center">
                    <i class="pi pi-file-o text-muted display-1 mb-3"></i>
                    <h5 class="text-muted mb-2">Không tìm thấy hóa đơn</h5>
                    <p class="text-muted">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                </div>
            </div>
        </div>

        <!-- Modal chi tiết hóa đơn -->
        <div class="modal fade" id="detailModal" tabindex="-1" ref="detailModal">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="pi pi-file-text me-2"></i>
                            Chi tiết hóa đơn {{ selectedHoaDon?.maHoaDon }}
                        </h5>
                        <button type="button" class="btn-close" @click="closeChiTietDialog"></button>
                    </div>
                    <div class="modal-body" v-if="selectedHoaDon">
                        <!-- Workflow Progress -->
                        <div class="card mb-3">
                            <div class="card-header">
                                <h6 class="card-title mb-0">Tiến trình xử lý</h6>
                            </div>
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div v-for="(step, index) in getWorkflowSteps(selectedHoaDon.loaiHoaDon)" :key="step" class="d-flex flex-fill align-items-center">
                                        <div class="d-flex flex-column align-items-center flex-fill">
                                            <div :class="['workflow-step-detail', 'rounded-circle', 'd-flex', 'align-items-center', 'justify-content-center', 'border', 'border-2', getDetailStepBootstrapClass(selectedHoaDon, step)]">
                                                <i :class="getStepIcon(step)" style="font-size: 14px"></i>
                                            </div>
                                            <small class="fw-medium mt-2 text-center">{{ getStepLabel(step) }}</small>
                                            <small v-if="isStepActive(selectedHoaDon, step)" class="text-primary">Đang thực hiện</small>
                                            <small v-else-if="isStepCompleted(selectedHoaDon, step)" class="text-success">Hoàn thành</small>
                                        </div>
                                        <div
                                            v-if="index < getWorkflowSteps(selectedHoaDon.loaiHoaDon).length - 1"
                                            :class="['workflow-connector', isStepCompleted(selectedHoaDon, step) || isStepActive(selectedHoaDon, step) ? 'completed' : 'pending']"
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="d-flex justify-content-end bg-light mb-3 gap-2 rounded p-3">
                            <!-- ✅ DEBUG: Show status info -->
                            <small class="text-muted me-auto"> Trạng thái: {{ selectedHoaDon?.trangThaiHoaDon }} ({{ normalizeStatus(selectedHoaDon?.trangThaiHoaDon) }}) </small>

                            <button v-if="canProcessNextStep(selectedHoaDon)" @click="processNextStepWithRefresh(selectedHoaDon)" class="btn btn-success btn-sm">
                                <i class="pi pi-arrow-right me-1"></i>
                                {{ getNextStepAction(selectedHoaDon) }}
                            </button>

                            <button v-if="canUpdateStatus(selectedHoaDon)" @click="updateInvoiceStatus(selectedHoaDon)" class="btn btn-warning btn-sm">
                                <i class="pi pi-edit me-1"></i>
                                Cập nhật trạng thái
                            </button>

                            <button v-if="canCancelInvoice(selectedHoaDon)" @click="cancelInvoice(selectedHoaDon)" class="btn btn-danger btn-sm">
                                <i class="pi pi-times me-1"></i>
                                Hủy đơn
                            </button>

                            <button v-if="selectedHoaDon?.loaiHoaDon === 'OFFLINE'" @click="printInvoice(selectedHoaDon)" class="btn btn-info btn-sm">
                                <i class="pi pi-print me-1"></i>
                                In hóa đơn
                            </button>

                            <button v-if="selectedHoaDon?.loaiHoaDon === 'ONLINE'" @click="trackingInfo(selectedHoaDon)" class="btn btn-warning btn-sm">
                                <i class="pi pi-map-marker me-1"></i>
                                Tracking
                            </button>
                        </div>

                        <!-- Thông tin chi tiết -->
                        <div class="row g-3 mb-4">
                            <!-- Thông tin hóa đơn -->
                            <div class="col-lg-4">
                                <div class="card h-100">
                                    <div class="card-header">
                                        <h6 class="card-title mb-0">Thông tin hóa đơn</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-2">
                                            <div class="col-6"><strong>Mã HĐ:</strong></div>
                                            <div class="col-6">
                                                <span class="badge bg-secondary">{{ selectedHoaDon.maHoaDon }}</span>
                                            </div>
                                            <div class="col-6"><strong>Loại:</strong></div>
                                            <div class="col-6">
                                                <span :class="['badge', selectedHoaDon.loaiHoaDon === 'OFFLINE' ? 'bg-warning' : 'bg-success']">
                                                    {{ selectedHoaDon.loaiHoaDon === 'OFFLINE' ? 'POS' : 'Online' }}
                                                </span>
                                            </div>
                                            <div class="col-6"><strong>Ngày tạo:</strong></div>
                                            <div class="col-6">{{ formatDate(selectedHoaDon.ngayTao) }}</div>
                                            <div class="col-6"><strong>Tổng tiền:</strong></div>
                                            <div class="col-6">
                                                <span class="fw-bold text-success">{{ formatCurrency(selectedHoaDon.tongTien) }}</span>
                                            </div>
                                            <div class="col-6"><strong>Trạng thái:</strong></div>
                                            <div class="col-6">
                                                <span :class="['badge', 'bg-' + getStatusColor(selectedHoaDon.trangThaiHoaDon)]">
                                                    {{ getStatusLabel(selectedHoaDon.trangThaiHoaDon) }}
                                                </span>
                                            </div>
                                            <div v-if="selectedHoaDon.tenNhanVien" class="col-6"><strong>Nhân viên:</strong></div>
                                            <div v-if="selectedHoaDon.tenNhanVien" class="col-6">{{ selectedHoaDon.tenNhanVien }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Thông tin khách hàng -->
                            <div class="col-lg-4">
                                <div class="card h-100">
                                    <div class="card-header">
                                        <h6 class="card-title mb-0">Thông tin khách hàng</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-2">
                                            <div class="col-4"><strong>Tên:</strong></div>
                                            <div class="col-8">{{ getCustomerName(selectedHoaDon) }}</div>
                                            <div v-if="selectedHoaDon.sdt" class="col-4"><strong>SĐT:</strong></div>
                                            <div v-if="selectedHoaDon.sdt" class="col-8">{{ selectedHoaDon.sdt }}</div>
                                            <div v-if="selectedHoaDon.email" class="col-4"><strong>Email:</strong></div>
                                            <div v-if="selectedHoaDon.email" class="col-8">{{ selectedHoaDon.email }}</div>
                                            <div v-if="selectedHoaDon.diaChi" class="col-4"><strong>Địa chỉ:</strong></div>
                                            <div v-if="selectedHoaDon.diaChi" class="col-8">{{ selectedHoaDon.diaChi }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Thông tin thanh toán -->
                            <div class="col-lg-4">
                                <div class="card h-100">
                                    <div class="card-header">
                                        <h6 class="card-title mb-0">Thanh toán</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-2">
                                            <div class="col-6"><strong>Phương thức:</strong></div>
                                            <div class="col-6">{{ selectedHoaDon.phuongThucThanhToan || 'Chưa xác định' }}</div>
                                            <div v-if="selectedHoaDon.ngayXacNhan" class="col-6"><strong>Ngày xác nhận:</strong></div>
                                            <div v-if="selectedHoaDon.ngayXacNhan" class="col-6">{{ formatDate(selectedHoaDon.ngayXacNhan) }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Chi tiết sản phẩm -->
                        <div class="card">
                            <div class="card-header">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h6 class="card-title mb-0">
                                        <i class="pi pi-list me-2"></i>
                                        Chi tiết sản phẩm ({{ hoaDonChiTiets.length }} mặt hàng)
                                    </h6>
                                    <div class="d-flex gap-2">
                                        <div class="input-group input-group-sm" style="width: 200px">
                                            <span class="input-group-text">
                                                <i class="pi pi-search"></i>
                                            </span>
                                            <input v-model="searchChiTietKeyword" class="form-control" placeholder="Tìm kiếm sản phẩm..." />
                                        </div>
                                        <button v-if="canEditItems(selectedHoaDon)" @click="editPOSItems(selectedHoaDon)" class="btn btn-outline-primary btn-sm">
                                            <i class="pi pi-pencil me-1"></i>
                                            Sửa
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="card-body">
                                <!-- Loading Chi Tiết -->
                                <div v-if="isLoadingChiTiet" class="py-4 text-center">
                                    <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="8" />
                                    <p class="text-muted mt-2">Đang tải chi tiết hóa đơn...</p>
                                </div>

                                <!-- Chi Tiết Table -->
                                <div v-else class="table-responsive">
                                    <table class="table-hover table">
                                        <thead class="table-light">
                                            <tr>
                                                <th>STT</th>
                                                <th>Tên sản phẩm</th>
                                                <th>Thuộc tính</th>
                                                <th>Giá bán</th>
                                                <th>Số lượng</th>
                                                <th>Thành tiền</th>
                                                <th v-if="canEditItems(selectedHoaDon)">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="(item, index) in filteredChiTiets" :key="item.id">
                                                <td>
                                                    <span class="badge bg-secondary">{{ index + 1 }}</span>
                                                </td>
                                                <td>
                                                    <div>
                                                        <div class="fw-medium">{{ item.tenSanPham || 'N/A' }}</div>
                                                        <small v-if="item.maSanPham" class="text-muted">Mã: {{ item.maSanPham }}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="d-flex gap-1">
                                                        <span v-if="item.mauSac && item.mauSac !== 'N/A'" class="badge bg-info">{{ item.mauSac }}</span>
                                                        <span v-if="item.kichThuoc && item.kichThuoc !== 'N/A'" class="badge bg-success">{{ item.kichThuoc }}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span class="fw-bold text-success">{{ formatCurrency(item.giaBan) }}</span>
                                                    <div v-if="item.giaGoc && item.giaGoc !== item.giaBan">
                                                        <small class="text-muted text-decoration-line-through">{{ formatCurrency(item.giaGoc) }}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div v-if="isEditingItem(item.id)" class="d-flex align-items-center gap-1">
                                                        <InputNumber v-model="editQuantity" :min="1" class="form-control form-control-sm" style="width: 80px" />
                                                        <button @click="saveQuantity(item.id)" class="btn btn-success btn-sm">
                                                            <i class="pi pi-check"></i>
                                                        </button>
                                                        <button @click="cancelEdit()" class="btn btn-secondary btn-sm">
                                                            <i class="pi pi-times"></i>
                                                        </button>
                                                    </div>
                                                    <span v-else class="badge bg-primary">{{ item.soLuong }}</span>
                                                </td>
                                                <td>
                                                    <span class="fw-bold text-primary">
                                                        {{ formatCurrency(item.thanhTien || item.giaBan * item.soLuong) }}
                                                    </span>
                                                    <div v-if="item.tienTietKiem && item.tienTietKiem > 0">
                                                        <small class="text-success">Tiết kiệm: {{ formatCurrency(item.tienTietKiem) }}</small>
                                                    </div>
                                                </td>
                                                <td v-if="canEditItems(selectedHoaDon)">
                                                    <div class="d-flex gap-1">
                                                        <button v-if="!isEditingItem(item.id)" @click="editItem(item)" class="btn btn-outline-primary btn-sm" title="Sửa số lượng">
                                                            <i class="pi pi-pencil"></i>
                                                        </button>
                                                        <button @click="removeItem(item.id)" class="btn btn-outline-danger btn-sm" title="Xóa sản phẩm">
                                                            <i class="pi pi-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    <!-- Empty State for Chi Tiet -->
                                    <div v-if="filteredChiTiets.length === 0" class="py-4 text-center">
                                        <i class="pi pi-info-circle text-muted display-4 mb-3"></i>
                                        <h6 class="text-muted mb-2">Không có chi tiết nào</h6>
                                        <p class="text-muted">Hóa đơn này chưa có chi tiết sản phẩm.</p>
                                    </div>
                                </div>

                                <!-- Tổng kết -->
                                <div class="row g-3 border-top mt-3 pt-3">
                                    <div class="col-md-3 text-center">
                                        <div class="h4 mb-1 text-primary">{{ hoaDonChiTiets.length }}</div>
                                        <div class="text-muted">Số mặt hàng</div>
                                    </div>
                                    <div class="col-md-3 text-center">
                                        <div class="h4 text-info mb-1">{{ getTotalQuantity() }}</div>
                                        <div class="text-muted">Tổng số lượng</div>
                                    </div>
                                    <div class="col-md-3 text-center">
                                        <div class="h4 text-success mb-1">{{ formatCurrency(getTotalAmount()) }}</div>
                                        <div class="text-muted">Tổng tiền hàng</div>
                                    </div>
                                    <div class="col-md-3 text-center">
                                        <div class="h4 text-warning mb-1">{{ formatCurrency(selectedHoaDon.tongTien) }}</div>
                                        <div class="text-muted">Thành tiền</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="closeChiTietDialog" class="btn btn-secondary">
                            <i class="pi pi-times me-1"></i>
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal cập nhật trạng thái -->
        <div class="modal fade" id="statusModal" tabindex="-1" ref="statusModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Cập nhật trạng thái</h5>
                        <button type="button" class="btn-close" @click="closeStatusUpdateDialog"></button>
                    </div>
                    <div class="modal-body">
                        <!-- ✅ DEBUG: Show current status info -->
                        <div class="mb-3" v-if="selectedInvoiceForUpdate">
                            <label class="form-label">Hóa đơn:</label>
                            <div>
                                <strong>{{ selectedInvoiceForUpdate.maHoaDon }}</strong> -
                                {{ getCustomerName(selectedInvoiceForUpdate) }}
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Trạng thái hiện tại:</label>
                            <div>
                                <span :class="['badge', 'bg-' + getStatusColor(selectedInvoiceForUpdate?.trangThaiHoaDon)]">
                                    {{ getStatusLabel(selectedInvoiceForUpdate?.trangThaiHoaDon) }}
                                </span>
                                <!-- ✅ DEBUG: Show raw status -->
                                <small class="text-muted ms-2">({{ selectedInvoiceForUpdate?.trangThaiHoaDon }})</small>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Trạng thái mới:</label>
                            <select v-model="newStatus" class="form-select">
                                <option value="">Chọn trạng thái mới</option>
                                <option v-for="status in getAvailableStatuses(selectedInvoiceForUpdate)" :key="status.value" :value="status.value">
                                    {{ status.label }}
                                </option>
                            </select>
                            <!-- ✅ DEBUG: Show selected status -->
                            <small class="text-muted" v-if="newStatus">Đã chọn: {{ newStatus }}</small>
                        </div>

                        <div v-if="needsNote(newStatus)" class="mb-3">
                            <label class="form-label">Ghi chú:</label>
                            <textarea v-model="statusNote" class="form-control" rows="3" placeholder="Nhập ghi chú..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="confirmStatusUpdate" class="btn btn-primary" :disabled="!newStatus">
                            <i class="pi pi-check me-1"></i>
                            Cập nhật
                        </button>
                        <button @click="closeStatusUpdateDialog" class="btn btn-secondary">
                            <i class="pi pi-times me-1"></i>
                            Hủy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.invoice-management {
    padding: 1rem;
    min-height: 100vh;
    background-color: #f8f9fa;
}

.bg-gradient-primary {
    background: linear-gradient(135deg, #007bff, #6610f2);
}

.avatar {
    font-size: 0.75rem;
    font-weight: 600;
}

.workflow-step {
    font-size: 0.75rem;
    min-width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    position: relative;
}

.workflow-step.bg-success {
    animation: pulse-success 2s infinite;
}

.workflow-step.bg-primary {
    animation: pulse-primary 2s infinite;
}

@keyframes pulse-success {
    0% {
        box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7);
    }
    70% {
        box-shadow: 0 0 0 10px rgba(40, 167, 69, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
    }
}

@keyframes pulse-primary {
    0% {
        box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7);
    }
    70% {
        box-shadow: 0 0 0 10px rgba(0, 123, 255, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
    }
}

.workflow-arrow {
    width: 0;
    height: 0;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    border-left: 8px solid #dee2e6;
    transition: border-color 0.3s ease;
}

.workflow-step-detail {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: all 0.3s ease;
    position: relative;
}

.workflow-step-detail.bg-success {
    animation: bounce-success 0.6s ease-in-out;
}

.workflow-step-detail.bg-primary {
    animation: pulse-primary 2s infinite;
}

@keyframes bounce-success {
    0%,
    20%,
    53%,
    80%,
    100% {
        transform: translate3d(0, 0, 0);
    }
    40%,
    43% {
        transform: translate3d(0, -15px, 0);
    }
    70% {
        transform: translate3d(0, -7px, 0);
    }
    90% {
        transform: translate3d(0, -2px, 0);
    }
}

.workflow-connector {
    flex: 1;
    height: 2px;
    margin: 0 10px;
    transition: background-color 0.3s ease;
}

.workflow-connector.completed {
    background: linear-gradient(to right, #28a745, #20c997);
}

.workflow-connector.pending {
    background: #e9ecef;
}

.nav-pills .nav-link {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    margin-right: 0.5rem;
    transition: all 0.3s ease;
}

.nav-pills .nav-link:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
}

.nav-pills .nav-link.active {
    background: rgba(255, 255, 255, 0.9);
    color: #007bff !important;
    font-weight: 600;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.card {
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    transition: all 0.15s ease-in-out;
}

.card:hover {
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
}

.table th {
    border-top: none;
    font-weight: 600;
    color: #495057;
    background-color: #f8f9fa;
}

.table td {
    vertical-align: middle;
}

.btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    transition: all 0.2s ease;
}

.btn-sm:hover {
    transform: translateY(-1px);
}

.badge {
    transition: all 0.3s ease;
}

.badge:hover {
    transform: scale(1.05);
}

.card.border-start {
    transition: all 0.3s ease;
}

.card.border-start:hover {
    transform: translateX(5px);
}

.modal-xl {
    max-width: 95%;
}

.modal-body {
    max-height: 80vh;
    overflow-y: auto;
}

.table-responsive {
    border-radius: 0.375rem;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.card {
    animation: fadeIn 0.5s ease-in-out;
}

.btn {
    transition: all 0.2s ease;
}

.btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.form-control:focus,
.form-select:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.modal-body::-webkit-scrollbar {
    width: 8px;
}

.modal-body::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
    background: #555;
}

@media (max-width: 768px) {
    .invoice-management {
        padding: 0.5rem;
    }

    .workflow-step-detail {
        width: 30px;
        height: 30px;
        font-size: 12px;
    }

    .modal-xl {
        max-width: 100%;
        margin: 0.5rem;
    }

    .card.border-start:hover {
        transform: none;
    }

    .btn:hover {
        transform: none;
    }
}

@media print {
    .invoice-management {
        background-color: white !important;
    }

    .btn,
    .nav,
    .modal {
        display: none !important;
    }
}
</style>
