
<template>
    <div class="card">
        <Toast />
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Thêm mới" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                <Button label="Xóa" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedVouchers || !selectedVouchers.length" />
            </template>
            <template #end>
                <Button label="Xuất CSV" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
            </template>
        </Toolbar>

        <DataTable
            ref="dt"
            v-model:selection="selectedVouchers"
            :value="ListVoucher"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} voucher"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">📦 Quản lý Voucher</h4>
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
            <Column field="duongDanHinhAnh" header="Hình ảnh" style="min-width: 10rem">
                <template #body="slotProps">
                    <img v-if="slotProps.data.duongDanHinhAnh" :src="slotProps.data.duongDanHinhAnh" :alt="slotProps.data.tenVoucher" class="w-16 h-16 object-cover" />
                </template>
            </Column>
            <Column field="loaiGiamGia" header="Loại giảm giá" sortable style="min-width: 12rem"></Column>
            <Column field="giaTriGiamToiThieu" header="Giảm tối thiểu" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    {{ formatCurrency(slotProps.data.giaTriGiamToiThieu) }}
                </template>
            </Column>
            <Column field="giaTriGiamToiDa" header="Giảm tối đa" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    {{ formatCurrency(slotProps.data.giaTriGiamToiDa) }}
                </template>
            </Column>
            <Column field="soLuong" header="Số lượng" sortable style="min-width: 10rem"></Column>
            <Column field="ngayBatDau" header="Ngày bắt đầu" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    {{ formatDate(slotProps.data.ngayBatDau) }}
                </template>
            </Column>
            <Column field="ngayKetThuc" header="Ngày kết thúc" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    {{ formatDate(slotProps.data.ngayKetThuc) }}
                </template>
            </Column>
            <Column field="trangThai" header="Trạng thái" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.trangThai === 1 ? 'Còn hạn' : 'Hết hạn'" :severity="getStatusLabel(slotProps.data.trangThai)" />
                </template>
            </Column>
            <Column :exportable="false" style="width: 10rem">
                <template #body="slotProps">
                    <div class="flex justify-between gap-2">
                        <Button icon="pi pi-pencil" outlined rounded size="small" @click="editVoucher(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" size="small" @click="confirmDeleteVoucher(slotProps.data)" />
                        <Button icon="pi pi-refresh" outlined rounded severity="secondary" size="small" @click="changeStatus(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="voucherDialog" :style="{ width: '450px' }" header="Chi tiết Voucher" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="maVoucher" class="block font-bold mb-3">Mã Voucher</label>
                    <InputText id="maVoucher" v-model.trim="voucher.maVoucher" required="true" autofocus :invalid="submitted && !voucher.maVoucher" fluid />
                    <small v-if="submitted && !voucher.maVoucher" class="text-red-500">Mã Voucher là bắt buộc.</small>
                </div>
                <div>
                    <label for="tenVoucher" class="block font-bold mb-3">Tên Voucher</label>
                    <InputText id="tenVoucher" v-model.trim="voucher.tenVoucher" required="true" :invalid="submitted && !voucher.tenVoucher" fluid />
                    <small v-if="submitted && !voucher.tenVoucher" class="text-red-500">Tên Voucher là bắt buộc.</small>
                </div>
                <div>
                    <label for="duongDanHinhAnh" class="block font-bold mb-3">Đường dẫn hình ảnh</label>
                    <InputText id="duongDanHinhAnh" v-model="voucher.duongDanHinhAnh" fluid />
                </div>
                <div>
                    <label for="loaiGiamGia" class="block font-bold mb-3">Loại giảm giá</label>
                    <Select id="loaiGiamGia" v-model="voucher.loaiGiamGia" :options="discountTypes" optionLabel="label" optionValue="value" placeholder="Chọn loại giảm giá" fluid />
                </div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="giaTriGiamToiThieu" class="block font-bold mb-3">Giảm tối thiểu</label>
                        <InputNumber id="giaTriGiamToiThieu" v-model="voucher.giaTriGiamToiThieu" mode="currency" currency="VND" locale="vi-VN" fluid />
                    </div>
                    <div class="col-span-6">
                        <label for="giaTriGiamToiDa" class="block font-bold mb-3">Giảm tối đa</label>
                        <InputNumber id="giaTriGiamToiDa" v-model="voucher.giaTriGiamToiDa" mode="currency" currency="VND" locale="vi-VN" fluid />
                    </div>
                </div>
                <div>
                    <label for="soLuong" class="block font-bold mb-3">Số lượng</label>
                    <InputNumber id="soLuong" v-model="voucher.soLuong" integeronly fluid />
                </div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="ngayBatDau" class="block font-bold mb-3">Ngày bắt đầu</label>
                        <Calendar id="ngayBatDau" v-model="voucher.ngayBatDau" showIcon fluid dateFormat="dd/mm/yy" />
                    </div>
                    <div class="col-span-6">
                        <label for="ngayKetThuc" class="block font-bold mb-3">Ngày kết thúc</label>
                        <Calendar id="ngayKetThuc" v-model="voucher.ngayKetThuc" showIcon fluid dateFormat="dd/mm/yy" />
                    </div>
                </div>
                <div>
                    <label for="trangThai" class="block font-bold mb-3">Trạng thái</label>
                    <Select id="trangThai" v-model="voucher.trangThai" :options="statuses" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" fluid />
                </div>
            </div>

            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Lưu" icon="pi pi-check" @click="saveVoucher" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteVoucherDialog" :style="{ width: '450px' }" header="Xác nhận" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="voucher"
                    >Bạn có chắc muốn xóa voucher <b>{{ voucher.tenVoucher }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteVoucherDialog = false" />
                <Button label="Có" icon="pi pi-check" @click="deleteVoucher" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteVouchersDialog" :style="{ width: '450px' }" header="Xác nhận" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Bạn có chắc muốn xóa các voucher đã chọn?</span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteVouchersDialog = false" />
                <Button label="Có" icon="pi pi-check" text @click="deleteSelectedVouchers" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';

const toast = useToast();
const dt = ref();
const ListVoucher = ref([]);
const voucherDialog = ref(false);
const deleteVoucherDialog = ref(false);
const deleteVouchersDialog = ref(false);
const voucher = ref({});
const selectedVouchers = ref();
const submitted = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const statuses = ref([
    { label: 'Còn hạn', value: 1 },
    { label: 'Hết hạn', value: 0 }
]);
const discountTypes = ref([
    { label: 'Phần trăm', value: 'PERCENTAGE' },
    { label: 'Số tiền cố định', value: 'FIXED_AMOUNT' }
]);

onMounted(() => {
    fetchData();
});

async function fetchData() {
    try {
        const res = await axios.get('http://localhost:8080/voucher');
        ListVoucher.value = res.data;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải danh sách voucher',
            life: 3000
        });
    }
}

