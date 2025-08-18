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

        <!-- DIALOG THÊM/SỬA VOUCHER với validation cải thiện -->
        <Dialog v-model:visible="voucherDialog" :style="{ width: '600px' }" header="Chi tiết Voucher" :modal="true">
            <div class="flex flex-col gap-6">
                <!-- Mã Voucher -->
                <div>
                    <label for="maVoucher" class="mb-3 block font-bold">Mã Voucher</label>
                    <InputText 
                        id="maVoucher" 
                        v-model.trim="voucher.maVoucher" 
                        fluid 
                        readonly="true" 
                        class="bg-gray-50"
                    />
                    <small class="text-gray-500">Mã sẽ được tạo tự động</small>
                </div>

                <!-- Tên Voucher -->
                <div>
                    <label for="tenVoucher" class="mb-3 block font-bold">
                        Tên Voucher <span class="text-red-500">*</span>
                    </label>
                    <InputText 
                        id="tenVoucher" 
                        v-model.trim="voucher.tenVoucher" 
                        required="true" 
                        :invalid="submitted && (!voucher.tenVoucher || duplicateErrors.tenVoucher)" 
                        fluid 
                        @blur="validateField('tenVoucher')"
                        @input="() => { if (submitted) validateField('tenVoucher') }"
                        placeholder="Nhập tên voucher..."
                    />
                    <small v-if="submitted && !voucher.tenVoucher" class="text-red-500">
                        Tên voucher là bắt buộc.
                    </small>
                    <small v-else-if="submitted && duplicateErrors.tenVoucher" class="text-red-500">
                        {{ duplicateErrors.tenVoucher }}
                    </small>
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

                <!-- Loại Giảm Giá -->
                <div>
                    <label for="loaiGiamGia" class="mb-3 block font-bold">
                        Loại giảm giá <span class="text-red-500">*</span>
                    </label>
                    <Select
                        id="loaiGiamGia"
                        v-model="voucher.loaiGiamGia"
                        :options="discountTypes"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Chọn loại giảm giá..."
                        fluid
                        :invalid="submitted && !voucher.loaiGiamGia"
                        @change="validateField('loaiGiamGia')"
                    />
                    <small v-if="submitted && !voucher.loaiGiamGia" class="text-red-500">
                        Loại giảm giá là bắt buộc.
                    </small>
                </div>

                <!-- Giá Trị Giảm (theo loại) -->
                <div v-if="voucher.loaiGiamGia === 'PHAN_TRAM'">
                    <label for="giaTriGiam" class="mb-3 block font-bold">
                        Phần trăm giảm (1% - 100%) <span class="text-red-500">*</span>
                    </label>
                    <InputNumber
                        id="giaTriGiam" 
                        v-model="voucher.giaTriGiam" 
                        fluid 
                        :min="1" 
                        :max="100" 
                        suffix="%"
                        :invalid="submitted && (!isValidNumber(voucher.giaTriGiam) || voucher.giaTriGiam <= 0 || voucher.giaTriGiam > 100)"
                        @blur="validateField('giaTriGiam')"
                        placeholder="Nhập % giảm..."
                    />
                    <small v-if="submitted && (!isValidNumber(voucher.giaTriGiam) || voucher.giaTriGiam <= 0 || voucher.giaTriGiam > 100)" class="text-red-500">
                        Phần trăm giảm phải từ 1% đến 100%.
                    </small>
                </div>

                <div v-else-if="voucher.loaiGiamGia === 'SO_TIEN_CO_DINH'">
                    <label for="giaTriGiam" class="mb-3 block font-bold">
                        Số tiền giảm (VND) <span class="text-red-500">*</span>
                    </label>
                    <InputText
                        id="giaTriGiam" 
                        v-model="voucher.giaTriGiam" 
                        fluid 
                        :min="1000"
                        :max="99999999"
                        mode="currency"
                        currency="VND"
                        locale="vi-VN"
                        :invalid="submitted && (!isValidNumber(voucher.giaTriGiam) || voucher.giaTriGiam <= 0 || voucher.giaTriGiam >= 100000000)"
                        @blur="validateField('giaTriGiam')"
                        placeholder="Nhập số tiền giảm..."
                    />
                    <small v-if="submitted && (!isValidNumber(voucher.giaTriGiam) || voucher.giaTriGiam <= 0)" class="text-red-500">
                        Số tiền giảm phải lớn hơn 0.
                    </small>
                    <small v-else-if="submitted && voucher.giaTriGiam >= 100000000" class="text-red-500">
                        Số tiền giảm phải < 100,000,000 VND.
                    </small>
                </div>

                <!-- Đơn hàng tối thiểu và Giảm tối đa -->
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="giaTriGiamToiThieu" class="mb-3 block font-bold">
                            Đơn hàng tối thiểu (VND) <span class="text-red-500">*</span>
                        </label>
                        <InputText 
                            id="giaTriGiamToiThieu" 
                            v-model="voucher.giaTriGiamToiThieu" 
                            fluid 
                            :min="0"
                            :max="99999999"
                            mode="currency"
                            currency="VND"
                            locale="vi-VN"
                            :invalid="submitted && (!isValidNumber(voucher.giaTriGiamToiThieu) || voucher.giaTriGiamToiThieu < 0 || voucher.giaTriGiamToiThieu >= 100000000)"
                            @blur="validateField('giaTriGiamToiThieu')"
                            placeholder="Nhập giá trị đơn hàng tối thiểu..."
                        />
                        <small v-if="submitted && (!isValidNumber(voucher.giaTriGiamToiThieu) || voucher.giaTriGiamToiThieu < 0)" class="text-red-500">
                            Giá trị đơn hàng tối thiểu là bắt buộc và phải ≥ 0.
                        </small>
                        <small v-else-if="submitted && voucher.giaTriGiamToiThieu >= 100000000" class="text-red-500">
                            Giá trị phải < 100,000,000 VND.
                        </small>
                    </div>
                    <div class="col-span-6">
                        <label for="giaTriGiamToiDa" class="mb-3 block font-bold">
                            Giảm tối đa (VND) <span class="text-red-500">*</span>
                        </label>
                        <InputText 
                            id="giaTriGiamToiDa" 
                            v-model="voucher.giaTriGiamToiDa" 
                            fluid 
                            :min="1000"
                            :max="99999999"
                            mode="currency"
                            currency="VND"
                            locale="vi-VN"
                            :invalid="submitted && (!isValidNumber(voucher.giaTriGiamToiDa) || voucher.giaTriGiamToiDa <= 0 || voucher.giaTriGiamToiDa >= 100000000)"
                            @blur="validateField('giaTriGiamToiDa')"
                            placeholder="Nhập giá trị giảm tối đa..."
                        />
                        <small v-if="submitted && (!isValidNumber(voucher.giaTriGiamToiDa) || voucher.giaTriGiamToiDa <= 0)" class="text-red-500">
                            Giá trị giảm tối đa là bắt buộc và phải > 0.
                        </small>
                        <small v-else-if="submitted && voucher.giaTriGiamToiDa >= 100000000" class="text-red-500">
                            Giá trị phải < 100,000,000 VND.
                        </small>
                    </div>
                </div>

                <!-- Số Lượng -->
                <div>
                    <label for="soLuong" class="mb-3 block font-bold">
                        Số lượng <span class="text-red-500">*</span>
                    </label>
                    <InputText
                        id="soLuong"
                        v-model="voucher.soLuong"
                        fluid
                        :min="1"
                        :max="99999"
                        :invalid="submitted && (!isValidNumber(voucher.soLuong) || voucher.soLuong <= 0 || voucher.soLuong >= 100000)"
                        @blur="validateField('soLuong')"
                        placeholder="Nhập số lượng voucher (1-99,999)..."
                    />
                    <small v-if="submitted && (!isValidNumber(voucher.soLuong) || voucher.soLuong <= 0)" class="text-red-500">
                        Số lượng là bắt buộc và phải > 0.
                    </small>
                    <small v-else-if="submitted && voucher.soLuong >= 100000" class="text-red-500">
                        Số lượng phải < 100,000.
                    </small>
                </div>

                <!-- Ngày bắt đầu và Ngày kết thúc -->
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="ngayBatDau" class="mb-3 block font-bold">
                            Ngày bắt đầu <span class="text-red-500">*</span>
                        </label>
                        <Calendar 
                            id="ngayBatDau" 
                            v-model="voucher.ngayBatDau" 
                            showIcon 
                            fluid 
                            dateFormat="dd/mm/yy" 
                            :invalid="submitted && !voucher.ngayBatDau"
                            @date-select="validateField('ngayBatDau')"
                            placeholder="Chọn ngày bắt đầu..."
                        />
                        <small v-if="submitted && !voucher.ngayBatDau" class="text-red-500">
                            Ngày bắt đầu là bắt buộc.
                        </small>
                    </div>
                    <div class="col-span-6">
                        <label for="ngayKetThuc" class="mb-3 block font-bold">
                            Ngày kết thúc <span class="text-red-500">*</span>
                        </label>
                        <Calendar 
                            id="ngayKetThuc" 
                            v-model="voucher.ngayKetThuc" 
                            showIcon 
                            fluid 
                            dateFormat="dd/mm/yy" 
                            :invalid="submitted && !voucher.ngayKetThuc"
                            @date-select="validateField('ngayKetThuc')"
                            placeholder="Chọn ngày kết thúc..."
                        />
                        <small v-if="submitted && !voucher.ngayKetThuc" class="text-red-500">
                            Ngày kết thúc là bắt buộc.
                        </small>
                    </div>
                </div>

                <!-- Trạng Thái -->
                <div>
                    <label for="trangThai" class="mb-3 block font-bold">
                        Trạng thái <span class="text-red-500">*</span>
                    </label>
                    <Select 
                        id="trangThai" 
                        v-model="voucher.trangThai" 
                        :options="statuses" 
                        optionLabel="label" 
                        optionValue="value" 
                        placeholder="Chọn trạng thái..." 
                        fluid 
                        :invalid="submitted && voucher.trangThai == null"
                    />
                    <small v-if="submitted && voucher.trangThai == null" class="text-red-500">
                        Trạng thái là bắt buộc.
                    </small>
                </div>
            </div>

            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" :disabled="loading" />
                <Button 
                    label="Lưu" 
                    icon="pi pi-check" 
                    @click="saveVoucher" 
                    :loading="uploading || loading"
                    :disabled="uploading || loading"
                />
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
import { InputText } from 'primevue';
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

