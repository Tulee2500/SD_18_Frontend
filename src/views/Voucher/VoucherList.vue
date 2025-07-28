<template>
    <div class="card">
        <Toast />
        <Toolbar class="mb-4">
            <template #start>
                <Button label="Thêm mới" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" :loading="loading" />
                <Button label="Xóa" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedVouchers || !selectedVouchers.length" :loading="loading" />
            </template>
            <template #end>
                <Button label="Xuất CSV" icon="pi pi-upload" severity="primary" @click="exportCSV" :loading="loading" />
            </template>
        </Toolbar>

        <DataTable
            ref="dt"
            v-model:selection="selectedVouchers"
            :value="vouchers"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} voucher"
        >
            <template #header>
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <h4 class="m-0">🎫 Quản lý Voucher</h4>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Tìm kiếm..." />
                    </IconField>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="ID" sortable style="min-width: 8rem"></Column>
            <Column field="maVoucher" header="Mã Voucher" sortable style="min-width: 12rem"></Column>
            <Column field="tenVoucher" header="Tên Voucher" sortable style="min-width: 16rem"></Column>

            <!-- CỘT HÌNH ẢNH (FIXED) -->
            <Column header="Hình ảnh" style="min-width: 12rem">
                <template #body="slotProps">
                    <div class="flex justify-center">
                        <img
                            v-if="slotProps.data.duongDanHinhAnh"
                            :src="`http://localhost:8080${slotProps.data.duongDanHinhAnh}`"
                            :alt="slotProps.data.tenVoucher"
                            class="h-16 w-16 cursor-pointer rounded border object-cover shadow-sm transition-transform hover:scale-105"
                            @click="previewImage(slotProps.data)"
                            @error="handleImageError($event)"
                        />
                        <div v-else class="flex h-16 w-16 items-center justify-center rounded border bg-gray-100">
                            <i class="pi pi-image text-gray-400"></i>
                        </div>
                    </div>
                </template>
            </Column>

            <Column field="loaiGiamGia" header="Loại giảm giá" sortable style="min-width: 12rem"></Column>
            <Column field="giaTriGiam" header="Giá trị giảm" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    <span v-if="slotProps.data.loaiGiamGia === 'PHAN_TRAM'">{{ slotProps.data.giaTriGiam }}%</span>
                    <span v-else>{{ formatCurrency(slotProps.data.giaTriGiam) }}</span>
                </template>
            </Column>
            <Column field="giaTriGiamToiThieu" header="Đơn hàng tối thiểu" sortable style="min-width: 12rem">
                <template #body="slotProps">{{ formatCurrency(slotProps.data.giaTriGiamToiThieu) }}</template>
            </Column>
            <Column field="giaTriGiamToiDa" header="Giảm tối đa" sortable style="min-width: 12rem">
                <template #body="slotProps">{{ formatCurrency(slotProps.data.giaTriGiamToiDa) }}</template>
            </Column>
            <Column field="soLuong" header="Số lượng" sortable style="min-width: 10rem"></Column>
            <Column field="ngayBatDau" header="Ngày bắt đầu" sortable style="min-width: 12rem">
                <template #body="slotProps">{{ formatDate(slotProps.data.ngayBatDau) }}</template>
            </Column>
            <Column field="ngayKetThuc" header="Ngày kết thúc" sortable style="min-width: 12rem">
                <template #body="slotProps">{{ formatDate(slotProps.data.ngayKetThuc) }}</template>
            </Column>
            <Column field="trangThai" header="Trạng thái" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.trangThai === 1 ? 'Còn hạn' : 'Hết hạn'" :severity="getStatusLabel(slotProps.data.trangThai)" />
                </template>
            </Column>
            <Column :exportable="false" style="width: 10rem">
                <template #body="slotProps">
                    <div class="flex justify-center gap-2">
                        <Button icon="pi pi-pencil" outlined rounded size="small" @click="editVoucher(slotProps.data)" :disabled="loading" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" size="small" @click="confirmDeleteVoucher(slotProps.data)" :disabled="loading" />
                        <Button icon="pi pi-refresh" outlined rounded severity="secondary" size="small" @click="changeStatus(slotProps.data)" :disabled="loading" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- DIALOG THÊM/SỬA VOUCHER -->
        <Dialog v-model:visible="voucherDialog" :style="{ width: '600px' }" header="Chi tiết Voucher" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="maVoucher" class="mb-3 block font-bold">Mã Voucher</label>
                    <InputText id="maVoucher" v-model.trim="voucher.maVoucher" required="true" autofocus :invalid="submitted && !voucher.maVoucher" fluid readonly="true" />
                    <small v-if="submitted && !voucher.maVoucher" class="text-red-500">Mã Voucher là bắt buộc.</small>
                </div>

                <div>
                    <label for="tenVoucher" class="mb-3 block font-bold">Tên Voucher</label>
                    <InputText id="tenVoucher" v-model.trim="voucher.tenVoucher" required="true" :invalid="submitted && !voucher.tenVoucher" fluid />
                    <small v-if="submitted && !voucher.tenVoucher" class="text-red-500">Tên Voucher là bắt buộc.</small>
                </div>

                <!-- PHẦN UPLOAD FILE -->
                <div>
                    <label class="mb-3 block font-bold">Hình ảnh voucher</label>
                    <div class="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-blue-400" @click="$refs.fileInput.click()">
                        <input type="file" ref="fileInput" @change="handleFileSelect" accept="image/*" class="hidden" />

                        <!-- Hiển thị hình ảnh preview -->
                        <div v-if="imagePreview" class="mb-4">
                            <img :src="imagePreview" alt="Preview" class="mx-auto max-h-48 max-w-full rounded border shadow-sm" />
                            <p class="mt-2 text-sm text-gray-600">{{ selectedFileName }}</p>
                        </div>

                        <!-- Nút chọn file -->
                        <div v-else class="mb-4">
                            <i class="pi pi-cloud-upload mb-4 text-4xl text-gray-400"></i>
                            <p class="text-gray-600">Nhấn để chọn hình ảnh</p>
                            <p class="text-sm text-gray-400">JPG, PNG, GIF, WEBP (Tối đa 5MB)</p>
                        </div>

                        <div class="flex justify-center gap-2" @click.stop>
                            <Button label="Chọn file" icon="pi pi-upload" @click="$refs.fileInput.click()" severity="secondary" />
                            <Button v-if="imagePreview" label="Xóa" icon="pi pi-times" @click="clearFile" severity="danger" outlined />
                        </div>
                    </div>
                </div>

                <div>
                    <label for="loaiGiamGia" class="mb-3 block font-bold">Loại giảm giá</label>
                    <Select
                        id="loaiGiamGia"
                        v-model="voucher.loaiGiamGia"
                        :options="discountTypes"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Chọn loại giảm giá"
                        fluid
                        :invalid="submitted && !voucher.loaiGiamGia"
                        @change="onDiscountTypeChange"
                    />
                    <small v-if="submitted && !voucher.loaiGiamGia" class="text-red-500">Loại giảm giá là bắt buộc.</small>
                </div>

                <div v-if="voucher.loaiGiamGia === 'PHAN_TRAM'">
                    <label for="giaTriGiam" class="mb-3 block font-bold">Phần trăm giảm (1% - 100%)</label>
                    <InputText id="giaTriGiam" v-model.number="voucher.giaTriGiam" fluid :min="1" :max="100" :invalid="submitted && (!voucher.giaTriGiam || voucher.giaTriGiam <= 0 || voucher.giaTriGiam > 100)" />
                    <small v-if="submitted && (!voucher.giaTriGiam || voucher.giaTriGiam <= 0 || voucher.giaTriGiam > 100)" class="text-red-500">Phần trăm giảm phải từ 1% đến 100%.</small>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="giaTriGiamToiThieu" class="mb-3 block font-bold">Đơn hàng tối thiểu (VND)</label>
                        <InputText id="giaTriGiamToiThieu" v-model.number="voucher.giaTriGiamToiThieu" fluid :min="0" :invalid="submitted && (voucher.giaTriGiamToiThieu == null || voucher.giaTriGiamToiThieu < 0)" />
                        <small v-if="submitted && (voucher.giaTriGiamToiThieu == null || voucher.giaTriGiamToiThieu < 0)" class="text-red-500">Giá trị không hợp lệ.</small>
                    </div>
                    <div class="col-span-6">
                        <label for="giaTriGiamToiDa" class="mb-3 block font-bold">Giảm tối đa (VND)</label>
                        <InputText id="giaTriGiamToiDa" v-model.number="voucher.giaTriGiamToiDa" fluid :min="0" :invalid="submitted && (voucher.giaTriGiamToiDa == null || voucher.giaTriGiamToiDa < 0)" />
                        <small v-if="submitted && (voucher.giaTriGiamToiDa == null || voucher.giaTriGiamToiDa < 0)" class="text-red-500">Giá trị không hợp lệ.</small>
                    </div>
                </div>

                <div>
                    <label for="soLuong" class="mb-3 block font-bold">Số lượng</label>
                    <InputText id="soLuong" v-model.number="voucher.soLuong" fluid :min="0" :invalid="submitted && (voucher.soLuong == null || voucher.soLuong < 0)" />
                    <small v-if="submitted && (voucher.soLuong == null || voucher.soLuong < 0)" class="text-red-500">Số lượng không hợp lệ.</small>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="ngayBatDau" class="mb-3 block font-bold">Ngày bắt đầu</label>
                        <Calendar id="ngayBatDau" v-model="voucher.ngayBatDau" showIcon fluid dateFormat="dd/mm/yy" :invalid="submitted && !voucher.ngayBatDau" />
                        <small v-if="submitted && !voucher.ngayBatDau" class="text-red-500">Ngày bắt đầu là bắt buộc.</small>
                    </div>
                    <div class="col-span-6">
                        <label for="ngayKetThuc" class="mb-3 block font-bold">Ngày kết thúc</label>
                        <Calendar id="ngayKetThuc" v-model="voucher.ngayKetThuc" showIcon fluid dateFormat="dd/mm/yy" :invalid="submitted && !voucher.ngayKetThuc" />
                        <small v-if="submitted && !voucher.ngayKetThuc" class="text-red-500">Ngày kết thúc là bắt buộc.</small>
                    </div>
                </div>

                <div>
                    <label for="trangThai" class="mb-3 block font-bold">Trạng thái</label>
                    <Select id="trangThai" v-model="voucher.trangThai" :options="statuses" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" fluid :invalid="submitted && voucher.trangThai == null" />
                    <small v-if="submitted && voucher.trangThai == null" class="text-red-500">Trạng thái là bắt buộc.</small>
                </div>
            </div>

            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" :disabled="loading" />
                <Button label="Lưu" icon="pi pi-check" @click="saveVoucher" :loading="uploading || loading" />
            </template>
        </Dialog>

        <!-- DIALOG XEM HÌNH ẢNH FULL SIZE -->
        <Dialog v-model:visible="imagePreviewDialog" :style="{ width: '800px' }" header="Xem hình ảnh voucher" :modal="true">
            <div class="text-center">
                <img :src="previewImageSrc" :alt="previewImageName" class="max-h-96 max-w-full rounded object-contain shadow" />
                <div class="mt-4 text-sm text-gray-600">
                    <p><strong>Voucher:</strong> {{ previewImageName }}</p>
                    <p><strong>Đường dẫn:</strong> {{ previewImagePath }}</p>
                </div>
            </div>
        </Dialog>

        <!-- Delete confirmation dialogs -->
        <Dialog v-model:visible="deleteVoucherDialog" :style="{ width: '450px' }" header="Xác nhận" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
                <span v-if="voucher"
                    >Bạn có chắc muốn xóa voucher <b>{{ voucher.tenVoucher }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteVoucherDialog = false" :disabled="loading" />
                <Button label="Có" icon="pi pi-check" severity="danger" @click="deleteVoucher" :loading="loading" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteVouchersDialog" :style="{ width: '450px' }" header="Xác nhận" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
                <span>Bạn có chắc muốn xóa các voucher đã chọn?</span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteVouchersDialog = false" :disabled="loading" />
                <Button label="Có" icon="pi pi-check" severity="danger" @click="deleteSelectedVouchers" :loading="loading" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

// ===== REACTIVE VARIABLES =====
const toast = useToast();
const dt = ref();
const vouchers = ref([]);
const voucherDialog = ref(false);
const deleteVoucherDialog = ref(false);
const deleteVouchersDialog = ref(false);
const imagePreviewDialog = ref(false);
const voucher = ref({});
const selectedVouchers = ref();
const submitted = ref(false);
const loading = ref(false);

// CÁC REF CHO UPLOAD FILE
const fileInput = ref();
const selectedFile = ref(null);
const selectedFileName = ref('');
const imagePreview = ref('');
const uploading = ref(false);

// CÁC REF CHO PREVIEW HÌNH ẢNH
const previewImageSrc = ref('');
const previewImageName = ref('');
const previewImagePath = ref('');

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const statuses = ref([
    { label: 'Còn hạn', value: 1 },
    { label: 'Hết hạn', value: 0 }
]);

const discountTypes = ref([
    { label: 'Phần trăm', value: 'PHAN_TRAM' },
    { label: 'Số tiền cố định', value: 'SO_TIEN_CO_DINH' }
]);

// ===== LIFECYCLE =====
onMounted(() => {
    fetchData();
});

// ===== API FUNCTIONS =====
async function fetchData() {
    try {
        loading.value = true;
        const response = await axios.get('http://localhost:8080/voucher');

        console.log('📦 Fetched vouchers:', response.data);

        vouchers.value = response.data.map((item) => ({
            ...item,
            ngayBatDau: item.ngayBatDau ? new Date(item.ngayBatDau) : null,
            ngayKetThuc: item.ngayKetThuc ? new Date(item.ngayKetThuc) : null
        }));

        console.log('✅ Processed vouchers:', vouchers.value);
    } catch (error) {
        console.error('❌ Error fetching vouchers:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải danh sách voucher',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

// ===== UTILITY FUNCTIONS =====
function formatCurrency(value) {
    if (value != null) return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    return '0 ₫';
}

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function createId() {
    let id = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'V' + id;
}

function getStatusLabel(status) {
    return status === 1 ? 'success' : 'danger';
}

// ===== DIALOG FUNCTIONS =====
function openNew() {
    voucher.value = {
        maVoucher: createId(),
        tenVoucher: '',
        duongDanHinhAnh: '',
        loaiGiamGia: null,
        giaTriGiam: 0,
        giaTriGiamToiThieu: 0,
        giaTriGiamToiDa: 0,
        soLuong: 0,
        ngayBatDau: null,
        ngayKetThuc: null,
        trangThai: 1
    };

    clearFile();
    submitted.value = false;
    voucherDialog.value = true;
}

function hideDialog() {
    voucherDialog.value = false;
    submitted.value = false;
    clearFile();
}

function editVoucher(voucherData) {
    voucher.value = {
        ...voucherData,
        giaTriGiam: voucherData.giaTriGiam ?? 0,
        giaTriGiamToiThieu: voucherData.giaTriGiamToiThieu ?? 0,
        giaTriGiamToiDa: voucherData.giaTriGiamToiDa ?? 0,
        soLuong: voucherData.soLuong ?? 0,
        ngayBatDau: voucherData.ngayBatDau ? new Date(voucherData.ngayBatDau) : null,
        ngayKetThuc: voucherData.ngayKetThuc ? new Date(voucherData.ngayKetThuc) : null,
        trangThai: voucherData.trangThai ?? 1
    };

    // Reset file upload khi edit
    selectedFile.value = null;
    selectedFileName.value = '';
    imagePreview.value = '';

    // Hiển thị hình ảnh hiện có nếu có
    if (voucherData.duongDanHinhAnh) {
        imagePreview.value = `http://localhost:8080${voucherData.duongDanHinhAnh}`;
        selectedFileName.value = voucherData.tenVoucher;
    }

    submitted.value = false;
    voucherDialog.value = true;
}

function onDiscountTypeChange() {
    if (voucher.value.loaiGiamGia === 'SO_TIEN_CO_DINH') {
        voucher.value.giaTriGiam = voucher.value.giaTriGiamToiDa || 0;
    } else if (voucher.value.loaiGiamGia === 'PHAN_TRAM') {
        voucher.value.giaTriGiam = Math.min(voucher.value.giaTriGiam || 10, 100);
    }
}

// ===== FILE HANDLING =====
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Vui lòng chọn file hình ảnh (JPG, PNG, GIF, WEBP)',
            life: 3000
        });
        return;
    }

    // Kiểm tra kích thước file (5MB)
    if (file.size > 5 * 1024 * 1024) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'File không được vượt quá 5MB',
            life: 3000
        });
        return;
    }

    selectedFile.value = file;
    selectedFileName.value = file.name;

    // Tạo preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
}

