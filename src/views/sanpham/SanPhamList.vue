<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';
import axios from 'axios';

// Cấu hình API base URL
const API_BASE_URL = 'http://localhost:8080';

const toast = useToast();
const dt = ref();
const products = ref([]);
const productDialog = ref(false);
const deleteProductDialog = ref(false);
const deleteProductsDialog = ref(false);
const product = ref({});
const selectedProducts = ref();
const expandedRows = ref([]);
const loading = ref(false);
const submitted = ref(false);
const productDetails = ref({});
const loadingDetails = ref({});
const detailDialog = ref(false);
const deleteDetailDialog = ref(false);
const detail = ref({});

// Dữ liệu cho dropdown
const danhMucs = ref([]);
const thuongHieus = ref([]);
const chatLieus = ref([]);
const deGiays = ref([]);
const kichCos = ref([]);
const mauSacs = ref([]);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const statuses = ref([
    { label: 'ĐANG HOẠT ĐỘNG', value: 1 },
    { label: 'NGỪNG HOẠT ĐỘNG', value: 0 }
]);
// Thêm vào phần ref declarations
const imagePreviewDialog = ref(false);
const selectedImageDetail = ref({});

// Thêm computed để tính tổng số lượng từ chi tiết sản phẩm
const getProductTotalQuantity = (productId) => {
    if (!productDetails.value[productId]) return 0;
    return productDetails.value[productId].reduce((total, detail) => {
        return total + (detail.soLuong || 0);
    }, 0);
};

// Computed để cập nhật products với tổng số lượng thực tế
const productsWithTotalQuantity = computed(() => {
    return products.value.map(product => ({
        ...product,
        totalQuantity: getProductTotalQuantity(product.id),
        displayQuantity: getProductTotalQuantity(product.id) || product.soLuong || 0
    }));
});

// Thêm các hàm xử lý
function handleImageError(event) {
    event.target.src = '/images/placeholder.png';
    event.target.onerror = null;
}

function openImageDetail(image) {
    selectedImageDetail.value = image;
    imagePreviewDialog.value = true;
}

function openAllImages(detail) {
    selectedImageDetail.value = { 
        detail: detail, 
        images: detail.images, 
        showAll: true 
    };
    imagePreviewDialog.value = true;
}

function addImageToDetail(detail) {
    toast.add({
        severity: 'info',
        summary: 'Thông báo',
        detail: `Vui lòng vào trang quản lý hình ảnh để thêm hình cho chi tiết: ${detail.maChiTiet}`,
        life: 5000
    });
}

// Load dữ liệu khi component mount
onMounted(async () => {
    await Promise.all([loadProducts(), loadDanhMucs(), loadThuongHieus(), loadChatLieus(), loadDeGiays(), loadKichCos(), loadMauSacs()]);
});

// API calls
async function loadProducts() {
    try {
        loading.value = true;
        const response = await axios.get(`${API_BASE_URL}/api/san-pham`);
        products.value = response.data.map((item) => ({
            ...item,
            inventoryStatus: item.trangThai === 1 ? 'ACTIVE' : 'INACTIVE',
            name: item.tenSanPham,
            code: item.maSanPham,
            category: item.danhMuc?.tenDanhMuc || 'Chưa phân loại',
            brand: item.thuongHieu?.tenThuongHieu || 'Không có',
            material: item.chatLieu?.tenChatLieu || 'Không có',
            sole: item.deGiay?.tenDeGiay || 'Không có',
            quantity: item.soLuong || 0,
            ngayTao: item.ngayTao, // Lưu nguyên giá trị ngayTao
            createdAt: item.ngayTao ? new Date(item.ngayTao).toLocaleDateString('vi-VN') : 'N/A',
            updatedAt: item.ngayCapNhat ? new Date(item.ngayCapNhat).toLocaleDateString('vi-VN') : 'N/A'
        }));
        
        // Tải chi tiết cho tất cả sản phẩm để tính tổng số lượng
        for (const product of products.value) {
            await loadProductDetails(product.id, false); // false để không hiển thị loading
        }
        
        if (products.value.length === 0) {
            toast.add({ severity: 'info', summary: 'Thông báo', detail: 'Không có sản phẩm nào', life: 3000 });
        }
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm:', error.response?.status, error.response?.data);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: `Không thể tải danh sách sản phẩm: ${error.response?.data?.message || error.message}`, life: 3000 });
    } finally {
        loading.value = false;
    }
}

async function loadDanhMucs() {
    try {
        const response = await axios.get(`${API_BASE_URL}/danh-muc`);
        danhMucs.value = response.data;
    } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
    }
}

async function loadThuongHieus() {
    try {
        const response = await axios.get(`${API_BASE_URL}/thuong-hieu`);
        thuongHieus.value = response.data;
    } catch (error) {
        console.error('Lỗi khi tải thương hiệu:', error);
    }
}

async function loadChatLieus() {
    try {
        const response = await axios.get(`${API_BASE_URL}/chat-lieu`);
        chatLieus.value = response.data;
    } catch (error) {
        console.error('Lỗi khi tải chất liệu:', error);
    }
}

async function loadDeGiays() {
    try {
        const response = await axios.get(`${API_BASE_URL}/de-giay`);
        deGiays.value = response.data;
    } catch (error) {
        console.error('Lỗi khi tải đế giày:', error);
    }
}

async function loadKichCos() {
    try {
        const response = await axios.get(`${API_BASE_URL}/kich-co`);
        kichCos.value = response.data;
    } catch (error) {
        console.error('Lỗi khi tải kích cỡ:', error);
    }
}

