export interface ProductVariantItem {
  id: string;
  type: "color" | "storage" | "size";
  label: string;
  value: string;
  colorCode?: string;
  priceDelta?: number;
  image?: string;
  inStock: boolean;
}

export interface ProductReviewItem {
  id: string;
  userName: string;
  rating: number;
  date: string;
  comment: string;
  isVerified: boolean;
}

export interface Product {
  id: string;
  slug?: string;
  defaultVariantId?: string;
  title: string;
  category: string;
  brand?: string;
  sku?: string;
  specs?: string;
  price: number;
  regularPrice?: number;
  discountPercent?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  images?: string[];
  badge?: string;
  soldCount?: number;
  stockTotal?: number;
  inStock?: boolean;
  description?: string;
  keyFeatures?: string[];
  specifications?: Record<string, Record<string, string>>;
  variants?: ProductVariantItem[];
  reviews?: ProductReviewItem[];
}

export interface HeroSlide {
  id: string;
  tagline: string;
  title: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  badgeText: string;
  image: string;
  bgColor: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  iconName: string;
  itemCount?: string;
}

export interface PromoBanner {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  ctaText: string;
  image: string;
  theme: "navy" | "orange" | "ice";
}

export function formatBDT(amount: number): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `৳${formatted}`;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    tagline: "NEXT-GEN TECH & PERFORMANCE",
    title: "BEST TECH. BEST DEALS.",
    subtitle: "Upgrade your lifestyle with the latest laptops, gaming rigs, and audio gear at unbeatable prices.",
    primaryCtaText: "Shop Now",
    primaryCtaLink: "#flash-sale",
    secondaryCtaText: "View Deals",
    secondaryCtaLink: "#featured",
    badgeText: "⚡ Up to 40% Off",
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
    bgColor: "from-blue-950 via-slate-900 to-slate-950",
  },
  {
    id: "slide-2",
    tagline: "IMMERSIVE AUDIO EXPERIENCE",
    title: "Next-Gen Audio - Premium Headsets & Gear",
    subtitle: "Experience studio-grade acoustic clarity, active noise cancellation, and all-day comfort with our curated audiophile selection.",
    primaryCtaText: "Explore Audio",
    primaryCtaLink: "#categories",
    secondaryCtaText: "Top Rated",
    secondaryCtaLink: "#featured",
    badgeText: "🎧 Studio Grade ANC",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    bgColor: "from-slate-900 via-indigo-950 to-slate-900",
  },
  {
    id: "slide-3",
    tagline: "PRO WORKSPACE ESSENTIALS",
    title: "High-Performance Workstations & Ultrabooks",
    subtitle: "Power up your productivity with Apple Silicon M3, OLED ultrawide monitors, and ergonomic wireless accessories.",
    primaryCtaText: "Discover Laptops",
    primaryCtaLink: "#featured",
    secondaryCtaText: "Browse Accessories",
    secondaryCtaLink: "#categories",
    badgeText: "💼 Official Warranty",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    bgColor: "from-sky-950 via-slate-900 to-blue-950",
  },
];

export const CATEGORIES: CategoryItem[] = [
  { id: "pc", name: "PC Components", iconName: "Cpu", itemCount: "420+ Items" },
  { id: "laptops", name: "Laptops", iconName: "Laptop", itemCount: "185+ Items" },
  { id: "gaming", name: "Gaming", iconName: "Gamepad2", itemCount: "310+ Items" },
  { id: "smartphones", name: "Smartphones", iconName: "Smartphone", itemCount: "240+ Items" },
  { id: "accessories", name: "Accessories", iconName: "Headphones", itemCount: "650+ Items" },
  { id: "monitors", name: "Monitors", iconName: "Monitor", itemCount: "130+ Items" },
  { id: "cctv", name: "CCTV & Security", iconName: "Camera", itemCount: "90+ Items" },
  { id: "networking", name: "Networking", iconName: "Wifi", itemCount: "115+ Items" },
  { id: "audio", name: "Audio Gear", iconName: "Speaker", itemCount: "220+ Items" },
  { id: "all", name: "View All", iconName: "LayoutGrid", itemCount: "2,500+ Items" },
];

export const FLASH_SALE_PRODUCTS: Product[] = [
  {
    id: "fs-1",
    title: "AMD Ryzen 5 5600G Processor with Radeon Graphics",
    category: "Components",
    price: 13500,
    regularPrice: 18000,
    discountPercent: 25,
    rating: 4.8,
    reviewsCount: 120,
    image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80",
    soldCount: 120,
    stockTotal: 150,
  },
  {
    id: "fs-2",
    title: "MSI GeForce RTX 3060 Ventus 2X 12GB OC Graphics Card",
    category: "Components",
    price: 32900,
    regularPrice: 41000,
    discountPercent: 20,
    rating: 4.9,
    reviewsCount: 85,
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80",
    soldCount: 85,
    stockTotal: 100,
  },
  {
    id: "fs-3",
    title: "Corsair Vengeance LPX 16GB (8x2) 3200MHz DDR4 RAM Kit",
    category: "Components",
    price: 4250,
    regularPrice: 5000,
    discountPercent: 15,
    rating: 4.7,
    reviewsCount: 200,
    image: "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80",
    soldCount: 200,
    stockTotal: 250,
  },
  {
    id: "fs-4",
    title: "Samsung 980 1TB PCIe 3.0 NVMe M.2 Internal SSD",
    category: "Components",
    price: 8200,
    regularPrice: 10000,
    discountPercent: 18,
    rating: 4.9,
    reviewsCount: 150,
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80",
    soldCount: 150,
    stockTotal: 180,
  },
  {
    id: "fs-5",
    title: "Fantech GC-183 Alpha High-Density Foam Gaming Chair",
    category: "Gaming",
    price: 11500,
    regularPrice: 14700,
    discountPercent: 22,
    rating: 4.6,
    reviewsCount: 60,
    image: "https://images.unsplash.com/photo-1598550476439-6847785fdd52?auto=format&fit=crop&w=600&q=80",
    soldCount: 60,
    stockTotal: 80,
  },
  {
    id: "fs-6",
    title: "DeepCool PK650D 650W 80+ Bronze Certified Power Supply",
    category: "Components",
    price: 4150,
    regularPrice: 5000,
    discountPercent: 17,
    rating: 4.8,
    reviewsCount: 85,
    image: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80",
    soldCount: 85,
    stockTotal: 120,
  },
];

