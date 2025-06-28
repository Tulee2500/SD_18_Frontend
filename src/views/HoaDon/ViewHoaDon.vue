<template>
    <div class="card">
        <!-- Header -->
        <div class="header-section mb-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold mb-2">Quản Lý Hóa Đơn</h2>
                    <p class="text-blue-100">Hệ thống quản lý hóa đơn và sản phẩm</p>
                </div>
                <div class="flex gap-3">
                    <button 
                        @click="refreshAllData"
                        class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                        :disabled="isLoading"
                    >
                        <i :class="isLoading ? 'pi pi-spinner pi-spin' : 'pi pi-refresh'"></i>
                        {{ isLoading ? 'Đang tải...' : 'Làm mới' }}
                    </button>
                    <button 
                        @click="exportData"
                        class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <i class="pi pi-download"></i>
                        Xuất dữ liệu
                    </button>
                </div>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="stat-card bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-blue-600 text-sm font-medium">Tổng hóa đơn</p>
                        <p class="text-2xl font-bold text-blue-800">{{ hoaDons.length }}</p>
                    </div>
                    <i class="pi pi-file-text text-blue-500 text-2xl"></i>
                </div>
            </div>
            <div class="stat-card bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-green-600 text-sm font-medium">Tổng doanh thu</p>
                        <p class="text-2xl font-bold text-green-800">{{ formatCurrency(totalRevenue) }}</p>
                    </div>
                    <i class="pi pi-money-bill text-green-500 text-2xl"></i>
                </div>
            </div>
            <div class="stat-card bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-purple-600 text-sm font-medium">Hoàn thành</p>
                        <p class="text-2xl font-bold text-purple-800">{{ completedInvoices }}</p>
                    </div>
                    <i class="pi pi-check-circle text-purple-500 text-2xl"></i>
                </div>
            </div>
            <div class="stat-card bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-orange-600 text-sm font-medium">Chờ xử lý</p>
                        <p class="text-2xl font-bold text-orange-800">{{ pendingInvoices }}</p>
                    </div>
                    <i class="pi pi-clock text-orange-500 text-2xl"></i>
                </div>
            </div>
        </div>

        <!-- Search and Filter -->
        <div class="search-section mb-6 p-4 bg-gray-50 rounded-lg">
            <div class="flex flex-wrap gap-4 items-center">
                <div class="relative flex-1 min-w-64">
                    <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input 
                        v-model="searchKeyword" 
                        placeholder="Tìm kiếm hóa đơn, khách hàng..." 
                        @input="onSearch"
                        class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                    />
                </div>
                <select 
                    v-model="statusFilter" 
                    @change="applyFilters"
                    class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="PENDING">Chờ xử lý</option>
                    <option value="SHIPPED">Đang giao</option>
                    <option value="CANCELLED">Đã hủy</option>
                    <option value="CONFIRMED">Đã xác nhận</option>
                    <option value="PROCESSING">Đang xử lý</option>
                </select>
                <input 
                    type="date" 
                    v-model="dateFilter" 
                    @change="applyFilters"
                    class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p class="text-gray-600 text-lg">Đang tải dữ liệu từ API...</p>
            <p class="text-gray-500 text-sm mt-2">{{ loadingMessage }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="hasError" class="text-center py-12">
            <i class="pi pi-exclamation-triangle text-red-500 text-4xl mb-4"></i>
            <h3 class="text-red-600 text-xl font-semibold mb-2">Lỗi kết nối API</h3>
            <p class="text-gray-600 mb-4">{{ errorMessage }}</p>
            <button 
                @click="retryConnection"
                class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors"
            >
                <i class="pi pi-refresh"></i>
                Thử lại
            </button>
        </div>

        <!-- Data Table -->
        <div v-else class="overflow-x-auto bg-white rounded-lg shadow-lg">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('id')">
                            ID
                            <i :class="getSortIcon('id')" class="ml-1"></i>
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã HĐ</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('ngayTao')">
                            Ngày tạo
                            <i :class="getSortIcon('ngayTao')" class="ml-1"></i>
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('tongTien')">
                            Tổng tiền
                            <i :class="getSortIcon('tongTien')" class="ml-1"></i>
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="hoaDon in paginatedHoaDons" :key="hoaDon.id" class="hover:bg-gray-50 transition-colors">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="font-bold text-blue-600">#{{ hoaDon.id }}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{{ hoaDon.maHoaDon }}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <i class="pi pi-calendar mr-2 text-gray-500"></i>
                                <span class="text-sm">{{ formatDate(hoaDon.ngayTao) }}</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="rounded-full w-10 h-10 flex items-center justify-center text-white font-bold mr-3 text-sm bg-gradient-to-r from-green-400 to-green-600">
                                    {{ getInitials(hoaDon.tenKhachHang || 'KH') }}
                                </div>
                                <div>
                                    <div class="font-semibold text-gray-900">{{ hoaDon.tenKhachHang || 'Khách lẻ' }}</div>
                                    <div class="text-sm text-gray-500" v-if="hoaDon.sdt">
                                        <i class="pi pi-phone mr-1"></i>{{ hoaDon.sdt }}
                                    </div>
                                    <div class="text-sm text-gray-500" v-if="hoaDon.email">
                                        <i class="pi pi-envelope mr-1"></i>{{ hoaDon.email }}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <i class="pi pi-money-bill mr-2 text-green-500"></i>
                                <span class="font-bold text-green-600 text-lg">{{ formatCurrency(hoaDon.tongTien) }}</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span 
                                class="px-3 py-1 rounded-full text-xs font-medium"
                                :class="getStatusClass(hoaDon.trangThaiHoaDon)"
                            >
                                <i :class="getStatusIcon(hoaDon.trangThaiHoaDon)" class="mr-1"></i>
                                {{ getStatusLabel(hoaDon.trangThaiHoaDon) }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <button 
                                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                                @click="viewChiTiet(hoaDon)"
                                title="Xem chi tiết"
                            >
                                <i class="pi pi-eye"></i>
                                Chi tiết
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Pagination -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-700">
                        Hiển thị {{ (currentPage - 1) * itemsPerPage + 1 }} đến {{ Math.min(currentPage * itemsPerPage, filteredHoaDons.length) }} 
                        trong tổng số {{ filteredHoaDons.length }} hóa đơn
                    </div>
                    <div class="flex items-center gap-2">
                        <button 
                            @click="previousPage" 
                            :disabled="currentPage === 1"
                            class="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <i class="pi pi-chevron-left"></i>
                        </button>
                        <span class="px-3 py-1 text-sm">{{ currentPage }} / {{ totalPages }}</span>
                        <button 
                            @click="nextPage" 
                            :disabled="currentPage === totalPages"
                            class="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <i class="pi pi-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-if="filteredHoaDons.length === 0" class="text-center p-12">
                <i class="pi pi-file-o text-6xl text-gray-400 mb-4"></i>
                <h3 class="text-gray-600 text-xl font-semibold mb-2">Không tìm thấy hóa đơn</h3>
                <p class="text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
        </div>

        <!-- Dialog chi tiết hóa đơn -->
        <div v-if="showChiTietDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
                <!-- Dialog Header -->
                <div class="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    <div>
                        <h3 class="text-2xl font-bold">Chi tiết hóa đơn {{ selectedHoaDon?.maHoaDon }}</h3>
                        <p class="text-blue-100 mt-1">Thông tin chi tiết và danh sách sản phẩm</p>
                    </div>
                    <button 
                        @click="closeChiTietDialog"
                        class="text-white hover:text-gray-200 text-2xl p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
                    >
                        <i class="pi pi-times"></i>
                    </button>
                </div>

                <!-- Dialog Content -->
                <div class="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
                    <div v-if="selectedHoaDon" class="space-y-6">
                        <!-- Thông tin hóa đơn và khách hàng -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <!-- Thông tin hóa đơn -->
                            <div class="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                <h6 class="font-bold text-blue-800 mb-4 text-lg flex items-center">
                                    <i class="pi pi-file-text mr-2 text-blue-600"></i>
                                    Thông tin hóa đơn
                                </h6>
                                <div class="space-y-3">
                                    <div class="flex justify-between items-center">
                                        <span class="text-blue-600 font-medium">Mã HĐ:</span>
                                        <span class="font-bold text-blue-800">{{ selectedHoaDon.maHoaDon }}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-blue-600 font-medium">Ngày tạo:</span>
                                        <span class="font-medium">{{ formatDate(selectedHoaDon.ngayTao) }}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-blue-600 font-medium">Tổng tiền:</span>
                                        <span class="font-bold text-green-600 text-lg">{{ formatCurrency(selectedHoaDon.tongTien) }}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-blue-600 font-medium">Trạng thái:</span>
                                        <span 
                                            class="px-2 py-1 rounded-full text-xs font-medium"
                                            :class="getStatusClass(selectedHoaDon.trangThaiHoaDon)"
                                        >
                                            {{ getStatusLabel(selectedHoaDon.trangThaiHoaDon) }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Thông tin khách hàng -->
                            <div class="bg-green-50 p-6 rounded-xl border border-green-200">
                                <h6 class="font-bold text-green-800 mb-4 text-lg flex items-center">
                                    <i class="pi pi-user mr-2 text-green-600"></i>
                                    Thông tin khách hàng
                                </h6>
                                <div class="space-y-3">
                                    <div class="flex justify-between items-center">
                                        <span class="text-green-600 font-medium">Tên:</span>
                                        <span class="font-bold text-green-800">{{ selectedHoaDon.tenKhachHang || 'Khách lẻ' }}</span>
                                    </div>
                                    <div v-if="selectedHoaDon.sdt" class="flex justify-between items-center">
                                        <span class="text-green-600 font-medium">SĐT:</span>
                                        <span class="font-medium">{{ selectedHoaDon.sdt }}</span>
                                    </div>
                                    <div v-if="selectedHoaDon.email" class="flex justify-between items-center">
                                        <span class="text-green-600 font-medium">Email:</span>
                                        <span class="font-medium">{{ selectedHoaDon.email }}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-green-600 font-medium">Loại HĐ:</span>
                                        <span class="font-medium">{{ selectedHoaDon.loaiHoaDon || 'N/A' }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Chi tiết hóa đơn theo DTO -->
                        <div class="bg-gray-50 p-6 rounded-xl">
                            <div class="flex justify-between items-center mb-6">
                                <h6 class="font-bold text-gray-800 text-xl flex items-center">
                                    <i class="pi pi-list mr-2 text-gray-600"></i>
                                    Chi tiết hóa đơn ({{ hoaDonChiTiets.length }} sản phẩm)
                                </h6>
                                <div class="relative">
                                    <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    <input 
                                        v-model="searchChiTietKeyword" 
                                        placeholder="Tìm kiếm sản phẩm..." 
                                        class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            
                            <!-- Loading Chi Tiết -->
                            <div v-if="isLoadingChiTiet" class="text-center py-8">
                                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                                <p class="text-gray-600">Đang tải chi tiết hóa đơn...</p>
                            </div>

                            <!-- Chi Tiết Table theo DTO -->
                            <div v-else class="overflow-x-auto bg-white rounded-lg border shadow-sm">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá bán</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày cập nhật</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                                        <tr v-for="chiTiet in filteredChiTiets" :key="chiTiet.id" class="hover:bg-gray-50">
                                            <td class="px-4 py-3 whitespace-nowrap">
                                                <span class="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">#{{ chiTiet.id }}</span>
                                            </td>
                                            <td class="px-4 py-3">
                                                <div class="font-medium text-gray-900">{{ chiTiet.tenSanPham || 'N/A' }}</div>
                                            </td>
                                            <td class="px-4 py-3 whitespace-nowrap">
                                                <span class="font-bold text-green-600">{{ formatCurrency(chiTiet.giaBan) }}</span>
                                            </td>
                                            <td class="px-4 py-3 whitespace-nowrap">
                                                <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{{ chiTiet.soLuong }}</span>
                                            </td>
                                            <td class="px-4 py-3 whitespace-nowrap">
                                                <span class="font-bold text-blue-600">{{ formatCurrency(chiTiet.giaBan * chiTiet.soLuong) }}</span>
                                            </td>
                                            <td class="px-4 py-3 whitespace-nowrap">
                                                <span 
                                                    class="px-2 py-1 rounded-full text-xs font-medium"
                                                    :class="getChiTietStatusClass(chiTiet.trangThaiHoaDon)"
                                                >
                                                    {{ getChiTietStatusLabel(chiTiet.trangThaiHoaDon) }}
                                                </span>
                                            </td>
                                            <td class="px-4 py-3 whitespace-nowrap">
                                                <span class="text-sm text-gray-600">{{ formatDate(chiTiet.ngayTao) }}</span>
                                            </td>
                                            <td class="px-4 py-3 whitespace-nowrap">
                                                <span class="text-sm text-gray-600">{{ formatDate(chiTiet.ngayCapNhat) }}</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                <!-- Empty Chi Tiết -->
                                <div v-if="filteredChiTiets.length === 0" class="text-center p-8">
                                    <i class="pi pi-info-circle text-4xl text-gray-400 mb-4"></i>
                                    <h4 class="text-gray-600 font-semibold mb-2">Không có chi tiết nào</h4>
                                    <p class="text-gray-500">Hóa đơn này chưa có chi tiết sản phẩm.</p>
                                </div>
                            </div>
                        </div>

                        <!-- Tổng kết -->
                        <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-blue-600 mb-1">{{ hoaDonChiTiets.length }}</div>
                                    <div class="text-blue-800 font-medium">Số mặt hàng</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-purple-600 mb-1">{{ getTotalQuantity() }}</div>
                                    <div class="text-purple-800 font-medium">Tổng số lượng</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-green-600 mb-1">{{ formatCurrency(getTotalAmount()) }}</div>
                                    <div class="text-green-800 font-medium">Tổng tiền</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Dialog Footer -->
                <div class="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button 
                        @click="closeChiTietDialog"
                        class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <i class="pi pi-times"></i>
                        Đóng
                    </button>
                </div>
            </div>
        </div>

        <!-- Toast Notifications -->
        <div v-if="toastMessage" class="fixed top-4 right-4 z-50 animate-slide-in">
            <div 
                class="px-6 py-4 rounded-lg shadow-lg text-white max-w-sm border-l-4"
                :class="getToastClass()"
            >
                <div class="flex items-start gap-3">
                    <i :class="getToastIcon()" class="text-xl mt-0.5"></i>
                    <div class="flex-1">
                        <div class="font-semibold mb-1">{{ toastSummary }}</div>
                        <div class="text-sm opacity-90">{{ toastMessage }}</div>
                    </div>
                    <button @click="closeToast" class="text-white hover:text-gray-200 ml-2">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'

// Reactive data
const hoaDons = ref([])
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const loadingMessage = ref('')
const searchKeyword = ref('')
const statusFilter = ref('')
const dateFilter = ref('')

// Sorting
const sortField = ref('')
const sortOrder = ref('asc')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Chi tiết hóa đơn
const showChiTietDialog = ref(false)
const selectedHoaDon = ref(null)
const hoaDonChiTiets = ref([])
const isLoadingChiTiet = ref(false)
const searchChiTietKeyword = ref('')

// Toast
const toastMessage = ref('')
const toastSummary = ref('')
const toastSeverity = ref('info')

// API URLs - Khớp với Controller của bạn
const API_BASE_URL = 'http://localhost:8080'
const API_ENDPOINTS = {
    hoaDon: `${API_BASE_URL}/hoa-don`,                    // GET /hoa-don
    hoaDonSearch: `${API_BASE_URL}/hoa-don/search`,       // GET /hoa-don/search?keyword=
    hoaDonChiTiet: `${API_BASE_URL}/hoa-don-chi-tiet`,    // GET /hoa-don-chi-tiet/by-hoa-don/{id}
}

onMounted(() => {
    fetchAllData()
})

// Computed properties
const filteredHoaDons = computed(() => {
    let filtered = [...hoaDons.value]
    
    // Search filter
    if (searchKeyword.value.trim()) {
        const keyword = searchKeyword.value.toLowerCase()
        filtered = filtered.filter(hd => 
            hd.maHoaDon?.toLowerCase().includes(keyword) ||
            hd.tenKhachHang?.toLowerCase().includes(keyword) ||
            hd.sdt?.includes(keyword) ||
            hd.email?.toLowerCase().includes(keyword)
        )
    }
    
    // Status filter
    if (statusFilter.value) {
        filtered = filtered.filter(hd => hd.trangThaiHoaDon === statusFilter.value)
    }
    
    // Date filter
    if (dateFilter.value) {
        const filterDate = new Date(dateFilter.value).toDateString()
        filtered = filtered.filter(hd => {
            const hoaDonDate = new Date(hd.ngayTao).toDateString()
            return hoaDonDate === filterDate
        })
    }
    
    // Sorting
    if (sortField.value) {
        filtered.sort((a, b) => {
            let aVal = a[sortField.value]
            let bVal = b[sortField.value]
            
            if (sortField.value === 'ngayTao') {
                aVal = new Date(aVal)
                bVal = new Date(bVal)
            }
            
            if (sortOrder.value === 'asc') {
                return aVal > bVal ? 1 : -1
            } else {
                return aVal < bVal ? 1 : -1
            }
        })
    }
    
    return filtered
})

const paginatedHoaDons = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredHoaDons.value.slice(start, end)
})

const totalPages = computed(() => {
    return Math.ceil(filteredHoaDons.value.length / itemsPerPage.value)
})

const filteredChiTiets = computed(() => {
    if (!searchChiTietKeyword.value.trim()) {
        return hoaDonChiTiets.value
    }
    
    const keyword = searchChiTietKeyword.value.toLowerCase()
    return hoaDonChiTiets.value.filter(item => 
        item.id.toString().includes(keyword) ||
        item.tenSanPham?.toLowerCase().includes(keyword) ||
        item.trangThaiHoaDon?.toLowerCase().includes(keyword) ||
        item.giaBan.toString().includes(keyword) ||
        item.soLuong.toString().includes(keyword)
    )
})

// Statistics
const totalRevenue = computed(() => {
    return hoaDons.value
        .filter(hd => hd.trangThaiHoaDon === 'COMPLETED')
        .reduce((sum, hd) => sum + (hd.tongTien || 0), 0)
})

const completedInvoices = computed(() => {
    return hoaDons.value.filter(hd => 
        hd.trangThaiHoaDon === 'COMPLETED' || 
        hd.trangThaiHoaDon?.toLowerCase().includes('hoàn thành')
    ).length
})

const pendingInvoices = computed(() => {
    return hoaDons.value.filter(hd => 
        hd.trangThaiHoaDon === 'PENDING' || 
        hd.trangThaiHoaDon?.toLowerCase().includes('chờ')
    ).length
})

// Watch for filter changes
watch([statusFilter, dateFilter], () => {
    currentPage.value = 1
})

// API Functions
async function fetchWithErrorHandling(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        })
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        return await response.json()
    } catch (error) {
        console.error(`API Error for ${url}:`, error)
        throw error
    }
}

