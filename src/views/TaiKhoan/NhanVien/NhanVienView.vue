<template>
    <div class="card">
        <!-- Header Actions -->
        <div class="card-header">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="text-2xl font-bold text-gray-900">Quản Lý Nhân Viên</h3>
                    <p class="text-gray-600 mt-1">Quản lý thông tin nhân viên và quyền hạn</p>
                </div>
                <div class="flex gap-2">
                    <Button
                        label="Thêm nhân viên"
                        icon="pi pi-plus"
                        severity="success"
                        @click="openCreateDialog"
                    />
                    <Button
                        label="Xuất Excel"
                        icon="pi pi-file-excel"
                        severity="secondary"
                        @click="exportToExcel"
                        :loading="exporting"
                    />
                </div>
            </div>
        </div>

        <!-- Search and Filter Section -->
        <div class="search-section">
            <div class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                <!-- Global Search -->
                <div class="md:col-span-2">
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText
                            v-model="searchFilters.global"
                            placeholder="Tìm kiếm tổng hợp..."
                            @input="debouncedSearch"
                            class="w-full"
                        />
                    </IconField>
                </div>

                <!-- Specific Filters -->
                <InputText
                    v-model="searchFilters.maNhanVien"
                    placeholder="Mã NV..."
                    @input="debouncedSearch"
                />
                <InputText
                    v-model="searchFilters.hoTen"
                    placeholder="Họ tên..."
                    @input="debouncedSearch"
                />
                <InputText
                    v-model="searchFilters.email"
                    placeholder="Email..."
                    @input="debouncedSearch"
                />
                <InputText
                    v-model="searchFilters.sdt"
                    placeholder="SĐT..."
                    @input="debouncedSearch"
                />
            </div>

            <div class="flex flex-wrap gap-2 items-center">
                <Select
                    v-model="searchFilters.trangThai"
                    :options="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Trạng thái"
                    class="w-40"
                    @change="applyFilters"
                />
                <Select
                    v-model="searchFilters.chucVu"
                    :options="positionOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Chức vụ"
                    class="w-40"
                    @change="applyFilters"
                />
                <Button
                    icon="pi pi-filter-slash"
                    outlined
                    @click="resetFilters"
                    title="Xóa bộ lọc"
                />
                <div class="ml-auto flex gap-2">
                    <Button
                        label="Xóa đã chọn"
                        icon="pi pi-trash"
                        severity="danger"
                        @click="confirmDeleteSelected"
                        :disabled="!selectedEmployees || !selectedEmployees.length"
                    />
                </div>
            </div>
        </div>

        <!-- Data Table -->
        <DataTable
            ref="dt"
            v-model:selection="selectedEmployees"
            :value="employees"
            dataKey="id"
            :paginator="true"
            :rows="pagination.size"
            :totalRecords="pagination.totalElements"
            :loading="isLoading"
            :lazy="true"
            @page="onPageChange"
            @sort="onSort"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[10, 25, 50, 100]"
            currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} nhân viên"
            class="responsive-table"
        >
            <!-- Table Columns -->
            <Column selectionMode="multiple" :exportable="false" style="width: 3rem"></Column>
            
            <Column field="id" header="ID" sortable style="width: 6rem">
                <template #body="slotProps">
                    <span class="font-bold text-primary">#{{ slotProps.data.id }}</span>
                </template>
            </Column>

            <Column field="maNhanVien" header="Mã NV" sortable style="width: 10rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.maNhanVien" severity="success" />
                </template>
            </Column>

            <Column field="hoTen" header="Thông tin nhân viên" sortable style="min-width: 18rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-3">
                        <Avatar
                            :label="getInitials(slotProps.data.hoTen)"
                            class="text-white"
                            style="background-color: #10b981"
                            size="large"
                        />
                        <div class="flex flex-col">
                            <span class="font-semibold text-gray-900">{{ slotProps.data.hoTen }}</span>
                            <span class="text-sm text-gray-500">{{ slotProps.data.email }}</span>
                            <span class="text-sm text-gray-500" v-if="slotProps.data.sdt">
                                <i class="pi pi-phone mr-1"></i>{{ slotProps.data.sdt }}
                            </span>
                            <div v-if="slotProps.data.chucVu" class="mt-1">
                                <Tag :value="slotProps.data.chucVu" severity="info" size="small" />
                            </div>
                        </div>
                    </div>
                </template>
            </Column>

            <Column header="Địa chỉ" style="min-width: 20rem">
                <template #body="slotProps">
                    <div class="address-display">
                        <div v-if="slotProps.data.danhSachDiaChi && slotProps.data.danhSachDiaChi.length > 0" class="flex items-center gap-2">
                            <Button icon="pi pi-map-marker" outlined severity="info" size="small" @click="viewAddress(slotProps.data)" title="Xem địa chỉ" />
                            <div class="flex flex-col">
                                <span class="text-sm">{{ getDefaultAddress(slotProps.data) }}</span>
                                <span class="text-green-600 text-xs font-semibold">
                                    {{ slotProps.data.danhSachDiaChi.length }} địa chỉ
                                </span>
                            </div>
                        </div>
                        <div v-else class="text-muted text-sm">
                            <i class="pi pi-map-marker mr-1"></i>
                            Chưa có địa chỉ
                        </div>
                    </div>
                </template>
            </Column>

            <Column header="Tài khoản & Hiệu suất" style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex flex-col gap-1">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-user text-blue-500"></i>
                            <span class="text-sm">
                                ID: {{ slotProps.data.idTaiKhoan || 'Chưa liên kết' }}
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-star text-yellow-500"></i>
                            <span class="text-sm font-semibold">
                                {{ slotProps.data.diemTichLuy || 0 }} điểm
                            </span>
                        </div>
                        <div class="flex items-center gap-2" v-if="slotProps.data.soGioLam">
                            <i class="pi pi-clock text-purple-500"></i>
                            <span class="text-sm">{{ slotProps.data.soGioLam }}h</span>
                        </div>
                    </div>
                </template>
            </Column>

            <Column field="trangThai" header="Trạng thái" sortable style="width: 12rem">
                <template #body="slotProps">
                    <Tag
                        :value="getStatusLabel(slotProps.data.trangThai)"
                        :severity="getStatusSeverity(slotProps.data.trangThai)"
                    >
                        <i :class="getStatusIcon(slotProps.data.trangThai)" class="mr-1"></i>
                        {{ getStatusLabel(slotProps.data.trangThai) }}
                    </Tag>
                </template>
            </Column>

            <Column field="ngayTao" header="Ngày vào làm" sortable style="width: 10rem">
                <template #body="slotProps">
                    <span class="text-sm">{{ formatDate(slotProps.data.ngayTao) }}</span>
                </template>
            </Column>

            <Column :exportable="false" style="width: 14rem">
                <template #body="slotProps">
                    <div class="flex gap-1">
                        <Button
                            icon="pi pi-eye"
                            size="small"
                            outlined
                            @click="viewEmployee(slotProps.data)"
                            title="Xem chi tiết"
                        />
                        <Button
                            icon="pi pi-pencil"
                            size="small"
                            outlined
                            severity="success"
                            @click="editEmployee(slotProps.data)"
                            title="Chỉnh sửa"
                        />
                        <Button
                            icon="pi pi-refresh"
                            size="small"
                            outlined
                            severity="secondary"
                            @click="changeStatus(slotProps.data)"
                            :title="slotProps.data.trangThai === 1 ? 'Vô hiệu hóa' : 'Kích hoạt'"
                        />
                        <Button
                            icon="pi pi-trash"
                            size="small"
                            outlined
                            severity="danger"
                            @click="confirmDeleteEmployee(slotProps.data)"
                            title="Xóa"
                        />
                    </div>
                </template>
            </Column>

            <template #empty>
                <div class="text-center py-8">
                    <i class="pi pi-users text-gray-400 text-6xl mb-4"></i>
                    <h5 class="text-gray-600 mb-2">Không tìm thấy nhân viên</h5>
                    <p class="text-gray-500 mb-4">
                        Thử thay đổi bộ lọc hoặc thêm nhân viên mới.
                    </p>
                    <div class="flex gap-2 justify-center">
                        <Button
                            label="Làm mới"
                            icon="pi pi-refresh"
                            outlined
                            @click="fetchData"
                        />
                        <Button
                            label="Thêm nhân viên"
                            icon="pi pi-plus"
                            @click="openCreateDialog"
                        />
                    </div>
                </div>
            </template>

            <template #loading>
                <div class="flex justify-center items-center py-8">
                    <ProgressSpinner size="50" strokeWidth="4" />
                </div>
            </template>
        </DataTable>

        <!-- View Employee Dialog -->
        <Dialog v-model:visible="viewDialog" :style="{ width: '800px' }" :header="`Chi tiết nhân viên - ${viewingEmployee?.hoTen || 'N/A'}`" :modal="true">
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
                        <div><strong>Chức vụ:</strong> {{ viewingEmployee.chucVu || 'Chưa có' }}</div>
                        <div><strong>Điểm tích lũy:</strong> {{ viewingEmployee.diemTichLuy || 0 }}</div>
                        <div>
                            <strong>Trạng thái:</strong>
                            <Tag :value="getStatusLabel(viewingEmployee.trangThai)" :severity="getStatusSeverity(viewingEmployee.trangThai)" />
                        </div>
                        <div><strong>Ngày tạo:</strong> {{ formatDate(viewingEmployee.ngayTao) }}</div>
                        <div><strong>Cập nhật:</strong> {{ formatDate(viewingEmployee.ngayCapNhat) }}</div>
                    </div>
                </div>

                <!-- Thông tin địa chỉ -->
                <div v-if="viewingEmployee.danhSachDiaChi && viewingEmployee.danhSachDiaChi.length > 0" class="rounded-lg bg-blue-50 p-4">
                    <h6 class="mb-3 font-semibold text-blue-700">Địa chỉ:</h6>
                    <div class="space-y-2">
                        <div v-for="(diaChi, index) in viewingEmployee.danhSachDiaChi" :key="index" class="border rounded p-2" :class="{ 'border-green-500 bg-green-50': diaChi.isDefault }">
                            <div class="flex justify-between items-start">
                                <div>
                                    <p class="text-sm mb-1">{{ diaChi.diaChiDayDu || formatAddressFromInfo(diaChi) }}</p>
                                </div>
                                <Tag v-if="diaChi.isDefault" value="Mặc định" severity="success" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Đóng" icon="pi pi-times" text @click="viewDialog = false" />
                <Button label="Sửa" icon="pi pi-pencil" @click="editFromView" />
            </template>
        </Dialog>

        <!-- Address Dialog -->
        <Dialog v-model:visible="addressDialog" :style="{ width: '600px' }" header="Chi tiết địa chỉ" :modal="true">
            <div v-if="viewingAddressEmployee">
                <div v-if="viewingAddressEmployee.danhSachDiaChi && viewingAddressEmployee.danhSachDiaChi.length > 0" class="space-y-3">
                    <div v-for="(diaChi, index) in viewingAddressEmployee.danhSachDiaChi" :key="index" class="border rounded p-3" :class="{ 'border-green-500 bg-green-50': diaChi.isDefault }">
                        <div class="flex justify-between items-start mb-2">
                            <h6 class="font-semibold">Địa chỉ {{ index + 1 }}</h6>
                            <Tag v-if="diaChi.isDefault" value="Mặc định" severity="success" />
                        </div>
                        <div class="text-sm space-y-1">
                            <p><strong>Địa chỉ:</strong> {{ diaChi.diaChiDayDu || formatAddressFromInfo(diaChi) }}</p>
                            <p v-if="diaChi.diaChiChiTiet"><strong>Chi tiết:</strong> {{ diaChi.diaChiChiTiet }}</p>
                            <p v-if="diaChi.tenPhuong"><strong>Phường/Xã:</strong> {{ diaChi.tenPhuong }} ({{ diaChi.maPhuong }})</p>
                            <p v-if="diaChi.tenTinh"><strong>Tỉnh/TP:</strong> {{ diaChi.tenTinh }} ({{ diaChi.maTinh }})</p>
                        </div>
                    </div>
                </div>
                <div v-else class="text-center text-muted">
                    <i class="pi pi-map-marker text-3xl mb-2"></i>
                    <p>Nhân viên chưa có địa chỉ</p>
                </div>
            </div>
            <template #footer>
                <Button label="Đóng" icon="pi pi-times" @click="addressDialog = false" />
            </template>
        </Dialog>

        <!-- Edit Employee Dialog -->
        <Dialog v-model:visible="employeeDialog" :style="{ width: '900px' }" :header="`${employee.id ? 'Cập nhật' : 'Thêm'} nhân viên`" :modal="true">
            <div class="flex flex-col gap-6">
                <!-- Thông tin cơ bản -->
                <div class="border-bottom pb-4">
                    <h6 class="mb-3 font-semibold">Thông tin cơ bản</h6>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="maNhanVien" class="mb-3 block font-bold">Mã nhân viên</label>
                            <InputText id="maNhanVien" v-model="employee.maNhanVien" :readonly="!!employee.id" fluid />
                            <small class="text-muted">{{ employee.id ? 'Mã nhân viên không thể thay đổi' : 'Để trống để tự tạo' }}</small>
                        </div>
                        <div>
                            <label for="hoTen" class="mb-3 block font-bold">Họ Tên *</label>
                            <InputText id="hoTen" v-model.trim="employee.hoTen" required="true" :invalid="submitted && !employee.hoTen" fluid />
                            <small v-if="submitted && !employee.hoTen" class="text-red-500">Họ tên là bắt buộc.</small>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mt-4">
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
                    </div>

                    <div class="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label for="chucVu" class="mb-3 block font-bold">Chức vụ</label>
                            <Select 
                                id="chucVu" 
                                v-model="employee.chucVu" 
                                :options="positionOptions.slice(1)" 
                                optionLabel="label" 
                                optionValue="value" 
                                placeholder="Chọn chức vụ" 
                                fluid 
                            />
                        </div>
                        <div>
                            <label for="trangThai" class="mb-3 block font-bold">Trạng thái *</label>
                            <Select id="trangThai" v-model="employee.trangThai" :options="statusOptionsForForm" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" :invalid="submitted && employee.trangThai === undefined" fluid />
                            <small v-if="submitted && employee.trangThai === undefined" class="text-red-500">Trạng thái là bắt buộc.</small>
                        </div>
                    </div>
                </div>

                <!-- Địa chỉ Section - Simplified -->
                <div class="border-bottom pb-4">
                    <h6 class="mb-3 font-semibold">
                        <i class="pi pi-map-marker mr-2"></i>
                        Địa chỉ
                    </h6>
                    
                    <div class="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label class="mb-2 block text-sm font-medium">Tỉnh/Thành phố</label>
                            <Select
                                v-model="editEmployeeAddress.tinhThanhCode"
                                :options="provinces"
                                optionLabel="name"
                                optionValue="code"
                                placeholder="Chọn Tỉnh/TP"
                                :loading="loadingProvinces"
                                @change="onEditEmployeeProvinceChange"
                                fluid
                            />
                        </div>
                        
                        <div>
                            <label class="mb-2 block text-sm font-medium">Xã/Phường</label>
                            <Select
                                v-model="editEmployeeAddress.phuongXaCode"
                                :options="editEmployeeWards"
                                optionLabel="name"
                                optionValue="code"
                                placeholder="Chọn Xã/Phường"
                                :disabled="!editEmployeeAddress.tinhThanhCode"
                                :loading="loadingEditEmployeeWards"
                                @change="onEditEmployeeWardChange"
                                fluid
                            />
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="mb-2 block text-sm font-medium">Địa chỉ chi tiết</label>
                        <InputText
                            v-model.trim="editEmployeeAddress.diaChiChiTiet"
                            placeholder="Số nhà, tên đường, ngõ..."
                            @input="updateEditEmployeeFullAddress"
                            fluid
                        />
                    </div>
                    
                    <!-- Preview địa chỉ đầy đủ -->
                    <div v-if="editEmployeeAddress.fullAddress" class="rounded bg-blue-50 p-3 border border-blue-200">
                        <label class="mb-1 block text-sm font-bold text-blue-800">
                            <i class="pi pi-info-circle mr-1"></i>
                            Địa chỉ đầy đủ:
                        </label>
                        <p class="text-blue-700 font-medium">{{ editEmployeeAddress.fullAddress }}</p>
                    </div>
                </div>

                <!-- Thông tin khác (readonly) -->
                <div class="bg-gray-50 p-4 rounded">
                    <h6 class="mb-3 font-semibold text-gray-700">Thông tin khác (chỉ đọc)</h6>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <strong>Điểm tích lũy:</strong> {{ employee.diemTichLuy || 0 }}
                        </div>
                        <div>
                            <strong>ID Tài khoản:</strong> {{ employee.idTaiKhoan || 'Chưa liên kết' }}
                        </div>
                    </div>
                </div>
            </div>
            
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideEmployeeDialog" :disabled="saving" />
                <Button label="Lưu" icon="pi pi-check" @click="saveEmployee" :loading="saving" />
            </template>
        </Dialog>

        <ConfirmDialog />
        <Toast />
    </div>