async function loadMauSacs() {
    try {
        const response = await axios.get(`${API_BASE_URL}/mau-sac`);
        mauSacs.value = response.data;
    } catch (error) {
        console.error('Lỗi khi tải màu sắc:', error);
    }
}

// Cập nhật hàm loadProductDetails với tham số showLoading
async function loadProductDetails(productId, showLoading = true) {
    if (showLoading) {
        loadingDetails.value[productId] = true;
    }
    try {
        const response = await axios.get(`${API_BASE_URL}/api/san-pham-chi-tiet/san-pham/${productId}`);
        productDetails.value[productId] = response.data.map((detail) => ({
            ...detail,
            size: detail.kichCo?.tenKichCo || 'N/A',
            color: detail.mauSac?.tenMauSac || 'N/A',
            giaGoc: detail.giaGoc || 0.0,
            giaBan: detail.giaBan || 0.0,
            images: [],
            createdAt: detail.ngayTao ? new Date(detail.ngayTao).toLocaleDateString('vi-VN') : 'N/A'
        }));
        
        // Tải hình ảnh cho từng chi tiết sản phẩm
        for (const detail of productDetails.value[productId]) {
            try {
                // Sử dụng ID thay vì maChiTiet
                const imgResponse = await axios.get(`${API_BASE_URL}/hinh-anh/chi-tiet-san-pham/${detail.id}`);
                detail.images = imgResponse.data.map((img) => ({
                    id: img.id,
                    maHinhAnh: img.maHinhAnh,
                    tenHinhAnh: img.tenHinhAnh,
                    trangThai: img.trangThai,
                    url: `${API_BASE_URL}/hinh-anh/images/${img.tenHinhAnh}`
                }));
            } catch (imgError) {
                console.error(`Lỗi khi tải hình ảnh cho chi tiết ${detail.maChiTiet}:`, imgError);
                detail.images = [];
            }
        }
    } catch (error) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', error.response?.status, error.response?.data);
        if (showLoading) {
            toast.add({ severity: 'error', summary: 'Lỗi', detail: `Không thể tải chi tiết sản phẩm: ${error.response?.data?.message || error.message}`, life: 3000 });
        }
    } finally {
        if (showLoading) {
            loadingDetails.value[productId] = false;
        }
    }
}

async function onRowExpand(event) {
    const productId = event.data.id;
    if (!productDetails.value[productId]) {
        await loadProductDetails(productId);
    }
}

// Hàm cập nhật tổng số lượng sản phẩm sau khi thay đổi chi tiết
async function updateProductTotalQuantity(productId) {
    await loadProductDetails(productId, false);
    // Trigger reactivity update
    products.value = [...products.value];
}

// Utility functions
function formatCurrency(value) {
    if (value) return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    return '0 ₫';
}

function createId() {
    let id = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'CTSP' + id;
}

function createProductId() {
    let id = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'SP' + id;
}

// Dialog functions for Product
function openNew() {
    product.value = {
        tenSanPham: '',
        maSanPham: createProductId(),
        soLuong: 0, // Giá trị mặc định là 0 (hợp lệ)
        trangThai: 1,
        danhMuc: null,
        thuongHieu: null,
        chatLieu: null,
        deGiay: null
    };
    submitted.value = false;
    productDialog.value = true;
}

function hideDialog() {
    productDialog.value = false;
    submitted.value = false;
}

function editProduct(prod) {
    product.value = {
        id: prod.id,
        tenSanPham: prod.tenSanPham,
        maSanPham: prod.maSanPham,
        soLuong: Math.max(0, prod.soLuong || 0), // Đảm bảo không âm, nếu giá trị hiện tại âm thì đặt về 0
        trangThai: prod.trangThai,
        danhMuc: prod.danhMuc,
        thuongHieu: prod.thuongHieu,
        chatLieu: prod.chatLieu,
        deGiay: prod.deGiay,
        ngayTao: prod.ngayTao
    };
    
    // Reset validation state
    submitted.value = false;
    productDialog.value = true;
}

async function saveProduct() {
    submitted.value = true;
    
    // Validate tên sản phẩm
    if (!product.value.tenSanPham?.trim()) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Cảnh báo', 
            detail: 'Tên sản phẩm là bắt buộc', 
            life: 3000 
        });
        return;
    }
    
    // Validate số lượng - phải là số không âm
    if (product.value.soLuong == null || product.value.soLuong === '' || product.value.soLuong < 0) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Cảnh báo', 
            detail: 'Số lượng phải là số không âm', 
            life: 3000 
        });
        return;
    }
    
    // Validate danh mục
    if (!product.value.danhMuc) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Cảnh báo', 
            detail: 'Danh mục là bắt buộc', 
            life: 3000 
        });
        return;
    }
    
    // Validate thương hiệu
    if (!product.value.thuongHieu) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Cảnh báo', 
            detail: 'Thương hiệu là bắt buộc', 
            life: 3000 
        });
        return;
    }
    
    // Validate chất liệu
    if (!product.value.chatLieu) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Cảnh báo', 
            detail: 'Chất liệu là bắt buộc', 
            life: 3000 
        });
        return;
    }
    
    // Validate đế giày
    if (!product.value.deGiay) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Cảnh báo', 
            detail: 'Đế giày là bắt buộc', 
            life: 3000 
        });
        return;
    }
    
    try {
        loading.value = true;
        const productData = {
            tenSanPham: product.value.tenSanPham,
            maSanPham: product.value.maSanPham,
            soLuong: Math.max(0, product.value.soLuong || 0), // Đảm bảo không âm
            trangThai: product.value.trangThai,
            danhMuc: product.value.danhMuc,
            thuongHieu: product.value.thuongHieu,
            chatLieu: product.value.chatLieu,
            deGiay: product.value.deGiay,
            ngayTao: product.value.ngayTao || (product.value.id ? products.value.find(p => p.id === product.value.id)?.ngayTao : new Date().toISOString())
        };
        
        if (product.value.id) {
            await axios.put(`${API_BASE_URL}/api/san-pham/update/${product.value.id}`, productData);
            toast.add({ 
                severity: 'success', 
                summary: 'Thành công', 
                detail: `Đã cập nhật sản phẩm "${product.value.tenSanPham}"`, 
                life: 3000 
            });
        } else {
            await axios.post(`${API_BASE_URL}/api/san-pham/save`, productData);
            toast.add({ 
                severity: 'success', 
                summary: 'Thành công', 
                detail: `Đã thêm sản phẩm "${product.value.tenSanPham}"`, 
                life: 3000 
            });
        }
        
        await loadProducts();
        productDialog.value = false;
        product.value = {};
        submitted.value = false;
    } catch (error) {
        console.error('Lỗi khi lưu sản phẩm:', error.response?.status, error.response?.data);
        toast.add({ 
            severity: 'error', 
            summary: 'Lỗi', 
            detail: `Không thể lưu sản phẩm: ${error.response?.data?.message || error.message}`, 
            life: 3000 
        });
    } finally {
        loading.value = false;
    }
}

