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
                        <p class="text-purple-600 text-sm font-medium">Sản phẩm</p>
                        <p class="text-2xl font-bold text-purple-800">{{ totalProducts }}</p>
                    </div>
                    <i class="pi pi-shopping-cart text-purple-500 text-2xl"></i>
                </div>
            </div>
            <div class="stat-card bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-orange-600 text-sm font-medium">Hoàn thành</p>
                        <p class="text-2xl font-bold text-orange-800">{{ completedInvoices }}</p>
                    </div>
                    <i class="pi pi-check-circle text-orange-500 text-2xl"></i>
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
                    <option value="Hoàn thành">Hoàn thành</option>
                    <option value="Đang giao">Đang giao</option>
                    <option value="Chờ xác nhận">Chờ xác nhận</option>
                    <option value="Đã hủy">Đã hủy</option>
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
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
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
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                                </div>
                            </div>

                            <!-- Thống kê chi tiết -->
                            <div class="bg-purple-50 p-6 rounded-xl border border-purple-200">
                                <h6 class="font-bold text-purple-800 mb-4 text-lg flex items-center">
                                    <i class="pi pi-chart-bar mr-2 text-purple-600"></i>
                                    Thống kê
                                </h6>
                                <div class="space-y-3">
                                    <div class="flex justify-between items-center">
                                        <span class="text-purple-600 font-medium">Số sản phẩm:</span>
                                        <span class="font-bold text-purple-800">{{ hoaDonChiTiets.length }}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-purple-600 font-medium">Tổng SL:</span>
                                        <span class="font-bold text-purple-800">{{ getTotalQuantity() }}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-purple-600 font-medium">Trạng thái:</span>
                                        <span 
                                            class="px-2 py-1 rounded-full text-xs font-medium"
                                            :class="getStatusClass(selectedHoaDon.trangThaiHoaDon)"
                                        >
                                            {{ getStatusLabel(selectedHoaDon.trangThaiHoaDon) }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Chi tiết hóa đơn -->
                        <div class="bg-gray-50 p-6 rounded-xl">
                            <div class="flex justify-between items-center mb-6">
                                <h6 class="font-bold text-gray-800 text-xl flex items-center">
                                    <i class="pi pi-list mr-2 text-gray-600"></i>
                                    Chi tiết hóa đơn ({{ hoaDonChiTiets.length }} mục)
                                </h6>
                                <div class="relative">
                                    <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    <input 
                                        v-model="searchChiTietKeyword" 
                                        placeholder="Tìm kiếm chi tiết..." 
                                        class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            
                            <!-- Loading Chi Tiết -->
                            <div v-if="isLoadingChiTiet" class="text-center py-8">
                                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                                <p class="text-gray-600">Đang tải chi tiết hóa đơn...</p>
                            </div>

                            <!-- Chi Tiết Table -->
                            <div v-else class="overflow-x-auto bg-white rounded-lg border shadow-sm">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cập nhật</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                                        <tr v-for="chiTiet in filteredChiTiets" :key="chiTiet.id" class="hover:bg-gray-50">
                                            <td class="px-4 py-3 whitespace-nowrap">
                                                <span class="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">#{{ chiTiet.id }}</span>
                                            </td>
                                            <td class="px-4 py-3 whitespace-nowrap">
                                                <span class="font-bold text-green-600 text-lg">{{ formatCurrency(chiTiet.gia) }}</span>
                                            </td>
                                            <td class="px-4 py-3 whitespace-nowrap">
                                                <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{{ chiTiet.soLuong }}</span>
                                            </td>
                                            <td class="px-4 py-3 whitespace-nowrap">
                                                <span class="font-bold text-blue-600 text-lg">{{ formatCurrency(chiTiet.gia * chiTiet.soLuong) }}</span>
                                            </td>
                                            <td class="px-4 py-3 whitespace-nowrap">
                                                <span 
                                                    class="px-2 py-1 rounded-full text-xs font-medium"
                                                    :class="getChiTietStatusClass(chiTiet.trangThaiHoaDon)"
                                                >
                                                    {{ chiTiet.trangThaiHoaDon }}
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

                        <!-- Danh sách sản phẩm -->
                        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div class="flex justify-between items-center mb-6">
                                <h6 class="font-bold text-gray-800 text-xl flex items-center">
                                    <i class="pi pi-shopping-cart mr-2 text-orange-500"></i>
                                    Danh sách sản phẩm ({{ sanPhams.length }} sản phẩm)
                                </h6>
                                <div class="relative">
                                    <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    <input 
                                        v-model="searchSanPhamKeyword" 
                                        placeholder="Tìm kiếm sản phẩm..." 
                                        class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            
                            <!-- Loading Sản Phẩm -->
                            <div v-if="isLoadingSanPham" class="text-center py-8">
                                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
                                <p class="text-gray-600">Đang tải danh sách sản phẩm...</p>
                            </div>

                            <!-- Sản Phẩm Grid -->
                            <div v-else-if="filteredSanPhams.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div v-for="sanPham in filteredSanPhams" :key="sanPham.id" class="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                                    <div class="flex items-start justify-between mb-4">
                                        <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                            {{ getProductInitials(sanPham.tenSanPham) }}
                                        </div>
                                        <span 
                                            class="px-2 py-1 rounded-full text-xs font-medium"
                                            :class="sanPham.trangThai === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                                        >
                                            <i :class="sanPham.trangThai === 1 ? 'pi pi-check-circle' : 'pi pi-times-circle'" class="mr-1"></i>
                                            {{ sanPham.trangThai === 1 ? 'Hoạt động' : 'Ngừng bán' }}
                                        </span>
                                    </div>
                                    
                                    <h4 class="font-bold text-gray-900 text-lg mb-2">{{ sanPham.tenSanPham }}</h4>
                                    <p class="text-gray-600 text-sm mb-3">{{ sanPham.maSanPham }}</p>
                                    
                                    <div class="space-y-2 mb-4">
                                        <div class="flex justify-between items-center">
                                            <span class="text-gray-500 text-sm">Số lượng:</span>
                                            <span class="font-semibold text-blue-600">{{ sanPham.soLuong }}</span>
                                        </div>
                                        <div class="flex justify-between items-center">
                                            <span class="text-gray-500 text-sm">Thương hiệu:</span>
                                            <span class="font-medium text-gray-800">{{ sanPham.thuongHieu?.tenThuongHieu || 'N/A' }}</span>
                                        </div>
                                        <div class="flex justify-between items-center">
                                            <span class="text-gray-500 text-sm">Danh mục:</span>
                                            <span class="font-medium text-gray-800">{{ sanPham.danhMuc?.tenDanhMuc || 'N/A' }}</span>
                                        </div>
                                        <div class="flex justify-between items-center">
                                            <span class="text-gray-500 text-sm">Chất liệu:</span>
                                            <span class="font-medium text-gray-800">{{ sanPham.chatLieu?.tenChatLieu || 'N/A' }}</span>
                                        </div>
                                        <div class="flex justify-between items-center">
                                            <span class="text-gray-500 text-sm">Đế giày:</span>
                                            <span class="font-medium text-gray-800">{{ sanPham.deGiay?.tenDeGiay || 'N/A' }}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="border-t border-gray-200 pt-3">
                                        <div class="text-xs text-gray-500 mb-1">Ngày tạo: {{ formatDate(sanPham.ngayTao) }}</div>
                                        <div class="text-xs text-gray-500">Cập nhật: {{ formatDate(sanPham.ngayCapNhat) }}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Empty Sản Phẩm -->
                            <div v-else class="text-center py-12">
                                <i class="pi pi-shopping-cart text-6xl text-gray-400 mb-4"></i>
                                <h4 class="text-gray-600 font-semibold text-xl mb-2">Không có sản phẩm nào</h4>
                                <p class="text-gray-500">Hóa đơn này chưa có sản phẩm hoặc không tìm thấy sản phẩm phù hợp.</p>
                            </div>
                        </div>

                        <!-- Tổng kết -->
                        <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-blue-600 mb-1">{{ hoaDonChiTiets.length }}</div>
                                    <div class="text-blue-800 font-medium">Chi tiết hóa đơn</div>
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
                    <button 
                        @click="exportChiTietPDF"
                        class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <i class="pi pi-file-pdf"></i>
                        Xuất PDF
                    </button>
                    <button 
                        @click="printInvoice"
                        class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <i class="pi pi-print"></i>
                        In hóa đơn
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
const sanPhams = ref([])
const isLoadingChiTiet = ref(false)
const isLoadingSanPham = ref(false)
const searchChiTietKeyword = ref('')
const searchSanPhamKeyword = ref('')

// Toast
const toastMessage = ref('')
const toastSummary = ref('')
const toastSeverity = ref('info')

// API URLs
const API_BASE_URL = 'http://localhost:8080'
const API_ENDPOINTS = {
    hoaDon: `${API_BASE_URL}/hoa-don`,
    hoaDonChiTiet: `${API_BASE_URL}/hoa-don-chi-tiet`,
    sanPham: `${API_BASE_URL}/san-pham`
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
        item.trangThaiHoaDon?.toLowerCase().includes(keyword) ||
        item.gia.toString().includes(keyword) ||
        item.soLuong.toString().includes(keyword)
    )
})