</template>

<script setup>
import axios from 'axios'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

// Composables
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

// Reactive State
const dt = ref()
const employees = ref([])
const selectedEmployees = ref([])
const isLoading = ref(false)
const saving = ref(false)
const exporting = ref(false)
const submitted = ref(false)
const loadingProvinces = ref(false)
const loadingEditEmployeeWards = ref(false)

// Dialog States
const viewDialog = ref(false)
const employeeDialog = ref(false)
const addressDialog = ref(false)

// Form Data
const employee = ref({})
const viewingEmployee = ref(null)
const viewingAddressEmployee = ref(null)

// Address Data
const provinces = ref([])
const editEmployeeWards = ref([])
const editEmployeeAddress = ref({
    tinhThanhCode: '',
    phuongXaCode: '',
    diaChiChiTiet: '',
    fullAddress: ''
})

// Search and Pagination
const searchFilters = ref({
    global: '',
    maNhanVien: '',
    hoTen: '',
    email: '',
    sdt: '',
    trangThai: '',
    chucVu: ''
})

const pagination = ref({
    page: 0,
    size: 10,
    sortField: 'id',
    sortOrder: -1,
    totalElements: 0,
    totalPages: 0
})

// Options
const statusOptions = ref([
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Đang làm việc', value: 1 },
    { label: 'Nghỉ việc', value: 0 }
])