// Thêm ref để lưu trữ lỗi trùng lặp
const duplicateErrors = ref({
    maVoucher: '',
    tenVoucher: ''
});

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

// ===== DUPLICATE CHECK FUNCTIONS =====
// Hàm kiểm tra trùng lặp
function checkDuplicate() {
    // Reset lỗi trước khi kiểm tra
    duplicateErrors.value = {
        maVoucher: '',
        tenVoucher: ''
    };

    if (!voucher.value.maVoucher && !voucher.value.tenVoucher) {
        return;
    }

    // Kiểm tra trùng mã voucher
    if (voucher.value.maVoucher) {
        const existingMa = vouchers.value.find(item => 
            item.maVoucher === voucher.value.maVoucher && 
            item.id !== voucher.value.id
        );
        if (existingMa) {
            duplicateErrors.value.maVoucher = 'Mã voucher đã tồn tại';
        }
    }

    // Kiểm tra trùng tên voucher
    if (voucher.value.tenVoucher) {
        const existingTen = vouchers.value.find(item => 
            item.tenVoucher.toLowerCase().trim() === voucher.value.tenVoucher.toLowerCase().trim() && 
            item.id !== voucher.value.id
        );
        if (existingTen) {
            duplicateErrors.value.tenVoucher = 'Tên voucher đã tồn tại';
        }
    }
}

