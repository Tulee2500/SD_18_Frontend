<template>
    <div class="card">
        <!-- Toolbar -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Xóa đã chọn" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedEmployees || !selectedEmployees.length" />
            </template>
            <template #end>
                <Button label="Xuất CSV" icon="pi pi-upload" severity="secondary" @click="exportCSV" :loading="exporting" />
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
                <div class="flex flex-wrap items-center justify-between gap-2">
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
                        <span class="rounded-circle w-2rem h-2rem mr-3 flex items-center justify-center font-bold text-white" :style="{ background: 'linear-gradient(45deg, #28a745, #20c997)' }">
                            {{ getInitials(slotProps.data.hoTen) }}
                        </span>
                        <div class="flex flex-col">
                            <span class="font-semibold">{{ slotProps.data.hoTen }}</span>
                            <span class="text-muted text-sm">{{ slotProps.data.email }}</span>
                        </div>
                    </div>
                </template>
            </Column>
            <Column header="Liên hệ" style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex flex-col">
                        <span class="mb-1">
                            <i class="pi pi-phone text-muted mr-1"></i>
                            {{ slotProps.data.sdt }}
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
                <div class="p-5 text-center">
                    <i class="pi pi-users text-muted mb-3 text-5xl"></i>
                    <h5 class="text-muted">Không tìm thấy nhân viên</h5>
                    <p class="text-muted">Thử thay đổi bộ lọc hoặc thêm nhân viên mới từ quản lý tài khoản.</p>
                </div>
            </template>
        </DataTable>

        <!-- View Employee Dialog -->
        <Dialog v-model:visible="viewDialog" :style="{ width: '700px' }" :header="`Chi tiết nhân viên - ${viewingEmployee?.hoTen || 'N/A'}`" :modal="true">
            <div v-if="viewingEmployee" class="flex flex-col gap-4">
                <!-- Thông tin cơ bản -->
                <div class="rounded-lg bg-green-50 p-4">
                    <h6 class="mb-3 font-semibold text-green-700">Thông tin nhân viên:</h6>
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
            </div>
            <template #footer>
                <Button label="Đóng" icon="pi pi-times" text @click="viewDialog = false" />
                <Button label="Sửa" icon="pi pi-pencil" @click="editFromView" />
            </template>
        </Dialog>

        <!-- Edit Employee Dialog -->
        <Dialog v-model:visible="employeeDialog" :style="{ width: '600px' }" :header="`Cập nhật nhân viên - ${employee.hoTen || 'Nhân viên'}`" :modal="true">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="maNhanVien" class="mb-3 block font-bold">Mã nhân viên</label>
                    <InputText id="maNhanVien" v-model="employee.maNhanVien" disabled fluid />
                </div>
                <div>
                    <label for="hoTen" class="mb-3 block font-bold">Họ Tên *</label>
                    <InputText id="hoTen" v-model.trim="employee.hoTen" required="true" :invalid="submitted && !employee.hoTen" fluid />
                    <small v-if="submitted && !employee.hoTen" class="text-red-500">Họ tên là bắt buộc.</small>
                </div>
                <div>
                    <label for="email" class="mb-3 block font-bold">Email *</label>
                    <InputText id="email" v-model="employee.email" required="true" :invalid="submitted && (!employee.email || !isValidEmail(employee.email))" fluid />
                    <small v-if="submitted && !employee.email" class="text-red-500">Email là bắt buộc.</small>
                    <small v-if="submitted && employee.email && !isValidEmail(employee.email)" class="text-red-500">Email không hợp lệ.</small>
                </div>
                <div>
                    <label for="sdt" class="mb-3 block font-bold">Số điện thoại *</label>
                    <InputText id="sdt" v-model="employee.sdt" required="true" :invalid="submitted && (!employee.sdt || !isValidPhone(employee.sdt))" fluid />
                    <small v-if="submitted && !employee.sdt" class="text-red-500">Số điện thoại là bắt buộc.</small>
                    <small v-if="submitted && employee.sdt && !isValidPhone(employee.sdt)" class="text-red-500">Số điện thoại không hợp lệ (10 số).</small>
                </div>
                <div>
                    <label for="trangThai" class="mb-3 block font-bold">Trạng thái *</label>
                    <Select id="trangThai" v-model="employee.trangThai" :options="statusOptionsForForm" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" :invalid="submitted && employee.trangThai === undefined" fluid />
                    <small v-if="submitted && employee.trangThai === undefined" class="text-red-500">Trạng thái là bắt buộc.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" :disabled="saving" />
                <Button label="Lưu" icon="pi pi-check" @click="saveEmployee" :loading="saving" />
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
                <Button label="Không" icon="pi pi-times" text @click="deleteEmployeeDialog = false" :disabled="deleting" />
                <Button label="Có" icon="pi pi-check" @click="deleteEmployee" :loading="deleting" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteEmployeesDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Bạn có chắc chắn muốn xóa các nhân viên đã chọn?</span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteEmployeesDialog = false" :disabled="deleting" />
                <Button label="Có" icon="pi pi-check" text @click="deleteSelectedEmployees" :loading="deleting" />
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
const saving = ref(false);
const deleting = ref(false);
const exporting = ref(false);