const statusOptionsForForm = ref([
    { label: 'Đang làm việc', value: 1 },
    { label: 'Nghỉ việc', value: 0 }
])

const positionOptions = ref([
    { label: 'Tất cả chức vụ', value: '' },
    { label: 'Nhân viên bán hàng', value: 'Nhân viên bán hàng' },
    { label: 'Nhân viên kho', value: 'Nhân viên kho' },
    { label: 'Quản lý', value: 'Quản lý' },
    { label: 'Thủ kho', value: 'Thủ kho' },
    { label: 'Kế toán', value: 'Kế toán' }
])

// Computed
const hasSelectedEmployees = computed(() => 
    selectedEmployees.value && selectedEmployees.value.length > 0
)

// ===== UTILITY FUNCTIONS - ĐỊNH NGHĨA TRƯỚC =====
const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
}

const getInitials = (name) => {
    if (!name) return 'NV'
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

const getStatusLabel = (status) => {
    return status === 1 ? 'Đang làm việc' : 'Nghỉ việc'
}

const getStatusSeverity = (status) => {
    return status === 1 ? 'success' : 'danger'
}

const getStatusIcon = (status) => {
    return status === 1 ? 'pi pi-check-circle' : 'pi pi-times-circle'
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone)

// Helper Functions for Address
function getDefaultAddress(item) {
    if (!item.danhSachDiaChi || item.danhSachDiaChi.length === 0) {
        return 'Chưa có địa chỉ'
    }
    
    if (item.diaChiMacDinh && item.diaChiMacDinh.diaChiDayDu) {
        return truncateAddress(item.diaChiMacDinh.diaChiDayDu)
    }
    
    const firstAddr = item.danhSachDiaChi[0]
    return truncateAddress(firstAddr.diaChiDayDu || formatAddressFromInfo(firstAddr))
}

function formatAddressFromInfo(address) {
    if (!address) return 'Chưa có địa chỉ'
    
    const parts = [
        address.diaChiChiTiet,
        address.tenPhuong,
        address.tenHuyen,
        address.tenTinh
    ].filter(part => part && part.trim() !== '')
    
    return parts.length > 0 ? parts.join(', ') : 'Chưa có địa chỉ'
}

function truncateAddress(address) {
    if (!address) return ''
    return address.length > 50 ? address.substring(0, 50) + '...' : address
}

// ===== EVENT HANDLERS - ĐỊNH NGHĨA TRƯỚC KHI SỬ DỤNG =====
const applyFilters = () => {
    pagination.value.page = 0
    fetchData()
}

const resetFilters = () => {
    searchFilters.value = {
        global: '',
        maNhanVien: '',
        hoTen: '',
        email: '',
        sdt: '',
        trangThai: '',
        chucVu: ''
    }
    pagination.value.page = 0
    fetchData()
}

// Debounce function
const debounce = (func, wait) => {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

// ===== SỬ DỤNG SAU KHI applyFilters ĐÃ ĐƯỢC ĐỊNH NGHĨA =====
const debouncedSearch = debounce(applyFilters, 500)

// ===== ADDRESS FUNCTIONS =====
const fetchProvinces = async () => {
    if (provinces.value.length > 0) return

    try {
        loadingProvinces.value = true
        const response = await axios.get('http://localhost:8080/api/vietnam-address/provinces')
        
        if (response.data && response.data.success && response.data.data) {
            provinces.value = response.data.data.map(item => ({
                code: item.code.toString(),
                name: item.name,
                codename: item.codename
            }))
        } else {
            provinces.value = getFallbackProvinces()
        }
    } catch (error) {
        console.warn('⚠️ Provinces API failed:', error.message)
        provinces.value = getFallbackProvinces()
    } finally {
        loadingProvinces.value = false
    }
}

const getFallbackProvinces = () => [
    { code: '1', name: 'Hà Nội', codename: 'ha_noi' },
    { code: '79', name: 'TP. Hồ Chí Minh', codename: 'ho_chi_minh' },
    { code: '48', name: 'Đà Nẵng', codename: 'da_nang' },
    { code: '92', name: 'Cần Thơ', codename: 'can_tho' }
]

const getFallbackWards = () => [
    { code: '1', name: 'Phường/Xã 1', codename: 'phuong_xa_1' },
    { code: '2', name: 'Phường/Xã 2', codename: 'phuong_xa_2' },
    { code: '3', name: 'Phường/Xã 3', codename: 'phuong_xa_3' }
]

const fetchEditEmployeeWards = async (provinceCode) => {
    if (!provinceCode) {
        editEmployeeWards.value = []
        return
    }
    
    try {
        loadingEditEmployeeWards.value = true
        const response = await axios.get(`http://localhost:8080/api/vietnam-address/wards/${provinceCode}`)
        
        if (response.data && response.data.success && response.data.data) {
            editEmployeeWards.value = response.data.data.map(item => ({
                code: item.code.toString(),
                name: item.name,
                codename: item.codename
            }))
        } else {
            editEmployeeWards.value = getFallbackWards()
        }
    } catch (error) {
        console.warn('⚠️ Employee wards API failed:', error.message)
        editEmployeeWards.value = getFallbackWards()
    } finally {
        loadingEditEmployeeWards.value = false
    }
}

const onEditEmployeeProvinceChange = () => {
    editEmployeeAddress.value.phuongXaCode = ''
    editEmployeeWards.value = []
    
    if (editEmployeeAddress.value.tinhThanhCode) {
        fetchEditEmployeeWards(editEmployeeAddress.value.tinhThanhCode)
    }
    updateEditEmployeeFullAddress()
}

const onEditEmployeeWardChange = () => {
    updateEditEmployeeFullAddress()
}

const updateEditEmployeeFullAddress = () => {
    const provinceName = provinces.value.find(p => p.code === editEmployeeAddress.value.tinhThanhCode)?.name || ''
    const wardName = editEmployeeWards.value.find(w => w.code === editEmployeeAddress.value.phuongXaCode)?.name || ''
    
    const addressParts = [
        editEmployeeAddress.value.diaChiChiTiet,
        wardName,
        provinceName
    ].filter(part => part && part.trim() !== '')
    
    editEmployeeAddress.value.fullAddress = addressParts.join(', ')
}

// ===== API FUNCTIONS =====
const fetchData = async () => {
    isLoading.value = true
    try {
        const params = {
            page: pagination.value.page,
            size: pagination.value.size,
            sortBy: pagination.value.sortField || 'id',
            sortDir: pagination.value.sortOrder === 1 ? 'asc' : 'desc',
            ...searchFilters.value
        }

        // Remove empty parameters
        Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null || params[key] === undefined) {
                delete params[key]
            }
        })

        console.log('📡 Fetching employees with params:', params)
        
        const response = await axios.get('http://localhost:8080/api/nhan-vien', { params })

        if (response.data && response.data.content) {
            employees.value = response.data.content
            pagination.value.totalElements = response.data.totalElements || 0
            pagination.value.totalPages = response.data.totalPages || 0
            console.log(`✅ Loaded ${response.data.content.length} employees`)
        } else {
            employees.value = []
        }
    } catch (error) {
        console.error('❌ Error fetching employees:', error)
        handleApiError(error, 'Không thể tải danh sách nhân viên')
        employees.value = []
    } finally {
        isLoading.value = false
    }
}