// Hàm kiểm tra validation trước khi lưu
function validateVoucherDuplicates() {
    // Kiểm tra trùng lặp
    checkDuplicate();
    
    // Kiểm tra có lỗi trùng lặp không
    const hasDuplicateError = duplicateErrors.value.maVoucher || duplicateErrors.value.tenVoucher;
    
    return !hasDuplicateError;
}

// ===== VALIDATION FUNCTIONS =====
function validateVoucherForm() {
    const errors = [];
    
    // Helper function để kiểm tra số
    const isValidNumber = (value) => {
        return value !== null && value !== undefined && value !== '' && !isNaN(value);
    };
    
    // Kiểm tra tên voucher
    if (!voucher.value.tenVoucher || !voucher.value.tenVoucher.trim()) {
        errors.push('Tên voucher là bắt buộc');
    }
    
    // Kiểm tra loại giảm giá
    if (!voucher.value.loaiGiamGia) {
        errors.push('Loại giảm giá là bắt buộc');
    }
    
    // Kiểm tra giá trị giảm theo loại
    if (voucher.value.loaiGiamGia === 'PHAN_TRAM') {
        if (!isValidNumber(voucher.value.giaTriGiam) || voucher.value.giaTriGiam <= 0 || voucher.value.giaTriGiam > 100) {
            errors.push('Phần trăm giảm phải từ 1% đến 100%');
        }
    } else if (voucher.value.loaiGiamGia === 'SO_TIEN_CO_DINH') {
        if (!isValidNumber(voucher.value.giaTriGiam) || voucher.value.giaTriGiam <= 0) {
            errors.push('Số tiền giảm phải lớn hơn 0');
        } else if (voucher.value.giaTriGiam >= 100000000) {
            errors.push('Số tiền giảm phải < 100,000,000 VND');
        }
    }
    
    // Kiểm tra giá trị đơn hàng tối thiểu - BẮT BUỘC PHẢI NHẬP
    if (!isValidNumber(voucher.value.giaTriGiamToiThieu) || voucher.value.giaTriGiamToiThieu < 0) {
        errors.push('Giá trị đơn hàng tối thiểu là bắt buộc và phải ≥ 0');
    } else if (voucher.value.giaTriGiamToiThieu >= 100000000) {
        errors.push('Giá trị đơn hàng tối thiểu phải < 100,000,000 VND');
    }
    
    // Kiểm tra giá trị giảm tối đa - BẮT BUỘC PHẢI NHẬP
    if (!isValidNumber(voucher.value.giaTriGiamToiDa) || voucher.value.giaTriGiamToiDa <= 0) {
        errors.push('Giá trị giảm tối đa là bắt buộc và phải > 0');
    } else if (voucher.value.giaTriGiamToiDa >= 100000000) {
        errors.push('Giá trị giảm tối đa phải < 100,000,000 VND');
    }
    
    // Kiểm tra logic nghiệp vụ cho số tiền cố định
    if (voucher.value.loaiGiamGia === 'SO_TIEN_CO_DINH') {
        if (isValidNumber(voucher.value.giaTriGiamToiDa) && isValidNumber(voucher.value.giaTriGiamToiThieu) && 
            voucher.value.giaTriGiamToiDa > voucher.value.giaTriGiamToiThieu && voucher.value.giaTriGiamToiThieu > 0) {
            errors.push('Số tiền giảm cố định không được lớn hơn giá trị đơn hàng tối thiểu');
        }
    }
    
    // Kiểm tra số lượng - BẮT BUỘC PHẢI NHẬP và trong khoảng 1-99,999
    if (!isValidNumber(voucher.value.soLuong) || voucher.value.soLuong <= 0) {
        errors.push('Số lượng là bắt buộc và phải > 0');
    } else if (voucher.value.soLuong >= 100000) {
        errors.push('Số lượng phải < 100,000');
    }
    
    // Kiểm tra ngày bắt đầu
    if (!voucher.value.ngayBatDau) {
        errors.push('Ngày bắt đầu là bắt buộc');
    }
    
    // Kiểm tra ngày kết thúc
    if (!voucher.value.ngayKetThuc) {
        errors.push('Ngày kết thúc là bắt buộc');
    }
    
    // Kiểm tra logic ngày
    if (voucher.value.ngayBatDau && voucher.value.ngayKetThuc) {
        if (new Date(voucher.value.ngayBatDau) >= new Date(voucher.value.ngayKetThuc)) {
            errors.push('Ngày bắt đầu phải trước ngày kết thúc');
        }
    }
    
    // Kiểm tra trạng thái
    if (voucher.value.trangThai == null) {
        errors.push('Trạng thái là bắt buộc');
    }
    
    return errors;
}

