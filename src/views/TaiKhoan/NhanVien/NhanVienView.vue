<template>
    <div class="card">
        <!-- Header Actions -->
        <div class="card-header">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="text-2xl font-bold text-gray-900">Quản Lý Nhân Viên</h3>
                    <p class="text-gray-600 mt-1">
                        Quản lý thông tin nhân viên và địa chỉ
                        <span v-if="!isAdmin" class="ml-2 text-orange-600 font-medium">
                            <i class="pi pi-info-circle mr-1"></i>
                            Chỉ ADMIN mới có thể chỉnh sửa/xóa nhân viên
                        </span>
                    </p>
                </div>
                <div class="flex gap-2">
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

        <!-- Enhanced Search Section -->
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
                            placeholder="Tìm kiếm tất cả thông tin nhân viên (tên, email, SĐT, mã NV, địa chỉ, tài khoản)..."
                            @input="onGlobalSearchInput"
                            class="w-full text-lg py-3"
                        />
                    </IconField>
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

            <!-- Advanced Filters -->
            <div class="flex flex-wrap gap-2 items-center mb-4">
                <Select
                    v-model="advancedFilters.trangThai"
                    :options="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Trạng thái"
                    @change="onStatusFilterChange"
                    showClear
                />
                <Calendar
                    v-model="advancedFilters.startDate"
                    placeholder="Từ ngày"
                    dateFormat="dd/mm/yy"
                    @date-select="onDateFilterChange"
                    showIcon
                    showClear
                />
                <Calendar
                    v-model="advancedFilters.endDate"
                    placeholder="Đến ngày"
                    dateFormat="dd/mm/yy"
                    @date-select="onDateFilterChange"
                    showIcon
                    showClear
                />
                <Button
                    label="Xóa bộ lọc"
                    icon="pi pi-filter-slash"
                    outlined
                    @click="resetAllFilters"
                />
                
                <div class="ml-auto flex gap-2">
                    <Badge 
                        v-if="selectedEmployees.length > 0" 
                        :value="`${selectedEmployees.length} đã chọn`" 
                        severity="info" 
                    />
                    <Button
                        v-if="isAdmin"
                        label="Cho nghỉ việc"
                        icon="pi pi-user-minus"
                        severity="danger"
                        @click="confirmDeleteSelected"
                        :disabled="!selectedEmployees || !selectedEmployees.length"
                        title="Cho nhân viên đã chọn nghỉ việc (Chỉ ADMIN)"
                    />
                    <div v-else-if="selectedEmployees.length > 0" class="text-sm text-orange-600 px-3 py-2 bg-orange-50 rounded border border-orange-200">
                        <i class="pi pi-lock mr-1"></i>
                        Chỉ ADMIN mới có thể xóa nhân viên
                    </div>
                </div>
            </div>

            <!-- Quick Stats -->
            <div v-if="employeeStats" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="bg-blue-50 p-3 rounded border border-blue-200">
                    <div class="text-blue-800 font-semibold">Tổng số</div>
                    <div class="text-2xl font-bold text-blue-600">{{ employeeStats.total || 0 }}</div>
                </div>
                <div class="bg-green-50 p-3 rounded border border-green-200">
                    <div class="text-green-800 font-semibold">Đang làm việc</div>
                    <div class="text-2xl font-bold text-green-600">{{ employeeStats.active || 0 }}</div>
                </div>
                <div class="bg-red-50 p-3 rounded border border-red-200">
                    <div class="text-red-800 font-semibold">Nghỉ việc</div>
                    <div class="text-2xl font-bold text-red-600">{{ employeeStats.inactive || 0 }}</div>
                </div>
                <div class="bg-purple-50 p-3 rounded border border-purple-200">
                    <div class="text-purple-800 font-semibold">Mới (30 ngày)</div>
                    <div class="text-2xl font-bold text-purple-600">{{ employeeStats.recent || 0 }}</div>
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
                    <Tag 
                        :value="slotProps.data.maNhanVien || 'Chưa có'" 
                        :severity="slotProps.data.maNhanVien ? 'success' : 'warning'" 
                    />
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
                            <span class="text-sm text-gray-500">
                                <i class="pi pi-envelope mr-1"></i>{{ slotProps.data.email }}
                            </span>
                            <span class="text-sm text-gray-500" v-if="slotProps.data.sdt">
                                <i class="pi pi-phone mr-1"></i>{{ slotProps.data.sdt }}
                            </span>
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Địa chỉ từ API -->
            <Column header="Địa chỉ" style="min-width: 20rem">
                <template #body="slotProps">
                    <div class="address-display">
                        <div v-if="slotProps.data.danhSachDiaChi && slotProps.data.danhSachDiaChi.length > 0" 
                             class="flex items-center gap-2">
                            <Button 
                                icon="pi pi-map-marker" 
                                outlined 
                                severity="info" 
                                size="small" 
                                @click="viewAddress(slotProps.data)" 
                                title="Xem chi tiết địa chỉ" 
                            />
                            <div class="flex flex-col">
                                <span class="text-sm">{{ getDefaultAddress(slotProps.data) }}</span>
                                <span class="text-green-600 text-xs font-semibold">
                                    <i class="pi pi-map mr-1"></i>
                                    {{ slotProps.data.danhSachDiaChi.length }} địa chỉ
                                </span>
                            </div>
                        </div>
                        <div v-else class="text-muted text-sm">
                            <i class="pi pi-map-marker mr-1"></i>
                            <span class="text-orange-600">Chưa có địa chỉ</span>
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Tài khoản liên kết -->
            <Column header="Tài khoản" style="min-width: 12rem">
                <template #body="slotProps">
                    <div class="flex flex-col gap-1">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-user text-blue-500"></i>
                            <span class="text-sm">
                                ID: {{ slotProps.data.idTaiKhoan || 'Chưa liên kết' }}
                            </span>
                        </div>
                        <div v-if="slotProps.data.idTaiKhoan" class="flex items-center gap-2">
                            <i class="pi pi-link text-green-500"></i>
                            <span class="text-xs text-green-600 font-semibold">Đã liên kết</span>
                        </div>
                        <div v-else class="flex items-center gap-2">
                            <i class="pi pi-exclamation-triangle text-orange-500"></i>
                            <span class="text-xs text-orange-600">Chưa liên kết</span>
                        </div>
                    </div>
                </template>
            </Column>

            <Column field="trangThai" header="Trạng thái" sortable style="width: 12rem">
                <template #body="slotProps">
                    <Tag
                        :value="getStatusLabel(slotProps.data.trangThai)"
                        :severity="getStatusSeverity(slotProps.data.trangThai)"
                        class="font-semibold"
                    >
                        <i :class="getStatusIcon(slotProps.data.trangThai)" class="mr-1"></i>
                        {{ getStatusLabel(slotProps.data.trangThai) }}
                    </Tag>
                </template>
            </Column>

            <Column field="ngayTao" header="Ngày tạo" sortable style="width: 10rem">
                <template #body="slotProps">
                    <div class="flex flex-col">
                        <span class="text-sm font-medium">{{ formatDate(slotProps.data.ngayTao) }}</span>
                        <span class="text-xs text-gray-500">{{ formatTime(slotProps.data.ngayTao) }}</span>
                    </div>
                </template>
            </Column>

            <Column :exportable="false" style="width: 16rem">
                <template #body="slotProps">
                    <div class="flex gap-1">
                        <!-- Xem chi tiết -->
                        <Button
                            icon="pi pi-eye"
                            size="small"
                            outlined
                            @click="viewEmployee(slotProps.data)"
                            title="Xem chi tiết"
                        />
                        
                        <!-- Chỉnh sửa - chỉ ADMIN -->
                        <Button
                            v-if="isAdmin"
                            icon="pi pi-pencil"
                            size="small"
                            outlined
                            severity="success"
                            @click="editEmployee(slotProps.data)"
                            title="Chỉnh sửa thông tin (ADMIN only)"
                        />
                        <Button
                            v-else
                            icon="pi pi-lock"
                            size="small"
                            outlined
                            severity="secondary"
                            disabled
                            title="Chỉ ADMIN mới có thể chỉnh sửa"
                        />
                        
                        <!-- Thay đổi trạng thái - chỉ ADMIN -->
                        <Button
                            v-if="isAdmin"
                            :icon="slotProps.data.trangThai === 1 ? 'pi pi-lock' : 'pi pi-unlock'"
                            size="small"
                            outlined
                            :severity="slotProps.data.trangThai === 1 ? 'warning' : 'info'"
                            @click="changeStatus(slotProps.data)"
                            :title="(slotProps.data.trangThai === 1 ? 'Cho nghỉ việc' : 'Kích hoạt lại') + ' (ADMIN only)'"
                        />
                        <Button
                            v-else
                            icon="pi pi-lock"
                            size="small"
                            outlined
                            severity="secondary"
                            disabled
                            title="Chỉ ADMIN mới có thể thay đổi trạng thái"
                        />
                        
                        <!-- Xóa - chỉ ADMIN -->
                        <Button
                            v-if="isAdmin"
                            icon="pi pi-user-minus"
                            size="small"
                            outlined
                            severity="danger"
                            @click="confirmDeleteEmployee(slotProps.data)"
                            title="Cho nghỉ việc (ADMIN only)"
                            :disabled="slotProps.data.trangThai === 0"
                        />
                        <Button
                            v-else
                            icon="pi pi-lock"
                            size="small"
                            outlined
                            severity="secondary"
                            disabled
                            title="Chỉ ADMIN mới có thể cho nghỉ việc"
                        />
                    </div>
                </template>
            </Column>

            <template #empty>
                <div class="text-center py-8">
                    <i class="pi pi-users text-gray-400 text-6xl mb-4"></i>
                    <h5 class="text-gray-600 mb-2">Không tìm thấy nhân viên</h5>
                    <p class="text-gray-500 mb-4">
                        Thử thay đổi bộ lọc hoặc kiểm tra lại dữ liệu.
                    </p>
                    <div class="flex gap-2 justify-center">
                        <Button
                            label="Làm mới"
                            icon="pi pi-refresh"
                            outlined
                            @click="fetchData"
                        />
                    </div>
                </div>
            </template>

            <template #loading>
                <div class="flex justify-center items-center py-8">
                    <ProgressSpinner size="50" strokeWidth="4" />
                    <span class="ml-3 text-gray-600">Đang tải dữ liệu...</span>
                </div>
            </template>
        </DataTable>

        <!-- View Employee Dialog -->
        <Dialog 
            v-model:visible="viewDialog" 
            :style="{ width: '900px' }" 
            :header="`Chi tiết nhân viên - ${viewingEmployee?.hoTen || 'N/A'}`" 
            :modal="true"
            class="employee-detail-dialog"
        >
            <div v-if="viewingEmployee" class="flex flex-col gap-6">
                <!-- Thông tin cơ bản -->
                <div class="rounded-lg bg-green-50 p-4 border border-green-200">
                    <h6 class="mb-3 font-semibold text-green-700 flex items-center">
                        <i class="pi pi-user mr-2"></i>
                        Thông tin nhân viên
                    </h6>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div class="info-item">
                            <strong>ID:</strong> 
                            <span class="ml-2">#{{ viewingEmployee.id }}</span>
                        </div>
                        <div class="info-item">
                            <strong>Mã nhân viên:</strong> 
                            <span class="ml-2">{{ viewingEmployee.maNhanVien || 'Chưa có' }}</span>
                        </div>
                        <div class="info-item">
                            <strong>Họ tên:</strong> 
                            <span class="ml-2 font-medium">{{ viewingEmployee.hoTen }}</span>
                        </div>
                        <div class="info-item">
                            <strong>Email:</strong> 
                            <span class="ml-2">{{ viewingEmployee.email }}</span>
                        </div>
                        <div class="info-item">
                            <strong>Số điện thoại:</strong> 
                            <span class="ml-2">{{ viewingEmployee.sdt }}</span>
                        </div>
                        <div class="info-item">
                            <strong>Trạng thái:</strong>
                            <Tag 
                                :value="getStatusLabel(viewingEmployee.trangThai)" 
                                :severity="getStatusSeverity(viewingEmployee.trangThai)" 
                                class="ml-2"
                            />
                        </div>
                        <div class="info-item">
                            <strong>Ngày tạo:</strong> 
                            <span class="ml-2">{{ formatDateTime(viewingEmployee.ngayTao) }}</span>
                        </div>
                        <div class="info-item">
                            <strong>Cập nhật lần cuối:</strong> 
                            <span class="ml-2">{{ formatDateTime(viewingEmployee.ngayCapNhat) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Thông tin tài khoản -->
                <div class="rounded-lg bg-blue-50 p-4 border border-blue-200">
                    <h6 class="mb-3 font-semibold text-blue-700 flex items-center">
                        <i class="pi pi-id-card mr-2"></i>
                        Tài khoản liên kết
                    </h6>
                    <div v-if="viewingEmployee.idTaiKhoan" class="text-sm">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="pi pi-check-circle text-green-500"></i>
                            <span class="font-medium">Đã liên kết với tài khoản</span>
                        </div>
                        <div class="info-item">
                            <strong>ID Tài khoản:</strong> 
                            <span class="ml-2">#{{ viewingEmployee.idTaiKhoan }}</span>
                        </div>
                    </div>
                    <div v-else class="text-sm text-orange-600">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-exclamation-triangle"></i>
                            <span>Chưa liên kết với tài khoản nào</span>
                        </div>
                    </div>
                </div>

                <!-- Thông tin địa chỉ từ API -->
                <div v-if="viewingEmployee.danhSachDiaChi && viewingEmployee.danhSachDiaChi.length > 0" 
                     class="rounded-lg bg-indigo-50 p-4 border border-indigo-200">
                    <h6 class="mb-3 font-semibold text-indigo-700 flex items-center">
                        <i class="pi pi-map-marker mr-2"></i>
                        Địa chỉ ({{ viewingEmployee.danhSachDiaChi.length }})
                    </h6>
                    <div class="space-y-3">
                        <div v-for="(diaChi, index) in viewingEmployee.danhSachDiaChi" 
                             :key="index" 
                             class="border rounded-lg p-3 bg-white" 
                             :class="{ 'border-green-500 bg-green-50': diaChi.isDefault }">
                            <div class="flex justify-between items-start mb-2">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-home text-indigo-600"></i>
                                    <h6 class="font-semibold">Địa chỉ {{ index + 1 }}</h6>
                                </div>
                                <Tag v-if="diaChi.isDefault" value="Mặc định" severity="success" />
                            </div>
                            <div class="text-sm space-y-1">
                                <p class="font-medium">{{ diaChi.diaChiDayDu || formatAddressFromInfo(diaChi) }}</p>
                                <div v-if="diaChi.diaChiChiTiet" class="text-gray-600">
                                    <strong>Chi tiết:</strong> {{ diaChi.diaChiChiTiet }}
                                </div>
                                <div class="flex gap-4 text-gray-600">
                                    <span v-if="diaChi.tenPhuong">
                                        <strong>Phường/Xã:</strong> {{ diaChi.tenPhuong }}
                                    </span>
                                    <span v-if="diaChi.tenTinh">
                                        <strong>Tỉnh/TP:</strong> {{ diaChi.tenTinh }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="rounded-lg bg-orange-50 p-4 border border-orange-200">
                    <div class="text-center text-orange-600">
                        <i class="pi pi-map-marker text-3xl mb-2"></i>
                        <p class="font-medium">Nhân viên chưa có địa chỉ</p>
                        <p class="text-sm">Có thể cập nhật địa chỉ trong phần chỉnh sửa</p>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Đóng" icon="pi pi-times" text @click="viewDialog = false" />
                <Button 
                    v-if="isAdmin"
                    label="Chỉnh sửa" 
                    icon="pi pi-pencil" 
                    @click="editFromView" 
                />
                <span v-else class="text-sm text-orange-600">
                    <i class="pi pi-lock mr-1"></i>
                    Chỉ ADMIN mới có thể chỉnh sửa
                </span>
            </template>
        </Dialog>

        <!-- Address Dialog -->
        <Dialog v-model:visible="addressDialog" :style="{ width: '700px' }" header="Chi tiết địa chỉ" :modal="true">
            <div v-if="viewingAddressEmployee">
                <div v-if="viewingAddressEmployee.danhSachDiaChi && viewingAddressEmployee.danhSachDiaChi.length > 0" 
                     class="space-y-3">
                    <div v-for="(diaChi, index) in viewingAddressEmployee.danhSachDiaChi" 
                         :key="index" 
                         class="border rounded-lg p-4" 
                         :class="{ 'border-green-500 bg-green-50': diaChi.isDefault }">
                        <div class="flex justify-between items-start mb-3">
                            <h6 class="font-semibold flex items-center gap-2">
                                <i class="pi pi-home"></i>
                                Địa chỉ {{ index + 1 }}
                            </h6>
                            <Tag v-if="diaChi.isDefault" value="Mặc định" severity="success" />
                        </div>
                        <div class="text-sm space-y-2">
                            <p class="font-medium text-gray-800">
                                <i class="pi pi-map-marker mr-2"></i>
                                {{ diaChi.diaChiDayDu || formatAddressFromInfo(diaChi) }}
                            </p>
                            <div v-if="diaChi.diaChiChiTiet" class="bg-gray-50 p-2 rounded">
                                <strong>Chi tiết:</strong> {{ diaChi.diaChiChiTiet }}
                            </div>
                            <div class="grid grid-cols-2 gap-2 text-gray-600">
                                <div v-if="diaChi.tenPhuong">
                                    <strong>Phường/Xã:</strong> {{ diaChi.tenPhuong }}
                                    <span v-if="diaChi.maPhuong" class="text-xs"> ({{ diaChi.maPhuong }})</span>
                                </div>
                                <div v-if="diaChi.tenTinh">
                                    <strong>Tỉnh/TP:</strong> {{ diaChi.tenTinh }}
                                    <span v-if="diaChi.maTinh" class="text-xs"> ({{ diaChi.maTinh }})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="text-center text-muted py-8">
                    <i class="pi pi-map-marker text-4xl mb-3 text-gray-400"></i>
                    <h6 class="text-gray-600 mb-2">Chưa có địa chỉ</h6>
                    <p class="text-gray-500">Nhân viên chưa cập nhật địa chỉ</p>
                </div>
            </div>
            <template #footer>
                <Button label="Đóng" icon="pi pi-times" @click="addressDialog = false" />
            </template>
        </Dialog>

        <!-- Edit Employee Dialog với API địa chỉ -->
        <Dialog 
            v-model:visible="employeeDialog" 
            :style="{ width: '1000px' }" 
            header="Cập nhật thông tin nhân viên (ADMIN)" 
            :modal="true"
            class="employee-edit-dialog"
            :maximizable="true"
        >
            <div v-if="employee.id" class="flex flex-col gap-6">
                <!-- Lưu ý ADMIN -->
                <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div class="flex items-center gap-2 text-green-700">
                        <i class="pi pi-shield"></i>
                        <span class="font-semibold">Quyền ADMIN - Chỉnh sửa đầy đủ</span>
                    </div>
                    <ul class="text-sm text-green-600 mt-2 space-y-1">
                        <li>• Có thể chỉnh sửa tất cả thông tin nhân viên</li>
                        <li>• Có thể thêm/sửa/xóa địa chỉ sử dụng API Việt Nam</li>
                        <li>• Có thể thay đổi email (sẽ cập nhật cả tài khoản)</li>
                        <li>• Mã nhân viên sẽ được tự động tạo nếu để trống</li>
                    </ul>
                </div>

                <!-- Thông tin cơ bản -->
                <div class="border-bottom pb-4">
                    <h6 class="mb-4 font-semibold flex items-center gap-2">
                        <i class="pi pi-user"></i>
                        Thông tin cơ bản
                    </h6>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="maNhanVien" class="mb-3 block font-bold">Mã nhân viên</label>
                            <InputText 
                                id="maNhanVien" 
                                v-model="employee.maNhanVien" 
                                fluid 
                                placeholder="Để trống để tự động tạo"
                            />
                            <small class="text-muted">Mã nhân viên duy nhất</small>
                        </div>
                        <div>
                            <label for="hoTen" class="mb-3 block font-bold text-red-600">Họ Tên *</label>
                            <InputText 
                                id="hoTen" 
                                v-model.trim="employee.hoTen" 
                                required="true" 
                                :invalid="submitted && !employee.hoTen" 
                                fluid 
                            />
                            <small v-if="submitted && !employee.hoTen" class="text-red-500">
                                Họ tên là bắt buộc
                            </small>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label for="email" class="mb-3 block font-bold text-red-600">Email *</label>
                            <InputText 
                                id="email" 
                                v-model="employee.email" 
                                required="true" 
                                :invalid="submitted && (!employee.email || !isValidEmail(employee.email))" 
                                fluid 
                                placeholder="email@example.com"
                            />
                            <small v-if="submitted && !employee.email" class="text-red-500">
                                Email là bắt buộc
                            </small>
                            <small v-if="submitted && employee.email && !isValidEmail(employee.email)" class="text-red-500">
                                Email không hợp lệ
                            </small>
                            <small class="text-blue-600">
                                <i class="pi pi-info-circle mr-1"></i>
                                Thay đổi email sẽ cập nhật cả tài khoản liên kết
                            </small>
                        </div>
                        <div>
                            <label for="sdt" class="mb-3 block font-bold text-red-600">Số điện thoại *</label>
                            <InputText 
                                id="sdt" 
                                v-model="employee.sdt" 
                                required="true" 
                                :invalid="submitted && (!employee.sdt || !isValidPhone(employee.sdt))" 
                                fluid 
                                placeholder="10 số, bắt đầu bằng 0"
                            />
                            <small v-if="submitted && !employee.sdt" class="text-red-500">
                                Số điện thoại là bắt buộc
                            </small>
                            <small v-if="submitted && employee.sdt && !isValidPhone(employee.sdt)" class="text-red-500">
                                Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)
                            </small>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label for="trangThai" class="mb-3 block font-bold text-red-600">Trạng thái *</label>
                            <Select 
                                id="trangThai" 
                                v-model="employee.trangThai" 
                                :options="statusOptionsForForm" 
                                optionLabel="label" 
                                optionValue="value" 
                                placeholder="Chọn trạng thái" 
                                :invalid="submitted && employee.trangThai === undefined" 
                                fluid 
                            />
                            <small v-if="submitted && employee.trangThai === undefined" class="text-red-500">
                                Trạng thái là bắt buộc
                            </small>
                        </div>
                        <div>
                            <label for="idTaiKhoan" class="mb-3 block font-bold text-gray-600">ID Tài khoản</label>
                            <InputText 
                                id="idTaiKhoan" 
                                v-model="employee.idTaiKhoan" 
                                fluid 
                                readonly
                                class="bg-gray-100"
                            />
                            <small class="text-gray-500">Chỉ đọc - Được quản lý tự động</small>
                        </div>
                    </div>
                </div>

                <!-- Quản lý địa chỉ với API Việt Nam -->
                <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <div class="flex justify-between items-center mb-3">
                        <h6 class="font-semibold text-indigo-700 flex items-center gap-2">
                            <i class="pi pi-map-marker"></i>
                            Quản lý địa chỉ (API Việt Nam)
                        </h6>
                        <Button
                            label="Thêm địa chỉ"
                            icon="pi pi-plus"
                            size="small"
                            @click="addNewAddress"
                            class="p-button-sm"
                        />
                    </div>

                    <div v-if="employee.danhSachDiaChi && employee.danhSachDiaChi.length > 0" class="space-y-3">
                        <div v-for="(diaChi, index) in employee.danhSachDiaChi" 
                             :key="index" 
                             class="border rounded-lg p-4 bg-white" 
                             :class="{ 'border-green-500 bg-green-50': diaChi.isDefault }">
                            
                            <div class="flex justify-between items-start mb-3">
                                <h6 class="font-semibold flex items-center gap-2">
                                    <i class="pi pi-home"></i>
                                    Địa chỉ {{ index + 1 }}
                                </h6>
                                <div class="flex gap-2">
                                    <Button
                                        v-if="!diaChi.isDefault"
                                        label="Đặt mặc định"
                                        icon="pi pi-star"
                                        size="small"
                                        outlined
                                        @click="setDefaultAddress(index)"
                                    />
                                    <Tag v-else value="Mặc định" severity="success" />
                                    <Button
                                        icon="pi pi-trash"
                                        size="small"
                                        severity="danger"
                                        outlined
                                        @click="removeAddress(index)"
                                        :disabled="employee.danhSachDiaChi.length === 1"
                                        title="Xóa địa chỉ"
                                    />
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-sm font-medium mb-1">Tỉnh/Thành phố</label>
                                    <Select
                                        :model-value="diaChi.maTinh"
                                        :options="provinces"
                                        optionLabel="name"
                                        optionValue="code"
                                        placeholder="Chọn tỉnh/thành phố"
                                        fluid
                                        :loading="loadingProvinces"
                                        @change="(event) => onAddressProvinceChange(event.value, index)"
                                        showClear
                                    />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-1">Phường/Xã</label>
                                    <Select
                                        :model-value="diaChi.maPhuong"
                                        :options="diaChi.availableWards || []"
                                        optionLabel="name"
                                        optionValue="code"
                                        placeholder="Chọn phường/xã"
                                        fluid
                                        :loading="loadingWards"
                                        :disabled="!diaChi.maTinh"
                                        @change="(event) => onAddressWardChange(event.value, index)"
                                        showClear
                                    />
                                    <small v-if="!diaChi.maTinh" class="text-gray-500">
                                        Vui lòng chọn tỉnh/thành phố trước
                                    </small>
                                </div>
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium mb-1">Địa chỉ chi tiết</label>
                                    <InputText
                                        v-model="diaChi.diaChiChiTiet"
                                        placeholder="Số nhà, tên đường..."
                                        fluid
                                        @input="updateAddressFullText(index)"
                                    />
                                </div>
                            </div>

                            <!-- Địa chỉ đầy đủ preview -->
                            <div class="mt-3 p-2 bg-gray-50 rounded">
                                <small class="text-gray-600">Địa chỉ đầy đủ:</small>
                                <p class="font-medium text-gray-800 mt-1">
                                    {{ formatFullAddressEdit(diaChi) }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div v-else class="text-center text-indigo-600 py-6">
                        <i class="pi pi-map-marker text-3xl mb-2"></i>
                        <p class="font-medium">Chưa có địa chỉ</p>
                        <p class="text-sm">Nhấn "Thêm địa chỉ" để thêm địa chỉ mới</p>
                    </div>
                </div>

                <!-- Thông tin hệ thống -->
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h6 class="mb-3 font-semibold text-gray-700 flex items-center gap-2">
                        <i class="pi pi-cog"></i>
                        Thông tin hệ thống
                    </h6>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div class="info-item">
                            <strong>ID Nhân viên:</strong> 
                            <span class="ml-2 text-blue-600">#{{ employee.id }}</span>
                        </div>
                        <div class="info-item">
                            <strong>ID Tài khoản:</strong> 
                            <span class="ml-2 text-blue-600">{{ employee.idTaiKhoan || 'Chưa liên kết' }}</span>
                        </div>
                        <div class="info-item">
                            <strong>Ngày tạo:</strong> 
                            <span class="ml-2">{{ formatDateTime(employee.ngayTao) }}</span>
                        </div>
                        <div class="info-item">
                            <strong>Cập nhật lần cuối:</strong> 
                            <span class="ml-2">{{ formatDateTime(employee.ngayCapNhat) }}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideEmployeeDialog" :disabled="saving" />
                <Button 
                    label="Lưu tất cả thay đổi" 
                    icon="pi pi-save" 
                    @click="saveEmployeeComplete" 
                    :loading="saving" 
                    :disabled="!isFormValidComplete"
                    class="p-button-success"
                />
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

// Router and utilities
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

// ===== AUTH LOGIC =====
const getCurrentUser = () => {
    try {
        const userInfo = localStorage.getItem('user_info')
        if (userInfo) {
            return JSON.parse(userInfo)
        }
        
        const userData = localStorage.getItem('user')
        if (userData) {
            return JSON.parse(userData)
        }
        
        return {
            id: 1,
            email: 'admin@beeshoes.com',
            hoTen: 'Administrator',
            vaiTro: 'ADMIN',
            role: 'ADMIN'
        }
    } catch (error) {
        console.error('Error getting user:', error)
        return null
    }
}

const isAdmin = computed(() => {
    const user = getCurrentUser()
    const result = user?.vaiTro === 'ADMIN' || user?.role === 'ADMIN'
    console.log('🔍 Admin check:', { user, result })
    return result
})

// Reactive State
const dt = ref()
const employees = ref([])
const selectedEmployees = ref([])
const isLoading = ref(false)
const saving = ref(false)
const exporting = ref(false)
const submitted = ref(false)
const employeeStats = ref(null)

// Dialog States
const viewDialog = ref(false)
const employeeDialog = ref(false)
const addressDialog = ref(false)

// Form Data
const employee = ref({})
const viewingEmployee = ref(null)
const viewingAddressEmployee = ref(null)

// Address Data - API
const provinces = ref([])
const wards = ref([])
const loadingProvinces = ref(false)
const loadingWards = ref(false)

// ===== SỬA LẠI SEARCH FILTERS =====
const globalSearch = ref('')
const advancedFilters = ref({
    trangThai: null, // Sửa từ '' thành null để match với backend
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

// ===== SỬA LẠI OPTIONS =====
const statusOptions = ref([
    { label: 'Tất cả trạng thái', value: null }, // Sửa từ '' thành null
    { label: 'Đang làm việc', value: 1 },
    { label: 'Nghỉ việc', value: 0 }
])

const statusOptionsForForm = ref([
    { label: 'Đang làm việc', value: 1 },
    { label: 'Nghỉ việc', value: 0 }
])

// ===== COMPUTED PROPERTIES =====
const hasSelectedEmployees = computed(() => 
    selectedEmployees.value && selectedEmployees.value.length > 0
)

const isFormValidComplete = computed(() => {
    const errors = validateEmployeeData()
    return errors.length === 0
})

// ===== SỬA LẠI SEARCH FUNCTIONS =====
const clearGlobalSearch = () => {
    globalSearch.value = ''
    pagination.value.page = 0
    selectedEmployees.value = [] // Xóa selection khi search thay đổi
    fetchData()
}

const resetAllFilters = () => {
    globalSearch.value = ''
    advancedFilters.value = {
        trangThai: null, // Sửa từ '' thành null
        startDate: null,
        endDate: null
    }
    pagination.value.page = 0
    selectedEmployees.value = []
    fetchData()
}

// ===== SỬA LẠI EVENT HANDLERS =====
const onGlobalSearchInput = () => {
    pagination.value.page = 0
    selectedEmployees.value = []
    debouncedGlobalSearch()
}

const onStatusFilterChange = () => {
    pagination.value.page = 0
    selectedEmployees.value = []
    fetchData()
}

const onDateFilterChange = () => {
    pagination.value.page = 0
    selectedEmployees.value = []
    fetchData()
}

// Debounced global search - SỬA LẠI
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
    fetchData()
}, 300) // Giảm từ 500ms xuống 300ms để UX tốt hơn

// ===== SỬA LẠI API FUNCTIONS =====
const fetchData = async () => {
    isLoading.value = true
    try {
        const params = {
            page: pagination.value.page,
            size: Math.min(pagination.value.size, 100),
            sortBy: pagination.value.sortField || 'id',
            sortDir: pagination.value.sortOrder === 1 ? 'asc' : 'desc'
        }

        // SỬA LẠI: Xác định endpoint đúng dựa trên tiêu chí tìm kiếm
        let endpoint = 'http://localhost:8080/api/nhan-vien'
        let hasSearchCriteria = false

        // Global search - ưu tiên cao nhất
        if (globalSearch.value && globalSearch.value.trim()) {
            endpoint = 'http://localhost:8080/api/nhan-vien/search'
            params.globalSearch = globalSearch.value.trim()
            hasSearchCriteria = true
        }

        // Advanced filters - có thể kết hợp với global search
        if (advancedFilters.value.trangThai !== null && advancedFilters.value.trangThai !== undefined) {
            if (!hasSearchCriteria) {
                endpoint = 'http://localhost:8080/api/nhan-vien/search'
            }
            params.trangThai = advancedFilters.value.trangThai
            hasSearchCriteria = true
        }
        
        if (advancedFilters.value.startDate) {
            if (!hasSearchCriteria) {
                endpoint = 'http://localhost:8080/api/nhan-vien/search'
            }
            params.startDate = advancedFilters.value.startDate.toISOString().split('T')[0]
            hasSearchCriteria = true
        }
        
        if (advancedFilters.value.endDate) {
            if (!hasSearchCriteria) {
                endpoint = 'http://localhost:8080/api/nhan-vien/search'
            }
            params.endDate = advancedFilters.value.endDate.toISOString().split('T')[0]
            hasSearchCriteria = true
        }

        console.log('📡 Fetching employees:', { endpoint, params, hasSearchCriteria })

        const response = await axios.get(endpoint, { params })

        if (response.data && response.data.content) {
            employees.value = response.data.content
            pagination.value.totalElements = response.data.totalElements || 0
            pagination.value.totalPages = response.data.totalPages || 0
            console.log(`✅ Loaded ${response.data.content.length} employees`)
        } else if (response.data && Array.isArray(response.data)) {
            // Trường hợp không có pagination
            employees.value = response.data
            pagination.value.totalElements = response.data.length
            pagination.value.totalPages = 1
        } else {
            employees.value = []
            pagination.value.totalElements = 0
            pagination.value.totalPages = 0
        }

        await fetchEmployeeStats()

    } catch (error) {
        console.error('❌ Error fetching employees:', error)
        handleApiError(error, 'Không thể tải danh sách nhân viên')
        employees.value = []
        pagination.value.totalElements = 0
        pagination.value.totalPages = 0
        employeeStats.value = { total: 0, active: 0, inactive: 0, recent: 0 }
    } finally {
        isLoading.value = false
    }
}

const fetchEmployeeStats = async () => {
    try {
        if (employees.value && employees.value.length > 0) {
            const now = new Date()
            const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
            
            employeeStats.value = {
                total: pagination.value.totalElements || employees.value.length,
                active: employees.value.filter(emp => emp.trangThai === 1).length,
                inactive: employees.value.filter(emp => emp.trangThai === 0).length,
                recent: employees.value.filter(emp => {
                    if (!emp.ngayTao) return false
                    const createdDate = new Date(emp.ngayTao)
                    return createdDate > thirtyDaysAgo
                }).length
            }
            console.log('📊 Employee stats calculated:', employeeStats.value)
        }
    } catch (error) {
        console.warn('⚠️ Could not calculate employee stats:', error.message)
        employeeStats.value = { total: 0, active: 0, inactive: 0, recent: 0 }
    }
}

// ===== SỬA LẠI CRUD OPERATIONS =====
const saveEmployeeComplete = async () => {
    if (!isAdmin.value) {
        toast.add({
            severity: 'warn',
            summary: 'Không có quyền',
            detail: 'Chỉ tài khoản ADMIN mới có thể chỉnh sửa thông tin nhân viên',
            life: 3000
        })
        return
    }

    submitted.value = true
    
    // Kiểm tra dữ liệu phía client trước
    const validationErrors = validateEmployeeData()
    
    if (validationErrors.length > 0) {
        toast.add({
            severity: 'warn',
            summary: 'Dữ liệu không hợp lệ', 
            detail: validationErrors.slice(0, 3).join('; ') + (validationErrors.length > 3 ? '...' : ''),
            life: 5000
        })
        
        console.warn('Lỗi validation:', validationErrors)
        return
    }

    if (!employee.value.id) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tạo nhân viên mới từ đây. Vui lòng sử dụng chức năng tạo tài khoản.',
            life: 3000
        })
        return
    }

    saving.value = true
    try {
        // SỬA LẠI: Xử lý địa chỉ với validation nâng cao
        const processedAddresses = employee.value.danhSachDiaChi?.map(addr => {
            const processedAddr = {
                diaChiChiTiet: addr.diaChiChiTiet?.trim() || '',
                tenPhuong: addr.tenPhuong?.trim() || '',
                tenTinh: addr.tenTinh?.trim() || '',
                isDefault: addr.isDefault || false,
                maPhuong: addr.maPhuong || null,
                maTinh: addr.maTinh || null,
                trangThai: 1
            }
            
            // SỬA LẠI: Tạo địa chỉ đầy đủ
            const parts = [
                processedAddr.diaChiChiTiet,
                processedAddr.tenPhuong,
                processedAddr.tenTinh
            ].filter(part => part && part.trim() !== '')
            
            processedAddr.diaChiDayDu = parts.join(', ')
            
            return processedAddr
        }).filter(addr => 
            // SỬA LẠI: Chỉ giữ địa chỉ có đủ thông tin cơ bản
            addr.tenPhuong && addr.tenTinh
        ) || []

        // SỬA LẠI: Đảm bảo có địa chỉ mặc định
        if (processedAddresses.length > 0) {
            const hasDefault = processedAddresses.some(addr => addr.isDefault)
            if (!hasDefault) {
                processedAddresses[0].isDefault = true
            }
        }

        // SỬA LẠI: Chuẩn bị dữ liệu gửi lên server
        const employeeData = {
            id: employee.value.id,
            maNhanVien: employee.value.maNhanVien?.trim() || null,
            hoTen: employee.value.hoTen.trim(),
            email: employee.value.email.trim(),
            sdt: employee.value.sdt.trim(),
            trangThai: employee.value.trangThai,
            idTaiKhoan: employee.value.idTaiKhoan,
            danhSachDiaChi: processedAddresses
        }

        console.log('💾 Cập nhật nhân viên với dữ liệu đã kiểm tra:', employeeData)

        const response = await axios.put(`http://localhost:8080/api/nhan-vien/${employee.value.id}`, employeeData)
        
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật thông tin nhân viên thành công',
            life: 3000
        })

        await fetchData()
        hideEmployeeDialog()
        
    } catch (error) {
        console.error('❌ Lỗi cập nhật nhân viên:', error)
        
        // SỬA LẠI: Xử lý lỗi nâng cao
        let errorMessage = 'Không thể cập nhật thông tin nhân viên'
        let errorDetails = []
        
        if (error.response?.status === 400) {
            if (error.response.data?.details) {
                if (Array.isArray(error.response.data.details)) {
                    errorDetails = error.response.data.details
                } else if (typeof error.response.data.details === 'object') {
                    errorDetails = Object.values(error.response.data.details)
                } else {
                    errorDetails = [error.response.data.details.toString()]
                }
                errorMessage = 'Dữ liệu không hợp lệ'
            } else if (error.response.data?.message) {
                errorMessage = error.response.data.message
            }
        } else if (error.response?.status === 409) {
            errorMessage = error.response.data?.message || 'Email hoặc số điện thoại đã được sử dụng'
        } else if (error.response?.status === 500) {
            errorMessage = 'Lỗi server nội bộ'
        }
        
        toast.add({
            severity: 'error',
            summary: 'Lỗi cập nhật',
            detail: errorMessage,
            life: 5000
        })
        
        if (errorDetails.length > 0) {
            console.error('Lỗi validation từ server:', errorDetails)
            
            errorDetails.slice(0, 3).forEach((detail, index) => {
                setTimeout(() => {
                    toast.add({
                        severity: 'warn',
                        summary: `Chi tiết lỗi ${index + 1}`,
                        detail: detail,
                        life: 4000
                    })
                }, (index + 1) * 500)
            })
        }
        
    } finally {
        saving.value = false
    }
}

