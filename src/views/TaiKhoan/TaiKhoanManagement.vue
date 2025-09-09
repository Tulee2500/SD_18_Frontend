<template>
    <div class="card">
        <!-- Toolbar -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Thêm tài khoản" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                <Button 
                    label="Xóa đã chọn" 
                    icon="pi pi-trash" 
                    severity="secondary" 
                    @click="confirmDeleteSelected" 
                    :disabled="!selectedAccounts || !selectedAccounts.length" 
                />
            </template>
            <template #end>
                <Button 
                    label="Xuất CSV" 
                    icon="pi pi-upload" 
                    severity="secondary" 
                    @click="handleExportCSV" 
                    :loading="exporting" 
                />
            </template>
        </Toolbar>

        <!-- Enhanced Search and Filter Section -->
        <div class="search-filter-section mb-6 p-4 bg-gray-50 rounded-lg border">
            <!-- Global Search -->
            <div class="mb-4">
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText 
                        v-model="globalFilter" 
                        placeholder="Tìm kiếm tất cả thông tin tài khoản (email, mã TK, vai trò, trạng thái)..." 
                        class="w-full"
                        @input="debouncedSearch"
                    />
                </IconField>
            </div>

            <!-- Advanced Filters -->
            <div class="flex flex-wrap items-center gap-3">
                <Select 
                    v-model="roleFilter" 
                    :options="ROLE_FILTER_OPTIONS" 
                    optionLabel="label" 
                    optionValue="value" 
                    placeholder="Lọc vai trò" 
                    class="w-40"
                    @change="applyFilters"
                    showClear
                />

                <!-- Select lọc trạng thái -->
                <Select 
                    v-model="statusFilter" 
                    :options="STATUS_OPTIONS" 
                    optionLabel="label" 
                    optionValue="value" 
                    placeholder="Lọc trạng thái" 
                    class="w-40"
                    @change="applyFilters"
                    showClear
                />

                <!-- DatePicker từ ngày -->
                <DatePicker
                    v-model="dateFilters.startDate"
                    placeholder="Từ ngày"
                    dateFormat="dd/mm/yy"
                    @date-select="applyFilters"
                    @clear="applyFilters"
                    class="w-36"
                    showIcon
                    showClear
                    :maxDate="dateFilters.endDate || new Date()"
                />

                <!-- DatePicker đến ngày -->
                <DatePicker
                    v-model="dateFilters.endDate"
                    placeholder="Đến ngày"
                    dateFormat="dd/mm/yy"
                    @date-select="applyFilters"
                    @clear="applyFilters"
                    class="w-36"
                    showIcon
                    showClear
                    :minDate="dateFilters.startDate"
                    :maxDate="new Date()"
                />
                <Button
                    label="Reset"
                    icon="pi pi-refresh"
                    outlined
                    @click="resetFilters"
                />

                <div class="ml-auto flex items-center gap-2">
                    <Badge 
                        v-if="selectedAccounts && selectedAccounts.length" 
                        :value="`${selectedAccounts.length} đã chọn`" 
                        severity="info" 
                    />
                    <span class="text-sm text-gray-600">
                        Hiển thị {{ filteredAccounts.length }} / {{ accounts.length }} tài khoản
                    </span>
                </div>
            </div>
        </div>

        <!-- DataTable -->
        <DataTable
            ref="dt"
            v-model:selection="selectedAccounts"
            :value="filteredAccounts"
            dataKey="id"
            :paginator="true"
            :rows="PAGINATION_CONFIG.defaultRows"
            :paginatorTemplate="PAGINATION_CONFIG.paginatorTemplate"
            :rowsPerPageOptions="PAGINATION_CONFIG.rowsPerPageOptions"
            currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} tài khoản"
            :loading="isLoading"
            class="responsive-table"
        >
            <template #header>
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <h4 class="m-0 text-xl font-bold text-gray-800">Quản Lý Tài Khoản</h4>
                    <div class="flex items-center gap-3">
                        <div class="stats-summary flex gap-4 text-sm">
                            <div class="flex items-center gap-1">
                                <div class="w-3 h-3 rounded bg-blue-500"></div>
                                <span>Tổng: {{ accounts.length }}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <div class="w-3 h-3 rounded bg-green-500"></div>
                                <span>Hoạt động: {{ getActiveAccountsCount() }}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <div class="w-3 h-3 rounded bg-red-500"></div>
                                <span>Khóa: {{ getInactiveAccountsCount() }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            
            <Column field="id" header="ID" sortable style="width: 6rem">
                <template #body="slotProps">
                    <span class="font-bold text-primary">#{{ slotProps.data.id }}</span>
                </template>
            </Column>
            
            <Column field="maTaiKhoan" header="Mã TK" sortable style="width: 10rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.maTaiKhoan" severity="info" />
                </template>
            </Column>
            
            <Column field="email" header="Email" sortable style="min-width: 20rem">
                <template #body="slotProps">
                    <div class="flex items-center">
                        <i class="pi pi-envelope text-muted mr-2"></i>
                        <span class="font-medium">{{ slotProps.data.email }}</span>
                    </div>
                </template>
            </Column>
            
            <Column field="vaiTro" header="Vai trò" sortable style="width: 12rem">
                <template #body="slotProps">
                    <Tag 
                        :value="getRoleLabel(slotProps.data.vaiTro)" 
                        :severity="getRoleSeverity(slotProps.data.vaiTro)"
                    >
                        <i :class="getRoleIcon(slotProps.data.vaiTro)" class="mr-1"></i>
                        {{ getRoleLabel(slotProps.data.vaiTro) }}
                    </Tag>
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
            
            <Column header="Thông tin liên kết" style="min-width: 15rem">
                <template #body="slotProps">
                    <div class="flex flex-col gap-1 text-sm">
                        <div v-if="slotProps.data.vaiTro === 'USER'" class="flex items-center gap-2">
                            <i class="pi pi-user text-blue-500"></i>
                            <span>KH: {{ getLinkedCustomerInfo(slotProps.data.id) }}</span>
                        </div>
                        <div v-else-if="slotProps.data.vaiTro === 'NHANVIEN'" class="flex items-center gap-2">
                            <i class="pi pi-users text-green-500"></i>
                            <span>NV: {{ getLinkedEmployeeInfo(slotProps.data.id) }}</span>
                        </div>
                        <div v-else class="flex items-center gap-2">
                            <i class="pi pi-crown text-yellow-500"></i>
                            <span>Admin hệ thống</span>
                        </div>
                        <div class="text-xs text-gray-500">
                            Tạo: {{ formatDate(slotProps.data.ngayTao) }}
                        </div>
                    </div>
                </template>
            </Column>
            
            <Column field="ngayTao" header="Ngày tạo" sortable style="width: 10rem">
                <template #body="slotProps">
                    <span class="text-sm">{{ formatDate(slotProps.data.ngayTao) }}</span>
                </template>
            </Column>
            
            <Column :exportable="false" style="width: 16rem">
                <template #body="slotProps">
                    <div class="flex gap-1">
                        <Button 
                            icon="pi pi-eye" 
                            outlined 
                            size="small" 
                            @click="viewAccount(slotProps.data)" 
                            title="Xem chi tiết" 
                        />
                        <Button 
                            icon="pi pi-pencil" 
                            outlined 
                            size="small" 
                            @click="editAccount(slotProps.data)" 
                            title="Sửa" 
                        />
                        <Button 
                            icon="pi pi-refresh" 
                            outlined 
                            severity="secondary" 
                            size="small" 
                            @click="handleChangeStatus(slotProps.data)" 
                            :title="slotProps.data.trangThai === 1 ? 'Ngưng hoạt động' : 'Kích hoạt'" 
                        />
                        <Button 
                            icon="pi pi-trash" 
                            outlined 
                            severity="danger" 
                            size="small" 
                            @click="confirmDeleteAccount(slotProps.data)" 
                            title="Xóa" 
                        />
                    </div>
                </template>
            </Column>

            <template #empty>
                <div class="p-8 text-center">
                    <i class="pi pi-users text-gray-400 text-6xl mb-4"></i>
                    <h5 class="text-gray-600 mb-2">Không tìm thấy tài khoản</h5>
                    <p class="text-gray-500 mb-4">
                        {{ globalFilter ? 'Thử thay đổi từ khóa tìm kiếm hoặc thêm tài khoản mới.' : 'Thử thay đổi bộ lọc hoặc thêm tài khoản mới.' }}
                    </p>
                    <div class="flex gap-2 justify-center">
                        <Button
                            v-if="globalFilter"
                            label="Xóa tìm kiếm"
                            icon="pi pi-times"
                            outlined
                            @click="clearSearch"
                        />
                        <Button
                            label="Làm mới"
                            icon="pi pi-refresh"
                            outlined
                            @click="fetchData"
                        />
                        <Button
                            label="Thêm tài khoản"
                            icon="pi pi-plus"
                            @click="openNew"
                        />
                    </div>
                </div>
            </template>
        </DataTable>

        <!-- Add Account Dialog -->
        <Dialog v-model:visible="addDialog" :style="{ width: DIALOG_SIZES.EXTRA_LARGE }" header="Thêm tài khoản mới" :modal="true">
            <div class="flex flex-col gap-6">
                <!-- Chọn vai trò -->
                <div class="border-bottom pb-4">
                    <h5 class="mb-3 flex items-center gap-2">
                        <i class="pi pi-users"></i>
                        Chọn vai trò *
                    </h5>
                    <div class="mb-4">
                        <label for="vaiTro" class="mb-3 block font-bold">Vai trò *</label>
                        <Select
                            id="vaiTro"
                            v-model="newAccount.vaiTro"
                            :options="ROLE_OPTIONS_FOR_FORM"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Chọn vai trò"
                            :invalid="hasValidationError('vaiTro')"
                            fluid
                            @change="onRoleChange"
                        />
                        <small v-if="hasValidationError('vaiTro')" class="text-red-500">
                            {{ getValidationError('vaiTro') }}
                        </small>
                    </div>
                </div>

                <!-- Thông tin cá nhân (chỉ hiện khi không phải Admin) -->
                <div v-if="newAccount.vaiTro && newAccount.vaiTro !== 'ADMIN'" class="border-bottom pb-4">
                    <h5 class="mb-3 flex items-center gap-2">
                        <i class="pi pi-user"></i>
                        Thông tin {{ newAccount.vaiTro === 'USER' ? 'khách hàng' : 'nhân viên' }}
                    </h5>
                    
                    <!-- Thông tin cơ bản -->
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label for="hoTen" class="mb-3 block font-bold">Họ và tên *</label>
                            <InputText 
                                id="hoTen" 
                                v-model.trim="personalInfo.hoTen" 
                                required="true" 
                                :invalid="hasValidationError('hoTen')" 
                                fluid 
                                placeholder="Nhập họ và tên"
                                @input="clearFieldError('hoTen')"
                            />
                            <small v-if="hasValidationError('hoTen')" class="text-red-500">
                                {{ getValidationError('hoTen') }}
                            </small>
                        </div>
                        <div>
                            <label for="sdt" class="mb-3 block font-bold">Số điện thoại *</label>
                            <InputText 
                                id="sdt" 
                                v-model.trim="personalInfo.sdt" 
                                required="true" 
                                :invalid="hasValidationError('sdt')" 
                                fluid 
                                placeholder="Nhập số điện thoại"
                                @input="clearFieldError('sdt')"
                            />
                            <small v-if="hasValidationError('sdt')" class="text-red-500">
                                {{ getValidationError('sdt') }}
                            </small>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label for="personalEmail" class="mb-3 block font-bold">Email *</label>
                            <InputText 
                                id="personalEmail" 
                                v-model.trim="personalInfo.email" 
                                required="true" 
                                :invalid="hasValidationError('email')" 
                                fluid 
                                placeholder="Nhập email"
                                @input="syncEmailToAccount"
                            />
                            <small v-if="hasValidationError('email')" class="text-red-500">
                                {{ getValidationError('email') }}
                            </small>
                        </div>
                        <div v-if="newAccount.vaiTro === 'USER'">
                            <label for="ngaySinh" class="mb-3 block font-bold">Ngày sinh</label>
                            <DatePicker 
                                id="ngaySinh" 
                                v-model="personalInfo.ngaySinh" 
                                dateFormat="dd/mm/yy" 
                                fluid 
                                placeholder="Chọn ngày sinh"
                                :maxDate="new Date()"
                                showIcon
                            />
                        </div>
                        <div v-if="newAccount.vaiTro === 'NHANVIEN'">
                            <label for="chucVu" class="mb-3 block font-bold">Chức vụ</label>
                            <InputText 
                                id="chucVu" 
                                v-model.trim="personalInfo.chucVu" 
                                fluid 
                                placeholder="Nhập chức vụ"
                            />
                        </div>
                    </div>

                    <!-- Địa chỉ với API tích hợp -->
                    <div class="mt-4">
                        <label class="mb-3 block font-bold flex items-center gap-1">
                            <i class="pi pi-map-marker"></i>
                            Địa chỉ
                        </label>
                        
                        <!-- Tỉnh/Thành phố -->
                        <div class="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label class="mb-2 block text-sm font-medium">Tỉnh/Thành phố</label>
                                <Select
                                    v-model="personalInfo.maTinh"
                                    :options="provinces"
                                    optionLabel="name"
                                    optionValue="code"
                                    placeholder="Chọn Tỉnh/TP"
                                    :loading="loadingProvinces"
                                    @change="onProvinceChange"
                                    :invalid="hasValidationError('maTinh')"
                                    fluid
                                    showClear
                                />
                                <small v-if="hasValidationError('maTinh')" class="text-red-500">
                                    {{ getValidationError('maTinh') }}
                                </small>
                            </div>
                            
                            <!-- Xã/Phường -->
                            <div>
                                <label class="mb-2 block text-sm font-medium">Xã/Phường</label>
                                <Select
                                    v-model="personalInfo.maPhuong"
                                    :options="wards"
                                    optionLabel="name"
                                    optionValue="code"
                                    placeholder="Chọn Xã/Phường"
                                    :disabled="!personalInfo.maTinh"
                                    :loading="loadingWards"
                                    @change="onWardChange"
                                    :invalid="hasValidationError('maPhuong')"
                                    fluid
                                    showClear
                                />
                                <small v-if="hasValidationError('maPhuong')" class="text-red-500">
                                    {{ getValidationError('maPhuong') }}
                                </small>
                            </div>
                        </div>
                        
                        <!-- Địa chỉ chi tiết -->
                        <div class="mb-3">
                            <label class="mb-2 block text-sm font-medium">Địa chỉ chi tiết</label>
                            <InputText
                                v-model.trim="personalInfo.diaChiChiTiet"
                                placeholder="Số nhà, tên đường, ngõ..."
                                @input="updateFullAddress"
                                fluid
                            />
                        </div>
                        
                        <!-- Hiển thị địa chỉ đầy đủ -->
                        <div v-if="personalInfo.fullAddress" class="rounded bg-green-50 p-3 border border-green-200">
                            <label class="mb-1 block text-sm font-bold text-green-800 flex items-center gap-1">
                                <i class="pi pi-check-circle"></i>
                                Địa chỉ đầy đủ:
                            </label>
                            <p class="text-green-700 font-medium">{{ personalInfo.fullAddress }}</p>
                        </div>
                    </div>
                </div>

                <!-- Thông tin tài khoản -->
                <div class="border-bottom pb-4">
                    <h5 class="mb-3 flex items-center gap-2">
                        <i class="pi pi-lock"></i>
                        Thông tin đăng nhập
                    </h5>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="maTaiKhoan" class="mb-3 block font-bold">Mã tài khoản</label>
                            <InputText 
                                id="maTaiKhoan" 
                                v-model="newAccount.maTaiKhoan" 
                                placeholder="Để trống để tự tạo" 
                                fluid 
                            />
                            <small class="text-muted">Nếu để trống, hệ thống sẽ tự động tạo mã</small>
                        </div>
                        <div>
                            <label for="email" class="mb-3 block font-bold">Email đăng nhập *</label>
                            <InputText 
                                id="email" 
                                v-model.trim="newAccount.email" 
                                required="true" 
                                :invalid="hasValidationError('accountEmail')" 
                                :readonly="newAccount.vaiTro !== 'ADMIN'"
                                fluid 
                                placeholder="Email để đăng nhập"
                                @input="clearFieldError('accountEmail')"
                            />
                            <small v-if="hasValidationError('accountEmail')" class="text-red-500">
                                {{ getValidationError('accountEmail') }}
                            </small>
                            <small v-if="newAccount.vaiTro !== 'ADMIN'" class="text-muted">
                                Email tự động lấy từ thông tin cá nhân
                            </small>
                        </div>
                    </div>
                    <div class="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <label for="matKhau" class="mb-3 block font-bold">Mật khẩu *</label>
                            <Password 
                                id="matKhau" 
                                v-model="newAccount.matKhau" 
                                :required="true" 
                                :invalid="hasValidationError('matKhau')" 
                                toggleMask 
                                fluid
                                placeholder="Nhập mật khẩu"
                                @input="clearFieldError('matKhau')"
                            >
                                <template #header>
                                    <h6>Nhập mật khẩu</h6>
                                </template>
                                <template #footer>
                                    <Divider />
                                    <p class="mt-2">Yêu cầu</p>
                                    <ul class="ml-2 mt-0 pl-2" style="line-height: 1.5">
                                        <li>Ít nhất một chữ thường</li>
                                        <li>Ít nhất một chữ hoa</li>
                                        <li>Ít nhất một số</li>
                                        <li>Tối thiểu 8 ký tự</li>
                                    </ul>
                                </template>
                            </Password>
                            <small v-if="hasValidationError('matKhau')" class="text-red-500">
                                {{ getValidationError('matKhau') }}
                            </small>
                        </div>
                        <div>
                            <label for="trangThai" class="mb-3 block font-bold">Trạng thái *</label>
                            <Select 
                                id="trangThai" 
                                v-model="newAccount.trangThai" 
                                :options="STATUS_OPTIONS_FOR_FORM" 
                                optionLabel="label" 
                                optionValue="value" 
                                placeholder="Chọn trạng thái" 
                                :invalid="hasValidationError('trangThai')" 
                                fluid 
                            />
                            <small v-if="hasValidationError('trangThai')" class="text-red-500">
                                {{ getValidationError('trangThai') }}
                            </small>
                        </div>
                    </div>
                </div>

                <!-- Thông báo cho Admin -->
                <div v-if="newAccount.vaiTro === 'ADMIN'" class="rounded-lg bg-blue-50 p-4">
                    <div class="flex items-center gap-3">
                        <i class="pi pi-info-circle text-xl text-blue-600"></i>
                        <div>
                            <h6 class="mb-1 text-blue-700">Tài khoản Admin</h6>
                            <p class="mb-0 text-sm text-blue-600">
                                Tài khoản Admin chỉ cần thông tin đăng nhập cơ bản, không cần thông tin cá nhân và địa chỉ.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-between items-center w-full">
                    <div class="flex gap-2">
                        <Button 
                            v-if="Object.keys(validationErrors).length > 0" 
                            label="Làm mới" 
                            icon="pi pi-refresh" 
                            text 
                            severity="secondary"
                            @click="refreshFormAfterError" 
                            :disabled="saving"
                            title="Xóa các lỗi validation để thử lại"
                        />
                    </div>
                    <div class="flex gap-2">
                        <Button label="Hủy" icon="pi pi-times" text @click="hideAddDialog" :disabled="saving" />
                        <Button label="Lưu" icon="pi pi-check" @click="handleSaveAccount" :loading="saving" />
                    </div>
                </div>
            </template>
        </Dialog>

        <!-- Edit Account Dialog -->
        <Dialog v-model:visible="editDialog" :style="{ width: DIALOG_SIZES.MEDIUM }" header="Cập nhật tài khoản" :modal="true">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="editEmail" class="mb-3 block font-bold">Email *</label>
                    <InputText 
                        id="editEmail" 
                        v-model.trim="editAccountData.email" 
                        required="true" 
                        :invalid="hasValidationError('editEmail')" 
                        fluid 
                    />
                    <small v-if="hasValidationError('editEmail')" class="text-red-500">
                        {{ getValidationError('editEmail') }}
                    </small>
                </div>
                <div>
                    <label for="editMatKhau" class="mb-3 block font-bold">Mật khẩu mới</label>
                    <Password 
                        id="editMatKhau" 
                        v-model="editAccountData.matKhau" 
                        placeholder="Để trống nếu không đổi" 
                        toggleMask 
                        fluid 
                    />
                    <small class="text-muted">Để trống nếu không muốn thay đổi mật khẩu</small>
                </div>
                <div>
                    <label for="editVaiTro" class="mb-3 block font-bold">Vai trò *</label>
                    <Select 
                        id="editVaiTro" 
                        v-model="editAccountData.vaiTro" 
                        :options="ROLE_OPTIONS_FOR_FORM" 
                        optionLabel="label" 
                        optionValue="value" 
                        placeholder="Chọn vai trò" 
                        :invalid="hasValidationError('editVaiTro')" 
                        fluid 
                    />
                    <small v-if="hasValidationError('editVaiTro')" class="text-red-500">
                        {{ getValidationError('editVaiTro') }}
                    </small>
                </div>
                <div>
                    <label for="editTrangThai" class="mb-3 block font-bold">Trạng thái *</label>
                    <Select
                        id="editTrangThai"
                        v-model="editAccountData.trangThai"
                        :options="STATUS_OPTIONS_FOR_FORM"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Chọn trạng thái"
                        :invalid="hasValidationError('editTrangThai')"
                        fluid
                    />
                    <small v-if="hasValidationError('editTrangThai')" class="text-red-500">
                        {{ getValidationError('editTrangThai') }}
                    </small>
                </div>
            </div>
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideEditDialog" :disabled="saving" />
                <Button label="Cập nhật" icon="pi pi-check" @click="handleUpdateAccount" :loading="saving" />
            </template>
        </Dialog>

        <!-- View Account Dialog với hiển thị mật khẩu cho Admin -->
        <Dialog v-model:visible="viewDialog" :style="{ width: DIALOG_SIZES.LARGE }" :header="`Chi tiết tài khoản - ${viewingAccount?.email || 'N/A'}`" :modal="true">
            <div v-if="viewingAccount" class="flex flex-col gap-6">
                <!-- Thông tin tài khoản -->
                <div class="rounded-lg bg-blue-50 p-4 border border-blue-200">
                    <h6 class="mb-3 font-semibold text-blue-700 flex items-center gap-2">
                        <i class="pi pi-user"></i>
                        Thông tin tài khoản:
                    </h6>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>ID:</strong> #{{ viewingAccount.id }}</div>
                        <div><strong>Mã TK:</strong> {{ viewingAccount.maTaiKhoan }}</div>
                        <div><strong>Email:</strong> {{ viewingAccount.email }}</div>
                        <div>
                            <strong>Vai trò:</strong>
                            <Tag 
                                :value="getRoleLabel(viewingAccount.vaiTro)" 
                                :severity="getRoleSeverity(viewingAccount.vaiTro)" 
                                class="ml-2"
                            />
                        </div>
                        <div>
                            <strong>Trạng thái:</strong>
                            <Tag 
                                :value="getStatusLabel(viewingAccount.trangThai)" 
                                :severity="getStatusSeverity(viewingAccount.trangThai)" 
                                class="ml-2"
                            />
                        </div>
                        <div><strong>Ngày tạo:</strong> {{ formatDate(viewingAccount.ngayTao) }}</div>
                        <div><strong>Cập nhật:</strong> {{ formatDate(viewingAccount.ngayCapNhat) }}</div>
                        <!-- Hiển thị mật khẩu cho Admin -->
                        <div v-if="isAdmin" class="col-span-2">
                            <strong>Mật khẩu:</strong> 
                            <div class="flex items-center gap-2 mt-1">
                                <InputText 
                                    :value="showPassword ? viewingAccount.matKhau || 'Không có dữ liệu' : '••••••••'" 
                                    readonly 
                                    class="flex-1"
                                />
                                <Button 
                                    :icon="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
                                    size="small"
                                    text
                                    @click="togglePassword"
                                    :title="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                                />
                            </div>
                            <small class="text-gray-500">Chỉ Admin mới được xem mật khẩu</small>
                        </div>
                    </div>
                </div>

                <!-- Thông tin liên kết -->
                <div class="rounded-lg bg-green-50 p-4 border border-green-200">
                    <h6 class="mb-3 font-semibold text-green-700 flex items-center gap-2">
                        <i class="pi pi-link"></i>
                        Thông tin liên kết:
                    </h6>
                    <div class="text-sm">
                        <div v-if="viewingAccount.vaiTro === 'USER'">
                            <strong>Khách hàng:</strong> {{ getLinkedCustomerInfo(viewingAccount.id) }}
                        </div>
                        <div v-else-if="viewingAccount.vaiTro === 'NHANVIEN'">
                            <strong>Nhân viên:</strong> {{ getLinkedEmployeeInfo(viewingAccount.id) }}
                        </div>
                        <div v-else>
                            <strong>Vai trò:</strong> Admin hệ thống (không liên kết)
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Đóng" icon="pi pi-times" text @click="viewDialog = false" />
                <Button label="Sửa" icon="pi pi-pencil" @click="editFromView" />
            </template>
        </Dialog>

        <!-- Delete Dialogs -->
        <Dialog v-model:visible="deleteAccountDialog" :style="{ width: DIALOG_SIZES.SMALL }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
                <span v-if="selectedAccountForDelete">
                    Bạn có chắc chắn muốn xóa tài khoản <b>{{ selectedAccountForDelete.email }}</b>?
                    <br><small class="text-red-600">Hành động này sẽ xóa tất cả dữ liệu liên quan.</small>
                </span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteAccountDialog = false" :disabled="deleting" />
                <Button label="Có" icon="pi pi-check" severity="danger" @click="handleDeleteAccount" :loading="deleting" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteAccountsDialog" :style="{ width: DIALOG_SIZES.SMALL }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
                <span>
                    Bạn có chắc chắn muốn xóa {{ selectedAccounts?.length }} tài khoản đã chọn?
                    <br><small class="text-red-600">Hành động này sẽ xóa tất cả dữ liệu liên quan.</small>
                </span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteAccountsDialog = false" :disabled="deleting" />
                <Button label="Có" icon="pi pi-check" severity="danger" @click="handleDeleteSelectedAccounts" :loading="deleting" />
            </template>
        </Dialog>

        <Toast />
    </div>
</template>

<script setup>
import axios from 'axios'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

// Constants
const STATUS_OPTIONS = [
    { label: 'Tất cả trạng thái', value: null },
    { label: 'Hoạt động', value: 1 },
    { label: 'Ngưng hoạt động', value: 0 }
]

// FIXED: Thêm STATUS_OPTIONS_FOR_FORM
const STATUS_OPTIONS_FOR_FORM = [
    { label: 'Hoạt động', value: 1 },
    { label: 'Ngưng hoạt động', value: 0 }
]

const ROLE_FILTER_OPTIONS = [
    { label: 'Tất cả vai trò', value: null },
    { label: 'Khách hàng', value: 'USER' },
    { label: 'Nhân viên', value: 'NHANVIEN' },
    { label: 'Admin', value: 'ADMIN' }
]

const ROLE_OPTIONS_FOR_FORM = [
    { label: 'Khách hàng', value: 'USER' },
    { label: 'Nhân viên', value: 'NHANVIEN' },
    { label: 'Admin', value: 'ADMIN' }
]

const PAGINATION_CONFIG = {
    defaultRows: 10,
    rowsPerPageOptions: [5, 10, 25, 50],
    paginatorTemplate: "FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
}

const DIALOG_SIZES = {
    SMALL: '450px',
    MEDIUM: '600px',
    LARGE: '800px',
    EXTRA_LARGE: '1000px'
}

// ===== COMPOSABLES =====
const router = useRouter()
const toast = useToast()

// ===== REACTIVE STATE =====
const dt = ref()
const accounts = ref([])
const customers = ref([])
const employees = ref([])
const selectedAccounts = ref()
const isLoading = ref(false)
const addDialog = ref(false)
const editDialog = ref(false)
const viewDialog = ref(false)
const deleteAccountDialog = ref(false)
const deleteAccountsDialog = ref(false)

// FIXED: Thêm state cho hiển thị mật khẩu
const showPassword = ref(false)
const isAdmin = ref(true) // Giả sử user hiện tại là admin

const newAccount = ref({})
const personalInfo = ref({
    hoTen: '',
    email: '',
    sdt: '',
    maTinh: '',
    maPhuong: '',
    diaChiChiTiet: '',
    fullAddress: '',
    ngaySinh: null,
    chucVu: ''
})
const editAccountData = ref({})
const viewingAccount = ref(null)
const selectedAccountForDelete = ref(null)

const globalFilter = ref('')
const roleFilter = ref(null)
const statusFilter = ref(null)
const dateFilters = ref({
    startDate: null,
    endDate: null
})

const submitted = ref(false)
const saving = ref(false)
const deleting = ref(false)
const exporting = ref(false)
const validationErrors = ref({})

// Address data
const provinces = ref([])
const wards = ref([])
const loadingProvinces = ref(false)
const loadingWards = ref(false)

const lastCreatedAccountRole = ref('')

// ===== UTILITY FUNCTIONS =====
const formatDate = (date) => {
    if (!date) return ''
    
    try {
        const dateObj = new Date(date)
        if (isNaN(dateObj.getTime())) {
            console.warn('⚠️ Invalid date:', date)
            return 'Ngày không hợp lệ'
        }
        
        return dateObj.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric'
        })
    } catch (error) {
        console.error('❌ Error formatting date:', error)
        return 'Lỗi định dạng ngày'
    }
}

