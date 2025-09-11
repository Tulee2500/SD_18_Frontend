<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref , watch } from 'vue';
import { useConfirm } from 'primevue/useconfirm';


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
// Thêm vào phần khai báo ref
const confirm = useConfirm();

// QR Code dialogs
const qrDialog = ref(false);
const qrDetailDialog = ref(false);
const currentQRData = ref('');
const currentQRTitle = ref('');

// Dữ liệu cho dropdown
const danhMucs = ref([]);
const thuongHieus = ref([]);
const chatLieus = ref([]);
const deGiays = ref([]);
const kichCos = ref([]);
const mauSacs = ref([]);
const hinhAnhs = ref([]); // Thêm danh sách hình ảnh

// Dialog chọn hình ảnh
const imageSelectionDialog = ref(false);
const selectedImages = ref([]);
const imageFilters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const statuses = ref([
    { label: 'ĐANG HOẠT ĐỘNG', value: 1 },
    { label: 'KHÔNG HOẠT ĐỘNG', value: 0 }
]);


// THÊM: Bộ lọc chi tiết cho chi tiết sản phẩm  
const detailFilters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'maChiTiet': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'color': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'size': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'trangThai': { value: null, matchMode: FilterMatchMode.EQUALS }
});

// THÊM: Computed cho options của bộ lọc
const categoryOptions = computed(() => {
    const categories = [...new Set(products.value.map(p => p.category).filter(c => c))];
    return categories.map(cat => ({ label: cat, value: cat }));
});

const brandOptions = computed(() => {
    const brands = [...new Set(products.value.map(p => p.brand).filter(b => b))];
    return brands.map(brand => ({ label: brand, value: brand }));
});

const materialOptions = computed(() => {
    const materials = [...new Set(products.value.map(p => p.material).filter(m => m))];
    return materials.map(material => ({ label: material, value: material }));
});

const soleOptions = computed(() => {
    const soles = [...new Set(products.value.map(p => p.sole).filter(s => s))];
    return soles.map(sole => ({ label: sole, value: sole }));
});



// Quick Add Dialogs
const quickAddDialog = ref(false);
const quickAddType = ref('');
const quickAddItem = ref({});
const quickAddSubmitted = ref(false);
const quickAddLoading = ref(false);

// Quick Add Types
const quickAddTypes = {
    'mauSac': {
        title: 'Thêm màu sắc',
        fields: [
            { key: 'tenMauSac', label: 'Tên màu sắc', type: 'text', required: true, placeholder: 'Ví dụ: Đỏ cherry' },
            // { key: 'maMau', label: 'Mã màu (Hex)', type: 'color', required: true, placeholder: '#FF0000' }
        ],
        apiUrl: '/mau-sac',
        codePrefix: 'MS',
        refreshFunction: loadMauSacs
    },
    'kichCo': {
        title: 'Thêm kích cỡ',
        fields: [
            { key: 'tenKichCo', label: 'Tên kích cỡ', type: 'text', required: true, placeholder: 'Ví dụ: 42, XL, M' }
        ],
        apiUrl: '/kich-co',
        codePrefix: 'KC',
        refreshFunction: loadKichCos
    },
    'danhMuc': {
        title: 'Thêm danh mục',
        fields: [
            { key: 'tenDanhMuc', label: 'Tên danh mục', type: 'text', required: true, placeholder: 'Ví dụ: Giày thể thao' },
            // { key: 'moTa', label: 'Mô tả', type: 'textarea', required: false, placeholder: 'Mô tả về danh mục...' }
        ],
        apiUrl: '/danh-muc',
        codePrefix: 'DM',
        refreshFunction: loadDanhMucs
    },
    'thuongHieu': {
        title: 'Thêm thương hiệu',
        fields: [
            { key: 'tenThuongHieu', label: 'Tên thương hiệu', type: 'text', required: true, placeholder: 'Ví dụ: Nike, Adidas' },
            // { key: 'moTa', label: 'Mô tả', type: 'textarea', required: false, placeholder: 'Mô tả về thương hiệu...' }
        ],
        apiUrl: '/thuong-hieu',
        codePrefix: 'TH',
        refreshFunction: loadThuongHieus
    },
    'chatLieu': {
        title: 'Thêm chất liệu',
        fields: [
            { key: 'tenChatLieu', label: 'Tên chất liệu', type: 'text', required: true, placeholder: 'Ví dụ: Da thật, Canvas' },
            // { key: 'moTa', label: 'Mô tả', type: 'textarea', required: false, placeholder: 'Mô tả về chất liệu...' }
        ],
        apiUrl: '/chat-lieu',
        codePrefix: 'CL',
        refreshFunction: loadChatLieus
    },
    'deGiay': {
        title: 'Thêm đế giày',
        fields: [
            { key: 'tenDeGiay', label: 'Tên đế giày', type: 'text', required: true, placeholder: 'Ví dụ: Đế cao su, Đế EVA' },
            // { key: 'moTa', label: 'Mô tả', type: 'textarea', required: false, placeholder: 'Mô tả về đế giày...' }
        ],
        apiUrl: '/de-giay',
        codePrefix: 'DG',
        refreshFunction: loadDeGiays
    }
};

// Quick Add Functions
function openQuickAdd(type) {
    quickAddType.value = type;
    const config = quickAddTypes[type];
    
    // Initialize form
    quickAddItem.value = {
        trangThai: 1 // Default active status
    };
    
    // Add auto-generated code
    if (config.codePrefix) {
        quickAddItem.value[`ma${type.charAt(0).toUpperCase() + type.slice(1)}`] = createQuickAddId(config.codePrefix);
    }
    
    quickAddSubmitted.value = false;
    quickAddDialog.value = true;
}

function createQuickAddId(prefix) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix + id;
}
// Hàm kiểm tra trùng lặp theo tên (case-insensitive)
function checkDuplicateByName(type, name) {
    if (!name || !name.trim()) return false;
    
    const normalizedName = name.trim().toLowerCase();
    let dataArray = [];
    
    switch (type) {
        case 'mauSac':
            dataArray = mauSacs.value;
            return dataArray.some(item => item.tenMauSac?.toLowerCase() === normalizedName);
        case 'kichCo':
            dataArray = kichCos.value;
            return dataArray.some(item => item.tenKichCo?.toLowerCase() === normalizedName);
        case 'danhMuc':
            dataArray = danhMucs.value;
            return dataArray.some(item => item.tenDanhMuc?.toLowerCase() === normalizedName);
        case 'thuongHieu':
            dataArray = thuongHieus.value;
            return dataArray.some(item => item.tenThuongHieu?.toLowerCase() === normalizedName);
        case 'chatLieu':
            dataArray = chatLieus.value;
            return dataArray.some(item => item.tenChatLieu?.toLowerCase() === normalizedName);
        case 'deGiay':
            dataArray = deGiays.value;
            return dataArray.some(item => item.tenDeGiay?.toLowerCase() === normalizedName);
        default:
            return false;
    }
}

// Hàm kiểm tra trùng lặp theo mã màu (cho màu sắc)
function checkDuplicateByColorCode(colorCode) {
    if (!colorCode || !colorCode.trim()) return false;
    
    const normalizedCode = colorCode.trim().toLowerCase();
    return mauSacs.value.some(item => item.maMau?.toLowerCase() === normalizedCode);
}

// Hàm lấy tên field theo type
function getFieldNameByType(type) {
    const fieldNames = {
        'mauSac': 'tenMauSac',
        'kichCo': 'tenKichCo', 
        'danhMuc': 'tenDanhMuc',
        'thuongHieu': 'tenThuongHieu',
        'chatLieu': 'tenChatLieu',
        'deGiay': 'tenDeGiay'
    };
    return fieldNames[type];
}

async function saveQuickAdd() {
    quickAddSubmitted.value = true;
    const config = quickAddTypes[quickAddType.value];
    
    // Kiểm tra tất cả trường bắt buộc
    const requiredFields = [];
    
    for (const field of config.fields) {
        if (field.required && (!quickAddItem.value[field.key] || !quickAddItem.value[field.key].toString().trim())) {
            requiredFields.push(field.label);
        }
    }
    
    // Nếu có trường nào chưa điền thì hiển thị thông báo chung
    if (requiredFields.length > 0) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Vui lòng điền đầy đủ thông tin', 
            detail: `Các trường bắt buộc: ${requiredFields.join(', ')}`, 
            life: 4000 
        });
        return;
    }
    
    // Validate format mã màu trước khi kiểm tra trùng lặp
    if (quickAddType.value === 'mauSac' && quickAddItem.value.maMau) {
        if (!quickAddItem.value.maMau.match(/^#[0-9A-Fa-f]{6}$/)) {
            toast.add({ 
                severity: 'warn', 
                summary: 'Định dạng không hợp lệ', 
                detail: 'Mã màu phải có định dạng hex hợp lệ (Ví dụ: #FF0000)', 
                life: 3000 
            });
            return;
        }
    }
    
    // ===== KIỂM TRA TRÙNG LẶP KHI SUBMIT =====
    
    // 1. Kiểm tra trùng tên
    const fieldName = getFieldNameByType(quickAddType.value);
    const itemName = quickAddItem.value[fieldName];
    
    if (checkDuplicateByName(quickAddType.value, itemName)) {
        toast.add({ 
            severity: 'info', 
            summary: 'Dữ liệu đã tồn tại', 
            detail: `${config.title.replace('Thêm ', '')} "${itemName}" đã tồn tại`, 
            life: 4000 
        });
        return; // Dừng lại, không thêm vào database
    }
   
    // ===== TIẾP TỤC XỬ LÝ NẾU KHÔNG TRÙNG LẶP =====
    
    try {
        quickAddLoading.value = true;
        
        const response = await axios.post(`${API_BASE_URL}${config.apiUrl}`, quickAddItem.value);
        
        toast.add({ 
            severity: 'success', 
            summary: 'Thành công', 
            detail: `Đã thêm ${config.title.toLowerCase().replace('thêm ', '')}: "${itemName}"`, 
            life: 3000 
        });
        
        // Refresh the related data
        await config.refreshFunction();
        
        // Auto-select the newly created item if we're in a form
        if (quickAddType.value === 'mauSac' && detailDialog.value) {
            const newItem = response.data;
            if (detail.value.isEditing) {
                selectedMauSac.value = newItem;
            } else {
                if (!detail.value.mauSacs) detail.value.mauSacs = [];
                detail.value.mauSacs.push(newItem);
            }
        } else if (quickAddType.value === 'kichCo' && detailDialog.value) {
            const newItem = response.data;
            if (detail.value.isEditing) {
                selectedKichCo.value = newItem;
            } else {
                if (!detail.value.kichCos) detail.value.kichCos = [];
                detail.value.kichCos.push(newItem);
            }
        } else if (productDialog.value) {
            const newItem = response.data;
            if (quickAddType.value === 'danhMuc') {
                product.value.danhMuc = newItem;
            } else if (quickAddType.value === 'thuongHieu') {
                product.value.thuongHieu = newItem;
            } else if (quickAddType.value === 'chatLieu') {
                product.value.chatLieu = newItem;
            } else if (quickAddType.value === 'deGiay') {
                product.value.deGiay = newItem;
            }
        }
        
        quickAddDialog.value = false;
        quickAddItem.value = {};
        
    } catch (error) {
        console.error('Error adding quick item:', error);
        
        // Kiểm tra lỗi từ server (có thể server cũng có validation)
        let errorMessage = 'Không thể thêm mới';
        if (error.response?.data?.message) {
            const serverMessage = error.response.data.message.toLowerCase();
            if (serverMessage.includes('duplicate') || serverMessage.includes('trùng') || serverMessage.includes('exist')) {
                errorMessage = `Dữ liệu đã tồn tại trong hệ thống`;
            } else {
                errorMessage = error.response.data.message;
            }
        }
        
        toast.add({ 
            severity: 'info', 
            summary: 'Dữ liệu đã tồn tại', 
            detail: errorMessage, 
            life: 4000 
        });
    } finally {
        quickAddLoading.value = false;
    }
}

