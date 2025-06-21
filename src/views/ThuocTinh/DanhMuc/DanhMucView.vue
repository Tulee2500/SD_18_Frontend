<template>
    <div class="card">
        <Toast />
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Thêm mới" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                <Button label="Xóa" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedDanhMuc || !selectedDanhMuc.length" />
            </template>
            <template #end>
                <Button label="Xuất CSV" icon="pi pi-upload" severity="secondary" @click="exportCSV" />
            </template>
        </Toolbar>

        <DataTable
            ref="dt"
            v-model:selection="selectedDanhMuc"
            :value="ListDanhMuc"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} danh mục"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">📋 Quản lý Danh Mục</h4>
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
            <Column field="maDanhMuc" header="Mã Danh Mục" sortable style="min-width: 12rem"></Column>
            <Column field="tenDanhMuc" header="Tên Danh Mục" sortable style="min-width: 16rem"></Column>
            <Column field="trangThai" header="Trạng Thái" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.trangThai === 1 ? 'Hoạt động' : 'Ngừng hoạt động'" :severity="getStatusLabel(slotProps.data.trangThai)" />
                </template>
            </Column>
            <Column :exportable="false" style="width: 10rem">
                <template #body="slotProps">
                    <div class="flex justify-between gap-2">
                        <Button icon="pi pi-pencil" outlined rounded size="small" @click="editDanhMuc(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" size="small" @click="confirmDeleteDanhMuc(slotProps.data)" />
                        <Button icon="pi pi-refresh" outlined rounded severity="secondary" size="small" @click="changeStatus(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="danhMucDialog" :style="{ width: '450px' }" header="Chi tiết Danh Mục" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="maDanhMuc" class="block font-bold mb-3">Mã Danh Mục</label>
                    <InputText id="maDanhMuc" v-model.trim="danhMuc.maDanhMuc" required="true" autofocus :invalid="submitted && !danhMuc.maDanhMuc" fluid />
                    <small v-if="submitted && !danhMuc.maDanhMuc" class="text-red-500">Mã Danh Mục là bắt buộc.</small>
                </div>
                <div>
                    <label for="tenDanhMuc" class="block font-bold mb-3">Tên Danh Mục</label>
                    <InputText id="tenDanhMuc" v-model.trim="danhMuc.tenDanhMuc" required="true" :invalid="submitted && !danhMuc.tenDanhMuc" fluid />
                    <small v-if="submitted && !danhMuc.tenDanhMuc" class="text-red-500">Tên Danh Mục là bắt buộc.</small>
                </div>
                <div>
                    <label for="trangThai" class="block font-bold mb-3">Trạng Thái</label>
                    <Select id="trangThai" v-model="danhMuc.trangThai" :options="statuses" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Lưu" icon="pi pi-check" @click="saveDanhMuc" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDanhMucDialog" :style="{ width: '450px' }" header="Xác nhận" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="danhMuc"
                    >Bạn có chắc muốn xóa danh mục <b>{{ danhMuc.tenDanhMuc }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteDanhMucDialog = false" />
                <Button label="Có" icon="pi pi-check" @click="deleteDanhMuc" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDanhMucsDialog" :style="{ width: '450px' }" header="Xác nhận" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Bạn có chắc muốn xóa các danh mục đã chọn?</span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteDanhMucsDialog = false" />
                <Button label="Có" icon="pi pi-check" text @click="deleteSelectedDanhMucs" />
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
const ListDanhMuc = ref([]);
const danhMucDialog = ref(false);
const deleteDanhMucDialog = ref(false);
const deleteDanhMucsDialog = ref(false);
const danhMuc = ref({});
const selectedDanhMuc = ref();
const submitted = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const statuses = ref([
    { label: 'Hoạt động', value: 1 },
    { label: 'Ngừng hoạt động', value: 0 }
]);

onMounted(() => {
    fetchData();
});

async function fetchData() {
    try {
        const res = await axios.get('http://localhost:8080/danh-muc');
        ListDanhMuc.value = res.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải danh sách danh mục',
            life: 3000
        });
    }
}

function openNew() {
    danhMuc.value = { trangThai: 1 };
    submitted.value = false;
    danhMucDialog.value = true;
}

function hideDialog() {
    danhMucDialog.value = false;
    submitted.value = false;
}

async function saveDanhMuc() {
    submitted.value = true;

    if (danhMuc.value.maDanhMuc?.trim() && danhMuc.value.tenDanhMuc?.trim()) {
        try {
            if (danhMuc.value.id) {
                await axios.put(`http://localhost:8080/danh-muc/${danhMuc.value.id}`, danhMuc.value);
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Cập nhật danh mục thành công',
                    life: 3000
                });
            } else {
                await axios.post('http://localhost:8080/danh-muc', danhMuc.value);
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Tạo danh mục thành công',
                    life: 3000
                });
            }
            fetchData();
            danhMucDialog.value = false;
            danhMuc.value = {};
        } catch (error) {
            console.error('Error saving danh mục:', error);
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.response?.data?.message || 'Lưu danh mục thất bại',
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

function editDanhMuc(dm) {
    danhMuc.value = { ...dm };
    danhMucDialog.value = true;
}

function confirmDeleteDanhMuc(dm) {
    danhMuc.value = dm;
    deleteDanhMucDialog.value = true;
}

async function deleteDanhMuc() {
    try {
        await axios.delete(`http://localhost:8080/danh-muc/${danhMuc.value.id}`);
        fetchData();
        deleteDanhMucDialog.value = false;
        danhMuc.value = {};
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa danh mục thành công',
            life: 3000
        });
    } catch (error) {
        console.error('Error deleting danh mục:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.response?.data?.message || 'Xóa danh mục thất bại',
            life: 3000
        });
    }
}

function confirmDeleteSelected() {
    deleteDanhMucsDialog.value = true;
}

async function deleteSelectedDanhMucs() {
    try {
        for (const dm of selectedDanhMuc.value) {
            await axios.delete(`http://localhost:8080/danh-muc/${dm.id}`);
        }
        fetchData();
        deleteDanhMucsDialog.value = false;
        selectedDanhMuc.value = null;
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa các danh mục thành công',
            life: 3000
        });
    } catch (error) {
        console.error('Error deleting danh mục:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.response?.data?.message || 'Xóa các danh mục thất bại',
            life: 3000
        });
    }
}

async function changeStatus(dm) {
    try {
        const updatedDanhMuc = { ...dm, trangThai: dm.trangThai === 1 ? 0 : 1 };
        await axios.put(`http://localhost:8080/danh-muc/${dm.id}`, updatedDanhMuc);
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

function getStatusLabel(status) {
    return status === 1 ? 'success' : 'danger';
}

// function exportCSV() {
//     dt.value.exportCSV();
// }
function exportCSV() {
    try {
        // If no data, show warning
        if (!ListDanhMuc.value || ListDanhMuc.value.length === 0) {
            toast.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Không có dữ liệu để xuất',
                life: 3000
            });
            return;
        }

        // Create CSV headers with Vietnamese labels
        const headers = ['ID', 'Mã Danh Mục', 'Tên Danh Mục', 'Trạng Thái'];

        // Convert data to CSV format
        const csvData = ListDanhMuc.value.map(item => {
            return [
                item.id || '',
                item.maDanhMuc || '',
                item.tenDanhMuc || '',
                item.trangThai === 1 ? 'Hoạt động' : 'Ngừng hoạt động'
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
            const filename = `DanhMuc-${dateStr}.csv`;

            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show success message
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã xuất ${ListDanhMuc.value.length} bản ghi ra file CSV`,
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