const changeStatus = async (employeeData) => {
    if (!isAdmin.value) {
        toast.add({
            severity: 'warn',
            summary: 'Không có quyền',
            detail: 'Chỉ tài khoản ADMIN mới có thể thay đổi trạng thái nhân viên',
            life: 3000
        })
        return
    }

    try {
        const newStatus = employeeData.trangThai === 1 ? 0 : 1
        
        console.log(`🔄 Changing status for employee ${employeeData.id} to ${newStatus}`)
        
        await axios.patch(`http://localhost:8080/api/nhan-vien/${employeeData.id}/status`, {
            trangThai: newStatus
        })
        
        await fetchData()
        
        const statusText = newStatus === 1 ? 'kích hoạt' : 'cho nghỉ việc'
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã ${statusText} nhân viên ${employeeData.hoTen}`,
            life: 3000
        })
    } catch (error) {
        console.error('❌ Error changing status:', error)
        handleApiError(error, 'Thay đổi trạng thái thất bại')
    }
}

// ===== VALIDATION FUNCTIONS =====
const validateEmployeeData = () => {
    const errors = []
    
    // Kiểm tra họ tên
    if (!employee.value.hoTen || !employee.value.hoTen.trim()) {
        errors.push('Họ tên không được để trống')
    } else if (employee.value.hoTen.length > 225) {
        errors.push('Họ tên không được quá 225 ký tự')
    } else if (!isValidVietnameseName(employee.value.hoTen)) {
        errors.push('Họ tên chỉ chứa chữ cái và khoảng trắng, hỗ trợ tiếng Việt')
    }
    
    // Kiểm tra email
    if (!employee.value.email || !employee.value.email.trim()) {
        errors.push('Email không được để trống')
    } else if (!isValidEmailFormat(employee.value.email)) {
        errors.push('Email không đúng định dạng')
    } else if (employee.value.email.length > 100) {
        errors.push('Email không được quá 100 ký tự')
    }
    
    // Kiểm tra số điện thoại
    if (!employee.value.sdt || !employee.value.sdt.trim()) {
        errors.push('Số điện thoại không được để trống')
    } else if (!isValidVietnamesePhone(employee.value.sdt)) {
        errors.push('Số điện thoại không đúng định dạng Việt Nam (10-11 số, bắt đầu bằng 0)')
    }
    
    // Kiểm tra mã nhân viên
    if (employee.value.maNhanVien && employee.value.maNhanVien.trim()) {
        if (employee.value.maNhanVien.length > 25) {
            errors.push('Mã nhân viên không được quá 25 ký tự')
        } else if (!employee.value.maNhanVien.match(/^[A-Za-z0-9]+$/)) {
            errors.push('Mã nhân viên chỉ chứa chữ cái và số')
        }
    }
    
    // Kiểm tra trạng thái
    if (employee.value.trangThai === undefined || employee.value.trangThai === null) {
        errors.push('Trạng thái không được để trống')
    } else if (employee.value.trangThai !== 0 && employee.value.trangThai !== 1) {
        errors.push('Trạng thái phải là 0 hoặc 1')
    }
    
    return errors
}

const isValidVietnameseName = (name) => {
    if (!name || !name.trim()) return false
    
    const trimmedName = name.trim()
    if (trimmedName.length < 2 || trimmedName.length > 225) return false
    
    const vietnameseNameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềếểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/
    
    if (!vietnameseNameRegex.test(trimmedName)) return false
    
    const words = trimmedName.split(/\s+/)
    return words.length >= 2 && words.length <= 10
}

const isValidEmailFormat = (email) => {
    if (!email || !email.trim()) return false
    
    const trimmedEmail = email.trim()
    if (trimmedEmail.length > 100) return false
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    
    if (!emailRegex.test(trimmedEmail)) return false
    
    if (trimmedEmail.includes('..') || trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.')) {
        return false
    }
    
    return true
}

const isValidVietnamesePhone = (phone) => {
    if (!phone || !phone.trim()) return false
    
    const cleanPhone = phone.replace(/\s+/g, '')
    
    return /^(03|05|07|08|09)\d{8}$/.test(cleanPhone) || 
           /^02\d{8,9}$/.test(cleanPhone)
}

// ===== UTILITY FUNCTIONS =====
const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
}

const formatTime = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

const formatDateTime = (date) => {
    if (!date) return 'Chưa có'
    return new Date(date).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
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

const isValidPhone = (phone) => {
    if (!phone) return false
    return /^0\d{9,10}$/.test(phone.toString())
}

const isValidEmail = (email) => {
    if (!email) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ===== ADDRESS HELPER FUNCTIONS =====
function getDefaultAddress(item) {
    if (!item.danhSachDiaChi || item.danhSachDiaChi.length === 0) {
        return 'Chưa có địa chỉ'
    }
    
    const defaultAddr = item.danhSachDiaChi.find(addr => addr.isDefault)
    if (defaultAddr) {
        return truncateAddress(defaultAddr.diaChiDayDu || formatAddressFromInfo(defaultAddr))
    }
    
    const firstAddr = item.danhSachDiaChi[0]
    return truncateAddress(firstAddr.diaChiDayDu || formatAddressFromInfo(firstAddr))
}

function formatAddressFromInfo(address) {
    if (!address) return 'Chưa có địa chỉ'
    
    const parts = [
        address.diaChiChiTiet,
        address.tenPhuong,
        address.tenTinh
    ].filter(part => part && part.trim() !== '')
    
    return parts.length > 0 ? parts.join(', ') : 'Chưa có địa chỉ'
}

function truncateAddress(address) {
    if (!address) return ''
    return address.length > 50 ? address.substring(0, 50) + '...' : address
}

const formatFullAddressEdit = (address) => {
    if (!address) return 'Chưa có địa chỉ'
    
    const parts = [
        address.diaChiChiTiet,
        address.tenPhuong,
        address.tenTinh
    ].filter(part => part && part.trim() !== '')
    
    return parts.length > 0 ? parts.join(', ') : 'Chưa có địa chỉ'
}

// ===== ADDRESS MANAGEMENT - API VIỆT NAM =====
const fetchProvinces = async () => {
    if (provinces.value.length > 0) return
    
    loadingProvinces.value = true
    try {
        console.log('Fetching provinces from Vietnam API...')
        const response = await axios.get('http://localhost:8080/api/vietnam-address/provinces')
        
        if (response.data && response.data.success && response.data.data) {
            provinces.value = response.data.data.map(item => ({
                code: item.code.toString(),
                name: item.name,
                codename: item.codename
            }))
            console.log('Loaded provinces from API:', provinces.value.length)
        } else {
            provinces.value = [
                { code: '1', name: 'Hà Nội', codename: 'ha_noi' },
                { code: '79', name: 'TP. Hồ Chí Minh', codename: 'ho_chi_minh' },
                { code: '48', name: 'Đà Nẵng', codename: 'da_nang' },
                { code: '92', name: 'Cần Thơ', codename: 'can_tho' }
            ]
        }
    } catch (error) {
        console.error('Error fetching provinces:', error)
        provinces.value = [
            { code: '1', name: 'Hà Nội', codename: 'ha_noi' },
            { code: '79', name: 'TP. Hồ Chí Minh', codename: 'ho_chi_minh' },
            { code: '48', name: 'Đà Nẵng', codename: 'da_nang' }
        ]
    } finally {
        loadingProvinces.value = false
    }
}

const fetchWards = async (provinceCode) => {
    if (!provinceCode) {
        wards.value = []
        return
    }
    
    loadingWards.value = true
    try {
        console.log('Fetching wards for province:', provinceCode)
        const response = await axios.get(`http://localhost:8080/api/vietnam-address/wards/${provinceCode}`)
        
        if (response.data && response.data.success && response.data.data) {
            wards.value = response.data.data.map(item => ({
                code: item.code.toString(),
                name: item.name,
                codename: item.codename
            }))
            console.log('Loaded wards from API:', wards.value.length)
        } else {
            wards.value = getFallbackWards()
        }
    } catch (error) {
        console.error('Error loading wards:', error)
        wards.value = getFallbackWards()
    } finally {
        loadingWards.value = false
    }
}