function hideQuickAddDialog() {
    quickAddDialog.value = false;
    quickAddSubmitted.value = false;
    quickAddItem.value = {};
}

// Thêm vào phần ref declarations
const imagePreviewDialog = ref(false);
const selectedImageDetail = ref({});

// SỬA: Thay thế computed bằng ref đơn giản cho edit mode
const selectedMauSac = ref(null);
const selectedKichCo = ref(null);
const selectedImage = ref(null); 

// ===== THÊM CÁC HÀM KIỂM TRA TRÙNG LẶP =====

// Hàm kiểm tra trùng lặp chi tiết sản phẩm
function checkDuplicateDetail(productId, mauSacId, kichCoId, excludeDetailId = null) {
    const existingDetails = productDetails.value[productId] || [];
    
    return existingDetails.some(detail => {
        // Bỏ qua chính detail đang được sửa
        if (excludeDetailId && detail.id === excludeDetailId) {
            return false;
        }
        
        // Kiểm tra trùng màu sắc và kích cỡ
        const sameColor = detail.mauSac?.id === mauSacId;
        const sameSize = detail.kichCo?.id === kichCoId;
        
        return sameColor && sameSize;
    });
}

// Hàm kiểm tra trùng lặp batch khi thêm nhiều biến thể
function checkBatchDuplicates(productId, variants, excludeDetailId = null) {
    const duplicates = [];
    const existingDetails = productDetails.value[productId] || [];
    
    // Kiểm tra trùng với dữ liệu hiện có
    variants.forEach((variant, index) => {
        const isDuplicate = existingDetails.some(detail => {
            if (excludeDetailId && detail.id === excludeDetailId) {
                return false;
            }
            
            const sameColor = detail.mauSac?.id === variant.mauSac.id;
            const sameSize = detail.kichCo?.id === variant.kichCo.id;
            
            return sameColor && sameSize;
        });
        
        if (isDuplicate) {
            duplicates.push({
                index: index,
                mauSac: variant.mauSac.tenMauSac,
                kichCo: variant.kichCo.tenKichCo
            });
        }
    });
    
    // Kiểm tra trùng trong chính batch variants
    const variantMap = new Map();
    variants.forEach((variant, index) => {
        const key = `${variant.mauSac.id}-${variant.kichCo.id}`;
        
        if (variantMap.has(key)) {
            // Tìm duplicate trong cùng batch
            const existingIndex = variantMap.get(key);
            if (!duplicates.find(d => d.index === index)) {
                duplicates.push({
                    index: index,
                    mauSac: variant.mauSac.tenMauSac,
                    kichCo: variant.kichCo.tenKichCo,
                    duplicateWith: existingIndex
                });
            }
        } else {
            variantMap.set(key, index);
        }
    });
    
    return duplicates;
}

// Hàm hiển thị thông báo lỗi trùng lặp
function showDuplicateError(duplicates, isEdit = false) {
    if (duplicates.length === 0) return;
    
    if (isEdit) {
        // Trường hợp sửa - chỉ có 1 duplicate
        toast.add({ 
            severity: 'warn', 
            summary: 'Cảnh báo ', 
            detail: `Đã tồn tại chi tiết sản phẩm với màu sắc "${duplicates[0].mauSac}" và kích cỡ "${duplicates[0].kichCo}"`, 
            life: 5000 
        });
    } else {
        // Trường hợp thêm mới - có thể có nhiều duplicates
        if (duplicates.length === 1) {
            toast.add({ 
                severity: 'warn', 
                summary: 'Cảnh báo', 
                detail: `Chi tiết với màu sắc "${duplicates[0].mauSac}" và kích cỡ "${duplicates[0].kichCo}" đã tồn tại`, 
                life: 5000 
            });
        } else {
            const duplicateList = duplicates.map(d => `${d.mauSac} - ${d.kichCo}`).join(', ');
            toast.add({ 
                severity: 'warn', 
                summary: 'Trùng lặp nhiều chi tiết', 
                detail: `Các chi tiết sau đã tồn tại: ${duplicateList}`, 
                life: 7000 
            });
        }
    }
}

// QR Code functions
function generateQRCode(data) {
    // Sử dụng API QR Code online hoặc thư viện QR
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
}

function showDetailQR(detailData, productName) {
    const qrData = JSON.stringify({
        maQR : detailData.maQR,
    });
    
    currentQRData.value = generateQRCode(qrData);
    currentQRTitle.value = `QR Code - Chi tiết: ${detailData.maChiTiet}`;
    qrDetailDialog.value = true;
}


// Hàm tải xuống QR code đã được sửa
async function downloadQR(filename) {
    try {
        // Fetch hình ảnh từ URL
        const response = await fetch(currentQRData.value);
        const blob = await response.blob();
        
        // Tạo URL blob local
        const url = window.URL.createObjectURL(blob);
        
        // Tạo link download
        const link = document.createElement('a');
        link.href = url;
        
        // Tạo tên file với timestamp để tránh trùng
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const finalFilename = `${filename}_${timestamp}_QR.png`;
        
        link.download = finalFilename;
        
        // Force download thay vì mở trong tab mới
        link.setAttribute('download', finalFilename);
        link.style.display = 'none';
        
        // Thêm vào DOM, click, rồi xóa
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup URL object
        window.URL.revokeObjectURL(url);
        
        // Thông báo thành công
        toast.add({
            severity: 'success',
            summary: 'Tải thành công',
            detail: `File QR code đã được lưu: ${finalFilename}`,
            life: 4000
        });
        
    } catch (error) {
        console.error('Lỗi khi tải QR code:', error);
        
        // Fallback: thử phương pháp cũ
        const link = document.createElement('a');
        link.href = currentQRData.value;
        link.download = `${filename}_QR.png`;
        link.target = '_blank';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.add({
            severity: 'warn',
            summary: 'Lưu ý',
            detail: 'Nếu file mở trong tab mới, hãy click chuột phải và chọn "Save image as"',
            life: 5000
        });
    }
}


// Hàm xóa tất cả biến thể trùng lặp
function removeAllDuplicateVariants() {
    console.log('🗑️ Removing all duplicate variants');
    
    const duplicateVariants = getVariantPreview.value.filter(v => v.isDuplicate);
    
    if (duplicateVariants.length === 0) {
        toast.add({
            severity: 'info',
            summary: 'Thông báo',
            detail: 'Không có biến thể trùng lặp nào để xóa',
            life: 2000
        });
        return;
    }
    
    // Tạo danh sách màu sắc và kích cỡ mới (loại bỏ những cái chỉ tạo ra duplicate)
    const newMauSacs = [];
    const newKichCos = [];
    const newVariantImages = {};
    
    // Duyệt qua tất cả combination và chỉ giữ lại những cái không duplicate
    for (const mauSac of detail.value.mauSacs) {
        for (const kichCo of detail.value.kichCos) {
            const isDuplicate = checkDuplicateDetail(
                detail.value.sanPham.id, 
                mauSac.id, 
                kichCo.id
            );
            
            if (!isDuplicate) {
                // Thêm màu sắc nếu chưa có
                if (!newMauSacs.find(m => m.id === mauSac.id)) {
                    newMauSacs.push(mauSac);
                }
                
                // Thêm kích cỡ nếu chưa có
                if (!newKichCos.find(k => k.id === kichCo.id)) {
                    newKichCos.push(kichCo);
                }
                
                // Giữ lại hình ảnh của biến thể hợp lệ
                const variantKey = getVariantKey(mauSac, kichCo);
                if (detail.value.variantImages[variantKey]) {
                    newVariantImages[variantKey] = detail.value.variantImages[variantKey];
                }
            }
        }
    }
    
    // Cập nhật lại selection
    detail.value.mauSacs = newMauSacs;
    detail.value.kichCos = newKichCos;
    detail.value.variantImages = newVariantImages;
    
    toast.add({
        severity: 'success',
        summary: 'Đã xóa',
        detail: `Đã xóa ${duplicateVariants.length} biến thể trùng lặp`,
        life: 3000
    });
}

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

// Computed để lọc hình ảnh có sẵn (trạng thái = 1)
const availableImages = computed(() => {
    return hinhAnhs.value.filter(img => img.trangThai === 1);
});

// Thêm các hàm xử lý
function handleImageError(event) {
    console.log('Image error:', event.target.src);
    
    // Ẩn hình ảnh thay vì show placeholder bị lỗi
    event.target.style.display = 'none';
    
    // Hoặc thay thế bằng icon
    const parent = event.target.parentElement;
    if (parent && !parent.querySelector('.error-icon')) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-icon w-16 h-16 bg-gray-100 rounded border flex items-center justify-center';
        errorDiv.innerHTML = '<i class="pi pi-image text-gray-400"></i>';
        parent.appendChild(errorDiv);
    }
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

// Hàm mở dialog chọn hình ảnh
function openImageSelection() {
    // Nếu đã có hình ảnh được chọn, set làm selected
    selectedImage.value = detail.value.selectedImage || null;
    imageSelectionDialog.value = true;
}