function clearFile() {
    selectedFile.value = null;
    selectedFileName.value = '';
    imagePreview.value = '';
    if (fileInput.value) {
        fileInput.value.value = '';
    }
}

// UPLOAD FILE
async function uploadFile(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);

        console.log('📤 Uploading voucher image:', file.name);

        const response = await axios.post('http://localhost:8080/voucher/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        console.log('📥 Upload response:', response.data);
        return response.data.path;
    } catch (error) {
        console.error('💥 Error uploading file:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Upload file thất bại',
            life: 3000
        });
        return null;
    }
}

// ===== SAVE VOUCHER =====
async function saveVoucher() {
    submitted.value = true;

    // KIỂM TRA CƠ BẢN
    if (!voucher.value.maVoucher?.trim()) {
        toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Mã voucher là bắt buộc', life: 3000 });
        return;
    }
    if (!voucher.value.tenVoucher?.trim()) {
        toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Tên voucher là bắt buộc', life: 3000 });
        return;
    }
    if (!voucher.value.loaiGiamGia) {
        toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Loại giảm giá là bắt buộc', life: 3000 });
        return;
    }
    if (voucher.value.loaiGiamGia === 'PHAN_TRAM' && (!voucher.value.giaTriGiam || voucher.value.giaTriGiam <= 0 || voucher.value.giaTriGiam > 100)) {
        toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Phần trăm giảm phải từ 1% đến 100%', life: 3000 });
        return;
    }
    if (voucher.value.giaTriGiamToiThieu == null || voucher.value.giaTriGiamToiThieu < 0) {
        toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Giá trị đơn hàng tối thiểu phải >= 0', life: 3000 });
        return;
    }
    if (voucher.value.giaTriGiamToiDa == null || voucher.value.giaTriGiamToiDa <= 0) {
        toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Giá trị giảm tối đa phải > 0', life: 3000 });
        return;
    }

    // Validation theo loại giảm giá
    if (voucher.value.loaiGiamGia === 'SO_TIEN_CO_DINH') {
        if (voucher.value.giaTriGiamToiDa > voucher.value.giaTriGiamToiThieu && voucher.value.giaTriGiamToiThieu > 0) {
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Số tiền giảm cố định không được lớn hơn giá trị đơn hàng tối thiểu',
                life: 3000
            });
            return;
        }
    }

    if (voucher.value.soLuong == null || voucher.value.soLuong < 0) {
        toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Số lượng không hợp lệ', life: 3000 });
        return;
    }
    if (!voucher.value.ngayBatDau) {
        toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Ngày bắt đầu là bắt buộc', life: 3000 });
        return;
    }
    if (!voucher.value.ngayKetThuc) {
        toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Ngày kết thúc là bắt buộc', life: 3000 });
        return;
    }

    // Kiểm tra ngày
    if (new Date(voucher.value.ngayBatDau) >= new Date(voucher.value.ngayKetThuc)) {
        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Ngày bắt đầu phải trước ngày kết thúc',
            life: 3000
        });
        return;
    }

    if (voucher.value.trangThai == null) {
        toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Trạng thái là bắt buộc', life: 3000 });
        return;
    }

    try {
        uploading.value = true;

        // NẾU CÓ FILE MỚI, UPLOAD TRƯỚC
        if (selectedFile.value) {
            const uploadedPath = await uploadFile(selectedFile.value);
            if (uploadedPath) {
                voucher.value.duongDanHinhAnh = uploadedPath;
                console.log('✅ Image uploaded, path:', uploadedPath);
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Upload file thất bại',
                    life: 3000
                });
                return;
            }
        }

        const voucherData = {
            ...voucher.value,
            ngayBatDau: new Date(voucher.value.ngayBatDau).toISOString().split('T')[0],
            ngayKetThuc: new Date(voucher.value.ngayKetThuc).toISOString().split('T')[0]
        };

        if (voucher.value.id) {
            // CẬP NHẬT
            await axios.put(`http://localhost:8080/voucher/${voucher.value.id}`, voucherData);
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Cập nhật voucher thành công',
                life: 3000
            });
        } else {
            // THÊM MỚI
            await axios.post('http://localhost:8080/voucher', voucherData);
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Tạo voucher thành công',
                life: 3000
            });
        }

        await fetchData();
        voucherDialog.value = false;
        voucher.value = {};
        clearFile();
    } catch (error) {
        console.error('💥 Save error:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: `Lưu voucher thất bại: ${error.response?.data || error.message}`,
            life: 3000
        });
    } finally {
        uploading.value = false;
        loading.value = false;
        submitted.value = false;
    }
}

