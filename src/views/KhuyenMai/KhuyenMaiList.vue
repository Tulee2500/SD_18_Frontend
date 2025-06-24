<template>
    <div class="card">
        <!-- Toolbar -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Thêm mới" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                <Button label="Xóa" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedKhuyenMai || !selectedKhuyenMai.length" />
            </template>
            <template #end>
                <Button label="Xuất CSV" icon="pi pi-upload" severity="secondary" @click="exportCSV" />
            </template>
        </Toolbar>

        <!-- DataTable -->
        <DataTable
            ref="dt"
            v-model:selection="selectedKhuyenMai"
            :value="filteredKhuyenMai"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} khuyến mãi"
            :loading="isLoading"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Quản Lý Khuyến Mãi</h4>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Tìm kiếm..." />
                    </IconField>
                    <Select v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Lọc trạng thái" class="w-12rem" />
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="ID" sortable style="width: 8rem">
                <template #body="slotProps">
                    <span class="font-bold text-primary">#{{ slotProps.data.id }}</span>
                </template>
            </Column>
            <Column field="maKhuyenMai" header="Mã KM" sortable style="width: 10rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.maKhuyenMai" severity="secondary" />
                </template>
            </Column>
            <Column field="tenKhuyenMai" header="Tên Khuyến Mãi" sortable style="min-width: 16rem" />
            <Column field="giaTri" header="Giá Trị Giảm" sortable style="width: 12rem">
                <template #body="slotProps">
                    <span class="text-red-600 font-bold">{{ (slotProps.data.giaTri * 100).toFixed(0) }}%</span>
                </template>
            </Column>
            <Column field="ngayBatDau" header="Ngày Bắt Đầu" sortable style="width: 12rem" />
            <Column field="ngayKetThuc" header="Ngày Kết Thúc" sortable style="width: 12rem" />
            <Column field="trangThai" header="Trạng Thái" sortable style="width: 12rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.trangThai === 1 ? 'Còn hạn' : 'Hết hạn'" :severity="slotProps.data.trangThai === 1 ? 'success' : 'danger'">
                        <i :class="slotProps.data.trangThai === 1 ? 'pi pi-check-circle' : 'pi pi-times-circle'" class="mr-1"></i>
                        {{ slotProps.data.trangThai === 1 ? 'Còn hạn' : 'Hết hạn' }}
                    </Tag>
                </template>
            </Column>
            <Column :exportable="false" style="width: 12rem">
                <template #body="slotProps">
                    <div class="flex justify-between gap-2">
                        <Button icon="pi pi-eye" outlined rounded size="small" severity="info" @click="viewDetail(slotProps.data)" title="Xem chi tiết" />
                        <Button icon="pi pi-pencil" outlined rounded size="small" @click="editKhuyenMai(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" size="small" @click="confirmDeleteKhuyenMai(slotProps.data)" />
                        <Button icon="pi pi-refresh" outlined rounded severity="secondary" size="small" @click="changeStatus(slotProps.data)" :title="slotProps.data.trangThai === 1 ? 'Hết hạn' : 'Còn hạn'" />
                    </div>
                </template>
            </Column>
            <template #empty>
                <div class="text-center p-5">
                    <i class="pi pi-tags text-5xl text-muted mb-3"></i>
                    <h5 class="text-muted">Không tìm thấy khuyến mãi</h5>
                    <p class="text-muted">Thử thay đổi bộ lọc hoặc thêm khuyến mãi mới.</p>
                </div>
            </template>
        </DataTable>

        <!-- Add/Edit Promotion Dialog -->
        <Dialog v-model:visible="khuyenMaiDialog" :style="{ width: '450px' }" :header="khuyenMai.id ? 'Cập nhật khuyến mãi' : 'Thêm khuyến mãi'" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="tenKhuyenMai" class="block font-bold mb-3">Tên Khuyến Mãi</label>
                    <InputText id="tenKhuyenMai" v-model.trim="khuyenMai.tenKhuyenMai" required="true" autofocus :invalid="submitted && !khuyenMai.tenKhuyenMai" fluid />
                    <small v-if="submitted && !khuyenMai.tenKhuyenMai" class="text-red-500">Tên khuyến mãi là bắt buộc.</small>
                </div>
                <div>
                    <label for="maKhuyenMai" class="block font-bold mb-3">Mã Khuyến Mãi</label>
                    <InputText id="maKhuyenMai" v-model="khuyenMai.maKhuyenMai" fluid />
                    <small v-if="submitted && !khuyenMai.maKhuyenMai" class="text-red-500">Mã khuyến mãi là bắt buộc.</small>
                </div>
                <div>
                    <label for="giaTri" class="block font-bold mb-3">Giá Trị Giảm (%)</label>
                    <InputText id="giaTri" v-model.number="giaTriPercent" type="number" :min="0" :max="100" fluid :invalid="submitted && giaTriPercent == null" />
                    <small v-if="submitted && giaTriPercent== null" class="text-red-500">Giá trị giảm là bắt buộc.</small>
                    <small v-if="submitted && (giaTriPercent == null || giaTriPercent === '')" class="text-red-500">
                        Giá trị giảm là bắt buộc.
                    </small>
                    <small v-else-if="submitted && giaTriPercent <= 0" class="text-red-500">
                        Giá trị giảm phải lớn hơn 0.
                    </small>
                    <small v-else-if="submitted && giaTriPercent > 100" class="text-red-500">
                        Giá trị giảm không được vượt quá 100%.
                    </small>
                </div>
                <div>
                    <label for="ngayBatDau" class="block font-bold mb-3">Ngày Bắt Đầu</label>
                    <Calendar id="ngayBatDau" v-model="khuyenMai.ngayBatDau" dateFormat="yy-mm-dd" fluid :invalid="submitted && !khuyenMai.ngayBatDau" />
                    <small v-if="submitted && !khuyenMai.ngayBatDau" class="text-red-500">Ngày bắt đầu là bắt buộc.</small>
                </div>
                <div>
                    <label for="ngayKetThuc" class="block font-bold mb-3">Ngày Kết Thúc</label>
                    <Calendar id="ngayKetThuc" v-model="khuyenMai.ngayKetThuc" dateFormat="yy-mm-dd" fluid :invalid="submitted && !khuyenMai.ngayKetThuc" />
                    <small v-if="submitted && !khuyenMai.ngayKetThuc" class="text-red-500">Ngày kết thúc là bắt buộc.</small>
                </div>
                <div>
                    <label for="trangThai" class="block font-bold mb-3">Trạng Thái</label>
                    <Select id="trangThai" v-model="khuyenMai.trangThai" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Lưu" icon="pi pi-check" @click="saveKhuyenMai" />
            </template>
        </Dialog>

            <!-- Detail Promotion Dialog -->
        <Dialog v-model:visible="detailDialog" :style="{ width: '800px' }" header="Chi Tiết Khuyến Mãi" :modal="true">
            <!-- Loading State -->
            <div v-if="isLoading" class="text-center p-8">
                <i class="pi pi-spinner pi-spin text-4xl text-primary mb-4"></i>
                <p>Đang tải chi tiết khuyến mãi...</p>
            </div>
            
            <!-- No Data State -->
            <div v-else-if="!selectedDetail" class="text-center p-8">
                <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
                <p>Không có dữ liệu chi tiết để hiển thị</p>
            </div>
            
            <!-- Main Content -->
            <div v-else-if="selectedDetail" class="flex flex-col gap-6">
                
                <!-- Thông tin khuyến mãi -->
                <div v-if="selectedDetail.khuyenMai" class="border-2 border-gray-200 rounded-lg p-4">
                    <h5 class="text-lg font-bold mb-4 text-primary">
                        <i class="pi pi-tag mr-2"></i>Thông Tin Khuyến Mãi
                    </h5>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Mã Khuyến Mãi:</label>
                            <Tag :value="selectedDetail.khuyenMai?.maKhuyenMai || 'N/A'" severity="secondary" />
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Tên Khuyến Mãi:</label>
                            <span class="text-gray-800">{{ selectedDetail.khuyenMai?.tenKhuyenMai || 'N/A' }}</span>
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Giá Trị Giảm:</label>
                            <span class="text-red-600 font-bold">
                                {{ selectedDetail.khuyenMai?.giaTri ? (selectedDetail.khuyenMai.giaTri * 100).toFixed(0) + '%' : 'N/A' }}
                            </span>
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Trạng Thái:</label>
                            <Tag :value="selectedDetail.khuyenMai?.trangThai === 1 ? 'Còn hạn' : 'Hết hạn'" 
                                :severity="selectedDetail.khuyenMai?.trangThai === 1 ? 'success' : 'danger'">
                                <i :class="selectedDetail.khuyenMai?.trangThai === 1 ? 'pi pi-check-circle' : 'pi pi-times-circle'" class="mr-1"></i>
                                {{ selectedDetail.khuyenMai?.trangThai === 1 ? 'Còn hạn' : 'Hết hạn' }}
                            </Tag>
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Ngày Bắt Đầu:</label>
                            <span class="text-gray-800">{{ formatDate(selectedDetail.khuyenMai?.ngayBatDau) }}</span>
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Ngày Kết Thúc:</label>
                            <span class="text-gray-800">{{ formatDate(selectedDetail.khuyenMai?.ngayKetThuc) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Thông tin sản phẩm -->
                <div v-if="selectedDetail.chiTietSanPham?.sanPham" class="border-2 border-gray-200 rounded-lg p-4">
                    <h5 class="text-lg font-bold mb-4 text-primary">
                        <i class="pi pi-shopping-bag mr-2"></i>Thông Tin Sản Phẩm
                    </h5>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Mã Sản Phẩm:</label>
                            <Tag :value="selectedDetail.chiTietSanPham?.sanPham?.maSanPham || 'N/A'" severity="info" />
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Tên Sản Phẩm:</label>
                            <span class="text-gray-800 font-medium">{{ selectedDetail.chiTietSanPham?.sanPham?.tenSanPham || 'N/A' }}</span>
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Thương Hiệu:</label>
                            <span class="text-gray-800">{{ selectedDetail.chiTietSanPham?.sanPham?.thuongHieu?.tenThuongHieu || 'N/A' }}</span>
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Danh Mục:</label>
                            <span class="text-gray-800">{{ selectedDetail.chiTietSanPham?.sanPham?.danhMuc?.tenDanhMuc || 'N/A' }}</span>
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Chất Liệu:</label>
                            <span class="text-gray-800">{{ selectedDetail.chiTietSanPham?.sanPham?.chatLieu?.tenChatLieu || 'N/A' }}</span>
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Đế Giày:</label>
                            <span class="text-gray-800">{{ selectedDetail.chiTietSanPham?.sanPham?.deGiay?.tenDeGiay || 'N/A' }}</span>
                        </div>
                    </div>
                </div>

                <!-- Chi tiết sản phẩm -->
                <div v-if="selectedDetail.chiTietSanPham" class="border-2 border-gray-200 rounded-lg p-4">
                    <h5 class="text-lg font-bold mb-4 text-primary">
                        <i class="pi pi-info-circle mr-2"></i>Chi Tiết Sản Phẩm
                    </h5>
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Mã Chi Tiết:</label>
                            <Tag :value="selectedDetail.chiTietSanPham?.maChiTiet || 'N/A'" severity="warning" />
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Mã QR:</label>
                            <Tag :value="selectedDetail.chiTietSanPham?.maQR || 'N/A'" severity="success" />
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Số Lượng:</label>
                            <span class="text-gray-800 font-medium">{{ selectedDetail.chiTietSanPham?.soLuong || 'N/A' }}</span>
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Màu Sắc:</label>
                            <span class="text-gray-800">{{ selectedDetail.chiTietSanPham?.mauSac?.tenMauSac || 'N/A' }}</span>
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Kích Cỡ:</label>
                            <span class="text-gray-800">{{ selectedDetail.chiTietSanPham?.kichCo?.tenKichCo || 'N/A' }}</span>
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Trạng Thái:</label>
                            <Tag :value="selectedDetail.chiTietSanPham?.trangThai === 1 ? 'Còn hàng' : 'Hết hàng'" 
                                :severity="selectedDetail.chiTietSanPham?.trangThai === 1 ? 'success' : 'danger'" />
                        </div>
                    </div>
                </div>

                <!-- Thông tin giá -->
                <div v-if="selectedDetail.chiTietSanPham?.giaBan && selectedDetail.khuyenMai?.giaTri" class="border-2 border-gray-200 rounded-lg p-4">
                    <h5 class="text-lg font-bold mb-4 text-primary">
                        <i class="pi pi-dollar mr-2"></i>Thông Tin Giá
                    </h5>
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Giá Gốc:</label>
                            <span class="text-blue-600 font-bold">{{ formatCurrency(selectedDetail.chiTietSanPham.giaBan) }}</span>
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Giá Sau Khuyến Mãi:</label>
                            <span class="text-red-600 font-bold">{{ formatCurrency(selectedDetail.chiTietSanPham.giaBan * (1 - selectedDetail.khuyenMai.giaTri)) }}</span>
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Tiết Kiệm:</label>
                            <span class="text-green-600 font-bold">{{ formatCurrency(selectedDetail.chiTietSanPham.giaBan * selectedDetail.khuyenMai.giaTri) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Thông tin thời gian -->
                <div class="border-2 border-gray-200 rounded-lg p-4">
                    <h5 class="text-lg font-bold mb-4 text-primary">
                        <i class="pi pi-calendar mr-2"></i>Thông Tin Thời Gian
                    </h5>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Ngày Tạo:</label>
                            <span class="text-gray-800">{{ formatDate(selectedDetail.ngayTao) }}</span>
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-700 mb-1">Ngày Cập Nhật:</label>
                            <span class="text-gray-800">{{ formatDate(selectedDetail.ngayCapNhat) }}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <template #footer>
                <Button label="Đóng" icon="pi pi-times" @click="detailDialog = false" />
            </template>
        </Dialog>

        <!-- Delete Promotion Dialog -->
        <Dialog v-model:visible="deleteKhuyenMaiDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="khuyenMai"
                    >Bạn có chắc chắn muốn xóa <b>{{ khuyenMai.tenKhuyenMai }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteKhuyenMaiDialog = false" />
                <Button label="Có" icon="pi pi-check" @click="deleteKhuyenMai" />
            </template>
        </Dialog>

        <!-- Delete Selected Promotions Dialog -->
        <Dialog v-model:visible="deleteKhuyenMaisDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Bạn có chắc chắn muốn xóa các khuyến mãi đã chọn?</span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteKhuyenMaisDialog = false" />
                <Button label="Có" icon="pi pi-check" text @click="deleteSelectedKhuyenMais" />
            </template>
        </Dialog>

        <!-- Toast Notifications -->
        <Toast />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import axios from 'axios';
import { InputText } from 'primevue';

const toast = useToast();
const dt = ref();
const khuyenMais = ref([]);
const khuyenMaiDialog = ref(false);
const deleteKhuyenMaiDialog = ref(false);
const deleteKhuyenMaisDialog = ref(false);
const detailDialog = ref(false);
const khuyenMai = ref({});
const selectedKhuyenMai = ref();
const selectedDetail = ref(null);
const giaTriPercent = ref(0); // Thêm biến để lưu giá trị % hiển thị
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const statusFilter = ref('');
const submitted = ref(false);
const isLoading = ref(false);
const statusOptions = ref([
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Còn hạn', value: 1 },
    { label: 'Hết hạn', value: 0 }
]);

onMounted(() => {
    fetchData();
});

async function fetchData() {
    isLoading.value = true;
    try {
        const res = await axios.get('http://localhost:8080/khuyen-mai');
        khuyenMais.value = res.data;
    } catch (error) {
        console.error('Error fetching data:', error.response?.data || error.message);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu',
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
}

const filteredKhuyenMai = computed(() => {
    let filtered = khuyenMais.value;

    if (statusFilter.value !== '') {
        filtered = filtered.filter((km) => km.trangThai === parseInt(statusFilter.value));
    }

    return filtered;
});

async function viewDetail(km) {
    console.log('Viewing detail for promotion:', km); // Debug log
    
    try {
        // Hiển thị loading state
        isLoading.value = true;
        
        // Gọi API để lấy chi tiết khuyến mãi
        console.log(`Calling API: http://localhost:8080/khuyen-mai-chi-tiet/${km.id}`);
        const res = await axios.get(`http://localhost:8080/khuyen-mai-chi-tiet/${km.id}`);
        
        console.log('API Response:', res.data); // Debug log
        
        // Kiểm tra xem response có dữ liệu không
        if (!res.data) {
            throw new Error('Không có dữ liệu chi tiết');
        }
        
        selectedDetail.value = res.data;
        detailDialog.value = true;
        
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Tải chi tiết khuyến mãi thành công',
            life: 2000
        });
        
    } catch (error) {
        console.error('Error fetching detail:', error);
        
        // Xử lý các loại lỗi khác nhau
        let errorMessage = 'Có lỗi xảy ra khi tải chi tiết khuyến mãi';
        
        if (error.response) {
            // Server responded with error status
            console.error('Server Error:', error.response.status, error.response.data);
            if (error.response.status === 404) {
                errorMessage = 'Không tìm thấy chi tiết khuyến mãi';
            } else if (error.response.status === 500) {
                errorMessage = 'Lỗi server khi tải chi tiết';
            } else {
                errorMessage = error.response.data?.message || errorMessage;
            }
        } else if (error.request) {
            // Network error
            console.error('Network Error:', error.request);
            errorMessage = 'Không thể kết nối đến server';
        } else {
            // Other error
            errorMessage = error.message || errorMessage;
        }
        
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: errorMessage,
            life: 5000
        });
    } finally {
        isLoading.value = false;
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}


function openNew() {
    khuyenMai.value = { trangThai: 1 };
    giaTriPercent.value = 1; // Giá trị mặc định là 1% thay vì 0
    submitted.value = false;
    khuyenMaiDialog.value = true;
}

function hideDialog() {
    khuyenMaiDialog.value = false;
    submitted.value = false;
    // Reset values to prevent issues
    khuyenMai.value = {};
    giaTriPercent.value = 1; // Reset về giá trị hợp lệ
}

async function saveKhuyenMai() {
    submitted.value = true;

    // Validate tên khuyến mãi
    if (!khuyenMai.value.tenKhuyenMai?.trim()) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Tên khuyến mãi là bắt buộc',
            life: 3000
        });
        return;
    }

    // Validate mã khuyến mãi
    if (!khuyenMai.value.maKhuyenMai?.trim()) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Mã khuyến mãi là bắt buộc',
            life: 3000
        });
        return;
    }

    // Validate giá trị giảm
    if (giaTriPercent.value == null || giaTriPercent.value === '') {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Giá trị giảm là bắt buộc',
            life: 3000
        });
        return;
    }

    // Kiểm tra giá trị giảm phải > 0 và <= 100
    if (giaTriPercent.value <= 0) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Giá trị giảm phải lớn hơn 0',
            life: 3000
        });
        return;
    }

    if (giaTriPercent.value > 100) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Giá trị giảm không được vượt quá 100%',
            life: 3000
        });
        return;
    }

    // Validate ngày bắt đầu
    if (!khuyenMai.value.ngayBatDau) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Ngày bắt đầu là bắt buộc',
            life: 3000
        });
        return;
    }

    // Validate ngày kết thúc
    if (!khuyenMai.value.ngayKetThuc) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Ngày kết thúc là bắt buộc',
            life: 3000
        });
        return;
    }

    // Kiểm tra ngày kết thúc phải sau ngày bắt đầu
    if (new Date(khuyenMai.value.ngayKetThuc) <= new Date(khuyenMai.value.ngayBatDau)) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Ngày kết thúc phải sau ngày bắt đầu',
            life: 3000
        });
        return;
    }

    try {
        // Chuyển đổi từ % sang decimal (15% -> 0.15)
        khuyenMai.value.giaTri = giaTriPercent.value / 100;
        
        if (khuyenMai.value.id) {
            await axios.put(`http://localhost:8080/khuyen-mai/${khuyenMai.value.id}`, khuyenMai.value);
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Cập nhật khuyến mãi thành công',
                life: 3000
            });
        } else {
            khuyenMai.value.maKhuyenMai = khuyenMai.value.maKhuyenMai || createId();
            await axios.post('http://localhost:8080/khuyen-mai', khuyenMai.value);
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Thêm khuyến mãi thành công',
                life: 3000
            });
        }
        await fetchData();
        khuyenMaiDialog.value = false;
        khuyenMai.value = {};
        giaTriPercent.value = 0;
    } catch (error) {
        console.error('Error saving promotion:', error.response?.data || error.message);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.response?.data?.message || 'Có lỗi xảy ra khi lưu khuyến mãi',
            life: 3000
        });
    }
}