// Hàm xác nhận chọn hình ảnh
function confirmImageSelection() {
    detail.value.selectedImage = selectedImage.value;
    imageSelectionDialog.value = false;
    
    if (selectedImage.value) {
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã chọn hình ảnh: ${selectedImage.value.maHinhAnh}`,
            life: 3000
        });
    } else {
        toast.add({
            severity: 'info',
            summary: 'Thông báo',
            detail: 'Đã bỏ chọn hình ảnh',
            life: 3000
        });
    }
}

// SỬA HÀM removeSelectedImage
function removeSelectedImage() {
    detail.value.selectedImage = null;
}

// Load dữ liệu khi component mount
onMounted(async () => {
    await Promise.all([
        loadProducts(), 
        loadDanhMucs(), 
        loadThuongHieus(), 
        loadChatLieus(), 
        loadDeGiays(), 
        loadKichCos(), 
        loadMauSacs(),
        loadHinhAnhs() // Thêm load hình ảnh
    ]);
});
// SỬA: Theo dõi sự thay đổi của giá gốc và cập nhật giá bán nếu cần
watch(() => detail.value.giaGoc, (newGiaGoc) => {
    console.log('🔄 Giá gốc thay đổi:', newGiaGoc);
    console.log('📊 Giá bán hiện tại:', detail.value.giaBan);
    console.log('🔍 isEditing:', detail.value.isEditing);
    
    // Đơn giản hóa: chỉ sync khi KHÔNG edit và có giá gốc
    if (newGiaGoc && newGiaGoc > 0 && !detail.value.isEditing) {
        detail.value.giaBan = newGiaGoc;
        console.log('✅ Đã cập nhật giá bán:', detail.value.giaBan);
    }
}, { immediate: false, deep: true });

// API calls
async function loadProducts() {
    try {
        loading.value = true;
        const response = await axios.get(`${API_BASE_URL}/api/san-pham`);
        products.value = response.data.map((item, index) => ({
            ...item,
            stt: index + 1, // THÊM: Số thứ tự
            inventoryStatus: item.trangThai === 1 ? 'ACTIVE' : 'INACTIVE',
            name: item.tenSanPham,
            code: item.maSanPham,
            category: item.danhMuc?.tenDanhMuc || 'Chưa phân loại',
            brand: item.thuongHieu?.tenThuongHieu || 'Không có',
            material: item.chatLieu?.tenChatLieu || 'Không có',
            sole: item.deGiay?.tenDeGiay || 'Không có',
            quantity: item.soLuong || 0,
            ngayTao: item.ngayTao,
            createdAt: item.ngayTao ? new Date(item.ngayTao).toLocaleDateString('vi-VN') : 'N/A',
            updatedAt: item.ngayCapNhat ? new Date(item.ngayCapNhat).toLocaleDateString('vi-VN') : 'N/A'
        }));
        
        for (const product of products.value) {
            await loadProductDetails(product.id, false);
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

// Hàm load hình ảnh từ API
async function loadHinhAnhs() {
    try {
        const response = await axios.get(`${API_BASE_URL}/hinh-anh`);
        
        console.log('Raw image data:', response.data); // Debug
        
        hinhAnhs.value = response.data.map(img => {
            const imageUrl = createImageUrl(img.duongDan);
            
            console.log(`Image ${img.id}:`, {
                tenHinhAnh: img.tenHinhAnh,
                duongDan: img.duongDan,
                generatedUrl: imageUrl
            });
            
            return {
                ...img,
                url: imageUrl,
                preview: imageUrl
            };
        });
        
        console.log('Processed images:', hinhAnhs.value);
        
    } catch (error) {
        console.error('Lỗi khi tải hình ảnh:', error);
        toast.add({ 
            severity: 'error', 
            summary: 'Lỗi', 
            detail: 'Không thể tải danh sách hình ảnh', 
            life: 3000 
        });
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
        
        // SỬA: Load hình ảnh bằng cách khác
        for (const detail of productDetails.value[productId]) {
            try {
                // Thay vì dùng API chi-tiet-san-pham, dùng API lấy hình ảnh bằng ID
                const imgResponse = await axios.get(`${API_BASE_URL}/hinh-anh/chi-tiet-san-pham/${detail.id}`);
                
                console.log(`Images for detail ${detail.id}:`, imgResponse.data);
                
                // Nếu API chỉ trả về array ID, cần load từng hình ảnh
                if (imgResponse.data && imgResponse.data.length > 0) {
                    const imagePromises = imgResponse.data.map(async (imgRef) => {
                        try {
                            // Nếu imgRef chỉ có id, load chi tiết hình ảnh
                            if (imgRef.id && !imgRef.duongDan) {
                                const fullImgResponse = await axios.get(`${API_BASE_URL}/hinh-anh/${imgRef.id}`);
                                return fullImgResponse.data;
                            }
                            return imgRef;
                        } catch (error) {
                            console.error(`Error loading image ${imgRef.id}:`, error);
                            return null;
                        }
                    });
                    
                    const fullImages = await Promise.all(imagePromises);
                    
                    detail.images = fullImages.filter(img => img).map((img) => {
                        const imageUrl = createImageUrl(img.duongDan);
                        
                        console.log(`Detail ${detail.id} - Image ${img.id}:`, {
                            tenHinhAnh: img.tenHinhAnh,
                            duongDan: img.duongDan,
                            generatedUrl: imageUrl
                        });
                        
                        return {
                            id: img.id,
                            maHinhAnh: img.maHinhAnh,
                            tenHinhAnh: img.tenHinhAnh,
                            trangThai: img.trangThai,
                            url: imageUrl,
                            duongDan: img.duongDan
                        };
                    });
                } else {
                    detail.images = [];
                }
            } catch (imgError) {
                console.error(`Lỗi khi tải hình ảnh cho chi tiết ${detail.maChiTiet}:`, imgError);
                detail.images = [];
            }
        }
    } catch (error) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', error.response?.status, error.response?.data);
        if (showLoading) {
            toast.add({ 
                severity: 'error', 
                summary: 'Lỗi', 
                detail: `Không thể tải chi tiết sản phẩm: ${error.response?.data?.message || error.message}`, 
                life: 3000 
            });
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

async function updateProductTotalQuantity(productId) {
    await loadProductDetails(productId, false);
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
    confirm.require({
        message: 'Bạn có muốn thêm sản phẩm mới không?',
        header: 'Xác nhận thêm mới',
        icon: 'pi pi-question-circle',
        rejectClass: 'p-button-secondary p-button-outlined',
        rejectLabel: 'Hủy',
        acceptLabel: 'Có',
        accept: () => {
            product.value = {
                tenSanPham: '',
                maSanPham: createProductId(),
                soLuong: 0,
                trangThai: 1,
                danhMuc: null,
                thuongHieu: null,
                chatLieu: null,
                deGiay: null
            };
            submitted.value = false;
            productDialog.value = true;
        }
    });
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
        soLuong: Math.max(0, prod.soLuong || 0),
        trangThai: prod.trangThai,
        danhMuc: prod.danhMuc,
        thuongHieu: prod.thuongHieu,
        chatLieu: prod.chatLieu,
        deGiay: prod.deGiay,
        ngayTao: prod.ngayTao
    };
    
    submitted.value = false;
    productDialog.value = true;
}

async function saveProduct() {
    submitted.value = true;
    
    // Kiểm tra tất cả trường bắt buộc
    const requiredFields = [];
    
    if (!product.value.tenSanPham?.trim()) {
        requiredFields.push('Tên sản phẩm');
    }
    
    if (product.value.soLuong == null || product.value.soLuong === '' || product.value.soLuong < 0) {
        requiredFields.push('Số lượng hợp lệ');
    }
    
    if (!product.value.danhMuc) {
        requiredFields.push('Danh mục');
    }
    
    if (!product.value.thuongHieu) {
        requiredFields.push('Thương hiệu');
    }
    
    if (!product.value.chatLieu) {
        requiredFields.push('Chất liệu');
    }
    
    if (!product.value.deGiay) {
        requiredFields.push('Đế giày');
    }
    
    // Nếu có trường nào chưa điền thì hiển thị thông báo chung
    if (requiredFields.length > 0) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Vui lòng điền đầy đủ thông tin', 
            detail: `Các trường bắt buộc: ${requiredFields.join(', ')}`, 
            life: 4000 
        });
        return;
    }
    
    try {
        loading.value = true;
        const productData = {
            tenSanPham: product.value.tenSanPham,
            maSanPham: product.value.maSanPham,
            soLuong: Math.max(0, product.value.soLuong || 0),
            trangThai: product.value.trangThai,
            danhMuc: product.value.danhMuc,
            thuongHieu: product.value.thuongHieu,
            chatLieu: product.value.chatLieu,
            deGiay: product.value.deGiay,
            ngayTao: product.value.ngayTao || (product.value.id ? products.value.find(p => p.id === product.value.id)?.ngayTao : new Date().toISOString())
        };
        
        if (product.value.id) {
            await axios.put(`${API_BASE_URL}/api/san-pham/update/${product.value.id}`, productData);
            toast.add({ severity: 'success', summary: 'Thành công', detail: `Đã cập nhật sản phẩm "${product.value.tenSanPham}"`, life: 3000 });
        } else {
            await axios.post(`${API_BASE_URL}/api/san-pham/save`, productData);
            toast.add({ severity: 'success', summary: 'Thành công', detail: `Đã thêm sản phẩm "${product.value.tenSanPham}"`, life: 3000 });
        }
        
        await loadProducts();
        productDialog.value = false;
        product.value = {};
        submitted.value = false;
    } catch (error) {
        console.error('Lỗi khi lưu sản phẩm:', error.response?.status, error.response?.data);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: `Không thể lưu sản phẩm: ${error.response?.data?.message || error.message}`, life: 3000 });
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

// Dialog functions for Product Details - Updated for multi-select with images
// 1. HÀM MỞ DIALOG THÊM MỚI - CHO PHÉP NHIỀU MÀU VÀ SIZE
function openNewDetail(productId) {
    confirm.require({
        message: 'Bạn có muốn thêm chi tiết sản phẩm mới không?',
        header: 'Xác nhận thêm chi tiết',
        icon: 'pi pi-question-circle',
        rejectClass: 'p-button-secondary p-button-outlined',
        rejectLabel: 'Hủy',
        acceptLabel: 'Có',
        accept: () => {
            detail.value = {
                maChiTiet: createId(),
                soLuong: 0,
                giaGoc: null,
                giaBan: null,
                trangThai: 1,
                mauSacs: [],
                kichCos: [],
                variantImages: {},
                sanPham: { id: productId },
                isEditing: false
            };
            
            selectedMauSac.value = null;
            selectedKichCo.value = null;
            selectedImage.value = null;
            
            submitted.value = false;
            detailDialog.value = true;
        }
    });
}

// Hàm tạo key cho biến thể
function getVariantKey(mauSac, kichCo) {
    return `${mauSac.id}-${kichCo.id}`;
}

// Hàm mở dialog chọn hình ảnh cho biến thể cụ thể - CẬP NHẬT
function openImageSelectionForVariant(variant) {
    // KIỂM TRA NẾU BIẾN THỂ TRÙNG LẶP THÌ KHÔNG CHO CHỌN HÌNH
    if (variant.isDuplicate) {
        toast.add({
            severity: 'warn',
            summary: 'Không thể chọn hình ảnh',
            detail: `Biến thể ${variant.mauSac.tenMauSac} - ${variant.kichCo.tenKichCo} đã tồn tại. Không thể chọn hình ảnh cho biến thể trùng lặp.`,
            life: 4000
        });
        return; // DỪNG LẠI, KHÔNG MỞ DIALOG
    }
    
    detail.value.currentVariant = variant; // Lưu biến thể đang chọn hình
    const variantKey = getVariantKey(variant.mauSac, variant.kichCo);
    selectedImage.value = detail.value.variantImages[variantKey] || null;
    imageSelectionDialog.value = true;
}

// Hàm xác nhận chọn hình ảnh cho biến thể - CẬP NHẬT
function confirmImageSelectionForVariant() {
    if (detail.value.currentVariant) {
        // KIỂM TRA LẠI LẦN CUỐI TRƯỚC KHI LƯU HÌNH ẢNH
        if (detail.value.currentVariant.isDuplicate) {
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể lưu hình ảnh cho biến thể trùng lặp',
                life: 3000
            });
            imageSelectionDialog.value = false;
            detail.value.currentVariant = null;
            return;
        }
        
        const variantKey = getVariantKey(detail.value.currentVariant.mauSac, detail.value.currentVariant.kichCo);
        
        if (selectedImage.value) {
            detail.value.variantImages[variantKey] = selectedImage.value;
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã chọn hình ảnh cho ${detail.value.currentVariant.mauSac.tenMauSac} - ${detail.value.currentVariant.kichCo.tenKichCo}`,
                life: 3000
            });
        } else {
            // Xóa hình ảnh nếu không chọn
            delete detail.value.variantImages[variantKey];
        }
    }
    
    imageSelectionDialog.value = false;
    detail.value.currentVariant = null;
}

