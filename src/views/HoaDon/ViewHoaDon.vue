<template>
    <div class="invoice-management">
        <!-- Toast Component - Sửa theo mẫu PrimeVue -->
        <Toast />

        <!-- Header với Tab Navigation -->
        <div class="header-section mb-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
            <div class="mb-4 flex items-center justify-between">
                <div>
                    <h2 class="mb-2 text-2xl font-bold">Quản Lý Hóa Đơn Nâng Cao</h2>
                    <p class="text-blue-100">Hệ thống quản lý hóa đơn POS & Online tích hợp</p>
                </div>
                <div class="flex gap-3">
                    <Button
                        @click="refreshAllData"
                        :icon="isLoading ? 'pi pi-spinner pi-spin' : 'pi pi-refresh'"
                        :label="isLoading ? 'Đang tải...' : 'Làm mới'"
                        :disabled="isLoading"
                        class="bg-white bg-opacity-20 text-white hover:bg-opacity-30"
                        outlined
                    />
                    <Button @click="exportData" icon="pi pi-download" label="Xuất dữ liệu" severity="success" />
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
                    <Badge v-if="tab.count !== undefined" :value="tab.count" />
                </button>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <!-- Tổng quan -->
            <div class="stat-card rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-blue-600">Tổng hóa đơn</p>
                        <p class="text-2xl font-bold text-blue-800">{{ hoaDons.length }}</p>
                        <div class="mt-2 flex gap-2">
                            <Badge :value="`POS: ${posInvoices.length}`" severity="info" />
                            <Badge :value="`Online: ${onlineInvoices.length}`" severity="success" />
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
                            <Badge :value="`POS: ${formatCurrency(posRevenue)}`" severity="warning" />
                            <Badge :value="`Online: ${formatCurrency(onlineRevenue)}`" severity="info" />
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
                        <div class="mt-2">
                            <Badge :value="`Tỷ lệ: ${completionRate}%`" />
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
                        <div class="mt-2">
                            <Badge :value="`Khẩn cấp: ${urgentInvoices}`" severity="danger" />
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
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search"></i>
                        </InputIcon>
                        <InputText v-model="searchKeyword" placeholder="Tìm kiếm hóa đơn, khách hàng..." @input="onSearch" fluid />
                    </IconField>
                </div>

                <!-- Lọc theo loại hóa đơn -->
                <Select v-model="typeFilter" @change="applyFilters" :options="typeOptions" optionLabel="label" optionValue="value" placeholder="Tất cả loại" class="w-48" />

                <!-- Lọc theo trạng thái -->
                <Select v-model="statusFilter" @change="applyFilters" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Tất cả trạng thái" class="w-48" />

                <Calendar v-model="dateFilter" @date-select="applyFilters" placeholder="Chọn ngày" dateFormat="dd/mm/yy" />

                <!-- Advanced Filter Toggle -->
                <Button @click="showAdvancedFilter = !showAdvancedFilter" icon="pi pi-filter" label="Lọc nâng cao" severity="secondary" />
            </div>

            <!-- Advanced Filters -->
            <div v-if="showAdvancedFilter" class="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                <h4 class="mb-3 font-semibold">Bộ lọc nâng cao</h4>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label class="mb-1 block text-sm font-medium">Khoảng tiền</label>
                        <div class="flex gap-2">
                            <InputNumber v-model="minAmount" placeholder="Từ" mode="currency" currency="VND" locale="vi-VN" />
                            <InputNumber v-model="maxAmount" placeholder="Đến" mode="currency" currency="VND" locale="vi-VN" />
                        </div>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Nhân viên xử lý</label>
                        <Select v-model="staffFilter" :options="staffList" optionLabel="name" optionValue="id" placeholder="Tất cả nhân viên" fluid />
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Phương thức thanh toán</label>
                        <Select v-model="paymentMethodFilter" :options="paymentMethodOptions" optionLabel="label" optionValue="value" placeholder="Tất cả" fluid />
                    </div>
                </div>
                <div class="mt-4 flex gap-2">
                    <Button @click="applyAdvancedFilters" label="Áp dụng" />
                    <Button @click="clearAllFilters" label="Xóa bộ lọc" severity="secondary" />
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="py-12 text-center">
            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="8" />
            <p class="mt-4 text-lg text-gray-600">Đang tải dữ liệu từ API...</p>
            <p class="mt-2 text-sm text-gray-500">{{ loadingMessage }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="hasError" class="py-12 text-center">
            <i class="pi pi-exclamation-triangle mb-4 text-4xl text-red-500"></i>
            <h3 class="mb-2 text-xl font-semibold text-red-600">Lỗi kết nối API</h3>
            <p class="mb-4 text-gray-600">{{ errorMessage }}</p>
            <Button @click="retryConnection" icon="pi pi-refresh" label="Thử lại" severity="danger" />
        </div>

        <!-- Data Table -->
        <div v-else class="overflow-x-auto rounded-lg bg-white shadow-lg">
            <DataTable
                ref="dt"
                :value="paginatedHoaDons"
                dataKey="id"
                :paginator="true"
                :rows="itemsPerPage"
                :loading="isLoading"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} hóa đơn"
                tableStyle="min-width: 60rem"
                sortMode="single"
                @sort="onSort"
            >
                <template #header>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <h4 class="m-0">Danh sách hóa đơn</h4>
                    </div>
                </template>

                <Column field="id" header="ID" sortable style="min-width: 8rem">
                    <template #body="slotProps">
                        <span class="font-bold text-blue-600">#{{ slotProps.data.id }}</span>
                    </template>
                </Column>

                <Column field="maHoaDon" header="Mã HĐ" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <Badge :value="slotProps.data.maHoaDon" />
                    </template>
                </Column>

                <Column field="loaiHoaDon" header="Loại" style="min-width: 8rem">
                    <template #body="slotProps">
                        <Tag
                            :value="slotProps.data.loaiHoaDon === 'OFFLINE' ? 'POS' : 'Online'"
                            :severity="slotProps.data.loaiHoaDon === 'OFFLINE' ? 'warning' : 'success'"
                            :icon="slotProps.data.loaiHoaDon === 'OFFLINE' ? 'pi pi-desktop' : 'pi pi-globe'"
                        />
                    </template>
                </Column>

                <Column field="ngayTao" header="Ngày tạo" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <div class="flex items-center">
                            <i class="pi pi-calendar mr-2 text-gray-500"></i>
                            <span class="text-sm">{{ formatDate(slotProps.data.ngayTao) }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="tenKhachHang" header="Khách hàng" style="min-width: 16rem">
                    <template #body="slotProps">
                        <div class="flex items-center">
                            <Avatar :label="getInitials(slotProps.data.tenKhachHang || 'KH')" class="mr-3" style="background-color: #2196f3; color: #ffffff" shape="circle" />
                            <div>
                                <div class="font-semibold text-gray-900">{{ slotProps.data.tenKhachHang || 'Khách lẻ' }}</div>
                                <div class="text-sm text-gray-500" v-if="slotProps.data.sdt"><i class="pi pi-phone mr-1"></i>{{ slotProps.data.sdt }}</div>
                            </div>
                        </div>
                    </template>
                </Column>

                <Column field="tongTien" header="Tổng tiền" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <div class="flex items-center">
                            <i class="pi pi-money-bill mr-2 text-green-500"></i>
                            <span class="text-lg font-bold text-green-600">{{ formatCurrency(slotProps.data.tongTien) }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="trangThaiHoaDon" header="Trạng thái" style="min-width: 12rem">
                    <template #body="slotProps">
                        <Tag :value="getStatusLabel(slotProps.data.trangThaiHoaDon)" :severity="getStatusSeverity(slotProps.data.trangThaiHoaDon)" :icon="getStatusIcon(slotProps.data.trangThaiHoaDon)" />
                    </template>
                </Column>

                <Column header="Workflow" style="min-width: 20rem">
                    <template #body="slotProps">
                        <div class="flex items-center gap-1">
                            <div v-for="(step, index) in getWorkflowSteps(slotProps.data.loaiHoaDon)" :key="step" class="flex items-center">
                                <div :class="['workflow-step rounded px-2 py-1 text-xs', getStepClass(slotProps.data, step)]" :title="getStepLabel(step)">
                                    <i :class="getStepIcon(step)" class="text-xs"></i>
                                </div>
                                <div v-if="index < getWorkflowSteps(slotProps.data.loaiHoaDon).length - 1" class="workflow-arrow mx-1"></div>
                            </div>
                        </div>
                    </template>
                </Column>

                <Column :exportable="false" style="min-width: 12rem">
                    <template #body="slotProps">
                        <div class="flex gap-2">
                            <Button icon="pi pi-eye" @click="viewChiTiet(slotProps.data)" v-tooltip.top="'Xem chi tiết'" size="small" outlined />
                            <Button v-if="canUpdateStatus(slotProps.data)" icon="pi pi-arrow-right" @click="updateInvoiceStatus(slotProps.data)" v-tooltip.top="'Cập nhật trạng thái'" size="small" severity="success" />
                        </div>
                    </template>
                </Column>
            </DataTable>

            <!-- Empty State -->
            <div v-if="filteredHoaDons.length === 0" class="p-12 text-center">
                <i class="pi pi-file-o mb-4 text-6xl text-gray-400"></i>
                <h3 class="mb-2 text-xl font-semibold text-gray-600">Không tìm thấy hóa đơn</h3>
                <p class="text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
        </div>

        <!-- Dialog chi tiết hóa đơn - Sửa theo PrimeVue -->
        <Dialog v-model:visible="showChiTietDialog" :style="{ width: '90vw', maxWidth: '1200px' }" header="Chi tiết hóa đơn" :modal="true" class="p-fluid" maximizable>
            <template #header>
                <div class="flex items-center gap-2">
                    <i class="pi pi-file-text"></i>
                    <span>Chi tiết hóa đơn {{ selectedHoaDon?.maHoaDon }}</span>
                </div>
            </template>

            <div v-if="selectedHoaDon" class="space-y-6">
                <!-- Workflow Progress -->
                <Panel header="Tiến trình xử lý" toggleable>
                    <div class="flex items-center justify-between">
                        <div v-for="(step, index) in getWorkflowSteps(selectedHoaDon.loaiHoaDon)" :key="step" class="flex flex-1 items-center">
                            <div class="flex flex-1 flex-col items-center">
                                <div :class="['flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all', getDetailStepClass(selectedHoaDon, step)]">
                                    <i :class="getStepIcon(step)" class="text-sm"></i>
                                </div>
                                <span class="mt-2 text-center text-xs">{{ getStepLabel(step) }}</span>
                            </div>
                            <div v-if="index < getWorkflowSteps(selectedHoaDon.loaiHoaDon).length - 1" :class="['mx-2 h-1 flex-1 transition-all', isStepCompleted(selectedHoaDon, step) ? 'bg-green-400' : 'bg-gray-300']"></div>
                        </div>
                    </div>
                </Panel>

                <!-- Actions Bar -->
                <div class="flex justify-end gap-3 rounded-lg bg-gray-50 p-4">
                    <Button v-if="canProcessNextStep(selectedHoaDon)" @click="processNextStep(selectedHoaDon)" icon="pi pi-arrow-right" :label="getNextStepAction(selectedHoaDon)" severity="success" />
                    <Button v-if="canCancelInvoice(selectedHoaDon)" @click="cancelInvoice(selectedHoaDon)" icon="pi pi-times" label="Hủy đơn" severity="danger" />
                    <Button v-if="selectedHoaDon.loaiHoaDon === 'OFFLINE'" @click="printInvoice(selectedHoaDon)" icon="pi pi-print" label="In hóa đơn" />
                    <Button v-if="selectedHoaDon.loaiHoaDon === 'ONLINE'" @click="trackingInfo(selectedHoaDon)" icon="pi pi-map-marker" label="Tracking" severity="info" />
                </div>

                <!-- Thông tin chi tiết -->
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <!-- Thông tin hóa đơn -->
                    <Panel header="Thông tin hóa đơn" class="h-fit">
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="font-medium text-gray-600">Mã HĐ:</span>
                                <Badge :value="selectedHoaDon.maHoaDon" />
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="font-medium text-gray-600">Loại:</span>
                                <Tag :value="selectedHoaDon.loaiHoaDon === 'OFFLINE' ? 'POS' : 'Online'" :severity="selectedHoaDon.loaiHoaDon === 'OFFLINE' ? 'warning' : 'success'" />
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="font-medium text-gray-600">Ngày tạo:</span>
                                <span class="font-medium">{{ formatDate(selectedHoaDon.ngayTao) }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="font-medium text-gray-600">Tổng tiền:</span>
                                <span class="text-lg font-bold text-green-600">{{ formatCurrency(selectedHoaDon.tongTien) }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="font-medium text-gray-600">Trạng thái:</span>
                                <Tag :value="getStatusLabel(selectedHoaDon.trangThaiHoaDon)" :severity="getStatusSeverity(selectedHoaDon.trangThaiHoaDon)" />
                            </div>
                        </div>
                    </Panel>

                    <!-- Thông tin khách hàng -->
                    <Panel header="Thông tin khách hàng" class="h-fit">
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="font-medium text-gray-600">Tên:</span>
                                <span class="font-bold">{{ selectedHoaDon.tenKhachHang || 'Khách lẻ' }}</span>
                            </div>
                            <div v-if="selectedHoaDon.sdt" class="flex items-center justify-between">
                                <span class="font-medium text-gray-600">SĐT:</span>
                                <span class="font-medium">{{ selectedHoaDon.sdt }}</span>
                            </div>
                            <div v-if="selectedHoaDon.email" class="flex items-center justify-between">
                                <span class="font-medium text-gray-600">Email:</span>
                                <span class="font-medium">{{ selectedHoaDon.email }}</span>
                            </div>
                            <div v-if="selectedHoaDon.diaChi" class="flex items-start justify-between">
                                <span class="font-medium text-gray-600">Địa chỉ:</span>
                                <span class="max-w-40 text-right font-medium">{{ selectedHoaDon.diaChi }}</span>
                            </div>
                        </div>
                    </Panel>

                    <!-- Thông tin thanh toán -->
                    <Panel header="Thanh toán" class="h-fit">
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="font-medium text-gray-600">Phương thức:</span>
                                <span class="font-medium">{{ selectedHoaDon.phuongThucThanhToan || 'Chưa xác định' }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="font-medium text-gray-600">Tình trạng:</span>
                                <Tag :value="getPaymentStatusLabel(selectedHoaDon.tinhTrangThanhToan)" :severity="getPaymentStatusSeverity(selectedHoaDon.tinhTrangThanhToan)" />
                            </div>
                            <div v-if="selectedHoaDon.loaiHoaDon === 'OFFLINE' && selectedHoaDon.tienThua" class="flex items-center justify-between">
                                <span class="font-medium text-gray-600">Tiền thừa:</span>
                                <span class="font-bold text-red-600">{{ formatCurrency(selectedHoaDon.tienThua) }}</span>
                            </div>
                            <div v-if="selectedHoaDon.maGiaoDich" class="flex items-center justify-between">
                                <span class="font-medium text-gray-600">Mã GD:</span>
                                <span class="font-mono text-sm">{{ selectedHoaDon.maGiaoDich }}</span>
                            </div>
                        </div>
                    </Panel>
                </div>

                <!-- Chi tiết sản phẩm -->
                <Panel header="Chi tiết sản phẩm" toggleable>
                    <template #header>
                        <div class="mr-4 flex w-full items-center justify-between">
                            <span class="flex items-center gap-2">
                                <i class="pi pi-list"></i>
                                Chi tiết sản phẩm ({{ hoaDonChiTiets.length }} mặt hàng)
                            </span>
                            <div class="flex gap-3">
                                <IconField>
                                    <InputIcon>
                                        <i class="pi pi-search"></i>
                                    </InputIcon>
                                    <InputText v-model="searchChiTietKeyword" placeholder="Tìm kiếm sản phẩm..." size="small" />
                                </IconField>
                                <Button v-if="selectedHoaDon.loaiHoaDon === 'OFFLINE' && canEditPOSItems(selectedHoaDon)" @click="editPOSItems(selectedHoaDon)" icon="pi pi-pencil" label="Sửa" size="small" />
                            </div>
                        </div>
                    </template>

                    <!-- Loading Chi Tiết -->
                    <div v-if="isLoadingChiTiet" class="py-8 text-center">
                        <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="8" />
                        <p class="mt-4 text-gray-600">Đang tải chi tiết hóa đơn...</p>
                    </div>

                    <!-- Chi Tiết Table -->
                    <DataTable v-else :value="filteredChiTiets" tableStyle="min-width: 50rem" :paginator="true" :rows="10" responsiveLayout="scroll">
                        <Column field="id" header="STT" style="min-width: 6rem">
                            <template #body="slotProps">
                                <Badge :value="slotProps.index + 1" />
                            </template>
                        </Column>

                        <Column field="tenSanPham" header="Tên sản phẩm" style="min-width: 20rem">
                            <template #body="slotProps">
                                <div>
                                    <div class="font-medium text-gray-900">{{ slotProps.data.tenSanPham || 'N/A' }}</div>
                                    <div v-if="slotProps.data.maSanPham" class="text-sm text-gray-500">Mã: {{ slotProps.data.maSanPham }}</div>
                                </div>
                            </template>
                        </Column>

                        <Column header="Thuộc tính" style="min-width: 12rem">
                            <template #body="slotProps">
                                <div class="space-y-1">
                                    <Tag v-if="slotProps.data.mauSac" :value="slotProps.data.mauSac" severity="info" />
                                    <Tag v-if="slotProps.data.kichThuoc" :value="slotProps.data.kichThuoc" severity="success" class="ml-1" />
                                </div>
                            </template>
                        </Column>

                        <Column field="giaBan" header="Giá bán" sortable style="min-width: 10rem">
                            <template #body="slotProps">
                                <span class="font-bold text-green-600">{{ formatCurrency(slotProps.data.giaBan) }}</span>
                            </template>
                        </Column>

                        <Column field="soLuong" header="Số lượng" style="min-width: 8rem">
                            <template #body="slotProps">
                                <div v-if="isEditingItem(slotProps.data.id)" class="flex items-center gap-2">
                                    <InputNumber v-model="editQuantity" :min="1" class="w-16" />
                                    <Button @click="saveQuantity(slotProps.data.id)" icon="pi pi-check" size="small" severity="success" />
                                    <Button @click="cancelEdit()" icon="pi pi-times" size="small" severity="secondary" />
                                </div>
                                <Badge v-else :value="slotProps.data.soLuong" />
                            </template>
                        </Column>

                        <Column header="Thành tiền" style="min-width: 10rem">
                            <template #body="slotProps">
                                <span class="font-bold text-blue-600">{{ formatCurrency(slotProps.data.giaBan * slotProps.data.soLuong) }}</span>
                            </template>
                        </Column>

                        <Column field="trangThai" header="Trạng thái" style="min-width: 8rem">
                            <template #body="slotProps">
                                <Tag :value="getChiTietStatusLabel(slotProps.data.trangThai)" :severity="getChiTietStatusSeverity(slotProps.data.trangThai)" />
                            </template>
                        </Column>

                        <Column v-if="canEditItems(selectedHoaDon)" header="Thao tác" style="min-width: 8rem">
                            <template #body="slotProps">
                                <div class="flex gap-1">
                                    <Button v-if="!isEditingItem(slotProps.data.id)" @click="editItem(slotProps.data)" icon="pi pi-pencil" size="small" v-tooltip.top="'Sửa số lượng'" />
                                    <Button @click="removeItem(slotProps.data.id)" icon="pi pi-trash" size="small" severity="danger" v-tooltip.top="'Xóa sản phẩm'" />
                                </div>
                            </template>
                        </Column>

                        <template #empty>
                            <div class="p-8 text-center">
                                <i class="pi pi-info-circle mb-4 text-4xl text-gray-400"></i>
                                <h4 class="mb-2 font-semibold text-gray-600">Không có chi tiết nào</h4>
                                <p class="text-gray-500">Hóa đơn này chưa có chi tiết sản phẩm.</p>
                            </div>
                        </template>
                    </DataTable>
                </Panel>

                <!-- Tổng kết -->
                <Panel header="Tổng kết">
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
                </Panel>
            </div>

            <template #footer>
                <Button @click="closeChiTietDialog" icon="pi pi-times" label="Đóng" severity="secondary" />
            </template>
        </Dialog>

        <!-- Status Update Dialog -->
        <Dialog v-model:visible="showStatusUpdateDialog" :style="{ width: '450px' }" header="Cập nhật trạng thái" :modal="true">
            <div class="space-y-4">
                <div>
                    <label class="mb-2 block text-sm font-medium">Trạng thái hiện tại:</label>
                    <Tag :value="getStatusLabel(selectedInvoiceForUpdate?.trangThaiHoaDon)" :severity="getStatusSeverity(selectedInvoiceForUpdate?.trangThaiHoaDon)" />
                </div>
                <div>
                    <label class="mb-2 block text-sm font-medium">Trạng thái mới:</label>
                    <Select v-model="newStatus" :options="getAvailableStatuses(selectedInvoiceForUpdate)" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái mới" fluid />
                </div>
                <div v-if="needsNote(newStatus)">
                    <label class="mb-2 block text-sm font-medium">Ghi chú:</label>
                    <Textarea v-model="statusNote" rows="3" placeholder="Nhập ghi chú..." fluid />
                </div>
            </div>

            <template #footer>
                <Button @click="confirmStatusUpdate" label="Cập nhật" />
                <Button @click="closeStatusUpdateDialog" label="Hủy" severity="secondary" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

// Reactive data
const toast = useToast();
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
const minAmount = ref(null);
const maxAmount = ref(null);
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

// Options for dropdowns
const typeOptions = ref([
    { label: 'Tất cả loại', value: '' },
    { label: 'POS (Tại quầy)', value: 'OFFLINE' },
    { label: 'Online', value: 'ONLINE' }
]);

const statusOptions = ref([
    { label: 'Tất cả trạng thái', value: '' },
    // POS Status
    { label: 'Đang tạo', value: 'DRAFT' },
    { label: 'Chờ thanh toán', value: 'PAYMENT_PENDING' },
    { label: 'Đã thanh toán', value: 'PAID' },
    { label: 'Hoàn thành', value: 'COMPLETED' },
    // Online Status
    { label: 'Giỏ hàng', value: 'CART' },
    { label: 'Chờ xác nhận', value: 'PENDING' },
    { label: 'Đã xác nhận', value: 'CONFIRMED' },
    { label: 'Chuẩn bị hàng', value: 'PREPARING' },
    { label: 'Đã đóng gói', value: 'PACKED' },
    { label: 'Đang giao', value: 'SHIPPING' },
    { label: 'Đã giao', value: 'DELIVERED' },
    // Common
    { label: 'Đã hủy', value: 'CANCELLED' },
    { label: 'Hoàn trả', value: 'RETURNED' }
]);

const paymentMethodOptions = ref([
    { label: 'Tất cả', value: '' },
    { label: 'Tiền mặt', value: 'CASH' },
    { label: 'Thẻ', value: 'CARD' },
    { label: 'Chuyển khoản', value: 'BANK_TRANSFER' },
    { label: 'Ví điện tử', value: 'E_WALLET' },
    { label: 'COD', value: 'COD' }
]);

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

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã tải ${data.length} hóa đơn`,
            life: 3000
        });
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
        hasError.value = true;
        errorMessage.value = `Không thể kết nối đến API: ${error.message}`;
        toast.add({
            severity: 'error',
            summary: 'Lỗi kết nối',
            detail: 'Không thể tải dữ liệu từ server',
            life: 3000
        });

        // Fallback to sample data
        hoaDons.value = createSampleData();
        toast.add({
            severity: 'info',
            summary: 'Dữ liệu mẫu',
            detail: 'Hiển thị dữ liệu mẫu để demo',
            life: 3000
        });
    } finally {
        isLoading.value = false;
        loadingMessage.value = '';
    }
}

// Sample data functions
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
            toast.add({
                severity: 'info',
                summary: 'Thông báo',
                detail: 'Hóa đơn này không có chi tiết sản phẩm',
                life: 3000
            });
        }
    } catch (error) {
        console.error('Error fetching chi tiet:', error);
        hoaDonChiTiets.value = createSampleChiTietData(hoaDonId);
        toast.add({
            severity: 'warn',
            summary: 'Dữ liệu mẫu',
            detail: 'Không thể tải chi tiết, hiển thị dữ liệu mẫu',
            life: 3000
        });
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

// Status functions
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

// Modal functions
async function viewChiTiet(hoaDon) {
    selectedHoaDon.value = hoaDon;
    showChiTietDialog.value = true;
    searchChiTietKeyword.value = '';

    await fetchChiTietHoaDon(hoaDon.id);
}

function closeChiTietDialog() {
    showChiTietDialog.value = false;
    selectedHoaDon.value = null;
    hoaDonChiTiets.value = [];
    searchChiTietKeyword.value = '';
    editingItemId.value = null;
}

function updateInvoiceStatus(hoaDon) {
    selectedInvoiceForUpdate.value = hoaDon;
    newStatus.value = '';
    statusNote.value = '';
    showStatusUpdateDialog.value = true;
}

function closeStatusUpdateDialog() {
    showStatusUpdateDialog.value = false;
    selectedInvoiceForUpdate.value = null;
    newStatus.value = '';
    statusNote.value = '';
}

async function confirmStatusUpdate() {
    if (!newStatus.value) {
        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Vui lòng chọn trạng thái mới',
            life: 3000
        });
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

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật trạng thái thành công',
            life: 3000
        });
        closeStatusUpdateDialog();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể cập nhật trạng thái',
            life: 3000
        });
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

            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã chuyển sang ${getStepLabel(nextStep)}`,
                life: 3000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể cập nhật trạng thái',
            life: 3000
        });
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

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đã hủy đơn hàng',
            life: 3000
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể hủy đơn hàng',
            life: 3000
        });
    }
}

