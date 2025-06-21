<template>
  <div class="card">
    <!-- Toolbar -->
    <Toolbar class="mb-6">
      <template #start>
        <Button label="Thêm mới" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
        <Button
          label="Xóa"
          icon="pi pi-trash"
          severity="secondary"
          @click="confirmDeleteSelected"
          :disabled="!selectedNhanVien || !selectedNhanVien.length"
        />
      </template>
      <template #end>
        <Button label="Xuất CSV" icon="pi pi-upload" severity="secondary" @click="exportCSV" />
      </template>
    </Toolbar>

    <!-- DataTable -->
    <DataTable
      ref="dt"
      v-model:selection="selectedNhanVien"
      :value="filteredNhanVien"
      dataKey="id"
      :paginator="true"
      :rows="10"
      :filters="filters"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[5, 10, 25]"
      currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} nhân viên"
      :loading="isLoading"
    >
      <template #header>
        <div class="flex flex-wrap gap-2 items-center justify-between">
          <h4 class="m-0">Quản Lý Nhân Viên</h4>
          <IconField>
            <InputIcon>
              <i class="pi pi-search" />
            </InputIcon>
            <InputText v-model="filters['global'].value" placeholder="Tìm kiếm..." />
          </IconField>
          <Select
            v-model="statusFilter"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Lọc trạng thái"
            class="w-12rem"
          />
        </div>
      </template>

      <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
      <Column field="id" header="ID" sortable style="width: 8rem">
        <template #body="slotProps">
          <span class="font-bold text-primary">#{{ slotProps.data.id }}</span>
        </template>
      </Column>
      <Column field="maNhanVien" header="Mã NV" sortable style="width: 10rem">
        <template #body="slotProps">
          <Tag :value="slotProps.data.maNhanVien" severity="secondary" />
        </template>
      </Column>
      <Column field="hoTen" header="Thông tin" sortable style="min-width: 16rem">
        <template #body="slotProps">
          <div class="flex items-center">
            <span
              class="rounded-circle w-2rem h-2rem flex items-center justify-center text-white font-bold mr-2"
              :style="{ background: 'linear-gradient(45deg, #007bff, #6f42c1)' }"
            >
              {{ getInitials(slotProps.data.hoTen) }}
            </span>
            <span class="font-semibold">{{ slotProps.data.hoTen }}</span>
          </div>
        </template>
      </Column>
      <!-- Cột địa chỉ -->
      <Column header="Địa chỉ" style="min-width: 18rem">
        <template #body="slotProps">
          <div class="flex flex-col">
            <span class="text-sm text-muted">
              <i class="pi pi-map-marker mr-1 text-muted"></i>
              {{ formatFullAddress(slotProps.data.diaChiInfo) }}
            </span>
          </div>
        </template>
      </Column>
      <Column header="Liên hệ" style="min-width: 16rem">
        <template #body="slotProps">
          <div class="flex flex-col">
            <span class="mb-1">
              <i class="pi pi-envelope mr-1 text-muted"></i>
              {{ slotProps.data.email }}
            </span>
            <span>
              <i class="pi pi-phone mr-1 text-muted"></i>
              {{ slotProps.data.sdt }}
            </span>
          </div>
        </template>
      </Column>
      <Column field="trangThai" header="Trạng thái" sortable style="width: 12rem">
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.trangThai === 1 ? 'Hoạt động' : 'Ngưng'"
            :severity="slotProps.data.trangThai === 1 ? 'success' : 'danger'"
          >
            <i
              :class="slotProps.data.trangThai === 1 ? 'pi pi-check-circle' : 'pi pi-times-circle'"
              class="mr-1"
            ></i>
            {{ slotProps.data.trangThai === 1 ? "Hoạt động" : "Ngưng" }}
          </Tag>
        </template>
      </Column>
      <Column :exportable="false" style="width: 12rem">
        <template #body="slotProps">
          <Button
            icon="pi pi-pencil"
            outlined
            rounded
            class="mr-2"
            @click="editNhanVien(slotProps.data)"
          />
          <Button
            icon="pi pi-trash"
            outlined
            rounded
            severity="danger"
            @click="confirmDeleteNhanVien(slotProps.data)"
          />
          <Button
            icon="pi pi-refresh"
            outlined
            rounded
            severity="secondary"
            class="ml-2"
            @click="changeStatus(slotProps.data)"
            :title="slotProps.data.trangThai === 1 ? 'Ngưng hoạt động' : 'Kích hoạt'"
          />
        </template>
      </Column>
      <template #empty>
        <div class="text-center p-5">
          <i class="pi pi-users text-5xl text-muted mb-3"></i>
          <h5 class="text-muted">Không tìm thấy nhân viên</h5>
          <p class="text-muted">Thử thay đổi bộ lọc hoặc thêm nhân viên mới.</p>
        </div>
      </template>
    </DataTable>

    <!-- Add/Edit Employee Dialog -->
    <Dialog
      v-model:visible="nhanVienDialog"
      :style="{ width: '700px' }"
      :header="nhanVien.id ? 'Cập nhật nhân viên' : 'Thêm nhân viên'"
      :modal="true"
    >
      <div class="flex flex-col gap-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="hoTen" class="block font-bold mb-3">Họ Tên</label>
            <InputText
              id="hoTen"
              v-model.trim="nhanVien.hoTen"
              required="true"
              autofocus
              :invalid="submitted && !nhanVien.hoTen"
              fluid
            />
            <small v-if="submitted && !nhanVien.hoTen" class="text-red-500"
              >Họ tên là bắt buộc.</small
            >
          </div>
          <div>
            <label for="maNhanVien" class="block font-bold mb-3">Mã nhân viên</label>
            <InputText id="maNhanVien" v-model="nhanVien.maNhanVien" fluid />
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="email" class="block font-bold mb-3">Email</label>
            <InputText id="email" v-model="nhanVien.email" fluid />
          </div>
          <div>
            <label for="sdt" class="block font-bold mb-3">Số điện thoại</label>
            <InputText id="sdt" v-model="nhanVien.sdt" fluid />
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="taiKhoan" class="block font-bold mb-3">ID Tài khoản</label>
            <InputText id="taiKhoan" v-model.number="nhanVien.taiKhoan" fluid type="number" />
          </div>
          <div>
            <label for="trangThai" class="block font-bold mb-3">Trạng thái</label>
            <Select
              id="trangThai"
              v-model="nhanVien.trangThai"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Chọn trạng thái"
              fluid
            />
          </div>
        </div>

        <!-- Phần địa chỉ -->
        <div class="border-top pt-4">
          <div class="flex justify-between items-center mb-3">
            <h5 class="mb-0">Thông tin địa chỉ</h5>
            <Button 
              v-if="nhanVien.diaChi" 
              label="Chọn địa chỉ khác" 
              icon="pi pi-search" 
              size="small" 
              outlined 
              @click="showAddressSelector = true"
            />
          </div>
          <div class="grid grid-cols-1 gap-4">
            <div>
              <label for="tenKhachHang" class="block font-bold mb-3">Tên (trong địa chỉ)</label>
              <InputText id="tenKhachHang" v-model="nhanVien.newAddress.tenKhachHang" placeholder="Tên trong địa chỉ..." fluid />
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label for="tenPhuong" class="block font-bold mb-3">Tên Phường</label>
                <InputText id="tenPhuong" v-model="nhanVien.newAddress.tenPhuong" placeholder="Tên phường" fluid />
              </div>
              <div>
                <label for="tenHuyen" class="block font-bold mb-3">Tên Huyện</label>
                <InputText id="tenHuyen" v-model="nhanVien.newAddress.tenHuyen" placeholder="Tên huyện" fluid />
              </div>
              <div>
                <label for="tenTinh" class="block font-bold mb-3">Tên Tỉnh</label>
                <InputText id="tenTinh" v-model="nhanVien.newAddress.tenTinh" placeholder="Tên tỉnh" fluid />
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" />
        <Button label="Lưu" icon="pi pi-check" @click="saveNhanVien" />
      </template>
    </Dialog>

    <!-- Address Selector Dialog -->
    <Dialog v-model:visible="showAddressSelector" :style="{ width: '800px' }" header="Chọn địa chỉ" :modal="true">
      <div class="mb-4">
        <IconField>
          <InputIcon>
            <i class="pi pi-search" />
          </InputIcon>
          <InputText v-model="addressSearchKeyword" placeholder="Tìm kiếm địa chỉ..." fluid @input="searchAddresses" />
        </IconField>
      </div>
      <DataTable :value="addresses" dataKey="id" :paginator="true" :rows="5" selectionMode="single" @row-select="selectAddress">
        <Column field="id" header="ID" style="width: 5rem"></Column>
        <Column field="tenKhachHang" header="Tên"></Column>
        <Column header="Khu vực">
          <template #body="slotProps">
            {{ formatFullAddress(slotProps.data) }}
          </template>
        </Column>
      </DataTable>
      <template #footer>
        <Button label="Đóng" icon="pi pi-times" text @click="showAddressSelector = false" />
      </template>
    </Dialog>

    <!-- Delete Employee Dialog -->
    <Dialog
      v-model:visible="deleteNhanVienDialog"
      :style="{ width: '450px' }"
      header="Xác nhận xóa"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span v-if="nhanVien"
          >Bạn có chắc chắn muốn xóa <b>{{ nhanVien.hoTen }}</b>?</span
        >
      </div>
      <template #footer>
        <Button label="Không" icon="pi pi-times" text @click="deleteNhanVienDialog = false" />
        <Button label="Có" icon="pi pi-check" @click="deleteNhanVien" />
      </template>
    </Dialog>

    <!-- Delete Selected Employees Dialog -->
    <Dialog
      v-model:visible="deleteNhanViensDialog"
      :style="{ width: '450px' }"
      header="Xác nhận xóa"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span>Bạn có chắc chắn muốn xóa các nhân viên đã chọn?</span>
      </div>
      <template #footer>
        <Button label="Không" icon="pi pi-times" text @click="deleteNhanViensDialog = false" />
        <Button label="Có" icon="pi pi-check" text @click="deleteSelectedNhanViens" />
      </template>
    </Dialog>

    <!-- Toast Notifications -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import axios from 'axios';