// Hàm xóa hình ảnh của biến thể - CẬP NHẬT
function removeVariantImage(variant) {
    // KIỂM TRA NẾU BIẾN THỂ TRÙNG LẶP THÌ KHÔNG CHO XÓA
    if (variant.isDuplicate) {
        toast.add({
            severity: 'warn',
            summary: 'Không thể thao tác',
            detail: `Biến thể ${variant.mauSac.tenMauSac} - ${variant.kichCo.tenKichCo} đã tồn tại. Không thể xóa hình ảnh.`,
            life: 3000
        });
        return;
    }
    
    const variantKey = getVariantKey(variant.mauSac, variant.kichCo);
    delete detail.value.variantImages[variantKey];
    
    toast.add({
        severity: 'info',
        summary: 'Đã xóa',
        detail: `Đã xóa hình ảnh của biến thể ${variant.mauSac.tenMauSac} - ${variant.kichCo.tenKichCo}`,
        life: 2000
    });
}

// 2. HÀM SỬA CHI TIẾT - CHỈ CHO PHÉP 1 MÀU VÀ 1 SIZE - ĐÃ SỬA
function editDetail(detailData, productId) {
    console.log('🔍 Edit detail data:', detailData);
    console.log('🎨 Available mauSacs:', mauSacs.value);
    console.log('📏 Available kichCos:', kichCos.value);
    
    // Tìm object reference đúng từ danh sách options
    let foundMauSac = null;
    let foundKichCo = null;
    
    if (detailData.mauSac) {
        // Tìm theo ID trước
        foundMauSac = mauSacs.value.find(m => m.id === detailData.mauSac.id);
        
        // Nếu không tìm thấy, tìm theo tên
        if (!foundMauSac) {
            foundMauSac = mauSacs.value.find(m => m.tenMauSac === detailData.mauSac.tenMauSac);
        }
        
        // Debug
        console.log('🎨 Original mauSac:', detailData.mauSac);
        console.log('🎨 Found mauSac:', foundMauSac);
    }
    
    if (detailData.kichCo) {
        // Tìm theo ID trước
        foundKichCo = kichCos.value.find(k => k.id === detailData.kichCo.id);
        
        // Nếu không tìm thấy, tìm theo tên
        if (!foundKichCo) {
            foundKichCo = kichCos.value.find(k => k.tenKichCo === detailData.kichCo.tenKichCo);
        }
        
        // Debug
        console.log('📏 Original kichCo:', detailData.kichCo);
        console.log('📏 Found kichCo:', foundKichCo);
    }
    
    // ĐẢM BẢO TẠO OBJECT MỚI HOÀN TOÀN
    detail.value = {
        id: detailData.id,
        maChiTiet: detailData.maChiTiet,
        soLuong: Math.max(0, detailData.soLuong || 0),
        giaGoc: Math.max(0, detailData.giaGoc || 0),
        giaBan: Math.max(0, detailData.giaBan || 0),
        trangThai: detailData.trangThai,
        // QUAN TRỌNG: ĐẢM BẢO LUÔN LÀ MẢNG HỢP LỆ
        mauSacs: foundMauSac ? [foundMauSac] : [],
        kichCos: foundKichCo ? [foundKichCo] : [],
        selectedImage: null,
        sanPham: { id: productId },
        isEditing: true
    };
    
    // SỬA: Set giá trị cho các ref riêng biệt cho edit mode
    selectedMauSac.value = foundMauSac;
    selectedKichCo.value = foundKichCo;
    
    console.log('✅ Final detail.value:', detail.value);
    console.log('✅ selectedMauSac:', selectedMauSac.value);
    console.log('✅ selectedKichCo:', selectedKichCo.value);
    
    // Load hình ảnh hiện có
    loadCurrentImages(detailData.id);
    
    submitted.value = false;
    detailDialog.value = true;
}

function createImageUrl(duongDan) {
    if (!duongDan) return null; // Trả về null thay vì placeholder
    
    console.log('Original duongDan:', duongDan);
    
    // Nếu đã là URL đầy đủ
    if (duongDan.startsWith('http://') || duongDan.startsWith('https://')) {
        return duongDan;
    }
    
    // Xử lý đường dẫn
    let cleanPath = duongDan;
    
    // Loại bỏ prefix nếu có
    if (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1);
    }
    
    // Backend của bạn serve hình ảnh tại đâu? Thử các pattern:
    const imageUrl = `${API_BASE_URL}/${cleanPath}`;
    
    console.log('Generated URL:', imageUrl);
    return imageUrl;
}

