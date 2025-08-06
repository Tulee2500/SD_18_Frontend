<template>
    <div class="card">
        <!-- Toolbar -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Thêm tài khoản" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                <Button label="Xóa đã chọn" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedAccounts || !selectedAccounts.length" />
            </template>
            <template #end>
                <Button label="Xuất CSV" icon="pi pi-upload" severity="secondary" @click="exportCSV" />
            </template>
        </Toolbar>

        <!-- DataTable -->
        <DataTable
            ref="dt"
            v-model:selection="selectedAccounts"
            :value="filteredAccounts"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
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
                        <Select v-model="roleFilter" :options="roleOptions" optionLabel="label" optionValue="value" placeholder="Lọc vai trò" class="w-12rem" />
                        <Select v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Lọc trạng thái" class="w-12rem" />
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
                    <Tag :value="getRoleLabel(slotProps.data.vaiTro)" :severity="getRoleSeverity(slotProps.data.vaiTro)">
                        <i :class="getRoleIcon(slotProps.data.vaiTro)" class="mr-1"></i>
                        {{ getRoleLabel(slotProps.data.vaiTro) }}
                    </Tag>
                </template>
            </Column>
            <Column field="trangThai" header="Trạng thái" sortable style="width: 12rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.trangThai === 1 ? 'Hoạt động' : 'Ngưng'" :severity="slotProps.data.trangThai === 1 ? 'success' : 'danger'">
                        <i :class="slotProps.data.trangThai === 1 ? 'pi pi-check-circle' : 'pi pi-times-circle'" class="mr-1"></i>
                        {{ slotProps.data.trangThai === 1 ? 'Hoạt động' : 'Ngưng' }}
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
                        <Button icon="pi pi-eye" outlined size="small" @click="viewAccount(slotProps.data)" title="Xem chi tiết" />
                        <Button icon="pi pi-pencil" outlined size="small" @click="editAccount(slotProps.data)" title="Sửa" />
                        <Button icon="pi pi-trash" outlined severity="danger" size="small" @click="confirmDeleteAccount(slotProps.data)" title="Xóa" />
                        <Button icon="pi pi-refresh" outlined severity="secondary" size="small" @click="changeStatus(slotProps.data)" :title="slotProps.data.trangThai === 1 ? 'Ngưng hoạt động' : 'Kích hoạt'" />
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
        <Dialog v-model:visible="addDialog" :style="{ width: '900px' }" header="Thêm tài khoản mới" :modal="true">
            <div class="flex flex-col gap-6">
                <!-- Chọn vai trò -->
                <div class="border-bottom pb-4">
                    <h5 class="mb-3">Chọn vai trò</h5>
                    <div class="mb-4">
                        <label for="vaiTro" class="mb-3 block font-bold">Vai trò *</label>
                        <Select
                            id="vaiTro"
                            v-model="newAccount.vaiTro"
                            :options="roleOptionsForForm"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Chọn vai trò"
                            :invalid="submitted && newAccount.vaiTro === undefined"
                            fluid
                            @change="onRoleChange"
                        />
                        <small v-if="submitted && newAccount.vaiTro === undefined" class="text-red-500">Vai trò là bắt buộc.</small>
                    </div>
                </div>

                <!-- Thông tin cá nhân (chỉ hiện khi không phải Admin) -->
                <div v-if="newAccount.vaiTro && newAccount.vaiTro !== 'ADMIN'" class="border-bottom pb-4">
                    <h5 class="mb-3">Thông tin {{ newAccount.vaiTro === 'USER' ? 'khách hàng' : 'nhân viên' }}</h5>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="hoTen" class="mb-3 block font-bold">Họ và tên *</label>
                            <InputText 
                                id="hoTen" 
                                v-model.trim="personalInfo.hoTen" 
                                required="true" 
                                :invalid="submitted && !personalInfo.hoTen" 
                                fluid 
                                placeholder="Nhập họ và tên"
                            />
                            <small v-if="submitted && !personalInfo.hoTen" class="text-red-500">Họ tên là bắt buộc.</small>
                        </div>
                        <div>
                            <label for="sdt" class="mb-3 block font-bold">Số điện thoại *</label>
                            <InputText 
                                id="sdt" 
                                v-model.trim="personalInfo.sdt" 
                                required="true" 
                                :invalid="submitted && !personalInfo.sdt" 
                                fluid 
                                placeholder="Nhập số điện thoại"
                            />
                            <small v-if="submitted && !personalInfo.sdt" class="text-red-500">Số điện thoại là bắt buộc.</small>
                        </div>
                    </div>
                    <div class="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <label for="personalEmail" class="mb-3 block font-bold">Email *</label>
                            <InputText 
                                id="personalEmail" 
                                v-model.trim="personalInfo.email" 
                                required="true" 
                                :invalid="submitted && !personalInfo.email" 
                                fluid 
                                placeholder="Nhập email"
                                @input="syncEmailToAccount"
                            />
                            <small v-if="submitted && !personalInfo.email" class="text-red-500">Email là bắt buộc.</small>
                        </div>
                        <div v-if="newAccount.vaiTro === 'USER'">
                            <label for="ngaySinh" class="mb-3 block font-bold">Ngày sinh</label>
                            <Calendar 
                                id="ngaySinh" 
                                v-model="personalInfo.ngaySinh" 
                                dateFormat="dd/mm/yy" 
                                fluid 
                                placeholder="Chọn ngày sinh"
                                :maxDate="new Date()"
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
 <!-- ✅ ĐỊA CHỈ MỚI - BỎ HUYỆN -->
