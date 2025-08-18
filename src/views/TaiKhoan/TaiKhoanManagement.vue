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

        <!-- DataTable -->
        <DataTable
            ref="dt"
            v-model:selection="selectedAccounts"
            :value="filteredAccounts"
            dataKey="id"
            :paginator="true"
            :rows="PAGINATION_CONFIG.defaultRows"
            :filters="filters"
            :paginatorTemplate="PAGINATION_CONFIG.paginatorTemplate"
            :rowsPerPageOptions="PAGINATION_CONFIG.rowsPerPageOptions"
            currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} tài khoản"
            :loading="isLoading"
        >
            <template #header>
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <h4 class="m-0">Quản Lý Tài Khoản</h4>
                    <div class="flex gap-2">
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Tìm kiếm..." />
                        </IconField>
                        <Select 
                            v-model="roleFilter" 
                            :options="ROLE_FILTER_OPTIONS" 
                            optionLabel="label" 
                            optionValue="value" 
                            placeholder="Lọc vai trò" 
                            class="w-12rem" 
                        />
                        <Select 
                            v-model="statusFilter" 
                            :options="STATUS_OPTIONS" 
                            optionLabel="label" 
                            optionValue="value" 
                            placeholder="Lọc trạng thái" 
                            class="w-12rem" 
                        />
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
            <Column field="email" header="Email" sortable style="min-width: 16rem">
                <template #body="slotProps">
                    <div class="flex items-center">
                        <i class="pi pi-envelope text-muted mr-2"></i>
                        <span>{{ slotProps.data.email }}</span>
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
                            icon="pi pi-trash" 
                            outlined 
                            severity="danger" 
                            size="small" 
                            @click="confirmDeleteAccount(slotProps.data)" 
                            title="Xóa" 
                        />
                        <Button 
                            icon="pi pi-refresh" 
                            outlined 
                            severity="secondary" 
                            size="small" 
                            @click="handleChangeStatus(slotProps.data)" 
                            :title="slotProps.data.trangThai === 1 ? 'Ngưng hoạt động' : 'Kích hoạt'" 
                        />
                    </div>
                </template>
            </Column>
            <template #empty>
                <div class="p-5 text-center">
                    <i class="pi pi-users text-muted mb-3 text-5xl"></i>
                    <h5 class="text-muted">Không tìm thấy tài khoản</h5>
                    <p class="text-muted">Thử thay đổi bộ lọc hoặc thêm tài khoản mới.</p>
                </div>
            </template>
        </DataTable>

        <!-- Add Account Dialog -->
        <Dialog v-model:visible="addDialog" :style="{ width: DIALOG_SIZES.EXTRA_LARGE }" header="Thêm tài khoản mới" :modal="true">
            <div class="flex flex-col gap-6">
                <!-- Chọn vai trò -->
                <div class="border-bottom pb-4">
                    <h5 class="mb-3">
                        <i class="pi pi-users mr-2"></i>
                        Chọn vai trò
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
                    <h5 class="mb-3">
                        <i class="pi pi-user mr-2"></i>
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

                    <!-- Địa chỉ - 2 cấp: Tỉnh/TP và Xã/Phường -->
                    <div class="mt-4">
                        <label class="mb-3 block font-bold">
                            <i class="pi pi-map-marker mr-1"></i>
                            Địa chỉ *
                        </label>
                        
                        <!-- Tỉnh/Thành phố -->
                        <div class="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label class="mb-2 block text-sm font-medium">Tỉnh/Thành phố *</label>
                                <Select
                                    v-model="personalInfo.tinhThanhCode"
                                    :options="provinces"
                                    optionLabel="name"
                                    optionValue="code"
                                    placeholder="Chọn Tỉnh/TP"
                                    :loading="loadingProvinces"
                                    @change="onProvinceChange"
                                    :invalid="hasValidationError('tinhThanhCode')"
                                    fluid
                                />
                                <small v-if="hasValidationError('tinhThanhCode')" class="text-red-500">
                                    {{ getValidationError('tinhThanhCode') }}
                                </small>
                            </div>
                            
                            <!-- Xã/Phường -->
                            <div>
                                <label class="mb-2 block text-sm font-medium">Xã/Phường *</label>
                                <Select
                                    v-model="personalInfo.phuongXaCode"
                                    :options="wards"
                                    optionLabel="name"
                                    optionValue="code"
                                    placeholder="Chọn Xã/Phường"
                                    :disabled="!personalInfo.tinhThanhCode"
                                    :loading="loadingWards"
                                    @change="onWardChange"
                                    :invalid="hasValidationError('phuongXaCode')"
                                    fluid
                                />
                                <small v-if="hasValidationError('phuongXaCode')" class="text-red-500">
                                    {{ getValidationError('phuongXaCode') }}
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
                            <label class="mb-1 block text-sm font-bold text-green-800">
                                <i class="pi pi-check-circle mr-1"></i>
                                Địa chỉ đầy đủ:
                            </label>
                            <p class="text-green-700 font-medium">{{ personalInfo.fullAddress }}</p>
                        </div>
                    </div>
                </div>

                <!-- Thông tin tài khoản -->
                <div class="border-bottom pb-4">
                    <h5 class="mb-3">
                        <i class="pi pi-lock mr-2"></i>
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

        <!-- View Account Dialog -->
        <Dialog v-model:visible="viewDialog" :style="{ width: DIALOG_SIZES.LARGE }" :header="`Chi tiết tài khoản - ${viewingAccount?.email || 'N/A'}`" :modal="true">
            <div v-if="viewingAccount" class="flex flex-col gap-4">
                <!-- Thông tin tài khoản -->
                <div class="rounded-lg bg-blue-50 p-4">
                    <h6 class="mb-3 font-semibold text-blue-700">Thông tin tài khoản:</h6>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>ID:</strong> #{{ viewingAccount.id }}</div>
                        <div><strong>Mã TK:</strong> {{ viewingAccount.maTaiKhoan }}</div>
                        <div><strong>Email:</strong> {{ viewingAccount.email }}</div>
                        <div>
                            <strong>Vai trò:</strong>
                            <Tag 
                                :value="getRoleLabel(viewingAccount.vaiTro)" 
                                :severity="getRoleSeverity(viewingAccount.vaiTro)" 
                            />
                        </div>
                        <div>
                            <strong>Trạng thái:</strong>
                            <Tag 
                                :value="getStatusLabel(viewingAccount.trangThai)" 
                                :severity="getStatusSeverity(viewingAccount.trangThai)" 
                            />
                        </div>
                        <div><strong>Ngày tạo:</strong> {{ formatDate(viewingAccount.ngayTao) }}</div>
                        <div><strong>Cập nhật:</strong> {{ formatDate(viewingAccount.ngayCapNhat) }}</div>
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
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="selectedAccountForDelete">
                    Bạn có chắc chắn muốn xóa tài khoản <b>{{ selectedAccountForDelete.email }}</b>?
                </span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteAccountDialog = false" :disabled="deleting" />
                <Button label="Có" icon="pi pi-check" @click="handleDeleteAccount" :loading="deleting" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteAccountsDialog" :style="{ width: DIALOG_SIZES.SMALL }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Bạn có chắc chắn muốn xóa các tài khoản đã chọn?</span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteAccountsDialog = false" :disabled="deleting" />
                <Button label="Có" icon="pi pi-check" @click="handleDeleteSelectedAccounts" :loading="deleting" />
            </template>
        </Dialog>

        <Toast />
    </div>