const getFallbackWards = () => {
    return [
        { code: '1', name: 'Phường/Xã 1', codename: 'phuong_xa_1' },
        { code: '2', name: 'Phường/Xã 2', codename: 'phuong_xa_2' },
        { code: '3', name: 'Phường/Xã 3', codename: 'phuong_xa_3' }
    ]
}

const onAddressProvinceChange = async (provinceCode, addressIndex) => {
    if (!employee.value.danhSachDiaChi[addressIndex]) return
    
    employee.value.danhSachDiaChi[addressIndex].maPhuong = ''
    employee.value.danhSachDiaChi[addressIndex].tenPhuong = ''
    
    const selectedProvince = provinces.value.find(p => p.code === provinceCode)
    if (selectedProvince) {
        employee.value.danhSachDiaChi[addressIndex].tenTinh = selectedProvince.name
        employee.value.danhSachDiaChi[addressIndex].maTinh = provinceCode
    }
    
    await fetchWardsForAddress(provinceCode, addressIndex)
    updateAddressFullText(addressIndex)
}

const onAddressWardChange = (wardCode, addressIndex) => {
    if (!employee.value.danhSachDiaChi[addressIndex]) return
    
    const availableWards = employee.value.danhSachDiaChi[addressIndex].availableWards || []
    const selectedWard = availableWards.find(w => w.code === wardCode)
    if (selectedWard) {
        employee.value.danhSachDiaChi[addressIndex].tenPhuong = selectedWard.name
        employee.value.danhSachDiaChi[addressIndex].maPhuong = wardCode
    }
    updateAddressFullText(addressIndex)
}

