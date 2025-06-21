<template>
    <div class="card">
        <!-- Toolbar -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Xóa đã chọn" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedEmployees || !selectedEmployees.length" />
            </template>
            <template #end>
                <Button label="Xuất CSV" icon="pi pi-upload" severity="secondary" @click="exportCSV" />
                <Button label="Quản lý tài khoản" icon="pi pi-plus" @click="goToAccountManagement" class="ml-2" />
            </template>
        </Toolbar>

        <!-- DataTable -->
        <DataTable
            ref="dt"
            v-model:selection="selectedEmployees"
            :value="filteredEmployees"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} nhân viên"
            :loading="isLoading"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Quản Lý Nhân Viên</h4>
                    <div class="flex gap-2">
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Tìm kiếm..." />
                        </IconField>
                        <Select v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Lọc trạng thái" class="w-12rem" />
                    </div>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="ID" sortable style="width: 6rem">
                <template #body="slotProps">
                    <span class="font-bold text-primary">#{{ slotProps.data.id }}</span>
                </template>
            </Column>
            <Column field="maNhanVien" header="Mã NV" sortable style="width: 10rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.maNhanVien" severity="info" />
                </template>
            </Column>
            <Column field="hoTen" header="Thông tin" sortable style="min-width: 18rem">
                <template #body="slotProps">
                    <div class="flex items-center">
                        <span class="rounded-circle w-2rem h-2rem flex items-center justify-center text-white font-bold mr-3" :style="{ background: 'linear-gradient(45deg, #28a745, #20c997)' }">
                            {{ getInitials(slotProps.data.hoTen) }}
                        </span>
                        <div class="flex flex-col">
                            <span class="font-semibold">{{ slotProps.data.hoTen }}</span>
                            <span class="text-sm text-muted">{{ slotProps.data.email }}</span>
                        </div>
                    </div>
                </template>
            </Column>
            <Column header="Liên hệ" style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex flex-col">
                        <span class="mb-1">
                            <i class="pi pi-phone mr-1 text-muted"></i>
                            {{ slotProps.data.sdt }}
                        </span>
                        <span class="text-sm text-muted">
                            <i class="pi pi-user mr-1 text-muted"></i>
                            {{ slotProps.data.taiKhoan?.email || 'Chưa có tài khoản' }}
                        </span>
                    </div>
                </template>
            </Column>
            <Column header="Địa chỉ" style="min-width: 18rem">
                <template #body="slotProps">
                    <div class="flex flex-col">
                        <span class="text-sm text-muted">
                            <i class="pi pi-map-marker mr-1 text-muted"></i>
                            {{ formatFullAddress(slotProps.data.diaChi) }}
                        </span>
                    </div>
                </template>
            </Column>
            <Column field="trangThai" header="Trạng thái" sortable style="width: 12rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.trangThai === 1 ? 'Hoạt động' : 'Ngưng'" :severity="slotProps.data.trangThai === 1 ? 'success' : 'danger'">
                        <i :class="slotProps.data.trangThai === 1 ? 'pi pi-check-circle' : 'pi pi-times-circle'" class="mr-1"></i>
                        {{ slotProps.data.trangThai === 1 ? 'Hoạt động' : 'Ngưng' }}
                    </Tag>
                </template>
            </Column>
            <Column field="ngayTao" header="Ngày tạo" sortable style="width: 10rem">
                <template #body="slotProps">
                    <span class="text-sm">{{ formatDate(slotProps.data.ngayTao) }}</span>
                </template>
            </Column>
            <Column :exportable="false" style="width: 12rem">
                <template #body="slotProps">
                    <div class="flex gap-1">
                        <Button icon="pi pi-eye" outlined size="small" @click="viewEmployee(slotProps.data)" title="Xem chi tiết" />
                        <Button icon="pi pi-pencil" outlined size="small" @click="editEmployee(slotProps.data)" title="Sửa" />
                        <Button icon="pi pi-trash" outlined severity="danger" size="small" @click="confirmDeleteEmployee(slotProps.data)" title="Xóa" />
                        <Button icon="pi pi-refresh" outlined severity="secondary" size="small" @click="changeStatus(slotProps.data)" :title="slotProps.data.trangThai === 1 ? 'Ngưng hoạt động' : 'Kích hoạt'" />
                    </div>
                </template>
            </Column>
            <template #empty>
                <div class="text-center p-5">
                    <i class="pi pi-users text-5xl text-muted mb-3"></i>
                    <h5 class="text-muted">Không tìm thấy nhân viên</h5>
                    <p class="text-muted">Thử thay đổi bộ lọc hoặc thêm nhân viên mới trong phần quản lý tài khoản.</p>
                </div>
            </template>
        </DataTable>

        <!-- View Employee Dialog -->
        <Dialog v-model:visible="viewDialog" :style="{ width: '700px' }" :header="`Chi tiết nhân viên - ${viewingEmployee?.hoTen}`" :modal="true">
            <div v-if="viewingEmployee" class="flex flex-col gap-4">
                <!-- Thông tin cơ bản -->
                <div class="bg-green-50 p-4 rounded-lg">
                    <h6 class="font-semibold text-green-700 mb-3">Thông tin nhân viên:</h6>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>ID:</strong> #{{ viewingEmployee.id }}</div>
                        <div><strong>Mã NV:</strong> {{ viewingEmployee.maNhanVien }}</div>
                        <div><strong>Họ tên:</strong> {{ viewingEmployee.hoTen }}</div>
                        <div><strong>Email:</strong> {{ viewingEmployee.email }}</div>
                        <div><strong>SĐT:</strong> {{ viewingEmployee.sdt }}</div>
                        <div>
                            <strong>Trạng thái:</strong>
                            <Tag :value="viewingEmployee.trangThai === 1 ? 'Hoạt động' : 'Ngưng'" :severity="viewingEmployee.trangThai === 1 ? 'success' : 'danger'" />
                        </div>
                        <div><strong>Ngày tạo:</strong> {{ formatDate(viewingEmployee.ngayTao) }}</div>
                        <div><strong>Cập nhật:</strong> {{ formatDate(viewingEmployee.ngayCapNhat) }}</div>
                    </div>
                </div>

                <!-- Thông tin tài khoản -->
                <div v-if="viewingEmployee.taiKhoan" class="bg-blue-50 p-4 rounded-lg">
                    <h6 class="font-semibold text-blue-700 mb-3">Thông tin tài khoản:</h6>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>Mã TK:</strong> {{ viewingEmployee.taiKhoan.maTaiKhoan }}</div>
                        <div><strong>Email TK:</strong> {{ viewingEmployee.taiKhoan.email }}</div>
                        <div><strong>Vai trò:</strong> Nhân viên</div>
                        <div>
                            <strong>Trạng thái TK:</strong>
                            <Tag :value="viewingEmployee.taiKhoan.trangThai === 1 ? 'Hoạt động' : 'Ngưng'" :severity="viewingEmployee.taiKhoan.trangThai === 1 ? 'success' : 'danger'" />
                        </div>
                    </div>
                </div>

                <!-- Thông tin địa chỉ -->
                <div v-if="viewingEmployee.diaChi" class="bg-gray-50 p-4 rounded-lg">
                    <h6 class="font-semibold text-gray-700 mb-3">Thông tin địa chỉ:</h6>
                    <div class="text-sm">
                        <div><strong>Tên:</strong> {{ viewingEmployee.diaChi.tenKhachHang }}</div>
                        <div><strong>Địa chỉ:</strong> {{ formatFullAddress(viewingEmployee.diaChi) }}</div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Đóng" icon="pi pi-times" text @click="viewDialog = false" />
                <Button label="Sửa" icon="pi pi-pencil" @click="editFromView" />
            </template>
        </Dialog>

        <!-- Edit Employee Dialog -->
        <Dialog v-model:visible="employeeDialog" :style="{ width: '700px' }" :header="`Cập nhật nhân viên - ${employee.hoTen || 'Nhân viên'}`" :modal="true">
            <div class="flex flex-col gap-6">
                <!-- Thông tin cơ bản -->
                <div class="border-bottom pb-4">
                    <h5 class="mb-3">Thông tin cơ bản</h5>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="hoTen" class="block font-bold mb-3">Họ Tên *</label>
                            <InputText id="hoTen" v-model.trim="employee.hoTen" required="true" :invalid="submitted && !employee.hoTen" fluid />
                            <small v-if="submitted && !employee.hoTen" class="text-red-500">Họ tên là bắt buộc.</small>
                        </div>
                        <div>
                            <label for="maNhanVien" class="block font-bold mb-3">Mã nhân viên</label>
                            <InputText id="maNhanVien" v-model="employee.maNhanVien" disabled fluid />
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label for="email" class="block font-bold mb-3">Email *</label>
                            <InputText id="email" v-model="employee.email" required="true" :invalid="submitted && !employee.email" fluid />
                            <small v-if="submitted && !employee.email" class="text-red-500">Email là bắt buộc.</small>
                        </div>
                        <div>
                            <label for="sdt" class="block font-bold mb-3">Số điện thoại *</label>
                            <InputText id="sdt" v-model="employee.sdt" required="true" :invalid="submitted && !employee.sdt" fluid />
                            <small v-if="submitted && !employee.sdt" class="text-red-500">Số điện thoại là bắt buộc.</small>
                        </div>
                    </div>
                </div>

                <!-- Thông tin địa chỉ -->
                <div class="border-bottom pb-4">
                    <h5 class="mb-3">Thông tin địa chỉ</h5>
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label for="tenKhachHang" class="block font-bold mb-3">Tên trong địa chỉ</label>
                            <InputText id="tenKhachHang" v-model="employee.diaChi.tenKhachHang" placeholder="Tên trong địa chỉ..." fluid />
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label for="tenPhuong" class="block font-bold mb-3">Phường/Xã *</label>
                                <InputText id="tenPhuong" v-model="employee.diaChi.tenPhuong" placeholder="Tên phường/xã" :invalid="submitted && !employee.diaChi.tenPhuong" fluid />
                                <small v-if="submitted && !employee.diaChi.tenPhuong" class="text-red-500">Phường/xã là bắt buộc.</small>
                            </div>
                            <div>
                                <label for="tenHuyen" class="block font-bold mb-3">Quận/Huyện *</label>
                                <InputText id="tenHuyen" v-model="employee.diaChi.tenHuyen" placeholder="Tên quận/huyện" :invalid="submitted && !employee.diaChi.tenHuyen" fluid />
                                <small v-if="submitted && !employee.diaChi.tenHuyen" class="text-red-500">Quận/huyện là bắt buộc.</small>
                            </div>
                            <div>
                                <label for="tenTinh" class="block font-bold mb-3">Tỉnh/Thành phố *</label>
                                <InputText id="tenTinh" v-model="employee.diaChi.tenTinh" placeholder="Tên tỉnh/thành phố" :invalid="submitted && !employee.diaChi.tenTinh" fluid />
                                <small v-if="submitted && !employee.diaChi.tenTinh" class="text-red-500">Tỉnh/thành phố là bắt buộc.</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Trạng thái -->
                <div>
                    <label for="trangThai" class="block font-bold mb-3">Trạng thái</label>
                    <Select id="trangThai" v-model="employee.trangThai" :options="statusOptions.slice(1)" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Cập nhật" icon="pi pi-check" @click="saveEmployee" />
            </template>
        </Dialog>

        <!-- Delete Dialogs -->
        <Dialog v-model:visible="deleteEmployeeDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="employee"
                    >Bạn có chắc chắn muốn xóa nhân viên <b>{{ employee.hoTen }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteEmployeeDialog = false" />
                <Button label="Có" icon="pi pi-check" @click="deleteEmployee" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteEmployeesDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Bạn có chắc chắn muốn xóa các nhân viên đã chọn?</span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteEmployeesDialog = false" />
                <Button label="Có" icon="pi pi-check" text @click="deleteSelectedEmployees" />
            </template>
        </Dialog>

        <Toast />
    </div>
</template>

<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();
const dt = ref();
const employees = ref([]);
const employeeDialog = ref(false);
const viewDialog = ref(false);
const deleteEmployeeDialog = ref(false);
const deleteEmployeesDialog = ref(false);
const employee = ref({});
const viewingEmployee = ref(null);
const selectedEmployees = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const statusFilter = ref('');
const submitted = ref(false);
const isLoading = ref(false);

const statusOptions = ref([
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Hoạt động', value: 1 },
    { label: 'Ngưng hoạt động', value: 0 }
]);

onMounted(() => {
    fetchData();
});

async function fetchData() {
    isLoading.value = true;
    try {
        const res = await axios.get('http://localhost:8080/nhan-vien');
        employees.value = res.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi tải dữ liệu nhân viên', life: 3000 });
    } finally {
        isLoading.value = false;
    }
}

const filteredEmployees = computed(() => {
    let filtered = employees.value;

    if (statusFilter.value !== '') {
        filtered = filtered.filter((emp) => emp.trangThai === parseInt(statusFilter.value));
    }

    return filtered;
});

function viewEmployee(emp) {
    viewingEmployee.value = { ...emp };
    viewDialog.value = true;
}

function editFromView() {
    employee.value = { ...viewingEmployee.value };
    if (!employee.value.diaChi) {
        employee.value.diaChi = {
            tenKhachHang: '',
            tenTinh: '',
            tenHuyen: '',
            tenPhuong: ''
        };
    }
    viewDialog.value = false;
    employeeDialog.value = true;
}

function editEmployee(emp) {
    employee.value = { ...emp };
    if (!employee.value.diaChi) {
        employee.value.diaChi = {
            tenKhachHang: '',
            tenTinh: '',
            tenHuyen: '',
            tenPhuong: ''
        };
    }
    employeeDialog.value = true;
}

function hideDialog() {
    employeeDialog.value = false;
    submitted.value = false;
}

async function saveEmployee() {
    submitted.value = true;

    if (employee.value.hoTen?.trim() && employee.value.email?.trim() && employee.value.sdt?.trim() && employee.value.diaChi?.tenPhuong?.trim() && employee.value.diaChi?.tenHuyen?.trim() && employee.value.diaChi?.tenTinh?.trim()) {
        try {
            // Cập nhật địa chỉ trước
            if (employee.value.diaChi.id) {
                await axios.put(`http://localhost:8080/api/dia-chi/${employee.value.diaChi.id}`, employee.value.diaChi);
            }

            // Cập nhật thông tin nhân viên
            const employeeData = {
                ...employee.value,
                diaChi: employee.value.diaChi.id
            };

            await axios.put(`http://localhost:8080/nhan-vien/${employee.value.id}`, employeeData);

            await fetchData();
            employeeDialog.value = false;
            employee.value = {};

            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Cập nhật nhân viên thành công',
                life: 3000
            });
        } catch (error) {
            console.error('Error saving employee:', error);
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Có lỗi xảy ra khi cập nhật nhân viên',
                life: 3000
            });
        }
    }
}

