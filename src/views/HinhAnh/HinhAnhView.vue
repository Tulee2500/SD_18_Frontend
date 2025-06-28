<template>
    <div class="card">
        <Toast />
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Thêm mới" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                <Button label="Xóa" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedHinhAnh || !selectedHinhAnh.length" />
            </template>
            <template #end>
                <Button label="Xuất CSV" icon="pi pi-upload" severity="secondary" @click="exportCSV" />
            </template>
        </Toolbar>

        <DataTable
            ref="dt"
            v-model:selection="selectedHinhAnh"
            :value="ListHinhAnh"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} hình ảnh"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">📋 Quản lý Hình Ảnh</h4>
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
            <Column field="maHinhAnh" header="Mã Hình Ảnh" sortable style="min-width: 12rem"></Column>
            <Column field="tenHinhAnh" header="Tên Hình Ảnh" sortable style="min-width: 16rem"></Column>
            <Column field="chiTietSanPham" header="Chi Tiết Sản Phẩm" sortable style="min-width: 16rem"></Column>
            <Column field="trangThai" header="Trạng Thái" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.trangThai === 1 ? 'Đang tải' : 'Đã tải'" :severity="getStatusLabel(slotProps.data.trangThai)" />
                </template>
            </Column>
            <Column :exportable="false" style="width: 10rem">
                <template #body="slotProps">
                    <div class="flex justify-between gap-2">
                        <Button icon="pi pi-pencil" outlined rounded size="small" @click="editHinhAnh(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" size="small" @click="confirmDeleteHinhAnh(slotProps.data)" />
                        <Button icon="pi pi-refresh" outlined rounded severity="secondary" size="small" @click="changeStatus(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="hinhAnhDialog" :style="{ width: '450px' }" header="Chi tiết Hình Ảnh" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="maHinhAnh" class="block font-bold mb-3">Mã Hình Ảnh</label>
                    <InputText id="maHinhAnh" v-model.trim="hinhAnh.maHinhAnh" required="true" autofocus :invalid="submitted && !hinhAnh.maHinhAnh" fluid />
                    <small v-if="submitted && !hinhAnh.maHinhAnh" class="text-red-500">Mã Hình Ảnh là bắt buộc.</small>
                </div>
                <div>
                    <label for="tenHinhAnh" class="block font-bold mb-3">Tên Hình Ảnh</label>
                    <InputText id="tenHinhAnh" v-model.trim="hinhAnh.tenHinhAnh" required="true" :invalid="submitted && !hinhAnh.tenHinhAnh" fluid />
                    <small v-if="submitted && !hinhAnh.tenHinhAnh" class="text-red-500">Tên Hình Ảnh là bắt buộc.</small>
                </div>
                <div>
                    <label for="chiTietSanPham" class="block font-bold mb-3">Chi Tiết Sản Phẩm</label>
                    <InputText id="chiTietSanPham" v-model.trim="hinhAnh.chiTietSanPham" required="true" :invalid="submitted && !hinhAnh.chiTietSanPham" fluid />
                    <small v-if="submitted && !hinhAnh.chiTietSanPham" class="text-red-500">Chi Tiết Sản Phẩm là bắt buộc.</small>
                </div>
                <div>
                    <label for="trangThai" class="block font-bold mb-3">Trạng Thái</label>
                    <Select id="trangThai" v-model="hinhAnh.trangThai" :options="statuses" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Lưu" icon="pi pi-check" @click="saveChatLieu" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteHinhAnhDialog" :style="{ width: '450px' }" header="Xác nhận" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="hinhAnh"
                    >Bạn có chắc muốn xóa hình ảnh <b>{{ hinhAnh.tenHinhAnh }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteHinhAnhDialog = false" />
                <Button label="Có" icon="pi pi-check" @click="deleteHinhAnh" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteHinhAnhsDialog" :style="{ width: '450px' }" header="Xác nhận" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Bạn có chắc muốn xóa các hình ảnh đã chọn?</span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteHinhAnhsDialog = false" />
                <Button label="Có" icon="pi pi-check" text @click="deleteSelectedHinhAnhs" />
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
const ListHinhAnh = ref([]);
const hinhAnhDialog = ref(false);
const deleteHinhAnhDialog = ref(false);
const deleteHinhAnhsDialog = ref(false);
const hinhAnh = ref({});
const selectedHinhAnh = ref();
const submitted = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const statuses = ref([
    { label: 'Đã tải', value: 1 },
    { label: 'Đang tải', value: 0 }
]);

onMounted(() => {
    fetchData();
});

async function fetchData() {
    try {
        const res = await axios.get('http://localhost:8080/hinh-anh');
        ListHinhAnh.value = res.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải danh sách hình ảnh',
            life: 3000
        });
    }
}