const toast = useToast();
const dt = ref();
const nhanViens = ref([]);
const addresses = ref([]);
const nhanVienDialog = ref(false);
const showAddressSelector = ref(false);
const deleteNhanVienDialog = ref(false);
const deleteNhanViensDialog = ref(false);
const nhanVien = ref({});
const selectedNhanVien = ref();
const addressSearchKeyword = ref('');
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});
const statusFilter = ref('');
const submitted = ref(false);
const isLoading = ref(false);
const statusOptions = ref([
  { label: 'Tất cả trạng thái', value: '' },
  { label: 'Hoạt động', value: 1 },
  { label: 'Ngưng hoạt động', value: 0 },
]);

onMounted(() => {
  fetchData();
  fetchAddresses();
});

async function fetchData() {
  isLoading.value = true;
  try {
    const res = await axios.get('http://localhost:8080/nhan-vien');
    const nhanViensData = res.data;
    
    // Fetch địa chỉ cho mỗi nhân viên
    for (let nhanVienItem of nhanViensData) {
      if (nhanVienItem.diaChi) {
        try {
          const addressRes = await axios.get(`http://localhost:8080/api/dia-chi/${nhanVienItem.diaChi}`);
          nhanVienItem.diaChiInfo = addressRes.data;
        } catch (error) {
          console.error(`Error fetching address for employee ${nhanVienItem.id}:`, error);
          nhanVienItem.diaChiInfo = null;
        }
      }
    }
    
    nhanViens.value = nhanViensData;
    
  } catch (error) {
    console.error('Error fetching data:', error.response?.data || error.message);
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: error.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu nhân viên',
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
}

async function fetchAddresses() {
  try {
    const res = await axios.get('http://localhost:8080/api/dia-chi');
    addresses.value = res.data;
  } catch (error) {
    console.error('Error fetching addresses:', error);
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi tải danh sách địa chỉ', life: 3000 });
  }
}

async function searchAddresses() {
  if (addressSearchKeyword.value.trim()) {
    try {
      const res = await axios.get(`http://localhost:8080/api/dia-chi/search?keyword=${encodeURIComponent(addressSearchKeyword.value)}`);
      addresses.value = res.data;
    } catch (error) {
      console.error('Error searching addresses:', error);
    }
  } else {
    fetchAddresses();
  }
}

// Hàm format địa chỉ đầy đủ theo DTO structure
function formatFullAddress(diaChiInfo) {
  if (!diaChiInfo) return 'Chưa cập nhật địa chỉ';
  
  const parts = [
    diaChiInfo.tenPhuong,
    diaChiInfo.tenHuyen, 
    diaChiInfo.tenTinh
  ].filter(part => part && part.trim() !== '');
  
  return parts.length > 0 ? parts.join(', ') : 'Chưa cập nhật thông tin';
}

const filteredNhanVien = computed(() => {
  let filtered = nhanViens.value;

  if (statusFilter.value !== '') {
    filtered = filtered.filter((nv) => nv.trangThai === parseInt(statusFilter.value));
  }

  return filtered;
});

function openNew() {
  nhanVien.value = { 
    trangThai: 1,
    newAddress: {
      tenKhachHang: '',
      tenTinh: '',
      tenHuyen: '',
      tenPhuong: ''
    }
  };
  submitted.value = false;
  nhanVienDialog.value = true;
}

function hideDialog() {
  nhanVienDialog.value = false;
  submitted.value = false;
}

async function saveNhanVien() {
  submitted.value = true;

  if (nhanVien.value.hoTen?.trim()) {
    try {
      let addressId = nhanVien.value.diaChi;
      
      // Nếu có thông tin địa chỉ mới, tạo hoặc cập nhật địa chỉ
      if (nhanVien.value.newAddress && (
        nhanVien.value.newAddress.tenKhachHang || 
        nhanVien.value.newAddress.tenTinh || 
        nhanVien.value.newAddress.tenHuyen || 
        nhanVien.value.newAddress.tenPhuong
      )) {
        if (addressId) {
          // Cập nhật địa chỉ hiện có
          await axios.put(`http://localhost:8080/api/dia-chi/${addressId}`, nhanVien.value.newAddress);
        } else {
          // Tạo địa chỉ mới
          const addressRes = await axios.post('http://localhost:8080/api/dia-chi', nhanVien.value.newAddress);
          addressId = addressRes.data.id;
        }
      }

      // Chuẩn bị dữ liệu nhân viên theo DTO structure
      const nhanVienData = {
        id: nhanVien.value.id,
        maNhanVien: nhanVien.value.maNhanVien || createId(),
        email: nhanVien.value.email,
        hoTen: nhanVien.value.hoTen,
        sdt: nhanVien.value.sdt,
        trangThai: nhanVien.value.trangThai,
        diaChi: addressId, // Chỉ gửi ID
        taiKhoan: nhanVien.value.taiKhoan || 1 // Default value
      };

      if (nhanVien.value.id) {
        await axios.put(`http://localhost:8080/nhan-vien/${nhanVien.value.id}`, nhanVienData);
        toast.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Cập nhật nhân viên thành công',
          life: 3000,
        });
      } else {
        await axios.post('http://localhost:8080/nhan-vien', nhanVienData);
        toast.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Thêm nhân viên thành công',
          life: 3000,
        });
      }
      
      await fetchData();
      await fetchAddresses();
      nhanVienDialog.value = false;
      nhanVien.value = {};
    } catch (error) {
      console.error('Error saving employee:', error.response?.data || error.message);
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: error.response?.data?.message || 'Có lỗi xảy ra khi lưu nhân viên',
        life: 3000,
      });
    }
  }
}