// THÊM HÀM MỚI: Load hình ảnh hiện có
async function loadCurrentImages(detailId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/hinh-anh/chi-tiet-san-pham/${detailId}`);
        
        console.log(`Current images for detail ${detailId}:`, response.data);
        
        if (response.data && response.data.length > 0) {
            // Lấy hình ảnh đầu tiên
            const imgRef = response.data[0];
            
            let img;
            if (imgRef.id && !imgRef.duongDan) {
                // Load chi tiết hình ảnh nếu chỉ có ID
                const fullImgResponse = await axios.get(`${API_BASE_URL}/hinh-anh/${imgRef.id}`);
                img = fullImgResponse.data;
            } else {
                img = imgRef;
            }
            
            const imageUrl = createImageUrl(img.duongDan);
            
            console.log(`Current image ${img.id}:`, {
                tenHinhAnh: img.tenHinhAnh,
                duongDan: img.duongDan,
                generatedUrl: imageUrl
            });
            
            detail.value.selectedImage = {
                id: img.id,
                maHinhAnh: img.maHinhAnh,
                tenHinhAnh: img.tenHinhAnh,
                trangThai: img.trangThai,
                url: imageUrl,
                preview: imageUrl,
                duongDan: img.duongDan
            };
        } else {
            detail.value.selectedImage = null;
        }
    } catch (error) {
        console.error('Lỗi khi load hình ảnh hiện có:', error);
        detail.value.selectedImage = null;
    }
}

function hideDetailDialog() {
    detailDialog.value = false;
    submitted.value = false;
    // SỬA: Reset các ref khi đóng dialog
    selectedMauSac.value = null;
    selectedKichCo.value = null;
}

// Hàm lưu hình ảnh cho chi tiết sản phẩm (ĐƠN GIẢN HÓA)
async function saveProductDetailImages(detailId, selectedImages) {
    try {
        // Xóa hình ảnh cũ
        await axios.delete(`${API_BASE_URL}/hinh-anh/chi-tiet-san-pham/${detailId}/clear`);
        
        // Chỉ thêm hình ảnh đầu tiên (vì chỉ lưu 1 hình ảnh chính)
        if (selectedImages && selectedImages.length > 0) {
            const firstImage = selectedImages[0];
            await axios.post(`${API_BASE_URL}/hinh-anh/chi-tiet-san-pham`, {
                chiTietSanPhamId: detailId,
                hinhAnhId: firstImage.id
            });
        }
    } catch (error) {
        console.error('Lỗi khi lưu hình ảnh:', error);
        // Không throw error, để tiếp tục lưu chi tiết sản phẩm
    }
}

// 3. HÀM LƯU CHI TIẾT - XỬ LÝ KHÁC NHAU CHO THÊM/SỬA - ĐÃ SỬA
async function saveDetail() {
    submitted.value = true;
    
    // SỬA: Đảm bảo cập nhật mảng từ ref trong chế độ edit
    if (detail.value.isEditing) {
        // Cập nhật mảng từ ref riêng
        detail.value.mauSacs = selectedMauSac.value ? [selectedMauSac.value] : [];
        detail.value.kichCos = selectedKichCo.value ? [selectedKichCo.value] : [];
    }
    
    // Kiểm tra tất cả trường bắt buộc cho chi tiết sản phẩm
    const requiredFields = [];
    
    if (!detail.value.maChiTiet?.trim()) {
        requiredFields.push('Mã chi tiết');
    }
    
   if (detail.value.soLuong == null || detail.value.soLuong === '' || detail.value.soLuong <= 0) {
        requiredFields.push('Số lượng phải > 0');
    } else if (detail.value.soLuong > 10000) {
        requiredFields.push('Số lượng tối đa = 10.000');
    } else if (isNaN(detail.value.soLuong)) {
        requiredFields.push('Số lượng phải là số');
    }

    if (detail.value.giaGoc == null || detail.value.giaGoc === '' || detail.value.giaGoc <= 0) {
        requiredFields.push('Giá gốc phải > 0');
    } else if (detail.value.giaGoc > 100000000) {
        requiredFields.push('Giá gốc tối đa = 100.000.000');
    } else if (isNaN(detail.value.giaGoc)) {
        requiredFields.push('Giá gốc phải là số');
    }

    if (!detail.value.mauSacs || detail.value.mauSacs.length === 0) {
        requiredFields.push('Màu sắc');
    }
    
    if (!detail.value.kichCos || detail.value.kichCos.length === 0) {
        requiredFields.push('Kích cỡ');
    }
    
    // Nếu có trường nào chưa điền thì hiển thị thông báo chung
    if (requiredFields.length > 0) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Vui lòng kiểm tra thông tin', 
            detail: `Các trường bắt buộc: ${requiredFields.join(', ')}`, 
            life: 4000 
        });
        return;
    }
    
    try {
        loading.value = true;
        
        if (detail.value.isEditing && detail.value.id) {
            // ===== KIỂM TRA TRÙNG LẶP CHO CHẾ ĐỘ SỬA =====
            const mauSacId = detail.value.mauSacs[0].id;
            const kichCoId = detail.value.kichCos[0].id;
            
            const isDuplicate = checkDuplicateDetail(
                detail.value.sanPham.id, 
                mauSacId, 
                kichCoId, 
                detail.value.id // Loại trừ chính nó
            );
            
            if (isDuplicate) {
                const duplicateInfo = [{
                    mauSac: detail.value.mauSacs[0].tenMauSac,
                    kichCo: detail.value.kichCos[0].tenKichCo
                }];
                showDuplicateError(duplicateInfo, true);
                return;
            }
            
            // CẬP NHẬT CHI TIẾT HIỆN CÓ - CHỈ 1 BIẾN THỂ
            const detailData = {
                maChiTiet: detail.value.maChiTiet,
                soLuong: Math.max(0, detail.value.soLuong || 0),
                giaGoc: Math.max(0, detail.value.giaGoc || 0),
                giaBan: Math.max(0, detail.value.giaBan || 0),
                trangThai: detail.value.trangThai,
                mauSac: detail.value.mauSacs[0], // CHỈ LẤY PHẦN TỬ ĐẦU TIÊN
                kichCo: detail.value.kichCos[0], // CHỈ LẤY PHẦN TỬ ĐẦU TIÊN
                sanPham: detail.value.sanPham
            };
            
            // Thêm hình ảnh
            if (detail.value.selectedImage) {
                detailData.hinhAnh = { id: detail.value.selectedImage.id };
            } else {
                detailData.hinhAnh = null;
            }
            
            console.log('🔄 Updating detail with data:', detailData);
            console.log('🎨 Màu sắc gửi đi:', detailData.mauSac);
            console.log('📏 Kích cỡ gửi đi:', detailData.kichCo);
            
            await axios.put(`${API_BASE_URL}/api/san-pham-chi-tiet/update/${detail.value.id}`, detailData);
            
            toast.add({ 
                severity: 'success', 
                summary: 'Thành công', 
                detail: `Đã cập nhật chi tiết sản phẩm "${detail.value.maChiTiet}"`, 
                life: 3000 
            });
        } else {
            // ===== CHẾ ĐỘ THÊM MỚI - CHỈ LƯU CÁC BIẾN THỂ HỢP LỆ =====
            const validVariants = [];
            let successCount = 0;
            let errorCount = 0;
            let skippedCount = 0;
            
            // Tạo tất cả combination của màu sắc và kích cỡ NHƯNG CHỈ LẤY CÁC BIẾN THỂ HỢP LỆ
            for (const mauSac of detail.value.mauSacs) {
                for (const kichCo of detail.value.kichCos) {
                    // KIỂM TRA TRÙNG LẶP TRƯỚC KHI THÊM VÀO DANH SÁCH
                    const isDuplicate = checkDuplicateDetail(
                        detail.value.sanPham.id, 
                        mauSac.id, 
                        kichCo.id
                    );
                    
                    if (isDuplicate) {
                        skippedCount++;
                        console.log(`⏭️ Skipping duplicate variant: ${mauSac.tenMauSac} - ${kichCo.tenKichCo}`);
                        continue; // BỎ QUA BIẾN THỂ TRÙNG LẶP
                    }
                    
                    const variantKey = getVariantKey(mauSac, kichCo);
                    const variantImage = detail.value.variantImages[variantKey];
                    
                    const variantData = {
                        maChiTiet: createId(),
                        soLuong: Math.max(0, detail.value.soLuong || 0),
                        giaGoc: Math.max(0, detail.value.giaGoc || 0),
                        giaBan: Math.max(0, detail.value.giaBan || 0),
                        trangThai: detail.value.trangThai,
                        mauSac: mauSac,
                        kichCo: kichCo,
                        sanPham: detail.value.sanPham
                    };
                    
                    // Thêm hình ảnh riêng cho từng biến thể
                    if (variantImage) {
                        variantData.hinhAnh = { id: variantImage.id };
                    }
                    
                    validVariants.push(variantData);
                }
            }
            
            // KIỂM TRA NẾU KHÔNG CÓ BIẾN THỂ HỢP LỆ NÀO
            if (validVariants.length === 0) {
                toast.add({ 
                    severity: 'warn', 
                    summary: 'Cảnh báo', 
                    detail: `Tất cả ${skippedCount} biến thể đều đã tồn tại. Không có biến thể mới nào được tạo.`, 
                    life: 4000 
                });
                return;
            }
            
            console.log(`🆕 Creating ${validVariants.length} valid variants, skipping ${skippedCount} duplicates:`, validVariants);
            
            // Lưu từng biến thể hợp lệ
            for (const variant of validVariants) {
                try {
                    await axios.post(`${API_BASE_URL}/api/san-pham-chi-tiet/save`, variant);
                    successCount++;
                    console.log(`✅ Created variant: ${variant.maChiTiet}`);
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Failed to create variant ${variant.maChiTiet}:`, error);
                }
            }
            
            // THÔNG BÁO KẾT QUẢ CHI TIẾT
            if (successCount > 0) {
                let message = `Đã tạo ${successCount} biến thể mới`;
                if (skippedCount > 0) {
                    message += `, bỏ qua ${skippedCount} biến thể trùng lặp`;
                }
                if (errorCount > 0) {
                    message += `, ${errorCount} biến thể thất bại`;
                }
                
                toast.add({ 
                    severity: 'success', 
                    summary: 'Thành công', 
                    detail: message, 
                    life: 4000 
                });
            } else {
                toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tạo biến thể nào', life: 3000 });
            }
        }
        
        // Reload dữ liệu
        await loadProductDetails(detail.value.sanPham.id);
        await updateProductTotalQuantity(detail.value.sanPham.id);
        
        detailDialog.value = false;
        detail.value = {};
        // SỬA: Reset các ref
        selectedMauSac.value = null;
        selectedKichCo.value = null;
        submitted.value = false;
        
    } catch (error) {
        console.error('❌ Lỗi khi lưu chi tiết sản phẩm:', error.response?.status, error.response?.data);
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

// 4. HÀM COMPUTED ĐỂ XEM TRƯỚC BIẾN THỂ - CẬP NHẬT VỚI THỐNG KÊ
const getVariantPreview = computed(() => {
    if (detail.value.isEditing || !detail.value.mauSacs?.length || !detail.value.kichCos?.length || !detail.value.maChiTiet) {
        return [];
    }
    
    const variants = [];
    for (const mauSac of detail.value.mauSacs) {
        for (const kichCo of detail.value.kichCos) {
            const variantKey = getVariantKey(mauSac, kichCo);
            const isDuplicate = checkDuplicateDetail(
                detail.value.sanPham.id, 
                mauSac.id, 
                kichCo.id
            );
            
            variants.push({
                maChiTiet: createId(),
                mauSac: mauSac,
                kichCo: kichCo,
                isDuplicate: isDuplicate,
                // CHỈ HIỂN THỊ HÌNH ẢNH NẾU KHÔNG TRÙNG LẶP
                selectedImage: isDuplicate ? null : (detail.value.variantImages[variantKey] || null)
            });
        }
    }
    return variants;
});

// HÀM THỐNG KÊ BIẾN THỂ HỢP LỆ
const getValidVariantsCount = computed(() => {
    return getVariantPreview.value.filter(v => !v.isDuplicate).length;
});

const getDuplicateVariantsCount = computed(() => {
    return getVariantPreview.value.filter(v => v.isDuplicate).length;
});

// Computed kiểm tra có thể lưu được không
const canSaveVariants = computed(() => {
    if (detail.value.isEditing) return true;
    return getValidVariantsCount.value > 0;
});

// Computed để hiển thị thông báo khi tất cả biến thể đều trùng lặp
const allVariantsDuplicate = computed(() => {
    const preview = getVariantPreview.value;
    return preview.length > 0 && preview.every(v => v.isDuplicate);
});

// 5. HÀM VALIDATION TRƯỚC KHI EDIT
function beforeEditDetail(detailData, productId) {
    console.log('🔍 Before edit - checking data...');
    
    if (!detailData.mauSac || !detailData.kichCo) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Cảnh báo', 
            detail: 'Dữ liệu chi tiết sản phẩm không đầy đủ', 
            life: 3000 
        });
        return;
    }
    
    const colorExists = mauSacs.value.some(m => m.id === detailData.mauSac.id);
    const sizeExists = kichCos.value.some(k => k.id === detailData.kichCo.id);
    
    if (!colorExists || !sizeExists) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Cảnh báo', 
            detail: 'Màu sắc hoặc kích cỡ không tồn tại trong danh sách', 
            life: 3000 
        });
        return;
    }
    
    editDetail(detailData, productId);
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
    // Sử dụng displayQuantity đã được tính sẵn để tránh performance issue
    const quantity = product.displayQuantity || 0;
    return quantity >= 10 ? 'success' : 'danger';
}

// Thêm hàm mới để xử lý màu sắc cho chi tiết sản phẩm
function getDetailQuantitySeverity(quantity) {
    // Logic: < 10 = đỏ, >= 10 = xanh
    if (quantity >= 10) {
        return 'success'; // Màu xanh
    } else {
        return 'danger';  // Màu đỏ
    }
}