export const PROMO_BANNERS: PromoBanner[] = [
  {
    id: "promo-gaming",
    tag: "PRO ESPORTS",
    title: "GAMING ZONE",
    subtitle: "Top gaming gear for pro-level performance, low-latency mechanical switches, and high-DPI precision.",
    ctaText: "Shop Now",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    theme: "navy",
  },
  {
    id: "promo-laptops",
    tag: "SPECIAL CAMPAIGN",
    title: "UP TO 35% OFF ON LAPTOPS",
    subtitle: "Powerful performance for engineering, design, and executive productivity.",
    ctaText: "Shop Now",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80",
    theme: "orange",
  },
  {
    id: "promo-phones",
    tag: "FLAGSHIP SERIES",
    title: "SMARTPHONE DEALS",
    subtitle: "Best smartphones at best prices with genuine official BTRC registration.",
    ctaText: "Shop Now",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80",
    theme: "ice",
  },
];

export const FEATURED_PRODUCTS: (Product & { tab: "laptops" | "gadgets" | "lifestyle" })[] = [
  {
    id: "feat-1",
    title: "Apple MacBook Pro 16 M3 Max",
    category: "Laptops",
    specs: "36GB Unified Memory, 1TB SSD Storage, Liquid Retina XDR, Space Black",
    price: 315000,
    regularPrice: 340000,
    rating: 5.0,
    reviewsCount: 48,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
    badge: "Staff Pick",
    tab: "laptops",
  },
  {
    id: "feat-2",
    title: "Keychron Q1 Pro Wireless Custom Mechanical Keyboard",
    category: "Gadgets",
    specs: "Hot-swappable RGB, QMK/VIA programmable, CNC aluminum body, K Pro Banana Switches",
    price: 18500,
    regularPrice: 20500,
    rating: 4.9,
    reviewsCount: 24,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
    badge: "Best Seller",
    tab: "gadgets",
  },
  {
    id: "feat-3",
    title: "Logitech MX Master 3S Wireless Performance Mouse",
    category: "Gadgets",
    specs: "8000 DPI track-on-glass sensor, quiet clicks, MagSpeed electromagnetic scroll wheel",
    price: 11200,
    regularPrice: 12500,
    rating: 4.9,
    reviewsCount: 92,
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80",
    tab: "gadgets",
  },
  {
    id: "feat-4",
    title: "BenQ ScreenBar Halo LED Monitor Light",
    category: "Lifestyle",
    specs: "Wireless controller, auto-dimming sensor, asymmetrical optical design, zero screen glare",
    price: 16500,
    regularPrice: 18000,
    rating: 4.8,
    reviewsCount: 15,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80",
    tab: "lifestyle",
  },
  {
    id: "feat-5",
    title: "Samsung T7 Shield 2TB Portable SSD",
    category: "Gadgets",
    specs: "Rugged durability, IP65 water/dust resistant, up to 1050 MB/s transfer speed, USB-C",
    price: 21000,
    regularPrice: 24500,
    rating: 4.8,
    reviewsCount: 64,
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80",
    badge: "Hot",
    tab: "gadgets",
  },
  {
    id: "feat-6",
    title: "Logitech Brio 4K Ultra HD Streaming Webcam",
    category: "Gadgets",
    specs: "Professional grade video conferencing, RightLight 3 HDR, dual noise-cancelling mics",
    price: 22500,
    regularPrice: 26000,
    rating: 4.7,
    reviewsCount: 38,
    image: "https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?auto=format&fit=crop&w=600&q=80",
    tab: "gadgets",
  },
  {
    id: "feat-7",
    title: "Anker 3-in-1 Cube with MagSafe Wireless Charger",
    category: "Lifestyle",
    specs: "Ultra-compact foldable magnetic fast charging for iPhone, Apple Watch, and AirPods",
    price: 14800,
    regularPrice: 16900,
    rating: 4.9,
    reviewsCount: 51,
    image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=600&q=80",
    badge: "Popular",
    tab: "lifestyle",
  },
  {
    id: "feat-8",
    title: "Anker Prime 24,000mAh Power Bank (140W)",
    category: "Lifestyle",
    specs: "140W max high-speed output with Power Delivery 3.1, smart digital display screen",
    price: 15500,
    regularPrice: 17800,
    rating: 4.9,
    reviewsCount: 41,
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80",
    tab: "lifestyle",
  },
  {
    id: "feat-9",
    title: "ASUS ROG Zephyrus G16 OLED Gaming Laptop",
    category: "Laptops",
    specs: "Intel Core Ultra 9, RTX 4080 12GB, 32GB LPDDR5X, 2.5K 240Hz OLED Display",
    price: 295000,
    regularPrice: 320000,
    rating: 4.9,
    reviewsCount: 33,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80",
    badge: "Top Choice",
    tab: "laptops",
  },
  {
    id: "feat-10",
    title: "Dell XPS 14 Core Ultra 7 Ultrabook",
    category: "Laptops",
    specs: "Intel Core Ultra 7, 32GB RAM, 1TB NVMe SSD, 3.2K OLED Touchscreen",
    price: 245000,
    regularPrice: 265000,
    rating: 4.8,
    reviewsCount: 29,
    image: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=600&q=80",
    tab: "laptops",
  },
];