const saveEmployee = async () => {
    submitted.value = true
    
    if (!employee.value.hoTen?.trim() || !employee.value.email?.trim() || !isValidEmail(employee.value.email) || !employee.value.sdt?.trim() || !isValidPhone(employee.value.sdt) || employee.value.trangThai === undefined) {
        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Vui lòng điền đầy đủ và đúng định dạng thông tin bắt buộc',
            life: 3000
        })
        return
    }

    saving.value = true
    try {
        const employeeData = {
            hoTen: employee.value.hoTen,
            email: employee.value.email,
            sdt: employee.value.sdt,
            chucVu: employee.value.chucVu,
            trangThai: employee.value.trangThai
        }

        if (employee.value.maNhanVien) {
            employeeData.maNhanVien = employee.value.maNhanVien
        }

        if (employee.value.id) {
            employeeData.id = employee.value.id
            employeeData.idTaiKhoan = employee.value.idTaiKhoan
            employeeData.idDiaChi = employee.value.idDiaChi
            await axios.put(`http://localhost:8080/api/nhan-vien/${employee.value.id}`, employeeData)
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Cập nhật nhân viên thành công',
                life: 3000
            })
        } else {
            await axios.post('http://localhost:8080/api/nhan-vien', employeeData)
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Thêm nhân viên thành công',
                life: 3000
            })
        }

        await fetchData()
        hideEmployeeDialog()
    } catch (error) {
        console.error('Error saving employee:', error)
        handleApiError(error, 'Không thể lưu thông tin nhân viên')
    } finally {
        saving.value = false
    }
}