</template>

<script setup>
import { FilterMatchMode } from '@primevue/core/api'
import axios from 'axios'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

// Constants
const STATUS_OPTIONS = [
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Hoạt động', value: 1 },
    { label: 'Ngưng hoạt động', value: 0 }
]

const STATUS_OPTIONS_FOR_FORM = [
    { label: 'Hoạt động', value: 1 },
    { label: 'Ngưng hoạt động', value: 0 }
]

const ROLE_FILTER_OPTIONS = [
    { label: 'Tất cả vai trò', value: '' },
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
const selectedAccounts = ref()
const isLoading = ref(false)
const addDialog = ref(false)
const editDialog = ref(false)
const viewDialog = ref(false)
const deleteAccountDialog = ref(false)
const deleteAccountsDialog = ref(false)

const newAccount = ref({})
const personalInfo = ref({
    hoTen: '',
    email: '',
    sdt: '',
    tinhThanhCode: '',
    phuongXaCode: '',
    diaChiChiTiet: '',
    fullAddress: '',
    ngaySinh: null,
    chucVu: ''
})
const editAccountData = ref({})
const viewingAccount = ref(null)
const selectedAccountForDelete = ref(null)

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})
const roleFilter = ref('')
const statusFilter = ref('')
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
const addressFallbackShown = ref(false)

