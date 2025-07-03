<!-- src/components/Product.vue -->
<template>
  <div class="product-detail">
    <h1>Chi Tiết Sản Phẩm</h1>
    <p><strong>Tên:</strong> {{ name }}</p>
    <p><strong>Giá:</strong> ${{ price }}</p>
    <p><strong>Đánh giá:</strong> {{ rating }}</p>
    <img :src="image" alt="Ảnh sản phẩm" class="product-image" />
  </div>
</template>

<script>
export default {
  name: 'product',
  computed: {
    name() {
      return this.$route.query.name || 'Chưa có';
    },
    price() {
      return this.$route.query.price || '0';
    },
    rating() {
      return this.$route.query.rating || '0';
    },
    image() {
      return this.$route.query.image || '';
    }
  }
}
</script>

<style scoped>
.product-detail {
  padding: 2rem;
}
.product-image {
  max-width: 300px;
  margin-top: 1rem;
}
</style>