function confirmDeleteEmployee(emp) {
    employee.value = emp;
    deleteEmployeeDialog.value = true;
}

async function deleteEmployee() {
    try {
        await axios.delete(`http://localhost:8080/nhan-vien/${employee.value.id}`);
        await fetchData();
        deleteEmployeeDialog.value = false;
        employee.value = {};
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa nhân viên thành công',
            life: 3000
        });
    } catch (error) {
        console.error('Error deleting employee:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Có lỗi xảy ra khi xóa nhân viên',
            life: 3000
        });
    }
}

async function changeStatus(emp) {
    try {
        const newStatus = emp.trangThai === 1 ? 0 : 1;
        await axios.put(`http://localhost:8080/nhan-vien/${emp.id}`, {
            ...emp,
            trangThai: newStatus
        });
        await fetchData();
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã ${newStatus === 1 ? 'kích hoạt' : 'ngưng'} nhân viên`,
            life: 3000
        });
    } catch (error) {
        console.error('Error changing status:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Có lỗi xảy ra khi thay đổi trạng thái',
            life: 3000
        });
    }
}

function confirmDeleteSelected() {
    deleteEmployeesDialog.value = true;
}

async function deleteSelectedEmployees() {
    try {
        for (const emp of selectedEmployees.value) {
            await axios.delete(`http://localhost:8080/nhan-vien/${emp.id}`);
        }
        await fetchData();
        deleteEmployeesDialog.value = false;
        selectedEmployees.value = null;
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa các nhân viên thành công',
            life: 3000
        });
    } catch (error) {
        console.error('Error deleting employees:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Có lỗi xảy ra khi xóa nhân viên',
            life: 3000
        });
    }
}