function confirmDeleteProduct(prod) {
    product.value = prod;
    deleteProductDialog.value = true;
}

async function deleteProduct() {
    try {
        loading.value = true;
        await axios.delete(`${API_BASE_URL}/api/san-pham/delete/${product.value.id}`);
        toast.add({ severity: 'success', summary: 'Đã xóa', detail: `Sản phẩm "${product.value.tenSanPham || product.value.name}" đã được xóa`, life: 3000 });
        await loadProducts();
        deleteProductDialog.value = false;
        product.value = {};
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error.response?.status, error.response?.data);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: `Không thể xóa sản phẩm: ${error.response?.data?.message || error.message}`, life: 3000 });
    } finally {
        loading.value = false;
    }
}

function confirmDeleteSelected() {
    deleteProductsDialog.value = true;
}

async function deleteSelectedProducts() {
    try {
        loading.value = true;
        const deletePromises = selectedProducts.value.map((product) => axios.delete(`${API_BASE_URL}/api/san-pham/delete/${product.id}`));
        await Promise.all(deletePromises);
        toast.add({ severity: 'success', summary: 'Đã xóa', detail: `Đã xóa ${selectedProducts.value.length} sản phẩm`, life: 3000 });
        await loadProducts();
        deleteProductsDialog.value = false;
        selectedProducts.value = null;
    } catch (error) {
        console.error('Lỗi khi xóa nhiều sản phẩm:', error.response?.status, error.response?.data);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: `Không thể xóa sản phẩm: ${error.response?.data?.message || error.message}`, life: 3000 });
    } finally {
        loading.value = false;
    }
}

// Dialog functions for Product Details - Updated for multi-select
function openNewDetail(productId) {
    detail.value = {
        maChiTiet: createId(),
        soLuong: 0,
        giaGoc: 0.0,
        giaBan: 0.0,
        trangThai: 1,
        mauSacs: [], // Chuyển thành mảng để chọn nhiều màu
        kichCos: [], // Chuyển thành mảng để chọn nhiều kích cỡ
        sanPham: { id: productId }
    };
    submitted.value = false;
    detailDialog.value = true;
}

//  Cập nhật chi tiết sản phẩm 
function editDetail(detailData, productId) {
    detail.value = {
        id: detailData.id,
        maChiTiet: detailData.maChiTiet,
        soLuong: Math.max(0, detailData.soLuong || 0), // Đảm bảo không âm
        giaGoc: Math.max(0, detailData.giaGoc || 0), // Đảm bảo không âm
        giaBan: Math.max(0, detailData.giaBan || 0), // Đảm bảo không âm
        trangThai: detailData.trangThai,
        mauSacs: detailData.mauSac ? [detailData.mauSac] : [], // Chuyển single thành array để edit
        kichCos: detailData.kichCo ? [detailData.kichCo] : [], // Chuyển single thành array để edit
        sanPham: { id: productId }
    };
    
    // Reset validation state
    submitted.value = false;
    detailDialog.value = true;
}

function hideDetailDialog() {
    detailDialog.value = false;
    submitted.value = false;
}