const statusOptions = ref([
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Hoạt động', value: 1 },
    { label: 'Ngưng hoạt động', value: 0 }
]);

const statusOptionsForForm = ref([
    { label: 'Hoạt động', value: 1 },
    { label: 'Ngưng hoạt động', value: 0 }
]);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);

onMounted(() => {
    fetchData();
});

async function fetchData() {
    isLoading.value = true;
    try {
        const res = await axios.get('http://localhost:8080/api/nhan-vien', {
            params: {
                page: 0,
                size: 100,
                sortBy: 'id',
                sortDir: 'desc'
            }
        });

        if (res.data && res.data.content) {
            employees.value = res.data.content; // ✅ ĐÚNG: sử dụng employees
            console.log(`✅ Loaded ${res.data.content.length} employees`);
        } else {
            employees.value = []; // ✅ ĐÚNG: sử dụng employees
        }
    } catch (error) {
        console.error('❌ Error fetching employees:', error);
        
        if (error.response?.status === 404) {
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'API endpoint không tồn tại',
                life: 3000
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể tải danh sách nhân viên', // ✅ SỬA: nhân viên thay vì khách hàng
                life: 3000
            });
        }
        employees.value = []; // ✅ ĐÚNG: sử dụng employees
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
    employee.value = {
        id: viewingEmployee.value.id,
        maNhanVien: viewingEmployee.value.maNhanVien,
        hoTen: viewingEmployee.value.hoTen,
        email: viewingEmployee.value.email,
        sdt: viewingEmployee.value.sdt,
        trangThai: viewingEmployee.value.trangThai,
        taiKhoan: viewingEmployee.value.taiKhoan,
        diaChi: viewingEmployee.value.diaChi
    };
    viewDialog.value = false;
    employeeDialog.value = true;
}

function editEmployee(emp) {
    employee.value = {
        id: emp.id,
        maNhanVien: emp.maNhanVien,
        hoTen: emp.hoTen,
        email: emp.email,
        sdt: emp.sdt,
        trangThai: emp.trangThai,
        taiKhoan: emp.taiKhoan,
        diaChi: emp.diaChi
    };
    employeeDialog.value = true;
}

function hideDialog() {
    employeeDialog.value = false;
    submitted.value = false;
    employee.value = {};
}