function editKhuyenMai(km) {
    khuyenMai.value = { ...km };
    
    // Chuyển đổi từ decimal sang % để hiển thị (0.15 -> 15)
    // Đảm bảo giá trị hợp lệ khi edit
    if (km.giaTri != null && km.giaTri > 0) {
        giaTriPercent.value = Math.round(km.giaTri * 100);
    } else {
        giaTriPercent.value = 1; // Giá trị mặc định là 1% thay vì 0
    }
    
    // Convert date strings to Date objects for Calendar
    if (khuyenMai.value.ngayBatDau) {
        khuyenMai.value.ngayBatDau = new Date(khuyenMai.value.ngayBatDau);
    }
    if (khuyenMai.value.ngayKetThuc) {
        khuyenMai.value.ngayKetThuc = new Date(khuyenMai.value.ngayKetThuc);
    }
    
    // Reset validation state
    submitted.value = false;
    khuyenMaiDialog.value = true;
}

function confirmDeleteKhuyenMai(km) {
    khuyenMai.value = km;
    deleteKhuyenMaiDialog.value = true;
}

async function deleteKhuyenMai() {
    try {
        await axios.delete(`http://localhost:8080/khuyen-mai/${khuyenMai.value.id}`);
        await fetchData();
        deleteKhuyenMaiDialog.value = false;
        khuyenMai.value = {};
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa khuyến mãi thành công',
            life: 3000
        });
    } catch (error) {
        console.error('Error deleting promotion:', error.response?.data || error.message);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.response?.data?.message || 'Có lỗi xảy ra khi xóa khuyến mãi',
            life: 3000
        });
    }
}