// Updated saveDetail function to handle multiple variants
async function saveDetail() {
    submitted.value = true;
    
    // Validate mã chi tiết
    if (!detail.value.maChiTiet?.trim()) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Cảnh báo', 
            detail: 'Mã chi tiết là bắt buộc', 
            life: 3000 
        });
        return;
    }
    
    // Validate số lượng - phải là số không âm
    if (detail.value.soLuong == null || detail.value.soLuong === '' || detail.value.soLuong <= 0) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Cảnh báo', 
            detail: 'Số lượng phải lớn hơn 0', 
            life: 3000 
        });
        return;
    }
    
    // Validate giá bán
    if (detail.value.giaBan == null || detail.value.giaBan === '' || detail.value.giaBan <= 0) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Cảnh báo', 
            detail: 'Giá bán phải lớn hơn 0', 
            life: 3000 
        });
        return;
    }
    
    // Validate giá nhập
    if (detail.value.giaGoc == null || detail.value.giaGoc === '' || detail.value.giaGoc <= 0) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Cảnh báo', 
            detail: 'Giá nhập phải lớn hơn 0', 
            life: 3000 
        });
        return;
    }
    
    // Validate màu sắc
    if (!detail.value.mauSacs || detail.value.mauSacs.length === 0) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Cảnh báo', 
            detail: 'Phải chọn ít nhất một màu sắc', 
            life: 3000 
        });
        return;
    }
    
    // Validate kích cỡ
    if (!detail.value.kichCos || detail.value.kichCos.length === 0) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Cảnh báo', 
            detail: 'Phải chọn ít nhất một kích cỡ', 
            life: 3000 
        });
        return;
    }
    
    try {
        loading.value = true;
        
        // Nếu là edit (có id), chỉ cập nhật một biến thể
        if (detail.value.id) {
            const detailData = {
                maChiTiet: detail.value.maChiTiet,
                soLuong: Math.max(0, detail.value.soLuong || 0),
                giaGoc: Math.max(0, detail.value.giaGoc || 0),
                giaBan: Math.max(0, detail.value.giaBan || 0),
                trangThai: detail.value.trangThai,
                mauSac: detail.value.mauSacs[0], // Chỉ lấy màu đầu tiên khi edit
                kichCo: detail.value.kichCos[0], // Chỉ lấy size đầu tiên khi edit
                sanPham: detail.value.sanPham
            };
            
            await axios.put(`${API_BASE_URL}/api/san-pham-chi-tiet/update/${detail.value.id}`, detailData);
            toast.add({ 
                severity: 'success', 
                summary: 'Thành công', 
                detail: `Đã cập nhật chi tiết sản phẩm "${detail.value.maChiTiet}"`, 
                life: 3000 
            });
        } else {
            // Tạo nhiều biến thể từ combinations của màu và size
            const variants = [];
            let successCount = 0;
            let errorCount = 0;
            let variantIndex = 1;
            
            for (const mauSac of detail.value.mauSacs) {
                for (const kichCo of detail.value.kichCos) {
                    const variantData = {
                        maChiTiet: `${detail.value.maChiTiet}-${mauSac.tenMauSac}-${kichCo.tenKichCo}`,
                        soLuong: Math.max(0, detail.value.soLuong || 0),
                        giaGoc: Math.max(0, detail.value.giaGoc || 0),
                        giaBan: Math.max(0, detail.value.giaBan || 0),
                        trangThai: detail.value.trangThai,
                        mauSac: mauSac,
                        kichCo: kichCo,
                        sanPham: detail.value.sanPham
                    };
                    variants.push(variantData);
                }
            }
            
            // Lưu từng biến thể
            for (const variant of variants) {
                try {
                    await axios.post(`${API_BASE_URL}/api/san-pham-chi-tiet/save`, variant);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    console.error(`Lỗi khi tạo biến thể ${variant.maChiTiet}:`, error);
                }
            }
            
            if (successCount > 0) {
                toast.add({ 
                    severity: 'success', 
                    summary: 'Thành công', 
                    detail: `Đã tạo ${successCount} biến thể sản phẩm${errorCount > 0 ? `, ${errorCount} biến thể thất bại` : ''}`, 
                    life: 3000 
                });
            } else {
                toast.add({ 
                    severity: 'error', 
                    summary: 'Lỗi', 
                    detail: 'Không thể tạo biến thể nào', 
                    life: 3000 
                });
            }
        }
        
        await loadProductDetails(detail.value.sanPham.id);
        // Cập nhật tổng số lượng sản phẩm
        await updateProductTotalQuantity(detail.value.sanPham.id);
        
        detailDialog.value = false;
        detail.value = {};
        submitted.value = false;
    } catch (error) {
        console.error('Lỗi khi lưu chi tiết sản phẩm:', error.response?.status, error.response?.data);
        toast.add({ 
            severity: 'error', 
            summary: 'Lỗi', 
            detail: `Không thể lưu chi tiết sản phẩm: ${error.response?.data?.message || error.message}`, 
            life: 3000 
        });
    } finally {
        loading.value = false;
    }
}

function confirmDeleteDetail(detailData) {
    detail.value = detailData;
    deleteDetailDialog.value = true;
}

async function deleteDetail() {
    try {
        loading.value = true;
        const productId = detail.value.sanPham.id;
        await axios.delete(`${API_BASE_URL}/api/san-pham-chi-tiet/delete/${detail.value.id}`);
        toast.add({ severity: 'success', summary: 'Đã xóa', detail: `Chi tiết sản phẩm "${detail.value.maChiTiet}" đã được xóa`, life: 3000 });
        await loadProductDetails(productId);
        // Cập nhật tổng số lượng sản phẩm
        await updateProductTotalQuantity(productId);
        
        deleteDetailDialog.value = false;
        detail.value = {};
    } catch (error) {
        console.error('Lỗi khi xóa chi tiết sản phẩm:', error.response?.status, error.response?.data);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: `Không thể xóa chi tiết sản phẩm: ${error.response?.data?.message || error.message}`, life: 3000 });
    } finally {
        loading.value = false;
    }
}

function getStatusLabel(status) {
    return status === 1 ? 'success' : 'danger';
}

function getStockSeverity(product) {
    if (product.trangThai === 0) return 'danger';
    const totalQty = getProductTotalQuantity(product.id);
    if (totalQty > 50) return 'success';
    if (totalQty > 10) return 'warn';
    return 'danger';
}