// FIXED: Thêm function toggle password
const togglePassword = () => {
    showPassword.value = !showPassword.value
}

const getStatusLabel = (status) => {
    return status === 1 ? 'Hoạt động' : 'Ngưng hoạt động'
}

const getStatusSeverity = (status) => {
    return status === 1 ? 'success' : 'danger'
}

const getStatusIcon = (status) => {
    return status === 1 ? 'pi pi-check-circle' : 'pi pi-times-circle'
}

const getRoleLabel = (vaiTro) => {
    switch (vaiTro) {
        case 'USER': return 'Khách hàng'
        case 'NHANVIEN': return 'Nhân viên'
        case 'ADMIN': return 'Admin'
        default: return 'Không xác định'
    }
}

const getRoleSeverity = (vaiTro) => {
    switch (vaiTro) {
        case 'USER': return 'primary'
        case 'NHANVIEN': return 'success'
        case 'ADMIN': return 'warn'
        default: return 'secondary'
    }
}

const getRoleIcon = (vaiTro) => {
    switch (vaiTro) {
        case 'USER': return 'pi pi-user'
        case 'NHANVIEN': return 'pi pi-user-edit'
        case 'ADMIN': return 'pi pi-crown'
        default: return 'pi pi-question'
    }
}

const getActiveAccountsCount = () => {
    return accounts.value.filter(acc => acc.trangThai === 1).length
}