function printInvoice(hoaDon) {
    toast.add({
        severity: 'info',
        summary: 'In hóa đơn',
        detail: 'Chức năng in hóa đơn đang được phát triển',
        life: 3000
    });
}

function trackingInfo(hoaDon) {
    toast.add({
        severity: 'info',
        summary: 'Tracking',
        detail: 'Chức năng tracking đang được phát triển',
        life: 3000
    });
}

function editPOSItems(hoaDon) {
    toast.add({
        severity: 'info',
        summary: 'Chỉnh sửa',
        detail: 'Chức năng chỉnh sửa sản phẩm đang được phát triển',
        life: 3000
    });
}

// Event handlers
async function refreshAllData() {
    await fetchAllData();
}

async function retryConnection() {
    hasError.value = false;
    await fetchAllData();
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

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật số lượng thành công',
            life: 3000
        });
        cancelEdit();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể cập nhật số lượng',
            life: 3000
        });
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

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đã xóa sản phẩm',
            life: 3000
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể xóa sản phẩm',
            life: 3000
        });
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
    toast.add({
        severity: 'info',
        summary: 'Bộ lọc',
        detail: 'Đã áp dụng bộ lọc nâng cao',
        life: 3000
    });
}

function clearAllFilters() {
    searchKeyword.value = '';
    typeFilter.value = '';
    statusFilter.value = '';
    dateFilter.value = '';
    minAmount.value = null;
    maxAmount.value = null;
    staffFilter.value = '';
    paymentMethodFilter.value = '';
    currentPage.value = 1;
    toast.add({
        severity: 'info',
        summary: 'Bộ lọc',
        detail: 'Đã xóa tất cả bộ lọc',
        life: 3000
    });
}