async function fetchAllData() {
    isLoading.value = true
    hasError.value = false
    loadingMessage.value = 'Đang kết nối đến server...'
    
    try {
        loadingMessage.value = 'Đang tải danh sách hóa đơn...'
        
        // Gọi API theo endpoint chính xác
        console.log(`Gọi API: ${API_ENDPOINTS.hoaDon}`)
        const data = await fetchWithErrorHandling(API_ENDPOINTS.hoaDon)
        
        hoaDons.value = data
        console.log('Dữ liệu hóa đơn nhận được:', data)
        
        showToast('success', 'Thành công', `Đã tải ${data.length} hóa đơn từ API`)
        
    } catch (error) {
        console.error('Lỗi khi gọi API:', error)
        hasError.value = true
        errorMessage.value = `Không thể kết nối đến API: ${error.message}`
        showToast('error', 'Lỗi kết nối', 'Không thể tải dữ liệu từ server')
        
        // Fallback to sample data để test UI
        hoaDons.value = createSampleData()
        showToast('info', 'Dữ liệu mẫu', 'Hiển thị dữ liệu mẫu để demo')
    } finally {
        isLoading.value = false
        loadingMessage.value = ''
    }
}

// Tạo dữ liệu mẫu để test
function createSampleData() {
    return [
        {
            id: 1,
            maHoaDon: 'HD001',
            tenKhachHang: 'Nguyễn Văn A',
            sdt: '0912345671',
            email: 'user1@example.com',
            tongTien: 2400000,
            trangThaiHoaDon: 'COMPLETED',
            ngayTao: '2025-06-27T11:10:00.000Z',
            loaiHoaDon: 'ONLINE'
        },
        {
            id: 2,
            maHoaDon: 'HD002',
            tenKhachHang: 'Trần Văn B',
            sdt: '0912345672',
            email: 'user2@example.com',
            tongTien: 900000,
            trangThaiHoaDon: 'PENDING',
            ngayTao: '2025-06-27T11:10:00.000Z',
            loaiHoaDon: 'ONLINE'
        },
        {
            id: 3,
            maHoaDon: 'HD003',
            tenKhachHang: 'Lê Văn C',
            sdt: '0912345673',
            email: 'user3@example.com',
            tongTien: 2100000,
            trangThaiHoaDon: 'SHIPPED',
            ngayTao: '2025-06-27T11:10:00.000Z',
            loaiHoaDon: 'ONLINE'
        },
        {
            id: 4,
            maHoaDon: 'HD004',
            tenKhachHang: 'Phạm Văn D',
            sdt: '0912345674',
            email: 'user4@example.com',
            tongTien: 1200000,
            trangThaiHoaDon: 'COMPLETED',
            ngayTao: '2025-06-27T11:10:00.000Z',
            loaiHoaDon: 'OFFLINE'
        },
        {
            id: 5,
            maHoaDon: 'HD005',
            tenKhachHang: 'Ngô Văn E',
            sdt: '0912345675',
            email: 'user5@example.com',
            tongTien: 800000,
            trangThaiHoaDon: 'PENDING',
            ngayTao: '2025-06-27T11:10:00.000Z',
            loaiHoaDon: 'ONLINE'
        }
    ]
}