const filteredSanPhams = computed(() => {
    if (!searchSanPhamKeyword.value.trim()) {
        return sanPhams.value
    }
    
    const keyword = searchSanPhamKeyword.value.toLowerCase()
    return sanPhams.value.filter(item => 
        item.id.toString().includes(keyword) ||
        item.maSanPham?.toLowerCase().includes(keyword) ||
        item.tenSanPham?.toLowerCase().includes(keyword) ||
        item.thuongHieu?.tenThuongHieu?.toLowerCase().includes(keyword) ||
        item.danhMuc?.tenDanhMuc?.toLowerCase().includes(keyword) ||
        item.chatLieu?.tenChatLieu?.toLowerCase().includes(keyword)
    )
})

// Statistics
const totalRevenue = computed(() => {
    return hoaDons.value.reduce((sum, hd) => sum + (hd.tongTien || 0), 0)
})

const totalProducts = computed(() => {
    return sanPhams.value.length
})

const completedInvoices = computed(() => {
    return hoaDons.value.filter(hd => hd.trangThaiHoaDon === 'Hoàn thành').length
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
        const data = await fetchWithErrorHandling(API_ENDPOINTS.hoaDon)
        hoaDons.value = data
        
        showToast('success', 'Thành công', `Đã tải ${data.length} hóa đơn từ API`)
    } catch (error) {
        hasError.value = true
        errorMessage.value = `Không thể kết nối đến API: ${error.message}`
        showToast('error', 'Lỗi kết nối', 'Không thể tải dữ liệu từ server')
    } finally {
        isLoading.value = false
        loadingMessage.value = ''
    }
}

