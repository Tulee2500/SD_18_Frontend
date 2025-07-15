<template>
    <main class="gioithieu">
        <Nav />
        <section id="home" class="xl:padding-l wide:padding-r padding-b overflow-hidden">
            <Hero />
        </section>
        <!-- <section id="products" class="padding">
            <PopularProducts />
        </section>
        <section id="about-us" class="padding">
            <SuperQuality />
        </section>
        <section class="padding-x py-10"><Services /></section> -->
     <section id="#" class="padding-x padding-t bg-black pb-8"><Footer /></section>
        
        
    </main>
    
</template>
 <script>
import Nav from '@/components/user/Nav.vue';
import Footer from '@/views/user/Footer.vue';
import Hero from '../Hero.vue';
    export default{
    name: 'Gioithieu',
    components: {
    Nav,
    Footer,
    Hero,
  },
        }
        
    </script>
    <style>
.gioithieu {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
  min-height: 100vh;
}</style>