async function saveEmployee() {
    submitted.value = true;
    saving.value = true;

    if (!employee.value.hoTen?.trim() || !employee.value.email?.trim() || !isValidEmail(employee.value.email) || !employee.value.sdt?.trim() || !isValidPhone(employee.value.sdt) || employee.value.trangThai === undefined) {
        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Vui lòng điền đầy đủ và đúng định dạng thông tin bắt buộc',
            life: 3000
        });
        saving.value = false;
        return;
    }

    try {
        // Chuẩn bị dữ liệu theo format DTO
        const employeeData = {
            id: employee.value.id,
            maNhanVien: employee.value.maNhanVien,
            hoTen: employee.value.hoTen,
            email: employee.value.email,
            sdt: employee.value.sdt,
            trangThai: employee.value.trangThai,
            idTaiKhoan: employee.value.taiKhoan,
            idDiaChi: employee.value.diaChi
        };

        await axios.put(`http://localhost:8080/api/nhan-vien/${employee.value.id}`, employeeData);

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật nhân viên thành công',
            life: 3000
        });

        await fetchData();
        hideDialog();
    } catch (error) {
        console.error('Error saving employee:', error);
        if (error.response?.status === 409) {
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Email đã tồn tại trong hệ thống',
                life: 3000
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: `Cập nhật nhân viên thất bại: ${error.response?.data?.message || error.message}`,
                life: 5000
            });
        }
    } finally {
        saving.value = false;
    }
}

function confirmDeleteEmployee(emp) {
    employee.value = emp;
    deleteEmployeeDialog.value = true;
}

async function deleteEmployee() {
    deleting.value = true;
    try {
        await axios.delete(`http://localhost:8080/api/nhan-vien/${employee.value.id}`);
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
            detail: 'Xóa nhân viên thất bại',
            life: 3000
        });
    } finally {
        deleting.value = false;
    }
}

async function changeStatus(emp) {
    try {
        const newStatus = emp.trangThai === 1 ? 0 : 1;
        const updateData = {
            id: emp.id,
            maNhanVien: emp.maNhanVien,
            hoTen: emp.hoTen,
            email: emp.email,
            sdt: emp.sdt,
            trangThai: newStatus,
            idTaiKhoan: emp.taiKhoan,
            idDiaChi: emp.diaChi
        };

        await axios.put(`http://localhost:8080/api/nhan-vien/${emp.id}`, updateData);
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
            detail: 'Thay đổi trạng thái thất bại',
            life: 3000
        });
    }
}

function confirmDeleteSelected() {
    deleteEmployeesDialog.value = true;
}

async function deleteSelectedEmployees() {
    deleting.value = true;
    try {
        for (const emp of selectedEmployees.value) {
            await axios.delete(`http://localhost:8080/api/nhan-vien/${emp.id}`);
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
            detail: 'Xóa nhân viên thất bại',
            life: 3000
        });
    } finally {
        deleting.value = false;
    }
}

async function exportCSV() {
    exporting.value = true;
    try {
        if (!employees.value.length) {
            toast.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Không có dữ liệu để xuất',
                life: 3000
            });
            return;
        }

        const headers = ['ID', 'Mã Nhân Viên', 'Họ Tên', 'Email', 'SĐT', 'Trạng Thái', 'Ngày Tạo'];
        const csvData = employees.value.map((item) => [item.id || '', item.maNhanVien || '', item.hoTen || '', item.email || '', item.sdt || '', item.trangThai === 1 ? 'Hoạt động' : 'Ngừng hoạt động', formatDate(item.ngayTao)]);

        const csvContent = [headers, ...csvData].map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `NhanVien-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã xuất ${employees.value.length} bản ghi`,
            life: 3000
        });
    } catch (error) {
        console.error('Error exporting CSV:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Xuất CSV thất bại',
            life: 3000
        });
    } finally {
        exporting.value = false;
    }
}

function goToAccountManagement() {
    router.push('/tai-khoan');
}

function formatDate(date) {
    return date ? new Date(date).toLocaleDateString('vi-VN') : '';
}

function getInitials(name) {
    return name
        ? name
              .split(' ')
              .map((word) => word.charAt(0))
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : '';
}
</script>

<style scoped>
.card {
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}
</style>