export const OFFICIAL_BRANDS = [
  { name: "ASUS", tagline: "In Search of Incredible", logo: "ASUS" },
  { name: "DELL", tagline: "The Power to Do More", logo: "DELL" },
  { name: "APPLE", tagline: "Think Different", logo: "APPLE" },
  { name: "SAMSUNG", tagline: "Inspire the World", logo: "SAMSUNG" },
  { name: "XIAOMI", tagline: "Innovation for Everyone", logo: "XIAOMI" },
  { name: "LENOVO", tagline: "Smarter Technology for All", logo: "LENOVO" },
  { name: "HP", tagline: "Keep Reinventing", logo: "HP" },
  { name: "LOGITECH", tagline: "Defy Logic", logo: "LOGITECH" },
];

export const VALUE_PROPS = [
  {
    icon: "ShieldCheck",
    title: "100% Authentic",
    desc: "Genuine Products with manufacturer warranty",
  },
  {
    icon: "RotateCcw",
    title: "Easy 7-Day Returns",
    desc: "Hassle-free replacement policy",
  },
  {
    icon: "Truck",
    title: "Fast Delivery",
    desc: "Inside Dhaka in 24-48 hrs, nationwide shipping",
  },
  {
    icon: "Lock",
    title: "Secure Payment",
    desc: "bKash, Nagad, Cards & Cash on Delivery",
  },
  {
    icon: "Headphones",
    title: "24/7 Dedicated Support",
    desc: "Customer helpline: 09678-123456",
  },
];

export const NEW_ARRIVALS_PRODUCTS: Product[] = [
  {
    id: "na-1",
    title: "Realme 12 8GB/256GB 5G Smartphone",
    category: "Smartphones",
    specs: "MediaTek Dimensity 6100+, 108MP 3X Zoom Camera, 45W SUPERVOOC",
    price: 27990,
    regularPrice: 29990,
    discountPercent: 7,
    rating: 4.8,
    reviewsCount: 36,
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80",
    badge: "New",
  },
  {
    id: "na-2",
    title: "Logitech G102 Lightsync RGB Optical Gaming Mouse",
    category: "Gaming",
    specs: "8,000 DPI gaming-grade sensor, vibrant RGB lighting, 6 programmable buttons",
    price: 1550,
    regularPrice: 1850,
    discountPercent: 16,
    rating: 4.9,
    reviewsCount: 112,
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80",
    badge: "Popular",
  },
  {
    id: "na-3",
    title: "A4Tech FK10 Fstyler ComfortKey Sleek Wired Keyboard",
    category: "Accessories",
    specs: "Laser inscribed keys, drain holes design, ergonomic round edge keycaps",
    price: 750,
    regularPrice: 900,
    discountPercent: 17,
    rating: 4.6,
    reviewsCount: 78,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "na-4",
    title: "Havit H2002d 3.5mm Gaming Headset with Detachable Mic",
    category: "Audio",
    specs: "53mm dynamic drivers, memory foam ear pads, metal mesh casing",
    price: 1650,
    regularPrice: 1950,
    discountPercent: 15,
    rating: 4.7,
    reviewsCount: 95,
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
    badge: "Budget King",
  },
  {
    id: "na-5",
    title: "Xiaomi Redmi 13C 8GB/256GB Smartphone",
    category: "Smartphones",
    specs: "6.74\" 90Hz Display, 50MP AI Triple Camera, 5000mAh 18W Fast Charging",
    price: 15490,
    regularPrice: 16999,
    discountPercent: 9,
    rating: 4.7,
    reviewsCount: 84,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "na-6",
    title: "TP-Link Archer C6 AC1200 Wireless Gigabit Router",
    category: "Networking",
    specs: "Dual-band Wi-Fi, 4 high-gain antennas, MU-MIMO technology, AP Mode",
    price: 2650,
    regularPrice: 2950,
    discountPercent: 10,
    rating: 4.8,
    reviewsCount: 160,
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80",
    badge: "Best Seller",
  },
];