function openNew() {
    hinhAnh.value = { trangThai: 1 };
    submitted.value = false;
    hinhAnhDialog.value = true;
}

function hideDialog() {
    hinhAnhDialog.value = false;
    submitted.value = false;
}

async function saveHinhAnh() {
    submitted.value = true;

    if (hinhAnh.value.maHinhAnh?.trim() && hinhAnh.value.tenHinhAnh?.trim()) {
        try {
            if (hinhAnh.value.id) {
                await axios.put(`http://localhost:8080/hinh-anh/${hinhAnh.value.id}`, hinhAnh.value);
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Cập nhật hình ảnh thành công',
                    life: 3000
                });
            } else {
                await axios.post('http://localhost:8080/hinh-anh', hinhAnh.value);
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Tạo hình ảnh thành công',
                    life: 3000
                });
            }
            fetchData();
            hinhAnhDialog.value = false;
            hinhAnh.value = {};
        } catch (error) {
            console.error('Error saving hình ảnh:', error);
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.response?.data?.message || 'Lưu hình ảnh thất bại',
                life: 3000
            });
        }
    } else {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Vui lòng nhập đầy đủ thông tin bắt buộc',
            life: 3000
        });
    }
}

function editHinhAnh(ha) {
    hinhAnh.value = { ...ha };
    hinhAnhDialog.value = true;
}

function confirmDeleteHinhAnh(ha) {
    hinhAnh.value = ha;
    deleteHinhAnhDialog.value = true;
}

async function deleteHinhAnh() {
    try {
        await axios.delete(`http://localhost:8080/hinh-anh/${hinhAnh.value.id}`);
        fetchData();
        deleteHinhAnhDialog.value = false;
        hinhAnh.value = {};
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa hình ảnh thành công',
            life: 3000
        });
    } catch (error) {
        console.error('Error deleting hình ảnh:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.response?.data?.message || 'Xóa hình ảnh thất bại',
            life: 3000
        });
    }
}

function confirmDeleteSelected() {
    deleteHinhAnhsDialog.value = true;
}

async function deleteSelectedHinhAnhs() {
    try {
        for (const ha of selectedHinhAnhs.value) {
            await axios.delete(`http://localhost:8080/hinh-anh/${ha.id}`);
        }
        fetchData();
        deleteHinhAnhsDialog.value = false;
        selectedHinhAnhs.value = null;
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa các hình ảnh thành công',
            life: 3000
        });
    } catch (error) {
        console.error('Error deleting hình ảnh:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.response?.data?.message || 'Xóa các hình ảnh thất bại',
            life: 3000
        });
    }
}

async function changeStatus(ha) {
    try {
        const updatedHinhAnh = { ...ha, trangThai: ha.trangThai === 1 ? 0 : 1 };
        await axios.put(`http://localhost:8080/hinh-anh/${ha.id}`, updatedHinhAnh);
        fetchData();
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật trạng thái thành công',
            life: 3000
        });
    } catch (error) {
        console.error('Error changing status:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.response?.data?.message || 'Cập nhật trạng thái thất bại',
            life: 3000
        });
    }
}

// function exportCSV() {
//     dt.value.exportCSV();
// }

function getStatusLabel(status) {
    return status === 1 ? 'success' : 'danger';
}

function exportCSV() {
    try {
        // If no data, show warning
        if (!ListHinhAnh.value || ListHinhAnh.value.length === 0) {
            toast.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Không có dữ liệu để xuất',
                life: 3000
            });
            return;
        }

        // Create CSV headers with Vietnamese labels
        const headers = ['ID', 'Mã Hình Ảnh', 'Tên Hình Ảnh', 'Trạng Thái', 'Chi Tiết Sản Phẩm'];

        // Convert data to CSV format
        const csvData = ListHinhAnh.value.map(item => {
            return [
                item.id || '',
                item.maHinhAnh || '',
                item.tenHinhAnh || '',
                item.trangThai === 1 ? 'Đã tải' : 'Đang tải',
                item.chiTietSanPham || '',

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
            const filename = `HinhAnh-${dateStr}.csv`;

            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show success message
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã xuất ${ListHinhAnh.value.length} bản ghi ra file CSV`,
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

<style scoped>
.card {
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}
    </style>