const changeStatus = async (employeeData) => {
    try {
        const newStatus = employeeData.trangThai === 1 ? 0 : 1
        const updateData = {
            id: employeeData.id,
            maNhanVien: employeeData.maNhanVien,
            hoTen: employeeData.hoTen,
            email: employeeData.email,
            sdt: employeeData.sdt,
            chucVu: employeeData.chucVu,
            trangThai: newStatus,
            idTaiKhoan: employeeData.idTaiKhoan,
            idDiaChi: employeeData.idDiaChi
        }

        await axios.put(`http://localhost:8080/api/nhan-vien/${employeeData.id}`, updateData)
        await fetchData()
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã ${newStatus === 1 ? 'kích hoạt' : 'ngưng'} nhân viên`,
            life: 3000
        })
    } catch (error) {
        console.error('Error changing status:', error)
        handleApiError(error, 'Thay đổi trạng thái thất bại')
    }
}

const deleteEmployee = async (employeeId) => {
    try {
        await axios.delete(`http://localhost:8080/api/nhan-vien/${employeeId}`)
        await fetchData()
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa nhân viên thành công',
            life: 3000
        })
    } catch (error) {
        console.error('Error deleting employee:', error)
        handleApiError(error, 'Xóa nhân viên thất bại')
    }
}

