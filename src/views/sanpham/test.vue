const statuses = ref([ { label: 'CÒN HÀNG', value: 'INSTOCK' }, { label: 'SẮP HẾT', value: 'LOWSTOCK' }, { label: 'HẾT HÀNG', value: 'OUTOFSTOCK' } ]); function formatCurrency(value) { if (value) return value.toLocaleString('vi-VN', { style:
'currency', currency: 'VND' }); return '0 ₫'; } function openNew() { product.value = { inventoryStatus: 'INSTOCK', category: '', rating: 0, quantity: 0, price: 0 }; submitted.value = false; productDialog.value = true; } function hideDialog() {
productDialog.value = false; submitted.value = false; } function saveProduct() { submitted.value = true; if (product?.value.name?.trim() && product?.value.price && product?.value.category) { if (product.value.id) { // Cập nhật sản phẩm
product.value.inventoryStatus = product.value.inventoryStatus?.value || product.value.inventoryStatus; const index = findIndexById(product.value.id); products.value[index] = { ...product.value }; toast.add({ severity: 'success', summary: 'Thành
công', detail: `Đã cập nhật sản phẩm "${product.value.name}"`, life: 3000 }); } else { // Thêm sản phẩm mới const newProduct = { ...product.value, id: createId(), code: product.value.code || createId(), image: 'product-placeholder.svg',
inventoryStatus: product.value.inventoryStatus?.value || product.value.inventoryStatus || 'INSTOCK', createdAt: new Date().toLocaleDateString('vi-VN'), orders: [] // Khởi tạo mảng đơn hàng trống }; products.value.push(newProduct); toast.add({
severity: 'success', summary: 'Thành công', detail: `Đã thêm sản phẩm "${newProduct.name}"`, life: 3000 }); } productDialog.value = false; product.value = {}; submitted.value = false; } } function editProduct(prod) { product.value = { ...prod };
productDialog.value = true; } function confirmDeleteProduct(prod) { product.value = prod; deleteProductDialog.value = true; } function deleteProduct() { const productName = product.value.name; products.value = products.value.filter((val) => val.id
!== product.value.id); deleteProductDialog.value = false; product.value = {}; toast.add({ severity: 'success', summary: 'Đã xóa', detail: `Sản phẩm "${productName}" đã được xóa khỏi hệ thống`, life: 3000 }); } function confirmDeleteSelected() {
deleteProductsDialog.value = true; } function deleteSelectedProducts() { const count = selectedProducts.value.length; products.value = products.value.filter((val) => !selectedProducts.value.includes(val)); deleteProductsDialog.value = false;
selectedProducts.value = null; toast.add({ severity: 'success', summary: 'Đã xóa', detail: `Đã xóa ${count} sản phẩm
<script setup>
import { ProductService } from '@/service/ProductService';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

onMounted(() => {
    ProductService.getProducts().then((data) => (products.value = data));
});

const toast = useToast();
const dt = ref();
const products = ref();
const productDialog = ref(false);
const deleteProductDialog = ref(false);
const deleteProductsDialog = ref(false);
const product = ref({});
const selectedProducts = ref();
const expandedRows = ref([]);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);
const statuses = ref([
    { label: 'INSTOCK', value: 'instock' },
    { label: 'LOWSTOCK', value: 'lowstock' },
    { label: 'OUTOFSTOCK', value: 'outofstock' }
]);

function formatCurrency(value) {
    if (value) return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    return;
}

function openNew() {
    product.value = {};
    submitted.value = false;
    productDialog.value = true;
}

function hideDialog() {
    productDialog.value = false;
    submitted.value = false;
}

function saveProduct() {
    submitted.value = true;

    if (product?.value.name?.trim()) {
        if (product.value.id) {
            product.value.inventoryStatus = product.value.inventoryStatus.value ? product.value.inventoryStatus.value : product.value.inventoryStatus;
            products.value[findIndexById(product.value.id)] = product.value;
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Updated', life: 3000 });
        } else {
            product.value.id = createId();
            product.value.code = createId();
            product.value.image = 'product-placeholder.svg';
            product.value.inventoryStatus = product.value.inventoryStatus ? product.value.inventoryStatus.value : 'INSTOCK';
            products.value.push(product.value);
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Created', life: 3000 });
        }

        productDialog.value = false;
        product.value = {};
    }
}

function editProduct(prod) {
    product.value = { ...prod };
    productDialog.value = true;
}

function confirmDeleteProduct(prod) {
    product.value = prod;
    deleteProductDialog.value = true;
}

function deleteProduct() {
    products.value = products.value.filter((val) => val.id !== product.value.id);
    deleteProductDialog.value = false;
    product.value = {};
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Deleted', life: 3000 });
}

function findIndexById(id) {
    let index = -1;
    for (let i = 0; i < products.value.length; i++) {
        if (products.value[i].id === id) {
            index = i;
            break;
        }
    }

    return index;
}

function createId() {
    let id = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 5; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

function exportCSV() {
    dt.value.exportCSV();
}

function confirmDeleteSelected() {
    deleteProductsDialog.value = true;
}

function deleteSelectedProducts() {
    products.value = products.value.filter((val) => !selectedProducts.value.includes(val));
    deleteProductsDialog.value = false;
    selectedProducts.value = null;
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Products Deleted', life: 3000 });
}

function getStatusLabel(status) {
    switch (status) {
        case 'INSTOCK':
            return 'success';

        case 'LOWSTOCK':
            return 'warn';

        case 'OUTOFSTOCK':
            return 'danger';

        default:
            return null;
    }
}

function getStockSeverity(product) {
    switch (product.inventoryStatus) {
        case 'INSTOCK':
            return 'success';

        case 'LOWSTOCK':
            return 'warn';

        case 'OUTOFSTOCK':
            return 'danger';

        default:
            return null;
    }
}

function getOrderSeverity(order) {
    switch (order.status) {
        case 'DELIVERED':
            return 'success';

        case 'CANCELLED':
            return 'danger';

        case 'PENDING':
            return 'warn';

        case 'RETURNED':
            return 'info';

        default:
            return null;
    }
}

function expandAll() {
    expandedRows.value = products.value.filter((p) => p.id);
}

function collapseAll() {
    expandedRows.value = [];
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <div class="flex gap-2">
                        <Button label="Thêm mới" icon="pi pi-plus" severity="secondary" @click="openNew" />
                        <Button label="Xóa đã chọn" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedProducts || !selectedProducts.length" />
                        <Button label="Nhân bản" icon="pi pi-copy" severity="secondary" outlined @click="duplicateSelected" :disabled="!selectedProducts || selectedProducts.length !== 1" />
                    </div>
                </template>

                <template #end>
                    <div class="flex gap-2">
                        <Button label="Nhập Excel" icon="pi pi-upload" severity="secondary" outlined />
                        <Button label="Xuất CSV" icon="pi pi-download" severity="secondary" @click="exportCSV($event)" />
                        <Button icon="pi pi-refresh" v-tooltip.left="'Làm mới dữ liệu'" @click="refreshData" />
                    </div>
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:expandedRows="expandedRows"
                v-model:selection="selectedProducts"
                :value="products"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
                tableStyle="min-width: 60rem"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <div class="flex gap-2">
                            <h4 class="m-0">Quản lý Sản phẩm</h4>
                            <Button text icon="pi pi-plus" label="Mở rộng tất cả" @click="expandAll" size="small" />
                            <Button text icon="pi pi-minus" label="Thu gọn tất cả" @click="collapseAll" size="small" />
                        </div>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Tìm kiếm..." />
                        </IconField>
                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column expander style="width: 3rem" />
                <Column field="code" header="Mã SP" sortable style="min-width: 10rem"></Column>
                <Column field="name" header="Tên sản phẩm" sortable style="min-width: 14rem"></Column>
                <Column header="Hình ảnh" style="width: 8rem">
                    <template #body="slotProps">
                        <img :src="`https://primefaces.org/cdn/primevue/images/product/${slotProps.data.image}`" :alt="slotProps.data.image" class="shadow-lg rounded" width="64" />
                    </template>
                </Column>
                <Column field="price" header="Giá" sortable style="min-width: 8rem">
                    <template #body="slotProps">
                        {{ formatCurrency(slotProps.data.price) }}
                    </template>
                </Column>
                <Column field="category" header="Danh mục" sortable style="min-width: 10rem"></Column>
                <Column field="rating" header="Đánh giá" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <Rating :modelValue="slotProps.data.rating" readonly />
                    </template>
                </Column>
                <Column header="Trạng thái" sortable field="inventoryStatus" style="min-width: 10rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.inventoryStatus" :severity="getStockSeverity(slotProps.data)" />
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 8rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editProduct(slotProps.data)" v-tooltip.top="'Chỉnh sửa'" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteProduct(slotProps.data)" v-tooltip.top="'Xóa'" />
                    </template>
                </Column>

                <template #expansion="slotProps">
                    <div class="p-4">
                        <div class="flex items-center justify-between mb-4">
                            <h5 class="m-0">Đơn hàng của {{ slotProps.data.name }}</h5>
                            <div class="flex gap-2">
                                <Button icon="pi pi-plus" label="Thêm đơn hàng" size="small" outlined />
                                <Button icon="pi pi-refresh" label="Làm mới" size="small" outlined />
                            </div>
                        </div>

                        <DataTable :value="slotProps.data.orders || []" class="mt-4" size="small">
                            <template #empty>
                                <div class="text-center py-4">
                                    <i class="pi pi-inbox text-4xl text-gray-400 mb-2"></i>
                                    <p class="text-gray-500">Chưa có đơn hàng nào cho sản phẩm này</p>
                                </div>
                            </template>

                            <Column field="id" header="Mã ĐH" sortable style="min-width: 8rem"></Column>
                            <Column field="customer" header="Khách hàng" sortable style="min-width: 12rem"></Column>
                            <Column field="date" header="Ngày đặt" sortable style="min-width: 10rem">
                                <template #body="slotProps">
                                    {{ new Date(slotProps.data.date).toLocaleDateString('vi-VN') }}
                                </template>
                            </Column>
                            <Column field="amount" header="Số tiền" sortable style="min-width: 8rem">
                                <template #body="slotProps">
                                    {{ formatCurrency(slotProps.data.amount) }}
                                </template>
                            </Column>
                            <Column field="status" header="Trạng thái" sortable style="min-width: 10rem">
                                <template #body="slotProps">
                                    <Tag :value="slotProps.data.status" :severity="getOrderSeverity(slotProps.data)" />
                                </template>
                            </Column>
                            <Column style="width: 8rem">
                                <template #body="orderProps">
                                    <div class="flex gap-1">
                                        <Button icon="pi pi-eye" size="small" outlined v-tooltip.top="'Xem chi tiết'" />
                                        <Button icon="pi pi-pencil" size="small" outlined v-tooltip.top="'Chỉnh sửa'" />
                                        <Button icon="pi pi-trash" size="small" outlined severity="danger" v-tooltip.top="'Xóa'" />
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </template>
            </DataTable>
        </div>

        <Dialog v-model:visible="productDialog" :style="{ width: '500px' }" header="Chi tiết Sản phẩm" :modal="true" class="p-fluid">
            <div class="flex flex-col gap-6">
                <div class="text-center" v-if="product.image">
                    <img :src="`https://primefaces.org/cdn/primevue/images/product/${product.image}`" :alt="product.image" class="block m-auto pb-4 rounded shadow-lg" style="max-width: 150px" />
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="name" class="block font-bold mb-3">Tên sản phẩm *</label>
                        <InputText id="name" v-model.trim="product.name" required="true" autofocus :invalid="submitted && !product.name" fluid placeholder="Nhập tên sản phẩm" />
                        <small v-if="submitted && !product.name" class="text-red-500">Tên sản phẩm là bắt buộc.</small>
                    </div>
                    <div class="col-span-6">
                        <label for="code" class="block font-bold mb-3">Mã sản phẩm</label>
                        <InputText id="code" v-model="product.code" fluid placeholder="Tự động tạo nếu để trống" :disabled="!!product.id" />
                    </div>
                </div>

                <div>
                    <label for="description" class="block font-bold mb-3">Mô tả</label>
                    <Textarea id="description" v-model="product.description" rows="3" fluid placeholder="Nhập mô tả sản phẩm" />
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="price" class="block font-bold mb-3">Giá bán *</label>
                        <InputNumber id="price" v-model="product.price" mode="currency" currency="USD" locale="en-US" fluid :invalid="submitted && !product.price" placeholder="0.00" />
                        <small v-if="submitted && !product.price" class="text-red-500">Giá bán là bắt buộc.</small>
                    </div>
                    <div class="col-span-6">
                        <label for="quantity" class="block font-bold mb-3">Số lượng tồn kho</label>
                        <InputNumber id="quantity" v-model="product.quantity" integeronly fluid placeholder="0" :min="0" />
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-8">
                        <span class="block font-bold mb-4">Danh mục *</span>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="flex items-center gap-2 col-span-6">
                                <RadioButton id="category1" v-model="product.category" name="category" value="Accessories" />
                                <label for="category1">Phụ kiện</label>
                            </div>
                            <div class="flex items-center gap-2 col-span-6">
                                <RadioButton id="category2" v-model="product.category" name="category" value="Clothing" />
                                <label for="category2">Quần áo</label>
                            </div>
                            <div class="flex items-center gap-2 col-span-6">
                                <RadioButton id="category3" v-model="product.category" name="category" value="Electronics" />
                                <label for="category3">Điện tử</label>
                            </div>
                            <div class="flex items-center gap-2 col-span-6">
                                <RadioButton id="category4" v-model="product.category" name="category" value="Fitness" />
                                <label for="category4">Thể thao</label>
                            </div>
                        </div>
                        <small v-if="submitted && !product.category" class="text-red-500">Vui lòng chọn danh mục.</small>
                    </div>
                    <div class="col-span-4">
                        <label for="inventoryStatus" class="block font-bold mb-3">Trạng thái kho</label>
                        <Select id="inventoryStatus" v-model="product.inventoryStatus" :options="statuses" optionLabel="label" placeholder="Chọn trạng thái" fluid>
                            <template #option="slotProps">
                                <div class="flex items-center gap-2">
                                    <Tag :value="slotProps.option.label" :severity="getStatusLabel(slotProps.option.value)" />
                                </div>
                            </template>
                        </Select>
                    </div>
                </div>

                <div v-if="product.id" class="border-t pt-4">
                    <div class="flex items-center justify-between mb-3">
                        <span class="font-bold">Thông tin bổ sung</span>
                        <small class="text-gray-500">ID: {{ product.id }}</small>
                    </div>
                    <div class="grid grid-cols-12 gap-4 text-sm">
                        <div class="col-span-6">
                            <span class="font-medium">Đánh giá:</span>
                            <Rating :modelValue="product.rating || 0" readonly class="ml-2" />
                        </div>
                        <div class="col-span-6">
                            <span class="font-medium">Ngày tạo:</span>
                            <span class="ml-2">{{ product.createdAt || 'N/A' }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Hủy bỏ" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Lưu lại" icon="pi pi-check" @click="saveProduct" :loading="submitted" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteProductDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
                <div>
                    <p v-if="product" class="mb-2">
                        Bạn có chắc chắn muốn xóa sản phẩm <strong>{{ product.name }}</strong
                        >?
                    </p>
                    <small class="text-gray-500">Hành động này không thể hoàn tác.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Hủy bỏ" icon="pi pi-times" text @click="deleteProductDialog = false" />
                <Button label="Xóa" icon="pi pi-trash" severity="danger" @click="deleteProduct" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteProductsDialog" :style="{ width: '450px' }" header="Xác nhận xóa nhiều" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
                <div>
                    <p>
                        Bạn có chắc chắn muốn xóa <strong>{{ selectedProducts?.length || 0 }}</strong> sản phẩm đã chọn?
                    </p>
                    <small class="text-gray-500">Hành động này không thể hoàn tác.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Hủy bỏ" icon="pi pi-times" text @click="deleteProductsDialog = false" />
                <Button label="Xóa tất cả" icon="pi pi-trash" severity="danger" @click="deleteSelectedProducts" />
            </template>
        </Dialog>
    </div>
</template>
