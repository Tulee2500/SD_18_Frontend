<template>
    <div class="card">
        <!-- Header Actions -->
        <div class="card-header">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="text-2xl font-bold text-gray-900">Quản Lý Khách Hàng</h3>
                    <p class="text-gray-600 mt-1">Quản lý thông tin khách hàng và địa chỉ</p>
                </div>
                <div class="flex gap-2">
                    <Button
                        label="Thêm khách hàng"
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

        <!-- Simplified Search Section -->
        <div class="search-section">
            <!-- Main Global Search -->
            <div class="grid grid-cols-1 gap-4 mb-4">
                <div class="relative">
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText
                            v-model="globalSearch"
                            placeholder="Tìm kiếm theo tên, email, SĐT, mã KH, địa chỉ..."
                            @input="debouncedGlobalSearch"
                            class="w-full text-lg py-3"
                        />
                    </IconField>
                    <!-- Clear search button -->
                    <Button
                        v-if="globalSearch"
                        icon="pi pi-times"
                        class="absolute right-2 top-1/2 transform -translate-y-1/2"
                        text
                        rounded
                        size="small"
                        @click="clearGlobalSearch"
                        title="Xóa tìm kiếm"
                    />
                </div>
            </div>

            <!-- Search Results Info -->
            <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                    <i class="pi pi-info-circle"></i>
                    <span v-if="isLoading">Đang tìm kiếm...</span>
                    <span v-else>
                        Hiển thị {{ customers.length }} / {{ totalRecords }} khách hàng
                        <span v-if="globalSearch" class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            Kết quả cho: "{{ globalSearch }}"
                        </span>
                    </span>
                </div>

                <!-- Advanced Filters Toggle -->
                <div class="flex gap-2 items-center">
                    <Button
                        :label="showAdvancedFilters ? 'Ẩn bộ lọc' : 'Bộ lọc nâng cao'"
                        :icon="showAdvancedFilters ? 'pi pi-chevron-up' : 'pi pi-filter'"
                        outlined
                        size="small"
                        @click="toggleAdvancedFilters"
                    />
                    <Button
                        label="Xóa đã chọn"
                        icon="pi pi-trash"
                        severity="danger"
                        size="small"
                        @click="confirmDeleteSelected"
                        :disabled="!selectedCustomers || !selectedCustomers.length"
                    />
                </div>
            </div>

            <!-- Advanced Filters (Collapsible) -->
            <div v-if="showAdvancedFilters" class="bg-gray-50 p-4 rounded-lg border mb-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                    <Select
                        v-model="advancedFilters.trangThai"
                        :options="statusOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Trạng thái"
                        @change="applyAdvancedFilters"
                    />
                    <DatePicker
                        v-model="advancedFilters.startDate"
                        placeholder="Từ ngày"
                        dateFormat="dd/mm/yy"
                        @date-select="applyAdvancedFilters"
                        showIcon
                    />
                    <DatePicker
                        v-model="advancedFilters.endDate"
                        placeholder="Đến ngày"
                        dateFormat="dd/mm/yy"
                        @date-select="applyAdvancedFilters"
                        showIcon
                    />
                    <Button
                        label="Xóa bộ lọc"
                        icon="pi pi-filter-slash"
                        outlined
                        @click="resetAdvancedFilters"
                    />
                </div>
            </div>
        </div>

        <!-- Data Table (giữ nguyên phần này) -->
        <DataTable
            ref="dt"
            v-model:selection="selectedCustomers"
            :value="customers"
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
            currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} khách hàng"
            class="responsive-table"
        >
            <!-- Table Columns (giữ nguyên) -->
            <Column selectionMode="multiple" :exportable="false" style="width: 3rem"></Column>
            
            <Column field="id" header="ID" sortable style="width: 6rem">
                <template #body="slotProps">
                    <span class="font-bold text-primary">#{{ slotProps.data.id }}</span>
                </template>
            </Column>

            <Column field="maKhachHang" header="Mã KH" sortable style="width: 10rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.maKhachHang" severity="info" />
                </template>
            </Column>

            <Column field="hoTen" header="Thông tin khách hàng" sortable style="min-width: 18rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-3">
                        <Avatar
                            :label="getInitials(slotProps.data.hoTen)"
                            class="text-white"
                            style="background-color: #3b82f6"
                            size="large"
                        />
                        <div class="flex flex-col">
                            <span class="font-semibold text-gray-900">{{ slotProps.data.hoTen }}</span>
                            <span class="text-sm text-gray-500">{{ slotProps.data.email }}</span>
                            <span class="text-sm text-gray-500" v-if="slotProps.data.sdt">
                                <i class="pi pi-phone mr-1"></i>{{ slotProps.data.sdt }}
                            </span>
                        </div>
                    </div>
                </template>
            </Column>

            <Column header="Địa chỉ" style="min-width: 20rem">
                <template #body="slotProps">
                    <div class="address-display">
                        <div v-if="getDefaultAddress(slotProps.data)" class="flex items-center gap-2">
                            <Button 
                                icon="pi pi-map-marker" 
                                outlined 
                                severity="info" 
                                size="small" 
                                @click="viewAllAddresses(slotProps.data)" 
                                title="Xem tất cả địa chỉ" 
                            />
                            <div class="flex flex-col">
                                <span class="text-sm">{{ getDefaultAddress(slotProps.data) }}</span>
                                <span class="text-blue-600 text-xs font-semibold" v-if="getAddressCount(slotProps.data) > 0">
                                    {{ getAddressCount(slotProps.data) }} địa chỉ
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

            <Column header="Tài khoản & Điểm" style="min-width: 12rem">
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
                                {{ slotProps.data.idViDiem || 'Chưa có ví' }}
                            </span>
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

            <Column field="ngayTao" header="Ngày tạo" sortable style="width: 10rem">
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
                            @click="viewCustomer(slotProps.data)"
                            title="Xem chi tiết"
                        />
                        <Button
                            icon="pi pi-pencil"
                            size="small"
                            outlined
                            severity="success"
                            @click="editCustomer(slotProps.data)"
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
                            @click="confirmDeleteCustomer(slotProps.data)"
                            title="Xóa"
                        />
                    </div>
                </template>
            </Column>

            <template #empty>
                <div class="text-center py-8">
                    <i class="pi pi-users text-gray-400 text-6xl mb-4"></i>
                    <h5 class="text-gray-600 mb-2">Không tìm thấy khách hàng</h5>
                    <p class="text-gray-500 mb-4">
                        {{ globalSearch ? 'Thử thay đổi từ khóa tìm kiếm hoặc tạo khách hàng mới.' : 'Thử thay đổi bộ lọc hoặc tạo khách hàng mới.' }}
                    </p>
                    <div class="flex gap-2 justify-center">
                        <Button
                            v-if="globalSearch"
                            label="Xóa tìm kiếm"
                            icon="pi pi-times"
                            outlined
                            @click="clearGlobalSearch"
                        />
                        <Button
                            label="Làm mới"
                            icon="pi pi-refresh"
                            outlined
                            @click="fetchData"
                        />
                        <Button
                            label="Thêm khách hàng"
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

        <!-- Dialogs giữ nguyên như code cũ -->
        <!-- Customer View Dialog -->
        <Dialog v-model:visible="viewDialog" :style="{ width: '800px' }" :header="`Chi tiết khách hàng - ${viewingCustomer?.hoTen || 'N/A'}`" :modal="true">
            <!-- Nội dung giữ nguyên -->
        </Dialog>

        <!-- Customer Edit Dialog -->
        <Dialog v-model:visible="customerDialog" :style="{ width: '900px' }" :header="`${customer.id ? 'Cập nhật' : 'Thêm'} khách hàng`" :modal="true">
            <!-- Nội dung giữ nguyên -->
        </Dialog>

        <!-- Address List Dialog -->
        <Dialog v-model:visible="addressListDialog" :style="{ width: '700px' }" header="Danh sách địa chỉ" :modal="true">
            <!-- Nội dung giữ nguyên -->
        </Dialog>

        <!-- Delete Confirmation Dialogs -->
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
const customers = ref([])
const selectedCustomers = ref([])
const isLoading = ref(false)
const saving = ref(false)
const exporting = ref(false)
const submitted = ref(false)
const totalRecords = ref(0)