export const SMARTPHONE_DEALS: (Product & { saveBDT: number; btrcApproved: boolean })[] = [
  {
    id: "phone-1",
    title: "Samsung Galaxy S24 Ultra 5G (12GB/256GB)",
    category: "Smartphones",
    specs: "Snapdragon 8 Gen 3, 200MP AI Quad Camera, Titanium Armor, Built-in S Pen",
    price: 135000,
    regularPrice: 150000,
    discountPercent: 10,
    saveBDT: 15000,
    rating: 4.9,
    reviewsCount: 88,
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80",
    badge: "Official Warranty",
    btrcApproved: true,
  },
  {
    id: "phone-2",
    title: "Apple iPhone 15 Pro Max (256GB) Natural Titanium",
    category: "Smartphones",
    specs: "A17 Pro chip, 5X Telephoto Optical Zoom, Action button, USB-C 3.0",
    price: 172000,
    regularPrice: 185000,
    discountPercent: 7,
    saveBDT: 13000,
    rating: 5.0,
    reviewsCount: 142,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80",
    badge: "Flagship",
    btrcApproved: true,
  },
  {
    id: "phone-3",
    title: "Xiaomi Redmi Note 13 Pro+ 5G (12GB/512GB)",
    category: "Smartphones",
    specs: "200MP OIS Camera, 120W HyperCharge (100% in 19m), 1.5K 120Hz Curved AMOLED",
    price: 42990,
    regularPrice: 47990,
    discountPercent: 10,
    saveBDT: 5000,
    rating: 4.8,
    reviewsCount: 65,
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80",
    badge: "Hot Deal",
    btrcApproved: true,
  },
  {
    id: "phone-4",
    title: "Realme 12 Pro+ 5G (8GB/256GB) Submarine Blue",
    category: "Smartphones",
    specs: "64MP Periscope Portrait Camera, Luxury Watch Design, Snapdragon 7s Gen 2",
    price: 38500,
    regularPrice: 42000,
    discountPercent: 8,
    saveBDT: 3500,
    rating: 4.8,
    reviewsCount: 47,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80",
    badge: "Official",
    btrcApproved: true,
  },
  {
    id: "phone-5",
    title: "OnePlus 12R 5G (16GB/256GB) Cool Blue",
    category: "Smartphones",
    specs: "Snapdragon 8 Gen 2, 5500mAh Battery, 100W SUPERVOOC, 4th Gen LTPO 120Hz Display",
    price: 61990,
    regularPrice: 67990,
    discountPercent: 9,
    saveBDT: 6000,
    rating: 4.9,
    reviewsCount: 39,
    image: "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80",
    badge: "Official",
    btrcApproved: true,
  },
];

export const BEST_SELLERS_PRODUCTS: Product[] = [
  {
    id: "bs-1",
    title: "AMD Ryzen 7 7800X3D Desktop Gaming Processor",
    category: "Components",
    specs: "8 Cores, 16 Threads, 104MB Cache, 3D V-Cache Technology, AM5 Socket",
    price: 46500,
    regularPrice: 51000,
    discountPercent: 9,
    rating: 5.0,
    reviewsCount: 210,
    image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80",
    badge: "#1 Best Seller",
    soldCount: 450,
  },
  {
    id: "bs-2",
    title: "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
    category: "Audio",
    specs: "Industry-leading ANC, 30-hour battery life, 8 mics, Auto NC Optimizer",
    price: 38500,
    regularPrice: 45294,
    discountPercent: 15,
    rating: 4.9,
    reviewsCount: 185,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    badge: "Top Audio",
    soldCount: 380,
  },
  {
    id: "bs-3",
    title: "Keychron V1 QMK/VIA Custom Mechanical Keyboard",
    category: "Gadgets",
    specs: "75% layout, Hot-swappable Keychron K Pro switches, OSA PBT keycaps",
    price: 9800,
    regularPrice: 11500,
    discountPercent: 15,
    rating: 4.9,
    reviewsCount: 130,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
    badge: "Top Keyboard",
    soldCount: 290,
  },
  {
    id: "bs-4",
    title: "Logitech MX Master 3S Wireless Performance Mouse",
    category: "Gadgets",
    specs: "8000 DPI sensor, quiet click, MagSpeed scrolling, USB-C quick charge",
    price: 11200,
    regularPrice: 12500,
    discountPercent: 10,
    rating: 4.9,
    reviewsCount: 310,
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80",
    badge: "Pro Choice",
    soldCount: 520,
  },
  {
    id: "bs-5",
    title: "Samsung 980 Pro 2TB PCIe 4.0 NVMe M.2 SSD",
    category: "Components",
    specs: "Up to 7,000 MB/s read speed, nickel coating thermal control, PS5 compatible",
    price: 18500,
    regularPrice: 21000,
    discountPercent: 12,
    rating: 4.9,
    reviewsCount: 165,
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80",
    badge: "Ultra Fast",
    soldCount: 240,
  },
  {
    id: "bs-6",
    title: "Corsair RM850x 850W 80+ Gold Fully Modular PSU",
    category: "Components",
    specs: "Low noise magnetic levitation fan, 105°C Japanese capacitors, 10-year warranty",
    price: 14500,
    regularPrice: 16500,
    discountPercent: 12,
    rating: 4.8,
    reviewsCount: 94,
    image: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80",
    soldCount: 190,
  },
];

