import bigShoe1 from "../assets/images/big-shoe1.png";
import bigShoe2 from "../assets/images/big-shoe2.png";
import bigShoe3 from "../assets/images/big-shoe3.png";
import bigShoe4 from "../assets/images/product12.png";
import bigShoe5 from "../assets/images/product1.png";
import bigShoe6 from "../assets/images/product2.png";
import bigShoe7 from "../assets/images/product3.png";
import bigShoe8 from "../assets/images/product5.png";
import bigShoe9 from "../assets/images/product6.png";
import bigShoe10 from "../assets/images/product8(1).png";
import bigShoe11 from "../assets/images/1.png";
import bigShoe12 from "../assets/images/hero.png";
import { facebook, instagram, shieldTick as shieldTickIcon, support as supportIcon, truckFast as truckFastIcon, twitter } from "../assets/icons";
import { customer1, customer2 } from "../assets/images";
export const navLinks = [
    { href: "#home", label: "Trang Chủ" },
    { href: "#about-us", label: "Giới Thiệu" },
    { href: "#products", label: "Sản Phẩm" },
    { href: "#contact-us", label: "Liên Hệ" },
];

export const statistics = [
    { value: "1K+", label: "Thương hiệu" },
    { value: "250+", label: "Cửa hàng" },
    { value: "250K+", label: "Khách hàng" }
]
export const shoesCards = [
    { imgUrl: bigShoe5 },
    { imgUrl: bigShoe6 },
    { imgUrl: bigShoe7 },
    { imgUrl: bigShoe8 },
    { imgUrl: bigShoe9 },
    { imgUrl: bigShoe10 },
    { imgUrl: bigShoe11 },
    { imgUrl: bigShoe12 },
]
export const products = [
    { imgUrl: bigShoe6, label: "Nike Air Jordan-10", rating: "4.7", price: "230.20" },
    { imgUrl: bigShoe7, label: "Nike Air Jordan-10", rating: "4.7", price: "230.20" },
    { imgUrl: bigShoe8, label: "Nike Air Jordan-10", rating: "4.7", price: "230.20" },
    { imgUrl: bigShoe9, label: "Nike Air Jordan-10", rating: "4.7", price: "230.20" },
    { imgUrl: bigShoe10, label: "Nike Air Jordan-10", rating: "4.7", price: "230.20" },
    { imgUrl: bigShoe1, label: "Nike Air Jordan-10", rating: "4.7", price: "230.20" },
    { imgUrl: bigShoe2, label: "Nike Air Jordan-10", rating: "4.7", price: "230.20" },
    { imgUrl: bigShoe3, label: "Nike Air Jordan-10", rating: "4.7", price: "230.20" },
    { imgUrl: bigShoe4, label: "Nike Air Jordan-10", rating: "4.7", price: "230.20" },
    { imgUrl: bigShoe5, label: "Nike Air Jordan-10", rating: "4.7", price: "230.20" },

]



export const offers = [
    { iconUrl: truckFastIcon, label: "Miễn phí vận chuyển", desc: "Tận hưởng trải nghiệm mua sắm dễ dàng với dịch vụ vận chuyển miễn phí của chúng tôi." },
    { iconUrl: shieldTickIcon, label: "Thanh toán an toàn", desc: "Trải nghiệm giao dịch không phải lo lắng với các tùy chọn thanh toán an toàn của chúng tôi." },
    { iconUrl: supportIcon, label: "Rất vui được giúp đỡ bạn", desc: "Đội ngũ tận tâm của chúng tôi luôn sẵn sàng hỗ trợ bạn trong từng bước thực hiện." },
]
export const customers = [
    { profileImg: customer1, name: "Nguyễn Văn Ngọc", rating: '4.5', comment: "Sự chú ý đến từng chi tiết và chất lượng sản phẩm vượt quá mong đợi của tôi. Rất đáng để giới thiệu!" },
    { profileImg: customer2, name: "Trần Đức Hiếu", rating: '4.8', comment: "Sản phẩm không chỉ đáp ứng mà còn vượt quá mong đợi của tôi. Tôi chắc chắn sẽ là khách hàng quay lại!" },
]
export const socialMedia = [
    { src: facebook, alt: "facebook logo" },
    { src: twitter, alt: "twitter logo" },
    { src: instagram, alt: "instagram logo" },
];
export const footerLinks = [
    {
        title: "Products",
        links: [
            { name: "Air Force 1", link: "/" },
            { name: "Air Max 1", link: "/" },
            { name: "Air Jordan 1", link: "/" },
            { name: "Air Force 2", link: "/" },
            { name: "Nike Waffle Racer", link: "/" },
            { name: "Nike Cortez", link: "/" },
        ],
    },
    {
        title: "Giúp đỡ",
        links: [
            { name: "Về chúng tôi", link: "/" },
            { name: "FAQs", link: "/" },
            { name: "Hướng dẫn mua hàng", link: "/" },
        ],
    },
    {
        title: "Liên hệ",
        links: [
            { name: "customer@nike.com", link: "mailto:customer@nike.com" },
            { name: "+92554862354", link: "tel:+92554862354" },
        ],
    },
];