// Fetch chi tiết hóa đơn theo Controller của bạn
async function fetchChiTietHoaDon(hoaDonId) {
    isLoadingChiTiet.value = true
    try {
        // API endpoint chính xác: /hoa-don-chi-tiet/by-hoa-don/{hoaDonId}
        const endpoint = `${API_ENDPOINTS.hoaDonChiTiet}/by-hoa-don/${hoaDonId}`
        console.log(`Gọi API chi tiết: ${endpoint}`)
        
        const data = await fetchWithErrorHandling(endpoint)
        hoaDonChiTiets.value = data
        console.log('Chi tiết hóa đơn nhận được:', data)
        
        if (data.length === 0) {
            showToast('info', 'Thông báo', 'Hóa đơn này không có chi tiết sản phẩm')
        }
        
    } catch (error) {
        console.error('Error fetching chi tiet:', error)
        // Tạo dữ liệu mẫu nếu API lỗi
        hoaDonChiTiets.value = createSampleChiTietData(hoaDonId)
        showToast('warning', 'Dữ liệu mẫu', 'Không thể tải chi tiết, hiển thị dữ liệu mẫu')
    } finally {
        isLoadingChiTiet.value = false
    }
}

// Thêm function search hóa đơn (tùy chọn)
async function searchHoaDon(keyword) {
    if (!keyword.trim()) {
        await fetchAllData()
        return
    }
    
    isLoading.value = true
    try {
        const endpoint = `${API_ENDPOINTS.hoaDonSearch}?keyword=${encodeURIComponent(keyword)}`
        console.log(`Tìm kiếm: ${endpoint}`)
        
        const data = await fetchWithErrorHandling(endpoint)
        hoaDons.value = data
        
        showToast('success', 'Tìm kiếm', `Tìm thấy ${data.length} kết quả`)
    } catch (error) {
        console.error('Error searching:', error)
        showToast('error', 'Lỗi tìm kiếm', 'Không thể tìm kiếm')
    } finally {
        isLoading.value = false
    }
}


