<template>
    <div class="card">
        <!-- Toolbar -->
        <Toolbar class="mb-6">
            <template #start>
                <h4 class="m-0">Quản Lý Hóa Đơn</h4>
            </template>
            <template #end>
                <Button label="Xuất CSV" icon="pi pi-file-excel" @click="exportCSV" />
            </template>
        </Toolbar>

        <!-- DataTable -->
        <DataTable
            ref="dt"
            :value="hoaDons"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25, 50]"
            currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} hóa đơn"
            :loading="isLoading"
            filterDisplay="menu"
            :globalFilterFields="['maHoaDon', 'tenKhachHang', 'sdt', 'email']"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <div class="flex gap-2 items-center">
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText 
                                v-model="searchKeyword" 
                                placeholder="Tìm kiếm hóa đơn..." 
                                @input="onSearch"
                                class="w-80"
                            />
                        </IconField>
                        <Button 
                            label="Làm mới" 
                            icon="pi pi-refresh" 
                            severity="secondary" 
                            @click="refreshData" 
                        />
                    </div>
                    <div class="text-sm text-gray-600">
                        Tổng: {{ hoaDons.length }} hóa đơn
                    </div>
                </div>
            </template>
            
            <Column field="id" header="ID" sortable style="width: 8rem">
                <template #body="slotProps">
                    <span class="font-bold text-primary">#{{ slotProps.data.id }}</span>
                </template>
            </Column>
            
            <Column field="maHoaDon" header="Mã HĐ" sortable style="width: 12rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.maHoaDon" severity="info" />
                </template>
            </Column>
            
            <Column field="ngayTao" header="Ngày tạo" sortable style="width: 12rem">
                <template #body="slotProps">
                    <div class="flex items-center">
                        <i class="pi pi-calendar mr-2 text-gray-500"></i>
                        <span>{{ formatDate(slotProps.data.ngayTao) }}</span>
                    </div>
                </template>
            </Column>
            
            <Column field="tenKhachHang" header="Khách hàng" sortable style="min-width: 16rem">
                <template #body="slotProps">
                    <div class="flex items-center">
                        <span class="rounded-full w-8 h-8 flex items-center justify-center text-white font-bold mr-2 text-xs" :style="{ background: 'linear-gradient(45deg, #28a745, #20c997)' }">
                            {{ getInitials(slotProps.data.tenKhachHang || 'KH') }}
                        </span>
                        <div>
                            <div class="font-semibold">{{ slotProps.data.tenKhachHang || 'Khách lẻ' }}</div>
                            <div class="text-sm text-gray-500" v-if="slotProps.data.sdt">{{ slotProps.data.sdt }}</div>
                        </div>
                    </div>
                </template>
            </Column>
            
            <Column field="email" header="Email" sortable style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex items-center" v-if="slotProps.data.email">
                        <i class="pi pi-envelope mr-2 text-gray-500"></i>
                        <span class="text-sm">{{ slotProps.data.email }}</span>
                    </div>
                    <span v-else class="text-gray-400">--</span>
                </template>
            </Column>
            
            <Column field="tongTien" header="Tổng tiền" sortable style="width: 12rem">
                <template #body="slotProps">
                    <div class="flex items-center">
                        <i class="pi pi-money-bill mr-2 text-green-500"></i>
                        <span class="font-bold text-green-600">{{ formatCurrency(slotProps.data.tongTien) }}</span>
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

            <!-- Thêm cột Actions -->
            <Column header="Thao tác" style="width: 10rem">
                <template #body="slotProps">
                    <Button 
                        icon="pi pi-eye" 
                        outlined 
                        severity="info" 
                        @click="viewChiTiet(slotProps.data)" 
                        v-tooltip="'Xem chi tiết'"
                        size="small"
                    />
                </template>
            </Column>
            
            <template #empty>
                <div class="text-center p-8">
                    <i class="pi pi-file-o text-6xl text-gray-400 mb-4"></i>
                    <h5 class="text-gray-600 mb-2">Không tìm thấy hóa đơn</h5>
                    <p class="text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc làm mới dữ liệu.</p>
                </div>
            </template>
        </DataTable>

        <!-- Dialog xem chi tiết hóa đơn -->
        <Dialog 
            v-model:visible="showChiTietDialog" 
            :header="`Chi tiết hóa đơn ${selectedHoaDon?.maHoaDon || ''}`"
            :modal="true" 
            class="w-full max-w-6xl"
            :style="{ width: '90vw' }"
            :closable="true"
        >
            <div v-if="selectedHoaDon" class="space-y-4">
                <!-- Thông tin hóa đơn -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <h6 class="font-semibold text-gray-700 mb-2">Thông tin hóa đơn</h6>
                        <div class="space-y-1 text-sm">
                            <div><strong>Mã HĐ:</strong> {{ selectedHoaDon.maHoaDon }}</div>
                            <div><strong>Ngày tạo:</strong> {{ formatDate(selectedHoaDon.ngayTao) }}</div>
                            <div><strong>Tổng tiền:</strong> {{ formatCurrency(selectedHoaDon.tongTien) }}</div>
                        </div>
                    </div>
                    <div>
                        <h6 class="font-semibold text-gray-700 mb-2">Thông tin khách hàng</h6>
                        <div class="space-y-1 text-sm">
                            <div><strong>Tên:</strong> {{ selectedHoaDon.tenKhachHang || 'Khách lẻ' }}</div>
                            <div v-if="selectedHoaDon.sdt"><strong>SĐT:</strong> {{ selectedHoaDon.sdt }}</div>
                            <div v-if="selectedHoaDon.email"><strong>Email:</strong> {{ selectedHoaDon.email }}</div>
                        </div>
                    </div>
                </div>

                <!-- Bảng chi tiết sản phẩm -->
                <div>
                    <div class="flex justify-between items-center mb-3">
                        <h6 class="font-semibold text-gray-700">Danh sách sản phẩm</h6>
                        <div class="flex gap-2">
                            <IconField>
                                <InputIcon>
                                    <i class="pi pi-search" />
                                </InputIcon>
                                <InputText 
                                    v-model="searchChiTietKeyword" 
                                    placeholder="Tìm kiếm sản phẩm..." 
                                    @input="onSearchChiTiet"
                                    size="small"
                                />
                            </IconField>
                        </div>
                    </div>
                    
                    <DataTable 
                        :value="filteredChiTiets" 
                        :loading="isLoadingChiTiet"
                        scrollable 
                        scrollHeight="400px"
                        class="w-full"
                    >
                        <Column field="id" header="ID" style="width: 80px">
                            <template #body="slotProps">
                                <span class="font-mono text-sm">#{{ slotProps.data.id }}</span>
                            </template>
                        </Column>
                        
                        <Column field="gia" header="Giá" sortable style="width: 120px">
                            <template #body="slotProps">
                                <span class="font-semibold text-green-600">{{ formatCurrency(slotProps.data.gia) }}</span>
                            </template>
                        </Column>
                        
                        <Column field="soLuong" header="Số lượng" sortable style="width: 100px">
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.soLuong" severity="info" />
                            </template>
                        </Column>
                        
                        <Column field="thanhTien" header="Thành tiền" style="width: 140px">
                            <template #body="slotProps">
                                <span class="font-bold text-blue-600">{{ formatCurrency(slotProps.data.gia * slotProps.data.soLuong) }}</span>
                            </template>
                        </Column>
                        
                        <Column field="trangThai" header="Trạng thái" sortable style="width: 120px">
                            <template #body="slotProps">
                                <Tag 
                                    :value="slotProps.data.trangThai" 
                                    :severity="slotProps.data.trangThai === 'active' ? 'success' : 'warning'"
                                />
                            </template>
                        </Column>
                        
                        <Column field="ngayTao" header="Ngày tạo" sortable style="width: 140px">
                            <template #body="slotProps">
                                <span class="text-sm">{{ formatDate(slotProps.data.ngayTao) }}</span>
                            </template>
                        </Column>
                        
                        <Column field="ngayCapNhat" header="Ngày cập nhật" sortable style="width: 140px">
                            <template #body="slotProps">
                                <span class="text-sm">{{ formatDate(slotProps.data.ngayCapNhat) }}</span>
                            </template>
                        </Column>

                        <template #empty>
                            <div class="text-center p-4">
                                <i class="pi pi-info-circle text-3xl text-gray-400 mb-2"></i>
                                <p class="text-gray-500">Không có sản phẩm nào trong hóa đơn này</p>
                            </div>
                        </template>
                    </DataTable>
                </div>

                <!-- Tổng kết -->
                <div class="flex justify-end">
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <div class="text-right space-y-1">
                            <div class="text-sm text-gray-600">Tổng số lượng: <strong>{{ getTotalQuantity() }}</strong></div>
                            <div class="text-lg font-bold text-blue-600">
                                Tổng tiền: {{ formatCurrency(getTotalAmount()) }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Đóng" icon="pi pi-times" @click="closeChiTietDialog" severity="secondary" />
                <Button label="Xuất PDF" icon="pi pi-file-pdf" @click="exportChiTietPDF" />
            </template>
        </Dialog>

        <!-- Toast Notifications -->
        <Toast />
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import axios from 'axios';

const toast = useToast();
const dt = ref();
const hoaDons = ref([]);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const searchKeyword = ref('');
const isLoading = ref(false);

// Chi tiết hóa đơn
const showChiTietDialog = ref(false);
const selectedHoaDon = ref(null);
const hoaDonChiTiets = ref([]);
const isLoadingChiTiet = ref(false);
const searchChiTietKeyword = ref('');

// API Base URLs
const API_BASE_URL = 'http://localhost:8080/hoa-don';
const API_CHITIET_URL = 'http://localhost:8080/hoa-don-chi-tiet';

onMounted(() => {
    fetchAllHoaDons();
});

// Computed cho tìm kiếm chi tiết
const filteredChiTiets = computed(() => {
    if (!searchChiTietKeyword.value.trim()) {
        return hoaDonChiTiets.value;
    }
    
    const keyword = searchChiTietKeyword.value.toLowerCase();
    return hoaDonChiTiets.value.filter(item => 
        item.id.toString().includes(keyword) ||
        item.trangThai.toLowerCase().includes(keyword) ||
        item.gia.toString().includes(keyword) ||
        item.soLuong.toString().includes(keyword)
    );
});

// Fetch all hoa dons
async function fetchAllHoaDons() {
    isLoading.value = true;
    try {
        const response = await axios.get(API_BASE_URL);
        hoaDons.value = response.data;
        toast.add({ 
            severity: 'success', 
            summary: 'Thành công', 
            detail: `Đã tải ${response.data.length} hóa đơn`, 
            life: 3000 
        });
    } catch (error) {
        console.error('Error fetching hoa dons:', error);
        toast.add({ 
            severity: 'error', 
            summary: 'Lỗi', 
            detail: 'Có lỗi xảy ra khi tải danh sách hóa đơn', 
            life: 3000 
        });
    } finally {
        isLoading.value = false;
    }
}

// Fetch chi tiết hóa đơn
async function fetchChiTietHoaDon() {
    isLoadingChiTiet.value = true;
    try {
        const response = await axios.get(API_CHITIET_URL);
        hoaDonChiTiets.value = response.data;
    } catch (error) {
        console.error('Error fetching chi tiet hoa dons:', error);
        toast.add({ 
            severity: 'error', 
            summary: 'Lỗi', 
            detail: 'Có lỗi xảy ra khi tải chi tiết hóa đơn', 
            life: 3000 
        });
    } finally {
        isLoadingChiTiet.value = false;
    }
}

// Xem chi tiết hóa đơn
async function viewChiTiet(hoaDon) {
    selectedHoaDon.value = hoaDon;
    showChiTietDialog.value = true;
    searchChiTietKeyword.value = '';
    await fetchChiTietHoaDon();
}

// Đóng dialog chi tiết
function closeChiTietDialog() {
    showChiTietDialog.value = false;
    selectedHoaDon.value = null;
    hoaDonChiTiets.value = [];
    searchChiTietKeyword.value = '';
}

// Auto search on input (debounced)
let searchTimeout;
function onSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        if (searchKeyword.value.trim() === '') {
            await fetchAllHoaDons();
        } else {
            await searchHoaDon();
        }
    }, 500);
}