// ===== UTILITY FUNCTIONS - ĐỊNH NGHĨA TRƯỚC =====
const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('vi-VN')
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

// ===== COMPUTED =====
const filteredAccounts = computed(() => {
    let filtered = accounts.value || []

    if (roleFilter.value !== '') {
        filtered = filtered.filter((acc) => acc.vaiTro === roleFilter.value)
    }

    if (statusFilter.value !== '') {
        filtered = filtered.filter((acc) => acc.trangThai === parseInt(statusFilter.value))
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
        let url = 'http://localhost:8080/api/tai-khoan'
        const params = new URLSearchParams()
        
        if (roleFilter.value && roleFilter.value !== '') {
            params.append('vaiTro', roleFilter.value)
        }
        if (statusFilter.value && statusFilter.value !== '') {
            params.append('trangThai', statusFilter.value)
        }
        if (filters.value.global.value && filters.value.global.value.trim() !== '') {
            params.append('email', filters.value.global.value.trim())
        }
        
        if (params.toString()) {
            url += '/search?' + params.toString()
        }
        
        console.log('📡 Fetching accounts from:', url)
        
        const response = await axios.get(url)
        if (response.data && Array.isArray(response.data)) {
            accounts.value = response.data
            console.log('✅ Loaded accounts:', response.data.length)
        } else {
            accounts.value = []
        }
    } catch (error) {
        console.error('❌ Error fetching accounts:', error)
        toast.add({
            severity: 'error',
            summary: 'Lỗi kết nối',
            detail: `Không thể tải dữ liệu: ${error.message}`,
            life: 5000
        })
        accounts.value = []
    } finally {
        isLoading.value = false
    }
}

// ===== ADDRESS MANAGEMENT =====
const fetchProvinces = async () => {
    if (provinces.value.length > 0) return
    
    try {
        loadingProvinces.value = true
        console.log('🌍 Fetching provinces from API...')
        
        const response = await axios.get('http://localhost:8080/api/vietnam-address/provinces')
        
        if (response.data && response.data.success && response.data.data) {
            provinces.value = response.data.data.map(item => ({
                code: item.code.toString(),
                name: item.name,
                codename: item.codename
            }))
            console.log('✅ Loaded provinces:', provinces.value.length)
        } else {
            throw new Error('Invalid provinces data structure')
        }
        
    } catch (error) {
        console.error('❌ Error fetching provinces:', error)
        
        // Fallback data
        provinces.value = [
            { code: '1', name: 'Hà Nội', codename: 'ha_noi' },
            { code: '79', name: 'TP. Hồ Chí Minh', codename: 'ho_chi_minh' },
            { code: '48', name: 'Đà Nẵng', codename: 'da_nang' },
            { code: '92', name: 'Cần Thơ', codename: 'can_tho' }
        ]
        
        if (!addressFallbackShown.value) {
            toast.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'API địa chỉ không khả dụng, sử dụng dữ liệu dự phòng',
                life: 4000
            })
            addressFallbackShown.value = true
        }
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
        console.log('🏘️ Fetching wards for province:', provinceCode)
        
        const response = await axios.get(`http://localhost:8080/api/vietnam-address/wards/${provinceCode}`)
        
        if (response.data && response.data.success && response.data.data) {
            wards.value = response.data.data.map(item => ({
                code: item.code.toString(),
                name: item.name,
                codename: item.codename
            }))
            console.log('✅ Loaded wards by province:', wards.value.length)
        } else {
            console.log('⚠️ Invalid wards data structure, using fallback...')
            wards.value = getFallbackWards(provinceCode)
        }
        
    } catch (error) {
        console.warn('⚠️ Wards API failed, using fallback data:', error.message)
        wards.value = getFallbackWards(provinceCode)
        console.log('📍 Using fallback wards for province:', provinceCode)
    } finally {
        loadingWards.value = false
    }
}

