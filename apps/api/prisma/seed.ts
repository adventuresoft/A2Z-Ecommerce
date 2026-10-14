import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch {
  // Ignored if file does not exist
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface CategorySeedNode {
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  sortOrder?: number;
  children?: CategorySeedNode[];
}

const CATEGORY_DEMO_DATA: CategorySeedNode[] = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Cutting-edge gadgets, computers, smartphones, and entertainment systems.',
    imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&auto=format&fit=crop&q=80',
    sortOrder: 1,
    children: [
      {
        name: 'Smartphones & Tablets',
        slug: 'smartphones-tablets',
        description: 'Next-generation flagship smartphones, cellular tablets, and versatile e-readers.',
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80',
        sortOrder: 1,
        children: [
          {
            name: 'Android Smartphones',
            slug: 'android-smartphones',
            description: 'Top-tier Android smartphones from Samsung, Google Pixel, and Xiaomi.',
            imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&auto=format&fit=crop&q=80',
            sortOrder: 1,
          },
          {
            name: 'Apple iPhones',
            slug: 'apple-iphones',
            description: 'Latest Apple iPhone models with ProMotion displays and Bionic/Pro chips.',
            imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&auto=format&fit=crop&q=80',
            sortOrder: 2,
          },
          {
            name: 'Tablets & iPads',
            slug: 'tablets-ipads',
            description: 'High-resolution graphic tablets, iPad Pro, Air, and portable slates.',
            imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&auto=format&fit=crop&q=80',
            sortOrder: 3,
          },
        ],
      },
      {
        name: 'Computers & Laptops',
        slug: 'computers-laptops',
        description: 'Powerhouse notebooks, desktop workstations, and performance accessories.',
        imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&auto=format&fit=crop&q=80',
        sortOrder: 2,
        children: [
          {
            name: 'Gaming Laptops',
            slug: 'gaming-laptops',
            description: 'High-refresh-rate gaming beasts with dedicated NVIDIA RTX graphics.',
            imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&auto=format&fit=crop&q=80',
            sortOrder: 1,
          },
          {
            name: 'Ultrabooks & Workstations',
            slug: 'ultrabooks-workstations',
            description: 'Lightweight aluminum ultrabooks, MacBooks, and creator workstations.',
            imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&auto=format&fit=crop&q=80',
            sortOrder: 2,
          },
          {
            name: 'PC Accessories',
            slug: 'pc-accessories',
            description: 'Mechanical keyboards, ergonomic mice, webcams, and docking stations.',
            imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&auto=format&fit=crop&q=80',
            sortOrder: 3,
          },
        ],
      },
      {
        name: 'Audio & Headphones',
        slug: 'audio-headphones',
        description: 'Audiophile headphones, noise-cancelling earbuds, and wireless soundbars.',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80',
        sortOrder: 3,
        children: [
          {
            name: 'Wireless Earbuds',
            slug: 'wireless-earbuds',
            description: 'True wireless stereo earbuds with active noise cancellation.',
            imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80',
            sortOrder: 1,
          },
          {
            name: 'Bluetooth Speakers',
            slug: 'bluetooth-speakers',
            description: 'Waterproof portable speakers and high-fidelity room audio systems.',
            imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&auto=format&fit=crop&q=80',
            sortOrder: 2,
          },
        ],
      },
    ],
  },
  {
    name: 'Fashion & Apparel',
    slug: 'fashion-apparel',
    description: 'Contemporary fashion, designer footwear, and seasonal wardrobe collections.',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&auto=format&fit=crop&q=80',
    sortOrder: 2,
    children: [
      {
        name: "Men's Fashion",
        slug: 'mens-fashion',
        description: 'Tailored suits, casual button-downs, denim, and daily essentials for men.',
        imageUrl: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=400&auto=format&fit=crop&q=80',
        sortOrder: 1,
        children: [
          {
            name: 'Casual Shirts & Polos',
            slug: 'mens-casual-shirts-polos',
            description: 'Breathable linen shirts, premium cotton tees, and smart-casual polo shirts.',
            imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&auto=format&fit=crop&q=80',
            sortOrder: 1,
          },
          {
            name: 'Jeans & Chinos',
            slug: 'mens-jeans-chinos',
            description: 'Stretch denim, slim-fit chinos, and comfortable jogger trousers.',
            imageUrl: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=400&auto=format&fit=crop&q=80',
            sortOrder: 2,
          },
          {
            name: 'Footwear & Sneakers',
            slug: 'mens-footwear-sneakers',
            description: 'Running trainers, leather loafers, Chelsea boots, and streetwear kicks.',
            imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&auto=format&fit=crop&q=80',
            sortOrder: 3,
          },
        ],
      },
      {
        name: "Women's Fashion",
        slug: 'womens-fashion',
        description: 'Chic silhouettes, elegant evening dresses, handbags, and casual wear.',
        imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&auto=format&fit=crop&q=80',
        sortOrder: 2,
        children: [
          {
            name: 'Dresses & Tops',
            slug: 'womens-dresses-tops',
            description: 'Maxi dresses, silk blouses, floral prints, and cozy knitwear.',
            imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&auto=format&fit=crop&q=80',
            sortOrder: 1,
          },
          {
            name: 'Handbags & Clutches',
            slug: 'womens-handbags-clutches',
            description: 'Leather tote bags, crossbody satchels, and designer evening clutches.',
            imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&auto=format&fit=crop&q=80',
            sortOrder: 2,
          },
          {
            name: 'Ethnic & Festive Wear',
            slug: 'womens-ethnic-festive-wear',
            description: 'Exquisite sarees, lehengas, and embroidered celebratory outfits.',
            imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=80',
            sortOrder: 3,
          },
        ],
      },
      {
        name: 'Watches & Accessories',
        slug: 'watches-accessories',
        description: 'Chronograph wristwatches, designer sunglasses, and leather belts.',
        imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&auto=format&fit=crop&q=80',
        sortOrder: 3,
        children: [
          {
            name: 'Smartwatches',
            slug: 'smartwatches',
            description: 'Fitness tracking smartwatches with heart rate, GPS, and notifications.',
            imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&auto=format&fit=crop&q=80',
            sortOrder: 1,
          },
          {
            name: 'Luxury Watches',
            slug: 'luxury-watches',
            description: 'Automatic mechanical timepieces and Swiss-movement luxury watches.',
            imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400&auto=format&fit=crop&q=80',
            sortOrder: 2,
          },
        ],
      },
    ],
  },
  {
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Transform your space with stylish furniture, culinary tools, and ambient lighting.',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80',
    sortOrder: 3,
    children: [
      {
        name: 'Kitchen & Dining',
        slug: 'kitchen-dining',
        description: 'Chef-grade cookware, dinnerware collections, and espresso machines.',
        imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&auto=format&fit=crop&q=80',
        sortOrder: 1,
        children: [
          {
            name: 'Cookware & Bakeware',
            slug: 'cookware-bakeware',
            description: 'Non-stick frying pans, cast iron skillets, and stainless steel pots.',
            imageUrl: 'https://images.unsplash.com/photo-1584990347449-39906f3630f5?w=400&auto=format&fit=crop&q=80',
            sortOrder: 1,
          },
          {
            name: 'Small Kitchen Appliances',
            slug: 'small-kitchen-appliances',
            description: 'Air fryers, high-speed blenders, toasters, and electric kettles.',
            imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=400&auto=format&fit=crop&q=80',
            sortOrder: 2,
          },
        ],
      },
      {
        name: 'Home Decor & Lighting',
        slug: 'home-decor-lighting',
        description: 'Decorative wall fixtures, cozy accent rugs, and modern chandeliers.',
        imageUrl: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=400&auto=format&fit=crop&q=80',
        sortOrder: 2,
        children: [
          {
            name: 'Lamps & Ambient Lighting',
            slug: 'lamps-ambient-lighting',
            description: 'Minimalist floor lamps, bedside LED lights, and dimmable sconces.',
            imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&auto=format&fit=crop&q=80',
            sortOrder: 1,
          },
          {
            name: 'Wall Art & Wall Decor',
            slug: 'wall-art-wall-decor',
            description: 'Canvas paintings, modern minimalist posters, and floating mirrors.',
            imageUrl: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=400&auto=format&fit=crop&q=80',
            sortOrder: 2,
          },
        ],
      },
    ],
  },
  {
    name: 'Health & Beauty',
    slug: 'health-beauty',
    description: 'Dermatologist-tested skincare, luxury perfumes, and personal care essentials.',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80',
    sortOrder: 4,
    children: [
      {
        name: 'Skincare & Treatments',
        slug: 'skincare-treatments',
        description: 'Gentle cleansers, hydration serums, and anti-aging treatments.',
        imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80',
        sortOrder: 1,
        children: [
          {
            name: 'Face Serums & Creams',
            slug: 'face-serums-creams',
            description: 'Hyaluronic acid serums, vitamin C brightening, and ceramide creams.',
            imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80',
            sortOrder: 1,
          },
          {
            name: 'Sun Care & Protection',
            slug: 'sun-care-protection',
            description: 'Broad-spectrum SPF 50+ mineral sunscreens and after-sun lotions.',
            imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&auto=format&fit=crop&q=80',
            sortOrder: 2,
          },
        ],
      },
      {
        name: 'Fragrances & Perfumes',
        slug: 'fragrances-perfumes',
        description: 'Sensory perfumes, eau de toilette, and woody/floral cologne bouquets.',
        imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&auto=format&fit=crop&q=80',
        sortOrder: 2,
        children: [
          {
            name: "Men's Cologne",
            slug: 'mens-cologne',
            description: 'Woody, spicy, and aquatic masculine fragrance profiles.',
            imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&auto=format&fit=crop&q=80',
            sortOrder: 1,
          },
          {
            name: "Women's Perfume",
            slug: 'womens-perfume',
            description: 'Floral, citrus, and sweet gourmand signature scents.',
            imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&auto=format&fit=crop&q=80',
            sortOrder: 2,
          },
        ],
      },
    ],
  },
  {
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    description: 'Gear up for workouts, outdoor trail hikes, yoga, and athletic performance.',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
    sortOrder: 5,
    children: [
      {
        name: 'Fitness & Gym',
        slug: 'fitness-gym',
        description: 'Home workout equipment, resistance gear, and cardio training accessories.',
        imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400&auto=format&fit=crop&q=80',
        sortOrder: 1,
        children: [
          {
            name: 'Yoga Mats & Foam Rollers',
            slug: 'yoga-mats-foam-rollers',
            description: 'Non-slip eco-friendly yoga mats, alignment blocks, and recovery rollers.',
            imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&auto=format&fit=crop&q=80',
            sortOrder: 1,
          },
          {
            name: 'Dumbbells & Barbells',
            slug: 'dumbbells-barbells',
            description: 'Adjustable dumbbells, kettlebells, and Olympic weight plates.',
            imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&q=80',
            sortOrder: 2,
          },
        ],
      },
      {
        name: 'Outdoor Gear',
        slug: 'outdoor-gear',
        description: 'Weatherproof camping tents, hiking backpacks, and trekking equipment.',
        imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&auto=format&fit=crop&q=80',
        sortOrder: 2,
        children: [
          {
            name: 'Camping & Hiking Gear',
            slug: 'camping-hiking-gear',
            description: 'Insulated sleeping bags, camping cookstoves, and hiking poles.',
            imageUrl: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=400&auto=format&fit=crop&q=80',
            sortOrder: 1,
          },
        ],
      },
    ],
  },
];