function exportCSV() {
    try {
        if (!employees.value || employees.value.length === 0) {
            toast.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Không có dữ liệu để xuất',
                life: 3000
            });
            return;
        }

        const headers = ['ID', 'Mã Nhân Viên', 'Họ Tên', 'Email', 'SĐT', 'Địa Chỉ', 'Trạng Thái', 'Ngày Tạo'];

        const csvData = employees.value.map((item) => {
            return [item.id || '', item.maNhanVien || '', item.hoTen || '', item.email || '', item.sdt || '', formatFullAddress(item.diaChi) || '', item.trangThai === 1 ? 'Hoạt động' : 'Ngừng hoạt động', formatDate(item.ngayTao)];
        });

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
            const filename = `NhanVien-${dateStr}.csv`;

            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã xuất ${employees.value.length} bản ghi ra file CSV`,
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

function goToAccountManagement() {
    router.push('/tai-khoan');
}

function formatFullAddress(diaChi) {
    if (!diaChi) return 'Chưa cập nhật địa chỉ';

    const parts = [diaChi.tenPhuong, diaChi.tenHuyen, diaChi.tenTinh].filter((part) => part && part.trim() !== '');

    return parts.length > 0 ? parts.join(', ') : 'Chưa cập nhật thông tin';
}

function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
}

function getInitials(name) {
    return name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
</script>

<style scoped>
.card {
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.border-bottom {
    border-bottom: 1px solid #e9ecef;
}
</style>