<div class="mt-4">
    <label class="mb-3 block font-bold">Địa chỉ *</label>
    <div class="grid grid-cols-2 gap-3 mb-3">
        <!-- Tỉnh/Thành phố -->
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
                @open="debugProvinces"
                :invalid="submitted && !personalInfo.tinhThanhCode"
                fluid
            />
            <small v-if="submitted && !personalInfo.tinhThanhCode" class="text-red-500">
                Vui lòng chọn Tỉnh/TP
            </small>
            <small class="text-blue-500 text-xs">
                {{ provinces.length }} tỉnh/TP có sẵn
            </small>
        </div>
        
        <!-- Xã/Phường (BỎ HUYỆN) -->
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
                :invalid="submitted && !personalInfo.phuongXaCode"
                fluid
            />
            <small v-if="submitted && !personalInfo.phuongXaCode" class="text-red-500">
                Vui lòng chọn Xã/Phường
            </small>
            <small class="text-blue-500 text-xs">
                {{ wards.length }} xã/phường có sẵn
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
            <i class="pi pi-map-marker mr-1"></i>
            Địa chỉ đầy đủ:
        </label>
        <p class="text-green-700 font-medium">{{ personalInfo.fullAddress }}</p>
    </div>
    
    <!-- Thông báo lỗi địa chỉ -->
    <small v-if="submitted && (!personalInfo.tinhThanhCode || !personalInfo.phuongXaCode)" class="text-red-500">
        <i class="pi pi-exclamation-triangle mr-1"></i>
        Vui lòng chọn đầy đủ Tỉnh/TP và Xã/Phường
    </small>
