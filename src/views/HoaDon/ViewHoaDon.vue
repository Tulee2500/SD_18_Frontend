<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

// ===== AUTHENTICATION & API SETUP =====
const API_BASE_URL = 'http://localhost:8080';
const API_ENDPOINTS = {
    hoaDon: `${API_BASE_URL}/hoa-don`,
    hoaDonPOS: `${API_BASE_URL}/hoa-don/pos`,
    hoaDonOnline: `${API_BASE_URL}/hoa-don/online`,
    hoaDonChiTiet: `${API_BASE_URL}/api/hoa-don-chi-tiet`,
    chiTietTraHang: `${API_BASE_URL}/api/chi-tiet-tra-hang`
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
const paymentMethodFilter = ref('');
const returnStatusFilter = ref('');

// Tab management
const activeTabIndex = ref(0);
const itemsPerPage = ref(10);

// Modal refs
const showChiTietDialog = ref(false);
const showStatusUpdateDialog = ref(false);
const showReturnManageDialog = ref(false);
const showCreateReturnDialog = ref(false);

// Chi tiết hóa đơn
const selectedHoaDon = ref(null);
const hoaDonChiTiets = ref([]);
const isLoadingChiTiet = ref(false);
const searchChiTietKeyword = ref('');
const editingItemId = ref(null);
const editQuantity = ref(1);

// Status update
const selectedInvoiceForUpdate = ref(null);
const newStatus = ref('');
const statusNote = ref('');

// Return management
const selectedReturnInvoice = ref(null);
const returnableProducts = ref([]);
const currentReturnRequests = ref([]);
// Đã xóa biến liên quan đến tạo đơn trả hàng

// Statistics
const totalReturnRequests = ref(0);
const pendingReturns = ref(0);
const approvedReturns = ref(0);

// ===== API FUNCTIONS =====
async function fetchAllData() {
    isLoading.value = true;
    hasError.value = false;
    loadingMessage.value = 'Đang tải danh sách hóa đơn...';

    try {
        const response = await fetchWithErrorHandling(API_ENDPOINTS.hoaDon);
        let data = [];

        if (Array.isArray(response)) {
            data = response;
        } else if (response.success && response.data) {
            data = Array.isArray(response.data) ? response.data : [];
        }

        // Load return data for each invoice
        for (let invoice of data) {
            await loadReturnDataForInvoice(invoice);
        }

        hoaDons.value = data.map(normalizeHoaDon);
        updateReturnStatistics();

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã tải ${hoaDons.value.length} hóa đơn`,
            life: 3000
        });
    } catch (error) {
        console.error('Error in fetchAllData:', error);
        hasError.value = true;

        if (error.message.includes('Authentication failed')) {
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

async function loadReturnDataForInvoice(invoice) {
    try {
        const endpoint = `${API_ENDPOINTS.chiTietTraHang}/by-hoa-don/${invoice.id}`;
        const response = await fetchWithErrorHandling(endpoint);

        if (response.success && response.data) {
            invoice.chiTietTraHangList = response.data;

            // Calculate return statistics
            const statistics = response.data.reduce(
                (acc, item) => {
                    acc.tongSoLuongTraHang += item.soLuong || 0;
                    acc.tongTienTraHang += item.tienHoan || 0;

                    if (item.trangThaiHoaDon === 'PENDING') {
                        acc.soLuongTraHangChoXuLy += 1;
                    } else if (item.trangThaiHoaDon === 'APPROVED') {
                        acc.soLuongTraHangDaXuLy += 1;
                    }

                    return acc;
                },
                {
                    tongSoLuongTraHang: 0,
                    tongTienTraHang: 0,
                    soLuongTraHangChoXuLy: 0,
                    soLuongTraHangDaXuLy: 0
                }
            );

            Object.assign(invoice, statistics);
        } else {
            invoice.chiTietTraHangList = [];
        }
    } catch (error) {
        console.error(`Error loading return data for invoice ${invoice.id}:`, error);
        invoice.chiTietTraHangList = [];
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

        // Xử lý đường dẫn ảnh cho từng sản phẩm
        hoaDonChiTiets.value = data.map((item) => ({
            ...item,
            hinhAnh: createImageUrl(item.hinhAnh || item.duongDan || item.imageUrl)
        }));

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã tải ${hoaDonChiTiets.value.length} chi tiết sản phẩm`,
            life: 3000
        });
    } catch (error) {
        console.error('Error fetching chi tiet:', error);
        hoaDonChiTiets.value = createSampleChiTietData(hoaDonId).map((item) => ({
            ...item,
            hinhAnh: createImageUrl(item.hinhAnh || item.duongDan || item.imageUrl)
        }));

        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Không thể tải chi tiết từ API, hiển thị dữ liệu mẫu',
            life: 3000
        });
    } finally {
        isLoadingChiTiet.value = false;
    }
    // Hàm xử lý đường dẫn ảnh sản phẩm
    function createImageUrl(duongDan) {
        if (!duongDan) return null;
        if (duongDan.startsWith('http://') || duongDan.startsWith('https://')) return duongDan;
        return API_BASE_URL + '/' + duongDan.replace(/^\//, '');
    }
}

// ===== RETURN MANAGEMENT FUNCTIONS =====
async function loadReturnableProducts(hoaDonId) {
    try {
        // Get invoice details first
        const chiTietResponse = await fetchWithErrorHandling(`${API_ENDPOINTS.hoaDonChiTiet}/by-hoa-don/${hoaDonId}`);
        let products = [];

        if (chiTietResponse.success && chiTietResponse.data) {
            products = chiTietResponse.data;
        }

        // Get return data for each product
        for (let product of products) {
            const returnResponse = await fetchWithErrorHandling(`${API_ENDPOINTS.chiTietTraHang}/by-chi-tiet-san-pham/${product.chiTietSanPhamId}`);

            if (returnResponse.success && returnResponse.data) {
                const approvedReturns = returnResponse.data.filter((r) => r.trangThaiHoaDon === 'APPROVED');
                product.soLuongDaTra = approvedReturns.reduce((sum, r) => sum + r.soLuong, 0);
            } else {
                product.soLuongDaTra = 0;
            }
        }

        returnableProducts.value = products;
    } catch (error) {
        console.error('Error loading returnable products:', error);
        returnableProducts.value = [];
    }
}

async function loadCurrentReturnRequests(hoaDonId) {
    try {
        const endpoint = `${API_ENDPOINTS.chiTietTraHang}/by-hoa-don/${hoaDonId}`;
        const response = await fetchWithErrorHandling(endpoint);

        if (response.success && response.data) {
            currentReturnRequests.value = response.data;
        } else {
            currentReturnRequests.value = [];
        }
    } catch (error) {
        console.error('Error loading return requests:', error);
        currentReturnRequests.value = [];
    }
}

// Đã xóa các hàm tạo đơn trả hàng

async function approveReturn(returnItem) {
    try {
        const response = await fetchWithErrorHandling(`${API_ENDPOINTS.chiTietTraHang}/${returnItem.id}/approve`, {
            method: 'PUT',
            body: JSON.stringify({ ghiChu: 'Đã chấp nhận trả hàng' })
        });

        if (response.success) {
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: response.message || 'Đã chấp nhận yêu cầu trả hàng',
                life: 3000
            });

            // Refresh data
            if (selectedReturnInvoice.value) {
                await loadCurrentReturnRequests(selectedReturnInvoice.value.id);
                await loadReturnableProducts(selectedReturnInvoice.value.id);
            }

            // Update main invoice data
            await refreshAllData();
        }
    } catch (error) {
        console.error('Error approving return:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể chấp nhận yêu cầu trả hàng',
            life: 3000
        });
    }
}

