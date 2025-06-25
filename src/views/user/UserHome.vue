<script setup>
import Hero from '@/views/user/Hero.vue';
import Services from '@/views/user/Services.vue';
//import SpecialOffers from '@/views/user/SpecialOffers.vue';
import CustomerReviews from '@/views/user/CustomerReviews.vue';
//import Subscribe from '@/views/user/Subscribe.vue';
import Footer from '@/views/user/Footer.vue';
import SuperQuality from '@/views/user/SuperQuality.vue';
import PopularProducts from '@/views/user/PopularProducts.vue';
import Nav from '@/components/user/Nav.vue';
import ScrollToggler from '@/components/user/ScrollToggler.vue';
</script>

<template>
    <main class="relative">
        <Nav />
        <section id="home" class="xl:padding-l wide:padding-r padding-b overflow-hidden">
            <Hero />
        </section>
        <section id="products" class="padding">
            <PopularProducts />
        </section>
        <section id="about-us" class="padding">
            <SuperQuality />
        </section>
        <section class="padding-x py-10"><Services /></section>
        <!-- <section class="padding"><SpecialOffers /></section> -->
        <section class="padding bg-pale-blue">
            <CustomerReviews />
        </section>
        <!-- <section id="contact-us" class="padding-x sm:py-32 py-16">
      <Subscribe />
    </section> -->
        <section id="#" class="padding-x padding-t bg-black pb-8"><Footer /></section>
        <ScrollToggler />
    </main>
</template>

<style scoped></style>
