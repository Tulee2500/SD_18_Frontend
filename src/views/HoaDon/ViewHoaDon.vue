<template>
    <div class="invoice-management">
        <!-- Header với Tab Navigation -->
        <div class="header-section mb-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
            <div class="mb-4 flex items-center justify-between">
                <div>
                    <h2 class="mb-2 text-2xl font-bold">Quản Lý Hóa Đơn Nâng Cao</h2>
                    <p class="text-blue-100">Hệ thống quản lý hóa đơn POS & Online tích hợp</p>
                </div>
                <div class="flex gap-3">
                    <button @click="refreshAllData" class="flex items-center gap-2 rounded-lg bg-white bg-opacity-20 px-4 py-2 text-white transition-all hover:bg-opacity-30" :disabled="isLoading">
                        <i :class="isLoading ? 'pi pi-spinner pi-spin' : 'pi pi-refresh'"></i>
                        {{ isLoading ? 'Đang tải...' : 'Làm mới' }}
                    </button>
                    <button @click="exportData" class="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600">
                        <i class="pi pi-download"></i>
                        Xuất dữ liệu
                    </button>
                    <!-- <button @click="openCreateInvoiceDialog" class="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600">
                        <i class="pi pi-plus"></i>
                        Tạo hóa đơn
                    </button> -->
                </div>
            </div>

            <!-- Tab Navigation -->
            <div class="flex gap-2">
                <button
                    v-for="tab in tabs"
                    :key="tab.id"
                    @click="activeTab = tab.id"
                    :class="['flex items-center gap-2 rounded-lg px-4 py-2 transition-all', activeTab === tab.id ? 'bg-white font-semibold text-blue-600 shadow-lg' : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30']"
                >
                    <i :class="tab.icon"></i>
                    {{ tab.label }}
                    <span v-if="tab.count !== undefined" class="rounded-full bg-blue-500 px-2 py-1 text-xs text-white">
                        {{ tab.count }}
                    </span>
                </button>
            </div>
        </div>

        <!-- Statistics Cards với phân tách POS/Online -->
        <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <!-- Tổng quan -->
            <div class="stat-card rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-blue-600">Tổng hóa đơn</p>
                        <p class="text-2xl font-bold text-blue-800">{{ hoaDons.length }}</p>
                        <div class="mt-2 flex gap-2">
                            <span class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700"> POS: {{ posInvoices.length }} </span>
                            <span class="rounded bg-green-100 px-2 py-1 text-xs text-green-700"> Online: {{ onlineInvoices.length }} </span>
                        </div>
                    </div>
                    <i class="pi pi-file-text text-2xl text-blue-500"></i>
                </div>
            </div>

            <!-- Doanh thu -->
            <div class="stat-card rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-green-600">Tổng doanh thu</p>
                        <p class="text-2xl font-bold text-green-800">{{ formatCurrency(totalRevenue) }}</p>
                        <div class="mt-2 flex gap-2">
                            <span class="rounded bg-orange-100 px-2 py-1 text-xs text-orange-700"> POS: {{ formatCurrency(posRevenue) }} </span>
                            <span class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700"> Online: {{ formatCurrency(onlineRevenue) }} </span>
                        </div>
                    </div>
                    <i class="pi pi-money-bill text-2xl text-green-500"></i>
                </div>
            </div>

            <!-- Hiệu suất -->
            <div class="stat-card rounded-lg border-l-4 border-purple-500 bg-purple-50 p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-purple-600">Hoàn thành</p>
                        <p class="text-2xl font-bold text-purple-800">{{ completedInvoices }}</p>
                        <div class="mt-2 flex gap-2">
                            <span class="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700"> Tỷ lệ: {{ completionRate }}% </span>
                        </div>
                    </div>
                    <i class="pi pi-check-circle text-2xl text-purple-500"></i>
                </div>
            </div>

            <!-- Cần xử lý -->
            <div class="stat-card rounded-lg border-l-4 border-orange-500 bg-orange-50 p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-orange-600">Cần xử lý</p>
                        <p class="text-2xl font-bold text-orange-800">{{ pendingInvoices }}</p>
                        <div class="mt-2 flex gap-2">
                            <span class="rounded bg-red-100 px-2 py-1 text-xs text-red-700"> Khẩn cấp: {{ urgentInvoices }} </span>
                        </div>
                    </div>
                    <i class="pi pi-clock text-2xl text-orange-500"></i>
                </div>
            </div>
        </div>

        <!-- Search and Filter -->
        <div class="search-section mb-6 rounded-lg bg-gray-50 p-4">
            <div class="flex flex-wrap items-center gap-4">
                <div class="relative min-w-64 flex-1">
                    <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400"></i>
                    <input v-model="searchKeyword" placeholder="Tìm kiếm hóa đơn, khách hàng..." @input="onSearch" class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
                </div>

                <!-- Lọc theo loại hóa đơn -->
                <select v-model="typeFilter" @change="applyFilters" class="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
                    <option value="">Tất cả loại</option>
                    <option value="OFFLINE">POS (Tại quầy)</option>
                    <option value="ONLINE">Online</option>
                </select>

                <!-- Lọc theo trạng thái -->
                <select v-model="statusFilter" @change="applyFilters" class="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
                    <option value="">Tất cả trạng thái</option>
                    <!-- POS Status -->
                    <optgroup label="POS (Tại quầy)">
                        <option value="DRAFT">Đang tạo</option>
                        <option value="PAYMENT_PENDING">Chờ thanh toán</option>
                        <option value="PAID">Đã thanh toán</option>
                        <option value="COMPLETED">Hoàn thành</option>
                    </optgroup>
                    <!-- Online Status -->
                    <optgroup label="Online">
                        <option value="CART">Giỏ hàng</option>
                        <option value="PENDING">Chờ xác nhận</option>
                        <option value="CONFIRMED">Đã xác nhận</option>
                        <option value="PREPARING">Chuẩn bị hàng</option>
                        <option value="PACKED">Đã đóng gói</option>
                        <option value="SHIPPING">Đang giao</option>
                        <option value="DELIVERED">Đã giao</option>
                    </optgroup>
                    <!-- Common -->
                    <optgroup label="Chung">
                        <option value="CANCELLED">Đã hủy</option>
                        <option value="RETURNED">Hoàn trả</option>
                    </optgroup>
                </select>

                <input type="date" v-model="dateFilter" @change="applyFilters" class="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />

                <!-- Advanced Filter Toggle -->
                <button @click="showAdvancedFilter = !showAdvancedFilter" class="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700">
                    <i class="pi pi-filter"></i>
                    Lọc nâng cao
                </button>
            </div>

            <!-- Advanced Filters -->
            <div v-if="showAdvancedFilter" class="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                <h4 class="mb-3 font-semibold">Bộ lọc nâng cao</h4>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label class="mb-1 block text-sm font-medium">Khoảng tiền</label>
                        <div class="flex gap-2">
                            <input type="number" v-model="minAmount" placeholder="Từ" class="w-full rounded-lg border px-3 py-2" />
                            <input type="number" v-model="maxAmount" placeholder="Đến" class="w-full rounded-lg border px-3 py-2" />
                        </div>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Nhân viên xử lý</label>
                        <select v-model="staffFilter" class="w-full rounded-lg border px-3 py-2">
                            <option value="">Tất cả nhân viên</option>
                            <option v-for="staff in staffList" :key="staff.id" :value="staff.id">
                                {{ staff.name }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Phương thức thanh toán</label>
                        <select v-model="paymentMethodFilter" class="w-full rounded-lg border px-3 py-2">
                            <option value="">Tất cả</option>
                            <option value="CASH">Tiền mặt</option>
                            <option value="CARD">Thẻ</option>
                            <option value="BANK_TRANSFER">Chuyển khoản</option>
                            <option value="E_WALLET">Ví điện tử</option>
                            <option value="COD">COD</option>
                        </select>
                    </div>
                </div>
                <div class="mt-4 flex gap-2">
                    <button @click="applyAdvancedFilters" class="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Áp dụng</button>
                    <button @click="clearAllFilters" class="rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600">Xóa bộ lọc</button>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="py-12 text-center">
            <div class="animate-spin mb-4 inline-block h-12 w-12 rounded-full border-b-2 border-blue-500"></div>
            <p class="text-lg text-gray-600">Đang tải dữ liệu từ API...</p>
            <p class="mt-2 text-sm text-gray-500">{{ loadingMessage }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="hasError" class="py-12 text-center">
            <i class="pi pi-exclamation-triangle mb-4 text-4xl text-red-500"></i>
            <h3 class="mb-2 text-xl font-semibold text-red-600">Lỗi kết nối API</h3>
            <p class="mb-4 text-gray-600">{{ errorMessage }}</p>
            <button @click="retryConnection" class="mx-auto flex items-center gap-2 rounded-lg bg-red-500 px-6 py-2 text-white transition-colors hover:bg-red-600">
                <i class="pi pi-refresh"></i>
                Thử lại
            </button>
        </div>

        <!-- Data Table -->
        <div v-else class="overflow-x-auto rounded-lg bg-white shadow-lg">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100" @click="sortBy('id')">
                            ID
                            <i :class="getSortIcon('id')" class="ml-1"></i>
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Mã HĐ</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Loại</th>
                        <th class="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100" @click="sortBy('ngayTao')">
                            Ngày tạo
                            <i :class="getSortIcon('ngayTao')" class="ml-1"></i>
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Khách hàng</th>
                        <th class="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100" @click="sortBy('tongTien')">
                            Tổng tiền
                            <i :class="getSortIcon('tongTien')" class="ml-1"></i>
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Trạng thái</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Workflow</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Thao tác</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                    <tr v-for="hoaDon in paginatedHoaDons" :key="hoaDon.id" class="transition-colors hover:bg-gray-50">
                        <td class="whitespace-nowrap px-6 py-4">
                            <span class="font-bold text-blue-600">#{{ hoaDon.id }}</span>
                        </td>
                        <td class="whitespace-nowrap px-6 py-4">
                            <span class="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">{{ hoaDon.maHoaDon }}</span>
                        </td>
                        <td class="whitespace-nowrap px-6 py-4">
                            <span :class="['invoice-type-badge flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-medium', hoaDon.loaiHoaDon === 'OFFLINE' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800']">
                                <i :class="hoaDon.loaiHoaDon === 'OFFLINE' ? 'pi pi-desktop' : 'pi pi-globe'"></i>
                                {{ hoaDon.loaiHoaDon === 'OFFLINE' ? 'POS' : 'Online' }}
                            </span>
                        </td>
                        <td class="whitespace-nowrap px-6 py-4">
                            <div class="flex items-center">
                                <i class="pi pi-calendar mr-2 text-gray-500"></i>
                                <span class="text-sm">{{ formatDate(hoaDon.ngayTao) }}</span>
                            </div>
                        </td>
                        <td class="whitespace-nowrap px-6 py-4">
                            <div class="flex items-center">
                                <div class="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-green-600 text-sm font-bold text-white">
                                    {{ getInitials(hoaDon.tenKhachHang || 'KH') }}
                                </div>
                                <div>
                                    <div class="font-semibold text-gray-900">{{ hoaDon.tenKhachHang || 'Khách lẻ' }}</div>
                                    <div class="text-sm text-gray-500" v-if="hoaDon.sdt"><i class="pi pi-phone mr-1"></i>{{ hoaDon.sdt }}</div>
                                </div>
                            </div>
                        </td>
                        <td class="whitespace-nowrap px-6 py-4">
                            <div class="flex items-center">
                                <i class="pi pi-money-bill mr-2 text-green-500"></i>
                                <span class="text-lg font-bold text-green-600">{{ formatCurrency(hoaDon.tongTien) }}</span>
                            </div>
                        </td>
                        <td class="whitespace-nowrap px-6 py-4">
                            <span class="rounded-full px-3 py-1 text-xs font-medium" :class="getStatusClass(hoaDon.trangThaiHoaDon)">
                                <i :class="getStatusIcon(hoaDon.trangThaiHoaDon)" class="mr-1"></i>
                                {{ getStatusLabel(hoaDon.trangThaiHoaDon) }}
                            </span>
                        </td>
                        <td class="whitespace-nowrap px-6 py-4">
                            <div class="flex items-center gap-1">
                                <div v-for="(step, index) in getWorkflowSteps(hoaDon.loaiHoaDon)" :key="step" class="flex items-center">
                                    <div :class="['workflow-step px-2 py-1 text-xs', getStepClass(hoaDon, step)]" :title="getStepLabel(step)">
                                        <i :class="getStepIcon(step)" class="text-xs"></i>
                                    </div>
                                    <div v-if="index < getWorkflowSteps(hoaDon.loaiHoaDon).length - 1" class="workflow-arrow"></div>
                                </div>
                            </div>
                        </td>
                        <td class="whitespace-nowrap px-6 py-4">
                            <div class="flex gap-2">
                                <button class="flex items-center gap-1 rounded bg-blue-500 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-600" @click="viewChiTiet(hoaDon)" title="Xem chi tiết">
                                    <i class="pi pi-eye"></i>
                                    Chi tiết
                                </button>
                                <button
                                    v-if="canUpdateStatus(hoaDon)"
                                    class="flex items-center gap-1 rounded bg-green-500 px-3 py-1 text-sm text-white transition-colors hover:bg-green-600"
                                    @click="updateInvoiceStatus(hoaDon)"
                                    title="Cập nhật trạng thái"
                                >
                                    <i class="pi pi-arrow-right"></i>
                                    Cập nhật
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Pagination -->
            <div class="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-700">Hiển thị {{ (currentPage - 1) * itemsPerPage + 1 }} đến {{ Math.min(currentPage * itemsPerPage, filteredHoaDons.length) }} trong tổng số {{ filteredHoaDons.length }} hóa đơn</div>
                    <div class="flex items-center gap-2">
                        <button @click="previousPage" :disabled="currentPage === 1" class="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">
                            <i class="pi pi-chevron-left"></i>
                        </button>
                        <span class="px-3 py-1 text-sm">{{ currentPage }} / {{ totalPages }}</span>
                        <button @click="nextPage" :disabled="currentPage === totalPages" class="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">
                            <i class="pi pi-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-if="filteredHoaDons.length === 0" class="p-12 text-center">
                <i class="pi pi-file-o mb-4 text-6xl text-gray-400"></i>
                <h3 class="mb-2 text-xl font-semibold text-gray-600">Không tìm thấy hóa đơn</h3>
                <p class="text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
        </div>

        <!-- Dialog chi tiết hóa đơn -->
        <div v-if="showChiTietDialog" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div class="max-h-[90vh] w-full max-w-7xl overflow-hidden rounded-xl bg-white shadow-2xl">
                <!-- Dialog Header với Workflow -->
                <div class="border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                    <div class="mb-4 flex items-start justify-between">
                        <div>
                            <h3 class="text-2xl font-bold">Chi tiết hóa đơn {{ selectedHoaDon?.maHoaDon }}</h3>
                            <p class="mt-1 text-blue-100">
                                <span class="inline-flex items-center gap-2">
                                    <i :class="selectedHoaDon?.loaiHoaDon === 'OFFLINE' ? 'pi pi-desktop' : 'pi pi-globe'"></i>
                                    {{ selectedHoaDon?.loaiHoaDon === 'OFFLINE' ? 'Hóa đơn POS (Tại quầy)' : 'Hóa đơn Online' }}
                                </span>
                            </p>
                        </div>
                        <button @click="closeChiTietDialog" class="rounded-lg p-2 text-2xl text-white transition-all hover:bg-white hover:bg-opacity-20 hover:text-gray-200">
                            <i class="pi pi-times"></i>
                        </button>
                    </div>

                    <!-- Workflow Progress -->
                    <div v-if="selectedHoaDon" class="rounded-lg bg-white bg-opacity-10 p-4">
                        <h4 class="mb-3 flex items-center gap-2 font-semibold text-white">
                            <i class="pi pi-share-alt"></i>
                            Tiến trình xử lý
                        </h4>
                        <div class="flex items-center justify-between">
                            <div v-for="(step, index) in getWorkflowSteps(selectedHoaDon.loaiHoaDon)" :key="step" class="flex flex-1 items-center">
                                <div class="flex flex-1 flex-col items-center">
                                    <div :class="['flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all', getDetailStepClass(selectedHoaDon, step)]">
                                        <i :class="getStepIcon(step)" class="text-sm"></i>
                                    </div>
                                    <span class="mt-2 text-center text-xs text-white">{{ getStepLabel(step) }}</span>
                                </div>
                                <div v-if="index < getWorkflowSteps(selectedHoaDon.loaiHoaDon).length - 1" :class="['mx-2 h-1 flex-1 transition-all', isStepCompleted(selectedHoaDon, step) ? 'bg-green-400' : 'bg-white bg-opacity-30']"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Dialog Content -->
                <div class="max-h-[calc(95vh-300px)] overflow-y-auto p-6">
                    <div v-if="selectedHoaDon" class="space-y-6">
                        <!-- Actions Bar -->
                        <div class="flex justify-end gap-3 rounded-lg bg-gray-50 p-4">
                            <button v-if="canProcessNextStep(selectedHoaDon)" @click="processNextStep(selectedHoaDon)" class="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600">
                                <i class="pi pi-arrow-right"></i>
                                {{ getNextStepAction(selectedHoaDon) }}
                            </button>
                            <button v-if="canCancelInvoice(selectedHoaDon)" @click="cancelInvoice(selectedHoaDon)" class="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600">
                                <i class="pi pi-times"></i>
                                Hủy đơn
                            </button>
                            <button v-if="selectedHoaDon.loaiHoaDon === 'OFFLINE'" @click="printInvoice(selectedHoaDon)" class="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600">
                                <i class="pi pi-print"></i>
                                In hóa đơn
                            </button>
                            <button v-if="selectedHoaDon.loaiHoaDon === 'ONLINE'" @click="trackingInfo(selectedHoaDon)" class="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600">
                                <i class="pi pi-map-marker"></i>
                                Tracking
                            </button>
                        </div>

                        <!-- Thông tin chi tiết -->
                        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <!-- Thông tin hóa đơn -->
                            <div class="rounded-xl border border-blue-200 bg-blue-50 p-6">
                                <h6 class="mb-4 flex items-center text-lg font-bold text-blue-800">
                                    <i class="pi pi-file-text mr-2 text-blue-600"></i>
                                    Thông tin hóa đơn
                                </h6>
                                <div class="space-y-3">
                                    <div class="flex items-center justify-between">
                                        <span class="font-medium text-blue-600">Mã HĐ:</span>
                                        <span class="font-bold text-blue-800">{{ selectedHoaDon.maHoaDon }}</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="font-medium text-blue-600">Loại:</span>
                                        <span :class="['rounded-full px-2 py-1 text-xs font-medium', selectedHoaDon.loaiHoaDon === 'OFFLINE' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800']">
                                            {{ selectedHoaDon.loaiHoaDon === 'OFFLINE' ? 'POS' : 'Online' }}
                                        </span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="font-medium text-blue-600">Ngày tạo:</span>
                                        <span class="font-medium">{{ formatDate(selectedHoaDon.ngayTao) }}</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="font-medium text-blue-600">Tổng tiền:</span>
                                        <span class="text-lg font-bold text-green-600">{{ formatCurrency(selectedHoaDon.tongTien) }}</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="font-medium text-blue-600">Trạng thái:</span>
                                        <span class="rounded-full px-2 py-1 text-xs font-medium" :class="getStatusClass(selectedHoaDon.trangThaiHoaDon)">
                                            {{ getStatusLabel(selectedHoaDon.trangThaiHoaDon) }}
                                        </span>
                                    </div>
                                    <div v-if="selectedHoaDon.nhanVienXuLy" class="flex items-center justify-between">
                                        <span class="font-medium text-blue-600">Nhân viên:</span>
                                        <span class="font-medium">{{ selectedHoaDon.nhanVienXuLy }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Thông tin khách hàng -->
                            <div class="rounded-xl border border-green-200 bg-green-50 p-6">
                                <h6 class="mb-4 flex items-center text-lg font-bold text-green-800">
                                    <i class="pi pi-user mr-2 text-green-600"></i>
                                    Thông tin khách hàng
                                </h6>
                                <div class="space-y-3">
                                    <div class="flex items-center justify-between">
                                        <span class="font-medium text-green-600">Tên:</span>
                                        <span class="font-bold text-green-800">{{ selectedHoaDon.tenKhachHang || 'Khách lẻ' }}</span>
                                    </div>
                                    <div v-if="selectedHoaDon.sdt" class="flex items-center justify-between">
                                        <span class="font-medium text-green-600">SĐT:</span>
                                        <span class="font-medium">{{ selectedHoaDon.sdt }}</span>
                                    </div>
                                    <div v-if="selectedHoaDon.email" class="flex items-center justify-between">
                                        <span class="font-medium text-green-600">Email:</span>
                                        <span class="font-medium">{{ selectedHoaDon.email }}</span>
                                    </div>
                                    <div v-if="selectedHoaDon.diaChi" class="flex items-start justify-between">
                                        <span class="font-medium text-green-600">Địa chỉ:</span>
                                        <span class="max-w-40 text-right font-medium">{{ selectedHoaDon.diaChi }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Thông tin thanh toán -->
                            <div class="rounded-xl border border-purple-200 bg-purple-50 p-6">
                                <h6 class="mb-4 flex items-center text-lg font-bold text-purple-800">
                                    <i class="pi pi-credit-card mr-2 text-purple-600"></i>
                                    Thanh toán
                                </h6>
                                <div class="space-y-3">
                                    <div class="flex items-center justify-between">
                                        <span class="font-medium text-purple-600">Phương thức:</span>
                                        <span class="font-medium">{{ selectedHoaDon.phuongThucThanhToan || 'Chưa xác định' }}</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="font-medium text-purple-600">Tình trạng:</span>
                                        <span :class="['rounded-full px-2 py-1 text-xs font-medium', getPaymentStatusClass(selectedHoaDon.tinhTrangThanhToan)]">
                                            {{ getPaymentStatusLabel(selectedHoaDon.tinhTrangThanhToan) }}
                                        </span>
                                    </div>
                                    <div v-if="selectedHoaDon.loaiHoaDon === 'OFFLINE' && selectedHoaDon.tienThua" class="flex items-center justify-between">
                                        <span class="font-medium text-purple-600">Tiền thừa:</span>
                                        <span class="font-bold text-red-600">{{ formatCurrency(selectedHoaDon.tienThua) }}</span>
                                    </div>
                                    <div v-if="selectedHoaDon.maGiaoDich" class="flex items-center justify-between">
                                        <span class="font-medium text-purple-600">Mã GD:</span>
                                        <span class="font-mono text-sm">{{ selectedHoaDon.maGiaoDich }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Chi tiết sản phẩm -->
                        <div class="rounded-xl bg-gray-50 p-6">
                            <div class="mb-6 flex items-center justify-between">
                                <h6 class="flex items-center text-xl font-bold text-gray-800">
                                    <i class="pi pi-list mr-2 text-gray-600"></i>
                                    Chi tiết sản phẩm ({{ hoaDonChiTiets.length }} mặt hàng)
                                </h6>
                                <div class="flex gap-3">
                                    <div class="relative">
                                        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400"></i>
                                        <input v-model="searchChiTietKeyword" placeholder="Tìm kiếm sản phẩm..." class="rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <button
                                        v-if="selectedHoaDon.loaiHoaDon === 'OFFLINE' && canEditPOSItems(selectedHoaDon)"
                                        @click="editPOSItems(selectedHoaDon)"
                                        class="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                                    >
                                        <i class="pi pi-pencil"></i>
                                        Sửa
                                    </button>
                                </div>
                            </div>

                            <!-- Loading Chi Tiết -->
                            <div v-if="isLoadingChiTiet" class="py-8 text-center">
                                <div class="animate-spin mb-4 inline-block h-8 w-8 rounded-full border-b-2 border-blue-500"></div>
                                <p class="text-gray-600">Đang tải chi tiết hóa đơn...</p>
                            </div>

                            <!-- Chi Tiết Table -->
                            <div v-else class="overflow-x-auto rounded-lg border bg-white shadow-sm">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">STT</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tên sản phẩm</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Thuộc tính</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Giá bán</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Số lượng</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Thành tiền</th>
                                            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Trạng thái</th>
                                            <th v-if="canEditItems(selectedHoaDon)" class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200 bg-white">
                                        <tr v-for="(chiTiet, index) in filteredChiTiets" :key="chiTiet.id" class="hover:bg-gray-50">
                                            <td class="whitespace-nowrap px-4 py-3">
                                                <span class="rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-600">{{ index + 1 }}</span>
                                            </td>
                                            <td class="px-4 py-3">
                                                <div class="font-medium text-gray-900">{{ chiTiet.tenSanPham || 'N/A' }}</div>
                                                <div v-if="chiTiet.maSanPham" class="text-sm text-gray-500">Mã: {{ chiTiet.maSanPham }}</div>
                                            </td>
                                            <td class="px-4 py-3">
                                                <div class="space-y-1 text-sm">
                                                    <span v-if="chiTiet.mauSac" class="inline-block rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                                                        {{ chiTiet.mauSac }}
                                                    </span>
                                                    <span v-if="chiTiet.kichThuoc" class="ml-1 inline-block rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                                                        {{ chiTiet.kichThuoc }}
                                                    </span>
                                                </div>
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-3">
                                                <span class="font-bold text-green-600">{{ formatCurrency(chiTiet.giaBan) }}</span>
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-3">
                                                <div v-if="isEditingItem(chiTiet.id)" class="flex items-center gap-2">
                                                    <input v-model.number="editQuantity" type="number" min="1" class="w-16 rounded border px-2 py-1" />
                                                    <button @click="saveQuantity(chiTiet.id)" class="rounded bg-green-500 px-2 py-1 text-xs text-white">
                                                        <i class="pi pi-check"></i>
                                                    </button>
                                                    <button @click="cancelEdit()" class="rounded bg-gray-500 px-2 py-1 text-xs text-white">
                                                        <i class="pi pi-times"></i>
                                                    </button>
                                                </div>
                                                <span v-else class="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                                                    {{ chiTiet.soLuong }}
                                                </span>
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-3">
                                                <span class="font-bold text-blue-600">{{ formatCurrency(chiTiet.giaBan * chiTiet.soLuong) }}</span>
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-3">
                                                <span class="rounded-full px-2 py-1 text-xs font-medium" :class="getChiTietStatusClass(chiTiet.trangThai)">
                                                    {{ getChiTietStatusLabel(chiTiet.trangThai) }}
                                                </span>
                                            </td>
                                            <td v-if="canEditItems(selectedHoaDon)" class="whitespace-nowrap px-4 py-3">
                                                <div class="flex gap-1">
                                                    <button v-if="!isEditingItem(chiTiet.id)" @click="editItem(chiTiet)" class="rounded bg-blue-500 px-2 py-1 text-xs text-white" title="Sửa số lượng">
                                                        <i class="pi pi-pencil"></i>
                                                    </button>
                                                    <button @click="removeItem(chiTiet.id)" class="rounded bg-red-500 px-2 py-1 text-xs text-white" title="Xóa sản phẩm">
                                                        <i class="pi pi-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                <!-- Empty Chi Tiết -->
                                <div v-if="filteredChiTiets.length === 0" class="p-8 text-center">
                                    <i class="pi pi-info-circle mb-4 text-4xl text-gray-400"></i>
                                    <h4 class="mb-2 font-semibold text-gray-600">Không có chi tiết nào</h4>
                                    <p class="text-gray-500">Hóa đơn này chưa có chi tiết sản phẩm.</p>
                                </div>
                            </div>
                        </div>

                        <!-- Tổng kết -->
                        <div class="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6">
                            <div class="grid grid-cols-1 gap-6 md:grid-cols-4">
                                <div class="text-center">
                                    <div class="mb-1 text-2xl font-bold text-blue-600">{{ hoaDonChiTiets.length }}</div>
                                    <div class="font-medium text-blue-800">Số mặt hàng</div>
                                </div>
                                <div class="text-center">
                                    <div class="mb-1 text-2xl font-bold text-purple-600">{{ getTotalQuantity() }}</div>
                                    <div class="font-medium text-purple-800">Tổng số lượng</div>
                                </div>
                                <div class="text-center">
                                    <div class="mb-1 text-2xl font-bold text-green-600">{{ formatCurrency(getTotalAmount()) }}</div>
                                    <div class="font-medium text-green-800">Tổng tiền hàng</div>
                                </div>
                                <div class="text-center">
                                    <div class="mb-1 text-2xl font-bold text-orange-600">{{ formatCurrency(selectedHoaDon.tongTien) }}</div>
                                    <div class="font-medium text-orange-800">Thành tiền</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Dialog Footer -->
                <div class="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-6">
                    <button @click="closeChiTietDialog" class="flex items-center gap-2 rounded-lg bg-gray-500 px-6 py-2 text-white transition-colors hover:bg-gray-600">
                        <i class="pi pi-times"></i>
                        Đóng
                    </button>
                </div>
            </div>
        </div>

        <!-- Status Update Dialog -->
        <div v-if="showStatusUpdateDialog" class="fixed inset-0 z-[9998] flex items-center justify-center bg-black bg-opacity-50">
            <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <h3 class="mb-4 text-lg font-semibold">Cập nhật trạng thái</h3>
                <div class="space-y-4">
                    <div>
                        <label class="mb-2 block text-sm font-medium">Trạng thái hiện tại:</label>
                        <span class="rounded-full px-3 py-1 text-sm" :class="getStatusClass(selectedInvoiceForUpdate?.trangThaiHoaDon)">
                            {{ getStatusLabel(selectedInvoiceForUpdate?.trangThaiHoaDon) }}
                        </span>
                    </div>
                    <div>
                        <label class="mb-2 block text-sm font-medium">Trạng thái mới:</label>
                        <select v-model="newStatus" class="w-full rounded-lg border px-3 py-2">
                            <option v-for="status in getAvailableStatuses(selectedInvoiceForUpdate)" :key="status.value" :value="status.value">
                                {{ status.label }}
                            </option>
                        </select>
                    </div>
                    <div v-if="needsNote(newStatus)">
                        <label class="mb-2 block text-sm font-medium">Ghi chú:</label>
                        <textarea v-model="statusNote" class="w-full rounded-lg border px-3 py-2" rows="3" placeholder="Nhập ghi chú..."></textarea>
                    </div>
                </div>
                <div class="mt-6 flex gap-3">
                    <button @click="confirmStatusUpdate" class="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Cập nhật</button>
                    <button @click="closeStatusUpdateDialog" class="flex-1 rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600">Hủy</button>
                </div>
            </div>
        </div>

        <!-- Create Invoice Dialog -->
        <div v-if="showCreateInvoiceDialog" class="fixed inset-0 z-[9997] flex items-center justify-center bg-black bg-opacity-50">
            <div class="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
                <h3 class="mb-4 text-lg font-semibold">Tạo hóa đơn mới</h3>

                <div class="mb-6 grid grid-cols-2 gap-4">
                    <button
                        @click="createInvoiceType = 'POS'"
                        :class="['rounded-lg border-2 p-4 text-center transition-all', createInvoiceType === 'POS' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-300 hover:border-orange-300']"
                    >
                        <i class="pi pi-desktop mb-2 block text-2xl"></i>
                        <div class="font-semibold">Hóa đơn POS</div>
                        <div class="text-sm text-gray-600">Bán hàng tại quầy</div>
                    </button>

                    <button
                        @click="createInvoiceType = 'ONLINE'"
                        :class="['rounded-lg border-2 p-4 text-center transition-all', createInvoiceType === 'ONLINE' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 hover:border-green-300']"
                    >
                        <i class="pi pi-globe mb-2 block text-2xl"></i>
                        <div class="font-semibold">Hóa đơn Online</div>
                        <div class="text-sm text-gray-600">Đơn hàng trực tuyến</div>
                    </button>
                </div>

                <div v-if="createInvoiceType" class="space-y-4">
                    <div>
                        <label class="mb-2 block text-sm font-medium">Khách hàng:</label>
                        <select v-model="newInvoice.khachHangId" class="w-full rounded-lg border px-3 py-2">
                            <option value="">Khách lẻ</option>
                            <option v-for="customer in customerList" :key="customer.id" :value="customer.id">{{ customer.name }} - {{ customer.phone }}</option>
                        </select>
                    </div>

                    <div v-if="createInvoiceType === 'POS'">
                        <label class="mb-2 block text-sm font-medium">Quầy bán:</label>
                        <select v-model="newInvoice.quayBanId" class="w-full rounded-lg border px-3 py-2">
                            <option v-for="counter in counterList" :key="counter.id" :value="counter.id">
                                {{ counter.name }}
                            </option>
                        </select>
                    </div>

                    <div v-if="createInvoiceType === 'ONLINE'">
                        <label class="mb-2 block text-sm font-medium">Địa chỉ giao hàng:</label>
                        <textarea v-model="newInvoice.diaChiGiaoHang" class="w-full rounded-lg border px-3 py-2" rows="3"></textarea>
                    </div>
                </div>

                <div class="mt-6 flex gap-3">
                    <button @click="createInvoice" :disabled="!createInvoiceType" class="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50">Tạo hóa đơn</button>
                    <button @click="closeCreateInvoiceDialog" class="flex-1 rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600">Hủy</button>
                </div>
            </div>
        </div>

        <!-- Toast Notifications -->
        <div v-if="toastMessage" class="animate-slide-in fixed right-4 top-4 z-[99999] max-w-sm rounded-lg border-l-4 px-6 py-4 text-white shadow-lg" :class="getToastClass()">
            <div class="flex items-start gap-3">
                <i :class="[getToastIcon(), 'mt-0.5 text-xl']"></i>
                <div class="flex-1">
                    <div class="mb-1 font-semibold">{{ toastSummary }}</div>
                    <div class="text-sm opacity-90">{{ toastMessage }}</div>
                </div>
                <button @click="closeToast" class="ml-2 text-white hover:text-gray-200">
                    <i class="pi pi-times"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue';

export default {
    name: 'InvoiceManagement',
    setup() {
        // Reactive data
        const hoaDons = ref([]);
        const isLoading = ref(false);
        const hasError = ref(false);
        const errorMessage = ref('');
        const loadingMessage = ref('');
        const searchKeyword = ref('');
        const statusFilter = ref('');
        const typeFilter = ref('');
        const dateFilter = ref('');
        const showAdvancedFilter = ref(false);
        const minAmount = ref('');
        const maxAmount = ref('');
        const staffFilter = ref('');
        const paymentMethodFilter = ref('');

        // Tab management
        const activeTab = ref('all');
        const tabs = ref([
            { id: 'all', label: 'Tất cả', icon: 'pi pi-list', count: 0 },
            { id: 'pos', label: 'POS', icon: 'pi pi-desktop', count: 0 },
            { id: 'online', label: 'Online', icon: 'pi pi-globe', count: 0 },
            { id: 'pending', label: 'Cần xử lý', icon: 'pi pi-clock', count: 0 }
        ]);

        // Sorting
        const sortField = ref('');
        const sortOrder = ref('asc');

        // Pagination
        const currentPage = ref(1);
        const itemsPerPage = ref(10);

        // Chi tiết hóa đơn
        const showChiTietDialog = ref(false);
        const selectedHoaDon = ref(null);
        const hoaDonChiTiets = ref([]);
        const isLoadingChiTiet = ref(false);
        const searchChiTietKeyword = ref('');
        const editingItemId = ref(null);
        const editQuantity = ref(1);

        // Status update
        const showStatusUpdateDialog = ref(false);
        const selectedInvoiceForUpdate = ref(null);
        const newStatus = ref('');
        const statusNote = ref('');

        // Create invoice
        const showCreateInvoiceDialog = ref(false);
        const createInvoiceType = ref('');
        const newInvoice = ref({
            khachHangId: '',
            quayBanId: '',
            diaChiGiaoHang: ''
        });

        // Static data
        const customerList = ref([
            { id: 1, name: 'Nguyễn Văn A', phone: '0901234567' },
            { id: 2, name: 'Trần Thị B', phone: '0902345678' }
        ]);

        const counterList = ref([
            { id: 1, name: 'Quầy 1' },
            { id: 2, name: 'Quầy 2' },
            { id: 3, name: 'Quầy 3' }
        ]);

        const staffList = ref([
            { id: 1, name: 'Nhân viên A' },
            { id: 2, name: 'Nhân viên B' }
        ]);

        // Toast
        const toastMessage = ref('');
        const toastSummary = ref('');
        const toastSeverity = ref('info');

        // API URLs
        const API_BASE_URL = 'http://localhost:8080/api';
        const API_ENDPOINTS = {
            hoaDon: `${API_BASE_URL}/hoa-don`,
            hoaDonPOS: `${API_BASE_URL}/hoa-don/pos`,
            hoaDonOnline: `${API_BASE_URL}/hoa-don/online`,
            hoaDonChiTiet: `${API_BASE_URL}/hoa-don-chi-tiet`
        };

        // Computed properties
        const filteredHoaDons = computed(() => {
            let filtered = [...hoaDons.value];

            // Tab filter
            if (activeTab.value === 'pos') {
                filtered = filtered.filter((hd) => hd.loaiHoaDon === 'OFFLINE');
            } else if (activeTab.value === 'online') {
                filtered = filtered.filter((hd) => hd.loaiHoaDon === 'ONLINE');
            } else if (activeTab.value === 'pending') {
                filtered = filtered.filter((hd) => ['PENDING', 'CONFIRMED', 'PREPARING', 'PAYMENT_PENDING'].includes(hd.trangThaiHoaDon));
            }

            // Search filter
            if (searchKeyword.value.trim()) {
                const keyword = searchKeyword.value.toLowerCase();
                filtered = filtered.filter((hd) => hd.maHoaDon?.toLowerCase().includes(keyword) || hd.tenKhachHang?.toLowerCase().includes(keyword) || hd.sdt?.includes(keyword) || hd.email?.toLowerCase().includes(keyword));
            }

            // Type filter
            if (typeFilter.value) {
                filtered = filtered.filter((hd) => hd.loaiHoaDon === typeFilter.value);
            }

            // Status filter
            if (statusFilter.value) {
                filtered = filtered.filter((hd) => hd.trangThaiHoaDon === statusFilter.value);
            }

            // Date filter
            if (dateFilter.value) {
                const filterDate = new Date(dateFilter.value).toDateString();
                filtered = filtered.filter((hd) => {
                    const hoaDonDate = new Date(hd.ngayTao).toDateString();
                    return hoaDonDate === filterDate;
                });
            }

            // Advanced filters
            if (minAmount.value || maxAmount.value) {
                filtered = filtered.filter((hd) => {
                    const amount = hd.tongTien || 0;
                    const min = minAmount.value ? parseFloat(minAmount.value) : 0;
                    const max = maxAmount.value ? parseFloat(maxAmount.value) : Infinity;
                    return amount >= min && amount <= max;
                });
            }

            if (staffFilter.value) {
                filtered = filtered.filter((hd) => hd.nhanVienId === staffFilter.value);
            }

            if (paymentMethodFilter.value) {
                filtered = filtered.filter((hd) => hd.phuongThucThanhToan === paymentMethodFilter.value);
            }

            // Sorting
            if (sortField.value) {
                filtered.sort((a, b) => {
                    let aVal = a[sortField.value];
                    let bVal = b[sortField.value];

                    if (sortField.value === 'ngayTao') {
                        aVal = new Date(aVal);
                        bVal = new Date(bVal);
                    }

                    if (sortOrder.value === 'asc') {
                        return aVal > bVal ? 1 : -1;
                    } else {
                        return aVal < bVal ? 1 : -1;
                    }
                });
            }

            return filtered;
        });

        const paginatedHoaDons = computed(() => {
            const start = (currentPage.value - 1) * itemsPerPage.value;
            const end = start + itemsPerPage.value;
            return filteredHoaDons.value.slice(start, end);
        });

        const totalPages = computed(() => {
            return Math.ceil(filteredHoaDons.value.length / itemsPerPage.value);
        });

        const filteredChiTiets = computed(() => {
            if (!searchChiTietKeyword.value.trim()) {
                return hoaDonChiTiets.value;
            }

            const keyword = searchChiTietKeyword.value.toLowerCase();
            return hoaDonChiTiets.value.filter((item) => item.id.toString().includes(keyword) || item.tenSanPham?.toLowerCase().includes(keyword) || item.maSanPham?.toLowerCase().includes(keyword));
        });

        // Statistics
        const posInvoices = computed(() => {
            return hoaDons.value.filter((hd) => hd.loaiHoaDon === 'OFFLINE');
        });

        const onlineInvoices = computed(() => {
            return hoaDons.value.filter((hd) => hd.loaiHoaDon === 'ONLINE');
        });

        const totalRevenue = computed(() => {
            return hoaDons.value.filter((hd) => ['COMPLETED', 'PAID'].includes(hd.trangThaiHoaDon)).reduce((sum, hd) => sum + (hd.tongTien || 0), 0);
        });

        const posRevenue = computed(() => {
            return posInvoices.value.filter((hd) => ['COMPLETED', 'PAID'].includes(hd.trangThaiHoaDon)).reduce((sum, hd) => sum + (hd.tongTien || 0), 0);
        });

        const onlineRevenue = computed(() => {
            return onlineInvoices.value.filter((hd) => hd.trangThaiHoaDon === 'COMPLETED').reduce((sum, hd) => sum + (hd.tongTien || 0), 0);
        });

        const completedInvoices = computed(() => {
            return hoaDons.value.filter((hd) => ['COMPLETED', 'PAID'].includes(hd.trangThaiHoaDon)).length;
        });

        const pendingInvoices = computed(() => {
            return hoaDons.value.filter((hd) => ['PENDING', 'CONFIRMED', 'PREPARING', 'PAYMENT_PENDING'].includes(hd.trangThaiHoaDon)).length;
        });

        const urgentInvoices = computed(() => {
            const urgentStatuses = ['PAYMENT_PENDING', 'PENDING'];
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return hoaDons.value.filter((hd) => urgentStatuses.includes(hd.trangThaiHoaDon) && new Date(hd.ngayTao) < oneDayAgo).length;
        });

        const completionRate = computed(() => {
            if (hoaDons.value.length === 0) return 0;
            return Math.round((completedInvoices.value / hoaDons.value.length) * 100);
        });

        // Update tab counts
        watch([hoaDons], () => {
            tabs.value[0].count = hoaDons.value.length;
            tabs.value[1].count = posInvoices.value.length;
            tabs.value[2].count = onlineInvoices.value.length;
            tabs.value[3].count = pendingInvoices.value;
        });

        // API Functions
        async function fetchWithErrorHandling(url, options = {}) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        ...options.headers
                    },
                    ...options
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return await response.json();
            } catch (error) {
                console.error(`API Error for ${url}:`, error);
                throw error;
            }
        }

        async function fetchAllData() {
            isLoading.value = true;
            hasError.value = false;
            loadingMessage.value = 'Đang kết nối đến server...';

            try {
                loadingMessage.value = 'Đang tải danh sách hóa đơn...';

                console.log(`Gọi API: ${API_ENDPOINTS.hoaDon}`);
                const data = await fetchWithErrorHandling(API_ENDPOINTS.hoaDon);

                hoaDons.value = data;
                console.log('Dữ liệu hóa đơn nhận được:', data);

                showToast('success', 'Thành công', `Đã tải ${data.length} hóa đơn`);
            } catch (error) {
                console.error('Lỗi khi gọi API:', error);
                hasError.value = true;
                errorMessage.value = `Không thể kết nối đến API: ${error.message}`;
                showToast('error', 'Lỗi kết nối', 'Không thể tải dữ liệu từ server');

                // Fallback to sample data
                hoaDons.value = createSampleData();
                showToast('info', 'Dữ liệu mẫu', 'Hiển thị dữ liệu mẫu để demo');
            } finally {
                isLoading.value = false;
                loadingMessage.value = '';
            }
        }

        // Sample data
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
                    loaiHoaDon: 'ONLINE',
                    ngayTao: '2025-01-01T10:00:00.000Z',
                    phuongThucThanhToan: 'BANK_TRANSFER'
                },
                {
                    id: 2,
                    maHoaDon: 'HD002',
                    tenKhachHang: 'Trần Văn B',
                    sdt: '0912345672',
                    email: 'user2@example.com',
                    tongTien: 900000,
                    trangThaiHoaDon: 'PENDING',
                    loaiHoaDon: 'ONLINE',
                    ngayTao: '2025-01-01T11:00:00.000Z',
                    phuongThucThanhToan: 'COD'
                },
                {
                    id: 3,
                    maHoaDon: 'HD003',
                    tenKhachHang: 'Lê Văn C',
                    sdt: '0912345673',
                    tongTien: 1200000,
                    trangThaiHoaDon: 'PAID',
                    loaiHoaDon: 'OFFLINE',
                    ngayTao: '2025-01-01T12:00:00.000Z',
                    phuongThucThanhToan: 'CASH'
                },
                {
                    id: 4,
                    maHoaDon: 'HD004',
                    tenKhachHang: 'Phạm Văn D',
                    sdt: '0912345674',
                    tongTien: 1800000,
                    trangThaiHoaDon: 'SHIPPING',
                    loaiHoaDon: 'ONLINE',
                    ngayTao: '2025-01-01T13:00:00.000Z',
                    phuongThucThanhToan: 'E_WALLET'
                },
                {
                    id: 5,
                    maHoaDon: 'HD005',
                    tenKhachHang: 'Ngô Văn E',
                    sdt: '0912345675',
                    tongTien: 800000,
                    trangThaiHoaDon: 'PAYMENT_PENDING',
                    loaiHoaDon: 'OFFLINE',
                    ngayTao: '2025-01-01T14:00:00.000Z',
                    phuongThucThanhToan: 'CARD'
                }
            ];
        }

        function createSampleChiTietData(hoaDonId) {
            return [
                {
                    id: 1,
                    hoaDonId: hoaDonId,
                    tenSanPham: 'Giày Nike Air Max',
                    maSanPham: 'SP001',
                    mauSac: 'Đen',
                    kichThuoc: '42',
                    giaBan: 1200000,
                    soLuong: 1,
                    trangThai: 'ACTIVE'
                },
                {
                    id: 2,
                    hoaDonId: hoaDonId,
                    tenSanPham: 'Áo thun Adidas',
                    maSanPham: 'SP002',
                    mauSac: 'Trắng',
                    kichThuoc: 'L',
                    giaBan: 600000,
                    soLuong: 2,
                    trangThai: 'ACTIVE'
                }
            ];
        }

        async function fetchChiTietHoaDon(hoaDonId) {
            isLoadingChiTiet.value = true;
            try {
                const endpoint = `${API_ENDPOINTS.hoaDonChiTiet}/by-hoa-don/${hoaDonId}`;
                console.log(`Gọi API chi tiết: ${endpoint}`);

                const data = await fetchWithErrorHandling(endpoint);
                hoaDonChiTiets.value = data;
                console.log('Chi tiết hóa đơn nhận được:', data);

                if (data.length === 0) {
                    showToast('info', 'Thông báo', 'Hóa đơn này không có chi tiết sản phẩm');
                }
            } catch (error) {
                console.error('Error fetching chi tiet:', error);
                hoaDonChiTiets.value = createSampleChiTietData(hoaDonId);
                showToast('warning', 'Dữ liệu mẫu', 'Không thể tải chi tiết, hiển thị dữ liệu mẫu');
            } finally {
                isLoadingChiTiet.value = false;
            }
        }

        // Workflow functions
        function getWorkflowSteps(loaiHoaDon) {
            if (loaiHoaDon === 'OFFLINE') {
                return ['DRAFT', 'PAYMENT_PENDING', 'PAID', 'COMPLETED'];
            } else {
                return ['CART', 'PENDING', 'CONFIRMED', 'PREPARING', 'PACKED', 'SHIPPING', 'DELIVERED', 'COMPLETED'];
            }
        }

        function getStepClass(hoaDon, step) {
            const currentStep = hoaDon.trangThaiHoaDon;
            const steps = getWorkflowSteps(hoaDon.loaiHoaDon);
            const currentIndex = steps.indexOf(currentStep);
            const stepIndex = steps.indexOf(step);

            if (stepIndex < currentIndex) {
                return 'completed bg-green-500 text-white';
            } else if (stepIndex === currentIndex) {
                return 'active bg-blue-500 text-white';
            } else {
                return 'pending bg-gray-300 text-gray-600';
            }
        }

        function getDetailStepClass(hoaDon, step) {
            const currentStep = hoaDon.trangThaiHoaDon;
            const steps = getWorkflowSteps(hoaDon.loaiHoaDon);
            const currentIndex = steps.indexOf(currentStep);
            const stepIndex = steps.indexOf(step);

            if (stepIndex < currentIndex) {
                return 'bg-green-500 border-green-500 text-white';
            } else if (stepIndex === currentIndex) {
                return 'bg-blue-500 border-blue-500 text-white';
            } else {
                return 'bg-white border-gray-300 text-gray-400';
            }
        }

        function isStepCompleted(hoaDon, step) {
            const currentStep = hoaDon.trangThaiHoaDon;
            const steps = getWorkflowSteps(hoaDon.loaiHoaDon);
            const currentIndex = steps.indexOf(currentStep);
            const stepIndex = steps.indexOf(step);
            return stepIndex < currentIndex;
        }

        function getStepIcon(step) {
            const iconMap = {
                DRAFT: 'pi pi-file',
                CART: 'pi pi-shopping-cart',
                PENDING: 'pi pi-clock',
                CONFIRMED: 'pi pi-check',
                PREPARING: 'pi pi-cog',
                PACKED: 'pi pi-box',
                PAYMENT_PENDING: 'pi pi-credit-card',
                PAID: 'pi pi-money-bill',
                SHIPPING: 'pi pi-truck',
                DELIVERED: 'pi pi-home',
                COMPLETED: 'pi pi-check-circle'
            };
            return iconMap[step] || 'pi pi-circle';
        }

        function getStepLabel(step) {
            const labelMap = {
                DRAFT: 'Tạo đơn',
                CART: 'Giỏ hàng',
                PENDING: 'Chờ xác nhận',
                CONFIRMED: 'Đã xác nhận',
                PREPARING: 'Chuẩn bị',
                PACKED: 'Đóng gói',
                PAYMENT_PENDING: 'Chờ thanh toán',
                PAID: 'Đã thanh toán',
                SHIPPING: 'Đang giao',
                DELIVERED: 'Đã giao',
                COMPLETED: 'Hoàn thành'
            };
            return labelMap[step] || step;
        }

        function canUpdateStatus(hoaDon) {
            const terminalStates = ['COMPLETED', 'CANCELLED', 'RETURNED'];
            return !terminalStates.includes(hoaDon.trangThaiHoaDon);
        }

        function canProcessNextStep(hoaDon) {
            const steps = getWorkflowSteps(hoaDon.loaiHoaDon);
            const currentIndex = steps.indexOf(hoaDon.trangThaiHoaDon);
            return currentIndex >= 0 && currentIndex < steps.length - 1;
        }

        function getNextStepAction(hoaDon) {
            const currentStep = hoaDon.trangThaiHoaDon;
            const actionMap = {
                DRAFT: 'Chờ thanh toán',
                CART: 'Đặt hàng',
                PENDING: 'Xác nhận',
                CONFIRMED: 'Chuẩn bị hàng',
                PREPARING: 'Đóng gói',
                PACKED: 'Giao hàng',
                PAYMENT_PENDING: 'Thanh toán',
                PAID: 'Hoàn thành',
                SHIPPING: 'Đã giao',
                DELIVERED: 'Hoàn thành'
            };
            return actionMap[currentStep] || 'Tiếp theo';
        }

        function canCancelInvoice(hoaDon) {
            const cancelableStates = ['DRAFT', 'CART', 'PENDING', 'CONFIRMED', 'PAYMENT_PENDING'];
            return cancelableStates.includes(hoaDon.trangThaiHoaDon);
        }

        function canEditPOSItems(hoaDon) {
            return hoaDon.loaiHoaDon === 'OFFLINE' && ['DRAFT', 'PAYMENT_PENDING'].includes(hoaDon.trangThaiHoaDon);
        }

        function canEditItems(hoaDon) {
            if (hoaDon.loaiHoaDon === 'OFFLINE') {
                return ['DRAFT', 'PAYMENT_PENDING'].includes(hoaDon.trangThaiHoaDon);
            } else {
                return ['CART', 'PENDING'].includes(hoaDon.trangThaiHoaDon);
            }
        }

        function getAvailableStatuses(hoaDon) {
            if (!hoaDon) return [];

            const steps = getWorkflowSteps(hoaDon.loaiHoaDon);
            const currentIndex = steps.indexOf(hoaDon.trangThaiHoaDon);

            const availableSteps = [];

            // Can move to next step
            if (currentIndex >= 0 && currentIndex < steps.length - 1) {
                const nextStep = steps[currentIndex + 1];
                availableSteps.push({
                    value: nextStep,
                    label: getStepLabel(nextStep)
                });
            }

            // Can cancel (except completed states)
            if (!['COMPLETED', 'CANCELLED'].includes(hoaDon.trangThaiHoaDon)) {
                availableSteps.push({
                    value: 'CANCELLED',
                    label: 'Hủy đơn'
                });
            }

            return availableSteps;
        }

        function needsNote(status) {
            return status === 'CANCELLED';
        }

        // Modal functions with body scroll lock
        async function viewChiTiet(hoaDon) {
            selectedHoaDon.value = hoaDon;
            showChiTietDialog.value = true;
            searchChiTietKeyword.value = '';

            // Lock body scroll
            document.body.classList.add('modal-open');

            await fetchChiTietHoaDon(hoaDon.id);
        }

        function closeChiTietDialog() {
            showChiTietDialog.value = false;
            selectedHoaDon.value = null;
            hoaDonChiTiets.value = [];
            searchChiTietKeyword.value = '';
            editingItemId.value = null;

            // Unlock body scroll
            document.body.classList.remove('modal-open');
        }

        function updateInvoiceStatus(hoaDon) {
            selectedInvoiceForUpdate.value = hoaDon;
            newStatus.value = '';
            statusNote.value = '';
            showStatusUpdateDialog.value = true;

            // Lock body scroll
            document.body.classList.add('modal-open');
        }

        function closeStatusUpdateDialog() {
            showStatusUpdateDialog.value = false;
            selectedInvoiceForUpdate.value = null;
            newStatus.value = '';
            statusNote.value = '';

            // Unlock body scroll
            document.body.classList.remove('modal-open');
        }

        function openCreateInvoiceDialog() {
            createInvoiceType.value = '';
            newInvoice.value = {
                khachHangId: '',
                quayBanId: '',
                diaChiGiaoHang: ''
            };
            showCreateInvoiceDialog.value = true;

            // Lock body scroll
            document.body.classList.add('modal-open');
        }

        function closeCreateInvoiceDialog() {
            showCreateInvoiceDialog.value = false;

            // Unlock body scroll
            document.body.classList.remove('modal-open');
        }

        async function confirmStatusUpdate() {
            if (!newStatus.value) {
                showToast('warning', 'Cảnh báo', 'Vui lòng chọn trạng thái mới');
                return;
            }

            try {
                // Call API to update status
                const endpoint = `${API_ENDPOINTS.hoaDon}/${selectedInvoiceForUpdate.value.id}/trang-thai`;
                await fetchWithErrorHandling(endpoint, {
                    method: 'PUT',
                    body: JSON.stringify({
                        trangThai: newStatus.value,
                        ghiChu: statusNote.value
                    })
                });

                // Update local data
                const index = hoaDons.value.findIndex((hd) => hd.id === selectedInvoiceForUpdate.value.id);
                if (index !== -1) {
                    hoaDons.value[index].trangThaiHoaDon = newStatus.value;
                }

                showToast('success', 'Thành công', 'Cập nhật trạng thái thành công');
                closeStatusUpdateDialog();
            } catch (error) {
                showToast('error', 'Lỗi', 'Không thể cập nhật trạng thái');
            }
        }

        async function processNextStep(hoaDon) {
            const steps = getWorkflowSteps(hoaDon.loaiHoaDon);
            const currentIndex = steps.indexOf(hoaDon.trangThaiHoaDon);
            const nextStep = steps[currentIndex + 1];

            if (!nextStep) return;

            try {
                let endpoint = '';

                // Choose appropriate endpoint based on step
                if (hoaDon.loaiHoaDon === 'OFFLINE') {
                    switch (nextStep) {
                        case 'PAYMENT_PENDING':
                            endpoint = `${API_ENDPOINTS.hoaDonPOS}/${hoaDon.id}/prepare-payment`;
                            break;
                        case 'PAID':
                            endpoint = `${API_ENDPOINTS.hoaDonPOS}/${hoaDon.id}/payment`;
                            break;
                        case 'COMPLETED':
                            endpoint = `${API_ENDPOINTS.hoaDon}/${hoaDon.id}/hoan-thanh`;
                            break;
                    }
                } else {
                    switch (nextStep) {
                        case 'PENDING':
                            endpoint = `${API_ENDPOINTS.hoaDonOnline}/${hoaDon.id}/checkout`;
                            break;
                        case 'CONFIRMED':
                            endpoint = `${API_ENDPOINTS.hoaDon}/${hoaDon.id}/xac-nhan`;
                            break;
                        case 'PREPARING':
                            endpoint = `${API_ENDPOINTS.hoaDon}/${hoaDon.id}/chuan-bi`;
                            break;
                        case 'PACKED':
                            endpoint = `${API_ENDPOINTS.hoaDonOnline}/${hoaDon.id}/pack`;
                            break;
                        case 'SHIPPING':
                            endpoint = `${API_ENDPOINTS.hoaDon}/${hoaDon.id}/giao-hang`;
                            break;
                        case 'DELIVERED':
                            endpoint = `${API_ENDPOINTS.hoaDonOnline}/${hoaDon.id}/deliver`;
                            break;
                        case 'COMPLETED':
                            endpoint = `${API_ENDPOINTS.hoaDon}/${hoaDon.id}/hoan-thanh`;
                            break;
                    }
                }

                if (endpoint) {
                    await fetchWithErrorHandling(endpoint, { method: 'PUT' });

                    // Update local data
                    const index = hoaDons.value.findIndex((hd) => hd.id === hoaDon.id);
                    if (index !== -1) {
                        hoaDons.value[index].trangThaiHoaDon = nextStep;
                    }

                    // Update selected invoice if dialog is open
                    if (selectedHoaDon.value && selectedHoaDon.value.id === hoaDon.id) {
                        selectedHoaDon.value.trangThaiHoaDon = nextStep;
                    }

                    showToast('success', 'Thành công', `Đã chuyển sang ${getStepLabel(nextStep)}`);
                }
            } catch (error) {
                showToast('error', 'Lỗi', 'Không thể cập nhật trạng thái');
            }
        }

        async function cancelInvoice(hoaDon) {
            if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;

            try {
                const endpoint = `${API_ENDPOINTS.hoaDon}/${hoaDon.id}/huy`;
                await fetchWithErrorHandling(endpoint, {
                    method: 'PUT',
                    body: JSON.stringify({ lyDo: 'Hủy bởi admin' })
                });

                // Update local data
                const index = hoaDons.value.findIndex((hd) => hd.id === hoaDon.id);
                if (index !== -1) {
                    hoaDons.value[index].trangThaiHoaDon = 'CANCELLED';
                }

                if (selectedHoaDon.value && selectedHoaDon.value.id === hoaDon.id) {
                    selectedHoaDon.value.trangThaiHoaDon = 'CANCELLED';
                }

                showToast('success', 'Thành công', 'Đã hủy đơn hàng');
            } catch (error) {
                showToast('error', 'Lỗi', 'Không thể hủy đơn hàng');
            }
        }

        function printInvoice(hoaDon) {
            showToast('info', 'In hóa đơn', 'Chức năng in hóa đơn đang được phát triển');
        }

        function trackingInfo(hoaDon) {
            showToast('info', 'Tracking', 'Chức năng tracking đang được phát triển');
        }

        function editPOSItems(hoaDon) {
            showToast('info', 'Chỉnh sửa', 'Chức năng chỉnh sửa sản phẩm đang được phát triển');
        }

        // Event handlers
        async function refreshAllData() {
            await fetchAllData();
        }

        async function retryConnection() {
            hasError.value = false;
            await fetchAllData();
        }

        async function createInvoice() {
            if (!createInvoiceType.value) {
                showToast('warning', 'Cảnh báo', 'Vui lòng chọn loại hóa đơn');
                return;
            }

            try {
                let endpoint = '';
                let requestBody = {
                    loaiHoaDon: createInvoiceType.value === 'POS' ? 'OFFLINE' : 'ONLINE',
                    khachHangId: newInvoice.value.khachHangId || null
                };

                if (createInvoiceType.value === 'POS') {
                    endpoint = `${API_ENDPOINTS.hoaDonPOS}/create`;
                    requestBody.quayBanId = newInvoice.value.quayBanId;
                } else {
                    endpoint = `${API_ENDPOINTS.hoaDonOnline}/cart/create`;
                    requestBody.diaChiGiaoHang = newInvoice.value.diaChiGiaoHang;
                }

                const newHoaDon = await fetchWithErrorHandling(endpoint, {
                    method: 'POST',
                    body: JSON.stringify(requestBody)
                });

                // Add to local data
                hoaDons.value.unshift(newHoaDon);

                showToast('success', 'Thành công', `Đã tạo hóa đơn ${newHoaDon.maHoaDon}`);
                closeCreateInvoiceDialog();
            } catch (error) {
                showToast('error', 'Lỗi', 'Không thể tạo hóa đơn');
            }
        }

        // Item editing functions
        function isEditingItem(itemId) {
            return editingItemId.value === itemId;
        }

        function editItem(item) {
            editingItemId.value = item.id;
            editQuantity.value = item.soLuong;
        }

        function cancelEdit() {
            editingItemId.value = null;
            editQuantity.value = 1;
        }

        async function saveQuantity(itemId) {
            try {
                const endpoint = `${API_ENDPOINTS.hoaDonChiTiet}/${itemId}/quantity`;
                await fetchWithErrorHandling(endpoint, {
                    method: 'PUT',
                    body: JSON.stringify({ soLuong: editQuantity.value })
                });

                // Update local data
                const index = hoaDonChiTiets.value.findIndex((item) => item.id === itemId);
                if (index !== -1) {
                    hoaDonChiTiets.value[index].soLuong = editQuantity.value;
                }

                showToast('success', 'Thành công', 'Cập nhật số lượng thành công');
                cancelEdit();
            } catch (error) {
                showToast('error', 'Lỗi', 'Không thể cập nhật số lượng');
            }
        }

        async function removeItem(itemId) {
            if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

            try {
                const endpoint = `${API_ENDPOINTS.hoaDonChiTiet}/remove-product/${itemId}`;
                await fetchWithErrorHandling(endpoint, { method: 'DELETE' });

                // Remove from local data
                const index = hoaDonChiTiets.value.findIndex((item) => item.id === itemId);
                if (index !== -1) {
                    hoaDonChiTiets.value.splice(index, 1);
                }

                showToast('success', 'Thành công', 'Đã xóa sản phẩm');
            } catch (error) {
                showToast('error', 'Lỗi', 'Không thể xóa sản phẩm');
            }
        }

        // Search and filter functions
        let searchTimeout;
        function onSearch() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentPage.value = 1;
            }, 300);
        }

        function applyFilters() {
            currentPage.value = 1;
        }

        function applyAdvancedFilters() {
            currentPage.value = 1;
            showToast('info', 'Bộ lọc', 'Đã áp dụng bộ lọc nâng cao');
        }

        function clearAllFilters() {
            searchKeyword.value = '';
            typeFilter.value = '';
            statusFilter.value = '';
            dateFilter.value = '';
            minAmount.value = '';
            maxAmount.value = '';
            staffFilter.value = '';
            paymentMethodFilter.value = '';
            currentPage.value = 1;
            showToast('info', 'Bộ lọc', 'Đã xóa tất cả bộ lọc');
        }

        // Sorting functions
        function sortBy(field) {
            if (sortField.value === field) {
                sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
            } else {
                sortField.value = field;
                sortOrder.value = 'asc';
            }
        }

        function getSortIcon(field) {
            if (sortField.value !== field) return 'pi pi-sort';
            return sortOrder.value === 'asc' ? 'pi pi-sort-up' : 'pi pi-sort-down';
        }

        // Pagination functions
        function previousPage() {
            if (currentPage.value > 1) {
                currentPage.value--;
            }
        }

        function nextPage() {
            if (currentPage.value < totalPages.value) {
                currentPage.value++;
            }
        }

        // Calculation functions
        function getTotalQuantity() {
            return filteredChiTiets.value.reduce((sum, item) => sum + item.soLuong, 0);
        }

        function getTotalAmount() {
            return filteredChiTiets.value.reduce((sum, item) => sum + item.giaBan * item.soLuong, 0);
        }

        // Export function
        function exportData() {
            try {
                const headers = ['ID', 'Mã hóa đơn', 'Loại', 'Ngày tạo', 'Tên khách hàng', 'Số điện thoại', 'Email', 'Tổng tiền', 'Trạng thái', 'Phương thức thanh toán'];

                const csvData = filteredHoaDons.value.map((hd) => [
                    hd.id,
                    hd.maHoaDon || '',
                    hd.loaiHoaDon === 'OFFLINE' ? 'POS' : 'Online',
                    formatDate(hd.ngayTao),
                    hd.tenKhachHang || 'Khách lẻ',
                    hd.sdt || '',
                    hd.email || '',
                    hd.tongTien || 0,
                    getStatusLabel(hd.trangThaiHoaDon),
                    hd.phuongThucThanhToan || ''
                ]);

                const csvContent = [
                    headers.join(','),
                    ...csvData.map((row) =>
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

                showToast('success', 'Xuất dữ liệu thành công', `Đã xuất ${filteredHoaDons.value.length} hóa đơn ra file ${filename}`);
            } catch (error) {
                console.error('Error exporting data:', error);
                showToast('error', 'Lỗi xuất dữ liệu', 'Có lỗi xảy ra khi xuất file');
            }
        }

        // Toast functions
        function showToast(severity, summary, detail) {
            toastSeverity.value = severity;
            toastSummary.value = summary;
            toastMessage.value = detail;

            setTimeout(() => {
                toastMessage.value = '';
            }, 5000);
        }

        function closeToast() {
            toastMessage.value = '';
        }

        function getToastClass() {
            const baseClass = 'border-l-4 ';
            switch (toastSeverity.value) {
                case 'success':
                    return baseClass + 'bg-green-500 border-green-600';
                case 'error':
                    return baseClass + 'bg-red-500 border-red-600';
                case 'warning':
                    return baseClass + 'bg-yellow-500 border-yellow-600';
                default:
                    return baseClass + 'bg-blue-500 border-blue-600';
            }
        }

        function getToastIcon() {
            switch (toastSeverity.value) {
                case 'success':
                    return 'pi pi-check-circle';
                case 'error':
                    return 'pi pi-times-circle';
                case 'warning':
                    return 'pi pi-exclamation-triangle';
                default:
                    return 'pi pi-info-circle';
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
            if (!status) return 'Không xác định';

            const statusMap = {
                DRAFT: 'Đang tạo',
                CART: 'Giỏ hàng',
                PENDING: 'Chờ xác nhận',
                CONFIRMED: 'Đã xác nhận',
                PREPARING: 'Chuẩn bị hàng',
                PACKED: 'Đã đóng gói',
                PAYMENT_PENDING: 'Chờ thanh toán',
                PAID: 'Đã thanh toán',
                SHIPPING: 'Đang giao',
                DELIVERED: 'Đã giao',
                COMPLETED: 'Hoàn thành',
                CANCELLED: 'Đã hủy',
                RETURNED: 'Hoàn trả'
            };

            return statusMap[status.toUpperCase()] || status;
        }

        function getStatusClass(status) {
            if (!status) return 'bg-gray-100 text-gray-800';

            const statusLower = status.toString().toLowerCase();

            if (statusLower.includes('pending') || statusLower.includes('chờ')) {
                return 'bg-yellow-100 text-yellow-800';
            } else if (statusLower.includes('confirmed') || statusLower.includes('xác nhận')) {
                return 'bg-blue-100 text-blue-800';
            } else if (statusLower.includes('preparing') || statusLower.includes('chuẩn bị')) {
                return 'bg-purple-100 text-purple-800';
            } else if (statusLower.includes('shipping') || statusLower.includes('giao')) {
                return 'bg-indigo-100 text-indigo-800';
            } else if (statusLower.includes('completed') || statusLower.includes('paid') || statusLower.includes('hoàn thành')) {
                return 'bg-green-100 text-green-800';
            } else if (statusLower.includes('cancelled') || statusLower.includes('hủy')) {
                return 'bg-red-100 text-red-800';
            } else if (statusLower.includes('draft') || statusLower.includes('cart')) {
                return 'bg-gray-100 text-gray-800';
            } else {
                return 'bg-gray-100 text-gray-800';
            }
        }

        function getStatusIcon(status) {
            if (!status) return 'pi pi-question-circle';

            const statusLower = status.toString().toLowerCase();

            if (statusLower.includes('pending') || statusLower.includes('chờ')) {
                return 'pi pi-clock';
            } else if (statusLower.includes('confirmed') || statusLower.includes('xác nhận')) {
                return 'pi pi-check-circle';
            } else if (statusLower.includes('preparing') || statusLower.includes('chuẩn bị')) {
                return 'pi pi-cog';
            } else if (statusLower.includes('shipping') || statusLower.includes('giao')) {
                return 'pi pi-truck';
            } else if (statusLower.includes('completed') || statusLower.includes('paid') || statusLower.includes('hoàn thành')) {
                return 'pi pi-verified';
            } else if (statusLower.includes('cancelled') || statusLower.includes('hủy')) {
                return 'pi pi-times-circle';
            } else if (statusLower.includes('draft') || statusLower.includes('cart')) {
                return 'pi pi-file';
            } else {
                return 'pi pi-circle';
            }
        }

        function getChiTietStatusClass(status) {
            if (!status) return 'bg-gray-100 text-gray-800';
            return 'bg-green-100 text-green-800';
        }

        function getChiTietStatusLabel(status) {
            if (!status) return 'Không xác định';
            return 'Hoạt động';
        }

        function getPaymentStatusClass(status) {
            if (!status) return 'bg-gray-100 text-gray-800';

            const statusLower = status.toString().toLowerCase();

            if (statusLower.includes('completed') || statusLower.includes('paid')) {
                return 'bg-green-100 text-green-800';
            } else if (statusLower.includes('pending')) {
                return 'bg-yellow-100 text-yellow-800';
            } else if (statusLower.includes('failed')) {
                return 'bg-red-100 text-red-800';
            } else {
                return 'bg-gray-100 text-gray-800';
            }
        }

        function getPaymentStatusLabel(status) {
            if (!status) return 'Chưa xác định';

            const statusMap = {
                PENDING: 'Chờ thanh toán',
                COMPLETED: 'Đã thanh toán',
                PAID: 'Đã thanh toán',
                FAILED: 'Thất bại'
            };

            return statusMap[status.toUpperCase()] || status;
        }

        // Watch for filter changes
        watch([statusFilter, typeFilter, dateFilter], () => {
            currentPage.value = 1;
        });

        // Initialize
        onMounted(() => {
            fetchAllData();
        });

        return {
            // Data
            hoaDons,
            isLoading,
            hasError,
            errorMessage,
            loadingMessage,
            searchKeyword,
            statusFilter,
            typeFilter,
            dateFilter,
            showAdvancedFilter,
            minAmount,
            maxAmount,
            staffFilter,
            paymentMethodFilter,
            activeTab,
            tabs,
            sortField,
            sortOrder,
            currentPage,
            itemsPerPage,
            showChiTietDialog,
            selectedHoaDon,
            hoaDonChiTiets,
            isLoadingChiTiet,
            searchChiTietKeyword,
            editingItemId,
            editQuantity,
            showStatusUpdateDialog,
            selectedInvoiceForUpdate,
            newStatus,
            statusNote,
            showCreateInvoiceDialog,
            createInvoiceType,
            newInvoice,
            customerList,
            counterList,
            staffList,
            toastMessage,
            toastSummary,
            toastSeverity,

            // Computed
            filteredHoaDons,
            paginatedHoaDons,
            totalPages,
            filteredChiTiets,
            posInvoices,
            onlineInvoices,
            totalRevenue,
            posRevenue,
            onlineRevenue,
            completedInvoices,
            pendingInvoices,
            urgentInvoices,
            completionRate,

            // Methods
            refreshAllData,
            retryConnection,
            viewChiTiet,
            closeChiTietDialog,
            updateInvoiceStatus,
            closeStatusUpdateDialog,
            confirmStatusUpdate,
            processNextStep,
            cancelInvoice,
            printInvoice,
            trackingInfo,
            editPOSItems,
            openCreateInvoiceDialog,
            closeCreateInvoiceDialog,
            createInvoice,
            isEditingItem,
            editItem,
            cancelEdit,
            saveQuantity,
            removeItem,
            onSearch,
            applyFilters,
            applyAdvancedFilters,
            clearAllFilters,
            sortBy,
            getSortIcon,
            previousPage,
            nextPage,
            getTotalQuantity,
            getTotalAmount,
            exportData,
            showToast,
            closeToast,
            getToastClass,
            getToastIcon,
            formatDate,
            formatCurrency,
            getInitials,
            getStatusLabel,
            getStatusClass,
            getStatusIcon,
            getChiTietStatusClass,
            getChiTietStatusLabel,
            getPaymentStatusClass,
            getPaymentStatusLabel,
            getWorkflowSteps,
            getStepClass,
            getDetailStepClass,
            isStepCompleted,
            getStepIcon,
            getStepLabel,
            canUpdateStatus,
            canProcessNextStep,
            getNextStepAction,
            canCancelInvoice,
            canEditPOSItems,
            canEditItems,
            getAvailableStatuses,
            needsNote
        };
    }
};
</script>

<style scoped>
.invoice-management {
    padding: 1rem;
    min-height: 100vh;
    background-color: #f8fafc;
}

.stat-card {
    transition:
        transform 0.2s ease-in-out,
        box-shadow 0.2s ease-in-out;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.invoice-type-badge {
    position: relative;
    overflow: hidden;
}

.invoice-type-badge::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: left 0.5s;
}

.invoice-type-badge:hover::before {
    left: 100%;
}

.workflow-step {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    transition: all 0.3s ease;
}

.workflow-step.active {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    transform: scale(1.1);
}

.workflow-step.completed {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
}

.workflow-step.pending {
    background: #e5e7eb;
    color: #6b7280;
}

.workflow-arrow {
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 10px solid #e5e7eb;
    margin: 0 0.25rem;
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

/* Modal and overlay fixes */
.modal-backdrop {
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
}

/* Ensure proper z-index stacking */
.z-\[9997\] {
    z-index: 9997;
}

.z-\[9998\] {
    z-index: 9998;
}

.z-\[9999\] {
    z-index: 9999;
}

.z-\[10000\] {
    z-index: 10000;
}

/* Prevent body scroll when modal is open */
body.modal-open {
    overflow: hidden;
    position: fixed;
    width: 100%;
    height: 100%;
}

/* Fix for overlapping elements */
.invoice-management {
    position: relative;
    z-index: 1;
}

/* Sidebar and navigation should be lower than modals */
.sidebar,
.navigation,
.header {
    z-index: 10 !important;
}

/* Dropdown and select menus */
.dropdown-menu {
    z-index: 1000;
}

/* Table and content areas */
.table-container {
    z-index: 1;
    position: relative;
}

/* Workflow steps container */
.workflow-container {
    z-index: 2;
    position: relative;
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

/* Utility classes */
.grid {
    display: grid;
}

.grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
}

.grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
}

.gap-2 {
    gap: 0.5rem;
}

.gap-3 {
    gap: 0.75rem;
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

    .lg\:grid-cols-4 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

.space-y-3 > * + * {
    margin-top: 0.75rem;
}

.space-y-4 > * + * {
    margin-top: 1rem;
}

.space-y-6 > * + * {
    margin-top: 1.5rem;
}

.min-w-64 {
    min-width: 16rem;
}

.max-w-40 {
    max-width: 10rem;
}

.transition-colors {
    transition:
        background-color 0.2s ease-in-out,
        color 0.2s ease-in-out;
}

.transition-all {
    transition: all 0.2s ease-in-out;
}
.sidebar,
.navigation,
.header {
    z-index: 10 !important;
}
</style>