const getInactiveAccountsCount = () => {
    return accounts.value.filter(acc => acc.trangThai === 0).length
}

const getLinkedCustomerInfo = (accountId) => {
    const customer = customers.value.find(c => c.idTaiKhoan === accountId)
    return customer ? `${customer.hoTen} (ID: ${customer.id})` : 'Chưa liên kết'
}

const getLinkedEmployeeInfo = (accountId) => {
    const employee = employees.value.find(e => e.idTaiKhoan === accountId)
    return employee ? `${employee.hoTen} (ID: ${employee.id})` : 'Chưa liên kết'
}

const navigateToRolePage = (role) => {
    console.log('🔄 Navigating to page for role:', role)
    
    try {
        switch (role) {
            case 'USER':
                router.push('/khach-hang')
                break
            case 'NHANVIEN':
                router.push('/nhan-vien')
                break
            case 'ADMIN':
                toast.add({
                    severity: 'info',
                    summary: 'Thông tin',
                    detail: 'Tài khoản Admin đã được tạo thành công',
                    life: 3000
                })
                break
            default:
                console.warn('Unknown role:', role)
        }
    } catch (error) {
        console.error('❌ Error navigating:', error)
        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Không thể chuyển trang, vui lòng điều hướng thủ công',
            life: 4000
        })
    }
}