function validateField(fieldName) {
    switch (fieldName) {
        case 'tenVoucher':
            if (voucher.value.tenVoucher && voucher.value.tenVoucher.trim()) {
                checkDuplicate();
            }
            break;
        case 'loaiGiamGia':
            // Reset giá trị giảm khi thay đổi loại
            onDiscountTypeChange();
            break;
        case 'giaTriGiam':
        case 'giaTriGiamToiThieu':
        case 'giaTriGiamToiDa':
        case 'soLuong':
            // Validation số sẽ được xử lý bởi component
            break;
        case 'ngayBatDau':
        case 'ngayKetThuc':
            // Validation ngày sẽ được kiểm tra trong hàm chính
            break;
    }
}

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

// Helper function để kiểm tra số hợp lệ
function isValidNumber(value) {
    return value !== null && value !== undefined && value !== '' && !isNaN(value);
}

// ===== DIALOG FUNCTIONS =====
function openNew() {
    voucher.value = {
        maVoucher: createId(),
        tenVoucher: '',
        duongDanHinhAnh: '',
        loaiGiamGia: null,
        giaTriGiam: null,
        giaTriGiamToiThieu: null,
        giaTriGiamToiDa: null,
        soLuong: null,
        ngayBatDau: null,
        ngayKetThuc: null,
        trangThai: 1
    };

    clearFile();
    submitted.value = false;
    // Reset lỗi trùng lặp
    duplicateErrors.value = {
        maVoucher: '',
        tenVoucher: ''
    };
    voucherDialog.value = true;
}