const deleteSelectedEmployees = async () => {
    try {
        for (const emp of selectedEmployees.value) {
            await axios.delete(`http://localhost:8080/api/nhan-vien/${emp.id}`)
        }
        await fetchData()
        selectedEmployees.value = []
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa các nhân viên thành công',
            life: 3000
        })
    } catch (error) {
        console.error('Error deleting employees:', error)
        handleApiError(error, 'Xóa nhân viên thất bại')
    }
}

const onPageChange = (event) => {
    pagination.value.page = event.page
    pagination.value.size = event.rows
    fetchData()
}

const onSort = (event) => {
    pagination.value.sortField = event.sortField
    pagination.value.sortOrder = event.sortOrder
    fetchData()
}

// Dialog Functions
const openCreateDialog = () => {
    employee.value = {
        trangThai: 1
    }
    submitted.value = false
    employeeDialog.value = true
    fetchProvinces()
    
    // Reset address form
    editEmployeeAddress.value = {
        tinhThanhCode: '',
        phuongXaCode: '',
        diaChiChiTiet: '',
        fullAddress: ''
    }
    editEmployeeWards.value = []
}

function viewAddress(emp) {
    viewingAddressEmployee.value = emp
    addressDialog.value = true
}

function viewEmployee(emp) {
    viewingEmployee.value = { ...emp }
    viewDialog.value = true
}