const fetchWardsForAddress = async (provinceCode, addressIndex) => {
    if (!provinceCode || !employee.value.danhSachDiaChi || !employee.value.danhSachDiaChi[addressIndex]) return
    
    try {
        const response = await axios.get(`http://localhost:8080/api/vietnam-address/wards/${provinceCode}`)
        
        let wardsData = []
        if (response.data && response.data.success && response.data.data) {
            wardsData = response.data.data.map(item => ({
                code: item.code.toString(),
                name: item.name,
                codename: item.codename
            }))
        } else {
            wardsData = getFallbackWards()
        }
        
        employee.value.danhSachDiaChi[addressIndex].availableWards = wardsData
    } catch (error) {
        console.error('Error fetching wards for address:', error)
        employee.value.danhSachDiaChi[addressIndex].availableWards = getFallbackWards()
    }
}

const updateAddressFullText = (index) => {
    if (!employee.value.danhSachDiaChi || !employee.value.danhSachDiaChi[index]) return
    
    const address = employee.value.danhSachDiaChi[index]
    const parts = [
        address.diaChiChiTiet,
        address.tenPhuong,
        address.tenTinh
    ].filter(part => part && part.trim() !== '')
    
    address.diaChiDayDu = parts.join(', ')
}

const addNewAddress = () => {
    if (!employee.value.danhSachDiaChi) {
        employee.value.danhSachDiaChi = []
    }
    
    const newAddress = {
        diaChiChiTiet: '',
        tenPhuong: '',
        tenTinh: '',
        maPhuong: '',
        maTinh: '',
        diaChiDayDu: '',
        availableWards: [],
        isDefault: employee.value.danhSachDiaChi.length === 0
    }
    
    employee.value.danhSachDiaChi.push(newAddress)
}