async function rejectReturn(returnItem) {
    const reason = prompt('Nhập lý do từ chối:');
    if (!reason || reason.trim() === '') {
        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Vui lòng nhập lý do từ chối',
            life: 3000
        });
        return;
    }

    try {
        const response = await fetchWithErrorHandling(`${API_ENDPOINTS.chiTietTraHang}/${returnItem.id}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ lyDo: reason })
        });

        if (response.success) {
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Đã từ chối yêu cầu trả hàng',
                life: 3000
            });

            // Refresh data
            if (selectedReturnInvoice.value) {
                await loadCurrentReturnRequests(selectedReturnInvoice.value.id);
            }

            await refreshAllData();
        }
    } catch (error) {
        console.error('Error rejecting return:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể từ chối yêu cầu trả hàng',
            life: 3000
        });
    }
}

// ===== STATUS MANAGEMENT FUNCTIONS =====
async function processNextStepWithRefresh(hoaDon) {
    try {
        const currentStep = normalizeStatus(hoaDon.trangThaiHoaDon);
        const steps = getWorkflowSteps(hoaDon.loaiHoaDon);
        const currentIndex = steps.indexOf(currentStep);

        if (currentIndex >= 0 && currentIndex < steps.length - 1) {
            const nextStep = steps[currentIndex + 1];
            const endpoint = `${API_ENDPOINTS.hoaDon}/${hoaDon.id}/trang-thai`;

            const requestData = {
                trangThai: nextStep,
                ghiChu: `Cập nhật trạng thái từ ${getStatusLabel(currentStep)} sang ${getStatusLabel(nextStep)}`
            };

            const response = await fetchWithErrorHandling(endpoint, {
                method: 'PUT',
                body: JSON.stringify(requestData)
            });

            let updatedHoaDon = null;
            if (response && response.data) {
                updatedHoaDon = normalizeHoaDon(response.data);
            } else if (response && response.id) {
                updatedHoaDon = normalizeHoaDon(response);
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
                    detail: `Đã cập nhật trạng thái sang ${getStatusLabel(nextStep)}`,
                    life: 3000
                });
            }
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
        const response = await fetchWithErrorHandling(endpoint, {
            method: 'PUT',
            body: JSON.stringify({ lyDo: reason })
        });

        let updatedHoaDon = null;
        if (response && response.data) {
            updatedHoaDon = normalizeHoaDon(response.data);
        } else if (response && response.id) {
            updatedHoaDon = normalizeHoaDon(response);
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

        const response = await fetchWithErrorHandling(endpoint, {
            method: 'PUT',
            body: JSON.stringify(requestData)
        });

        let updatedHoaDon = null;
        if (response && response.data) {
            updatedHoaDon = normalizeHoaDon(response.data);
        } else if (response && response.id) {
            updatedHoaDon = normalizeHoaDon(response);
        }

        if (updatedHoaDon) {
            const index = hoaDons.value.findIndex((hd) => hd.id === selectedInvoiceForUpdate.value.id);
            if (index !== -1) {
                hoaDons.value[index] = updatedHoaDon;
            }

            if (selectedHoaDon.value && selectedHoaDon.value.id === selectedInvoiceForUpdate.value.id) {
                selectedHoaDon.value = updatedHoaDon;
            }

            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Cập nhật trạng thái thành công sang ${getStatusLabel(newStatus.value)}`,
                life: 3000
            });

            closeStatusUpdateDialog();
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

// ===== ITEM EDITING FUNCTIONS =====
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

// ===== MODAL FUNCTIONS =====
async function viewChiTiet(hoaDon) {
    selectedHoaDon.value = { ...hoaDon };
    searchChiTietKeyword.value = '';
    showChiTietDialog.value = true;
    await fetchChiTietHoaDon(hoaDon.id);
}

function closeChiTietDialog() {
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
}

function closeStatusUpdateDialog() {
    showStatusUpdateDialog.value = false;
    selectedInvoiceForUpdate.value = null;
    newStatus.value = '';
    statusNote.value = '';
}

async function showReturnDialog(hoaDon) {
    selectedReturnInvoice.value = { ...hoaDon };
    showReturnManageDialog.value = true;

    // Load return data
    await loadReturnableProducts(hoaDon.id);
    await loadCurrentReturnRequests(hoaDon.id);
}

// Đã xóa các hàm tạo đơn trả hàng

function editReturnRequest(returnItem) {
    // Implementation for editing return request
    toast.add({
        severity: 'info',
        summary: 'Thông báo',
        detail: 'Chức năng chỉnh sửa yêu cầu trả hàng đang phát triển',
        life: 3000
    });
}

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
    if (!amount && amount !== 0) return '0 ₫';
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

function getStatusSeverity(status) {
    if (!status) return 'secondary';
    const statusLower = status.toString().toLowerCase();

    if (statusLower.includes('pending') || statusLower.includes('chờ')) {
        return 'warning';
    } else if (statusLower.includes('confirmed') || statusLower.includes('xác nhận')) {
        return 'info';
    } else if (statusLower.includes('shipping') || statusLower.includes('giao')) {
        return null;
    } else if (statusLower.includes('completed') || statusLower.includes('hoàn thành')) {
        return 'success';
    } else if (statusLower.includes('cancelled') || statusLower.includes('hủy')) {
        return 'danger';
    } else if (statusLower.includes('delivered')) {
        return 'info';
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

function getReturnStatusLabel(status) {
    const statusMap = {
        PENDING: 'Chờ xử lý',
        APPROVED: 'Đã chấp nhận',
        REJECTED: 'Đã từ chối'
    };
    return statusMap[status] || status;
}

function getReturnStatusSeverity(status) {
    const severityMap = {
        PENDING: 'warning',
        APPROVED: 'success',
        REJECTED: 'danger'
    };
    return severityMap[status] || 'secondary';
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

function getWorkflowStepClass(hoaDon, step) {
    const normalizedCurrentStep = normalizeStatus(hoaDon.trangThaiHoaDon);
    const steps = getWorkflowSteps(hoaDon.loaiHoaDon);
    const currentIndex = steps.indexOf(normalizedCurrentStep);
    const stepIndex = steps.indexOf(step);

    const baseClass = 'workflow-step d-flex align-items-center justify-content-center';

    if (stepIndex < currentIndex) {
        return `${baseClass} bg-success text-white`;
    } else if (stepIndex === currentIndex) {
        return `${baseClass} bg-primary text-white`;
    } else {
        return `${baseClass} bg-light text-muted border`;
    }
}

function getWorkflowConnectorClass(hoaDon, step) {
    const normalizedCurrentStep = normalizeStatus(hoaDon.trangThaiHoaDon);
    const steps = getWorkflowSteps(hoaDon.loaiHoaDon);
    const currentIndex = steps.indexOf(normalizedCurrentStep);
    const stepIndex = steps.indexOf(step);

    const baseClass = 'workflow-connector';

    if (stepIndex < currentIndex) {
        return `${baseClass} completed`;
    } else {
        return `${baseClass} pending`;
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

function normalizeStatus(status) {
    if (!status) return '';
    const statusStr = status.toString().trim().toUpperCase();

    const vietnameseToEnglish = {
        CHO_XAC_NHAN: 'PENDING',
        DA_XAC_NHAN: 'CONFIRMED',
        DANG_GIAO: 'SHIPPING',
        DA_GIAO: 'DELIVERED',
        HOAN_THANH: 'COMPLETED',
        DA_HUY: 'CANCELLED',
        HOAN_TRA: 'RETURNED'
    };

    return vietnameseToEnglish[statusStr] || statusStr;
}

// ===== STATUS CHECK FUNCTIONS =====
function canUpdateStatus(hoaDon) {
    if (!hoaDon) return false;
    const normalizedStatus = normalizeStatus(hoaDon.trangThaiHoaDon);
    const terminalStates = ['COMPLETED', 'CANCELLED', 'RETURNED'];
    return !terminalStates.includes(normalizedStatus);
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
    return normalizedStatus === 'PENDING';
}

function canReturn(hoaDon) {
    const normalizedStatus = normalizeStatus(hoaDon.trangThaiHoaDon);
    return normalizedStatus === 'COMPLETED';
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
        availableSteps.push({ value: 'CANCELLED', label: 'Hủy đơn' });
    }

    return availableSteps;
}

function needsNote(status) {
    return status === 'CANCELLED';
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
            phuongThucThanhToan: 'BANK_TRANSFER',
            chiTietTraHangList: []
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
            phuongThucThanhToan: 'COD',
            chiTietTraHangList: []
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
            phuongThucThanhToan: 'CASH',
            chiTietTraHangList: []
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
            tienTietKiem: 300000.0,
            chiTietSanPhamId: 1
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
            tienTietKiem: 400000.0,
            chiTietSanPhamId: 2
        }
    ];
}

// ===== UPDATE FUNCTIONS =====
function updateReturnStatistics() {
    totalReturnRequests.value = hoaDons.value.reduce((sum, hd) => sum + (hd.chiTietTraHangList ? hd.chiTietTraHangList.length : 0), 0);

    pendingReturns.value = hoaDons.value.reduce((sum, hd) => sum + (hd.soLuongTraHangChoXuLy || 0), 0);

    approvedReturns.value = hoaDons.value.reduce((sum, hd) => sum + (hd.soLuongTraHangDaXuLy || 0), 0);
}

// ===== EVENT HANDLERS =====
async function refreshAllData() {
    await fetchAllData();
}

async function retryConnection() {
    hasError.value = false;
    await fetchAllData();
}

function goToLogin() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('token');
    sessionStorage.clear();
    window.location.href = '/login';
}

let searchTimeout;
function onSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        // Trigger reactive update
    }, 300);
}