const getFallbackWards = (provinceCode) => {
    return [
        { code: '1', name: 'Phường/Xã 1', codename: 'phuong_xa_1' },
        { code: '2', name: 'Phường/Xã 2', codename: 'phuong_xa_2' },
        { code: '3', name: 'Phường/Xã 3', codename: 'phuong_xa_3' }
    ]
}

const onProvinceChange = () => {
    personalInfo.value.phuongXaCode = ''
    wards.value = []
    
    if (personalInfo.value.tinhThanhCode) {
        fetchWards(personalInfo.value.tinhThanhCode)
    }
    updateFullAddress()
}

const onWardChange = () => {
    updateFullAddress()
}

const updateFullAddress = () => {
    const provinceName = provinces.value.find(p => p.code === personalInfo.value.tinhThanhCode)?.name || ''
    const wardName = wards.value.find(w => w.code === personalInfo.value.phuongXaCode)?.name || ''
    
    const addressParts = [
        personalInfo.value.diaChiChiTiet,
        wardName,
        provinceName
    ].filter(part => part && part.trim() !== '')
    
    personalInfo.value.fullAddress = addressParts.join(', ')
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
        tinhThanhCode: '',
        phuongXaCode: '',
        diaChiChiTiet: '',
        fullAddress: '',
        ngaySinh: null,
        chucVu: ''
    }
    
    wards.value = []
    submitted.value = false
    validationErrors.value = {}
}

const refreshFormAfterError = () => {
    // Clear validation errors but keep form data
    validationErrors.value = {}
    submitted.value = false
}

const onRoleChange = () => {
    // Reset personal info when role changes
    personalInfo.value = {
        hoTen: '',
        email: '',
        sdt: '',
        tinhThanhCode: '',
        phuongXaCode: '',
        diaChiChiTiet: '',
        fullAddress: '',
        ngaySinh: null,
        chucVu: ''
    }
    
    // Reset address dropdowns
    wards.value = []
    
    // Clear validation errors
    validationErrors.value = {}
    
    if (newAccount.value.vaiTro === 'ADMIN') {
        newAccount.value.email = ''
    }
    
    console.log('🔄 Role changed to:', newAccount.value.vaiTro)
}