// ===== DELETE FUNCTIONS =====
function confirmDeleteVoucher(voucherData) {
    voucher.value = voucherData;
    deleteVoucherDialog.value = true;
}

async function deleteVoucher() {
    try {
        loading.value = true;
        await axios.delete(`http://localhost:8080/voucher/${voucher.value.id}`);
        await fetchData();
        deleteVoucherDialog.value = false;
        voucher.value = {};
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa voucher thành công',
            life: 3000
        });
    } catch (error) {
        console.error('💥 Delete error:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Xóa voucher thất bại',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

function confirmDeleteSelected() {
    deleteVouchersDialog.value = true;
}

async function deleteSelectedVouchers() {
    try {
        loading.value = true;
        for (const voucherItem of selectedVouchers.value) {
            await axios.delete(`http://localhost:8080/voucher/${voucherItem.id}`);
        }
        await fetchData();
        deleteVouchersDialog.value = false;
        selectedVouchers.value = null;
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa các voucher thành công',
            life: 3000
        });
    } catch (error) {
        console.error('💥 Delete multiple error:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Xóa các voucher thất bại',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

async function changeStatus(voucherData) {
    try {
        loading.value = true;
        const updatedVoucher = { ...voucherData, trangThai: voucherData.trangThai === 1 ? 0 : 1 };
        await axios.put(`http://localhost:8080/voucher/${voucherData.id}`, updatedVoucher);
        await fetchData();
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật trạng thái thành công',
            life: 3000
        });
    } catch (error) {
        console.error('💥 Status change error:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Cập nhật trạng thái thất bại',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

// ===== IMAGE PREVIEW =====
function previewImage(voucherData) {
    if (voucherData.duongDanHinhAnh) {
        previewImageSrc.value = `http://localhost:8080${voucherData.duongDanHinhAnh}`;
        previewImageName.value = voucherData.tenVoucher;
        previewImagePath.value = voucherData.duongDanHinhAnh;
        imagePreviewDialog.value = true;
    }
}

function handleImageError(event) {
    console.error('❌ Image load failed:', event.target.src);
    event.target.src = '/images/placeholder.png';
    event.target.onerror = null;
}

// ===== EXPORT CSV =====
function exportCSV() {
    try {
        if (!vouchers.value || vouchers.value.length === 0) {
            toast.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Không có dữ liệu để xuất',
                life: 3000
            });
            return;
        }

        const headers = ['ID', 'Mã Voucher', 'Tên Voucher', 'Hình Ảnh', 'Loại giảm giá', 'Giá trị giảm', 'Đơn hàng tối thiểu', 'Giảm tối đa', 'Số lượng', 'Ngày Bắt Đầu', 'Ngày Kết Thúc', 'Trạng Thái'];

        const csvData = vouchers.value.map((item) => [
            item.id || '',
            item.maVoucher || '',
            item.tenVoucher || '',
            item.duongDanHinhAnh || '',
            item.loaiGiamGia || '',
            item.loaiGiamGia === 'PHAN_TRAM' ? `${item.giaTriGiam}%` : formatCurrency(item.giaTriGiam),
            item.giaTriGiamToiThieu || 0,
            item.giaTriGiamToiDa || 0,
            item.soLuong || 0,
            formatDate(item.ngayBatDau) || '',
            formatDate(item.ngayKetThuc) || '',
            item.trangThai === 1 ? 'Còn hạn' : 'Hết hạn'
        ]);

        const csvContent = [headers, ...csvData]
            .map((row) =>
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
            const filename = `Voucher-${dateStr}.csv`;
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã xuất ${vouchers.value.length} bản ghi ra file CSV`,
                life: 3000
            });
        }
    } catch (error) {
        console.error('💥 Export error:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Xuất CSV thất bại',
            life: 3000
        });
    }
}
</script>

<style scoped>
.card {
    background: var(--surface-card);
    padding: 2rem;
    border-radius: 10px;
    margin-bottom: 1rem;
}
</style>