function hideDialog() {
    voucherDialog.value = false;
    submitted.value = false;
    clearFile();
    // Reset lỗi trùng lặp
    duplicateErrors.value = {
        maVoucher: '',
        tenVoucher: ''
    };
}

function editVoucher(voucherData) {
    voucher.value = {
        ...voucherData,
        giaTriGiam: voucherData.giaTriGiam ?? null,
        giaTriGiamToiThieu: voucherData.giaTriGiamToiThieu ?? null,
        giaTriGiamToiDa: voucherData.giaTriGiamToiDa ?? null,
        soLuong: voucherData.soLuong ?? null,
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
    // Reset lỗi trùng lặp khi edit
    duplicateErrors.value = {
        maVoucher: '',
        tenVoucher: ''
    };
    voucherDialog.value = true;
}

function onDiscountTypeChange() {
    if (voucher.value.loaiGiamGia === 'SO_TIEN_CO_DINH') {
        // Reset về null để trigger validation
        voucher.value.giaTriGiam = null;
    } else if (voucher.value.loaiGiamGia === 'PHAN_TRAM') {
        // Reset về null để trigger validation
        voucher.value.giaTriGiam = null;
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

// ===== IMPROVED SAVE VOUCHER FUNCTION =====
async function saveVoucher() {
    submitted.value = true;

    // Kiểm tra validation form
    const formErrors = validateVoucherForm();
    
    // Kiểm tra trùng lặp
    if (!validateVoucherDuplicates()) {
        formErrors.push('Voucher đã tồn tại');
    }

    // Nếu có lỗi, hiển thị thông báo chi tiết
    if (formErrors.length > 0) {
        const errorMessage = formErrors.length === 1 
            ? formErrors[0] 
            : `Vui lòng kiểm tra lại:\n• ${formErrors.join('\n• ')}`;
            
        toast.add({
            severity: 'warn',
            summary: 'Không để trống thông tin ',
            detail: errorMessage,
            life: 5000
        });
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
        
        // Xử lý lỗi từ server
        let errorMessage = 'Lưu voucher thất bại';
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.response?.status === 409) {
            errorMessage = 'Dữ liệu bị trùng lặp';
        } else if (error.response?.data) {
            errorMessage = error.response.data;
        }
        
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: errorMessage,
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