async function fetchChiTietHoaDon(hoaDonId) {
    isLoadingChiTiet.value = true
    try {
        const data = await fetchWithErrorHandling(`${API_ENDPOINTS.hoaDonChiTiet}/hoa-don/${hoaDonId}`)
        hoaDonChiTiets.value = data
    } catch (error) {
        console.error('Error fetching chi tiet:', error)
        hoaDonChiTiets.value = []
        showToast('error', 'Lỗi', 'Không thể tải chi tiết hóa đơn')
    } finally {
        isLoadingChiTiet.value = false
    }
}

async function fetchSanPhamByHoaDon(hoaDonId) {
    isLoadingSanPham.value = true
    try {
        const data = await fetchWithErrorHandling(`${API_ENDPOINTS.sanPham}/hoa-don/${hoaDonId}`)
        sanPhams.value = data
    } catch (error) {
        console.error('Error fetching san pham:', error)
        sanPhams.value = []
        showToast('error', 'Lỗi', 'Không thể tải danh sách sản phẩm')
    } finally {
        isLoadingSanPham.value = false
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
    searchSanPhamKeyword.value = ''
    
    // Fetch both chi tiet and san pham data
    await Promise.all([
        fetchChiTietHoaDon(hoaDon.id),
        fetchSanPhamByHoaDon(hoaDon.id)
    ])
}

function closeChiTietDialog() {
    showChiTietDialog.value = false
    selectedHoaDon.value = null
    hoaDonChiTiets.value = []
    sanPhams.value = []
    searchChiTietKeyword.value = ''
    searchSanPhamKeyword.value = ''
}

// Search and filter functions
let searchTimeout
function onSearch() {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        currentPage.value = 1
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

// Calculation functions
function getTotalQuantity() {
    return filteredChiTiets.value.reduce((sum, item) => sum + item.soLuong, 0)
}

function getTotalAmount() {
    return filteredChiTiets.value.reduce((sum, item) => sum + (item.gia * item.soLuong), 0)
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

function exportChiTietPDF() {
    showToast('info', 'Thông báo', 'Chức năng xuất PDF đang được phát triển')
}

function printInvoice() {
    showToast('info', 'Thông báo', 'Chức năng in hóa đơn đang được phát triển')
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

function getProductInitials(name) {
    if (!name) return 'SP'
    return name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

function getStatusLabel(status) {
    return status || 'Không xác định'
}

function getStatusClass(status) {
    if (!status) return 'bg-gray-100 text-gray-800'
    
    const statusLower = status.toString().toLowerCase()
    
    if (statusLower.includes('chờ') || statusLower.includes('pending')) {
        return 'bg-yellow-100 text-yellow-800'
    } else if (statusLower.includes('xác nhận') || statusLower.includes('confirmed')) {
        return 'bg-blue-100 text-blue-800'
    } else if (statusLower.includes('giao') || statusLower.includes('shipping')) {
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
    
    if (statusLower.includes('active') || statusLower.includes('hoạt động')) {
        return 'bg-green-100 text-green-800'
    } else if (statusLower.includes('inactive') || statusLower.includes('ngừng')) {
        return 'bg-red-100 text-red-800'
    } else {
        return 'bg-yellow-100 text-yellow-800'
    }
}

function getStatusIcon(status) {
    if (!status) return 'pi pi-question-circle'
    
    const statusLower = status.toString().toLowerCase()
    
    if (statusLower.includes('chờ') || statusLower.includes('pending')) {
        return 'pi pi-clock'
    } else if (statusLower.includes('xác nhận') || statusLower.includes('confirmed')) {
        return 'pi pi-check-circle'
    } else if (statusLower.includes('giao') || statusLower.includes('shipping')) {
        return 'pi pi-truck'
    } else if (statusLower.includes('hoàn thành') || statusLower.includes('completed')) {
        return 'pi pi-verified'
    } else if (statusLower.includes('hủy') || statusLower.includes('cancelled')) {
        return 'pi pi-times-circle'
    } else {
        return 'pi pi-info-circle'
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
</style>