function editNhanVien(nv) {
  nhanVien.value = { 
    ...nv,
    newAddress: nv.diaChiInfo ? { ...nv.diaChiInfo } : {
      tenKhachHang: '',
      tenTinh: '',
      tenHuyen: '',
      tenPhuong: ''
    }
  };
  nhanVienDialog.value = true;
}

function selectAddress(event) {
  nhanVien.value.diaChi = event.data.id;
  nhanVien.value.newAddress = { ...event.data };
  showAddressSelector.value = false;
}

function confirmDeleteNhanVien(nv) {
  nhanVien.value = nv;
  deleteNhanVienDialog.value = true;
}

async function deleteNhanVien() {
  try {
    await axios.delete(`http://localhost:8080/nhan-vien/${nhanVien.value.id}`);
    await fetchData();
    deleteNhanVienDialog.value = false;
    nhanVien.value = {};
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Xóa nhân viên thành công',
      life: 3000,
    });
  } catch (error) {
    console.error('Error deleting employee:', error.response?.data || error.message);
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: error.response?.data?.message || 'Có lỗi xảy ra khi xóa nhân viên',
      life: 3000,
    });
  }
}

async function changeStatus(nv) {
  try {
    const newStatus = nv.trangThai === 1 ? 0 : 1;
    await axios.put(`http://localhost:8080/nhan-vien/${nv.id}`, {
      ...nv,
      trangThai: newStatus,
    });
    await fetchData();
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: `Đã ${newStatus === 1 ? 'kích hoạt' : 'ngưng'} nhân viên`,
      life: 3000,
    });
  } catch (error) {
    console.error('Error changing status:', error.response?.data || error.message);
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: error.response?.data?.message || 'Có lỗi xảy ra khi thay đổi trạng thái',
      life: 3000,
    });
  }
}