// Xuất file CSV
function exportCSV() {
    try {
        // If no data, show warning
        if (!products.value || products.value.length === 0) {
            toast.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Không có dữ liệu để xuất',
                life: 3000
            });
            return;
        }

        // Create CSV headers with Vietnamese labels
        const headers = ['ID', 'Mã Sản Phẩm', 'Tên Sản Phẩm','Tổng Số Lượng','Danh Mục','Thương Hiệu','Chất Liệu' ,'Đế Giày',  'Trạng Thái', 'Ngày Tạo'];

        // Convert data to CSV format
        const csvData = productsWithTotalQuantity.value.map(item => {
            return [
                item.id || '',
                item.maSanPham || '',
                item.tenSanPham || '',
                item.displayQuantity || 0,
                item.category || '',
                item.brand || '',
                item.material || '',
                item.sole || '',
                item.trangThai === 1 ? 'Hoạt động' : 'Ngừng hoạt động',
                item.ngayTao || ''
            ];
        });

        // Combine headers and data
        const csvContent = [headers, ...csvData]
            .map(row => row.map(field => {
                // Handle fields that might contain commas or quotes
                const stringField = String(field);
                if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                    return `"${stringField.replace(/"/g, '""')}"`;
                }
                return stringField;
            }).join(','))
            .join('\n');

        // Add BOM for proper UTF-8 encoding in Excel
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;

        // Create and download file
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            
            // Generate filename with current date
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
            const filename = `SanPham-${dateStr}.csv`;

            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show success message
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã xuất ${products.value.length} bản ghi ra file CSV`,
                life: 3000
            });
        }
    } catch (error) {
        console.error('Error exporting CSV:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Xuất CSV thất bại',
            life: 3000
        });
    }
}

async function refreshData() {
    await loadProducts();
    expandedRows.value = [];
    productDetails.value = {};
    toast.add({ severity: 'info', summary: 'Đã làm mới', detail: 'Dữ liệu đã được cập nhật', life: 2000 });
}

function expandAll() {
    expandedRows.value = productsWithTotalQuantity.value.filter((p) => p.id);
}

function collapseAll() {
    expandedRows.value = [];
}

// Function to get variant combinations preview
function getVariantPreview() {
    if (!detail.value.mauSacs?.length || !detail.value.kichCos?.length) return [];
    
    const variants = [];
    for (const mauSac of detail.value.mauSacs) {
        for (const kichCo of detail.value.kichCos) {
            variants.push({
                maChiTiet: `${detail.value.maChiTiet}-${mauSac.tenMauSac}-${kichCo.tenKichCo}`,
                mauSac: mauSac.tenMauSac,
                kichCo: kichCo.tenKichCo
            });
        }
    }
    return variants;
}

</script>

<template>
    <div>
        <Toast />
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <div class="flex gap-2">
                        <Button label="Thêm mới" icon="pi pi-plus" severity="secondary" @click="openNew" :loading="loading" />
                        <Button label="Xóa đã chọn" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedProducts || !selectedProducts.length" :loading="loading" />
                    </div>
                </template>
                <template #end>
                    <div class="flex gap-2">
                        <Button label="Xuất CSV" icon="pi pi-download" severity="secondary" @click="exportCSV" />
                        <Button icon="pi pi-refresh" v-tooltip.left="'Làm mới dữ liệu'" @click="refreshData" :loading="loading" />
                    </div>
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:expandedRows="expandedRows"
                v-model:selection="selectedProducts"
                :value="productsWithTotalQuantity"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                :loading="loading"
                @row-expand="onRowExpand"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} sản phẩm"
                tableStyle="min-width: 60rem"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <div class="flex gap-2">
                            <h4 class="m-0">Quản lý Sản phẩm</h4>
                            <Button text icon="pi pi-plus" label="Mở rộng tất cả" @click="expandAll" size="small" />
                            <Button text icon="pi pi-minus" label="Thu gọn tất cả" @click="collapseAll" size="small" />
                        </div>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Tìm kiếm sản phẩm..." />
                        </IconField>
                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column expander style="width: 3rem"></Column>
                <Column field="maSanPham" header="Mã SP" sortable style="min-width: 10rem"></Column>
                <Column field="tenSanPham" header="Tên sản phẩm" sortable style="min-width: 16rem"></Column>
                <Column header="Tổng số lượng" sortable style="min-width: 8rem">
                    <template #body="slotProps">
                        <div class="flex items-center gap-2">
                            <Badge :value="slotProps.data.displayQuantity" :severity="getStockSeverity(slotProps.data)" />
                            
                        </div>
                    </template>
                </Column>
                <Column header="Danh mục" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        {{ slotProps.data.category }}
                    </template>
                </Column>
                <Column header="Thương hiệu" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        {{ slotProps.data.brand }}
                    </template>
                </Column>
                <Column header="Chất liệu" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        {{ slotProps.data.material }}
                    </template>
                </Column>
                <Column header="Đế giày" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        {{ slotProps.data.sole }}
                    </template>
                </Column>
                <Column header="Trạng thái" sortable field="trangThai" style="min-width: 10rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.trangThai === 1 ? 'HOẠT ĐỘNG' : 'NGỪNG'" :severity="getStatusLabel(slotProps.data.trangThai)" />
                    </template>
                </Column>
                <Column header="Ngày tạo" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        {{ slotProps.data.createdAt }}
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 8rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editProduct(slotProps.data)" v-tooltip.top="'Chỉnh sửa'" :disabled="loading" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteProduct(slotProps.data)" v-tooltip.top="'Xóa'" :disabled="loading" />
                    </template>
                </Column>

                <!-- Expanded row for product details -->
                <template #expansion="slotProps">
                    <div v-if="loadingDetails[slotProps.data.id]" class="p-4 text-center"><i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i> Đang tải...</div>
                    <div v-else-if="productDetails[slotProps.data.id] && productDetails[slotProps.data.id].length" class="p-4">
                        <div class="flex justify-between items-center mb-4">
                            <div>
                                <h5>Chi tiết sản phẩm: {{ slotProps.data.tenSanPham }}</h5>
                            </div>
                            <Button label="Thêm chi tiết" icon="pi pi-plus" severity="secondary" @click="openNewDetail(slotProps.data.id)" :loading="loading" />
                        </div>
                        <DataTable :value="productDetails[slotProps.data.id]" tableStyle="min-width: 50rem">
                            <Column field="maChiTiet" header="Mã chi tiết" sortable style="min-width: 10rem"></Column>
                            <Column field="size" header="Kích cỡ" sortable style="min-width: 8rem"></Column>
                            <Column field="color" header="Màu sắc" sortable style="min-width: 8rem"></Column>
                            <Column field="soLuong" header="Số lượng" sortable style="min-width: 8rem">
                                <template #body="detailProps">
                                    <Badge :value="detailProps.data.soLuong" :severity="detailProps.data.soLuong > 10 ? 'success' : detailProps.data.soLuong > 0 ? 'warn' : 'danger'" />
                                </template>
                            </Column>
                            <Column field="giaGoc" header="Giá gốc" sortable style="min-width: 10rem">
                                <template #body="detailProps">
                                    {{ formatCurrency(detailProps.data.giaGoc) }}
                                </template>
                            </Column>
                             <Column field="giaBan" header="Giá bán" sortable style="min-width: 10rem">
                                <template #body="detailProps">
                                    {{ formatCurrency(detailProps.data.giaBan) }}
                                </template>
                            </Column>
                            <Column header="Hình ảnh" style="min-width: 15rem">
                                <template #body="detailProps">
                                    <div v-if="detailProps.data.images && detailProps.data.images.length > 0" class="flex gap-2 flex-wrap">
                                        <div 
                                            v-for="img in detailProps.data.images.slice(0, 3)" 
                                            :key="img.id" 
                                            class="relative"
                                        >
                                            <img 
                                                :src="img.url" 
                                                :alt="img.tenHinhAnh"
                                                class="w-16 h-16 object-cover rounded border cursor-pointer hover:scale-105 transition-transform shadow-sm"
                                                @click="openImageDetail(img)"
                                                @error="handleImageError($event)"
                                            />
                                            <Badge 
                                                v-if="img.trangThai === 0" 
                                                value="Đang tải" 
                                                severity="warning" 
                                                class="absolute -top-2 -right-2 text-xs"
                                            />
                                        </div>
                                        <div 
                                            v-if="detailProps.data.images.length > 3"
                                            class="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                            @click="openAllImages(detailProps.data)"
                                        >
                                            <span class="text-sm font-medium text-gray-600">
                                                +{{ detailProps.data.images.length - 3 }}
                                            </span>
                                        </div>
                                    </div>
                                    <div v-else class="text-gray-400 italic flex items-center gap-2">
                                        <i class="pi pi-image"></i>
                                        <span>Chưa có hình ảnh</span>
                                        <Button 
                                            icon="pi pi-plus" 
                                            size="small" 
                                            text 
                                            rounded 
                                            @click="addImageToDetail(detailProps.data)"
                                            v-tooltip.top="'Thêm hình ảnh'"
                                        />
                                    </div>
                                </template>
                            </Column>
                            <Column header="Trạng thái" sortable field="trangThai" style="min-width: 10rem">
                                <template #body="detailProps">
                                    <Tag :value="detailProps.data.trangThai === 1 ? 'HOẠT ĐỘNG' : 'NGỪNG'" :severity="getStatusLabel(detailProps.data.trangThai)" />
                                </template>
                            </Column>
                            <Column header="Ngày tạo" sortable style="min-width: 10rem">
                                <template #body="detailProps">
                                    {{ detailProps.data.createdAt }}
                                </template>
                            </Column>
                            <Column :exportable="false" style="min-width: 8rem">
                                <template #body="detailProps">
                                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editDetail(detailProps.data, slotProps.data.id)" v-tooltip.top="'Chỉnh sửa chi tiết'" :disabled="loading" />
                                    <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteDetail(detailProps.data)" v-tooltip.top="'Xóa chi tiết'" :disabled="loading" />
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                    <div v-else class="p-4 text-center">
                        Không có chi tiết sản phẩm nào.
                        <Button label="Thêm chi tiết" icon="pi pi-plus" severity="secondary" @click="openNewDetail(slotProps.data.id)" :loading="loading" />
                    </div>
                </template>
            </DataTable>
        </div>

        <!-- Dialog thêm/sửa sản phẩm -->
        <Dialog v-model:visible="productDialog" :style="{ width: '600px' }" header="Chi tiết Sản phẩm" :modal="true" class="p-fluid">
            <div class="flex flex-col gap-6">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-8">
                        <label for="tenSanPham" class="block font-bold mb-3">Tên sản phẩm </label>
                        <InputText id="tenSanPham" v-model.trim="product.tenSanPham" required="true" autofocus :invalid="submitted && !product.tenSanPham" fluid placeholder="Nhập tên sản phẩm" />
                        <small v-if="submitted && !product.tenSanPham" class="text-red-500">Tên sản phẩm là bắt buộc.</small>
                    </div>
                    <div class="col-span-4">
                        <label for="maSanPham" class="block font-bold mb-3">Mã sản phẩm</label>
                        <InputText id="maSanPham" v-model="product.maSanPham" fluid placeholder="Tự động tạo" :disabled="!!product.id" />
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-4">
                        <label for="trangThai" class="block font-bold mb-3">Trạng thái</label>
                        <Select id="trangThai" v-model="product.trangThai" :options="statuses" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" fluid />
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="danhMuc" class="block font-bold mb-3">Danh mục </label>
                        <Select id="danhMuc" v-model="product.danhMuc" :options="danhMucs" optionLabel="tenDanhMuc" placeholder="Chọn danh mục" fluid />
                        <small v-if="submitted && !product.danhMuc" class="text-red-500">Danh mục là bắt buộc.</small>
                    </div>
                    <div class="col-span-6">
                        <label for="thuongHieu" class="block font-bold mb-3">Thương hiệu </label>
                        <Select id="thuongHieu" v-model="product.thuongHieu" :options="thuongHieus" optionLabel="tenThuongHieu" placeholder="Chọn thương hiệu" fluid />
                        <small v-if="submitted && !product.thuongHieu" class="text-red-500">Thương hiệu là bắt buộc.</small>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="chatLieu" class="block font-bold mb-3">Chất liệu </label>
                        <Select id="chatLieu" v-model="product.chatLieu" :options="chatLieus" optionLabel="tenChatLieu" placeholder="Chọn chất liệu" fluid />
                        <small v-if="submitted && !product.chatLieu" class="text-red-500">Chất liệu là bắt buộc.</small>
                    </div>
                    <div class="col-span-6">
                        <label for="deGiay" class="block font-bold mb-3">Đế giày </label>
                        <Select id="deGiay" v-model="product.deGiay" :options="deGiays" optionLabel="tenDeGiay" placeholder="Chọn đế giày" fluid />
                        <small v-if="submitted && !product.deGiay" class="text-red-500">Đế giày là bắt buộc.</small>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Hủy bỏ" icon="pi pi-times" text @click="hideDialog" :disabled="loading" />
                <Button label="Lưu lại" icon="pi pi-check" @click="saveProduct" />
            </template>
        </Dialog>

        <!-- Dialog thêm/sửa chi tiết sản phẩm với Multi-Select -->
        <Dialog v-model:visible="detailDialog" :style="{ width: '800px' }" header="Chi tiết sản phẩm" :modal="true" class="p-fluid">
            <div class="flex flex-col gap-6">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-8">
                        <label for="maChiTiet" class="block font-bold mb-3">
                            Mã chi tiết 
                        </label>
                        <InputText id="maChiTiet" v-model.trim="detail.maChiTiet" required="true" autofocus :invalid="submitted && !detail.maChiTiet" fluid placeholder="Nhập mã chi tiết cơ bản" />
                        <small v-if="submitted && !detail.maChiTiet" class="text-red-500">Mã chi tiết là bắt buộc.</small>
                    </div>
                    <div class="col-span-4">
                        <label for="soLuong" class="block font-bold mb-3">Số lượng </label>
                        <InputText id="soLuong" v-model.number="detail.soLuong" integeronly fluid placeholder="0" :min="0" />
                        <small v-if="submitted && (detail.soLuong == null || detail.soLuong <= 0)" class="text-red-500">Số lượng phải lớn hơn 0.</small>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="giaGoc" class="block font-bold mb-3">Giá nhập </label>
                        <InputText id="giaGoc" v-model.number="detail.giaGoc" mode="currency" currency="VND" locale="vi-VN" fluid placeholder="0 ₫" :min="0" :invalid="submitted && (detail.giaGoc == null || detail.giaGoc <= 0)" />
                        <small v-if="submitted && (detail.giaGoc == null || detail.giaGoc <= 0)" class="text-red-500">Giá nhập phải lớn hơn 0.</small>
                    </div>
                    <div class="col-span-6">
                        <label for="giaBan" class="block font-bold mb-3">Giá bán </label>
                        <InputText id="giaBan" v-model.number="detail.giaBan" mode="currency" currency="VND" locale="vi-VN" fluid placeholder="0 ₫" :min="0" :invalid="submitted && (detail.giaBan == null || detail.giaBan <= 0)" />
                        <small v-if="submitted && (detail.giaBan == null || detail.giaBan <= 0)" class="text-red-500">Giá bán phải lớn hơn 0.</small>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="mauSacs" class="block font-bold mb-3">
                            Màu sắc 
                        </label>
                        <MultiSelect 
                            id="mauSacs" 
                            v-model="detail.mauSacs" 
                            :options="mauSacs" 
                            optionLabel="tenMauSac" 
                            placeholder="Chọn màu sắc" 
                            fluid 
                            :maxSelectedLabels="3"
                            selectedItemsLabel="{0} màu đã chọn"
                        />
                        <small v-if="submitted && (!detail.mauSacs || detail.mauSacs.length === 0)" class="text-red-500">Phải chọn ít nhất một màu sắc.</small>
                    </div>
                    <div class="col-span-6">
                        <label for="kichCos" class="block font-bold mb-3">
                            Kích cỡ 
                        </label>
                        <MultiSelect 
                            id="kichCos" 
                            v-model="detail.kichCos" 
                            :options="kichCos" 
                            optionLabel="tenKichCo" 
                            placeholder="Chọn kích cỡ" 
                            fluid 
                            :maxSelectedLabels="3"
                            selectedItemsLabel="{0} size đã chọn"
                        />
                        <small v-if="submitted && (!detail.kichCos || detail.kichCos.length === 0)" class="text-red-500">Phải chọn ít nhất một kích cỡ.</small>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="trangThai" class="block font-bold mb-3">Trạng thái</label>
                        <Select id="trangThai" v-model="detail.trangThai" :options="statuses" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" fluid />
                    </div>
                </div>

                <!-- Preview biến thể sẽ được tạo -->
                <div v-if="!detail.id && detail.mauSacs?.length && detail.kichCos?.length && detail.maChiTiet" class="mt-4">
                    <label class="block font-bold mb-3">
                        Xem trước các biến thể sẽ được tạo: 
                        <Badge :value="getVariantPreview().length" severity="info" />
                    </label>
                    <div class="border border-gray-200 rounded p-3 max-h-40 overflow-y-auto">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            <div v-for="variant in getVariantPreview()" :key="variant.maChiTiet" class="text-sm p-2 bg-gray-50 rounded">
                                <div class="font-medium">{{ variant.maChiTiet }}</div>
                                <div class="text-gray-600">{{ variant.mauSac }} - {{ variant.kichCo }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Thông báo khi edit -->
                <!-- <div v-if="detail.id" class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <i class="pi pi-info-circle text-yellow-600 mr-2"></i>
                    <span class="text-yellow-800">Chế độ chỉnh sửa: Chỉ có thể chọn một màu và một kích cỡ khi cập nhật biến thể hiện có.</span>
                </div> -->
            </div>

            <template #footer>
                <Button label="Hủy bỏ" icon="pi pi-times" text @click="hideDetailDialog" :disabled="loading" />
                <Button 
                    :label="detail.id ? 'Cập nhật' : `Thêm`" 
                    icon="pi pi-check" 
                    @click="saveDetail" 
                    :loading="loading"
                />
            </template>
        </Dialog>

        <!-- Dialog xác nhận xóa sản phẩm -->
        <Dialog v-model:visible="deleteProductDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
                <div>
                    <p v-if="product" class="mb-2">
                        Bạn có chắc chắn muốn xóa sản phẩm <strong>{{ product.tenSanPham || product.name }}</strong>?
                    </p>
                    <small class="text-gray-500">Hành động này không thể hoàn tác.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Hủy bỏ" icon="pi pi-times" text @click="deleteProductDialog = false" :disabled="loading" />
                <Button label="Xóa" icon="pi pi-trash" severity="danger" @click="deleteProduct" :loading="loading" />
            </template>
        </Dialog>

        <!-- Dialog xác nhận xóa nhiều sản phẩm -->
        <Dialog v-model:visible="deleteProductsDialog" :style="{ width: '450px' }" header="Xác nhận xóa nhiều" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
                <div>
                    <p>
                        Bạn có chắc chắn muốn xóa <strong>{{ selectedProducts?.length || 0 }}</strong> sản phẩm đã chọn?
                    </p>
                    <small class="text-gray-500">Hành động này không thể hoàn tác.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Hủy bỏ" icon="pi pi-times" text @click="deleteProductsDialog = false" :disabled="loading" />
                <Button label="Xóa tất cả" icon="pi pi-trash" severity="danger" @click="deleteSelectedProducts" :loading="loading" />
            </template>
        </Dialog>

        <!-- Dialog xác nhận xóa chi tiết sản phẩm -->
        <Dialog v-model:visible="deleteDetailDialog" :style="{ width: '450px' }" header="Xác nhận xóa chi tiết" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
                <div>
                    <p v-if="detail" class="mb-2">
                        Bạn có chắc chắn muốn xóa chi tiết sản phẩm <strong>{{ detail.maChiTiet }}</strong>?
                    </p>
                    <small class="text-gray-500">Hành động này không thể hoàn tác.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Hủy bỏ" icon="pi pi-times" text @click="deleteDetailDialog = false" :disabled="loading" />
                <Button label="Xóa" icon="pi pi-trash" severity="danger" @click="deleteDetail" :loading="loading" />
            </template>
        </Dialog>

        <!-- Dialog xem hình ảnh chi tiết -->
        <Dialog v-model:visible="imagePreviewDialog" :style="{ width: '900px' }" header="Hình ảnh sản phẩm" :modal="true">
            <div v-if="selectedImageDetail.showAll" class="grid grid-cols-4 gap-4">
                <div v-for="img in selectedImageDetail.images" :key="img.id" class="text-center">
                    <img 
                        :src="img.url" 
                        :alt="img.tenHinhAnh"
                        class="w-full h-32 object-cover rounded border shadow-sm"
                        @error="handleImageError($event)"
                    />
                    <div class="mt-2 text-sm">
                        <div class="font-medium">{{ img.maHinhAnh }}</div>
                        <Badge 
                            :value="img.trangThai === 1 ? 'Đã tải' : 'Đang tải'" 
                            :severity="img.trangThai === 1 ? 'success' : 'warning'" 
                        />
                    </div>
                </div>
            </div>
            <div v-else class="text-center">
                <img 
                    :src="selectedImageDetail.url" 
                    :alt="selectedImageDetail.tenHinhAnh"
                    class="max-w-full max-h-96 object-contain rounded shadow"
                    @error="handleImageError($event)"
                />
                <div class="mt-4 text-sm">
                    <div class="font-medium">{{ selectedImageDetail.maHinhAnh }}</div>
                    <div>{{ selectedImageDetail.tenHinhAnh }}</div>
                </div>
            </div>
            
            <template #footer>
                <Button label="Đóng" icon="pi pi-times" @click="imagePreviewDialog = false" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.card {
    background: var(--surface-card);
    padding: 2rem;
    border-radius: 10px;
    margin-bottom: 1rem;
}
</style>