const removeAddress = (index) => {
    if (!employee.value.danhSachDiaChi || employee.value.danhSachDiaChi.length <= 1) {
        return
    }
    
    const isRemovedDefault = employee.value.danhSachDiaChi[index].isDefault
    employee.value.danhSachDiaChi.splice(index, 1)
    
    if (isRemovedDefault && employee.value.danhSachDiaChi.length > 0) {
        employee.value.danhSachDiaChi[0].isDefault = true
    }
}

const setDefaultAddress = (index) => {
    if (!employee.value.danhSachDiaChi) return
    
    employee.value.danhSachDiaChi.forEach(addr => addr.isDefault = false)
    employee.value.danhSachDiaChi[index].isDefault = true
}

// ===== PAGINATION & SORTING =====
const onPageChange = (event) => {
    if (!event || typeof event.page !== 'number' || typeof event.rows !== 'number') {
        console.warn('Invalid page change event:', event)
        return
    }

    pagination.value.page = Math.max(0, event.page)
    pagination.value.size = Math.min(Math.max(1, event.rows), 100)
    
    fetchData()
}

const onSort = (event) => {
    if (!event) {
        console.warn('Invalid sort event:', event)
        return
    }

    pagination.value.sortField = event.sortField || 'id'
    pagination.value.sortOrder = event.sortOrder || -1
    
    fetchData()
}