// Event handlers
async function refreshAllData() {
    await fetchAllData()
}

async function retryConnection() {
    hasError.value = false
    await fetchAllData()
}

async function viewChiTiet(hoaDon) {
    selectedHoaDon.value = hoaDon
    showChiTietDialog.value = true
    searchChiTietKeyword.value = ''
    
    // Fetch chi tiết hóa đơn
    await fetchChiTietHoaDon(hoaDon.id)
}

function closeChiTietDialog() {
    showChiTietDialog.value = false
    selectedHoaDon.value = null
    hoaDonChiTiets.value = []
    searchChiTietKeyword.value = ''
}

// Search and filter functions
let searchTimeout
function onSearch() {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        currentPage.value = 1
        // Có thể sử dụng API search hoặc filter local
        const keyword = searchKeyword.value.trim()
        if (keyword) {
            // Tùy chọn: Gọi API search
            // searchHoaDon(keyword)
            
            // Hoặc filter local (như hiện tại)
            // Không cần làm gì thêm vì computed filteredHoaDons đã handle
        }
    }, 300)
}

function applyFilters() {
    currentPage.value = 1
}

// Sorting functions
function sortBy(field) {
    if (sortField.value === field) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortField.value = field
        sortOrder.value = 'asc'
    }
}

function getSortIcon(field) {
    if (sortField.value !== field) return 'pi pi-sort'
    return sortOrder.value === 'asc' ? 'pi pi-sort-up' : 'pi pi-sort-down'
}