// Dialog States
const viewDialog = ref(false)
const customerDialog = ref(false)
const addressListDialog = ref(false)

// Form Data
const customer = ref({})
const viewingCustomer = ref(null)
const selectedCustomerAddresses = ref(null)

// Search States - SIMPLIFIED
const globalSearch = ref('')
const showAdvancedFilters = ref(false)

// Advanced Filters (Optional)
const advancedFilters = ref({
    trangThai: '',
    startDate: null,
    endDate: null
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
    { label: 'Hoạt động', value: 1 },
    { label: 'Tạm khóa', value: 0 }
])

const statusOptionsForForm = ref([
    { label: 'Hoạt động', value: 1 },
    { label: 'Tạm khóa', value: 0 }
])

// Computed
const hasSelectedCustomers = computed(() => 
    selectedCustomers.value && selectedCustomers.value.length > 0
)

// Utility Functions (giữ nguyên tất cả các function utility cũ)
const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
}

const getInitials = (name) => {
    if (!name) return 'KH'
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

const getStatusLabel = (status) => {
    return status === 1 ? 'Hoạt động' : 'Tạm khóa'
}

const getStatusSeverity = (status) => {
    return status === 1 ? 'success' : 'danger'
}

const getStatusIcon = (status) => {
    return status === 1 ? 'pi pi-check-circle' : 'pi pi-times-circle'
}

const getDefaultAddress = (customer) => {
    if (customer.diaChiMacDinh && customer.diaChiMacDinh.diaChiDayDu) {
        return truncateAddress(customer.diaChiMacDinh.diaChiDayDu)
    }
    if (customer.danhSachDiaChi && customer.danhSachDiaChi.length > 0) {
        const firstAddress = customer.danhSachDiaChi[0]
        return truncateAddress(firstAddress.diaChiDayDu || formatAddressFromInfo(firstAddress))
    }
    return null
}

const getAddressCount = (customer) => {
    return customer.danhSachDiaChi ? customer.danhSachDiaChi.length : 0
}

const formatAddressFromInfo = (address) => {
    if (!address) return 'Chưa có địa chỉ'
    
    const parts = [
        address.diaChiChiTiet,
        address.tenPhuong,
        address.tenHuyen,
        address.tenTinh
    ].filter(part => part && part.trim() !== '')
    
    return parts.length > 0 ? parts.join(', ') : 'Chưa có địa chỉ'
}

const truncateAddress = (address) => {
    if (!address) return ''
    return address.length > 50 ? address.substring(0, 50) + '...' : address
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone)

// OPTIMIZED SEARCH FUNCTIONS
const clearGlobalSearch = () => {
    globalSearch.value = ''
    pagination.value.page = 0
    fetchData()
}

const toggleAdvancedFilters = () => {
    showAdvancedFilters.value = !showAdvancedFilters.value
}

const resetAdvancedFilters = () => {
    advancedFilters.value = {
        trangThai: '',
        startDate: null,
        endDate: null
    }
    applyAdvancedFilters()
}

const applyAdvancedFilters = () => {
    pagination.value.page = 0
    fetchData()
}

// Debounced global search
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

const debouncedGlobalSearch = debounce(() => {
    pagination.value.page = 0
    fetchData()
}, 500)

// ENHANCED API FUNCTION
const fetchData = async () => {
    isLoading.value = true
    try {
        const params = {
            page: pagination.value.page,
            size: pagination.value.size,
            sortBy: pagination.value.sortField || 'id',
            sortDir: pagination.value.sortOrder === 1 ? 'asc' : 'desc'
        }

        // Global search - tìm kiếm tất cả các trường
        if (globalSearch.value && globalSearch.value.trim()) {
            params.globalSearch = globalSearch.value.trim()
        }

        // Advanced filters
        if (advancedFilters.value.trangThai !== '') {
            params.trangThai = advancedFilters.value.trangThai
        }
        if (advancedFilters.value.startDate) {
            params.startDate = advancedFilters.value.startDate.toISOString().split('T')[0]
        }
        if (advancedFilters.value.endDate) {
            params.endDate = advancedFilters.value.endDate.toISOString().split('T')[0]
        }

        console.log('🔍 Fetching customers with params:', params)

        // Sử dụng endpoint tìm kiếm tối ưu
        const response = await axios.get('/api/khach-hang/search', { params })

        if (response.data) {
            if (response.data.content && Array.isArray(response.data.content)) {
                customers.value = response.data.content
                pagination.value.totalElements = response.data.totalElements || 0
                pagination.value.totalPages = response.data.totalPages || 0
                totalRecords.value = response.data.totalElements || 0
                console.log(`✅ Loaded ${response.data.content.length} customers (${response.data.totalElements} total)`)
            } else if (Array.isArray(response.data)) {
                customers.value = response.data
                pagination.value.totalElements = response.data.length
                totalRecords.value = response.data.length
            }
        }
    } catch (error) {
        console.error('❌ Error fetching customers:', error)
        handleApiError(error, 'Không thể tải danh sách khách hàng')
        customers.value = []
        
        // Fallback nếu cần
        try {
            console.log('🔄 Trying basic API as fallback...')
            const basicResponse = await axios.get('/api/khach-hang')
            if (basicResponse.data && Array.isArray(basicResponse.data)) {
                customers.value = basicResponse.data
                pagination.value.totalElements = basicResponse.data.length
                totalRecords.value = basicResponse.data.length
                console.log('✅ Fallback successful')
            }
        } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError)
        }
    } finally {
        isLoading.value = false
    }
}