const syncEmailToAccount = () => {
    newAccount.value.email = personalInfo.value.email
    
    // Clear email validation errors when user changes email
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
const checkEmailExists = (email) => {
    return accounts.value.some(account => 
        account.email.toLowerCase() === email.toLowerCase()
    )
}

const validateForm = () => {
    validationErrors.value = {}
    
    // Validate vai trò
    if (!newAccount.value.vaiTro) {
        validationErrors.value.vaiTro = 'Vui lòng chọn vai trò'
    }
    
    // Validate email
    if (!newAccount.value.email?.trim()) {
        validationErrors.value.accountEmail = 'Email không được để trống'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAccount.value.email)) {
        validationErrors.value.accountEmail = 'Email không hợp lệ'
    } else if (checkEmailExists(newAccount.value.email)) {
        validationErrors.value.accountEmail = 'Email đã tồn tại trong hệ thống'
    }
    
    // Validate password
    if (!newAccount.value.matKhau?.trim()) {
        validationErrors.value.matKhau = 'Mật khẩu không được để trống'
    } else if (newAccount.value.matKhau.length < 6) {
        validationErrors.value.matKhau = 'Mật khẩu phải có ít nhất 6 ký tự'
    }
    
    // Validate trạng thái
    if (newAccount.value.trangThai === undefined || newAccount.value.trangThai === null) {
        validationErrors.value.trangThai = 'Vui lòng chọn trạng thái'
    }
    
    // Validate personal info for non-admin accounts
    if (newAccount.value.vaiTro && newAccount.value.vaiTro !== 'ADMIN') {
        if (!personalInfo.value.hoTen?.trim()) {
            validationErrors.value.hoTen = 'Họ tên không được để trống'
        } else if (personalInfo.value.hoTen.trim().length < 2) {
            validationErrors.value.hoTen = 'Họ tên phải có ít nhất 2 ký tự'
        }
        
        if (!personalInfo.value.email?.trim()) {
            validationErrors.value.email = 'Email không được để trống'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.value.email)) {
            validationErrors.value.email = 'Email không hợp lệ'
        }
        
        if (!personalInfo.value.sdt?.trim()) {
            validationErrors.value.sdt = 'Số điện thoại không được để trống'
        } else if (!/^0\d{9,10}$/.test(personalInfo.value.sdt.replace(/\s/g, ''))) {
            validationErrors.value.sdt = 'Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)'
        }
        
        // Address validation - at least one field required
        if (!personalInfo.value.tinhThanhCode && !personalInfo.value.phuongXaCode) {
            validationErrors.value.tinhThanhCode = 'Vui lòng chọn ít nhất Tỉnh/TP hoặc Xã/Phường'
            validationErrors.value.phuongXaCode = 'Vui lòng chọn ít nhất Tỉnh/TP hoặc Xã/Phường'
        }
    }
    
    return Object.keys(validationErrors.value).length === 0
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

// Watch for filters changes
watch([roleFilter, statusFilter], () => {
    fetchData()
}, { deep: true })

// Watch for global search with debounce
watch(() => filters.value.global.value, debounce(() => {
    fetchData()
}, 500))