// Pagination functions
function previousPage() {
    if (currentPage.value > 1) {
        currentPage.value--
    }
}

function nextPage() {
    if (currentPage.value < totalPages.value) {
        currentPage.value++
    }
}

// Calculation functions theo HoaDonChiTietDTO
function getTotalQuantity() {
    return filteredChiTiets.value.reduce((sum, item) => sum + item.soLuong, 0)
}

function getTotalAmount() {
    return filteredChiTiets.value.reduce((sum, item) => sum + (item.giaBan * item.soLuong), 0)
}

// Export functions
function exportData() {
    try {
        const headers = [
            'ID', 'Mã hóa đơn', 'Ngày tạo', 'Tên khách hàng', 
            'Số điện thoại', 'Email', 'Tổng tiền', 'Trạng thái'
        ]

        const csvData = hoaDons.value.map(hd => [
            hd.id,
            hd.maHoaDon || '',
            formatDate(hd.ngayTao),
            hd.tenKhachHang || 'Khách lẻ',
            hd.sdt || '',
            hd.email || '',
            hd.tongTien || 0,
            getStatusLabel(hd.trangThaiHoaDon)
        ])

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => 
                row.map(field => {
                    const stringField = String(field)
                    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                        return `"${stringField.replace(/"/g, '""')}"`
                    }
                    return stringField
                }).join(',')
            )
        ].join('\n')

        const BOM = '\uFEFF'
        const csvWithBOM = BOM + csvContent
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        
        const now = new Date()
        const dateStr = now.toISOString().split('T')[0]
        const filename = `HoaDon_${dateStr}.csv`
        
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        showToast('success', 'Xuất dữ liệu thành công', `Đã xuất ${hoaDons.value.length} hóa đơn ra file ${filename}`)
    } catch (error) {
        console.error('Error exporting data:', error)
        showToast('error', 'Lỗi xuất dữ liệu', 'Có lỗi xảy ra khi xuất file')
    }
}