function editFromView() {
    employee.value = {
        id: viewingEmployee.value.id,
        maNhanVien: viewingEmployee.value.maNhanVien,
        hoTen: viewingEmployee.value.hoTen,
        email: viewingEmployee.value.email,
        sdt: viewingEmployee.value.sdt,
        chucVu: viewingEmployee.value.chucVu,
        trangThai: viewingEmployee.value.trangThai,
        idTaiKhoan: viewingEmployee.value.idTaiKhoan,
        idDiaChi: viewingEmployee.value.idDiaChi,
        diemTichLuy: viewingEmployee.value.diemTichLuy
    }
    viewDialog.value = false
    employeeDialog.value = true
    submitted.value = false
    fetchProvinces()
}

function editEmployee(emp) {
    employee.value = {
        id: emp.id,
        maNhanVien: emp.maNhanVien,
        hoTen: emp.hoTen,
        email: emp.email,
        sdt: emp.sdt,
        chucVu: emp.chucVu,
        trangThai: emp.trangThai,
        idTaiKhoan: emp.idTaiKhoan,
        idDiaChi: emp.idDiaChi,
        diemTichLuy: emp.diemTichLuy
    }
    employeeDialog.value = true
    submitted.value = false
    fetchProvinces()
}

const hideEmployeeDialog = () => {
    employeeDialog.value = false
    submitted.value = false
    employee.value = {}
    
    // Reset address form
    editEmployeeAddress.value = {
        tinhThanhCode: '',
        phuongXaCode: '',
        diaChiChiTiet: '',
        fullAddress: ''
    }
    editEmployeeWards.value = []
}