async function changeStatus(km) {
    try {
        const newStatus = km.trangThai === 1 ? 0 : 1;
        await axios.put(`http://localhost:8080/khuyen-mai/${km.id}`, {
            ...km,
            trangThai: newStatus
        });
        await fetchData();
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã ${newStatus === 1 ? 'kích hoạt' : 'ngưng'} khuyến mãi`,
            life: 3000
        });
    } catch (error) {
        console.error('Error changing status:', error.response?.data || error.message);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.response?.data?.message || 'Có lỗi xảy ra khi thay đổi trạng thái',
            life: 3000
        });
    }
}

function confirmDeleteSelected() {
    deleteKhuyenMaisDialog.value = true;
}

async function deleteSelectedKhuyenMais() {
    try {
        for (const km of selectedKhuyenMai.value) {
            await axios.delete(`http://localhost:8080/khuyen-mai/${km.id}`);
        }
        await fetchData();
        deleteKhuyenMaisDialog.value = false;
        selectedKhuyenMai.value = null;
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa các khuyến mãi thành công',
            life: 3000
        });
    } catch (error) {
        console.error('Error deleting promotions:', error.response?.data || error.message);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.response?.data?.message || 'Có lỗi xảy ra khi xóa khuyến mãi',
            life: 3000
        });
    }
}