function applyFilters() {
    // Triggers reactive computed properties
}

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
    paymentMethodFilter.value = '';
    returnStatusFilter.value = '';
    toast.add({
        severity: 'info',
        summary: 'Bộ lọc',
        detail: 'Đã xóa tất cả bộ lọc',
        life: 3000
    });
}

function onSort(event) {
    // Handle sorting
}

function onTabChange(event) {
    activeTabIndex.value = event.index;
}

function exportData() {
    try {
        const headers = ['ID', 'Mã hóa đơn', 'Loại', 'Ngày tạo', 'Tên khách hàng', 'Số điện thoại', 'Email', 'Tổng tiền', 'Trạng thái', 'Phương thức thanh toán', 'Số yêu cầu trả hàng'];

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
            hd.phuongThucThanhToan || '',
            hd.chiTietTraHangList ? hd.chiTietTraHangList.length : 0
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
        const filename = `HoaDon_TraHang_${dateStr}.csv`;

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

function editPOSItems(hoaDon) {
    toast.add({
        severity: 'info',
        summary: 'Chỉnh sửa',
        detail: `Chỉnh sửa sản phẩm cho ${hoaDon.maHoaDon}`,
        life: 3000
    });
}

// ===== COMPUTED PROPERTIES =====
const filteredHoaDons = computed(() => {
    let filtered = [...hoaDons.value];

    // Tab filtering
    if (activeTabIndex.value === 1) {
        // POS tab
        filtered = filtered.filter((hd) => hd.loaiHoaDon && hd.loaiHoaDon.toUpperCase() === 'OFFLINE');
    } else if (activeTabIndex.value === 2) {
        // Online tab
        filtered = filtered.filter((hd) => hd.loaiHoaDon && hd.loaiHoaDon.toUpperCase() === 'ONLINE');
    } else if (activeTabIndex.value === 3) {
        // Pending tab
        filtered = filtered.filter((hd) => {
            const status = normalizeStatus(hd.trangThaiHoaDon);
            return ['PENDING', 'CONFIRMED', 'SHIPPING'].includes(status);
        });
    }

    // Search filtering
    if (searchKeyword.value.trim()) {
        const keyword = searchKeyword.value.toLowerCase();
        filtered = filtered.filter(
            (hd) => (hd.maHoaDon && hd.maHoaDon.toLowerCase().includes(keyword)) || getCustomerName(hd).toLowerCase().includes(keyword) || (hd.sdt && hd.sdt.includes(keyword)) || (hd.email && hd.email.toLowerCase().includes(keyword))
        );
    }

    // Type filtering
    if (typeFilter.value) {
        filtered = filtered.filter((hd) => hd.loaiHoaDon && hd.loaiHoaDon.toUpperCase() === typeFilter.value);
    }

    // Status filtering
    if (statusFilter.value) {
        filtered = filtered.filter((hd) => {
            const status = normalizeStatus(hd.trangThaiHoaDon);
            return status === statusFilter.value;
        });
    }

    // Date filtering
    if (dateFilter.value) {
        const filterDate = new Date(dateFilter.value).toDateString();
        filtered = filtered.filter((hd) => {
            const hoaDonDate = new Date(hd.ngayTao).toDateString();
            return hoaDonDate === filterDate;
        });
    }

    // Amount filtering
    if (minAmount.value || maxAmount.value) {
        filtered = filtered.filter((hd) => {
            const amount = parseFloat(hd.tongTien) || 0;
            const min = minAmount.value ? parseFloat(minAmount.value) : 0;
            const max = maxAmount.value ? parseFloat(maxAmount.value) : Infinity;
            return amount >= min && amount <= max;
        });
    }

    // Payment method filtering
    if (paymentMethodFilter.value) {
        filtered = filtered.filter((hd) => hd.phuongThucThanhToan === paymentMethodFilter.value);
    }

    // Return status filtering
    if (returnStatusFilter.value) {
        filtered = filtered.filter((hd) => {
            const hasReturns = hd.chiTietTraHangList && hd.chiTietTraHangList.length > 0;
            const hasPendingReturns = hasReturns && hd.chiTietTraHangList.some((r) => r.trangThaiHoaDon === 'PENDING');

            switch (returnStatusFilter.value) {
                case 'HAS_RETURNS':
                    return hasReturns;
                case 'NO_RETURNS':
                    return !hasReturns;
                case 'PENDING_RETURNS':
                    return hasPendingReturns;
                default:
                    return true;
            }
        });
    }

    return filtered;
});

const filteredChiTiets = computed(() => {
    if (!searchChiTietKeyword.value.trim()) {
        return hoaDonChiTiets.value;
    }

    const keyword = searchChiTietKeyword.value.toLowerCase();
    return hoaDonChiTiets.value.filter((item) => (item.tenSanPham && item.tenSanPham.toLowerCase().includes(keyword)) || (item.maSanPham && item.maSanPham.toLowerCase().includes(keyword)));
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

const completionRate = computed(() => {
    if (hoaDons.value.length === 0) return 0;
    return Math.round((completedInvoices.value / hoaDons.value.length) * 100);
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

        <!-- Loading Overlay -->
        <div v-if="isLoading" class="loading-overlay">
            <div class="text-center">
                <ProgressSpinner style="width: 60px; height: 60px" strokeWidth="6" />
                <h5 class="mt-3 text-primary">{{ loadingMessage }}</h5>
            </div>
        </div>

        <!-- Header Section -->
        <div class="gradient-header mb-4 p-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 class="h3 fw-bold mb-2">Quản Lý Hóa Đơn</h2>
                    <p class="text-white-50 mb-0">Hệ thống quản lý hóa đơn & trả hàng</p>
                </div>
                <div class="d-flex gap-2">
                    <Button @click="refreshAllData" :disabled="isLoading" class="btn btn-outline-light" size="small">
                        <i :class="isLoading ? 'pi pi-spinner pi-spin' : 'pi pi-refresh'" class="me-1"></i>
                        {{ isLoading ? 'Đang tải...' : 'Làm mới' }}
                    </Button>
                    <Button @click="exportData" class="btn btn-success" size="small">
                        <i class="pi pi-download me-1"></i>
                        Xuất dữ liệu
                    </Button>
                </div>
            </div>

            <!-- Tab Navigation -->
            <TabView v-model:activeIndex="activeTabIndex" @tab-change="onTabChange">
                <TabPanel leftIcon="pi pi-list">
                    <template #header>
                        <i class="pi pi-list me-2"></i>
                        Tất cả
                        <Badge :value="hoaDons.length" class="ms-2" />
                    </template>
                </TabPanel>
                <TabPanel leftIcon="pi pi-desktop">
                    <template #header>
                        <i class="pi pi-desktop me-2"></i>
                        POS
                        <Badge :value="posInvoices.length" class="ms-2" />
                    </template>
                </TabPanel>
                <TabPanel leftIcon="pi pi-globe">
                    <template #header>
                        <i class="pi pi-globe me-2"></i>
                        Online
                        <Badge :value="onlineInvoices.length" class="ms-2" />
                    </template>
                </TabPanel>
                <TabPanel leftIcon="pi pi-clock">
                    <template #header>
                        <i class="pi pi-clock me-2"></i>
                        Cần xử lý
                        <Badge :value="pendingInvoices" severity="warning" class="ms-2" />
                    </template>
                </TabPanel>
            </TabView>
        </div>

        <!-- Statistics Cards -->
        <div class="row g-3 mb-4">
            <div class="col-md-6 col-lg-3">
                <div class="stat-card card border-0">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1 text-primary">Tổng hóa đơn</h6>
                                <h3 class="mb-2 text-primary">{{ hoaDons.length }}</h3>
                                <div class="d-flex gap-2">
                                    <span class="badge bg-info">POS: {{ posInvoices.length }}</span>
                                    <span class="badge bg-success">Online: {{ onlineInvoices.length }}</span>
                                </div>
                            </div>
                            <i class="pi pi-file-text text-primary" style="font-size: 2.5rem"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 col-lg-3">
                <div class="stat-card card border-0">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-success mb-1">Tổng doanh thu</h6>
                                <h3 class="text-success mb-2">{{ formatCurrency(totalRevenue) }}</h3>
                                <div class="d-flex gap-2">
                                    <span class="badge bg-warning text-dark">POS: {{ formatCurrency(posRevenue) }}</span>
                                    <span class="badge bg-info">Online: {{ formatCurrency(onlineRevenue) }}</span>
                                </div>
                            </div>
                            <i class="pi pi-money-bill text-success" style="font-size: 2.5rem"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 col-lg-3">
                <div class="stat-card card border-0">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-info mb-1">Hoàn thành</h6>
                                <h3 class="text-info mb-2">{{ completedInvoices }}</h3>
                                <span class="badge bg-secondary">Tỷ lệ: {{ completionRate }}%</span>
                            </div>
                            <i class="pi pi-check-circle text-info" style="font-size: 2.5rem"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 col-lg-3">
                <div class="stat-card card border-0">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-warning mb-1">Trả hàng</h6>
                                <h3 class="text-warning mb-2">{{ totalReturnRequests }}</h3>
                                <div class="d-flex gap-1">
                                    <span class="badge bg-danger">Chờ: {{ pendingReturns }}</span>
                                    <span class="badge bg-success">Xong: {{ approvedReturns }}</span>
                                </div>
                            </div>
                            <i class="pi pi-refresh text-warning" style="font-size: 2.5rem"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Search and Filter -->
        <div class="card mb-4 border-0 shadow-sm">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-md-4">
                        <label class="form-label fw-semibold">Tìm kiếm</label>
                        <div class="input-group">
                            <span class="input-group-text">
                                <i class="pi pi-search"></i>
                            </span>
                            <input v-model="searchKeyword" @input="onSearch" class="form-control" placeholder="Tìm kiếm hóa đơn, khách hàng..." />
                        </div>
                    </div>

                    <div class="col-md-2">
                        <label class="form-label fw-semibold">Loại hóa đơn</label>
                        <select v-model="typeFilter" @change="applyFilters" class="form-select">
                            <option value="">Tất cả loại</option>
                            <option value="OFFLINE">POS (Tại quầy)</option>
                            <option value="ONLINE">Online</option>
                        </select>
                    </div>

                    <div class="col-md-2">
                        <label class="form-label fw-semibold">Trạng thái</label>
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
                        <label class="form-label fw-semibold">Ngày tạo</label>
                        <Calendar v-model="dateFilter" @date-select="applyFilters" placeholder="Chọn ngày" dateFormat="dd/mm/yy" class="w-100" />
                    </div>

                    <div class="col-md-2">
                        <Button @click="showAdvancedFilter = !showAdvancedFilter" class="btn btn-outline-secondary w-100" outlined>
                            <i class="pi pi-filter me-1"></i>
                            Lọc nâng cao
                        </Button>
                    </div>
                </div>

                <!-- Advanced Filters -->
                <div v-if="showAdvancedFilter" class="border-top mt-3 pt-3">
                    <h6 class="fw-semibold mb-3">Bộ lọc nâng cao</h6>
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Khoảng tiền</label>
                            <div class="row g-2">
                                <div class="col">
                                    <InputNumber v-model="minAmount" placeholder="Từ" mode="currency" currency="VND" locale="vi-VN" />
                                </div>
                                <div class="col">
                                    <InputNumber v-model="maxAmount" placeholder="Đến" mode="currency" currency="VND" locale="vi-VN" />
                                </div>
                            </div>
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
                        <div class="col-md-4">
                            <label class="form-label">Trạng thái trả hàng</label>
                            <select v-model="returnStatusFilter" class="form-select">
                                <option value="">Tất cả</option>
                                <option value="HAS_RETURNS">Có trả hàng</option>
                                <option value="NO_RETURNS">Không trả hàng</option>
                                <option value="PENDING_RETURNS">Chờ xử lý trả</option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-3">
                        <Button @click="applyAdvancedFilters" class="me-2">Áp dụng</Button>
                        <Button @click="clearAllFilters" outlined>Xóa bộ lọc</Button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Error State -->
        <div v-if="hasError" class="py-5 text-center">
            <i class="pi pi-exclamation-triangle text-danger display-1 mb-3"></i>
            <h4 class="text-danger mb-2">Lỗi kết nối API</h4>
            <p class="text-muted mb-3">{{ errorMessage }}</p>
            <div class="d-flex justify-content-center gap-2">
                <Button @click="retryConnection" severity="danger">
                    <i class="pi pi-refresh me-1"></i>
                    Thử lại
                </Button>
                <Button @click="goToLogin" outlined v-if="errorMessage.includes('xác thực')">
                    <i class="pi pi-sign-in me-1"></i>
                    Đăng nhập lại
                </Button>
            </div>
        </div>

        <!-- Data Table -->
        <div v-else class="table-container">
            <DataTable
                :value="filteredHoaDons"
                dataKey="id"
                :paginator="true"
                :rows="itemsPerPage"
                :totalRecords="filteredHoaDons.length"
                :loading="isLoading"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[10, 25, 50, 100]"
                currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} hóa đơn"
                tableStyle="min-width: 60rem"
                sortMode="single"
                @sort="onSort"
                class="p-datatable-lg"
                responsiveLayout="scroll"
            >
                <Column field="id" header="ID" sortable style="min-width: 8rem">
                    <template #body="slotProps">
                        <span class="fw-bold text-primary">#{{ slotProps.data.id }}</span>
                    </template>
                </Column>

                <Column field="maHoaDon" header="Mã HĐ" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.maHoaDon" severity="secondary" />
                    </template>
                </Column>

                <Column field="loaiHoaDon" header="Loại" style="min-width: 8rem">
                    <template #body="slotProps">
                        <Tag
                            :value="slotProps.data.loaiHoaDon === 'OFFLINE' ? 'POS' : 'Online'"
                            :severity="slotProps.data.loaiHoaDon === 'OFFLINE' ? 'warning' : 'success'"
                            :icon="slotProps.data.loaiHoaDon === 'OFFLINE' ? 'pi pi-desktop' : 'pi pi-globe'"
                        />
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
                        <Tag :value="getStatusLabel(slotProps.data.trangThaiHoaDon)" :severity="getStatusSeverity(slotProps.data.trangThaiHoaDon)" :icon="getStatusIcon(slotProps.data.trangThaiHoaDon)" />
                    </template>
                </Column>

                <Column header="Trả hàng" style="min-width: 10rem">
                    <template #body="slotProps">
                        <div v-if="slotProps.data.chiTietTraHangList && slotProps.data.chiTietTraHangList.length > 0" class="d-flex align-items-center">
                            <Tag :value="slotProps.data.chiTietTraHangList.length" severity="warning" icon="pi pi-refresh" class="me-2" />
                            <small class="text-muted">yêu cầu</small>
                        </div>
                        <small v-else class="text-muted">Không có</small>
                    </template>
                </Column>

                <Column header="Thao tác" style="min-width: 14rem">
                    <template #body="slotProps">
                        <div class="d-flex gap-1">
                            <Button @click="viewChiTiet(slotProps.data)" size="small" outlined title="Xem chi tiết">
                                <i class="pi pi-eye"></i>
                            </Button>
                            <Button v-if="canUpdateStatus(slotProps.data)" @click="updateInvoiceStatus(slotProps.data)" size="small" severity="success" outlined title="Cập nhật trạng thái">
                                <i class="pi pi-arrow-right"></i>
                            </Button>
                            <Button v-if="canReturn(slotProps.data)" @click="showReturnDialog(slotProps.data)" size="small" severity="warning" outlined title="Quản lý trả hàng">
                                <i class="pi pi-refresh"></i>
                            </Button>
                        </div>
                    </template>
                </Column>

                <!-- Empty State -->
                <template #empty>
                    <div class="py-5 text-center">
                        <i class="pi pi-file-o text-muted display-1 mb-3"></i>
                        <h5 class="text-muted mb-2">Không tìm thấy hóa đơn</h5>
                        <p class="text-muted">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                    </div>
                </template>
            </DataTable>
        </div>

        <!-- Modal chi tiết hóa đơn -->
        <Dialog v-model:visible="showChiTietDialog" modal :style="{ width: '95vw' }" :maximizable="true" header="Chi tiết hóa đơn" class="p-fluid">
            <template #header>
                <div class="d-flex align-items-center">
                    <i class="pi pi-file-text me-2 text-primary"></i>
                    <span>Chi tiết hóa đơn {{ selectedHoaDon?.maHoaDon }}</span>
                </div>
            </template>

            <div v-if="selectedHoaDon" class="invoice-detail-content">
                <!-- Workflow Progress -->
                <div class="card mb-4 border-0 shadow-sm">
                    <div class="card-header bg-light">
                        <h6 class="card-title fw-semibold mb-0">
                            <i class="pi pi-sitemap me-2"></i>
                            Tiến trình xử lý
                        </h6>
                    </div>
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-center workflow-container">
                            <div v-for="(step, index) in getWorkflowSteps(selectedHoaDon.loaiHoaDon)" :key="step" class="d-flex flex-fill align-items-center">
                                <div class="d-flex flex-column align-items-center flex-fill">
                                    <div :class="getWorkflowStepClass(selectedHoaDon, step)">
                                        <i :class="getStepIcon(step)"></i>
                                    </div>
                                    <small class="fw-medium mt-2 text-center">{{ getStepLabel(step) }}</small>
                                    <small v-if="isStepActive(selectedHoaDon, step)" class="text-primary">Đang thực hiện</small>
                                    <small v-else-if="isStepCompleted(selectedHoaDon, step)" class="text-success">Hoàn thành</small>
                                </div>
                                <div v-if="index < getWorkflowSteps(selectedHoaDon.loaiHoaDon).length - 1" :class="getWorkflowConnectorClass(selectedHoaDon, step)"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="d-flex justify-content-end bg-light mb-4 gap-2 rounded p-3">
                    <Button v-if="canProcessNextStep(selectedHoaDon)" @click="processNextStepWithRefresh(selectedHoaDon)" severity="success" size="small">
                        <i class="pi pi-arrow-right me-1"></i>
                        {{ getNextStepAction(selectedHoaDon) }}
                    </Button>

                    <Button v-if="canUpdateStatus(selectedHoaDon)" @click="updateInvoiceStatus(selectedHoaDon)" severity="warning" size="small" outlined>
                        <i class="pi pi-edit me-1"></i>
                        Cập nhật trạng thái
                    </Button>

                    <Button v-if="canCancelInvoice(selectedHoaDon)" @click="cancelInvoice(selectedHoaDon)" severity="danger" size="small" outlined>
                        <i class="pi pi-times me-1"></i>
                        Hủy đơn
                    </Button>

                    <Button v-if="canReturn(selectedHoaDon)" @click="showReturnDialog(selectedHoaDon)" severity="warning" size="small">
                        <i class="pi pi-refresh me-1"></i>
                        Quản lý trả hàng
                    </Button>
                </div>

                <!-- Thông tin chi tiết -->
                <div class="row g-3 mb-4">
                    <!-- Thông tin hóa đơn -->
                    <div class="col-lg-4">
                        <div class="card h-100 border-0 shadow-sm">
                            <div class="card-header bg-primary text-white">
                                <h6 class="card-title mb-0 text-white">
                                    <i class="pi pi-file me-2"></i>
                                    Thông tin hóa đơn
                                </h6>
                            </div>
                            <div class="card-body">
                                <div class="invoice-info">
                                    <div class="info-row">
                                        <strong>Mã HĐ:</strong>
                                        <Tag :value="selectedHoaDon.maHoaDon" severity="secondary" />
                                    </div>
                                    <div class="info-row">
                                        <strong>Loại:</strong>
                                        <Tag :value="selectedHoaDon.loaiHoaDon === 'OFFLINE' ? 'POS' : 'Online'" :severity="selectedHoaDon.loaiHoaDon === 'OFFLINE' ? 'warning' : 'success'" />
                                    </div>
                                    <div class="info-row">
                                        <strong>Ngày tạo:</strong>
                                        <span>{{ formatDate(selectedHoaDon.ngayTao) }}</span>
                                    </div>
                                    <div class="info-row">
                                        <strong>Tổng tiền:</strong>
                                        <span class="fw-bold text-success">{{ formatCurrency(selectedHoaDon.tongTien) }}</span>
                                    </div>
                                    <div class="info-row">
                                        <strong>Trạng thái:</strong>
                                        <Tag :value="getStatusLabel(selectedHoaDon.trangThaiHoaDon)" :severity="getStatusSeverity(selectedHoaDon.trangThaiHoaDon)" />
                                    </div>
                                    <div v-if="selectedHoaDon.tenNhanVien" class="info-row">
                                        <strong>Nhân viên:</strong>
                                        <span>{{ selectedHoaDon.tenNhanVien }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Thông tin khách hàng -->
                    <div class="col-lg-4">
                        <div class="card h-100 border-0 shadow-sm">
                            <div class="card-header bg-info text-white">
                                <h6 class="card-title mb-0 text-white">
                                    <i class="pi pi-user me-2"></i>
                                    Thông tin khách hàng
                                </h6>
                            </div>
                            <div class="card-body">
                                <div class="invoice-info">
                                    <div class="info-row">
                                        <strong>Tên:</strong>
                                        <span>{{ getCustomerName(selectedHoaDon) }}</span>
                                    </div>
                                    <div v-if="selectedHoaDon.sdt" class="info-row">
                                        <strong>SĐT:</strong>
                                        <span>{{ selectedHoaDon.sdt }}</span>
                                    </div>
                                    <div v-if="selectedHoaDon.email" class="info-row">
                                        <strong>Email:</strong>
                                        <span>{{ selectedHoaDon.email }}</span>
                                    </div>
                                    <div v-if="selectedHoaDon.diaChi" class="info-row">
                                        <strong>Địa chỉ:</strong>
                                        <span>{{ selectedHoaDon.diaChi }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Thông tin trả hàng -->
                    <div class="col-lg-4">
                        <div class="card h-100 border-0 shadow-sm">
                            <div class="card-header bg-warning text-dark">
                                <h6 class="card-title mb-0">
                                    <i class="pi pi-refresh me-2"></i>
                                    Thống kê trả hàng
                                </h6>
                            </div>
                            <div class="card-body">
                                <div class="return-statistics-content" v-if="selectedHoaDon.chiTietTraHangList">
                                    <div class="info-row">
                                        <strong>Số yêu cầu:</strong>
                                        <Tag :value="selectedHoaDon.chiTietTraHangList.length || 0" severity="warning" />
                                    </div>
                                    <div class="info-row">
                                        <strong>Tổng SL trả:</strong>
                                        <span class="fw-bold text-warning">{{ selectedHoaDon.tongSoLuongTraHang || 0 }}</span>
                                    </div>
                                    <div class="info-row">
                                        <strong>Tổng tiền hoàn:</strong>
                                        <span class="fw-bold text-danger">{{ formatCurrency(selectedHoaDon.tongTienTraHang || 0) }}</span>
                                    </div>
                                    <div class="info-row">
                                        <strong>Chờ xử lý:</strong>
                                        <Tag :value="selectedHoaDon.soLuongTraHangChoXuLy || 0" severity="danger" />
                                    </div>
                                    <div class="info-row">
                                        <strong>Đã xử lý:</strong>
                                        <Tag :value="selectedHoaDon.soLuongTraHangDaXuLy || 0" severity="success" />
                                    </div>
                                </div>
                                <div v-else class="text-muted text-center">
                                    <i class="pi pi-info-circle display-4 mb-2"></i>
                                    <p>Chưa có yêu cầu trả hàng</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Chi tiết sản phẩm -->
                <div class="card mb-4 border-0 shadow-sm">
                    <div class="card-header bg-light">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="card-title fw-semibold mb-0">
                                <i class="pi pi-list me-2"></i>
                                Chi tiết sản phẩm ({{ hoaDonChiTiets.length }} mặt hàng)
                            </h6>
                            <div class="d-flex gap-2">
                                <div class="input-group input-group-sm" style="width: 250px">
                                    <span class="input-group-text">
                                        <i class="pi pi-search"></i>
                                    </span>
                                    <input v-model="searchChiTietKeyword" class="form-control" placeholder="Tìm kiếm sản phẩm..." />
                                </div>
                                <Button v-if="canEditItems(selectedHoaDon)" @click="editPOSItems(selectedHoaDon)" size="small" outlined>
                                    <i class="pi pi-pencil me-1"></i>
                                    Sửa
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Loading Chi Tiết -->
                        <div v-if="isLoadingChiTiet" class="py-4 text-center">
                            <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="6" />
                            <p class="text-muted mt-2">Đang tải chi tiết hóa đơn...</p>
                        </div>

                        <!-- Chi Tiết Table -->
                        <div v-else>
                            <DataTable :value="filteredChiTiets" class="p-datatable-sm" responsiveLayout="scroll" :paginator="hoaDonChiTiets.length > 10" :rows="10">
                                <Column field="stt" header="STT" style="width: 60px">
                                    <template #body="slotProps">
                                        <Tag :value="slotProps.index + 1" severity="secondary" />
                                    </template>
                                </Column>

                                <Column field="tenSanPham" header="Sản phẩm" style="min-width: 200px">
                                    <template #body="slotProps">
                                        <div class="d-flex align-items-center">
                                            <div v-if="slotProps.data.hinhAnh" class="product-image me-3">
                                                <img :src="slotProps.data.hinhAnh" alt="Product" class="rounded" style="width: 40px; height: 40px; object-fit: cover" />
                                            </div>
                                            <div>
                                                <div class="fw-medium">{{ slotProps.data.tenSanPham || 'N/A' }}</div>
                                                <small v-if="slotProps.data.maSanPham" class="text-muted"> Mã: {{ slotProps.data.maSanPham }} </small>
                                            </div>
                                        </div>
                                    </template>
                                </Column>

                                <Column field="thuocTinh" header="Thuộc tính" style="min-width: 120px">
                                    <template #body="slotProps">
                                        <div class="d-flex flex-column gap-1">
                                            <Tag v-if="slotProps.data.mauSac && slotProps.data.mauSac !== 'N/A'" :value="slotProps.data.mauSac" severity="info" size="small" />
                                            <Tag v-if="slotProps.data.kichThuoc && slotProps.data.kichThuoc !== 'N/A'" :value="slotProps.data.kichThuoc" severity="success" size="small" />
                                        </div>
                                    </template>
                                </Column>

                                <Column field="giaBan" header="Giá bán" style="min-width: 120px">
                                    <template #body="slotProps">
                                        <div>
                                            <span class="fw-bold text-success">{{ formatCurrency(slotProps.data.giaBan) }}</span>
                                            <div v-if="slotProps.data.giaGoc && slotProps.data.giaGoc !== slotProps.data.giaBan">
                                                <small class="text-muted text-decoration-line-through">
                                                    {{ formatCurrency(slotProps.data.giaGoc) }}
                                                </small>
                                            </div>
                                        </div>
                                    </template>
                                </Column>

                                <Column field="soLuong" header="Số lượng" style="min-width: 100px">
                                    <template #body="slotProps">
                                        <div v-if="isEditingItem(slotProps.data.id)" class="d-flex align-items-center gap-1">
                                            <InputNumber v-model="editQuantity" :min="1" size="small" style="width: 80px" />
                                            <Button @click="saveQuantity(slotProps.data.id)" severity="success" size="small">
                                                <i class="pi pi-check"></i>
                                            </Button>
                                            <Button @click="cancelEdit()" severity="secondary" size="small">
                                                <i class="pi pi-times"></i>
                                            </Button>
                                        </div>
                                        <Tag v-else :value="slotProps.data.soLuong" />
                                    </template>
                                </Column>

                                <Column field="thanhTien" header="Thành tiền" style="min-width: 120px">
                                    <template #body="slotProps">
                                        <div>
                                            <span class="fw-bold text-primary">
                                                {{ formatCurrency(slotProps.data.thanhTien || slotProps.data.giaBan * slotProps.data.soLuong) }}
                                            </span>
                                            <div v-if="slotProps.data.tienTietKiem && slotProps.data.tienTietKiem > 0">
                                                <small class="text-success">
                                                    <i class="pi pi-tag me-1"></i>
                                                    Tiết kiệm: {{ formatCurrency(slotProps.data.tienTietKiem) }}
                                                </small>
                                            </div>
                                        </div>
                                    </template>
                                </Column>

                                <!-- <Column v-if="canEditItems(selectedHoaDon)" header="Thao tác" style="min-width: 100px">
                                    <template #body="slotProps">
                                        <div class="d-flex gap-1">
                                            <Button v-if="!isEditingItem(slotProps.data.id)" @click="editItem(slotProps.data)" size="small" outlined title="Sửa số lượng">
                                                <i class="pi pi-pencil"></i>
                                            </Button>
                                            <Button @click="removeItem(slotProps.data.id)" severity="danger" size="small" outlined title="Xóa sản phẩm">
                                                <i class="pi pi-trash"></i>
                                            </Button>
                                        </div>
                                    </template>
                                </Column> -->

                                <!-- Empty State for Chi Tiet -->
                                <template #empty>
                                    <div class="py-4 text-center">
                                        <i class="pi pi-info-circle text-muted display-4 mb-3"></i>
                                        <h6 class="text-muted mb-2">Không có chi tiết nào</h6>
                                        <p class="text-muted">Hóa đơn này chưa có chi tiết sản phẩm.</p>
                                    </div>
                                </template>
                            </DataTable>

                            <!-- Tổng kết -->
                            <div class="row g-3 border-top mt-3 pt-3">
                                <div class="col-md-3 text-center">
                                    <div class="statistic-item">
                                        <div class="h4 mb-1 text-primary">{{ hoaDonChiTiets.length }}</div>
                                        <div class="text-muted">Số mặt hàng</div>
                                    </div>
                                </div>
                                <div class="col-md-3 text-center">
                                    <div class="statistic-item">
                                        <div class="h4 text-info mb-1">{{ getTotalQuantity() }}</div>
                                        <div class="text-muted">Tổng số lượng</div>
                                    </div>
                                </div>
                                <div class="col-md-3 text-center">
                                    <div class="statistic-item">
                                        <div class="h4 text-success mb-1">{{ formatCurrency(getTotalAmount()) }}</div>
                                        <div class="text-muted">Tổng tiền hàng</div>
                                    </div>
                                </div>
                                <div class="col-md-3 text-center">
                                    <div class="statistic-item">
                                        <div class="h4 text-warning mb-1">{{ formatCurrency(selectedHoaDon.tongTien) }}</div>
                                        <div class="text-muted">Thành tiền</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Chi tiết trả hàng -->
                <div v-if="selectedHoaDon.chiTietTraHangList && selectedHoaDon.chiTietTraHangList.length > 0" class="card border-0 shadow-sm">
                    <div class="card-header return-section">
                        <h6 class="card-title fw-semibold mb-0">
                            <i class="pi pi-refresh me-2"></i>
                            Chi tiết trả hàng ({{ selectedHoaDon.chiTietTraHangList.length }} yêu cầu)
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div v-for="returnItem in selectedHoaDon.chiTietTraHangList" :key="returnItem.id" class="col-md-6">
                                <div class="return-item p-3">
                                    <div class="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h6 class="mb-1">{{ returnItem.tenSanPham }}</h6>
                                            <small class="text-muted">Mã: {{ returnItem.maChiTietTraHang }}</small>
                                        </div>
                                        <Tag :value="getReturnStatusLabel(returnItem.trangThaiHoaDon)" :severity="getReturnStatusSeverity(returnItem.trangThaiHoaDon)" />
                                    </div>

                                    <div class="return-details">
                                        <div class="d-flex justify-content-between mb-2">
                                            <span>Số lượng trả:</span>
                                            <strong>{{ returnItem.soLuong }}</strong>
                                        </div>
                                        <div class="d-flex justify-content-between mb-2">
                                            <span>Tiền hoàn:</span>
                                            <strong class="text-danger">{{ formatCurrency(returnItem.tienHoan) }}</strong>
                                        </div>
                                        <div class="d-flex justify-content-between mb-2">
                                            <span>Ngày yêu cầu:</span>
                                            <span>{{ formatDate(returnItem.ngayTaoTraHang) }}</span>
                                        </div>
                                        <div v-if="returnItem.mauSac || returnItem.kichThuoc" class="d-flex mt-2 gap-2">
                                            <Tag v-if="returnItem.mauSac" :value="returnItem.mauSac" severity="info" size="small" />
                                            <Tag v-if="returnItem.kichThuoc" :value="returnItem.kichThuoc" severity="success" size="small" />
                                        </div>
                                    </div>

                                    <div v-if="returnItem.trangThaiHoaDon === 'PENDING'" class="d-flex mt-3 gap-2">
                                        <Button @click="approveReturn(returnItem)" severity="success" size="small">
                                            <i class="pi pi-check me-1"></i>
                                            Chấp nhận
                                        </Button>
                                        <Button @click="rejectReturn(returnItem)" severity="danger" size="small" outlined>
                                            <i class="pi pi-times me-1"></i>
                                            Từ chối
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Return Summary -->
                        <div class="return-statistics mt-4 rounded p-3">
                            <h6 class="mb-3 text-white">Tổng quan trả hàng</h6>
                            <div class="row text-center text-white">
                                <div class="col-3">
                                    <div class="h5 mb-1">{{ selectedHoaDon.tongSoLuongTraHang || 0 }}</div>
                                    <small>Tổng SL</small>
                                </div>
                                <div class="col-3">
                                    <div class="h5 mb-1">{{ formatCurrency(selectedHoaDon.tongTienTraHang || 0) }}</div>
                                    <small>Tổng tiền</small>
                                </div>
                                <div class="col-3">
                                    <div class="h5 mb-1">{{ selectedHoaDon.soLuongTraHangChoXuLy || 0 }}</div>
                                    <small>Chờ xử lý</small>
                                </div>
                                <div class="col-3">
                                    <div class="h5 mb-1">{{ selectedHoaDon.soLuongTraHangDaXuLy || 0 }}</div>
                                    <small>Đã xử lý</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>

        <!-- Modal cập nhật trạng thái -->
        <Dialog v-model:visible="showStatusUpdateDialog" modal :style="{ width: '450px' }" header="Cập nhật trạng thái">
            <div class="status-update-content">
                <div class="mb-3" v-if="selectedInvoiceForUpdate">
                    <label class="form-label fw-semibold">Hóa đơn:</label>
                    <div>
                        <strong>{{ selectedInvoiceForUpdate.maHoaDon }}</strong> -
                        {{ getCustomerName(selectedInvoiceForUpdate) }}
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Trạng thái hiện tại:</label>
                    <div>
                        <Tag :value="getStatusLabel(selectedInvoiceForUpdate?.trangThaiHoaDon)" :severity="getStatusSeverity(selectedInvoiceForUpdate?.trangThaiHoaDon)" />
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Trạng thái mới:</label>
                    <select v-model="newStatus" class="form-select">
                        <option value="">Chọn trạng thái mới</option>
                        <option v-for="status in getAvailableStatuses(selectedInvoiceForUpdate)" :key="status.value" :value="status.value">
                            {{ status.label }}
                        </option>
                    </select>
                </div>

                <div v-if="needsNote(newStatus)" class="mb-3">
                    <label class="form-label fw-semibold">Ghi chú:</label>
                    <textarea v-model="statusNote" class="form-control" rows="3" placeholder="Nhập ghi chú..."></textarea>
                </div>
            </div>

            <template #footer>
                <div class="d-flex gap-2">
                    <Button @click="confirmStatusUpdate" :disabled="!newStatus">
                        <i class="pi pi-check me-1"></i>
                        Cập nhật
                    </Button>
                    <Button @click="closeStatusUpdateDialog" outlined>
                        <i class="pi pi-times me-1"></i>
                        Hủy
                    </Button>
                </div>
            </template>
        </Dialog>

        <!-- Modal quản lý trả hàng -->
        <Dialog v-model:visible="showReturnManageDialog" modal :style="{ width: '90vw' }" :maximizable="true" header="Quản lý trả hàng">
            <template #header>
                <div class="d-flex align-items-center">
                    <i class="pi pi-refresh text-warning me-2"></i>
                    <span>Quản lý trả hàng - {{ selectedReturnInvoice?.maHoaDon }}</span>
                </div>
            </template>

            <div v-if="selectedReturnInvoice" class="return-management-content">
                <!-- Thông tin hóa đơn -->
                <div class="card mb-4 border-0 shadow-sm">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0 text-white">
                            <i class="pi pi-info-circle me-2"></i>
                            Thông tin đơn hàng
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3"><strong>Mã hóa đơn:</strong> {{ selectedReturnInvoice.maHoaDon }}</div>
                            <div class="col-md-3"><strong>Khách hàng:</strong> {{ getCustomerName(selectedReturnInvoice) }}</div>
                            <div class="col-md-3"><strong>Tổng tiền:</strong> {{ formatCurrency(selectedReturnInvoice.tongTien) }}</div>
                            <div class="col-md-3">
                                <strong>Trạng thái:</strong>
                                <Tag :value="getStatusLabel(selectedReturnInvoice.trangThaiHoaDon)" :severity="getStatusSeverity(selectedReturnInvoice.trangThaiHoaDon)" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Đã xóa phần tạo đơn trả hàng, chỉ giữ lại xác nhận đơn trả hàng -->

                <!-- Danh sách yêu cầu trả hàng -->
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-warning text-dark">
                        <h6 class="mb-0">
                            <i class="pi pi-clock me-2"></i>
                            Danh sách yêu cầu trả hàng
                        </h6>
                    </div>
                    <div class="card-body">
                        <DataTable :value="currentReturnRequests" class="p-datatable-sm" responsiveLayout="scroll">
                            <Column field="maChiTietTraHang" header="Mã yêu cầu" style="min-width: 120px">
                                <template #body="slotProps">
                                    <Tag :value="slotProps.data.maChiTietTraHang" severity="secondary" />
                                </template>
                            </Column>

                            <Column field="tenSanPham" header="Sản phẩm" style="min-width: 200px">
                                <template #body="slotProps">
                                    <div>
                                        <div class="fw-medium">{{ slotProps.data.tenSanPham }}</div>
                                        <div class="d-flex mt-1 gap-1">
                                            <Tag v-if="slotProps.data.mauSac" :value="slotProps.data.mauSac" severity="info" size="small" />
                                            <Tag v-if="slotProps.data.kichThuoc" :value="slotProps.data.kichThuoc" severity="success" size="small" />
                                        </div>
                                    </div>
                                </template>
                            </Column>

                            <Column field="soLuong" header="SL trả" style="min-width: 80px">
                                <template #body="slotProps">
                                    <Tag :value="slotProps.data.soLuong" />
                                </template>
                            </Column>

                            <Column field="tienHoan" header="Tiền hoàn" style="min-width: 120px">
                                <template #body="slotProps">
                                    <span class="fw-bold text-danger">{{ formatCurrency(slotProps.data.tienHoan) }}</span>
                                </template>
                            </Column>

                            <Column field="ngayTaoTraHang" header="Ngày yêu cầu" style="min-width: 150px">
                                <template #body="slotProps">
                                    <small>{{ formatDate(slotProps.data.ngayTaoTraHang) }}</small>
                                </template>
                            </Column>

                            <Column field="trangThaiHoaDon" header="Trạng thái" style="min-width: 120px">
                                <template #body="slotProps">
                                    <Tag :value="getReturnStatusLabel(slotProps.data.trangThaiHoaDon)" :severity="getReturnStatusSeverity(slotProps.data.trangThaiHoaDon)" />
                                </template>
                            </Column>

                            <Column header="Thao tác" style="min-width: 140px">
                                <template #body="slotProps">
                                    <div class="d-flex gap-1" v-if="slotProps.data.trangThaiHoaDon === 'PENDING'">
                                        <Button @click="approveReturn(slotProps.data)" severity="success" size="small" title="Chấp nhận">
                                            <i class="pi pi-check"></i>
                                        </Button>
                                        <Button @click="rejectReturn(slotProps.data)" severity="danger" size="small" outlined title="Từ chối">
                                            <i class="pi pi-times"></i>
                                        </Button>
                                        <Button @click="editReturnRequest(slotProps.data)" severity="info" size="small" outlined title="Sửa">
                                            <i class="pi pi-pencil"></i>
                                        </Button>
                                    </div>
                                    <span v-else class="text-muted">Đã xử lý</span>
                                </template>
                            </Column>

                            <template #empty>
                                <div class="py-4 text-center">
                                    <i class="pi pi-refresh text-muted display-4 mb-3"></i>
                                    <p class="text-muted">Chưa có yêu cầu trả hàng nào</p>
                                </div>
                            </template>
                        </DataTable>
                    </div>
                </div>
            </div>
        </Dialog>

        <!-- Đã xóa dialog tạo yêu cầu trả hàng -->
    </div>
</template>

<style scoped>
/* Base styles */
.invoice-management {
    padding: 1rem;
    min-height: 100vh;
    background-color: #f8f9fa;
}

.gradient-header {
    background: linear-gradient(135deg, #007bff, #6610f2);
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 123, 255, 0.3);
}

.stat-card {
    border: none;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    overflow: hidden;
}

.stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

/* Workflow styles */
.workflow-step {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-weight: 600;
    transition: all 0.3s ease;
    position: relative;
}

.workflow-connector {
    flex: 1;
    height: 3px;
    margin: 0 15px;
    border-radius: 2px;
    transition: all 0.3s ease;
}

.workflow-connector.completed {
    background: linear-gradient(90deg, #28a745, #20c997);
}

.workflow-connector.pending {
    background: #e9ecef;
}

/* Return styles */
.return-section {
    background: linear-gradient(135deg, #fff3cd, #ffeaa7);
    border-left: 4px solid #ffc107;
}

.return-item {
    background: white;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
}

.return-item:hover {
    border-color: #007bff;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
}

.return-statistics {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
}

.return-details {
    font-size: 0.9rem;
}

/* Table styles */
.table-container {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    background: white;
}

/* Info row styles */
.invoice-info .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f1f3f5;
}

.invoice-info .info-row:last-child {
    border-bottom: none;
}

/* Product image */
.product-image img {
    border: 2px solid #e9ecef;
}

/* Statistic items */
.statistic-item {
    padding: 1rem;
    border-radius: 8px;
    background: rgba(0, 123, 255, 0.05);
    border: 1px solid rgba(0, 123, 255, 0.1);
}

/* Loading overlay */
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(2px);
}

/* Dialog styles */
.invoice-detail-content .card {
    margin-bottom: 1.5rem;
}

.status-update-content .form-label {
    margin-bottom: 0.5rem;
    font-weight: 600;
}

.return-management-content .card {
    margin-bottom: 1.5rem;
}
</style>