function formatCurrency(value) {
    if (value) return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    return '';
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

function openNew() {
    voucher.value = {};
    submitted.value = false;
    voucherDialog.value = true;
}

function hideDialog() {
    voucherDialog.value = false;
    submitted.value = false;
}

async function saveVoucher() {
    submitted.value = true;

    if (voucher.value.maVoucher?.trim() && voucher.value.tenVoucher?.trim()) {
        try {
            if (voucher.value.id) {
                await axios.put(`http://localhost:8080/voucher/${voucher.value.id}`, voucher.value);
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Cập nhật voucher thành công',
                    life: 3000
                });
            } else {
                await axios.post('http://localhost:8080/voucher', voucher.value);
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Tạo voucher thành công',
                    life: 3000
                });
            }
            fetchData();
            voucherDialog.value = false;
            voucher.value = {};
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Lưu voucher thất bại',
                life: 3000
            });
        }
    }
}

function editVoucher(vouch) {
    voucher.value = { ...vouch };
    voucherDialog.value = true;
}

function confirmDeleteVoucher(vouch) {
    voucher.value = vouch;
    deleteVoucherDialog.value = true;
}

async function deleteVoucher() {
    try {
        await axios.delete(`http://localhost:8080/voucher/${voucher.value.id}`);
        fetchData();
        deleteVoucherDialog.value = false;
        voucher.value = {};
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa voucher thành công',
            life: 3000
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Xóa voucher thất bại',
            life: 3000
        });
    }
}

function confirmDeleteSelected() {
    deleteVouchersDialog.value = true;
}

async function deleteSelectedVouchers() {
    try {
        for (const vouch of selectedVouchers.value) {
            await axios.delete(`http://localhost:8080/voucher/${vouch.id}`);
        }
        fetchData();
        deleteVouchersDialog.value = false;
        selectedVouchers.value = null;
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa các voucher thành công',
            life: 3000
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Xóa các voucher thất bại',
            life: 3000
        });
    }
}

async function changeStatus(vouch) {
    try {
        const updatedVoucher = { ...vouch, trangThai: vouch.trangThai === 1 ? 0 : 1 };
        await axios.put(`http://localhost:8080/voucher/${vouch.id}`, updatedVoucher);
        fetchData();
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật trạng thái thành công',
            life: 3000
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Cập nhật trạng thái thất bại',
            life: 3000
        });
    }
}

function getStatusLabel(status) {
    return status === 1 ? 'success' : 'danger';
}

// function exportCSV() {
//     dt.value.exportCSV();
// }

// Chuyen thanh file CSV Voucher + date 
function exportCSV() {
    try {
        // If no data, show warning
        if (!ListVoucher.value || ListVoucher.value.length === 0) {
            toast.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Không có dữ liệu để xuất',
                life: 3000
            });
            return;
        }

        // Create CSV headers with Vietnamese labels
        const headers = ['ID', 'Mã Voucher', 'Tên Voucher','Hình Ảnh','Loại giảm giá', 'Giảm tối thiểu','Giảm tối đa','Số lượng','Ngày Bắt Đầu','Ngày Kết Thúc', 'Trạng Thái'];

        // Convert data to CSV format
        const csvData = ListVoucher.value.map(item => {
            return [
                item.id || '',
                item.maKhuyenMai || '',
                item.tenKhuyenMai || '',
                item.hinhAnh || '',
                item.loaiGiamGia || '',
                item.giamToiThieu || '',
                item.giamToiDa || '',
                item.soLuong || '',
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
            const filename = `Voucher-${dateStr}.csv`;

            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show success message
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã xuất ${ListVoucher.value.length} bản ghi ra file CSV`,
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
</script>

