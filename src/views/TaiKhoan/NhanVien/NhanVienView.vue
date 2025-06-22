<template>
    <div class="card">
        <!-- Toolbar -->
        <Toolbar class="mb-6">
            <template #start>
                <!-- <Button label="Thêm nhân viên" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" /> -->
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
                    <p class="text-muted">Thử thay đổi bộ lọc hoặc thêm nhân viên mới.</p>
                </div>
            </template>
        </DataTable>

        <!-- View Employee Dialog -->
        <Dialog v-model:visible="viewDialog" :style="{ width: '700px' }" :header="`Chi tiết nhân viên - ${viewingEmployee?.hoTen || 'N/A'}`" :modal="true">
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
                        <div><strong>Tên:</strong> {{ viewingEmployee.diaChi.tenKhachHang || 'N/A' }}</div>
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
                            <InputText id="email" v-model="employee.email" required="true" :invalid="submitted && (!employee.email || !isValidEmail(employee.email))" fluid />
                            <small v-if="submitted && !employee.email" class="text-red-500">Email là bắt buộc.</small>
                            <small v-if="submitted && employee.email && !isValidEmail(employee.email)" class="text-red-500">Email không hợp lệ.</small>
                        </div>
                        <div>
                            <label for="sdt" class="block font-bold mb-3">Số điện thoại *</label>
                            <InputText id="sdt" v-model="employee.sdt" required="true" :invalid="submitted && (!employee.sdt || !isValidPhone(employee.sdt))" fluid />
                            <small v-if="submitted && !employee.sdt" class="text-red-500">Số điện thoại là bắt buộc.</small>
                            <small v-if="submitted && employee.sdt && !isValidPhone(employee.sdt)" class="text-red-500">Số điện thoại không hợp lệ.</small>
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
                    <label for="trangThai" class="block font-bold mb-3">Trạng thái *</label>
                    <Select id="trangThai" v-model="employee.trangThai" :options="statusOptions.slice(1)" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" :invalid="submitted && employee.trangThai === undefined" fluid />
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

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);

async function generateEmployeeCode() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    let suffix = 1;
    let newCode = `NV-${dateStr}-${String(suffix).padStart(3, '0')}`;

    try {
        while (true) {
            const res = await axios.get(`http://localhost:8080/nhan-vien/check-code?code=${newCode}`, { timeout: 5000 });
            if (res.data.available) break;
            suffix++;
            newCode = `NV-${dateStr}-${String(suffix).padStart(3, '0')}`;
        }
        return newCode;
    } catch (error) {
        console.error('Error generating employee code:', error);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tạo mã nhân viên', life: 3000 });
        return null;
    }
}

onMounted(() => {
    fetchData();
});