// ===== COMPUTED =====
const filteredAccounts = computed(() => {
    let filtered = accounts.value || []

    // Tìm kiếm toàn bộ
    if (globalFilter.value && globalFilter.value.trim()) {
        const searchTerm = globalFilter.value.toLowerCase().trim()
        filtered = filtered.filter(acc => 
            (acc.email && acc.email.toLowerCase().includes(searchTerm)) ||
            (acc.maTaiKhoan && acc.maTaiKhoan.toLowerCase().includes(searchTerm)) ||
            getRoleLabel(acc.vaiTro).toLowerCase().includes(searchTerm) ||
            getStatusLabel(acc.trangThai).toLowerCase().includes(searchTerm)
        )
    }

    // Lọc vai trò
    if (roleFilter.value !== null && roleFilter.value !== undefined && roleFilter.value !== '') {
        filtered = filtered.filter(acc => acc.vaiTro === roleFilter.value)
    }

    // Lọc trạng thái
    if (statusFilter.value !== null && statusFilter.value !== undefined && statusFilter.value !== '') {
        const statusValue = parseInt(statusFilter.value)
        if (!isNaN(statusValue)) {
            filtered = filtered.filter(acc => acc.trangThai === statusValue)
        }
    }

    // Lọc theo ngày
    if (dateFilters.value.startDate || dateFilters.value.endDate) {
        filtered = filtered.filter(acc => {
            if (!acc.ngayTao) return false
            
            const accDate = new Date(acc.ngayTao)
            if (isNaN(accDate.getTime())) return false
            
            const accDateOnly = new Date(accDate.getFullYear(), accDate.getMonth(), accDate.getDate())
            
            if (dateFilters.value.startDate) {
                const startDateOnly = new Date(
                    dateFilters.value.startDate.getFullYear(), 
                    dateFilters.value.startDate.getMonth(), 
                    dateFilters.value.startDate.getDate()
                )
                if (accDateOnly < startDateOnly) return false
            }
            
            if (dateFilters.value.endDate) {
                const endDateOnly = new Date(
                    dateFilters.value.endDate.getFullYear(), 
                    dateFilters.value.endDate.getMonth(), 
                    dateFilters.value.endDate.getDate()
                )
                if (accDateOnly > endDateOnly) return false
            }
            
            return true
        })
    }

    return filtered
})