export const TOP_VIEWED_PRODUCTS: Product[] = [
  {
    id: "tv-1",
    title: "Apple MacBook Pro 16 M3 Max (36GB/1TB)",
    category: "Laptops",
    specs: "16-core CPU, 40-core GPU, Liquid Retina XDR display, Space Black",
    price: 315000,
    regularPrice: 340000,
    discountPercent: 7,
    rating: 5.0,
    reviewsCount: 48,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
    badge: "12.4k Views",
  },
  {
    id: "tv-2",
    title: "ASUS ROG Strix SCAR 18 Core i9 14th Gen RTX 4090",
    category: "Laptops",
    specs: "Intel i9-14900HX, RTX 4090 16GB, 32GB DDR5, 18\" 2.5K 240Hz ROG Nebula Display",
    price: 495000,
    regularPrice: 530000,
    discountPercent: 7,
    rating: 4.9,
    reviewsCount: 28,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80",
    badge: "9.8k Views",
  },
  {
    id: "tv-3",
    title: "MSI MAG 274QRF QD E2 27\" 180Hz Rapid IPS Gaming Monitor",
    category: "Monitors",
    specs: "2560x1440 WQHD, Quantum Dot, 1ms GtG, HDR 400, Type-C 65W PD",
    price: 38500,
    regularPrice: 42000,
    discountPercent: 8,
    rating: 4.8,
    reviewsCount: 42,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
    badge: "8.1k Views",
  },
  {
    id: "tv-4",
    title: "Sony PlayStation 5 Slim Disc Edition Gaming Console",
    category: "Gaming",
    specs: "1TB Custom NVMe SSD, Ray Tracing, 4K-TV Gaming, Tempest 3D AudioTech",
    price: 66000,
    regularPrice: 72000,
    discountPercent: 8,
    rating: 4.9,
    reviewsCount: 89,
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=600&q=80",
    badge: "15.2k Views",
  },
  {
    id: "tv-5",
    title: "Apple MacBook Air 13 M3 16GB/512GB Midnight",
    category: "Laptops",
    specs: "8-core CPU, 10-core GPU, Liquid Retina Display, 18-hour battery, MagSafe 3",
    price: 158000,
    regularPrice: 168000,
    discountPercent: 6,
    rating: 4.9,
    reviewsCount: 52,
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80",
    badge: "7.6k Views",
  },
  {
    id: "tv-6",
    title: "DJI Mini 4 Pro Drone Fly More Combo Plus",
    category: "Gadgets",
    specs: "Under 249g, 4K/60fps HDR True Vertical Shooting, Omnidirectional Obstacle Sensing",
    price: 138000,
    regularPrice: 148000,
    discountPercent: 7,
    rating: 4.9,
    reviewsCount: 33,
    image: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=600&q=80",
    badge: "6.9k Views",
  },
];