</div>
</div>




                <!-- Thông tin tài khoản -->
                <div class="border-bottom pb-4">
                    <h5 class="mb-3">Thông tin đăng nhập</h5>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="maTaiKhoan" class="mb-3 block font-bold">Mã tài khoản</label>
                            <InputText id="maTaiKhoan" v-model="newAccount.maTaiKhoan" placeholder="Để trống để tự tạo" fluid />
                        </div>
                        <div>
                            <label for="email" class="mb-3 block font-bold">Email đăng nhập *</label>
                            <InputText 
                                id="email" 
                                v-model.trim="newAccount.email" 
                                required="true" 
                                :invalid="submitted && !newAccount.email" 
                                :readonly="newAccount.vaiTro !== 'ADMIN'"
                                fluid 
                                placeholder="Email để đăng nhập"
                            />
                            <small v-if="submitted && !newAccount.email" class="text-red-500">Email là bắt buộc.</small>
                            <small v-if="newAccount.vaiTro !== 'ADMIN'" class="text-muted">Email tự động lấy từ thông tin cá nhân</small>
                        </div>
                    </div>
                    <div class="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <label for="matKhau" class="mb-3 block font-bold">Mật khẩu *</label>
                            <Password id="matKhau" v-model="newAccount.matKhau" :required="true" :invalid="submitted && !newAccount.matKhau" toggleMask fluid>
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
                            <small v-if="submitted && !newAccount.matKhau" class="text-red-500">Mật khẩu là bắt buộc.</small>
                        </div>
                        <div>
                            <label for="trangThai" class="mb-3 block font-bold">Trạng thái *</label>
                            <Select id="trangThai" v-model="newAccount.trangThai" :options="statusOptionsForForm" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" :invalid="submitted && newAccount.trangThai === undefined" fluid />
                            <small v-if="submitted && newAccount.trangThai === undefined" class="text-red-500">Trạng thái là bắt buộc.</small>
                        </div>
                    </div>
                </div>

                <!-- Thông báo cho Admin -->
                <div v-if="newAccount.vaiTro === 'ADMIN'" class="rounded-lg bg-blue-50 p-4">
                    <div class="flex items-center gap-3">
                        <i class="pi pi-info-circle text-xl text-blue-600"></i>
                        <div>
                            <h6 class="mb-1 text-blue-700">Tài khoản Admin</h6>
                            <p class="mb-0 text-sm text-blue-600">Tài khoản Admin chỉ cần thông tin đăng nhập cơ bản.</p>
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideAddDialog" />
                <Button label="Lưu" icon="pi pi-check" @click="saveNewAccount" />
            </template>
        </Dialog>

        <!-- Edit Account Dialog -->
        <Dialog v-model:visible="editDialog" :style="{ width: '600px' }" header="Cập nhật tài khoản" :modal="true">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="editEmail" class="mb-3 block font-bold">Email *</label>
                    <InputText id="editEmail" v-model.trim="editAccountData.email" required="true" :invalid="submitted && !editAccountData.email" fluid />
                    <small v-if="submitted && !editAccountData.email" class="text-red-500">Email là bắt buộc.</small>
                </div>
                <div>
                    <label for="editMatKhau" class="mb-3 block font-bold">Mật khẩu mới</label>
                    <Password id="editMatKhau" v-model="editAccountData.matKhau" placeholder="Để trống nếu không đổi" toggleMask fluid />
                    <small class="text-muted">Để trống nếu không muốn thay đổi mật khẩu</small>
                </div>
                <div>
                    <label for="editVaiTro" class="mb-3 block font-bold">Vai trò *</label>
                    <Select id="editVaiTro" v-model="editAccountData.vaiTro" :options="roleOptionsForForm" optionLabel="label" optionValue="value" placeholder="Chọn vai trò" :invalid="submitted && editAccountData.vaiTro === undefined" fluid />
                    <small v-if="submitted && editAccountData.vaiTro === undefined" class="text-red-500">Vai trò là bắt buộc.</small>
                </div>
                <div>
                    <label for="editTrangThai" class="mb-3 block font-bold">Trạng thái *</label>
                    <Select
                        id="editTrangThai"
                        v-model="editAccountData.trangThai"
                        :options="statusOptionsForForm"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Chọn trạng thái"
                        :invalid="submitted && editAccountData.trangThai === undefined"
                        fluid
                    />
                    <small v-if="submitted && editAccountData.trangThai === undefined" class="text-red-500">Trạng thái là bắt buộc.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideEditDialog" />
                <Button label="Cập nhật" icon="pi pi-check" @click="updateAccount" />
            </template>
        </Dialog>

        <!-- View Account Dialog -->
        <Dialog v-model:visible="viewDialog" :style="{ width: '700px' }" :header="`Chi tiết tài khoản - ${viewingAccount?.email || 'Tài khoản'}`" :modal="true">
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
                            <Tag :value="getRoleLabel(viewingAccount.vaiTro)" :severity="getRoleSeverity(viewingAccount.vaiTro)" />
                        </div>
                        <div>
                            <strong>Trạng thái:</strong>
                            <Tag :value="viewingAccount.trangThai === 1 ? 'Hoạt động' : 'Ngưng'" :severity="viewingAccount.trangThai === 1 ? 'success' : 'danger'" />
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
        <Dialog v-model:visible="deleteAccountDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="selectedAccountForDelete"
                    >Bạn có chắc chắn muốn xóa tài khoản <b>{{ selectedAccountForDelete.email }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteAccountDialog = false" />
                <Button label="Có" icon="pi pi-check" @click="deleteAccount" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteAccountsDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Bạn có chắc chắn muốn xóa các tài khoản đã chọn?</span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteAccountsDialog = false" />
                <Button label="Có" icon="pi pi-check" text @click="deleteSelectedAccounts" />
            </template>
        </Dialog>

        <Toast />
    </div>
</template>

// Sửa đổi script section - thêm các hàm và lifecycle hooks cần thiết
<script>
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

export default {
    setup() {
        const router = useRouter();
        const provinces = ref([]);
        const wards = ref([]);
        const loadingProvinces = ref(false);
        const loadingWards = ref(false);
        const toast = useToast();
        const dt = ref();
        const accounts = ref([]);
        const addDialog = ref(false);
        const editDialog = ref(false);
        const viewDialog = ref(false);
        const deleteAccountDialog = ref(false);
        const deleteAccountsDialog = ref(false);
        const selectedAccountForDelete = ref(null);
        const viewingAccount = ref(null);
        const selectedAccounts = ref();
        const filters = ref({
            global: { value: null, matchMode: FilterMatchMode.CONTAINS }
        });
        const roleFilter = ref('');
        const statusFilter = ref('');
        const submitted = ref(false);
        const isLoading = ref(false);

        const newAccount = ref({
            maTaiKhoan: '',
            email: '',
            matKhau: '',
            vaiTro: undefined,
            trangThai: 1
        });

        const personalInfo = ref({
            hoTen: '',
            email: '',
            sdt: '',
            tinhThanhCode: '',
            phuongXaCode: '',
            diaChiChiTiet: '',
            diaChi: '',
            fullAddress: '',
            ngaySinh: null,
            chucVu: ''
        });

        const editAccountData = ref({
            id: null,
            email: '',
            matKhau: '',
            vaiTro: undefined,
            trangThai: undefined
        });

        const roleOptions = ref([
            { label: 'Tất cả vai trò', value: '' },
            { label: 'Khách hàng', value: 'USER' },
            { label: 'Nhân viên', value: 'NHANVIEN' },
            { label: 'Admin', value: 'ADMIN' }
        ]);

        const roleOptionsForForm = ref([
            { label: 'Khách hàng', value: 'USER' },
            { label: 'Nhân viên', value: 'NHANVIEN' },
            { label: 'Admin', value: 'ADMIN' }
        ]);

        const statusOptions = ref([
            { label: 'Tất cả trạng thái', value: '' },
            { label: 'Hoạt động', value: 1 },
            { label: 'Ngưng hoạt động', value: 0 }
        ]);

        const statusOptionsForForm = ref([
            { label: 'Hoạt động', value: 1 },
            { label: 'Ngưng hoạt động', value: 0 }
        ]);

        // ===== API ĐỊA CHỈ VIỆT NAM =====
        const fetchProvinces = async () => {
            try {
                loadingProvinces.value = true;
                console.log('🌍 Fetching provinces from Vietnamese API...');
                
                const response = await axios.get('http://localhost:8080/api/vietnam-address/provinces');
                
                if (response.data && response.data.success && response.data.data) {
                    provinces.value = response.data.data.map(item => ({
                        code: item.code.toString(),
                        name: item.name,
                        codename: item.codename
                    }));
                    
                    console.log('✅ Loaded provinces from backend:', provinces.value.length);
                } else {
                    throw new Error('Invalid provinces data structure');
                }
                
            } catch (error) {
                console.error('❌ Error fetching provinces from backend:', error);
                
                // Fallback to external API
                try {
                    console.log('🔄 Trying external API fallback...');
                    const fallbackResponse = await axios.get('https://vapi.vnappmob.com/api/province/');
                    
                    if (fallbackResponse.data && fallbackResponse.data.results) {
                        provinces.value = fallbackResponse.data.results.map(item => ({
                            code: item.province_id,
                            name: item.province_name,
                            codename: item.province_name.toLowerCase().replace(/\s+/g, '_')
                        }));
                        
                        console.log('✅ Loaded provinces from fallback:', provinces.value.length);
                    }
                } catch (fallbackError) {
                    console.error('❌ Fallback API also failed:', fallbackError);
                    toast.add({
                        severity: 'error',
                        summary: 'Lỗi tải dữ liệu',
                        detail: 'Không thể tải danh sách tỉnh/thành phố',
                        life: 3000
                    });
                    provinces.value = [];
                }
            } finally {
                loadingProvinces.value = false;
            }
        };

        const fetchWards = async (provinceCode) => {
            if (!provinceCode) {
                wards.value = [];
                return;
            }
            
            try {
                loadingWards.value = true;
                console.log('🏘️ Fetching wards for province:', provinceCode);
                
                const response = await axios.get(`http://localhost:8080/api/vietnam-address/wards/${provinceCode}`);
                
                if (response.data && response.data.success && response.data.data) {
                    wards.value = response.data.data.map(item => ({
                        code: item.code.toString(),
                        name: item.name,
                        codename: item.codename
                    }));
                    
                    console.log('✅ Loaded wards from backend:', wards.value.length);
                } else {
                    console.log('⚠️ No wards data from backend, using fallback...');
                    wards.value = getFallbackWards(provinceCode);
                }
                
            } catch (error) {
                console.error('❌ Error fetching wards from backend:', error);
                wards.value = getFallbackWards(provinceCode);
                
                toast.add({
                    severity: 'warn',
                    summary: 'Sử dụng dữ liệu dự phòng',
                    detail: 'Đang sử dụng dữ liệu xã/phường dự phòng',
                    life: 3000
                });
            } finally {
                loadingWards.value = false;
            }
        };

        const getFallbackWards = (provinceCode) => {
            const fallbackWards = {
                '1': [ // Hà Nội
                    { code: '1', name: 'Phường Phúc Xá', codename: 'phuong_phuc_xa' },
                    { code: '4', name: 'Phường Trúc Bạch', codename: 'phuong_truc_bach' },
                    { code: '7', name: 'Phường Vĩnh Phúc', codename: 'phuong_vinh_phuc' },
                    { code: '10', name: 'Phường Cống Vị', codename: 'phuong_cong_vi' },
                    { code: '13', name: 'Phường Liễu Giai', codename: 'phuong_lieu_giai' }
                ],
                '79': [ // TP.HCM
                    { code: '26734', name: 'Phường Bến Nghé', codename: 'phuong_ben_nghe' },
                    { code: '26737', name: 'Phường Bến Thành', codename: 'phuong_ben_thanh' },
                    { code: '26740', name: 'Phường Cầu Kho', codename: 'phuong_cau_kho' },
                    { code: '26743', name: 'Phường Cầu Ông Lãnh', codename: 'phuong_cau_ong_lanh' }
                ]
            };
            
            return fallbackWards[provinceCode] || [
                { code: '1', name: 'Xã/Phường 1', codename: 'xa_phuong_1' },
                { code: '2', name: 'Xã/Phường 2', codename: 'xa_phuong_2' },
                { code: '3', name: 'Xã/Phường 3', codename: 'xa_phuong_3' }
            ];
        };

        // ===== XỬ LÝ ĐỊA CHỈ =====
        const onProvinceChange = () => {
            console.log('🔄 Province changed:', personalInfo.value.tinhThanhCode);
            
            personalInfo.value.phuongXaCode = '';
            wards.value = [];
            
            if (personalInfo.value.tinhThanhCode) {
                fetchWards(personalInfo.value.tinhThanhCode);
            }
            updateFullAddress();
        };

        const onWardChange = () => {
            console.log('🏘️ Ward changed:', personalInfo.value.phuongXaCode);
            updateFullAddress();
        };

        const updateFullAddress = () => {
            const provinceName = provinces.value.find(p => p.code === personalInfo.value.tinhThanhCode)?.name || '';
            const wardName = wards.value.find(w => w.code === personalInfo.value.phuongXaCode)?.name || '';
            
            const addressParts = [
                personalInfo.value.diaChiChiTiet,
                wardName,
                provinceName
            ].filter(part => part && part.trim() !== '');
            
            personalInfo.value.fullAddress = addressParts.join(', ');
            personalInfo.value.diaChi = personalInfo.value.fullAddress;
            
            console.log('📍 Updated full address:', personalInfo.value.fullAddress);
        };

        const debugProvinces = () => {
            console.log('🔍 Debug provinces dropdown opened:');
            console.log('- provinces.value.length:', provinces.value.length);
            console.log('- loadingProvinces.value:', loadingProvinces.value);
            console.log('- provinces sample:', provinces.value.slice(0, 3));
            
            if (provinces.value.length === 0) {
                console.log('🔄 No provinces found, triggering reload...');
                fetchProvinces();
            }
        };

        // Watch để theo dõi thay đổi địa chỉ chi tiết
        watch(() => personalInfo.value.diaChiChiTiet, () => {
            updateFullAddress();
        });

        // ===== UTILITY FUNCTIONS =====
        const formatDate = (date) => {
            if (!date) return '';
            return new Date(date).toLocaleDateString('vi-VN');
        };

        const getRoleLabel = (vaiTro) => {
            switch (vaiTro) {
                case 'USER': return 'Khách hàng';
                case 'NHANVIEN': return 'Nhân viên';
                case 'ADMIN': return 'Admin';
                default: return 'Không xác định';
            }
        };

        const getRoleSeverity = (vaiTro) => {
            switch (vaiTro) {
                case 'USER': return 'primary';
                case 'NHANVIEN': return 'success';
                case 'ADMIN': return 'warn';
                default: return 'secondary';
            }
        };

        const getRoleIcon = (vaiTro) => {
            switch (vaiTro) {
                case 'USER': return 'pi pi-user';
                case 'NHANVIEN': return 'pi pi-user-edit';
                case 'ADMIN': return 'pi pi-crown';
                default: return 'pi pi-question';
            }
        };

        const syncEmailToAccount = () => {
            newAccount.value.email = personalInfo.value.email;
        };

        // ===== DATA MANAGEMENT =====
        const fetchData = async () => {
            isLoading.value = true;
            try {
                const res = await axios.get('http://localhost:8080/api/tai-khoan');
                if (res.data && Array.isArray(res.data)) {
                    accounts.value = res.data;
                } else {
                    accounts.value = [];
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Lỗi kết nối',
                    detail: `Không thể tải dữ liệu: ${error.message}`,
                    life: 5000
                });
                accounts.value = [];
            } finally {
                isLoading.value = false;
            }
        };

        const filteredAccounts = computed(() => {
            let filtered = accounts.value || [];

            if (roleFilter.value !== '') {
                filtered = filtered.filter((acc) => acc.vaiTro === roleFilter.value);
            }

            if (statusFilter.value !== '') {
                filtered = filtered.filter((acc) => acc.trangThai === parseInt(statusFilter.value));
            }

            return filtered;
        });

        // ===== DIALOG MANAGEMENT =====
        const openNew = () => {
            newAccount.value = {
                maTaiKhoan: '',
                email: '',
                matKhau: '',
                vaiTro: undefined,
                trangThai: 1
            };
            
            personalInfo.value = {
                hoTen: '',
                email: '',
                sdt: '',
                tinhThanhCode: '',
                phuongXaCode: '',
                diaChiChiTiet: '',
                diaChi: '',
                fullAddress: '',
                ngaySinh: null,
                chucVu: ''
            };
            
            wards.value = [];
            submitted.value = false;
            addDialog.value = true;
            
            console.log('🔄 Force loading provinces...');
            fetchProvinces();
        };

        const onRoleChange = () => {
            personalInfo.value = {
                hoTen: '',
                email: '',
                sdt: '',
                tinhThanhCode: '',
                phuongXaCode: '',
                diaChiChiTiet: '',
                diaChi: '',
                fullAddress: '',
                ngaySinh: null,
                chucVu: ''
            };
            
            wards.value = [];
            
            if (newAccount.value.vaiTro === 'ADMIN') {
                newAccount.value.email = '';
            }
        };

        const hideAddDialog = () => {
            addDialog.value = false;
            submitted.value = false;
        };

        const hideEditDialog = () => {
            editDialog.value = false;
            submitted.value = false;
        };

        const viewAccount = (account) => {
            viewingAccount.value = { ...account };
            viewDialog.value = true;
        };

        const editAccount = (account) => {
            editAccountData.value = {
                id: account.id,
                email: account.email,
                matKhau: '',
                vaiTro: account.vaiTro,
                trangThai: account.trangThai
            };
            submitted.value = false;
            editDialog.value = true;
        };

        const editFromView = () => {
            editAccount(viewingAccount.value);
            viewDialog.value = false;
        };

        const confirmDeleteAccount = (account) => {
            selectedAccountForDelete.value = account;
            deleteAccountDialog.value = true;
        };

        const confirmDeleteSelected = () => {
            deleteAccountsDialog.value = true;
        };

        // ===== VALIDATION FUNCTIONS =====
        const validateAccountInfo = () => {
            const errors = [];
            
            if (!newAccount.value.email?.trim()) {
                errors.push('Email không được để trống');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAccount.value.email)) {
                errors.push('Email không hợp lệ');
            }
            
            if (!newAccount.value.matKhau?.trim()) {
                errors.push('Mật khẩu không được để trống');
            } else if (newAccount.value.matKhau.length < 6) {
                errors.push('Mật khẩu phải có ít nhất 6 ký tự');
            }
            
            if (newAccount.value.vaiTro === undefined || newAccount.value.vaiTro === null) {
                errors.push('Vui lòng chọn vai trò');
            } else if (!['USER', 'NHANVIEN', 'ADMIN'].includes(newAccount.value.vaiTro)) {
                errors.push('Vai trò không hợp lệ');
            }
            
            if (newAccount.value.trangThai === undefined || newAccount.value.trangThai === null) {
                errors.push('Vui lòng chọn trạng thái');
            } else if (![0, 1].includes(newAccount.value.trangThai)) {
                errors.push('Trạng thái không hợp lệ');
            }
            
            return errors;
        };

        const validatePersonalInfo = () => {
            const errors = [];
            
            if (!personalInfo.value.hoTen?.trim()) {
                errors.push('Họ tên không được để trống');
            } else if (personalInfo.value.hoTen.trim().length < 2) {
                errors.push('Họ tên phải có ít nhất 2 ký tự');
            }
            
            if (!personalInfo.value.email?.trim()) {
                errors.push('Email cá nhân không được để trống');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.value.email)) {
                errors.push('Email cá nhân không hợp lệ');
            }
            
            if (!personalInfo.value.sdt?.trim()) {
                errors.push('Số điện thoại không được để trống');
            } else if (!/^0\d{9,10}$/.test(personalInfo.value.sdt.replace(/\s/g, ''))) {
                errors.push('Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)');
            }
            
            if (!personalInfo.value.tinhThanhCode) {
                errors.push('Vui lòng chọn Tỉnh/Thành phố');
            }
            
            if (!personalInfo.value.phuongXaCode) {
                errors.push('Vui lòng chọn Xã/Phường');
            }
            
            // ✅ VALIDATION NGÀY SINH CHO USER
            if (newAccount.value.vaiTro === 'USER' && !personalInfo.value.ngaySinh) {
                errors.push('Ngày sinh là bắt buộc cho khách hàng');
            }
            
            return errors;
        };

        // ===== UTILITY FUNCTIONS FOR ADDRESS =====
        const getProvinceName = (code) => {
            if (!code || !provinces.value) return '';
            const province = provinces.value.find(p => p.code === code);
            return province ? province.name : '';
        };

        const getWardName = (code) => {
            if (!code || !wards.value) return '';
            const ward = wards.value.find(w => w.code === code);
            return ward ? ward.name : '';
        };

        // ===== 🚀 TẠO TÀI KHOẢN MỚI - ĐÚNG NGHIỆP VỤ =====
        const saveNewAccount = async () => {
            submitted.value = true;

            try {
                // ✅ 1. VALIDATION
                const accountErrors = validateAccountInfo();
                const personalErrors = newAccount.value.vaiTro !== 'ADMIN' ? validatePersonalInfo() : [];
                
                if (accountErrors.length > 0 || personalErrors.length > 0) {
                    const allErrors = [...accountErrors, ...personalErrors];
                    toast.add({
                        severity: 'error',
                        summary: 'Lỗi xác thực',
                        detail: allErrors.join(', '),
                        life: 5000
                    });
                    return;
                }

                // ✅ 2. CHUẨN BỊ DỮ LIỆU
                const accountData = {
                    maTaiKhoan: newAccount.value.maTaiKhoan || null,
                    email: newAccount.value.email,
                    matKhau: newAccount.value.matKhau,
                    vaiTro: newAccount.value.vaiTro,
                    trangThai: newAccount.value.trangThai
                };

                // ✅ 3. THÊM THÔNG TIN CÁ NHÂN CHO NON-ADMIN
                if (newAccount.value.vaiTro !== 'ADMIN') {
                    updateFullAddress(); // Đảm bảo địa chỉ được cập nhật
                    
                    accountData.hoTen = personalInfo.value.hoTen;
                    accountData.sdt = personalInfo.value.sdt;
                    
                    // ✅ GỬI THÔNG TIN ĐỊA CHỈ DẠNG FLAT
                    accountData.maTinh = personalInfo.value.tinhThanhCode;
                    accountData.maPhuong = personalInfo.value.phuongXaCode;
                    accountData.diaChiChiTiet = personalInfo.value.diaChiChiTiet || '';
                    
                    // ✅ FORMAT NGÀY SINH CHO USER
                    if (newAccount.value.vaiTro === 'USER' && personalInfo.value.ngaySinh) {
                        accountData.ngaySinh = personalInfo.value.ngaySinh.toISOString().split('T')[0];
                    }
                    
                    // ✅ THÊM CHỨC VỤ CHO NHÂN VIÊN
                    if (newAccount.value.vaiTro === 'NHANVIEN' && personalInfo.value.chucVu) {
                        accountData.chucVu = personalInfo.value.chucVu;
                    }
                }

                // ✅ 4. DEBUG LOGGING
                console.log('=== 📤 FRONTEND REQUEST ===');
                console.log('URL:', 'http://localhost:8080/api/tai-khoan');
                console.log('Method:', 'POST');
                console.log('Full data:', JSON.stringify(accountData, null, 2));
                console.log('🏠 Address data being sent:', {
                    maTinh: accountData.maTinh,
                    maPhuong: accountData.maPhuong,
                    diaChiChiTiet: accountData.diaChiChiTiet
                });
                console.log('============================');

                // ✅ 5. GỬI REQUEST
                const response = await axios.post(
                    'http://localhost:8080/api/tai-khoan', 
                    accountData, 
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 15000
                    }
                );
                
                console.log('=== 📥 BACKEND RESPONSE ===');
                console.log('Status:', response.status);
                console.log('Data:', response.data);
                console.log('===========================');
                
                // ✅ 6. XỬ LÝ RESPONSE THÀNH CÔNG
                if (response.status === 201) {
                    await handleSuccessfulCreation(response.data);
                } else {
                    throw new Error(`Unexpected response status: ${response.status}`);
                }
                
            } catch (error) {
                console.error('=== ❌ FRONTEND ERROR ===');
                console.error('Error type:', error.constructor.name);
                console.error('Error message:', error.message);
                
                if (error.response) {
                    console.error('Response status:', error.response.status);
                    console.error('Response data:', error.response.data);
                    handleApiError(error.response);
                } else if (error.request) {
                    console.error('No response received:', error.request);
                    handleNetworkError();
                } else {
                    console.error('Request setup error:', error.message);
                    handleGenericError(error);
                }
                console.error('========================');
            }
        };

        // ===== ERROR HANDLING =====
        const handleApiError = (response) => {
            const status = response.status;
            const data = response.data;
            
            let errorMessage = 'Không thể tạo tài khoản';
            let details = '';
            
            switch (status) {
                case 400:
                    errorMessage = 'Dữ liệu không hợp lệ';
                    if (data.errors && typeof data.errors === 'object') {
                        details = Object.values(data.errors).join(', ');
                    } else {
                        details = data.error || data.message || 'Kiểm tra lại thông tin đã nhập';
                    }
                    break;
                    
                case 409:
                    errorMessage = 'Email đã tồn tại';
                    details = 'Vui lòng sử dụng email khác';
                    break;
                    
                case 500:
                    errorMessage = 'Lỗi server';
                    details = data.error || data.message || 'Lỗi xử lý trên server';
                    break;
                    
                case 422:
                    errorMessage = 'Dữ liệu không hợp lệ';
                    details = data.error || data.message || 'Validation failed';
                    break;
                    
                default:
                    errorMessage = `Lỗi HTTP ${status}`;
                    details = data.error || data.message || 'Lỗi không xác định';
            }
            
            toast.add({
                severity: 'error',
                summary: errorMessage,
                detail: details,
                life: 6000
            });
        };

        const handleNetworkError = () => {
            toast.add({
                severity: 'error',
                summary: 'Lỗi kết nối',
                detail: 'Không thể kết nối đến server. Vui lòng kiểm tra:\n• Server có đang chạy không?\n• URL có đúng không?\n• Kết nối mạng có ổn định không?',
                life: 8000
            });
        };

        const handleGenericError = (error) => {
            toast.add({
                severity: 'error',
                summary: 'Lỗi không xác định',
                detail: error.message || 'Đã xảy ra lỗi không mong muốn',
                life: 5000
            });
        };

        // ===== SUCCESS HANDLING =====
        const handleSuccessfulCreation = async (responseData) => {
            console.log('Processing successful response:', responseData);
            
            try {
                // Cập nhật danh sách tài khoản
                if (responseData.success && responseData.data && responseData.data.taiKhoan) {
                    accounts.value.push(responseData.data.taiKhoan);
                } else if (responseData.data && responseData.data.taiKhoan) {
                    accounts.value.push(responseData.data.taiKhoan);
                }
                
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: responseData.message || 'Tài khoản đã được tạo thành công',
                    life: 4000
                });
                
                hideAddDialog();
                
                // Tải lại dữ liệu để đồng bộ
                try {
                    await fetchData();
                    console.log('✅ Data refreshed successfully');
                } catch (fetchError) {
                    console.warn('⚠️ Could not refresh data:', fetchError);
                    toast.add({
                        severity: 'warn',
                        summary: 'Cảnh báo',
                        detail: 'Tài khoản đã tạo nhưng không thể tải lại danh sách',
                        life: 3000
                    });
                }
                
                // Điều hướng theo vai trò
                navigateAfterCreate(newAccount.value.vaiTro);
                
            } catch (error) {
                console.error('Error in handleSuccessfulCreation:', error);
                toast.add({
                    severity: 'warn',
                    summary: 'Cảnh báo',
                    detail: 'Tài khoản đã được tạo nhưng có lỗi khi xử lý response',
                    life: 3000
                });
            }
        };

        // ===== NAVIGATION =====
        const navigateAfterCreate = (vaiTro) => {
            console.log('Navigating after account creation for role:', vaiTro);
            
            setTimeout(() => {
                try {
                    switch(vaiTro) {
                        case 'USER':
                            console.log('Navigating to khach-hang page...');
                            router.push('/khach-hang');
                            toast.add({
                                severity: 'info',
                                summary: 'Chuyển hướng',
                                detail: 'Đang chuyển đến trang quản lý khách hàng...',
                                life: 2000
                            });
                            break;
                            
                        case 'NHANVIEN':
                            console.log('Navigating to nhan-vien page...');
                            router.push('/nhan-vien');
                            toast.add({
                                severity: 'info',
                                summary: 'Chuyển hướng',
                                detail: 'Đang chuyển đến trang quản lý nhân viên...',
                                life: 2000
                            });
                            break;
                            
                        case 'ADMIN':
                            console.log('Admin account created, staying on current page');
                            toast.add({
                                severity: 'info',
                                summary: 'Tài khoản Admin',
                                detail: 'Tài khoản Admin đã được tạo thành công',
                                life: 2000
                            });
                            break;
                            
                        default:
                            console.warn('Unknown role for navigation:', vaiTro);
                            toast.add({
                                severity: 'warn',
                                summary: 'Cảnh báo',
                                detail: 'Vai trò không xác định, ở lại trang hiện tại',
                                life: 2000
                            });
                    }
                } catch (navError) {
                    console.error('Navigation error:', navError);
                    toast.add({
                        severity: 'warn',
                        summary: 'Lỗi điều hướng',
                        detail: 'Tài khoản đã được tạo nhưng không thể chuyển trang tự động',
                        life: 3000
                    });
                }
            }, 1500);
        };

        // ===== CÁC OPERATIONS KHÁC =====
        const updateAccount = async () => {
            submitted.value = true;
            if (!editAccountData.value.email || 
                editAccountData.value.vaiTro === undefined || 
                editAccountData.value.trangThai === undefined) {
                toast.add({
                    severity: 'error',
                    summary: 'Lỗi xác thực',
                    detail: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                    life: 3000
                });
                return;
            }

            try {
                const updateData = {
                    email: editAccountData.value.email,
                    vaiTro: editAccountData.value.vaiTro,
                    trangThai: editAccountData.value.trangThai
                };

                if (editAccountData.value.matKhau) {
                    updateData.matKhau = editAccountData.value.matKhau;
                }

                const response = await axios.put(
                    `http://localhost:8080/api/tai-khoan/${editAccountData.value.id}`, 
                    updateData
                );

                if (response.data) {
                    const index = accounts.value.findIndex(acc => acc.id === editAccountData.value.id);
                    if (index !== -1) {
                        accounts.value[index] = { ...accounts.value[index], ...response.data };
                    }

                    toast.add({
                        severity: 'success',
                        summary: 'Thành công',
                        detail: 'Tài khoản đã được cập nhật',
                        life: 3000
                    });
                    hideEditDialog();
                    await fetchData();
                }
            } catch (error) {
                console.error('Error updating account:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Lỗi cập nhật',
                    detail: error.response?.data?.message || 'Không thể cập nhật tài khoản',
                    life: 5000
                });
            }
        };

        const deleteAccount = async () => {
            try {
                await axios.delete(`http://localhost:8080/api/tai-khoan/${selectedAccountForDelete.value.id}`);
                accounts.value = accounts.value.filter(acc => acc.id !== selectedAccountForDelete.value.id);
                deleteAccountDialog.value = false;
                selectedAccountForDelete.value = null;
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Tài khoản đã được xóa',
                    life: 3000
                });
            } catch (error) {
                console.error('Error deleting account:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Lỗi xóa tài khoản',
                    detail: error.response?.data?.message || 'Không thể xóa tài khoản',
                    life: 5000
                });
            }
        };

        const deleteSelectedAccounts = async () => {
            try {
                const deletePromises = selectedAccounts.value.map(account => 
                    axios.delete(`http://localhost:8080/api/tai-khoan/${account.id}`)
                );
                await Promise.all(deletePromises);
                accounts.value = accounts.value.filter(acc => 
                    !selectedAccounts.value.some(selected => selected.id === acc.id)
                );
                deleteAccountsDialog.value = false;
                selectedAccounts.value = null;
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Các tài khoản đã được xóa',
                    life: 3000
                });
            } catch (error) {
                console.error('Error deleting accounts:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Lỗi xóa tài khoản',
                    detail: 'Không thể xóa một số tài khoản',
                    life: 5000
                });
            }
        };
        
        const changeStatus = async (account) => {
            try {
                const newStatus = account.trangThai === 1 ? 0 : 1;
                const response = await axios.patch(
                    `http://localhost:8080/api/tai-khoan/${account.id}/trang-thai?trangThai=${newStatus}`
                );

                if (response.status === 200) {
                    const index = accounts.value.findIndex(acc => acc.id === account.id);
                    if (index !== -1) {
                        accounts.value[index].trangThai = newStatus;
                        accounts.value[index].ngayCapNhat = new Date();
                    }

                    toast.add({
                        severity: 'success',
                        summary: 'Thành công',
                        detail: `Tài khoản đã được ${newStatus === 1 ? 'kích hoạt' : 'ngưng hoạt động'}`,
                        life: 3000
                    });
                }
            } catch (error) {
                console.error('Error changing status:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Lỗi thay đổi trạng thái',
                    detail: error.response?.data?.error || 'Không thể thay đổi trạng thái',
                    life: 5000
                });
            }
        };

        const exportCSV = () => {
            if (dt.value) {
                dt.value.exportCSV();
            }
        };

        // ===== LIFECYCLE HOOKS =====
        onMounted(() => {
            console.log('🚀 Component mounted, initializing...');
            fetchData();
            fetchProvinces();
        });
        
        // ===== RETURN ALL METHODS AND REFS =====
        return {
            // Refs
            dt,
            accounts,
            addDialog,
            editDialog,
            viewDialog,
            deleteAccountDialog,
            deleteAccountsDialog,
            selectedAccountForDelete,
            viewingAccount,
            selectedAccounts,
            filters,
            roleFilter,
            statusFilter,
            submitted,
            isLoading,
            newAccount,
            personalInfo,
            editAccountData,
            roleOptions,
            roleOptionsForForm,
            statusOptions,
            statusOptionsForForm,
            provinces,
            wards,
            loadingProvinces,
            loadingWards,
            
            // Computed
            filteredAccounts,
            
            // Methods - Data Management
            fetchData,
            
            // Methods - Dialog Management
            openNew,
            onRoleChange,
            hideAddDialog,
            hideEditDialog,
            viewAccount,
            editAccount,
            editFromView,
            confirmDeleteAccount,
            confirmDeleteSelected,
            
            // Methods - Account Operations
            saveNewAccount,
            updateAccount,
            deleteAccount,
            deleteSelectedAccounts,
            changeStatus,
            
            // Methods - Address Management
            updateFullAddress,
            onProvinceChange,
            onWardChange,
            fetchProvinces,
            fetchWards,
            debugProvinces,
            getProvinceName,
            getWardName,
            
            // Methods - Utility
            formatDate,
            getRoleLabel,
            getRoleSeverity,
            getRoleIcon,
            syncEmailToAccount,
            exportCSV,
            navigateAfterCreate,
            
            // Methods - Validation
            validateAccountInfo,
            validatePersonalInfo,
            
            // Methods - Error Handling
            handleApiError,
            handleNetworkError,
            handleGenericError,
            handleSuccessfulCreation
        };
    }
};
</script>