const hasValidationError = (field) => {
    return Boolean(validationErrors.value[field])
}

const getValidationError = (field) => {
    return validationErrors.value[field] || ''
}

// ===== DATA MANAGEMENT =====
const fetchData = async () => {
    isLoading.value = true
    try {
        const [accountsResponse, customersResponse, employeesResponse] = await Promise.all([
            axios.get('http://localhost:8080/api/tai-khoan?size=1000'),
            axios.get('http://localhost:8080/api/khach-hang').catch(() => ({ data: [] })),
            axios.get('http://localhost:8080/api/nhan-vien').catch(() => ({ data: [] }))
        ])
        
        accounts.value = Array.isArray(accountsResponse.data) ? accountsResponse.data : []
        
        if (customersResponse.data) {
            if (Array.isArray(customersResponse.data)) {
                customers.value = customersResponse.data
            } else if (customersResponse.data.content) {
                customers.value = customersResponse.data.content
            } else {
                customers.value = []
            }
        } else {
            customers.value = []
        }
        
        if (employeesResponse.data) {
            if (Array.isArray(employeesResponse.data)) {
                employees.value = employeesResponse.data
            } else if (employeesResponse.data.content) {
                employees.value = employeesResponse.data.content
            } else {
                employees.value = []
            }
        } else {
            employees.value = []
        }
        
    } catch (error) {
        console.error('❌ Error fetching data:', error)
        toast.add({
            severity: 'error',
            summary: 'Lỗi kết nối',
            detail: `Không thể tải dữ liệu: ${error.message}`,
            life: 5000
        })
        accounts.value = []
        customers.value = []
        employees.value = []
    } finally {
        isLoading.value = false
    }
}

// ===== ADDRESS MANAGEMENT =====
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
            provinces.value = [
                { code: '1', name: 'Hà Nội', codename: 'ha_noi' },
                { code: '79', name: 'TP. Hồ Chí Minh', codename: 'ho_chi_minh' },
                { code: '48', name: 'Đà Nẵng', codename: 'da_nang' },
                { code: '92', name: 'Cần Thơ', codename: 'can_tho' }
            ]
        }
    } catch (error) {
        console.error('❌ Error fetching provinces:', error)
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
    
    try {
        loadingWards.value = true
        const response = await axios.get(`http://localhost:8080/api/vietnam-address/wards/${provinceCode}`)
        
        if (response.data && response.data.success && response.data.data) {
            wards.value = response.data.data.map(item => ({
                code: item.code.toString(),
                name: item.name,
                codename: item.codename
            }))
        } else {
            wards.value = getFallbackWards()
        }
    } catch (error) {
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

const onProvinceChange = async () => {
    personalInfo.value.maPhuong = ''
    wards.value = []
    
    if (personalInfo.value.maTinh) {
        await fetchWards(personalInfo.value.maTinh)
    }
    updateFullAddress()
}

const onWardChange = () => {
    updateFullAddress()
}

const updateFullAddress = () => {
    const provinceName = provinces.value.find(p => p.code === personalInfo.value.maTinh)?.name || ''
    const wardName = wards.value.find(w => w.code === personalInfo.value.maPhuong)?.name || ''
    
    const addressParts = [
        personalInfo.value.diaChiChiTiet,
        wardName,
        provinceName
    ].filter(part => part && part.trim() !== '')
    
    personalInfo.value.fullAddress = addressParts.join(', ')
}

// ===== SEARCH AND FILTER =====
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

const debouncedSearch = debounce(() => {
    // Search is handled by computed filteredAccounts
}, 300)

const applyFilters = () => {
    if (dateFilters.value.startDate && dateFilters.value.endDate) {
        if (dateFilters.value.startDate > dateFilters.value.endDate) {
            toast.add({
                severity: 'warn',
                summary: 'Lỗi ngày tháng',
                detail: 'Ngày bắt đầu không thể lớn hơn ngày kết thúc',
                life: 3000
            })
            const temp = dateFilters.value.startDate
            dateFilters.value.startDate = dateFilters.value.endDate
            dateFilters.value.endDate = temp
        }
    }
}

const resetFilters = () => {
    globalFilter.value = ''
    roleFilter.value = null
    statusFilter.value = null
    dateFilters.value = {
        startDate: null,
        endDate: null
    }
}

const clearSearch = () => {
    globalFilter.value = ''
}

// ===== DIALOG MANAGEMENT =====
const openNew = () => {
    resetForms()
    addDialog.value = true
    fetchProvinces()
}

const resetForms = () => {
    newAccount.value = {
        maTaiKhoan: '',
        email: '',
        matKhau: '',
        vaiTro: undefined,
        trangThai: 1
    }
    
    personalInfo.value = {
        hoTen: '',
        email: '',
        sdt: '',
        maTinh: '',
        maPhuong: '',
        diaChiChiTiet: '',
        fullAddress: '',
        ngaySinh: null,
        chucVu: ''
    }
    
    wards.value = []
    submitted.value = false
    validationErrors.value = {}
    showPassword.value = false
}

const refreshFormAfterError = () => {
    validationErrors.value = {}
    submitted.value = false
}

const onRoleChange = () => {
    personalInfo.value = {
        hoTen: '',
        email: '',
        sdt: '',
        maTinh: '',
        maPhuong: '',
        diaChiChiTiet: '',
        fullAddress: '',
        ngaySinh: null,
        chucVu: ''
    }
    
    wards.value = []
    validationErrors.value = {}
    
    if (newAccount.value.vaiTro === 'ADMIN') {
        newAccount.value.email = ''
    }
}

const syncEmailToAccount = () => {
    newAccount.value.email = personalInfo.value.email
    
    if (validationErrors.value.email) {
        delete validationErrors.value.email
    }
    if (validationErrors.value.accountEmail) {
        delete validationErrors.value.accountEmail
    }
}

const clearFieldError = (fieldName) => {
    if (validationErrors.value[fieldName]) {
        delete validationErrors.value[fieldName]
    }
}

const hideAddDialog = () => {
    addDialog.value = false
    resetForms()
}

const hideEditDialog = () => {
    editDialog.value = false
    submitted.value = false
    validationErrors.value = {}
}

const viewAccount = (account) => {
    viewingAccount.value = { ...account }
    showPassword.value = false
    viewDialog.value = true
}

const editAccount = (account) => {
    editAccountData.value = {
        id: account.id,
        email: account.email,
        matKhau: '',
        vaiTro: account.vaiTro,
        trangThai: account.trangThai
    }
    submitted.value = false
    validationErrors.value = {}
    editDialog.value = true
}

const editFromView = () => {
    editAccount(viewingAccount.value)
    viewDialog.value = false
}

const confirmDeleteAccount = (account) => {
    selectedAccountForDelete.value = account
    deleteAccountDialog.value = true
}

const confirmDeleteSelected = () => {
    deleteAccountsDialog.value = true
}

// ===== VALIDATION =====
const checkEmailExists = (email, excludeId = null) => {
    return accounts.value.some(account => 
        account.email.toLowerCase() === email.toLowerCase() && account.id !== excludeId
    )
}

const validateForm = () => {
    validationErrors.value = {}
    
    // Validate vai trò
    if (!newAccount.value.vaiTro) {
        validationErrors.value.vaiTro = 'Vui lòng chọn vai trò'
    }
    
    // Validate email với kiểm tra nâng cao
    if (!newAccount.value.email?.trim()) {
        validationErrors.value.accountEmail = 'Email không được để trống'
    } else {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!emailRegex.test(newAccount.value.email.trim())) {
            validationErrors.value.accountEmail = 'Email không hợp lệ'
        } else if (checkEmailExists(newAccount.value.email)) {
            validationErrors.value.accountEmail = 'Email đã tồn tại trong hệ thống'
        }
    }
    
    // Validate mật khẩu với kiểm tra độ mạnh
    if (!newAccount.value.matKhau?.trim()) {
        validationErrors.value.matKhau = 'Mật khẩu không được để trống'
    } else if (newAccount.value.matKhau.length < 6) {
        validationErrors.value.matKhau = 'Mật khẩu phải có ít nhất 6 ký tự'
    } else if (newAccount.value.matKhau.length > 50) {
        validationErrors.value.matKhau = 'Mật khẩu không được quá 50 ký tự'
    }
    
    // Validate trạng thái
    if (newAccount.value.trangThai === undefined || newAccount.value.trangThai === null) {
        validationErrors.value.trangThai = 'Vui lòng chọn trạng thái'
    }
    
    // Validate thông tin cá nhân cho các vai trò không phải admin
    if (newAccount.value.vaiTro && newAccount.value.vaiTro !== 'ADMIN') {
        // Validate họ tên với pattern tiếng Việt
        if (!personalInfo.value.hoTen?.trim()) {
            validationErrors.value.hoTen = 'Họ tên không được để trống'
        } else if (personalInfo.value.hoTen.trim().length < 2) {
            validationErrors.value.hoTen = 'Họ tên phải có ít nhất 2 ký tự'
        } else if (personalInfo.value.hoTen.trim().length > 100) {
            validationErrors.value.hoTen = 'Họ tên không được quá 100 ký tự'
        } else if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂưăạảấầẩẫậắằẳẵặẹẻẽếềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/.test(personalInfo.value.hoTen.trim())) {
            validationErrors.value.hoTen = 'Họ tên chỉ được chứa chữ cái và khoảng trắng'
        }
        
        // Validate email cá nhân
        if (!personalInfo.value.email?.trim()) {
            validationErrors.value.email = 'Email không được để trống'
        } else {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
            if (!emailRegex.test(personalInfo.value.email.trim())) {
                validationErrors.value.email = 'Email không hợp lệ'
            }
        }
        
        // Validate số điện thoại Việt Nam
        if (!personalInfo.value.sdt?.trim()) {
            validationErrors.value.sdt = 'Số điện thoại không được để trống'
        } else {
            const phoneRegex = /^0\d{9,10}$/
            const cleanPhone = personalInfo.value.sdt.replace(/\s/g, '')
            if (!phoneRegex.test(cleanPhone)) {
                validationErrors.value.sdt = 'Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)'
            }
        }
    }
    
    return Object.keys(validationErrors.value).length === 0
}