// ===== DIALOG FUNCTIONS =====
function viewAddress(emp) {
    viewingAddressEmployee.value = emp
    addressDialog.value = true
}

function viewEmployee(emp) {
    viewingEmployee.value = { ...emp }
    viewDialog.value = true
}

function editFromView() {
    if (!isAdmin.value) {
        toast.add({
            severity: 'warn',
            summary: 'Không có quyền',
            detail: 'Chỉ tài khoản ADMIN mới có thể chỉnh sửa thông tin nhân viên',
            life: 3000
        })
        return
    }

    employee.value = { 
        ...viewingEmployee.value,
        danhSachDiaChi: viewingEmployee.value.danhSachDiaChi ? 
            viewingEmployee.value.danhSachDiaChi.map(addr => ({
                ...addr,
                availableWards: []
            })) : []
    }
    
    if (!employee.value.danhSachDiaChi || employee.value.danhSachDiaChi.length === 0) {
        employee.value.danhSachDiaChi = [{
            diaChiChiTiet: '',
            tenPhuong: '',
            tenTinh: '',
            maPhuong: null,
            maTinh: null,
            availableWards: [],
            isDefault: true
        }]
    } else {
        employee.value.danhSachDiaChi.forEach((addr, index) => {
            if (addr.maTinh) {
                fetchWardsForAddress(addr.maTinh, index)
            }
        })
    }
    
    viewDialog.value = false
    employeeDialog.value = true
    submitted.value = false
    fetchProvinces()
}