// Auto search chi tiết
let searchChiTietTimeout;
function onSearchChiTiet() {
    clearTimeout(searchChiTietTimeout);
    searchChiTietTimeout = setTimeout(() => {
        // filteredChiTiets computed sẽ tự động cập nhật
    }, 300);
}

// Search hoa dons
async function searchHoaDon() {
    if (!searchKeyword.value.trim()) {
        await fetchAllHoaDons();
        return;
    }

    try {
        const response = await axios.get(`${API_BASE_URL}/search`, {
            params: { keyword: searchKeyword.value.trim() }
        });
        hoaDons.value = response.data;
        toast.add({ 
            severity: 'info', 
            summary: 'Tìm kiếm', 
            detail: `Tìm thấy ${response.data.length} hóa đơn với từ khóa "${searchKeyword.value}"`, 
            life: 3000 
        });
    } catch (error) {
        console.error('Error searching hoa dons:', error);
        toast.add({ 
            severity: 'error', 
            summary: 'Lỗi', 
            detail: 'Có lỗi xảy ra khi tìm kiếm hóa đơn', 
            life: 3000 
        });
    }
}

// Refresh data
async function refreshData() {
    searchKeyword.value = '';
    await fetchAllHoaDons();
    toast.add({ 
        severity: 'info', 
        summary: 'Làm mới', 
        detail: 'Dữ liệu đã được làm mới', 
        life: 2000 
    });
}