// Sorting functions
function onSort(event) {
    sortField.value = event.sortField;
    sortOrder.value = event.sortOrder === 1 ? 'asc' : 'desc';
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

        toast.add({
            severity: 'success',
            summary: 'Xuất dữ liệu thành công',
            detail: `Đã xuất ${filteredHoaDons.value.length} hóa đơn ra file ${filename}`,
            life: 3000
        });
    } catch (error) {
        console.error('Error exporting data:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi xuất dữ liệu',
            detail: 'Có lỗi xảy ra khi xuất file',
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

function getStatusSeverity(status) {
    if (!status) return 'secondary';

    const statusLower = status.toString().toLowerCase();

    if (statusLower.includes('pending') || statusLower.includes('chờ')) {
        return 'warning';
    } else if (statusLower.includes('confirmed') || statusLower.includes('xác nhận')) {
        return 'info';
    } else if (statusLower.includes('preparing') || statusLower.includes('chuẩn bị')) {
        return 'help';
    } else if (statusLower.includes('shipping') || statusLower.includes('giao')) {
        return 'contrast';
    } else if (statusLower.includes('completed') || statusLower.includes('paid') || statusLower.includes('hoàn thành')) {
        return 'success';
    } else if (statusLower.includes('cancelled') || statusLower.includes('hủy')) {
        return 'danger';
    } else if (statusLower.includes('draft') || statusLower.includes('cart')) {
        return 'secondary';
    } else {
        return 'secondary';
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

function getChiTietStatusSeverity(status) {
    if (!status) return 'secondary';
    return 'success';
}

function getChiTietStatusLabel(status) {
    if (!status) return 'Không xác định';
    return 'Hoạt động';
}

function getPaymentStatusSeverity(status) {
    if (!status) return 'secondary';

    const statusLower = status.toString().toLowerCase();

    if (statusLower.includes('completed') || statusLower.includes('paid')) {
        return 'success';
    } else if (statusLower.includes('pending')) {
        return 'warning';
    } else if (statusLower.includes('failed')) {
        return 'danger';
    } else {
        return 'secondary';
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

.space-y-3 > * + * {
    margin-top: 0.75rem;
}

.space-y-4 > * + * {
    margin-top: 1rem;
}

.space-y-6 > * + * {
    margin-top: 1.5rem;
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

.min-w-64 {
    min-width: 16rem;
}
.max-w-40 {
    max-width: 10rem;
}
.w-48 {
    width: 12rem;
}
.w-16 {
    width: 4rem;
}
</style>