// Xuất file CSV
function exportCSV() {
    try {
        if (!products.value || products.value.length === 0) {
            toast.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Không có dữ liệu để xuất',
                life: 3000
            });
            return;
        }

        const headers = ['ID', 'Mã Sản Phẩm', 'Tên Sản Phẩm','Số Lượng','Danh Mục','Thương Hiệu','Chất Liệu' ,'Đế Giày',  'Trạng Thái', 'Ngày Tạo'];

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
                item.trangThai === 1 ? 'Hoạt động' : 'Không hoạt động',
                item.ngayTao || ''
            ];
        });

        const csvContent = [headers, ...csvData]
            .map(row => row.map(field => {
                const stringField = String(field);
                if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                    return `"${stringField.replace(/"/g, '""')}"`;
                }
                return stringField;
            }).join(','))
            .join('\n');

        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;

        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const filename = `SanPham-${dateStr}.csv`;

            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
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
                <Column field="stt" header="STT" style="width: 5rem" sortable></Column>
                <Column field="maSanPham" header="Mã SP" sortable style="min-width: 10rem"></Column>
                <Column field="tenSanPham" header="Tên sản phẩm" sortable style="min-width: 16rem"></Column>
                <Column header="Số lượng" sortable style="min-width: 8rem">
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
                        <Tag :value="slotProps.data.trangThai === 1 ? 'Hoạt động' : 'Không hoạt động'" :severity="getStatusLabel(slotProps.data.trangThai)" />
                    </template>
                </Column>
                <Column header="Ngày tạo" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        {{ slotProps.data.createdAt }}
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 12rem">
                    <template #body="slotProps">
                        <div class="flex gap-3">
                            <Button icon="pi pi-pencil" outlined rounded size="small" @click="editProduct(slotProps.data)" v-tooltip.top="'Chỉnh sửa'" :disabled="loading" />
                            <Button icon="pi pi-trash" outlined rounded size="small" severity="danger" @click="confirmDeleteProduct(slotProps.data)" v-tooltip.top="'Xóa'" :disabled="loading" />
                            <!-- <Button icon="pi pi-qrcode" outlined rounded size="small" severity="info" @click="showProductQR(slotProps.data)" v-tooltip.top="'QR Code'" :disabled="loading" /> -->
                        </div>
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
                            <Column header="STT" style="width: 5rem">
                                <template #body="detailProps">
                                    {{ detailProps.index + 1 }}
                                </template>
                            </Column>
                            <Column field="maChiTiet" header="Mã chi tiết" sortable style="min-width: 10rem"></Column>
                            <Column field="size" header="Kích cỡ" sortable style="min-width: 8rem"></Column>
                            <Column field="color" header="Màu sắc" sortable style="min-width: 8rem"></Column>
                            <Column field="soLuong" header="Số lượng" sortable style="min-width: 8rem">
                                <template #body="detailProps">
                                    <Badge :value="detailProps.data.soLuong" :severity="getDetailQuantitySeverity(detailProps.data.soLuong)" />
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
                                            <!-- Chỉ hiển thị img nếu có URL hợp lệ -->
                                            <img 
                                                v-if="img.url && !img.url.includes('placeholder')"
                                                :src="img.url" 
                                                :alt="img.tenHinhAnh"
                                                class="w-16 h-16 object-cover rounded border cursor-pointer hover:scale-105 transition-transform shadow-sm"
                                                @click="openImageDetail(img)"
                                                @error="handleImageError($event)"
                                            />
                                            <!-- Fallback khi không có hình ảnh -->
                                            <div 
                                                v-else
                                                class="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center"
                                            >
                                                <i class="pi pi-image text-gray-400"></i>
                                            </div>

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
                                    <Tag :value="detailProps.data.trangThai === 1 ? 'Hoạt động' : 'Không hoạt động'" :severity="getStatusLabel(detailProps.data.trangThai)" />
                                </template>
                            </Column>
                            <Column header="Ngày tạo" sortable style="min-width: 10rem">
                                <template #body="detailProps">
                                    {{ detailProps.data.createdAt }}
                                </template>
                            </Column>
                            <Column :exportable="false" style="min-width: 12rem">
                                <template #body="detailProps">
                                    <div class="flex gap-1">
                                        <Button 
                                            icon="pi pi-pencil" 
                                            outlined 
                                            rounded 
                                            size="small"
                                            @click="beforeEditDetail(detailProps.data, slotProps.data.id)" 
                                            v-tooltip.top="'Chỉnh sửa chi tiết'" 
                                            :disabled="loading" 
                                        />
                                        <Button 
                                            icon="pi pi-trash" 
                                            outlined 
                                            rounded 
                                            size="small"
                                            severity="danger" 
                                            @click="confirmDeleteDetail(detailProps.data)" 
                                            v-tooltip.top="'Xóa chi tiết'" 
                                            :disabled="loading" 
                                        />
                                        <Button 
                                            icon="pi pi-qrcode" 
                                            outlined 
                                            rounded 
                                            size="small"
                                            severity="info" 
                                            @click="showDetailQR(detailProps.data, slotProps.data.tenSanPham)" 
                                            v-tooltip.top="'QR Code chi tiết'" 
                                            :disabled="loading" 
                                        />
                                    </div>
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
        <Dialog v-model:visible="productDialog" :style="{ width: '600px' }" header="Thêm sản phẩm" :modal="true" class="p-fluid">
            <div class="flex flex-col gap-6">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-8">
                        <label for="tenSanPham" class="block font-bold mb-3">Tên sản phẩm </label>
                        <InputText id="tenSanPham" v-model.trim="product.tenSanPham" required="true" autofocus :invalid="submitted && !product.tenSanPham" fluid placeholder="Nhập tên sản phẩm" />
                        <small v-if="submitted && !product.tenSanPham" class="text-red-500">Tên sản phẩm là bắt buộc.</small>
                    </div>
                    <div class="col-span-4">
                        <label for="maSanPham" class="block font-bold mb-3">Mã sản phẩm</label>
                        <InputText id="maSanPham" v-model="product.maSanPham" fluid readonly="true" placeholder="Tự động tạo" :disabled="!!product.id" />
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-4">
                        <label for="trangThai" class="block font-bold mb-3">Trạng thái</label>
                        <Select id="trangThai" v-model="product.trangThai" :options="statuses" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" fluid />
                    </div>
                </div>

                    <div class="grid grid-cols-12 gap-4">
                    <!-- Danh mục với nút thêm nhanh -->
                    <div class="col-span-6">
                        <label for="danhMuc" class="block font-bold mb-3">Danh mục </label>
                        <div class="flex gap-2">
                            <Select id="danhMuc" v-model="product.danhMuc" :options="danhMucs" optionLabel="tenDanhMuc" placeholder="Chọn danh mục" fluid class="flex-1" :invalid="submitted && !product.danhMuc" />
                            <Button 
                                icon="pi pi-plus" 
                                @click="openQuickAdd('danhMuc')" 
                                v-tooltip.top="'Thêm danh mục mới'"
                                severity="secondary"
                                outlined
                            />
                        </div>
                        <small v-if="submitted && !product.danhMuc" class="text-red-500">Danh mục là bắt buộc.</small>
                    </div>
                    <!-- Thương hiệu với nút thêm nhanh -->
                    <div class="col-span-6">
                        <label for="thuongHieu" class="block font-bold mb-3">Thương hiệu </label>
                        <div class="flex gap-2">
                            <Select id="thuongHieu" v-model="product.thuongHieu" :options="thuongHieus" optionLabel="tenThuongHieu" placeholder="Chọn thương hiệu" fluid class="flex-1" :invalid="submitted && !product.thuongHieu" />
                            <Button 
                                icon="pi pi-plus" 
                                @click="openQuickAdd('thuongHieu')" 
                                v-tooltip.top="'Thêm thương hiệu mới'"
                                severity="secondary"
                                outlined
                            />
                        </div>
                        <small v-if="submitted && !product.thuongHieu" class="text-red-500">Thương hiệu là bắt buộc.</small>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <!-- Chất liệu với nút thêm nhanh -->
                    <div class="col-span-6">
                        <label for="chatLieu" class="block font-bold mb-3">Chất liệu </label>
                        <div class="flex gap-2">
                            <Select id="chatLieu" v-model="product.chatLieu" :options="chatLieus" optionLabel="tenChatLieu" placeholder="Chọn chất liệu" fluid class="flex-1" :invalid="submitted && !product.chatLieu" />
                            <Button 
                                icon="pi pi-plus" 
                                @click="openQuickAdd('chatLieu')" 
                                v-tooltip.top="'Thêm chất liệu mới'"
                                severity="secondary"
                                outlined
                            />
                        </div>
                        <small v-if="submitted && !product.chatLieu" class="text-red-500">Chất liệu là bắt buộc.</small>
                    </div>
                    <!-- Đế giày với nút thêm nhanh -->
                    <div class="col-span-6">
                        <label for="deGiay" class="block font-bold mb-3">Đế giày </label>
                        <div class="flex gap-2">
                            <Select id="deGiay" v-model="product.deGiay" :options="deGiays" optionLabel="tenDeGiay" placeholder="Chọn đế giày" fluid class="flex-1" :invalid="submitted && !product.deGiay" />
                            <Button 
                                icon="pi pi-plus" 
                                @click="openQuickAdd('deGiay')" 
                                v-tooltip.top="'Thêm đế giày mới'"
                                severity="secondary"
                                outlined
                            />
                        </div>
                        <small v-if="submitted && !product.deGiay" class="text-red-500">Đế giày là bắt buộc.</small>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Hủy bỏ" icon="pi pi-times" text @click="hideDialog" :disabled="loading" />
                <Button label="Lưu lại" icon="pi pi-check" @click="saveProduct" />
            </template>
        </Dialog>

        <!-- DIALOG THÊM/SỬA CHI TIẾT SẢN PHẨM - CẬP NHẬT -->
        <Dialog v-model:visible="detailDialog" :style="{ width: '900px' }" :header="detail.isEditing ? 'Sửa chi tiết sản phẩm' : 'Thêm chi tiết sản phẩm'" :modal="true" class="p-fluid">
            <div class="flex flex-col gap-6">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-8">
                        <label for="maChiTiet" class="block font-bold mb-3">
                            Mã chi tiết 
                        </label>
                        <InputText 
                            id="maChiTiet" 
                            v-model.trim="detail.maChiTiet" 
                            required="true" 
                            autofocus 
                            :invalid="submitted && !detail.maChiTiet" 
                            fluid 
                            readonly="true"
                            :readonly="detail.isEditing" 
                        />
                        <small v-if="submitted && !detail.maChiTiet" class="text-red-500">Mã chi tiết là bắt buộc.</small>
                    </div>
                    <div class="col-span-4">
                        <label for="soLuong" class="block font-bold mb-3">Số lượng </label>
                        <InputText id="soLuong" v-model.number="detail.soLuong" integeronly fluid placeholder="0" :min="0" :invalid="submitted && (detail.soLuong == null || detail.soLuong <= 0)" />
                        <small v-if="submitted && (detail.soLuong == null || detail.soLuong <= 0)" class="text-red-500">Số lượng phải lớn hơn 0.</small>
                        <small v-else-if="submitted && isNaN(detail.soLuong)" class="text-red-500">Số lượng phải là số.</small>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="giaGoc" class="block font-bold mb-3">Giá gốc </label>
                        <InputText id="giaGoc" v-model.number="detail.giaGoc" mode="currency" currency="VND" locale="vi-VN" fluid placeholder="0 ₫" :min="0" :invalid="submitted && (detail.giaGoc == null || detail.giaGoc <= 0)" />
                        <small v-if="submitted && (detail.giaGoc == null || detail.giaGoc <= 0)" class="text-red-500">Giá gốc phải lớn hơn 0.</small>
                        <small v-else-if="submitted && isNaN(detail.giaGoc)" class="text-red-500">Giá gốc phải là số.</small>

                    </div>
                    <!-- <div class="col-span-6">
                        <label for="giaBan" class="block font-bold mb-3">Giá bán </label>
                        <InputText id="giaBan" v-model.number="detail.giaBan" mode="currency" currency="VND" locale="vi-VN" fluid placeholder="0 ₫" :min="0" :invalid="submitted && (detail.giaBan == null || detail.giaBan <= 0)" />
                        <small v-if="submitted && (detail.giaBan == null || detail.giaBan <= 0)" class="text-red-500">Giá bán phải lớn hơn 0.</small>
                    </div> -->
                </div>

                <!-- SỬA: PHẦN MÀU SẮC VÀ KÍCH CỠ -->
                 <div class="grid grid-cols-12 gap-4">
                <!-- MÀU SẮC với nút thêm nhanh -->
                <div class="col-span-6">
                    <label for="mauSacs" class="block font-bold mb-3">
                        Màu sắc 
                        <span v-if="detail.isEditing" class="text-sm font-normal text-gray-500"></span>
                        <span v-else class="text-sm font-normal text-gray-500"></span>
                    </label>
                    
                    <div class="flex gap-2">
                        <!-- CHẾ ĐỘ SỬA: CHỈ CHỌN 1 -->
                        <Select 
                            v-if="detail.isEditing"
                            id="mauSacSingle" 
                            v-model="selectedMauSac"
                            :options="mauSacs" 
                            optionLabel="tenMauSac" 
                            placeholder="Chọn màu sắc" 
                            fluid 
                            class="flex-1"
                            :invalid="submitted && (!selectedMauSac)"
                        />
                        
                        <!-- CHẾ ĐỘ THÊM: CHỌN NHIỀU -->
                        <MultiSelect 
                            v-else
                            id="mauSacs" 
                            v-model="detail.mauSacs" 
                            :options="mauSacs" 
                            optionLabel="tenMauSac" 
                            placeholder="Chọn màu sắc" 
                            fluid 
                            class="flex-1"
                            :maxSelectedLabels="3"
                            selectedItemsLabel="{0} màu đã chọn"
                            :invalid="submitted && (!detail.mauSacs || detail.mauSacs.length === 0)"
                        />
                        
                        <Button 
                            icon="pi pi-plus" 
                            @click="openQuickAdd('mauSac')" 
                            v-tooltip.top="'Thêm màu sắc mới'"
                            severity="secondary"
                            outlined
                        />
                    </div>
                    
                    <small v-if="submitted && (detail.isEditing ? !selectedMauSac : (!detail.mauSacs || detail.mauSacs.length === 0))" class="text-red-500">
                        Phải chọn ít nhất một màu sắc.
                    </small>
                </div>
                
                <!-- KÍCH CỠ với nút thêm nhanh -->
                <div class="col-span-6">
                    <label for="kichCos" class="block font-bold mb-3">
                        Kích cỡ 
                        <span v-if="detail.isEditing" class="text-sm font-normal text-gray-500"></span>
                        <span v-else class="text-sm font-normal text-gray-500"></span>
                    </label>
                    
                    <div class="flex gap-2">
                        <!-- CHẾ ĐỘ SỬA: CHỈ CHỌN 1 -->
                        <Select 
                            v-if="detail.isEditing"
                            id="kichCoSingle" 
                            v-model="selectedKichCo"
                            :options="kichCos" 
                            optionLabel="tenKichCo" 
                            placeholder="Chọn kích cỡ" 
                            fluid 
                            class="flex-1"
                            :invalid="submitted && (!selectedKichCo)"
                        />
                        
                        <!-- CHẾ ĐỘ THÊM: CHỌN NHIỀU -->
                        <MultiSelect 
                            v-else
                            id="kichCos" 
                            v-model="detail.kichCos" 
                            :options="kichCos" 
                            optionLabel="tenKichCo" 
                            placeholder="Chọn kích cỡ" 
                            fluid 
                            class="flex-1"
                            :maxSelectedLabels="3"
                            selectedItemsLabel="{0} size đã chọn"
                            :invalid="submitted && (!detail.kichCos || detail.kichCos.length === 0)"
                        />
                        
                        <Button 
                            icon="pi pi-plus" 
                            @click="openQuickAdd('kichCo')" 
                            v-tooltip.top="'Thêm kích cỡ mới'"
                            severity="secondary"
                            outlined
                        />
                    </div>
                    
                    <small v-if="submitted && (detail.isEditing ? !selectedKichCo : (!detail.kichCos || detail.kichCos.length === 0))" class="text-red-500">
                        Phải chọn ít nhất một kích cỡ.
                    </small>
                </div>
            </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="trangThai" class="block font-bold mb-3">Trạng thái</label>
                        <Select id="trangThai" v-model="detail.trangThai" :options="statuses" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" fluid />
                    </div>
                </div>

                <!-- PHẦN CHỌN HÌNH ẢNH - GIỐNG NHƯ CŨ -->
                <!-- Trong template của detailDialog -->
                <div class="mt-4" v-if="detail.isEditing">
                    <div class="flex justify-between items-center mb-3">
                        <label class="block font-bold">Hình ảnh sản phẩm</label>
                        <Button 
                            label="Chọn hình ảnh" 
                            icon="pi pi-images" 
                            size="small" 
                            @click="openImageSelection"
                            severity="secondary"
                        />
                    </div>
                    
                    <!-- Hiển thị hình ảnh đã chọn -->
                    <div v-if="detail.selectedImage" class="p-3 border border-gray-200 rounded">
                        <div class="flex flex-col items-center">
                            <div class="relative group">
                                <!-- Chỉ hiển thị nếu có URL hợp lệ -->
                                <img 
                                    v-if="detail.selectedImage.url && !detail.selectedImage.url.includes('placeholder')"
                                    :src="detail.selectedImage.url || detail.selectedImage.preview" 
                                    :alt="detail.selectedImage.tenHinhAnh"
                                    class="w-64 h-64 object-cover rounded border shadow-sm"
                                    @error="handleImageError($event)"
                                />
                                <!-- Fallback -->
                                <div 
                                    v-else
                                    class="w-64 h-64 bg-gray-100 rounded border flex items-center justify-center"
                                >
                                    <div class="text-center">
                                        <i class="pi pi-image text-gray-400 text-4xl mb-2"></i>
                                        <div class="text-gray-500">Không thể tải hình ảnh</div>
                                    </div>
                                </div>
                                
                                <Button 
                                    icon="pi pi-times" 
                                    class="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    size="small" 
                                    rounded 
                                    severity="danger"
                                    @click="removeSelectedImage()"
                                />
                            </div>
                            <div class="flex-1 text-center">
                                <div class="text-xl font-bold text-black-900">{{ detail.selectedImage.tenHinhAnh }}</div>
                                <div class="text-xs text-black-500 mt-1">{{ detail.selectedImage.duongDan }}</div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="p-4 border border-dashed border-gray-300 rounded text-center text-gray-500">
                        <i class="pi pi-image text-2xl mb-2"></i>
                        <p>Chưa chọn hình ảnh nào</p>
                        <small>Nhấn "Chọn hình ảnh" để thêm hình ảnh cho sản phẩm</small>
                    </div>
                </div>

              <!-- PREVIEW BIẾN THỂ SẼ ĐƯỢC TẠO - CHỈ HIỂN THI KHI THÊM MỚI -->
                <div v-if="!detail.isEditing && getVariantPreview.length > 0" class="mt-4">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2">
                            <label class="block font-bold">
                                Các biến thể sẽ được tạo : 
                            </label>
                            <!-- <Badge :value="getValidVariantsCount" severity="success" /> -->
                            <!-- <Badge v-if="getDuplicateVariantsCount > 0" :value="getDuplicateVariantsCount" severity="danger" /> -->
                        </div>
                        
                        <!-- Nút xóa tất cả duplicate -->
                        <Button 
                            v-if="getDuplicateVariantsCount > 0"
                            label="Xóa tất cả trùng lặp" 
                            icon="pi pi-trash" 
                            size="small"
                            severity="danger"
                            outlined
                            @click="removeAllDuplicateVariants"
                            v-tooltip.top="'Xóa tất cả biến thể trùng lặp khỏi danh sách'"
                        />
                    </div>
                    
                    <div class="border border-gray-200 rounded p-3 max-h-96 overflow-y-auto">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div 
                                v-for="variant in getVariantPreview" 
                                :key="variant.maChiTiet" 
                                :class="[
                                    'p-3 rounded border relative',
                                    variant.isDuplicate 
                                        ? 'bg-red-50 border-red-200 text-red-700 opacity-75' 
                                        : 'bg-gray-50 border-gray-200'
                                ]"
                            >
                           <!-- Nút xóa biến thể trùng lặp -->
                            <!-- <Button 
                                v-if="variant.isDuplicate"
                                icon="pi pi-times" 
                                class="absolute -top-2 -right-2 z-10"
                                size="small" 
                                rounded 
                                severity="danger"
                                @click.stop="() => { console.log('Clicking X for variant:', variant); removeSingleVariant(variant); debugCurrentState(); }"
                                v-tooltip.top="'Xóa biến thể trùng lặp này'"
                            /> -->
                                <!-- Thông tin biến thể -->
                                <div class="flex items-center gap-2 mb-2">
                                    <i v-if="variant.isDuplicate" class="pi pi-times-circle text-red-500"></i>
                                    <i v-else class="pi pi-check-circle text-green-500"></i>
                                    <div class="font-medium text-sm">{{ variant.maChiTiet }}</div>
                                </div>
                                
                                <div :class="variant.isDuplicate ? 'text-red-600' : 'text-gray-600'" class="text-sm mb-2">
                                    {{ variant.mauSac.tenMauSac }} - {{ variant.kichCo.tenKichCo }}
                                </div>
                                
                                <!-- Hình ảnh của biến thể -->
                                <div class="mb-2">
                                    <!-- BIẾN THỂ TRÙNG LẶP - KHÔNG ĐƯỢC CHỌN HÌNH ẢNH -->
                                    <div v-if="variant.isDuplicate" class="w-full h-20 border-2 border-dashed border-red-300 rounded flex items-center justify-center bg-red-50">
                                        <div class="text-center">
                                            <i class="pi pi-ban text-red-400 text-lg mb-1"></i>
                                            <div class="text-xs text-red-500">Không thể chọn hình</div>
                                        </div>
                                    </div>
                                    
                                    <!-- BIẾN THỂ HỢP LỆ - CÓ THỂ CHỌN HÌNH ẢNH -->
                                    <div v-else>
                                        <div v-if="variant.selectedImage" class="relative">
                                            <img 
                                                :src="variant.selectedImage.url || variant.selectedImage.preview" 
                                                :alt="variant.selectedImage.tenHinhAnh"
                                                class="w-full h-20 object-cover rounded border"
                                                @error="handleImageError($event)"
                                            />
                                            <Button 
                                                icon="pi pi-times" 
                                                class="absolute -top-1 -right-1"
                                                size="small" 
                                                rounded 
                                                severity="danger"
                                                @click="removeVariantImage(variant)"
                                                v-tooltip.top="'Xóa hình ảnh'"
                                            />
                                        </div>
                                        <div v-else class="w-full h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:border-blue-400 transition-colors">
                                            <Button 
                                                icon="pi pi-plus" 
                                                label="Chọn hình"
                                                size="small" 
                                                text
                                                @click="openImageSelectionForVariant(variant)"
                                                class="text-gray-600 hover:text-blue-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Trạng thái biến thể -->
                                <div v-if="variant.isDuplicate" class="text-xs text-red-500 font-medium">
                                    ⚠️ Đã tồn tại
                                </div>
                                <div v-else class="text-xs text-green-600 font-medium">
                                </div>
                            </div>
                        </div>
                    
                        
                        <!-- Thông báo tổng quan -->
                        <!-- <div v-if="getVariantPreview.filter(v => v.isDuplicate).length > 0" class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <div class="flex items-center gap-2 text-yellow-800">
                                <i class="pi pi-exclamation-triangle"></i>
                                <span class="font-medium">Lưu ý:</span>
                            </div>
                            <ul class="mt-2 text-sm text-yellow-700 list-disc ml-6">
                                <li>Các biến thể màu đỏ đã tồn tại và sẽ bị bỏ qua khi lưu</li>
                                <li>Không thể chọn hình ảnh cho các biến thể trùng lặp</li>
                                <li>Chỉ {{ getVariantPreview.filter(v => !v.isDuplicate).length }} biến thể mới sẽ được tạo</li>
                            </ul>
                        </div> -->
                    </div>
                </div>

                <!-- HIỆN TẠI ĐANG SỬA GÌ - CHỈ HIỂN THI KHI SỬA -->
                <div v-if="detail.isEditing" class="mt-4 p-3 bg-gray-50 border rounded">
                    <label class="block font-bold mb-2">Thông tin hiện tại:</label>
                    <div class="text-sm">
                        <div><strong>Mã:</strong> {{ detail.maChiTiet }}</div>
                        <div><strong>Màu sắc:</strong> {{ selectedMauSac?.tenMauSac || 'Chưa chọn' }}</div>
                        <div><strong>Kích cỡ:</strong> {{ selectedKichCo?.tenKichCo || 'Chưa chọn' }}</div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Hủy bỏ" icon="pi pi-times" text @click="hideDetailDialog" :disabled="loading" />
                <Button 
                    v-if="detail.isEditing"
                    label="Cập nhật chi tiết" 
                    icon="pi pi-save" 
                    @click="saveDetail" 
                    :loading="loading"
                />
                <Button 
                    v-else
                    :label="'Thêm chi tiết'" 
                    icon="pi pi-plus" 
                    @click="saveDetail" 
                    :loading="loading"
                    :severity="getValidVariantsCount > 0 ? 'primary' : 'secondary'"
                />
            </template>
        </Dialog>

        <!-- Dialog chọn hình ảnh -->
        <Dialog v-model:visible="imageSelectionDialog" :style="{ width: '1000px' }" header="Chọn hình ảnh" :modal="true">
            <div class="flex flex-col gap-4">
                <!-- Thanh tìm kiếm -->
                <div class="flex justify-between items-center">
                    <h6 class="m-0">Danh sách hình ảnh có sẵn</h6>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="imageFilters['global'].value" placeholder="Tìm kiếm hình ảnh..." />
                    </IconField>
                </div>

                <!-- Bảng chọn hình ảnh - SINGLE SELECT -->
                <DataTable
                    v-model:selection="selectedImage"
                    :value="availableImages"
                    dataKey="id"
                    :paginator="true"
                    :rows="8"
                    :filters="imageFilters"
                    selectionMode="single"
                    tableStyle="min-width: 50rem"
                    class="max-h-96"
                >
                    <Column selectionMode="single" style="width: 3rem"></Column>
                   <Column header="Hình ảnh" style="width: 120px">
                        <template #body="slotProps">
                            <!-- Chỉ hiển thị nếu có URL hợp lệ -->
                            <img 
                                v-if="slotProps.data.preview && !slotProps.data.preview.includes('placeholder')"
                                :src="slotProps.data.preview" 
                                :alt="slotProps.data.tenHinhAnh"
                                class="w-16 h-16 object-cover rounded border shadow-sm cursor-pointer hover:scale-105 transition-transform"
                                @error="handleImageError($event)"
                                @click="selectedImage = slotProps.data"
                            />
                            <!-- Fallback -->
                            <div 
                                v-else
                                class="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center cursor-pointer"
                                @click="selectedImage = slotProps.data"
                            >
                                <i class="pi pi-image text-gray-400"></i>
                            </div>
                        </template>
                    </Column>
                    <Column field="maHinhAnh" header="Mã hình ảnh" sortable style="min-width: 12rem">
                        <template #body="slotProps">
                            <span 
                                class="cursor-pointer hover:text-blue-600"
                                @click="selectedImage = slotProps.data"
                            >
                                {{ slotProps.data.maHinhAnh }}
                            </span>
                        </template>
                    </Column>
                    <Column field="tenHinhAnh" header="Tên file" sortable style="min-width: 16rem"></Column>
                    <Column field="duongDan" header="Đường dẫn" sortable style="min-width: 20rem">
                        <template #body="slotProps">
                            <span class="text-sm text-gray-600 truncate block">{{ slotProps.data.duongDan }}</span>
                        </template>
                    </Column>
                    <Column header="Trạng thái" style="min-width: 10rem">
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.trangThai === 1 ? 'Sẵn sàng' : 'Đang xử lý'" :severity="getStatusLabel(slotProps.data.trangThai)" />
                        </template>
                    </Column>
                </DataTable>

                <!-- Thông tin đã chọn -->
                <div v-if="selectedImage" class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <div class="flex items-center gap-3">
                        <img 
                            :src="selectedImage.preview" 
                            :alt="selectedImage.tenHinhAnh"
                            class="w-12 h-12 object-cover rounded border"
                            @error="handleImageError($event)"
                        />
                        <div>
                            <div class="font-medium text-blue-800">{{ selectedImage.maHinhAnh }}</div>
                            <div class="text-sm text-blue-600">{{ selectedImage.tenHinhAnh }}</div>
                        </div>
                    </div>
                </div>
            </div>

           <!-- Trong Dialog chọn hình ảnh, cập nhật footer -->
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="imageSelectionDialog = false" />
                <Button 
                    label="Bỏ chọn" 
                    icon="pi pi-minus-circle" 
                    severity="secondary"
                    @click="selectedImage = null"
                    v-if="selectedImage"
                />
                <Button 
                    :label="selectedImage ? `Xác nhận: ${selectedImage.maHinhAnh}` : 'Chọn hình ảnh'" 
                    icon="pi pi-check" 
                    @click="detail.currentVariant ? confirmImageSelectionForVariant() : confirmImageSelection()"
                    :disabled="!selectedImage"
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

        <!-- Dialog QR Code cho sản phẩm -->
        <Dialog v-model:visible="qrDialog" :style="{ width: '500px' }" :header="currentQRTitle" :modal="true">
            <div class="flex flex-col items-center gap-4">
                <div class="text-center">
                    <img 
                        :src="currentQRData" 
                        alt="QR Code"
                        class="w-64 h-64 border rounded shadow-lg mx-auto"
                    />
                </div>
                <div class="text-sm text-gray-600 text-center">
                    <p>Quét mã QR để xem thông tin sản phẩm</p>
                </div>
            </div>
            
            <template #footer>
                <Button 
                    label="Tải xuống" 
                    icon="pi pi-download" 
                    @click="downloadQR('SanPham_' + (product.maSanPham || 'SP'))"
                    severity="secondary"
                />
                <Button label="Đóng" icon="pi pi-times" @click="qrDialog = false" />
            </template>
        </Dialog>

        <!-- Dialog QR Code cho chi tiết sản phẩm -->
        <Dialog v-model:visible="qrDetailDialog" :style="{ width: '500px' }" :header="currentQRTitle" :modal="true">
            <div class="flex flex-col items-center gap-4">
                <div class="text-center">
                    <img 
                        :src="currentQRData" 
                        alt="QR Code"
                        class="w-64 h-64 border rounded shadow-lg mx-auto"
                    />
                </div>
                <div class="text-sm text-gray-600 text-center">
                    <p>Quét mã QR để xem thông tin chi tiết sản phẩm</p>
                </div>
            </div>
            
            <template #footer>
                <Button 
                    label="Tải xuống" 
                    icon="pi pi-download" 
                    @click="downloadQR('ChiTiet_' + (detail.maChiTiet || 'CTSP'))"
                    severity="secondary"
                />
                <Button label="Đóng" icon="pi pi-times" @click="qrDetailDialog = false" />
            </template>
        </Dialog>
        <!-- DIALOG THÊM NHANH THUỘC TÍNH -->
        <Dialog v-model:visible="quickAddDialog" :style="{ width: '500px' }" :header="quickAddTypes[quickAddType]?.title || 'Thêm mới'" :modal="true" class="p-fluid">
            <div v-if="quickAddTypes[quickAddType]" class="flex flex-col gap-6">
                <!-- Auto-generated code field -->
                <div v-if="quickAddTypes[quickAddType].codePrefix">
                    <label class="block font-bold mb-3">Mã {{ quickAddType === 'mauSac' ? 'màu sắc' : quickAddType === 'kichCo' ? 'kích cỡ' : quickAddType }}</label>
                    <InputText 
                        :value="quickAddItem[`ma${quickAddType.charAt(0).toUpperCase() + quickAddType.slice(1)}`]" 
                        readonly 
                        placeholder="Tự động tạo"
                        class="bg-gray-50"
                    />
                </div>

                <!-- Dynamic fields -->
                <div v-for="field in quickAddTypes[quickAddType].fields" :key="field.key">
                    <label :for="field.key" class="block font-bold mb-3">
                        {{ field.label }}
                        <span v-if="field.required" class="text-red-500">*</span>
                    </label>
                    
                    <!-- Text input -->
                    <InputText 
                        v-if="field.type === 'text'"
                        :id="field.key"
                        v-model.trim="quickAddItem[field.key]"
                        :placeholder="field.placeholder"
                        :invalid="quickAddSubmitted && field.required && (!quickAddItem[field.key] || !quickAddItem[field.key].toString().trim())"
                        fluid
                    />
                    
                    <!-- Color picker -->
                    <div v-else-if="field.type === 'color'" class="flex gap-3">
                        <InputText 
                            :id="field.key"
                            v-model="quickAddItem[field.key]"
                            :placeholder="field.placeholder"
                            :invalid="quickAddSubmitted && field.required && !quickAddItem[field.key]"
                            fluid
                            class="flex-1"
                        />
                        <input 
                            type="color" 
                            v-model="quickAddItem[field.key]"
                            class="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                            :title="'Chọn ' + field.label.toLowerCase()"
                        />
                    </div>
                    
                    <!-- Textarea -->
                    <Textarea 
                        v-else-if="field.type === 'textarea'"
                        :id="field.key"
                        v-model.trim="quickAddItem[field.key]"
                        :placeholder="field.placeholder"
                        rows="3"
                        fluid
                    />
                    
                    <small v-if="quickAddSubmitted && field.required && (!quickAddItem[field.key] || !quickAddItem[field.key].toString().trim())" class="text-red-500">
                        {{ field.label }} là bắt buộc.
                    </small>
                </div>

                <!-- Status field -->
                <div>
                    <label class="block font-bold mb-3">Trạng thái</label>
                    <Select 
                        v-model="quickAddItem.trangThai" 
                        :options="statuses" 
                        optionLabel="label" 
                        optionValue="value" 
                        placeholder="Chọn trạng thái" 
                        fluid 
                    />
                </div>

                <!-- Preview for color -->
                <div v-if="quickAddType === 'mauSac' && quickAddItem.maMau" class="mt-4">
                    <label class="block font-bold mb-3">Xem trước màu:</label>
                    <div class="flex items-center gap-3 p-3 border rounded">
                        <div 
                            class="w-16 h-16 rounded border-2 border-gray-300"
                            :style="{ backgroundColor: quickAddItem.maMau }"
                        ></div>
                        <div>
                            <div class="font-medium">{{ quickAddItem.tenMauSac || 'Tên màu' }}</div>
                            <div class="text-sm text-gray-600">{{ quickAddItem.maMau || '#000000' }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideQuickAddDialog" :disabled="quickAddLoading" />
                <Button 
                    label="Thêm" 
                    icon="pi pi-check" 
                    @click="saveQuickAdd" 
                    :loading="quickAddLoading"
                />
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