// Toast functions
function showToast(severity, summary, detail) {
    toastSeverity.value = severity
    toastSummary.value = summary
    toastMessage.value = detail
    
    setTimeout(() => {
        toastMessage.value = ''
    }, 5000)
}

function closeToast() {
    toastMessage.value = ''
}

function getToastClass() {
    const baseClass = 'border-l-4 '
    switch (toastSeverity.value) {
        case 'success':
            return baseClass + 'bg-green-500 border-green-600'
        case 'error':
            return baseClass + 'bg-red-500 border-red-600'
        case 'warning':
            return baseClass + 'bg-yellow-500 border-yellow-600'
        default:
            return baseClass + 'bg-blue-500 border-blue-600'
    }
}

function getToastIcon() {
    switch (toastSeverity.value) {
        case 'success':
            return 'pi pi-check-circle'
        case 'error':
            return 'pi pi-times-circle'
        case 'warning':
            return 'pi pi-exclamation-triangle'
        default:
            return 'pi pi-info-circle'
    }
}

// Utility functions
function formatDate(date) {
    if (!date) return ''
    return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function formatCurrency(amount) {
    if (!amount) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount)
}

function getInitials(name) {
    if (!name) return 'KH'
    return name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

function getStatusLabel(status) {
    if (!status) return 'Không xác định'
    
    // Mapping trạng thái từ tiếng Anh sang tiếng Việt
    const statusMap = {
        'COMPLETED': 'Hoàn thành',
        'PENDING': 'Chờ xử lý', 
        'SHIPPED': 'Đang giao',
        'CANCELLED': 'Đã hủy',
        'CONFIRMED': 'Đã xác nhận',
        'PROCESSING': 'Đang xử lý',
        'DELIVERED': 'Đã giao',
        'RETURNED': 'Đã trả hàng',
        'REFUNDED': 'Đã hoàn tiền'
    }
    
    // Tìm exact match trước
    if (statusMap[status.toUpperCase()]) {
        return statusMap[status.toUpperCase()]
    }
    
    // Nếu không có exact match, kiểm tra contains
    const statusLower = status.toLowerCase()
    if (statusLower.includes('completed') || statusLower.includes('hoàn thành')) {
        return 'Hoàn thành'
    } else if (statusLower.includes('pending') || statusLower.includes('chờ')) {
        return 'Chờ xử lý'
    } else if (statusLower.includes('shipped') || statusLower.includes('shipping') || statusLower.includes('giao')) {
        return 'Đang giao'
    } else if (statusLower.includes('cancelled') || statusLower.includes('hủy')) {
        return 'Đã hủy'
    } else if (statusLower.includes('confirmed') || statusLower.includes('xác nhận')) {
        return 'Đã xác nhận'
    } else {
        return status // Trả về nguyên gốc nếu không match
    }
}

function getStatusClass(status) {
    if (!status) return 'bg-gray-100 text-gray-800'
    
    const statusLower = status.toString().toLowerCase()
    
    if (statusLower.includes('chờ') || statusLower.includes('pending')) {
        return 'bg-yellow-100 text-yellow-800'
    } else if (statusLower.includes('xác nhận') || statusLower.includes('confirmed')) {
        return 'bg-blue-100 text-blue-800'
    } else if (statusLower.includes('giao') || statusLower.includes('shipping') || statusLower.includes('shipped')) {
        return 'bg-purple-100 text-purple-800'
    } else if (statusLower.includes('hoàn thành') || statusLower.includes('completed')) {
        return 'bg-green-100 text-green-800'
    } else if (statusLower.includes('hủy') || statusLower.includes('cancelled')) {
        return 'bg-red-100 text-red-800'
    } else {
        return 'bg-gray-100 text-gray-800'
    }
}

function getChiTietStatusClass(status) {
    if (!status) return 'bg-gray-100 text-gray-800'
    
    const statusLower = status.toString().toLowerCase()
    
    if (statusLower.includes('completed') || statusLower.includes('hoàn thành')) {
        return 'bg-green-100 text-green-800'
    } else if (statusLower.includes('pending') || statusLower.includes('chờ')) {
        return 'bg-yellow-100 text-yellow-800'
    } else if (statusLower.includes('shipped') || statusLower.includes('giao')) {
        return 'bg-blue-100 text-blue-800'
    } else if (statusLower.includes('cancelled') || statusLower.includes('hủy')) {
        return 'bg-red-100 text-red-800'
    } else {
        return 'bg-gray-100 text-gray-800'
    }
}

// Thêm function để hiển thị trạng thái chi tiết bằng tiếng Việt
function getChiTietStatusLabel(status) {
    if (!status) return 'Không xác định'
    
    const statusMap = {
        'COMPLETED': 'Hoàn thành',
        'PENDING': 'Chờ xử lý',
        'SHIPPED': 'Đang giao', 
        'CANCELLED': 'Đã hủy',
        'CONFIRMED': 'Đã xác nhận',
        'PROCESSING': 'Đang xử lý',
        'DELIVERED': 'Đã giao',
        'RETURNED': 'Đã trả hàng'
    }
    
    return statusMap[status.toUpperCase()] || status
}

function getStatusIcon(status) {
    if (!status) return 'pi pi-question-circle'
    
    const statusLower = status.toString().toLowerCase()
    
    if (statusLower.includes('chờ') || statusLower.includes('pending')) {
        return 'pi pi-clock'
    } else if (statusLower.includes('xác nhận') || statusLower.includes('confirmed')) {
        return 'pi pi-check-circle'
    } else if (statusLower.includes('giao') || statusLower.includes('shipping') || statusLower.includes('shipped')) {
        return 'pi pi-truck'
    } else if (statusLower.includes('hoàn thành') || statusLower.includes('completed')) {
        return 'pi pi-verified'
    } else if (statusLower.includes('hủy') || statusLower.includes('cancelled')) {
        return 'pi pi-times-circle'
}
}
</script>

<style scoped>
.card {
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    border-radius: 12px;
    background: white;
    padding: 2rem;
    min-height: 100vh;
}

.stat-card {
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.grid {
    display: grid;
}

.grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
}

.grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.gap-4 {
    gap: 1rem;
}

.gap-6 {
    gap: 1.5rem;
}

@media (min-width: 768px) {
    .md\:grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    
    .md\:grid-cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    
    .md\:grid-cols-4 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

@media (min-width: 1024px) {
    .lg\:grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    
    .lg\:grid-cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

.space-y-2 > * + * {
    margin-top: 0.5rem;
}

.space-y-3 > * + * {
    margin-top: 0.75rem;
}

.space-y-6 > * + * {
    margin-top: 1.5rem;
}

.transition-colors {
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
}

.transition-all {
    transition: all 0.2s ease-in-out;
}

@keyframes slide-in {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.animate-slide-in {
    animation: slide-in 0.3s ease-out;
}

.min-w-64 {
    min-width: 16rem;
}

/* Custom scrollbar */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* Loading animation */
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.animate-spin {
    animation: spin 1s linear infinite;
}

/* Hover effects */
.hover\:bg-gray-50:hover {
    background-color: rgb(249 250 251);
}

.hover\:bg-gray-100:hover {
    background-color: rgb(243 244 246);
}

.hover\:bg-blue-600:hover {
    background-color: rgb(37 99 235);
}

.hover\:bg-green-600:hover {
    background-color: rgb(22 163 74);
}

.hover\:bg-red-600:hover {
    background-color: rgb(220 38 38);
}

.hover\:bg-gray-600:hover {
    background-color: rgb(75 85 99);
}

/* Focus states */
.focus\:ring-2:focus {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.focus\:ring-blue-500:focus {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.focus\:border-blue-500:focus {
    border-color: rgb(59 130 246);
}

/* Disabled states */
.disabled\:opacity-50:disabled {
    opacity: 0.5;
}

.disabled\:cursor-not-allowed:disabled {
    cursor: not-allowed;
}

/* Custom utility classes */
.text-xs {
    font-size: 0.75rem;
    line-height: 1rem;
}

.text-sm {
    font-size: 0.875rem;
    line-height: 1.25rem;
}

.text-lg {
    font-size: 1.125rem;
    line-height: 1.75rem;
}

.text-xl {
    font-size: 1.25rem;
    line-height: 1.75rem;
}

.text-2xl {
    font-size: 1.5rem;
    line-height: 2rem;
}

.font-medium {
    font-weight: 500;
}

.font-semibold {
    font-weight: 600;
}

.font-bold {
    font-weight: 700;
}

.rounded-lg {
    border-radius: 0.5rem;
}

.rounded-xl {
    border-radius: 0.75rem;
}

.rounded-full {
    border-radius: 9999px;
}

.shadow-sm {
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.shadow-lg {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.shadow-2xl {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
</style>