// ===== CRUD OPERATIONS =====
const handleSaveAccount = async () => {
    submitted.value = true
    saving.value = true
    
    try {
        if (!validateForm()) {
            toast.add({
                severity: 'warn',
                summary: 'Dữ liệu không hợp lệ',
                detail: 'Vui lòng kiểm tra và sửa các lỗi được đánh dấu',
                life: 4000
            })
            return
        }
        
        updateFullAddress()
        lastCreatedAccountRole.value = newAccount.value.vaiTro
        
        // Chuẩn bị dữ liệu theo format backend mong đợi
        const accountData = {
            email: newAccount.value.email.trim(),
            matKhau: newAccount.value.matKhau,
            vaiTroString: newAccount.value.vaiTro,
            trangThai: newAccount.value.trangThai
        }
        
        // Thêm mã tài khoản nếu có
        if (newAccount.value.maTaiKhoan && newAccount.value.maTaiKhoan.trim()) {
            accountData.maTaiKhoan = newAccount.value.maTaiKhoan.trim()
        }
        
        // Thêm thông tin cá nhân cho non-admin
        if (newAccount.value.vaiTro !== 'ADMIN') {
            accountData.hoTen = personalInfo.value.hoTen.trim()
            accountData.sdt = personalInfo.value.sdt.replace(/\s/g, '') // Remove spaces from phone
            
            // Thêm thông tin địa chỉ
            if (personalInfo.value.maTinh) {
                accountData.maTinh = personalInfo.value.maTinh
                accountData.tenTinh = provinces.value.find(p => p.code === personalInfo.value.maTinh)?.name || ''
            }
            if (personalInfo.value.maPhuong) {
                accountData.maPhuong = personalInfo.value.maPhuong
                accountData.tenPhuong = wards.value.find(w => w.code === personalInfo.value.maPhuong)?.name || ''
            }
            if (personalInfo.value.diaChiChiTiet) {
                accountData.diaChiChiTiet = personalInfo.value.diaChiChiTiet.trim()
            }
            
            // Thêm ngày sinh cho USER
            if (newAccount.value.vaiTro === 'USER' && personalInfo.value.ngaySinh) {
                accountData.ngaySinh = personalInfo.value.ngaySinh.toISOString().split('T')[0]
            }
            
            // Thêm chức vụ cho NHANVIEN
            if (newAccount.value.vaiTro === 'NHANVIEN' && personalInfo.value.chucVu) {
                accountData.chucVu = personalInfo.value.chucVu.trim()
            }
        }
        
        console.log('Sending account data:', accountData)
        
        const response = await axios.post('http://localhost:8080/api/tai-khoan', accountData, {
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 15000
        })
        
        if (response.status === 201 || response.status === 200) {
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Tài khoản ${getRoleLabel(newAccount.value.vaiTro).toLowerCase()} đã được tạo thành công`,
                life: 4000
            })
            
            await fetchData()
            hideAddDialog()
            
            // Chuyển trang tùy theo vai trò
            setTimeout(() => {
                switch(lastCreatedAccountRole.value) {
                    case 'USER':
                        toast.add({
                            severity: 'info',
                            summary: 'Chuyển trang',
                            detail: 'Đang chuyển đến trang quản lý khách hàng...',
                            life: 2000
                        })
                        setTimeout(() => navigateToRolePage('USER'), 2000)
                        break
                    case 'NHANVIEN':
                        toast.add({
                            severity: 'info',
                            summary: 'Chuyển trang',
                            detail: 'Đang chuyển đến trang quản lý nhân viên...',
                            life: 2000
                        })
                        setTimeout(() => navigateToRolePage('NHANVIEN'), 2000)
                        break
                    case 'ADMIN':
                        toast.add({
                            severity: 'info',
                            summary: 'Thông tin',
                            detail: 'Tài khoản Admin đã được tạo thành công',
                            life: 3000
                        })
                        break
                }
            }, 1000)
        }
        
    } catch (error) {
        console.error('Lỗi tạo tài khoản:', error)
        handleApiError(error, 'Không thể tạo tài khoản')
    } finally {
        saving.value = false
    }
}
const handleDeleteSelectedAccounts = async () => {
    deleting.value = true
    
    try {
        const totalAccounts = selectedAccounts.value.length
        let successCount = 0
        let failedAccounts = []
        
        // Xóa từng tài khoản và track kết quả
        for (const account of selectedAccounts.value) {
            try {
                await axios.delete(`http://localhost:8080/api/tai-khoan/${account.id}`, {
                    timeout: 10000
                })
                successCount++
            } catch (error) {
                failedAccounts.push({
                    account: account,
                    error: error.response?.data?.message || error.message
                })
            }
        }
        
        // Hiển thị kết quả
        if (successCount === totalAccounts) {
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã xóa thành công ${successCount} tài khoản`,
                life: 3000
            })
        } else if (successCount > 0) {
            toast.add({
                severity: 'warn',
                summary: 'Hoàn thành một phần',
                detail: `Đã xóa ${successCount}/${totalAccounts} tài khoản. ${failedAccounts.length} tài khoản không thể xóa.`,
                life: 5000
            })
        } else {
            toast.add({
                severity: 'error',
                summary: 'Thất bại',
                detail: 'Không thể xóa tài khoản nào. Có thể do ràng buộc dữ liệu.',
                life: 5000
            })
        }
        
        deleteAccountsDialog.value = false
        selectedAccounts.value = null
        await fetchData()
        
    } catch (error) {
        console.error('Lỗi xóa nhiều tài khoản:', error)
        toast.add({
            severity: 'error',
            summary: 'Lỗi hệ thống',
            detail: 'Có lỗi xảy ra khi xóa tài khoản',
            life: 5000
        })
    } finally {
        deleting.value = false
    }
}

const handleUpdateAccount = async () => {
    submitted.value = true
    saving.value = true
    
    try {
        validationErrors.value = {}
        
        if (!editAccountData.value.email?.trim()) {
            validationErrors.value.editEmail = 'Email không được để trống'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editAccountData.value.email)) {
            validationErrors.value.editEmail = 'Email không hợp lệ'
        } else if (checkEmailExists(editAccountData.value.email, editAccountData.value.id)) {
            validationErrors.value.editEmail = 'Email đã tồn tại'
        }
        
        if (!editAccountData.value.vaiTro) {
            validationErrors.value.editVaiTro = 'Vui lòng chọn vai trò'
        }
        
        if (editAccountData.value.trangThai === undefined || editAccountData.value.trangThai === null) {
            validationErrors.value.editTrangThai = 'Vui lòng chọn trạng thái'
        }
        
        if (Object.keys(validationErrors.value).length > 0) {
            return
        }
        
        // FIXED: Gửi object đơn giản, không phải DTO
        const updateData = {
            email: editAccountData.value.email.trim(),
            vaiTroString: editAccountData.value.vaiTro, // Dùng vaiTroString
            trangThai: parseInt(editAccountData.value.trangThai)
        }
        
        // Chỉ thêm mật khẩu nếu có nhập
        if (editAccountData.value.matKhau && editAccountData.value.matKhau.trim()) {
            updateData.matKhau = editAccountData.value.matKhau.trim()
        }
        
        console.log('=== UPDATE ACCOUNT DEBUG ===')
        console.log('Account ID:', editAccountData.value.id)
        console.log('Update payload:', JSON.stringify(updateData, null, 2))
        
        const response = await axios.put(
            `http://localhost:8080/api/tai-khoan/${editAccountData.value.id}`, 
            updateData,
            {
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 10000
            }
        )
        
        console.log('✅ Update response:', response.data)
        
        if (response.status === 200) {
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Tài khoản đã được cập nhật',
                life: 3000
            })
            
            hideEditDialog()
            await fetchData()
        }
        
    } catch (error) {
        console.error('❌ Update error details:')
        console.error('Status:', error.response?.status)
        console.error('Data:', error.response?.data)
        console.error('Headers:', error.response?.headers)
        console.error('Full error:', error)
        
        // Xử lý lỗi cụ thể
        if (error.response) {
            const { status, data } = error.response
            
            switch (status) {
                case 400:
                    let errorMsg = 'Dữ liệu không hợp lệ'
                    if (data?.message) {
                        errorMsg = data.message
                    } else if (data?.error) {
                        errorMsg = data.error
                    }
                    
                    toast.add({
                        severity: 'error',
                        summary: 'Lỗi dữ liệu',
                        detail: errorMsg,
                        life: 5000
                    })
                    break
                    
                case 404:
                    toast.add({
                        severity: 'error',
                        summary: 'Không tìm thấy',
                        detail: 'Tài khoản không tồn tại',
                        life: 5000
                    })
                    break
                    
                case 409:
                    toast.add({
                        severity: 'error',
                        summary: 'Email trùng lặp',
                        detail: 'Email đã được sử dụng bởi tài khoản khác',
                        life: 5000
                    })
                    break
                    
                default:
                    toast.add({
                        severity: 'error',
                        summary: 'Lỗi server',
                        detail: `Mã lỗi: ${status}`,
                        life: 5000
                    })
            }
        } else {
            toast.add({
                severity: 'error',
                summary: 'Lỗi kết nối',
                detail: 'Không thể kết nối đến server',
                life: 5000
            })
        }
    } finally {
        saving.value = false
    }
}