// Confirmation Functions
const confirmDeleteEmployee = (employeeData) => {
    confirm.require({
        message: `Bạn có chắc chắn muốn xóa nhân viên "${employeeData.hoTen}"?`,
        header: 'Xác nhận xóa',
        icon: 'pi pi-exclamation-triangle',
        rejectClass: 'p-button-secondary p-button-outlined',
        rejectLabel: 'Hủy',
        acceptLabel: 'Xóa',
        accept: () => deleteEmployee(employeeData.id)
    })
}

const confirmDeleteSelected = () => {
    if (!hasSelectedEmployees.value) return

    confirm.require({
        message: `Bạn có chắc chắn muốn xóa ${selectedEmployees.value.length} nhân viên đã chọn?`,
        header: 'Xác nhận xóa',
        icon: 'pi pi-exclamation-triangle',
        rejectClass: 'p-button-secondary p-button-outlined',
        rejectLabel: 'Hủy',
        acceptLabel: 'Xóa',
        accept: () => deleteSelectedEmployees()
    })
}

// Export Functions
const exportToExcel = async () => {
    exporting.value = true
    try {
        if (!employees.value.length) {
            toast.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Không có dữ liệu để xuất',
                life: 3000
            })
            return
        }

        const headers = ['ID', 'Mã Nhân Viên', 'Họ Tên', 'Email', 'SĐT', 'Chức Vụ', 'Điểm Tích Lũy', 'Địa Chỉ', 'Trạng Thái', 'Ngày Tạo']
        const csvData = employees.value.map((item) => [
            item.id || '', 
            item.maNhanVien || '', 
            item.hoTen || '', 
            item.email || '', 
            item.sdt || '', 
            item.chucVu || '',
            item.diemTichLuy || 0,
            getDefaultAddress(item),
            item.trangThai === 1 ? 'Đang làm việc' : 'Nghỉ việc', 
            formatDate(item.ngayTao)
        ])

        const csvContent = [headers, ...csvData].map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n')

        const BOM = '\uFEFF'
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `NhanVien-${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã xuất ${employees.value.length} bản ghi`,
            life: 3000
        })
    } catch (error) {
        console.error('Error exporting CSV:', error)
        handleApiError(error, 'Xuất CSV thất bại')
    } finally {
        exporting.value = false
    }
}

// Helper Functions
const handleApiError = (error, defaultMessage) => {
    let errorMessage = defaultMessage
    
    if (error.response) {
        const { status, data } = error.response
        switch (status) {
            case 400:
                errorMessage = data.message || 'Dữ liệu không hợp lệ'
                break
            case 404:
                errorMessage = 'Không tìm thấy dữ liệu'
                break
            case 500:
                errorMessage = 'Lỗi server nội bộ'
                break
            default:
                errorMessage = data.message || defaultMessage
        }
    } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Không thể kết nối đến server'
    }

    toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: errorMessage,
        life: 5000
    })
}

// Lifecycle
onMounted(() => {
    fetchData()
})

// Watchers
watch(() => pagination.value.size, () => {
    pagination.value.page = 0
    fetchData()
})
</script>

<style scoped>
.card {
    @apply bg-white rounded-lg shadow-sm border border-gray-200;
}

.card-header {
    @apply p-6 border-b border-gray-200;
}

.search-section {
    @apply p-6 bg-gray-50 border-b border-gray-200;
}

.responsive-table {
    @apply bg-white;
}

.address-display {
    @apply text-sm;
}

.text-muted {
    color: #6c757d;
}

.text-green-600 {
    color: #16a34a;
}

.text-xs {
    font-size: 0.75rem;
}

.font-semibold {
    font-weight: 600;
}

.border-bottom {
    border-bottom: 1px solid #dee2e6;
}

:deep(.p-datatable) {
    @apply border-0;
}

:deep(.p-datatable-header) {
    @apply bg-gray-50 border-b border-gray-200;
}

:deep(.p-datatable-tbody tr) {
    @apply hover:bg-gray-50 transition-colors;
}

:deep(.p-paginator) {
    @apply bg-white border-t border-gray-200;
}

@media (max-width: 768px) {
    .search-section .grid {
        @apply grid-cols-1 gap-2;
    }
    
    :deep(.p-datatable-responsive-demo .p-datatable-tbody tr td) {
        @apply text-sm;
    }
}
</style>