function confirmDeleteSelected() {
  deleteNhanViensDialog.value = true;
}

async function deleteSelectedNhanViens() {
  try {
    for (const nv of selectedNhanVien.value) {
      await axios.delete(`http://localhost:8080/nhan-vien/${nv.id}`);
    }
    await fetchData();
    deleteNhanViensDialog.value = false;
    selectedNhanVien.value = null;
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Xóa các nhân viên thành công',
      life: 3000,
    });
  } catch (error) {
    console.error('Error deleting employees:', error.response?.data || error.message);
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: error.response?.data?.message || 'Có lỗi xảy ra khi xóa nhân viên',
      life: 3000,
    });
  }
}

// function exportCSV() {
//   dt.value.exportCSV();
// }
function exportCSV() {
    try {
        // If no data, show warning
        if (!nhanViens.value || nhanViens.value.length === 0) {
            toast.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Không có dữ liệu để xuất',
                life: 3000
            });
            return;
        }

        // Create CSV headers with Vietnamese labels
        const headers = ['ID', 'Mã Nhân Viên', 'Tên Nhân Viên', 'Email', 'Số Điện Thoại', 'Trạng Thái'];

        // Convert data to CSV format
        const csvData = nhanViens.value.map(item => {
            return [
                item.id || '',
                item.maNhanVien || '',
                item.hoTen || '',
                item.email || '',
                item.sdt || '',
                item.trangThai === 1 ? 'Hoạt động' : 'Ngừng hoạt động'
            ];
        });

        // Combine headers and data
        const csvContent = [headers, ...csvData]
            .map(row => row.map(field => {
                // Handle fields that might contain commas or quotes
                const stringField = String(field);
                if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                    return `"${stringField.replace(/"/g, '""')}"`;
                }
                return stringField;
            }).join(','))
            .join('\n');

        // Add BOM for proper UTF-8 encoding in Excel
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;

        // Create and download file
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            
            // Generate filename with current date
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
            const filename = `NhanVien-${dateStr}.csv`;

            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show success message
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã xuất ${nhanViens.value.length} bản ghi ra file CSV`,
                life: 3000
            });
        }
    } catch (error) {
        console.error('Error exporting CSV:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Xuất CSV thất bại',
            life: 3000
        });
    }
}

function createId() {
  let id = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 5; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function getInitials(name) {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
</script>

<style scoped>
.card {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}
</style>