const handleDeleteAccount = async () => {
    deleting.value = true
    try {
        console.log('Đang xóa tài khoản:', selectedAccountForDelete.value.id)
        
        const response = await axios.delete(
            `http://localhost:8080/api/tai-khoan/${selectedAccountForDelete.value.id}`,
            {
                timeout: 30000, // Tăng timeout cho operation xóa
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        )
        
        if (response.status === 200) {
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Tài khoản đã được xóa thành công',
                life: 3000
            })
            
            deleteAccountDialog.value = false
            selectedAccountForDelete.value = null
            await fetchData()
        }
        
    } catch (error) {
        console.error('Lỗi xóa tài khoản:', error)
        
        // XỬ LÝ LỖI CỤ THỂ CHO VIỆC XÓA
        if (error.response) {
            const { status, data } = error.response
            
            switch (status) {
                case 400:
                    if (data.errorCode === 'LAST_ADMIN') {
                        toast.add({
                            severity: 'warn',
                            summary: 'Không thể xóa',
                            detail: 'Không thể xóa admin cuối cùng trong hệ thống',
                            life: 5000
                        })
                    } else if (data.errorCode === 'DELETE_FORBIDDEN') {
                        toast.add({
                            severity: 'warn',
                            summary: 'Không thể xóa',
                            detail: data.message || 'Tài khoản này không thể bị xóa',
                            life: 5000
                        })
                    } else if (data.errorCode === 'INVALID_ID') {
                        toast.add({
                            severity: 'error',
                            summary: 'Lỗi dữ liệu',
                            detail: 'ID tài khoản không hợp lệ',
                            life: 5000
                        })
                    } else {
                        toast.add({
                            severity: 'error',
                            summary: 'Lỗi xóa',
                            detail: data.message || 'Dữ liệu không hợp lệ',
                            life: 5000
                        })
                    }
                    break
                    
                case 404:
                    toast.add({
                        severity: 'warn',
                        summary: 'Không tìm thấy',
                        detail: 'Tài khoản không tồn tại hoặc đã bị xóa',
                        life: 4000
                    })
                    // Refresh data vì có thể tài khoản đã bị xóa bởi user khác
                    await fetchData()
                    break
                    
                case 409:
                    if (data.errorCode === 'CONSTRAINT_VIOLATION') {
                        toast.add({
                            severity: 'error',
                            summary: 'Không thể xóa',
                            detail: 'Tài khoản đang có dữ liệu liên quan (khách hàng, nhân viên, đơn hàng...)',
                            life: 6000
                        })
                    } else {
                        toast.add({
                            severity: 'error',
                            summary: 'Xung đột dữ liệu',
                            detail: data.message || 'Không thể xóa do xung đột dữ liệu',
                            life: 5000
                        })
                    }
                    break
                    
                case 500:
                    toast.add({
                        severity: 'error',
                        summary: 'Lỗi server',
                        detail: 'Có lỗi xảy ra khi xóa tài khoản. Vui lòng thử lại sau.',
                        life: 5000
                    })
                    break
                    
                default:
                    toast.add({
                        severity: 'error',
                        summary: 'Lỗi xóa',
                        detail: `Lỗi ${status}: ${data.message || 'Không thể xóa tài khoản'}`,
                        life: 5000
                    })
            }
        } else {
            toast.add({
                severity: 'error',
                summary: 'Lỗi kết nối',
                detail: 'Không thể kết nối đến server để xóa tài khoản',
                life: 5000
            })
        }
    } finally {
        deleting.value = false
    }
}
const handleChangeStatus = async (account) => {
    try {
        const newStatus = account.trangThai === 1 ? 0 : 1
        
        console.log('Thay đổi trạng thái:', {
            accountId: account.id,
            currentStatus: account.trangThai,
            newStatus: newStatus
        })
        
        // Thử PATCH method trước (đã sửa CORS)
        let response
        try {
            response = await axios.patch(
                `http://localhost:8080/api/tai-khoan/${account.id}/trang-thai?trangThai=${newStatus}`,
                {},
                {
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 10000
                }
            )
        } catch (patchError) {
            console.warn('PATCH thất bại, thử PUT method:', patchError.response?.status)
            
            // Fallback to PUT method
            const putData = {
                email: account.email,
                vaiTroString: account.vaiTro,
                trangThai: newStatus
            }
            
            response = await axios.put(
                `http://localhost:8080/api/tai-khoan/${account.id}`,
                putData,
                {
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 10000
                }
            )
        }
        
        if (response.status === 200) {
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Tài khoản đã được ${newStatus === 1 ? 'kích hoạt' : 'ngưng hoạt động'}`,
                life: 3000
            })
            await fetchData()
        }
        
    } catch (error) {
        console.error('Lỗi thay đổi trạng thái:', error)
        
        if (error.response) {
            const { status, data } = error.response
            let errorMsg = 'Không thể thay đổi trạng thái'
            
            switch (status) {
                case 400:
                    if (data.errorCode === 'LAST_ADMIN') {
                        errorMsg = 'Không thể vô hiệu hóa admin cuối cùng trong hệ thống'
                    } else if (data.errorCode === 'INVALID_STATUS') {
                        errorMsg = 'Trạng thái không hợp lệ'
                    } else {
                        errorMsg = data.message || 'Dữ liệu không hợp lệ'
                    }
                    break
                case 403:
                    errorMsg = 'Không có quyền thay đổi trạng thái'
                    break
                case 404:
                    errorMsg = 'Tài khoản không tồn tại'
                    await fetchData() // Refresh data
                    break
                default:
                    errorMsg = `Lỗi server (${status}): ${data.message || 'Lỗi không xác định'}`
            }
            
            toast.add({
                severity: 'error',
                summary: 'Lỗi đổi trạng thái',
                detail: errorMsg,
                life: 5000
            })
        } else {
            toast.add({
                severity: 'error',
                summary: 'Lỗi kết nối',
                detail: 'Không thể kết nối đến server',
                life: 5000
            })
        }
    }
}
// ===== EXPORT FUNCTION =====
const handleExportCSV = () => {
    exporting.value = true
    try {
        if (dt.value) {
            dt.value.exportCSV()
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã xuất ${filteredAccounts.value.length} tài khoản`,
                life: 3000
            })
        }
    } catch (error) {
        console.error('❌ Error exporting CSV:', error)
        toast.add({
            severity: 'error',
            summary: 'Lỗi xuất file',
            detail: 'Không thể xuất file CSV',
            life: 3000
        })
    } finally {
        exporting.value = false
    }
}