// ===== CRUD OPERATIONS =====
const handleSaveAccount = async () => {
    submitted.value = true
    saving.value = true
    
    try {
        if (!validateForm()) {
            return
        }
        
        updateFullAddress()
        
        const accountData = {
            email: newAccount.value.email,
            matKhau: newAccount.value.matKhau,
            vaiTroString: newAccount.value.vaiTro,
            trangThai: newAccount.value.trangThai
        }
        
        if (newAccount.value.maTaiKhoan && newAccount.value.maTaiKhoan.trim()) {
            accountData.maTaiKhoan = newAccount.value.maTaiKhoan.trim()
        }
        
        // Add personal info for non-admin accounts
        if (newAccount.value.vaiTro !== 'ADMIN') {
            accountData.hoTen = personalInfo.value.hoTen
            accountData.sdt = personalInfo.value.sdt
            
            // Address data
            if (personalInfo.value.tinhThanhCode || personalInfo.value.phuongXaCode) {
                accountData.diaChi = {
                    maTinh: personalInfo.value.tinhThanhCode,
                    maPhuong: personalInfo.value.phuongXaCode,
                    tenTinh: provinces.value.find(p => p.code === personalInfo.value.tinhThanhCode)?.name || '',
                    tenPhuong: wards.value.find(w => w.code === personalInfo.value.phuongXaCode)?.name || '',
                    diaChiChiTiet: personalInfo.value.diaChiChiTiet || ''
                }
                
                accountData.maTinh = personalInfo.value.tinhThanhCode
                accountData.maPhuong = personalInfo.value.phuongXaCode
                accountData.tenTinh = provinces.value.find(p => p.code === personalInfo.value.tinhThanhCode)?.name || ''
                accountData.tenPhuong = wards.value.find(w => w.code === personalInfo.value.phuongXaCode)?.name || ''
                accountData.diaChiChiTiet = personalInfo.value.diaChiChiTiet || ''
            }
            
            if (newAccount.value.vaiTro === 'USER' && personalInfo.value.ngaySinh) {
                accountData.ngaySinh = personalInfo.value.ngaySinh.toISOString().split('T')[0]
            }
            
            if (newAccount.value.vaiTro === 'NHANVIEN' && personalInfo.value.chucVu) {
                accountData.chucVu = personalInfo.value.chucVu
            }
        }
        
        console.log('📤 Creating account with data:', accountData)
        
        const response = await axios.post('http://localhost:8080/api/tai-khoan', accountData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        })
        
        if (response.status === 201 || response.status === 200) {
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Tài khoản đã được tạo thành công',
                life: 4000
            })
            
            await fetchData()
            hideAddDialog()
            
            // Navigate based on role
            setTimeout(() => {
                switch(newAccount.value.vaiTro) {
                    case 'USER':
                        router.push('/khach-hang')
                        break
                    case 'NHANVIEN':
                        router.push('/nhan-vien')
                        break
                    default:
                        break
                }
            }, 1500)
        }
        
    } catch (error) {
        console.error('❌ Error saving account:', error)
        
        let errorMessage = 'Không thể tạo tài khoản'
        let errorDetail = ''
        
        if (error.response) {
            const status = error.response.status
            const data = error.response.data
            
            switch (status) {
                case 400:
                    errorMessage = 'Dữ liệu không hợp lệ'
                    if (data.errors && typeof data.errors === 'object') {
                        Object.keys(data.errors).forEach(field => {
                            validationErrors.value[field] = data.errors[field]
                        })
                        errorDetail = 'Vui lòng sửa các lỗi được đánh dấu'
                    } else {
                        errorDetail = data.error || data.message || 'Vui lòng kiểm tra lại thông tin'
                    }
                    break
                    
                case 409:
                    errorMessage = 'Email đã tồn tại'
                    errorDetail = 'Email này đã được sử dụng. Vui lòng chọn email khác.'
                    validationErrors.value.email = 'Email đã tồn tại'
                    validationErrors.value.accountEmail = 'Email đã tồn tại'
                    break
                    
                case 500:
                    errorMessage = 'Lỗi server'
                    errorDetail = 'Có lỗi xảy ra trên server. Vui lòng thử lại sau.'
                    break
                    
                default:
                    errorMessage = `Lỗi HTTP ${status}`
                    errorDetail = data.error || data.message || error.message || 'Lỗi không xác định'
            }
        } else {
            errorMessage = 'Lỗi kết nối'
            errorDetail = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.'
        }
        
        toast.add({
            severity: 'error',
            summary: errorMessage,
            detail: errorDetail,
            life: 6000
        })
    } finally {
        saving.value = false
    }
}