// Tính tổng số lượng
function getTotalQuantity() {
    return filteredChiTiets.value.reduce((sum, item) => sum + item.soLuong, 0);
}

// Tính tổng tiền
function getTotalAmount() {
    return filteredChiTiets.value.reduce((sum, item) => sum + (item.gia * item.soLuong), 0);
}

// Export chi tiết to PDF
function exportChiTietPDF() {
    toast.add({
        severity: 'info',
        summary: 'Thông báo',
        detail: 'Chức năng xuất PDF đang được phát triển',
        life: 3000
    });
}

// Export to CSV
function exportCSV() {
    try {
        const headers = [
            'ID',
            'Mã hóa đơn',
            'Ngày tạo',
            'Tên khách hàng',
            'Số điện thoại',
            
            'Tổng tiền',
            'Trạng thái'
        ];

        const csvData = hoaDons.value.map(hd => [
            hd.id,
            hd.maHoaDon || '',
            formatDate(hd.ngayTao),
            hd.tenKhachHang || 'Khách lẻ',
            hd.sdt || '',
           
            hd.tongTien || 0,
            getStatusLabel(hd.trangThai)
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => 
                row.map(field => {
                    const stringField = String(field);
                    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                        return `"${stringField.replace(/"/g, '""')}"`;
                    }
                    return stringField;
                }).join(',')
            )
        ].join('\n');

        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const filename = `HoaDon_${dateStr}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.add({
            severity: 'success',
            summary: 'Xuất CSV thành công',
            detail: `Đã xuất ${hoaDons.value.length} hóa đơn ra file ${filename}`,
            life: 4000
        });
    } catch (error) {
        console.error('Error exporting CSV:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi xuất CSV',
            detail: 'Có lỗi xảy ra khi xuất file CSV',
            life: 3000
        });
    }
}

// Utility functions
function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCurrency(amount) {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function getInitials(name) {
    if (!name) return 'KH';
    return name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getStatusLabel(status) {
    const statusMap = {
        0: 'Chờ xử lý',
        1: 'Đã xác nhận',
        2: 'Đang giao',
        3: 'Hoàn thành',
        4: 'Đã hủy'
    };
    return statusMap[status] || 'Không xác định';
}

function getStatusSeverity(status) {
    const severityMap = {
        0: 'warning',
        1: 'info',
        2: 'secondary',
        3: 'success',
        4: 'danger'
    };
    return severityMap[status] || 'secondary';
}

function getStatusIcon(status) {
    const iconMap = {
        0: 'pi pi-clock',
        1: 'pi pi-check-circle',
        2: 'pi pi-truck',
        3: 'pi pi-verified',
        4: 'pi pi-times-circle'
    };
    return iconMap[status] || 'pi pi-question-circle';
}
</script>

<style scoped>
.card {
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    border-radius: 8px;
    background: white;
    padding: 1.5rem;
}

.w-80 {
    width: 20rem;
}

.rounded-full {
    border-radius: 50%;
}

.w-8 {
    width: 2rem;
}

.h-8 {
    height: 2rem;
}

.text-xs {
    font-size: 0.75rem;
}

.text-gray-400 {
    color: #9ca3af;
}

.text-gray-500 {
    color: #6b7280;
}

.text-gray-600 {
    color: #4b5563;
}

.text-gray-700 {
    color: #374151;
}

.bg-gray-50 {
    background-color: #f9fafb;
}

.bg-blue-50 {
    background-color: #eff6ff;
}

.space-y-1 > * + * {
    margin-top: 0.25rem;
}

.space-y-4 > * + * {
    margin-top: 1rem;
}

.grid {
    display: grid;
}

.grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
}

.grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.gap-4 {
    gap: 1rem;
}

@media (min-width: 768px) {
    .md\:grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

.max-w-6xl {
    max-width: 72rem;
}
</style>