// Comprehensive consolidated catalog for PDP, Shop, Category, Archive, Cart, and Wishlist
export const ALL_PRODUCTS: Product[] = [
  // Products with full PDP specs and rich details
  {
    id: "fs-1",
    title: "AMD Ryzen 5 5600G Processor with Radeon Graphics",
    category: "PC Components",
    brand: "AMD",
    sku: "AMD-R5-5600G-BOX",
    specs: "6 Cores, 12 Threads, 3.9GHz Base, 4.4GHz Boost, 19MB Cache, AM4 Socket",
    price: 13500,
    regularPrice: 18000,
    discountPercent: 25,
    rating: 4.8,
    reviewsCount: 120,
    image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80"
    ],
    soldCount: 120,
    stockTotal: 150,
    inStock: true,
    description: "The AMD Ryzen 5 5600G desktop processor features 6 cores and 12 threads with advanced Radeon graphics built-in. Perfect for budget-conscious gamers, streamers, and content creators looking for incredible multi-threaded speed and smooth 1080p esports gaming without a dedicated GPU.",
    keyFeatures: [
      "6 CPU Cores & 12 Processing Threads",
      "Base Clock: 3.9GHz, Max Boost Clock: up to 4.4GHz",
      "Integrated AMD Radeon Graphics (7 GPU Cores)",
      "Bundled with genuine AMD Wraith Stealth Cooler",
      "PCIe 3.0 Support & AM4 Motherboard Compatibility"
    ],
    variants: [
      { id: "var-5600g-box", type: "storage", label: "Package", value: "Box with Cooler", inStock: true },
      { id: "var-5600g-tray", type: "storage", label: "Package", value: "Tray (No Cooler)", priceDelta: -800, inStock: true }
    ],
    specifications: {
      "General Specifications": {
        "Platform": "Desktop",
        "Product Line": "AMD Ryzen 5 5000 G-Series Desktop Processors",
        "CPU Cores": "6",
        "Threads": "12",
        "Base Clock": "3.9 GHz",
        "Max Boost Clock": "Up to 4.4 GHz",
        "Total L3 Cache": "16 MB",
        "Default TDP": "65W"
      },
      "Graphics Capabilities": {
        "Graphics Model": "Radeon Graphics",
        "Graphics Core Count": "7",
        "Graphics Frequency": "1900 MHz"
      },
      "Warranty & Support": {
        "Official Warranty": "3 Years Official AMD Replacement Warranty",
        "Origin": "USA (Manufactured in Malaysia/China)"
      }
    },
    reviews: [
      {
        id: "rev-1",
        userName: "Tariqul Islam",
        rating: 5,
        date: "14 Oct 2026",
        comment: "Excellent APU for budget gaming. GTA V and Valorant run at 60+ FPS smoothly without any external graphics card!",
        isVerified: true
      },
      {
        id: "rev-2",
        userName: "Farhan Ahmed",
        rating: 5,
        date: "02 Oct 2026",
        comment: "Authentic product with official warranty sticker. Delivered to Dhanmondi within 24 hours.",
        isVerified: true
      }
    ]
  },
  {
    id: "feat-1",
    title: "Apple MacBook Pro 16 M3 Max",
    category: "Laptops",
    brand: "Apple",
    sku: "APL-MBP16-M3MAX-BLK",
    specs: "36GB Unified Memory, 1TB SSD Storage, Liquid Retina XDR, Space Black",
    price: 315000,
    regularPrice: 340000,
    discountPercent: 7,
    rating: 5.0,
    reviewsCount: 48,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80"
    ],
    badge: "Staff Pick",
    inStock: true,
    description: "MacBook Pro 16-inch with M3 Max blazes through extreme workflows with its 16-core CPU, up to 40-core GPU, and support for up to 128GB of unified memory. Features an expansive Liquid Retina XDR display with up to 1600 nits peak brightness and up to 22 hours of battery life.",
    keyFeatures: [
      "Apple M3 Max chip with 16-core CPU and 40-core GPU",
      "16.2-inch Liquid Retina XDR display (3456 x 2234) with ProMotion 120Hz",
      "36GB high-bandwidth Unified Memory",
      "1TB superfast PCIe SSD storage",
      "Six-speaker sound system with force-cancelling woofers",
      "Space Black finish with breakthrough anodization seal to reduce fingerprints"
    ],
    variants: [
      { id: "var-mbp-spb", type: "color", label: "Color", value: "Space Black", colorCode: "#1C1C1E", inStock: true },
      { id: "var-mbp-sil", type: "color", label: "Color", value: "Silver", colorCode: "#E2E4E6", inStock: true },
      { id: "var-mbp-1tb", type: "storage", label: "Storage", value: "1TB SSD", inStock: true },
      { id: "var-mbp-2tb", type: "storage", label: "Storage", value: "2TB SSD", priceDelta: 45000, inStock: true }
    ],
    specifications: {
      "Performance": {
        "Processor": "Apple M3 Max (16-core CPU with 12 performance cores)",
        "Graphics": "40-core GPU with hardware-accelerated ray tracing",
        "Neural Engine": "16-core Neural Engine",
        "RAM": "36GB Unified Memory"
      },
      "Display": {
        "Screen Size": "16.2-inch Liquid Retina XDR",
        "Resolution": "3456 x 2234 native resolution at 254 pixels per inch",
        "Refresh Rate": "ProMotion technology for adaptive refresh rates up to 120Hz",
        "Brightness": "1000 nits sustained, 1600 nits peak (HDR)"
      },
      "Battery & Power": {
        "Battery Life": "Up to 22 hours Apple TV app movie playback",
        "Adapter": "140W USB-C Power Adapter with MagSafe 3 cable"
      }
    },
    reviews: [
      {
        id: "rev-mbp-1",
        userName: "Sabbir Hossain",
        rating: 5,
        date: "20 Oct 2026",
        comment: "The speed of the M3 Max for 4K video rendering and Docker containers is unbelievable. Worth every single taka.",
        isVerified: true
      }
    ]
  },
  {
    id: "seed-1",
    title: "Sony WH-1000XM5 Wireless Headphones",
    category: "Audio Gear",
    brand: "Sony",
    sku: "SNY-WH1000XM5-BLK",
    specs: "Industry-leading Noise Canceling, 30hr Battery, Auto NC Optimizer, Hi-Res Audio",
    price: 38500,
    regularPrice: 42000,
    discountPercent: 8,
    rating: 4.9,
    reviewsCount: 140,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    description: "The Sony WH-1000XM5 wireless noise-canceling headphones rewrite the rules for distraction-free listening. With two processors controlling eight microphones, Auto NC Optimizer, and a specially designed driver unit, music sounds richer than ever.",
    keyFeatures: [
      "Two processors and eight microphones for unprecedented noise cancelation",
      "Magnificent Sound engineered with the new Integrated Processor V1",
      "Crystal clear hands-free calling with 4 beamforming microphones",
      "Up to 30-hour battery life with quick charging (3 min charge for 3 hours playback)",
      "Ultra-comfortable, lightweight design with soft fit leather"
    ],
    variants: [
      { id: "var-xm5-blk", type: "color", label: "Color", value: "Black", colorCode: "#111111", inStock: true },
      { id: "var-xm5-sil", type: "color", label: "Color", value: "Silver", colorCode: "#E5E5E5", inStock: true },
      { id: "var-xm5-blu", type: "color", label: "Color", value: "Midnight Blue", colorCode: "#1E2A38", inStock: false }
    ],
    specifications: {
      "Audio": {
        "Driver Unit": "30mm (Dome type, carbon fiber composite)",
        "Frequency Response": "4Hz - 40,000Hz (JEITA)",
        "Hi-Res Wireless": "LDAC, AAC, SBC supported"
      },
      "Battery": {
        "Playback Time": "Max 30 hrs (NC ON), Max 40 hrs (NC OFF)",
        "Charge Method": "USB Type-C"
      }
    },
    reviews: [
      {
        id: "rev-xm5-1",
        userName: "Mahmudul Hasan",
        rating: 5,
        date: "18 Oct 2026",
        comment: "ANC is magical. Dhaka traffic noise completely disappears when turned on. Very lightweight on ears.",
        isVerified: true
      }
    ]
  },
  {
    id: "phone-1",
    title: "Samsung Galaxy S24 Ultra 5G (12GB/256GB)",
    category: "Smartphones",
    brand: "Samsung",
    sku: "SAM-S24U-256-GRY",
    specs: "Snapdragon 8 Gen 3, 200MP Quad Camera, Titanium Frame, S-Pen Built-in",
    price: 154999,
    regularPrice: 175000,
    discountPercent: 11,
    rating: 4.9,
    reviewsCount: 142,
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"
    ],
    badge: "Official BTRC",
    inStock: true,
    description: "Welcome to the era of mobile AI with Samsung Galaxy S24 Ultra. Unleash whole new levels of creativity, productivity and possibility starting with the most important device in your life.",
    keyFeatures: [
      "Galaxy AI features: Live Translate, Circle to Search, Note Assist",
      "Titanium shield built right into the frame and Corning Gorilla Armor",
      "200MP camera with AI processing and 5x optical zoom",
      "Snapdragon 8 Gen 3 for Galaxy with optimized vapor chamber cooling"
    ],
    variants: [
      { id: "var-s24-gry", type: "color", label: "Color", value: "Titanium Gray", colorCode: "#5E5F61", inStock: true },
      { id: "var-s24-blk", type: "color", label: "Color", value: "Titanium Black", colorCode: "#272728", inStock: true },
      { id: "var-s24-vio", type: "color", label: "Color", value: "Titanium Violet", colorCode: "#4C4656", inStock: true },
      { id: "var-s24-256", type: "storage", label: "Storage", value: "256GB", inStock: true },
      { id: "var-s24-512", type: "storage", label: "Storage", value: "512GB", priceDelta: 20000, inStock: true }
    ],
    specifications: {
      "Display": {
        "Size": "6.8-inch Dynamic AMOLED 2X",
        "Resolution": "QHD+ 3120 x 1440, 120Hz adaptive"
      },
      "Camera": {
        "Main": "200MP Wide + 50MP Periscope + 12MP Ultra-wide + 10MP Telephoto",
        "Front": "12MP Dual Pixel AF"
      }
    },
    reviews: [
      {
        id: "rev-s24-1",
        userName: "Kazi Nabil",
        rating: 5,
        date: "22 Oct 2026",
        comment: "Original BTRC approved handset with official Samsung Bangladesh warranty. Outstanding camera zoom!",
        isVerified: true
      }
    ]
  },
  {
    id: "fs-2",
    title: "MSI GeForce RTX 3060 Ventus 2X 12GB OC Graphics Card",
    category: "PC Components",
    brand: "MSI",
    sku: "MSI-RTX3060-V2X-12G",
    specs: "12GB GDDR6, Dual Fan TORX 3.0, Ray Tracing, DLSS, PCIe 4.0",
    price: 32900,
    regularPrice: 41000,
    discountPercent: 20,
    rating: 4.9,
    reviewsCount: 85,
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80",
    inStock: true,
    soldCount: 85,
    stockTotal: 100
  },
  {
    id: "fs-3",
    title: "Corsair Vengeance LPX 16GB (8x2) 3200MHz DDR4 RAM Kit",
    category: "PC Components",
    brand: "Corsair",
    sku: "COR-LPX-16G-3200",
    specs: "DDR4 3200MHz, CL16, Pure Aluminum Heat Spreader, XMP 2.0",
    price: 4250,
    regularPrice: 5000,
    discountPercent: 15,
    rating: 4.7,
    reviewsCount: 200,
    image: "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=800&q=80",
    inStock: true,
    soldCount: 200,
    stockTotal: 250
  },
  {
    id: "fs-4",
    title: "Samsung 980 1TB PCIe 3.0 NVMe M.2 Internal SSD",
    category: "PC Components",
    brand: "Samsung",
    sku: "SAM-980-1TB-NVME",
    specs: "Up to 3,500 MB/s Read, 3,000 MB/s Write, V-NAND 3-bit MLC",
    price: 8200,
    regularPrice: 10000,
    discountPercent: 18,
    rating: 4.9,
    reviewsCount: 150,
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80",
    inStock: true,
    soldCount: 150,
    stockTotal: 180
  },
  {
    id: "fs-5",
    title: "Fantech GC-183 Alpha High-Density Foam Gaming Chair",
    category: "Gaming",
    brand: "Fantech",
    sku: "FNT-GC183-BLK",
    specs: "Class 4 Hydraulic Piston, 180° Recline, Ergonomic Lumbar Support",
    price: 11500,
    regularPrice: 14700,
    discountPercent: 22,
    rating: 4.6,
    reviewsCount: 60,
    image: "https://images.unsplash.com/photo-1598550476439-6847785fdd52?auto=format&fit=crop&w=800&q=80",
    inStock: true,
    soldCount: 60,
    stockTotal: 80
  },
  {
    id: "feat-2",
    title: "Keychron Q1 Pro Wireless Custom Mechanical Keyboard",
    category: "Accessories",
    brand: "Keychron",
    sku: "KEY-Q1PRO-BANANA",
    specs: "Hot-swappable RGB, QMK/VIA programmable, CNC aluminum body",
    price: 18500,
    regularPrice: 20500,
    rating: 4.9,
    reviewsCount: 24,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    badge: "Best Seller",
    inStock: true
  },
  {
    id: "feat-3",
    title: "Logitech MX Master 3S Wireless Performance Mouse",
    category: "Accessories",
    brand: "Logitech",
    sku: "LOG-MXM3S-PGRY",
    specs: "8000 DPI track-on-glass sensor, quiet clicks, MagSpeed wheel",
    price: 11200,
    regularPrice: 12500,
    rating: 4.9,
    reviewsCount: 92,
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
    inStock: true
  },
  {
    id: "feat-4",
    title: "Sony PlayStation 5 Slim Disc Edition Gaming Console",
    category: "Gaming",
    brand: "Sony",
    sku: "SNY-PS5-SLIM-DISC",
    specs: "1TB Custom NVMe SSD, Ray Tracing, 4K-TV Gaming, DualSense Controller",
    price: 66000,
    regularPrice: 72000,
    discountPercent: 8,
    rating: 4.9,
    reviewsCount: 89,
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80",
    badge: "Popular",
    inStock: true
  },
  {
    id: "feat-5",
    title: "LG UltraGear 27GR95QE-B 27\" OLED 240Hz 0.03ms Gaming Monitor",
    category: "Monitors",
    brand: "LG",
    sku: "LG-27GR95QE-OLED",
    specs: "QHD 2560x1440 OLED, 240Hz, 0.03ms GtG, DCI-P3 98.5%, G-SYNC Compatible",
    price: 98000,
    regularPrice: 110000,
    discountPercent: 11,
    rating: 4.9,
    reviewsCount: 38,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    badge: "OLED King",
    inStock: true
  },
  {
    id: "phone-2",
    title: "Apple iPhone 15 Pro Max 256GB Natural Titanium",
    category: "Smartphones",
    brand: "Apple",
    sku: "APL-IP15PM-256-NT",
    specs: "A17 Pro chip, Action button, 5x Optical Telephoto, USB-C 3.0",
    price: 168000,
    regularPrice: 185000,
    discountPercent: 9,
    rating: 5.0,
    reviewsCount: 115,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
    inStock: true
  },
  {
    id: "phone-3",
    title: "Xiaomi 14 Ultra 5G (16GB/512GB) Leica Quad Camera",
    category: "Smartphones",
    brand: "Xiaomi",
    sku: "XIA-14U-512-WHT",
    specs: "1-inch Sony LYT-900 sensor, Snapdragon 8 Gen 3, 90W HyperCharge",
    price: 132000,
    regularPrice: 145000,
    discountPercent: 9,
    rating: 4.8,
    reviewsCount: 64,
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
    inStock: true
  },
  {
    id: "phone-4",
    title: "Google Pixel 8 Pro 128GB Obsidian Black",
    category: "Smartphones",
    brand: "Google",
    sku: "GGL-PX8P-128-OBS",
    specs: "Google Tensor G3, Best-in-class computational AI camera, 7 Years OS updates",
    price: 88500,
    regularPrice: 98000,
    discountPercent: 10,
    rating: 4.8,
    reviewsCount: 88,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
    inStock: true
  },
  {
    id: "na-1",
    title: "ASUS ROG Zephyrus G16 OLED Core Ultra 9 RTX 4080",
    category: "Laptops",
    brand: "ASUS",
    sku: "ASU-ROG-G16-OLED",
    specs: "Intel Core Ultra 9 185H, 32GB LPDDR5X, 1TB SSD, 2.5K 240Hz ROG Nebula OLED",
    price: 365000,
    regularPrice: 385000,
    discountPercent: 5,
    rating: 4.9,
    reviewsCount: 16,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
    badge: "New 2026",
    inStock: true
  },
  {
    id: "na-2",
    title: "Sony WF-1000XM5 True Wireless Noise Canceling Earbuds",
    category: "Audio Gear",
    brand: "Sony",
    sku: "SNY-WF1000XM5-BLK",
    specs: "Dynamic Driver X, Integrated Processor V2, Bone conduction sensor, IPX4",
    price: 26500,
    regularPrice: 29000,
    discountPercent: 9,
    rating: 4.8,
    reviewsCount: 41,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    badge: "Hi-Res Wireless",
    inStock: true
  },
  {
    id: "na-3",
    title: "DJI Osmo Pocket 3 Creator Combo 1-Inch CMOS 4K/120fps",
    category: "Accessories",
    brand: "DJI",
    sku: "DJI-OP3-CREATOR",
    specs: "Rotatable 2\" OLED touchscreen, 3-Axis Gimbal, ActiveTrack 6.0, Mic 2 included",
    price: 76000,
    regularPrice: 82000,
    discountPercent: 7,
    rating: 4.9,
    reviewsCount: 53,
    image: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80",
    badge: "Hot Creator Gear",
    inStock: true
  }
];

// Helper functions for catalog queries
export function getProductById(id: string): Product | undefined {
  return ALL_PRODUCTS.find((p) => p.id === id) || 
         FLASH_SALE_PRODUCTS.find((p) => p.id === id) ||
         FEATURED_PRODUCTS.find((p) => p.id === id);
}

export function getRelatedProducts(productId: string, limit = 4): Product[] {
  const current = getProductById(productId);
  if (!current) return ALL_PRODUCTS.slice(0, limit);
  return ALL_PRODUCTS.filter(
    (p) => p.id !== productId && (p.category === current.category || p.brand === current.brand)
  ).slice(0, limit);
}

export function getAllCategories(): string[] {
  const set = new Set<string>();
  ALL_PRODUCTS.forEach((p) => set.add(p.category));
  return Array.from(set);
}

export function getAllBrands(): string[] {
  const set = new Set<string>();
  ALL_PRODUCTS.forEach((p) => {
    if (p.brand) set.add(p.brand);
  });
  return Array.from(set);
}