function editEmployee(emp) {
    if (!isAdmin.value) {
        toast.add({
            severity: 'warn',
            summary: 'Không có quyền',
            detail: 'Chỉ tài khoản ADMIN mới có thể chỉnh sửa thông tin nhân viên',
            life: 3000
        })
        return
    }

    employee.value = { 
        ...emp,
        danhSachDiaChi: emp.danhSachDiaChi ? emp.danhSachDiaChi.map(addr => ({
            ...addr,
            availableWards: []
        })) : []
    }
    
    if (!employee.value.danhSachDiaChi || employee.value.danhSachDiaChi.length === 0) {
        employee.value.danhSachDiaChi = [{
            diaChiChiTiet: '',
            tenPhuong: '',
            tenTinh: '',
            maPhuong: null,
            maTinh: null,
            availableWards: [],
            isDefault: true
        }]
    } else {
        employee.value.danhSachDiaChi.forEach((addr, index) => {
            if (addr.maTinh) {
                fetchWardsForAddress(addr.maTinh, index)
            }
        })
    }
    
    employeeDialog.value = true
    submitted.value = false
    fetchProvinces()
}

const hideEmployeeDialog = () => {
    employeeDialog.value = false
    submitted.value = false
    employee.value = {
        danhSachDiaChi: []
    }
}