// ===== ERROR HANDLING =====
const handleApiError = (error, defaultMessage) => {
    let errorMessage = defaultMessage
    let errorDetail = ''
    
    console.error('API Error Details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
    })
    
    if (error.response) {
        const { status, data } = error.response
        
        switch (status) {
            case 400:
                errorMessage = 'Dữ liệu không hợp lệ'
                // XỬ LÝ VALIDATION ERRORS TỪ BACKEND
                if (data.errors && typeof data.errors === 'object') {
                    Object.keys(data.errors).forEach(field => {
                        validationErrors.value[field] = data.errors[field]
                    })
                    errorDetail = 'Vui lòng sửa các lỗi được đánh dấu'
                } else {
                    errorDetail = data.message || data.error || 'Vui lòng kiểm tra lại thông tin'
                }
                break
                
            case 409:
                errorMessage = 'Dữ liệu trùng lặp'
                if (data.errorCode === 'EMAIL_EXISTS') {
                    errorDetail = 'Email đã tồn tại trong hệ thống'
                    validationErrors.value.email = 'Email đã tồn tại'
                    validationErrors.value.accountEmail = 'Email đã tồn tại'
                } else {
                    errorDetail = data.message || 'Dữ liệu đã tồn tại'
                }
                break
                
            case 403:
                errorMessage = 'Không có quyền'
                errorDetail = data.message || 'Bạn không có quyền thực hiện thao tác này'
                break
                
            case 404:
                errorMessage = 'Không tìm thấy'
                errorDetail = data.message || 'Tài khoản không tồn tại'
                break
                
            case 500:
                errorMessage = 'Lỗi server'
                errorDetail = 'Có lỗi xảy ra trên server. Vui lòng thử lại sau.'
                break
                
            default:
                errorMessage = `Lỗi HTTP ${status}`
                errorDetail = data.message || data.error || error.message || 'Lỗi không xác định'
        }
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        errorMessage = 'Lỗi kết nối'
        errorDetail = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.'
    } else {
        errorMessage = 'Lỗi không xác định'
        errorDetail = error.message || defaultMessage
    }

    toast.add({
        severity: 'error',
        summary: errorMessage,
        detail: errorDetail,
        life: 6000
    })
}

// ===== LIFECYCLE =====
onMounted(() => {
    fetchData()
})
</script>

<style scoped>
.card {
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.search-filter-section {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.border-bottom {
    border-bottom: 1px solid #dee2e6;
}

.text-muted {
    color: #6c757d;
}

.text-sm {
    font-size: 0.875rem;
}

.font-bold {
    font-weight: 700;
}

.font-semibold {    
    font-weight: 600;
}

.font-medium {
    font-weight: 500;
}

.stats-summary {
    background: rgba(255, 255, 255, 0.8);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
}

.responsive-table {
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Table Styling */
:deep(.p-datatable) {
    border: none;
}

:deep(.p-datatable-header) {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 2px solid #e2e8f0;
    padding: 1.5rem;
}

:deep(.p-datatable-tbody tr) {
    transition: all 0.2s ease;
}

:deep(.p-datatable-tbody tr:hover) {
    background-color: #f8fafc;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

:deep(.p-datatable-tbody tr.p-datatable-row-selected) {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-left: 4px solid #3b82f6;
}

:deep(.p-paginator) {
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
}

/* Tag Styling */
:deep(.p-tag) {
    font-weight: 500;
    padding: 0.25rem 0.75rem;
}

:deep(.p-tag.p-tag-success) {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    color: #065f46;
    border: 1px solid #10b981;
}

:deep(.p-tag.p-tag-danger) {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    color: #991b1b;
    border: 1px solid #ef4444;
}

:deep(.p-tag.p-tag-warn) {
    background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
    color: #92400e;
    border: 1px solid #f59e0b;
}

:deep(.p-tag.p-tag-primary) {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    color: #1e40af;
    border: 1px solid #3b82f6;
}

:deep(.p-tag.p-tag-info) {
    background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
    color: #0c4a6e;
    border: 1px solid #0ea5e9;
}

/* Button Styling */
:deep(.p-button.p-button-outlined) {
    transition: all 0.2s ease;
}

:deep(.p-button.p-button-outlined:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Dialog Styling */
:deep(.p-dialog) {
    border-radius: 1rem;
    overflow: hidden;
}

:deep(.p-dialog-header) {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 2px solid #e2e8f0;
    padding: 1.5rem;
}

:deep(.p-dialog-content) {
    padding: 1.5rem;
}

:deep(.p-dialog-footer) {
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    padding: 1rem 1.5rem;
}

/* Form Styling */
:deep(.p-inputtext:focus) {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

:deep(.p-select:focus) {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

:deep(.p-datepicker:focus) {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Responsive Design */
@media (max-width: 768px) {
    .search-filter-section {
        padding: 1rem;
    }
    
    .search-filter-section .flex {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }
    
    :deep(.p-datatable-responsive-demo .p-datatable-tbody tr td) {
        font-size: 0.875rem;
        padding: 0.5rem;
    }
    
    :deep(.p-dialog) {
        width: 95% !important;
        margin: 1rem;
    }
    
    .stats-summary {
        flex-direction: column;
        gap: 0.5rem;
    }
}

@media (max-width: 640px) {
    :deep(.p-datatable-header h4) {
        font-size: 1.25rem;
    }
    
    .search-filter-section {
        padding: 0.75rem;
    }
    
    :deep(.p-toolbar) {
        flex-direction: column;
        gap: 1rem;
    }
    
    :deep(.p-toolbar .p-toolbar-group-left),
    :deep(.p-toolbar .p-toolbar-group-right) {
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
    }
}

/* Animation */
@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.card {
    animation: slideInUp 0.5s ease-out;
}

/* Loading state */
:deep(.p-datatable-loading-overlay) {
    background: rgba(255, 255, 255, 0.9);
}

/* Scrollbar styling */
:deep(.p-datatable-wrapper::-webkit-scrollbar) {
    height: 8px;
}

:deep(.p-datatable-wrapper::-webkit-scrollbar-track) {
    background: #f1f5f9;
}

:deep(.p-datatable-wrapper::-webkit-scrollbar-thumb) {
    background: #cbd5e1;
    border-radius: 4px;
}

:deep(.p-datatable-wrapper::-webkit-scrollbar-thumb:hover) {
    background: #94a3b8;
}
</style>