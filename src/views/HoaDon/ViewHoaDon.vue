<template>
    <div class="invoice-management">
        <!-- Toast Component -->
        <Toast />

        <!-- Header Section -->
        <div class="header-section bg-gradient-primary mb-4 rounded p-4 text-white">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 class="h3 fw-bold mb-2">Quản Lý Hóa Đơn</h2>
                    <p class="text-white-50 mb-0">Hệ thống quản lý hóa đơn POS & Online</p>
                </div>
                <div class="d-flex gap-2">
                    <button @click="refreshAllData" :disabled="isLoading" class="btn btn-outline-light btn-sm">
                        <i :class="isLoading ? 'pi pi-spinner pi-spin' : 'pi pi-refresh'" class="me-1"></i>
                        {{ isLoading ? 'Đang tải...' : 'Làm mới' }}
                    </button>
                    <button @click="exportData" class="btn btn-success btn-sm">
                        <i class="pi pi-download me-1"></i>
                        Xuất dữ liệu
                    </button>
                </div>
            </div>

            <!-- Tab Navigation -->
            <ul class="nav nav-pills">
                <li class="nav-item" v-for="tab in tabs" :key="tab.id">
                    <button @click="activeTab = tab.id" :class="['nav-link', { active: activeTab === tab.id }]" class="text-white">
                        <i :class="tab.icon" class="me-1"></i>
                        {{ tab.label }}
                        <span v-if="tab.count !== undefined" class="badge bg-light text-dark ms-1">
                            {{ tab.count }}
                        </span>
                    </button>
                </li>
            </ul>
        </div>

        <!-- Statistics Cards -->
        <div class="row g-3 mb-4">
            <!-- Tổng quan -->
            <div class="col-md-6 col-lg-3">
                <div class="card border-start border-3 bg-light border-primary">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1 text-primary">Tổng hóa đơn</h6>
                                <h3 class="mb-2 text-primary">{{ hoaDons.length }}</h3>
                                <div class="d-flex gap-2">
                                    <span class="badge bg-info">POS: {{ posInvoices.length }}</span>
                                    <span class="badge bg-success">Online: {{ onlineInvoices.length }}</span>
                                </div>
                            </div>
                            <i class="pi pi-file-text text-primary" style="font-size: 2rem"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Doanh thu -->
            <div class="col-md-6 col-lg-3">
                <div class="card border-start border-success border-3 bg-light">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-success mb-1">Tổng doanh thu</h6>
                                <h3 class="text-success mb-2">{{ formatCurrency(totalRevenue) }}</h3>
                                <div class="d-flex gap-2">
                                    <span class="badge bg-warning">POS: {{ formatCurrency(posRevenue) }}</span>
                                    <span class="badge bg-info">Online: {{ formatCurrency(onlineRevenue) }}</span>
                                </div>
                            </div>
                            <i class="pi pi-money-bill text-success" style="font-size: 2rem"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Hoàn thành -->
            <div class="col-md-6 col-lg-3">
                <div class="card border-start border-info border-3 bg-light">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-info mb-1">Hoàn thành</h6>
                                <h3 class="text-info mb-2">{{ completedInvoices }}</h3>
                                <span class="badge bg-secondary">Tỷ lệ: {{ completionRate }}%</span>
                            </div>
                            <i class="pi pi-check-circle text-info" style="font-size: 2rem"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cần xử lý -->
            <div class="col-md-6 col-lg-3">
                <div class="card border-start border-warning border-3 bg-light">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-warning mb-1">Cần xử lý</h6>
                                <h3 class="text-warning mb-2">{{ pendingInvoices }}</h3>
                                <span class="badge bg-danger">Khẩn cấp: {{ urgentInvoices }}</span>
                            </div>
                            <i class="pi pi-clock text-warning" style="font-size: 2rem"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Search and Filter -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <!-- Search -->
                    <div class="col-md-4">
                        <label class="form-label">Tìm kiếm</label>
                        <div class="input-group">
                            <span class="input-group-text">
                                <i class="pi pi-search"></i>
                            </span>
                            <input v-model="searchKeyword" @input="onSearch" class="form-control" placeholder="Tìm kiếm hóa đơn, khách hàng..." />
                        </div>
                    </div>

                    <!-- Type Filter -->
                    <div class="col-md-2">
                        <label class="form-label">Loại hóa đơn</label>
                        <select v-model="typeFilter" @change="applyFilters" class="form-select">
                            <option value="">Tất cả loại</option>
                            <option value="OFFLINE">POS (Tại quầy)</option>
                            <option value="ONLINE">Online</option>
                        </select>
                    </div>

                    <!-- Status Filter -->
                    <div class="col-md-2">
                        <label class="form-label">Trạng thái</label>
                        <select v-model="statusFilter" @change="applyFilters" class="form-select">
                            <option value="">Tất cả trạng thái</option>
                            <option value="DRAFT">Đang tạo</option>
                            <option value="PENDING">Chờ xác nhận</option>
                            <option value="CONFIRMED">Đã xác nhận</option>
                            <option value="COMPLETED">Hoàn thành</option>
                            <option value="CANCELLED">Đã hủy</option>
                        </select>
                    </div>

                    <!-- Date Filter -->
                    <div class="col-md-2">
                        <label class="form-label">Ngày tạo</label>
                        <Calendar v-model="dateFilter" @date-select="applyFilters" placeholder="Chọn ngày" dateFormat="dd/mm/yy" class="form-control" />
                    </div>

                    <!-- Advanced Filter Toggle -->
                    <div class="col-md-2">
                        <button @click="showAdvancedFilter = !showAdvancedFilter" class="btn btn-outline-secondary w-100">
                            <i class="pi pi-filter me-1"></i>
                            Lọc nâng cao
                        </button>
                    </div>
                </div>

                <!-- Advanced Filters -->
                <div v-if="showAdvancedFilter" class="border-top mt-3 pt-3">
                    <h6 class="mb-3">Bộ lọc nâng cao</h6>
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Khoảng tiền</label>
                            <div class="row g-2">
                                <div class="col">
                                    <InputNumber v-model="minAmount" placeholder="Từ" mode="currency" currency="VND" locale="vi-VN" class="form-control" />
                                </div>
                                <div class="col">
                                    <InputNumber v-model="maxAmount" placeholder="Đến" mode="currency" currency="VND" locale="vi-VN" class="form-control" />
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Nhân viên xử lý</label>
                            <select v-model="staffFilter" class="form-select">
                                <option value="">Tất cả nhân viên</option>
                                <option v-for="staff in staffList" :key="staff.id" :value="staff.id">
                                    {{ staff.name }}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Phương thức thanh toán</label>
                            <select v-model="paymentMethodFilter" class="form-select">
                                <option value="">Tất cả</option>
                                <option value="CASH">Tiền mặt</option>
                                <option value="CARD">Thẻ</option>
                                <option value="BANK_TRANSFER">Chuyển khoản</option>
                                <option value="E_WALLET">Ví điện tử</option>
                                <option value="COD">COD</option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-3">
                        <button @click="applyAdvancedFilters" class="btn btn-primary me-2">Áp dụng</button>
                        <button @click="clearAllFilters" class="btn btn-secondary">Xóa bộ lọc</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="py-5 text-center">
            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="8" />
            <p class="h5 text-muted mt-3">Đang tải dữ liệu từ API...</p>
            <p class="text-muted">{{ loadingMessage }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="hasError" class="py-5 text-center">
            <i class="pi pi-exclamation-triangle text-danger display-1 mb-3"></i>
            <h4 class="text-danger mb-2">Lỗi kết nối API</h4>
            <p class="text-muted mb-3">{{ errorMessage }}</p>
            <div class="d-flex justify-content-center gap-2">
                <button @click="retryConnection" class="btn btn-danger">
                    <i class="pi pi-refresh me-1"></i>
                    Thử lại
                </button>
                <button @click="goToLogin" class="btn btn-outline-primary" v-if="errorMessage.includes('xác thực')">
                    <i class="pi pi-sign-in me-1"></i>
                    Đăng nhập lại
                </button>
            </div>
        </div>

        <!-- Data Table -->
        <div v-else class="card">
            <div class="card-header">
                <h5 class="card-title mb-0">Danh sách hóa đơn</h5>
            </div>
            <div class="card-body p-0">
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
                    class="table-responsive"
                >
                    <Column field="id" header="ID" sortable style="min-width: 8rem">
                        <template #body="slotProps">
                            <span class="fw-bold text-primary">#{{ slotProps.data.id }}</span>
                        </template>
                    </Column>

                    <Column field="maHoaDon" header="Mã HĐ" sortable style="min-width: 10rem">
                        <template #body="slotProps">
                            <span class="badge bg-secondary">{{ slotProps.data.maHoaDon }}</span>
                        </template>
                    </Column>

                    <Column field="loaiHoaDon" header="Loại" style="min-width: 8rem">
                        <template #body="slotProps">
                            <span :class="['badge', slotProps.data.loaiHoaDon === 'OFFLINE' ? 'bg-warning' : 'bg-success']">
                                <i :class="slotProps.data.loaiHoaDon === 'OFFLINE' ? 'pi pi-desktop' : 'pi pi-globe'" class="me-1"></i>
                                {{ slotProps.data.loaiHoaDon === 'OFFLINE' ? 'POS' : 'Online' }}
                            </span>
                        </template>
                    </Column>

                    <Column field="ngayTao" header="Ngày tạo" sortable style="min-width: 12rem">
                        <template #body="slotProps">
                            <div class="d-flex align-items-center">
                                <i class="pi pi-calendar text-muted me-2"></i>
                                <small>{{ formatDate(slotProps.data.ngayTao) }}</small>
                            </div>
                        </template>
                    </Column>

                    <Column field="tenKhachHang" header="Khách hàng" style="min-width: 16rem">
                        <template #body="slotProps">
                            <div class="d-flex align-items-center">
                                <div class="avatar rounded-circle d-flex align-items-center justify-content-center me-2 bg-primary text-white" style="width: 32px; height: 32px; font-size: 12px">
                                    {{ getInitials(slotProps.data.tenKhachHang || 'KH') }}
                                </div>
                                <div>
                                    <div class="fw-semibold">{{ slotProps.data.tenKhachHang || 'Khách lẻ' }}</div>
                                    <small v-if="slotProps.data.sdt" class="text-muted"> <i class="pi pi-phone me-1"></i>{{ slotProps.data.sdt }} </small>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column field="tongTien" header="Tổng tiền" sortable style="min-width: 12rem">
                        <template #body="slotProps">
                            <div class="d-flex align-items-center">
                                <i class="pi pi-money-bill text-success me-2"></i>
                                <span class="fw-bold text-success">{{ formatCurrency(slotProps.data.tongTien) }}</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="trangThaiHoaDon" header="Trạng thái" style="min-width: 12rem">
                        <template #body="slotProps">
                            <span :class="['badge', 'bg-' + getStatusColor(slotProps.data.trangThaiHoaDon)]">
                                <i :class="getStatusIcon(slotProps.data.trangThaiHoaDon)" class="me-1"></i>
                                {{ getStatusLabel(slotProps.data.trangThaiHoaDon) }}
                            </span>
                        </template>
                    </Column>

                    <Column header="Workflow" style="min-width: 20rem">
                        <template #body="slotProps">
                            <div class="d-flex align-items-center">
                                <div v-for="(step, index) in getWorkflowSteps(slotProps.data.loaiHoaDon)" :key="step" class="d-flex align-items-center">
                                    <div :class="['workflow-step', 'rounded', 'px-2', 'py-1', getStepBootstrapClass(slotProps.data, step)]" :title="getStepLabel(step)">
                                        <i :class="getStepIcon(step)" style="font-size: 10px"></i>
                                    </div>
                                    <div v-if="index < getWorkflowSteps(slotProps.data.loaiHoaDon).length - 1" class="workflow-arrow mx-1"></div>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column header="Thao tác" style="min-width: 12rem">
                        <template #body="slotProps">
                            <div class="d-flex gap-1">
                                <button @click="viewChiTiet(slotProps.data)" class="btn btn-outline-primary btn-sm" title="Xem chi tiết">
                                    <i class="pi pi-eye"></i>
                                </button>
                                <button v-if="canUpdateStatus(slotProps.data)" @click="updateInvoiceStatus(slotProps.data)" class="btn btn-outline-success btn-sm" title="Cập nhật trạng thái">
                                    <i class="pi pi-arrow-right"></i>
                                </button>
                            </div>
                        </template>
                    </Column>
                </DataTable>

                <!-- Empty State -->
                <div v-if="filteredHoaDons.length === 0" class="py-5 text-center">
                    <i class="pi pi-file-o text-muted display-1 mb-3"></i>
                    <h5 class="text-muted mb-2">Không tìm thấy hóa đơn</h5>
                    <p class="text-muted">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                </div>
            </div>
        </div>

        <!-- Modal chi tiết hóa đơn -->
        <div class="modal fade" id="detailModal" tabindex="-1" ref="detailModal">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="pi pi-file-text me-2"></i>
                            Chi tiết hóa đơn {{ selectedHoaDon?.maHoaDon }}
                        </h5>
                        <button type="button" class="btn-close" @click="closeChiTietDialog"></button>
                    </div>
                    <div class="modal-body" v-if="selectedHoaDon">
                        <!-- Workflow Progress -->
                        <div class="card mb-3">
                            <div class="card-header">
                                <h6 class="card-title mb-0">Tiến trình xử lý</h6>
                            </div>
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div v-for="(step, index) in getWorkflowSteps(selectedHoaDon.loaiHoaDon)" :key="step" class="d-flex flex-fill align-items-center">
                                        <div class="d-flex flex-column align-items-center flex-fill">
                                            <div :class="['rounded-circle', 'd-flex', 'align-items-center', 'justify-content-center', 'border', 'border-2', getDetailStepBootstrapClass(selectedHoaDon, step)]" style="width: 40px; height: 40px">
                                                <i :class="getStepIcon(step)" style="font-size: 14px"></i>
                                            </div>
                                            <small class="mt-2 text-center">{{ getStepLabel(step) }}</small>
                                        </div>
                                        <div
                                            v-if="index < getWorkflowSteps(selectedHoaDon.loaiHoaDon).length - 1"
                                            :class="['flex-fill', 'border-top', 'border-2', 'mx-2', isStepCompleted(selectedHoaDon, step) ? 'border-success' : 'border-light']"
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Actions Bar -->
                        <div class="d-flex justify-content-end bg-light mb-3 gap-2 rounded p-3">
                            <button v-if="canProcessNextStep(selectedHoaDon)" @click="processNextStep(selectedHoaDon)" class="btn btn-success btn-sm">
                                <i class="pi pi-arrow-right me-1"></i>
                                {{ getNextStepAction(selectedHoaDon) }}
                            </button>
                            <button v-if="canCancelInvoice(selectedHoaDon)" @click="cancelInvoice(selectedHoaDon)" class="btn btn-danger btn-sm">
                                <i class="pi pi-times me-1"></i>
                                Hủy đơn
                            </button>
                            <button v-if="selectedHoaDon.loaiHoaDon === 'OFFLINE'" @click="printInvoice(selectedHoaDon)" class="btn btn-info btn-sm">
                                <i class="pi pi-print me-1"></i>
                                In hóa đơn
                            </button>
                            <button v-if="selectedHoaDon.loaiHoaDon === 'ONLINE'" @click="trackingInfo(selectedHoaDon)" class="btn btn-warning btn-sm">
                                <i class="pi pi-map-marker me-1"></i>
                                Tracking
                            </button>
                        </div>

                        <!-- Thông tin chi tiết -->
                        <div class="row g-3 mb-4">
                            <!-- Thông tin hóa đơn -->
                            <div class="col-lg-4">
                                <div class="card h-100">
                                    <div class="card-header">
                                        <h6 class="card-title mb-0">Thông tin hóa đơn</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-2">
                                            <div class="col-6"><strong>Mã HĐ:</strong></div>
                                            <div class="col-6">
                                                <span class="badge bg-secondary">{{ selectedHoaDon.maHoaDon }}</span>
                                            </div>
                                            <div class="col-6"><strong>Loại:</strong></div>
                                            <div class="col-6">
                                                <span :class="['badge', selectedHoaDon.loaiHoaDon === 'OFFLINE' ? 'bg-warning' : 'bg-success']">
                                                    {{ selectedHoaDon.loaiHoaDon === 'OFFLINE' ? 'POS' : 'Online' }}
                                                </span>
                                            </div>
                                            <div class="col-6"><strong>Ngày tạo:</strong></div>
                                            <div class="col-6">{{ formatDate(selectedHoaDon.ngayTao) }}</div>
                                            <div class="col-6"><strong>Tổng tiền:</strong></div>
                                            <div class="col-6">
                                                <span class="fw-bold text-success">{{ formatCurrency(selectedHoaDon.tongTien) }}</span>
                                            </div>
                                            <div class="col-6"><strong>Trạng thái:</strong></div>
                                            <div class="col-6">
                                                <span :class="['badge', 'bg-' + getStatusColor(selectedHoaDon.trangThaiHoaDon)]">
                                                    {{ getStatusLabel(selectedHoaDon.trangThaiHoaDon) }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Thông tin khách hàng -->
                            <div class="col-lg-4">
                                <div class="card h-100">
                                    <div class="card-header">
                                        <h6 class="card-title mb-0">Thông tin khách hàng</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-2">
                                            <div class="col-4"><strong>Tên:</strong></div>
                                            <div class="col-8">{{ selectedHoaDon.tenKhachHang || 'Khách lẻ' }}</div>
                                            <div v-if="selectedHoaDon.sdt" class="col-4"><strong>SĐT:</strong></div>
                                            <div v-if="selectedHoaDon.sdt" class="col-8">{{ selectedHoaDon.sdt }}</div>
                                            <div v-if="selectedHoaDon.email" class="col-4"><strong>Email:</strong></div>
                                            <div v-if="selectedHoaDon.email" class="col-8">{{ selectedHoaDon.email }}</div>
                                            <div v-if="selectedHoaDon.diaChi" class="col-4"><strong>Địa chỉ:</strong></div>
                                            <div v-if="selectedHoaDon.diaChi" class="col-8">{{ selectedHoaDon.diaChi }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Thông tin thanh toán -->
                            <div class="col-lg-4">
                                <div class="card h-100">
                                    <div class="card-header">
                                        <h6 class="card-title mb-0">Thanh toán</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-2">
                                            <div class="col-6"><strong>Phương thức:</strong></div>
                                            <div class="col-6">{{ selectedHoaDon.phuongThucThanhToan || 'Chưa xác định' }}</div>
                                            <div class="col-6"><strong>Tình trạng:</strong></div>
                                            <div class="col-6">
                                                <span :class="['badge', 'bg-' + getPaymentStatusColor(selectedHoaDon.tinhTrangThanhToan)]">
                                                    {{ getPaymentStatusLabel(selectedHoaDon.tinhTrangThanhToan) }}
                                                </span>
                                            </div>
                                            <div v-if="selectedHoaDon.loaiHoaDon === 'OFFLINE' && selectedHoaDon.tienThua" class="col-6"><strong>Tiền thừa:</strong></div>
                                            <div v-if="selectedHoaDon.loaiHoaDon === 'OFFLINE' && selectedHoaDon.tienThua" class="col-6">
                                                <span class="fw-bold text-danger">{{ formatCurrency(selectedHoaDon.tienThua) }}</span>
                                            </div>
                                            <div v-if="selectedHoaDon.maGiaoDich" class="col-6"><strong>Mã GD:</strong></div>
                                            <div v-if="selectedHoaDon.maGiaoDich" class="col-6">
                                                <code class="small">{{ selectedHoaDon.maGiaoDich }}</code>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Chi tiết sản phẩm -->
                        <div class="card">
                            <div class="card-header">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h6 class="card-title mb-0">
                                        <i class="pi pi-list me-2"></i>
                                        Chi tiết sản phẩm ({{ hoaDonChiTiets.length }} mặt hàng)
                                    </h6>
                                    <div class="d-flex gap-2">
                                        <div class="input-group input-group-sm" style="width: 200px">
                                            <span class="input-group-text">
                                                <i class="pi pi-search"></i>
                                            </span>
                                            <input v-model="searchChiTietKeyword" class="form-control" placeholder="Tìm kiếm sản phẩm..." />
                                        </div>
                                        <button v-if="selectedHoaDon.loaiHoaDon === 'OFFLINE' && canEditPOSItems(selectedHoaDon)" @click="editPOSItems(selectedHoaDon)" class="btn btn-outline-primary btn-sm">
                                            <i class="pi pi-pencil me-1"></i>
                                            Sửa
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="card-body">
                                <!-- Loading Chi Tiết -->
                                <div v-if="isLoadingChiTiet" class="py-4 text-center">
                                    <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="8" />
                                    <p class="text-muted mt-2">Đang tải chi tiết hóa đơn...</p>
                                </div>

                                <!-- Chi Tiết Table -->
                                <div v-else class="table-responsive">
                                    <table class="table-hover table">
                                        <thead class="table-light">
                                            <tr>
                                                <th>STT</th>
                                                <th>Tên sản phẩm</th>
                                                <th>Thuộc tính</th>
                                                <th>Giá bán</th>
                                                <th>Số lượng</th>
                                                <th>Thành tiền</th>
                                                <th>Trạng thái</th>
                                                <th v-if="canEditItems(selectedHoaDon)">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="(item, index) in filteredChiTiets" :key="item.id">
                                                <td>
                                                    <span class="badge bg-secondary">{{ index + 1 }}</span>
                                                </td>
                                                <td>
                                                    <div>
                                                        <div class="fw-medium">{{ item.tenSanPham || 'N/A' }}</div>
                                                        <small v-if="item.maSanPham" class="text-muted">Mã: {{ item.maSanPham }}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="d-flex gap-1">
                                                        <span v-if="item.mauSac" class="badge bg-info">{{ item.mauSac }}</span>
                                                        <span v-if="item.kichThuoc" class="badge bg-success">{{ item.kichThuoc }}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span class="fw-bold text-success">{{ formatCurrency(item.giaBan) }}</span>
                                                </td>
                                                <td>
                                                    <div v-if="isEditingItem(item.id)" class="d-flex align-items-center gap-1">
                                                        <InputNumber v-model="editQuantity" :min="1" class="form-control form-control-sm" style="width: 80px" />
                                                        <button @click="saveQuantity(item.id)" class="btn btn-success btn-sm">
                                                            <i class="pi pi-check"></i>
                                                        </button>
                                                        <button @click="cancelEdit()" class="btn btn-secondary btn-sm">
                                                            <i class="pi pi-times"></i>
                                                        </button>
                                                    </div>
                                                    <span v-else class="badge bg-primary">{{ item.soLuong }}</span>
                                                </td>
                                                <td>
                                                    <span class="fw-bold text-primary">{{ formatCurrency(item.giaBan * item.soLuong) }}</span>
                                                </td>
                                                <td>
                                                    <span class="badge bg-success">{{ getChiTietStatusLabel(item.trangThai) }}</span>
                                                </td>
                                                <td v-if="canEditItems(selectedHoaDon)">
                                                    <div class="d-flex gap-1">
                                                        <button v-if="!isEditingItem(item.id)" @click="editItem(item)" class="btn btn-outline-primary btn-sm" title="Sửa số lượng">
                                                            <i class="pi pi-pencil"></i>
                                                        </button>
                                                        <button @click="removeItem(item.id)" class="btn btn-outline-danger btn-sm" title="Xóa sản phẩm">
                                                            <i class="pi pi-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    <!-- Empty State for Chi Tiet -->
                                    <div v-if="filteredChiTiets.length === 0" class="py-4 text-center">
                                        <i class="pi pi-info-circle text-muted display-4 mb-3"></i>
                                        <h6 class="text-muted mb-2">Không có chi tiết nào</h6>
                                        <p class="text-muted">Hóa đơn này chưa có chi tiết sản phẩm.</p>
                                    </div>
                                </div>

                                <!-- Tổng kết -->
                                <div class="row g-3 border-top mt-3 pt-3">
                                    <div class="col-md-3 text-center">
                                        <div class="h4 mb-1 text-primary">{{ hoaDonChiTiets.length }}</div>
                                        <div class="text-muted">Số mặt hàng</div>
                                    </div>
                                    <div class="col-md-3 text-center">
                                        <div class="h4 text-info mb-1">{{ getTotalQuantity() }}</div>
                                        <div class="text-muted">Tổng số lượng</div>
                                    </div>
                                    <div class="col-md-3 text-center">
                                        <div class="h4 text-success mb-1">{{ formatCurrency(getTotalAmount()) }}</div>
                                        <div class="text-muted">Tổng tiền hàng</div>
                                    </div>
                                    <div class="col-md-3 text-center">
                                        <div class="h4 text-warning mb-1">{{ formatCurrency(selectedHoaDon.tongTien) }}</div>
                                        <div class="text-muted">Thành tiền</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="closeChiTietDialog" class="btn btn-secondary">
                            <i class="pi pi-times me-1"></i>
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal cập nhật trạng thái -->
        <div class="modal fade" id="statusModal" tabindex="-1" ref="statusModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Cập nhật trạng thái</h5>
                        <button type="button" class="btn-close" @click="closeStatusUpdateDialog"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Trạng thái hiện tại:</label>
                            <div>
                                <span :class="['badge', 'bg-' + getStatusColor(selectedInvoiceForUpdate?.trangThaiHoaDon)]">
                                    {{ getStatusLabel(selectedInvoiceForUpdate?.trangThaiHoaDon) }}
                                </span>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Trạng thái mới:</label>
                            <select v-model="newStatus" class="form-select">
                                <option value="">Chọn trạng thái mới</option>
                                <option v-for="status in getAvailableStatuses(selectedInvoiceForUpdate)" :key="status.value" :value="status.value">
                                    {{ status.label }}
                                </option>
                            </select>
                        </div>
                        <div v-if="needsNote(newStatus)" class="mb-3">
                            <label class="form-label">Ghi chú:</label>
                            <textarea v-model="statusNote" class="form-control" rows="3" placeholder="Nhập ghi chú..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="confirmStatusUpdate" class="btn btn-primary">Cập nhật</button>
                        <button @click="closeStatusUpdateDialog" class="btn btn-secondary">Hủy</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

// Debug để tìm token
console.log('🔍 === FIND TOKEN DEBUG ===');
console.log('All localStorage keys:', Object.keys(localStorage));
console.log('All localStorage values:');
Object.keys(localStorage).forEach((key) => {
    const value = localStorage.getItem(key);
    console.log(`  ${key}:`, value);

    // Kiểm tra xem có phải token không
    if (value && (value.includes('eyJ') || value.includes('Bearer'))) {
        console.log(`  ⭐ POTENTIAL TOKEN FOUND in ${key}:`, value.substring(0, 50) + '...');
    }
});

// Kiểm tra sessionStorage
console.log('All sessionStorage keys:', Object.keys(sessionStorage));
Object.keys(sessionStorage).forEach((key) => {
    const value = sessionStorage.getItem(key);
    console.log(`  sessionStorage.${key}:`, value);

    if (value && (value.includes('eyJ') || value.includes('Bearer'))) {
        console.log(`  ⭐ POTENTIAL TOKEN FOUND in sessionStorage.${key}:`, value.substring(0, 50) + '...');
    }
});
console.log('=== END FIND TOKEN DEBUG ===');

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

// Modal refs
const detailModal = ref(null);
const statusModal = ref(null);

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
const staffList = ref([
    { id: 1, name: 'Nhân viên A' },
    { id: 2, name: 'Nhân viên B' }
]);

// API URLs
const API_BASE_URL = 'http://localhost:8080';
const API_ENDPOINTS = {
    hoaDon: `${API_BASE_URL}/hoa-don`,
    hoaDonPOS: `${API_BASE_URL}/hoa-don/pos`,
    hoaDonOnline: `${API_BASE_URL}/hoa-don/online`,
    hoaDonChiTiet: `${API_BASE_URL}/hoa-don-chi-tiet`
};

// Authentication helper - Sử dụng auth_token đã tìm thấy
function getAuthHeaders() {
    console.log('🔍 Getting auth headers...');

    // Lấy token từ auth_token (đã tìm thấy)
    const token = localStorage.getItem('auth_token');

    console.log('🔑 Token status:', token ? '✅ Found in auth_token' : '❌ Not found');

    if (token) {
        return {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        };
    }

    console.warn('⚠️ No auth_token found');
    return {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    };
}

// API Functions
async function fetchWithErrorHandling(url, options = {}) {
    try {
        const authHeaders = getAuthHeaders();

        console.log('🌐 Making request to:', url);

        const response = await fetch(url, {
            headers: {
                ...authHeaders,
                ...options.headers
            },
            ...options
        });

        console.log('📨 Response status:', response.status);

        if (!response.ok) {
            if (response.status === 401) {
                console.error('🚫 401 Unauthorized');
                throw new Error('Authentication failed - Token không hợp lệ hoặc đã hết hạn');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`💥 API Error for ${url}:`, error);
        throw error;
    }
}

async function fetchAllData() {
    isLoading.value = true;
    hasError.value = false;
    loadingMessage.value = 'Đang kết nối đến server...';

    try {
        console.log('🚀 Starting fetchAllData...');

        // Kiểm tra token trước khi gọi API
        const headers = getAuthHeaders();

        if (!headers.Authorization) {
            console.error('❌ No authorization token available');

            // Thử tìm token từ user object
            const allKeys = Object.keys(localStorage);
            console.log('🔍 Trying to find token in user objects...');

            for (const key of allKeys) {
                try {
                    const value = localStorage.getItem(key);
                    if (value && value.startsWith('{')) {
                        const parsed = JSON.parse(value);
                        if (parsed.token || parsed.accessToken || parsed.authToken) {
                            const foundToken = parsed.token || parsed.accessToken || parsed.authToken;
                            localStorage.setItem('token', foundToken);
                            console.log(`✅ Token found and saved from ${key}`);

                            // Retry với token mới
                            const newHeaders = getAuthHeaders();
                            if (newHeaders.Authorization) {
                                // Tiếp tục với token mới
                                break;
                            }
                        }
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }

            // Kiểm tra lại sau khi thử tìm token
            const retryHeaders = getAuthHeaders();
            if (!retryHeaders.Authorization) {
                throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
            }
        }

        loadingMessage.value = 'Đang tải danh sách hóa đơn...';
        console.log(`📡 Calling API: ${API_ENDPOINTS.hoaDon}`);

        const data = await fetchWithErrorHandling(API_ENDPOINTS.hoaDon);

        // Kiểm tra cấu trúc response
        if (Array.isArray(data)) {
            hoaDons.value = data;
        } else if (data.content && Array.isArray(data.content)) {
            hoaDons.value = data.content;
        } else if (data.data && Array.isArray(data.data)) {
            hoaDons.value = data.data;
        } else {
            console.warn('⚠️ Unexpected response structure:', data);
            hoaDons.value = [];
        }

        console.log('✅ Data loaded successfully:', hoaDons.value.length, 'invoices');

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã tải ${hoaDons.value.length} hóa đơn`,
            life: 3000
        });
    } catch (error) {
        console.error('💥 Error in fetchAllData:', error);
        hasError.value = true;

        if (error.message.includes('Authentication failed') || error.message.includes('xác thực') || error.message.includes('401')) {
            errorMessage.value = 'Phiên đăng nhập đã hết hạn';

            toast.add({
                severity: 'error',
                summary: 'Lỗi xác thực',
                detail: 'Phiên đăng nhập đã hết hạn. Chuyển hướng đến trang đăng nhập...',
                life: 5000
            });

            setTimeout(() => {
                goToLogin();
            }, 2000);
            return;
        }

        errorMessage.value = `Không thể kết nối đến API: ${error.message}`;

        toast.add({
            severity: 'error',
            summary: 'Lỗi kết nối',
            detail: 'Không thể tải dữ liệu từ server. Hiển thị dữ liệu mẫu.',
            life: 3000
        });

        // Fallback to sample data
        hoaDons.value = createSampleData();
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
            phuongThucThanhToan: 'BANK_TRANSFER',
            tinhTrangThanhToan: 'COMPLETED'
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
            phuongThucThanhToan: 'COD',
            tinhTrangThanhToan: 'PENDING'
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
            phuongThucThanhToan: 'CASH',
            tinhTrangThanhToan: 'PAID'
        }
    ];
}

// Tất cả các computed properties và functions khác giữ nguyên như bản gốc...
// (Giữ nguyên tất cả code từ line 200 trở đi của file gốc)

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

// Utility functions
function goToLogin() {
    // Xóa tất cả token có thể
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('token');
    sessionStorage.clear();

    window.location.href = '/login';
}

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

function getStatusColor(status) {
    if (!status) return 'secondary';

    const statusLower = status.toString().toLowerCase();

    if (statusLower.includes('pending') || statusLower.includes('chờ')) {
        return 'warning';
    } else if (statusLower.includes('confirmed') || statusLower.includes('xác nhận')) {
        return 'info';
    } else if (statusLower.includes('preparing') || statusLower.includes('chuẩn bị')) {
        return 'primary';
    } else if (statusLower.includes('shipping') || statusLower.includes('giao')) {
        return 'dark';
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

// Workflow functions
function getWorkflowSteps(loaiHoaDon) {
    if (loaiHoaDon === 'OFFLINE') {
        return ['DRAFT', 'PAYMENT_PENDING', 'PAID', 'COMPLETED'];
    } else {
        return ['CART', 'PENDING', 'CONFIRMED', 'PREPARING', 'PACKED', 'SHIPPING', 'DELIVERED', 'COMPLETED'];
    }
}

function getStepBootstrapClass(hoaDon, step) {
    const currentStep = hoaDon.trangThaiHoaDon;
    const steps = getWorkflowSteps(hoaDon.loaiHoaDon);
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);

    if (stepIndex < currentIndex) {
        return 'bg-success text-white';
    } else if (stepIndex === currentIndex) {
        return 'bg-primary text-white';
    } else {
        return 'bg-light text-muted';
    }
}

function getDetailStepBootstrapClass(hoaDon, step) {
    const currentStep = hoaDon.trangThaiHoaDon;
    const steps = getWorkflowSteps(hoaDon.loaiHoaDon);
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);

    if (stepIndex < currentIndex) {
        return 'bg-success border-success text-white';
    } else if (stepIndex === currentIndex) {
        return 'bg-primary border-primary text-white';
    } else {
        return 'bg-white border-light text-muted';
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

function getPaymentStatusColor(status) {
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

function getChiTietStatusLabel(status) {
    if (!status) return 'Không xác định';
    return 'Hoạt động';
}

// Sorting functions
function onSort(event) {
    sortField.value = event.sortField;
    sortOrder.value = event.sortOrder === 1 ? 'asc' : 'desc';
}

// Modal functions
function showModal(modalRef) {
    if (modalRef.value) {
        const modalInstance = new bootstrap.Modal(modalRef.value);
        modalInstance.show();
    }
}

function hideModal(modalRef) {
    if (modalRef.value) {
        const modalInstance = bootstrap.Modal.getInstance(modalRef.value);
        if (modalInstance) {
            modalInstance.hide();
        }
    }
}

async function viewChiTiet(hoaDon) {
    selectedHoaDon.value = hoaDon;
    searchChiTietKeyword.value = '';
    showChiTietDialog.value = true;

    await nextTick();
    showModal(detailModal);

    // await fetchChiTietHoaDon(hoaDon.id);
    // Placeholder for now
    hoaDonChiTiets.value = createSampleChiTietData(hoaDon.id);
}

function closeChiTietDialog() {
    hideModal(detailModal);
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

    nextTick(() => {
        showModal(statusModal);
    });
}

function closeStatusUpdateDialog() {
    hideModal(statusModal);
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
        const endpoint = `${API_ENDPOINTS.hoaDon}/${selectedInvoiceForUpdate.value.id}/trang-thai`;
        await fetchWithErrorHandling(endpoint, {
            method: 'PUT',
            body: JSON.stringify({
                trangThai: newStatus.value,
                ghiChu: statusNote.value || `Cập nhật trạng thái sang ${getStatusLabel(newStatus.value)}`
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
        console.error('Error updating status:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể cập nhật trạng thái',
            life: 3000
        });
    }
}

// Calculation functions
function getTotalQuantity() {
    return filteredChiTiets.value.reduce((sum, item) => sum + item.soLuong, 0);
}

function getTotalAmount() {
    return filteredChiTiets.value.reduce((sum, item) => sum + item.giaBan * item.soLuong, 0);
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
        console.error('Error updating quantity:', error);
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
        console.error('Error removing item:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể xóa sản phẩm',
            life: 3000
        });
    }
}

// Sample data for chi tiet
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

// Event handlers
async function refreshAllData() {
    await fetchAllData();
}

async function retryConnection() {
    hasError.value = false;
    await fetchAllData();
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

// Watch for filter changes
watch([statusFilter, typeFilter, dateFilter], () => {
    currentPage.value = 1;
});

// Initialize
onMounted(() => {
    console.log('🎯 ViewHoaDon component mounted');
    fetchAllData();
});
</script>

<style scoped>
.invoice-management {
    padding: 1rem;
    min-height: 100vh;
    background-color: #f8f9fa;
}

.bg-gradient-primary {
    background: linear-gradient(135deg, #007bff, #6610f2);
}

.avatar {
    font-size: 0.75rem;
    font-weight: 600;
}

.workflow-step {
    font-size: 0.75rem;
    min-width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.workflow-arrow {
    width: 0;
    height: 0;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    border-left: 8px solid #dee2e6;
}

.nav-pills .nav-link {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    margin-right: 0.5rem;
    transition: all 0.3s ease;
}

.nav-pills .nav-link:hover {
    background: rgba(255, 255, 255, 0.2);
}

.nav-pills .nav-link.active {
    background: rgba(255, 255, 255, 0.9);
    color: #007bff !important;
    font-weight: 600;
}

.card {
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    transition: box-shadow 0.15s ease-in-out;
}

.card:hover {
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.table th {
    border-top: none;
    font-weight: 600;
    color: #495057;
    background-color: #f8f9fa;
}

.table td {
    vertical-align: middle;
}

.btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
}

.display-1 {
    font-size: 6rem;
}

.display-4 {
    font-size: 2.5rem;
}

@media (max-width: 768px) {
    .invoice-management {
        padding: 0.5rem;
    }

    .display-1 {
        font-size: 4rem;
    }

    .display-4 {
        font-size: 2rem;
    }
}
</style>