// Giữ nguyên tất cả các function khác từ code cũ
// (saveCustomer, changeStatus, deleteCustomer, etc...)

const saveCustomer = async () => {
    submitted.value = true
    
    if (!customer.value.hoTen?.trim() || 
        !customer.value.email?.trim() || 
        !isValidEmail(customer.value.email) || 
        !customer.value.sdt?.trim() || 
        !isValidPhone(customer.value.sdt) || 
        customer.value.trangThai === undefined) {
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
        const customerData = {
            hoTen: customer.value.hoTen,
            email: customer.value.email,
            sdt: customer.value.sdt,
            trangThai: customer.value.trangThai
        }

        if (customer.value.maKhachHang) {
            customerData.maKhachHang = customer.value.maKhachHang
        }

        if (customer.value.id) {
            customerData.id = customer.value.id
            await axios.put(`/api/khach-hang/${customer.value.id}`, customerData)
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Cập nhật khách hàng thành công',
                life: 3000
            })
        } else {
            await axios.post('/api/khach-hang', customerData)
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Thêm khách hàng thành công',
                life: 3000
            })
        }

        await fetchData()
        hideDialog()
    } catch (error) {
        console.error('Error saving customer:', error)
        handleApiError(error, 'Không thể lưu thông tin khách hàng')
    } finally {
        saving.value = false
    }
}