// ===== CONFIRMATION FUNCTIONS =====
const confirmDeleteEmployee = (employeeData) => {
    if (!isAdmin.value) {
        toast.add({
            severity: 'warn',
            summary: 'Không có quyền',
            detail: 'Chỉ tài khoản ADMIN mới có thể cho nhân viên nghỉ việc',
            life: 3000
        })
        return
    }

    if (employeeData.trangThai === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Nhân viên đã nghỉ việc',
            life: 3000
        })
        return
    }

    confirm.require({
        message: `Bạn có chắc chắn muốn cho nhân viên "${employeeData.hoTen}" nghỉ việc?`,
        header: 'Xác nhận cho nghỉ việc',
        icon: 'pi pi-exclamation-triangle',
        rejectClass: 'p-button-secondary p-button-outlined',
        rejectLabel: 'Hủy',
        acceptLabel: 'Cho nghỉ việc',
        acceptClass: 'p-button-danger',
        accept: () => deleteEmployee(employeeData.id)
    })
}

const confirmDeleteSelected = () => {
    if (!isAdmin.value) {
        toast.add({
            severity: 'warn',
            summary: 'Không có quyền',
            detail: 'Chỉ tài khoản ADMIN mới có thể cho nhân viên nghỉ việc',
            life: 3000
        })
        return
    }

    if (!hasSelectedEmployees.value) return

    const activeEmployees = selectedEmployees.value.filter(emp => emp.trangThai === 1)
    if (activeEmployees.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Các nhân viên đã chọn đều đã nghỉ việc',
            life: 3000
        })
        return
    }

    confirm.require({
        message: `Bạn có chắc chắn muốn cho ${activeEmployees.length} nhân viên đã chọn nghỉ việc?`,
        header: 'Xác nhận cho nghỉ việc hàng loạt',
        icon: 'pi pi-exclamation-triangle',
        rejectClass: 'p-button-secondary p-button-outlined',
        rejectLabel: 'Hủy',
        acceptLabel: 'Cho nghỉ việc',
        acceptClass: 'p-button-danger',
        accept: () => deleteSelectedEmployees()
    })
}

// ===== DELETE FUNCTIONS =====
const deleteEmployee = async (employeeId) => {
    if (!isAdmin.value) {
        toast.add({
            severity: 'warn',
            summary: 'Không có quyền',
            detail: 'Chỉ tài khoản ADMIN mới có thể cho nhân viên nghỉ việc',
            life: 3000
        })
        return
    }

    try {
        console.log(`Soft deleting employee ${employeeId}`)
        
        await axios.delete(`http://localhost:8080/api/nhan-vien/${employeeId}`)
        await fetchData()
        
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đã cho nhân viên nghỉ việc',
            life: 3000
        })
    } catch (error) {
        console.error('Error deleting employee:', error)
        handleApiError(error, 'Cho nghỉ việc thất bại')
    }
}

const deleteSelectedEmployees = async () => {
    if (!isAdmin.value) {
        toast.add({
            severity: 'warn',
            summary: 'Không có quyền',
            detail: 'Chỉ tài khoản ADMIN mới có thể cho nhân viên nghỉ việc',
            life: 3000
        })
        return
    }

    try {
        const ids = selectedEmployees.value.map(emp => emp.id)
        console.log('Batch deleting employees:', ids)
        
        await axios.delete('http://localhost:8080/api/nhan-vien/batch', { data: ids })
        await fetchData()
        selectedEmployees.value = []
        
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã cho ${ids.length} nhân viên nghỉ việc`,
            life: 3000
        })
    } catch (error) {
        console.error('Error batch deleting employees:', error)
        handleApiError(error, 'Xóa hàng loạt thất bại')
    }
}

// ===== EXPORT FUNCTIONS =====
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

        const headers = [
            'ID', 'Mã Nhân Viên', 'Họ Tên', 'Email', 'SĐT', 
            'ID Tài Khoản', 'Địa Chỉ', 'Trạng Thái', 'Ngày Tạo', 'Cập Nhật Cuối'
        ]
        
        const csvData = employees.value.map((item) => [
            item.id || '', 
            item.maNhanVien || 'Chưa có', 
            item.hoTen || '', 
            item.email || 'Chưa có', 
            item.sdt || '', 
            item.idTaiKhoan || 'Chưa liên kết',
            getDefaultAddress(item),
            item.trangThai === 1 ? 'Đang làm việc' : 'Nghỉ việc', 
            formatDateTime(item.ngayTao),
            formatDateTime(item.ngayCapNhat)
        ])

        const csvContent = [headers, ...csvData]
            .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
            .join('\n')

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
            detail: `Đã xuất ${employees.value.length} bản ghi nhân viên`,
            life: 3000
        })
    } catch (error) {
        console.error('Error exporting CSV:', error)
        handleApiError(error, 'Xuất CSV thất bại')
    } finally {
        exporting.value = false
    }
}

// ===== ERROR HANDLING =====
const handleApiError = (error, defaultMessage) => {
    let errorMessage = defaultMessage
    
    if (error.response) {
        const { status, data } = error.response
        switch (status) {
            case 400:
                if (data.errors) {
                    const errorDetails = Object.values(data.errors).join(', ')
                    errorMessage = `Dữ liệu không hợp lệ: ${errorDetails}`
                } else if (data.message) {
                    errorMessage = data.message
                } else if (data.error) {
                    errorMessage = data.error
                } else {
                    errorMessage = 'Yêu cầu không hợp lệ'
                }
                break
            case 404:
                errorMessage = 'Không tìm thấy dữ liệu'
                break
            case 409:
                errorMessage = data.message || 'Dữ liệu bị trùng lặp'
                break
            case 500:
                errorMessage = 'Lỗi server nội bộ'
                break
            default:
                errorMessage = data.message || data.error || defaultMessage
        }
    } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Không thể kết nối đến server'
    } else if (error.message) {
        errorMessage = error.message
    }

    toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: errorMessage,
        life: 5000
    })
}

// ===== WATCHERS =====
watch(() => employee.value.hoTen, (newValue) => {
    if (submitted.value && newValue && !isValidVietnameseName(newValue)) {
        console.warn('Định dạng tên tiếng Việt không hợp lệ')
    }
})

watch(() => employee.value.email, (newValue) => {
    if (submitted.value && newValue && !isValidEmailFormat(newValue)) {
        console.warn('Định dạng email không hợp lệ')
    }
})

watch(() => employee.value.sdt, (newValue) => {
    if (submitted.value && newValue && !isValidVietnamesePhone(newValue)) {
        console.warn('Định dạng số điện thoại Việt Nam không hợp lệ')
    }
})

watch(() => pagination.value.size, () => {
    pagination.value.page = 0
    fetchData()
})

// ===== LIFECYCLE =====
onMounted(() => {
    console.log('🚀 NhanVien component mounted')
    fetchData()
})
</script>

<style scoped>
.card {
    @apply bg-white rounded-lg shadow-sm border border-gray-200;
}

.card-header {
    @apply p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50;
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

.border-bottom {
    border-bottom: 1px solid #dee2e6;
}

.info-item {
    @apply py-1;
}

.employee-detail-dialog :deep(.p-dialog-content) {
    @apply p-0;
}

.employee-edit-dialog :deep(.p-dialog-content) {
    @apply p-6;
}

/* Table Styling */
:deep(.p-datatable) {
    @apply border-0 shadow-sm;
}

:deep(.p-datatable-header) {
    @apply bg-gray-50 border-b border-gray-200;
}

:deep(.p-datatable-tbody tr) {
    @apply hover:bg-blue-50 transition-colors;
}

:deep(.p-datatable-tbody tr:nth-child(even)) {
    @apply bg-gray-50;
}

:deep(.p-datatable-tbody tr.p-datatable-row-selected) {
    @apply bg-blue-100 border-blue-200;
}

:deep(.p-paginator) {
    @apply bg-white border-t border-gray-200;
}

@media (max-width: 768px) {
    .search-section .grid {
        @apply grid-cols-1 gap-2;
    }
    
    .search-section .flex {
        @apply flex-col items-start gap-3;
    }
    
    :deep(.p-datatable-responsive-demo .p-datatable-tbody tr td) {
        @apply text-sm;
    }
    
    .card-header .flex {
        @apply flex-col items-start gap-4;
    }
}
</style>