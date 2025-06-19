
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
            <Column field="giaTri" header="Giá Trị Giảm" sortable style="width: 12rem" />
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
            <Column :exportable="false" style="width: 10rem">
                <template #body="slotProps">
                    <div class="flex justify-between gap-2">
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
                </div>
                <div>
                    <label for="giaTri" class="block font-bold mb-3">Giá Trị Giảm</label>
                    <InputNumber id="giaTri" v-model="khuyenMai.giaTri" :min="0" fluid :invalid="submitted && khuyenMai.giaTri == null" />
                    <small v-if="submitted && khuyenMai.giaTri == null" class="text-red-500">Giá trị giảm là bắt buộc.</small>
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

const toast = useToast();
const dt = ref();
const khuyenMais = ref([]);
const khuyenMaiDialog = ref(false);
const deleteKhuyenMaiDialog = ref(false);
const deleteKhuyenMaisDialog = ref(false);
const khuyenMai = ref({});
const selectedKhuyenMai = ref();
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

function openNew() {
    khuyenMai.value = { trangThai: 1 };
    submitted.value = false;
    khuyenMaiDialog.value = true;
}

function hideDialog() {
    khuyenMaiDialog.value = false;
    submitted.value = false;
}

async function saveKhuyenMai() {
    submitted.value = true;

    if (khuyenMai.value.tenKhuyenMai?.trim() && khuyenMai.value.giaTri != null && khuyenMai.value.ngayBatDau && khuyenMai.value.ngayKetThuc) {
        try {
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
        } catch (error) {
            console.error('Error saving promotion:', error.response?.data || error.message);
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.response?.data?.message || 'Có lỗi xảy ra khi lưu khuyến mãi',
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

function editKhuyenMai(km) {
    khuyenMai.value = { ...km };
    // Convert date strings to Date objects for Calendar
    if (khuyenMai.value.ngayBatDau) {
        khuyenMai.value.ngayBatDau = new Date(khuyenMai.value.ngayBatDau);
    }
    if (khuyenMai.value.ngayKetThuc) {
        khuyenMai.value.ngayKetThuc = new Date(khuyenMai.value.ngayKetThuc);
    }
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

function exportCSV() {
    dt.value.exportCSV();
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
</style>