// ... Tất cả các function khác giữ nguyên từ code cũ

const changeStatus = async (customerData) => {
    try {
        const newStatus = customerData.trangThai === 1 ? 0 : 1
        await axios.patch(`/api/khach-hang/${customerData.id}/status`, { 
            trangThai: newStatus 
        })

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã ${newStatus === 1 ? 'kích hoạt' : 'tạm khóa'} khách hàng`,
            life: 3000
        })

        await fetchData()
    } catch (error) {
        console.error('Error changing status:', error)
        handleApiError(error, 'Không thể thay đổi trạng thái')
    }
}

const deleteCustomer = async (customerId) => {
    try {
        await axios.delete(`/api/khach-hang/${customerId}`)
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa khách hàng thành công',
            life: 3000
        })
        await fetchData()
    } catch (error) {
        console.error('Error deleting customer:', error)
        handleApiError(error, 'Không thể xóa khách hàng')
    }
}

const deleteSelectedCustomers = async () => {
    try {
        const ids = selectedCustomers.value.map(customer => customer.id)
        await axios.delete('/api/khach-hang/batch', { data: ids })
        
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa các khách hàng đã chọn thành công',
            life: 3000
        })
        
        selectedCustomers.value = []
        await fetchData()
    } catch (error) {
        console.error('Error deleting customers:', error)
        handleApiError(error, 'Không thể xóa khách hàng')
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
    customer.value = {
        trangThai: 1
    }
    submitted.value = false
    customerDialog.value = true
}

const viewCustomer = (customerData) => {
    viewingCustomer.value = { ...customerData }
    viewDialog.value = true
}

const editCustomer = (customerData) => {
    customer.value = { ...customerData }
    submitted.value = false
    customerDialog.value = true
}

const editFromView = () => {
    customer.value = { ...viewingCustomer.value }
    viewDialog.value = false
    customerDialog.value = true
    submitted.value = false
}

const hideDialog = () => {
    customerDialog.value = false
    customer.value = {}
    submitted.value = false
}

const viewAllAddresses = (customerData) => {
    selectedCustomerAddresses.value = customerData
    addressListDialog.value = true
}

// Confirmation Functions
const confirmDeleteCustomer = (customerData) => {
    confirm.require({
        message: `Bạn có chắc chắn muốn xóa khách hàng "${customerData.hoTen}"?`,
        header: 'Xác nhận xóa',
        icon: 'pi pi-exclamation-triangle',
        rejectClass: 'p-button-secondary p-button-outlined',
        rejectLabel: 'Hủy',
        acceptLabel: 'Xóa',
        accept: () => deleteCustomer(customerData.id)
    })
}

const confirmDeleteSelected = () => {
    if (!hasSelectedCustomers.value) return

    confirm.require({
        message: `Bạn có chắc chắn muốn xóa ${selectedCustomers.value.length} khách hàng đã chọn?`,
        header: 'Xác nhận xóa',
        icon: 'pi pi-exclamation-triangle',
        rejectClass: 'p-button-secondary p-button-outlined',
        rejectLabel: 'Hủy',
        acceptLabel: 'Xóa',
        accept: () => deleteSelectedCustomers()
    })
}

// Export Functions - giữ nguyên

const exportToExcel = async () => {
    exporting.value = true
    try {
        const headers = [
            'ID', 'Mã Khách Hàng', 'Họ Tên', 'Email', 'SĐT', 
            'Địa Chỉ', 'Trạng Thái', 'Ngày Tạo'
        ]

        const data = customers.value.map(customer => [
            customer.id,
            customer.maKhachHang || '',
            customer.hoTen || '',
            customer.email || '',
            customer.sdt || '',
            getDefaultAddress(customer) || 'Chưa có địa chỉ',
            getStatusLabel(customer.trangThai),
            formatDate(customer.ngayTao)
        ])

        downloadExcel(headers, data, 'Danh_sach_khach_hang')
        
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã xuất ${customers.value.length} khách hàng`,
            life: 3000
        })
    } catch (error) {
        console.error('Error exporting:', error)
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể xuất file Excel',
            life: 3000
        })
    } finally {
        exporting.value = false
    }
}

const downloadExcel = (headers, data, filename) => {
    const csvContent = [headers, ...data]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

const handleApiError = (error, defaultMessage) => {
    let errorMessage = defaultMessage
    
    if (error.response) {
        const { status, data } = error.response
        switch (status) {
            case 400:
                if (data.errors && typeof data.errors === 'object') {
                    const errorList = Object.values(data.errors).join(', ')
                    errorMessage = `Dữ liệu không hợp lệ: ${errorList}`
                } else {
                    errorMessage = data.message || data.error || 'Dữ liệu không hợp lệ'
                }
                break
            case 404:
                errorMessage = 'Không tìm thấy dữ liệu'
                break
            case 500:
                errorMessage = 'Lỗi server nội bộ'
                break
            default:
                errorMessage = data.message || data.error || defaultMessage
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

.text-blue-600 {
    color: #2563eb;
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