const handleUpdateAccount = async () => {
    submitted.value = true
    saving.value = true
    
    try {
        // Validate edit form
        validationErrors.value = {}
        
        if (!editAccountData.value.email?.trim()) {
            validationErrors.value.editEmail = 'Email không được để trống'
        }
        
        if (!editAccountData.value.vaiTro) {
            validationErrors.value.editVaiTro = 'Vui lòng chọn vai trò'
        }
        
        if (editAccountData.value.trangThai === undefined) {
            validationErrors.value.editTrangThai = 'Vui lòng chọn trạng thái'
        }
        
        if (Object.keys(validationErrors.value).length > 0) {
            return
        }
        
        const updateData = {
            email: editAccountData.value.email,
            vaiTro: editAccountData.value.vaiTro,
            trangThai: editAccountData.value.trangThai
        }
        
        if (editAccountData.value.matKhau) {
            updateData.matKhau = editAccountData.value.matKhau
        }
        
        const response = await axios.put(
            `http://localhost:8080/api/tai-khoan/${editAccountData.value.id}`, 
            updateData
        )
        
        if (response.status === 200) {
            const index = accounts.value.findIndex(acc => acc.id === editAccountData.value.id)
            if (index !== -1) {
                accounts.value[index] = { ...accounts.value[index], ...response.data }
            }
            
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
        console.error('❌ Error updating account:', error)
        toast.add({
            severity: 'error',
            summary: 'Lỗi cập nhật',
            detail: error.response?.data?.message || 'Không thể cập nhật tài khoản',
            life: 5000
        })
    } finally {
        saving.value = false
    }
}

const handleDeleteAccount = async () => {
    deleting.value = true
    try {
        await axios.delete(`http://localhost:8080/api/tai-khoan/${selectedAccountForDelete.value.id}`)
        
        accounts.value = accounts.value.filter(acc => acc.id !== selectedAccountForDelete.value.id)
        
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Tài khoản đã được xóa',
            life: 3000
        })
        
        deleteAccountDialog.value = false
        selectedAccountForDelete.value = null
        
    } catch (error) {
        console.error('❌ Error deleting account:', error)
        toast.add({
            severity: 'error',
            summary: 'Lỗi xóa tài khoản',
            detail: error.response?.data?.message || 'Không thể xóa tài khoản',
            life: 5000
        })
    } finally {
        deleting.value = false
    }
}

const handleDeleteSelectedAccounts = async () => {
    deleting.value = true
    try {
        const deletePromises = selectedAccounts.value.map(account => 
            axios.delete(`http://localhost:8080/api/tai-khoan/${account.id}`)
        )
        
        await Promise.all(deletePromises)
        
        accounts.value = accounts.value.filter(acc => 
            !selectedAccounts.value.some(selected => selected.id === acc.id)
        )
        
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Các tài khoản đã được xóa',
            life: 3000
        })
        
        deleteAccountsDialog.value = false
        selectedAccounts.value = null
        
    } catch (error) {
        console.error('❌ Error deleting accounts:', error)
        toast.add({
            severity: 'error',
            summary: 'Lỗi xóa tài khoản',
            detail: 'Không thể xóa một số tài khoản',
            life: 5000
        })
    } finally {
        deleting.value = false
    }
}

const handleChangeStatus = async (account) => {
    try {
        const newStatus = account.trangThai === 1 ? 0 : 1
        
        const response = await axios.patch(
            `http://localhost:8080/api/tai-khoan/${account.id}/trang-thai?trangThai=${newStatus}`
        )
        
        if (response.status === 200) {
            const index = accounts.value.findIndex(acc => acc.id === account.id)
            if (index !== -1) {
                accounts.value[index].trangThai = newStatus
                accounts.value[index].ngayCapNhat = new Date()
            }
            
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Tài khoản đã được ${newStatus === 1 ? 'kích hoạt' : 'ngưng hoạt động'}`,
                life: 3000
            })
        }
        
    } catch (error) {
        console.error('❌ Error changing status:', error)
        toast.add({
            severity: 'error',
            summary: 'Lỗi thay đổi trạng thái',
            detail: error.response?.data?.error || 'Không thể thay đổi trạng thái',
            life: 5000
        })
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
                detail: 'Đã xuất file CSV',
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

// ===== LIFECYCLE =====
onMounted(() => {
    console.log('🚀 TaiKhoanManagement component mounted, fetching data...')
    fetchData()
})
</script>

<style scoped>
.card {
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
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
</style>