async function fetchData() {
    isLoading.value = true;
    try {
        const res = await axios.get('http://localhost:8080/nhan-vien', { timeout: 10000 });
        employees.value = res.data.map((emp) => ({
            ...emp,
            diaChi: emp.diaChi || { tenKhachHang: '', tenPhuong: '', tenHuyen: '', tenTinh: '' }
        }));
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

function openNew() {
    employee.value = {
        trangThai: 1,
        diaChi: {
            tenKhachHang: '',
            tenTinh: '',
            tenHuyen: '',
            tenPhuong: ''
        }
    };
    submitted.value = false;
    employeeDialog.value = true;
}

function viewEmployee(emp) {
    viewingEmployee.value = { ...emp, diaChi: emp.diaChi || { tenKhachHang: '', tenTinh: '', tenHuyen: '', tenPhuong: '' } };
    viewDialog.value = true;
}

function editFromView() {
    employee.value = { ...viewingEmployee.value, trangThai: viewingEmployee.value.trangThai ?? 1 };
    viewDialog.value = false;
    employeeDialog.value = true;
}

async function editEmployee(emp) {
    employee.value = { ...emp, trangThai: emp.trangThai ?? 1, diaChi: emp.diaChi || { tenKhachHang: '', tenTinh: '', tenHuyen: '', tenPhuong: '' } };
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

    if (
        !employee.value.hoTen?.trim() ||
        !employee.value.email?.trim() ||
        !isValidEmail(employee.value.email) ||
        !employee.value.sdt?.trim() ||
        !isValidPhone(employee.value.sdt) ||
        !employee.value.diaChi?.tenPhuong?.trim() ||
        !employee.value.diaChi?.tenHuyen?.trim() ||
        !employee.value.diaChi?.tenTinh?.trim() ||
        employee.value.trangThai === undefined
    ) {
        toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng điền đầy đủ và đúng định dạng thông tin bắt buộc', life: 3000 });
        saving.value = false;
        return;
    }

    try {
        if (!employee.value.maNhanVien) {
            const newCode = await generateEmployeeCode();
            if (!newCode) {
                saving.value = false;
                return;
            }
            employee.value.maNhanVien = newCode;
        }

        let addressId = employee.value.diaChi.id;
        if (!addressId) {
            const addressRes = await axios.post('http://localhost:8080/api/dia-chi', employee.value.diaChi, { timeout: 5000 });
            addressId = addressRes.data.id;
        } else {
            await axios.put(`http://localhost:8080/api/dia-chi/${addressId}`, employee.value.diaChi, { timeout: 5000 });
        }

        const employeeData = {
            ...employee.value,
            diaChi: addressId
        };

        if (employee.value.id) {
            await axios.put(`http://localhost:8080/nhan-vien/${employee.value.id}`, employeeData, { timeout: 5000 });
            toast.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật nhân viên thành công', life: 3000 });
        } else {
            await axios.post('http://localhost:8080/nhan-vien', employeeData, { timeout: 5000 });
            toast.add({ severity: 'success', summary: 'Thành công', detail: 'Thêm nhân viên thành công', life: 3000 });
        }

        await fetchData();
        hideDialog();
    } catch (error) {
        console.error('Error saving employee:', error);
        if (error.response?.status === 409) {
            toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Email hoặc mã nhân viên đã tồn tại', life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Lỗi', detail: `Lưu nhân viên thất bại: ${error.message}`, life: 5000 });
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
        await axios.delete(`http://localhost:8080/nhan-vien/${employee.value.id}`, { timeout: 5000 });
        await fetchData();
        deleteEmployeeDialog.value = false;
        employee.value = {};
        toast.add({ severity: 'success', summary: 'Thành công', detail: 'Xóa nhân viên thành công', life: 3000 });
    } catch (error) {
        console.error('Error deleting employee:', error);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Xóa nhân viên thất bại', life: 3000 });
    } finally {
        deleting.value = false;
    }
}

async function changeStatus(emp) {
    try {
        const newStatus = emp.trangThai === 1 ? 0 : 1;
        await axios.put(`http://localhost:8080/nhan-vien/${emp.id}`, { ...emp, trangThai: newStatus }, { timeout: 5000 });
        await fetchData();
        toast.add({ severity: 'success', summary: 'Thành công', detail: `Đã ${newStatus === 1 ? 'kích hoạt' : 'ngưng'} nhân viên`, life: 3000 });
    } catch (error) {
        console.error('Error changing status:', error);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Thay đổi trạng thái thất bại', life: 3000 });
    }
}

function confirmDeleteSelected() {
    deleteEmployeesDialog.value = true;
}

async function deleteSelectedEmployees() {
    deleting.value = true;
    try {
        for (const emp of selectedEmployees.value) {
            await axios.delete(`http://localhost:8080/nhan-vien/${emp.id}`, { timeout: 5000 });
        }
        await fetchData();
        deleteEmployeesDialog.value = false;
        selectedEmployees.value = null;
        toast.add({ severity: 'success', summary: 'Thành công', detail: 'Xóa các nhân viên thành công', life: 3000 });
    } catch (error) {
        console.error('Error deleting employees:', error);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Xóa nhân viên thất bại', life: 3000 });
    } finally {
        deleting.value = false;
    }
}

async function exportCSV() {
    exporting.value = true;
    try {
        if (!employees.value.length) {
            toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Không có dữ liệu để xuất', life: 3000 });
            return;
        }

        const headers = ['ID', 'Mã Nhân Viên', 'Họ Tên', 'Email', 'SĐT', 'Địa Chỉ', 'Trạng Thái', 'Ngày Tạo'];
        const csvData = employees.value.map((item) => [
            item.id || '',
            item.maNhanVien || '',
            item.hoTen || '',
            item.email || '',
            item.sdt || '',
            formatFullAddress(item.diaChi) || '',
            item.trangThai === 1 ? 'Hoạt động' : 'Ngừng hoạt động',
            formatDate(item.ngayTao)
        ]);

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

        toast.add({ severity: 'success', summary: 'Thành công', detail: `Đã xuất ${employees.value.length} bản ghi`, life: 3000 });
    } catch (error) {
        console.error('Error exporting CSV:', error);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Xuất CSV thất bại', life: 3000 });
    } finally {
        exporting.value = false;
    }
}

function goToAccountManagement() {
    router.push('/tai-khoan');
}

function formatFullAddress(diaChi) {
    if (!diaChi || (!diaChi.tenPhuong && !diaChi.tenHuyen && !diaChi.tenTinh)) return 'Chưa cập nhật địa chỉ';
    return [diaChi.tenPhuong, diaChi.tenHuyen, diaChi.tenTinh].filter((part) => part?.trim()).join(', ');
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
.border-bottom {
    border-bottom: 1px solid #e9ecef;
}
</style>