async function seedCategoryTree(
  nodes: CategorySeedNode[],
  parentId: string | null = null,
): Promise<number> {
  let count = 0;
  for (const node of nodes) {
    const record = await prisma.category.upsert({
      where: { slug: node.slug },
      update: {
        name: node.name,
        description: node.description,
        imageUrl: node.imageUrl,
        parentId,
        sortOrder: node.sortOrder ?? 0,
        isActive: true,
      },
      create: {
        name: node.name,
        slug: node.slug,
        description: node.description,
        imageUrl: node.imageUrl,
        parentId,
        sortOrder: node.sortOrder ?? 0,
        isActive: true,
      },
    });
    count++;

    if (node.children && node.children.length > 0) {
      count += await seedCategoryTree(node.children, record.id);
    }
  }
  return count;
}

async function seedSuperAdmin() {
  const superAdminEmail =
    process.env.SUPER_ADMIN_EMAIL || 'admin@az-ecommerce.local';
  const superAdminPassword =
    process.env.SUPER_ADMIN_PASSWORD || 'Admin123456!';
  const superAdminName =
    process.env.SUPER_ADMIN_NAME || 'Super Administrator';

  console.log(`Checking existing super admin: ${superAdminEmail}`);
  const existing = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (existing) {
    console.log(`Super admin ${superAdminEmail} already exists. Skipping.`);
    return;
  }

  const passwordHash = await argon2.hash(superAdminPassword, {
    type: argon2.argon2id,
  });

  const created = await prisma.user.create({
    data: {
      email: superAdminEmail,
      passwordHash,
      name: superAdminName,
      role: Role.SUPER_ADMIN,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(
    `Provisioned initial SUPER_ADMIN user: ${created.email} (${created.id})`,
  );
}

async function seedCategories() {
  console.log('Seeding category demo hierarchy...');
  const totalSeeded = await seedCategoryTree(CATEGORY_DEMO_DATA, null);
  console.log(`Successfully seeded/updated ${totalSeeded} categories.`);
}

async function seed() {
  await seedSuperAdmin();
  await seedCategories();
}

seed()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
