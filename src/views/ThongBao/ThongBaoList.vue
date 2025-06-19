
<template>
    <div class="card">
        <!-- Toolbar -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Thêm mới" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                <Button label="Xóa" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedThongBao || !selectedThongBao.length" />
            </template>
            <template #end>
                <Button label="Xuất CSV" icon="pi pi-upload" severity="secondary" @click="exportCSV" />
            </template>
        </Toolbar>

        <!-- DataTable -->
        <DataTable
            ref="dt"
            v-model:selection="selectedThongBao"
            :value="filteredThongBao"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} thông báo"
            :loading="isLoading"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Quản Lý Thông Báo</h4>
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
            <Column field="taiKhoan.email" header="Tên Tài Khoản" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    {{ slotProps.data.taiKhoan?.email || 'N/A' }}
                </template>
            </Column>
            <Column field="hoaDon.maHoaDon" header="Hóa Đơn" sortable style="width: 10rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.hoaDon?.maHoaDon || 'N/A'" severity="secondary" />
                </template>
            </Column>
            <Column field="noiDungThongBao" header="Nội Dung" sortable style="min-width: 16rem" />
            <Column field="nguoiNhan" header="Người Nhận" sortable style="min-width: 12rem" />
            <Column field="duongDan" header="Đường Dẫn" sortable style="min-width: 12rem" />
            <Column field="trangThai" header="Trạng Thái" sortable style="width: 12rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.trangThai === 1 ? 'Đã gửi' : 'Chưa gửi'" :severity="slotProps.data.trangThai === 1 ? 'success' : 'warning'">
                        <i :class="slotProps.data.trangThai === 1 ? 'pi pi-check-circle' : 'pi pi-times-circle'" class="mr-1"></i>
                        {{ slotProps.data.trangThai === 1 ? 'Đã gửi' : 'Chưa gửi' }}
                    </Tag>
                </template>
            </Column>
            <Column field="ngayTao" header="Ngày Tạo" sortable style="width: 12rem" />
            <Column field="ngayCapNhat" header="Ngày Cập Nhật" sortable style="width: 12rem" />
            <Column :exportable="false" style="width: 10rem">
                <template #body="slotProps">
                    <div class="flex justify-between gap-2">
                        <Button icon="pi pi-pencil" outlined rounded size="small" @click="editThongBao(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" size="small" @click="confirmDeleteThongBao(slotProps.data)" />
                        <Button icon="pi pi-refresh" outlined rounded severity="secondary" size="small" @click="changeStatus(slotProps.data)" :title="slotProps.data.trangThai === 1 ? 'Chưa gửi' : 'Đã gửi'" />
                    </div>
                </template>
            </Column>
            <template #empty>
                <div class="text-center p-5">
                    <i class="pi pi-bell text-5xl text-muted mb-3"></i>
                    <h5 class="text-muted">Không tìm thấy thông báo</h5>
                    <p class="text-muted">Thử thay đổi bộ lọc hoặc thêm thông báo mới.</p>
                </div>
            </template>
        </DataTable>

        <!-- Add/Edit Notification Dialog -->
        <Dialog v-model:visible="thongBaoDialog" :style="{ width: '550px' }" :header="thongBao.id ? 'Cập nhật thông báo' : 'Thêm thông báo'" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="taiKhoanId" class="block font-bold mb-3">ID Tài Khoản</label>
                    <InputText id="taiKhoanId" v-model.number="thongBao.taiKhoanId" fluid type="number" :invalid="submitted && thongBao.taiKhoanId == null" />
                    <small v-if="submitted && thongBao.taiKhoanId == null" class="text-red-500">ID tài khoản là bắt buộc.</small>
                </div>
                <div>
                    <label for="hoaDonId" class="block font-bold mb-3">ID Hóa Đơn</label>
                    <InputText id="hoaDonId" v-model.number="thongBao.hoaDonId" fluid type="number" :invalid="submitted && thongBao.hoaDonId == null" />
                    <small v-if="submitted && thongBao.hoaDonId == null" class="text-red-500">ID hóa đơn là bắt buộc.</small>
                </div>
                <div>
                    <label for="noiDungThongBao" class="block font-bold mb-3">Nội Dung Thông Báo</label>
                    <Textarea id="noiDungThongBao" v-model="thongBao.noiDungThongBao" fluid rows="4" :invalid="submitted && !thongBao.noiDungThongBao" />
                    <small v-if="submitted && !thongBao.noiDungThongBao" class="text-red-500">Nội dung là bắt buộc.</small>
                </div>
                <div>
                    <label for="nguoiNhan" class="block font-bold mb-3">Người Nhận</label>
                    <InputText id="nguoiNhan" v-model="thongBao.nguoiNhan" fluid :invalid="submitted && !thongBao.nguoiNhan" />
                    <small v-if="submitted && !thongBao.nguoiNhan" class="text-red-500">Người nhận là bắt buộc.</small>
                </div>
                <div>
                    <label for="duongDan" class="block font-bold mb-3">Đường Dẫn</label>
                    <InputText id="duongDan" v-model="thongBao.duongDan" fluid />
                </div>
                <div>
                    <label for="trangThai" class="block font-bold mb-3">Trạng Thái</label>
                    <Select id="trangThai" v-model="thongBao.trangThai" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" fluid />
                </div>
                <div>
                    <label for="ngayTao" class="block font-bold mb-3">Ngày Tạo</label>
                    <Calendar id="ngayTao" v-model="thongBao.ngayTao" dateFormat="yy-mm-dd" fluid :invalid="submitted && !thongBao.ngayTao" />
                    <small v-if="submitted && !thongBao.ngayTao" class="text-red-500">Ngày tạo là bắt buộc.</small>
                </div>
                <div>
                    <label for="ngayCapNhat" class="block font-bold mb-3">Ngày Cập Nhật</label>
                    <Calendar id="ngayCapNhat" v-model="thongBao.ngayCapNhat" dateFormat="yy-mm-dd" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Lưu" icon="pi pi-check" @click="saveThongBao" />
            </template>
        </Dialog>

        <!-- Delete Notification Dialog -->
        <Dialog v-model:visible="deleteThongBaoDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="thongBao"
                    >Bạn có chắc chắn muốn xóa thông báo <b>{{ thongBao.noiDungThongBao }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteThongBaoDialog = false" />
                <Button label="Có" icon="pi pi-check" @click="deleteThongBao" />
            </template>
        </Dialog>

        <!-- Delete Selected Notifications Dialog -->
        <Dialog v-model:visible="deleteThongBaosDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Bạn có chắc chắn muốn xóa các thông báo đã chọn?</span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteThongBaosDialog = false" />
                <Button label="Có" icon="pi pi-check" text @click="deleteSelectedThongBaos" />
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
const thongBaos = ref([]);
const thongBaoDialog = ref(false);
const deleteThongBaoDialog = ref(false);
const deleteThongBaosDialog = ref(false);
const thongBao = ref({});
const selectedThongBao = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const statusFilter = ref('');
const submitted = ref(false);
const isLoading = ref(false);
const statusOptions = ref([
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Đã gửi', value: 1 },
    { label: 'Chưa gửi', value: 0 }
]);

onMounted(() => {
    fetchData();
});

async function fetchData() {
    isLoading.value = true;
    try {
        const res = await axios.get('http://localhost:8080/thong-bao');
        console.log('Dữ liệu trả về:', res.data);
        thongBaos.value = res.data;
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

const filteredThongBao = computed(() => {
    let filtered = thongBaos.value;

    if (statusFilter.value !== '') {
        filtered = filtered.filter((tb) => tb.trangThai === parseInt(statusFilter.value));
    }

    return filtered;
});

function openNew() {
    thongBao.value = { trangThai: 1, ngayTao: new Date() };
    submitted.value = false;
    thongBaoDialog.value = true;
}

function hideDialog() {
    thongBaoDialog.value = false;
    submitted.value = false;
}

async function saveThongBao() {
    submitted.value = true;

    if (thongBao.value.taiKhoanId != null && thongBao.value.hoaDonId != null && thongBao.value.noiDungThongBao?.trim() && thongBao.value.nguoiNhan?.trim() && thongBao.value.ngayTao) {
        try {
            const payload = {
                ...thongBao,
                taiKhoan: { id: thongBao.value.taiKhoanId },
                hoaDon: { id: thongBao.value.hoaDonId },
                ngayTao: thongBao.value.ngayTao.toISOString().split('T')[0],
                ngayCapNhat: thongBao.value.ngayCapNhat ? thongBao.value.ngayCapNhat.toISOString().split('T')[0] : null
            };
            if (thongBao.value.id) {
                await axios.put(`http://localhost:8080/thong-bao/${thongBao.value.id}`, payload);
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Cập nhật thông báo thành công',
                    life: 3000
                });
            } else {
                await axios.post('http://localhost:8080/thong-bao', payload);
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Thêm thông báo thành công',
                    life: 3000
                });
            }
            await fetchData();
            thongBaoDialog.value = false;
            thongBao.value = {};
        } catch (error) {
            console.error('Error saving notification:', error.response?.data || error.message);
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.response?.data?.message || 'Có lỗi xảy ra khi lưu thông báo',
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

function editThongBao(tb) {
    thongBao.value = {
        ...tb,
        taiKhoanId: tb.taiKhoan?.id,
        hoaDonId: tb.hoaDon?.id,
        ngayTao: tb.ngayTao ? new Date(tb.ngayTao) : null,
        ngayCapNhat: tb.ngayCapNhat ? new Date(tb.ngayCapNhat) : null
    };
    thongBaoDialog.value = true;
}

function confirmDeleteThongBao(tb) {
    thongBao.value = tb;
    deleteThongBaoDialog.value = true;
}

async function deleteThongBao() {
    try {
        await axios.delete(`http://localhost:8080/thong-bao/delete/${thongBao.value.id}`);
        await fetchData();
        deleteThongBaoDialog.value = false;
        thongBao.value = {};
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa thông báo thành công',
            life: 3000
        });
    } catch (error) {
        console.error('Error deleting notification:', error.response?.data || error.message);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.response?.data?.message || 'Có lỗi xảy ra khi xóa thông báo',
            life: 3000
        });
    }
}

async function changeStatus(tb) {
    try {
        const newStatus = tb.trangThai === 1 ? 0 : 1;
        await axios.put(`http://localhost:8080/thong-bao/${tb.id}`, {
            ...tb,
            trangThai: newStatus
        });
        await fetchData();
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã ${newStatus === 1 ? 'gửi' : 'hủy gửi'} thông báo`,
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
    deleteThongBaosDialog.value = true;
}

async function deleteSelectedThongBaos() {
    try {
        for (const tb of selectedThongBao.value) {
            await axios.delete(`http://localhost:8080/thong-bao/delete/${tb.id}`);
        }
        await fetchData();
        deleteThongBaosDialog.value = false;
        selectedThongBao.value = null;
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa các thông báo thành công',
            life: 3000
        });
    } catch (error) {
        console.error('Error deleting notifications:', error.response?.data || error.message);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.response?.data?.message || 'Có lỗi xảy ra khi xóa thông báo',
            life: 3000
        });
    }
}

function exportCSV() {
    dt.value.exportCSV();
}
</script>

<style scoped>
.card {
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}
</style>