// function exportCSV() {
//     dt.value.exportCSV();
// }
function exportCSV() {
    try {
        // If no data, show warning
        if (!khuyenMais.value || khuyenMais.value.length === 0) {
            toast.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Không có dữ liệu để xuất',
                life: 3000
            });
            return;
        }

        // Create CSV headers with Vietnamese labels
        const headers = ['ID', 'Mã Khuyến Mãi', 'Tên Khuyến Mãi','Ngày Bắt Đầu','Ngày Kết Thúc', 'Trạng Thái'];
        
        // Convert data to CSV format
        const csvData = khuyenMais.value.map(item => {
            return [
                item.id || '',
                item.maKhuyenMai || '',
                item.tenKhuyenMai || '',
                item.ngayBatDau || '',
                item.ngayKetThuc || '',
                item.trangThai === 1 ? 'Còn hạn' : 'Hết hạn'
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
            const filename = `KhuyenMai-${dateStr}.csv`;

            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show success message
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã xuất ${khuyenMais.value.length} bản ghi ra file CSV`,
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

function createId() {
    let id = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 5; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}
</script>

<style scoped>
.card {
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.grid {
    display: grid;
}

.grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.gap-4 {
    gap: 1rem;
}

.border-2 {
    border-width: 2px;
}

.border-gray-200 {
    border-color: #e5e7eb;
}

.rounded-lg {
    border-radius: 0.5rem;
}

.p-4 {
    padding: 1rem;
}

.mb-4 {
    margin-bottom: 1rem;
}

.mb-1 {
    margin-bottom: 0.25rem;
}

.text-lg {
    font-size: 1.125rem;
}

.font-bold {
    font-weight: 700;
}

.font-semibold {
    font-weight: 600;
}

.font-medium {
    font-weight: 500;
}

.text-primary {
    color: var(--primary-color);
}

.text-gray-700 {
    color: #374151;
}

.text-gray-800 {
    color: #1f2937;
}

.text-red-600 {
    color: #dc2626;
}

.text-blue-600 {
    color: #2563eb;
}

.text-green-600 {
    color: #16a34a;
}

.block {
    display: block;
}

.mr-2 {
    margin-right: 0.5rem;
}
</style>