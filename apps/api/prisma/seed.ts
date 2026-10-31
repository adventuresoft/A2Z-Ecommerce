import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, AttributeType, StockMovementType, DiscountType } from '@prisma/client';
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

async function seedDemoUsers() {
  const defaultPassword = 'Password123!';
  const passwordHash = await argon2.hash(defaultPassword, {
    type: argon2.argon2id,
  });

  console.log('Seeding permissions pool...');
  const CORE_MODULES = [
    'user',
    'basic_setting',
    'products',
    'categories',
    'brands',
    'attributes',
    'variants',
    'orders',
    'inventory',
    'shipments',
    'customers',
    'marketing',
    'payments',
    'engagement',
    'reports',
  ];
  const CORE_ACTIONS = ['read', 'create', 'update', 'delete'];

  for (const mod of CORE_MODULES) {
    const modTitle = mod.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    for (const act of CORE_ACTIONS) {
      const key = `${mod}.${act}`;
      await prisma.permissionDefinition.upsert({
        where: { key },
        create: {
          key,
          name: `${act.toUpperCase()} ${modTitle}`,
          module: mod,
          action: act,
          description: `Permission to ${act} resources in ${modTitle} module`,
          isSystem: true,
        },
        update: {},
      });
    }
  }

  console.log('Seeding security roles directory...');
  const allPerms = CORE_MODULES.flatMap((m) => CORE_ACTIONS.map((a) => `${m}.${a}`));
  const cruPerms = CORE_MODULES.flatMap((m) => ['read', 'create', 'update'].map((a) => `${m}.${a}`));
  const shopPerms = [
    'products.read', 'products.create', 'products.update', 'products.delete',
    'variants.read', 'variants.create', 'variants.update', 'variants.delete',
    'categories.read', 'categories.create', 'categories.update',
    'brands.read', 'brands.create', 'brands.update',
    'attributes.read', 'attributes.create', 'attributes.update',
    'orders.read', 'orders.update',
    'inventory.read', 'inventory.update',
  ];

  const superAdminRole = await prisma.roleDefinition.upsert({
    where: { slug: 'superadmin' },
    create: {
      name: 'SuperAdmin',
      slug: 'superadmin',
      description: 'Full unrestricted root system access across all domain capabilities.',
      isSystem: true,
      permissions: allPerms,
    },
    update: { permissions: allPerms },
  });

  const adminRole = await prisma.roleDefinition.upsert({
    where: { slug: 'admin' },
    create: {
      name: 'Operations Admin',
      slug: 'admin',
      description: 'Operational access to manage catalog, orders, inventory, and shipments without deletion privileges.',
      isSystem: true,
      permissions: cruPerms,
    },
    update: { permissions: cruPerms },
  });

  const shopManagerRole = await prisma.roleDefinition.upsert({
    where: { slug: 'shop_manager' },
    create: {
      name: 'Shop Manager',
      slug: 'shop_manager',
      description: 'Catalog, variant, order, and inventory management capabilities.',
      isSystem: true,
      permissions: shopPerms,
    },
    update: { permissions: shopPerms },
  });

  const customerRole = await prisma.roleDefinition.upsert({
    where: { slug: 'customer' },
    create: {
      name: 'Customer',
      slug: 'customer',
      description: 'Customer storefront account with no administrative abilities.',
      isSystem: true,
      permissions: [],
    },
    update: {},
  });

  const demoUsers = [
    {
      email: 'superadmin@az-ecommerce.local',
      name: 'Super Admin',
      role: Role.SUPER_ADMIN,
      roleId: superAdminRole.id,
      designation: 'Chief Executive Officer (CEO)',
      department: 'Executive Leadership',
      section: 'Headquarters',
      location: 'Dhaka, Bangladesh',
      phone: '+8801700000001',
    },
    {
      email: 'admin@az-ecommerce.local',
      name: 'Operations Admin',
      role: Role.ADMIN,
      roleId: adminRole.id,
      designation: 'Operations Director',
      department: 'Operations & Fulfillment',
      section: 'Order Processing',
      location: 'Dhaka, Bangladesh',
      phone: '+8801700000002',
    },
    {
      email: 'shopmanager@az-ecommerce.local',
      name: 'Shop Manager',
      role: Role.SHOP_MANAGER,
      roleId: shopManagerRole.id,
      designation: 'Head of Merchandising',
      department: 'Catalog Management',
      section: 'Merchandising',
      location: 'Chittagong, Bangladesh',
      phone: '+8801700000003',
    },
    {
      email: 'customer@az-ecommerce.local',
      name: 'Demo Customer',
      role: Role.CUSTOMER,
      roleId: customerRole.id,
      designation: null,
      department: null,
      section: null,
      location: 'Dhaka, Bangladesh',
      phone: '+8801700000004',
    },
    // Realistic administrative directory matching reference design
    {
      email: 'admaodhaka@gmail.com',
      name: 'SM JAHIDUL ISLAM',
      role: Role.ADMIN,
      roleId: adminRole.id,
      designation: 'Assistant Director (Operations)',
      department: 'ADM',
      section: 'Magistracy Section',
      location: 'Dhaka (District) - District: Dhaka',
      phone: '012589654',
    },
    {
      email: 'macemdhaka@gmail.com',
      name: 'Naimur Rahman',
      role: Role.ADMIN,
      roleId: adminRole.id,
      designation: 'Senior Accounts Specialist',
      department: 'Revenue',
      section: 'Record Room Section',
      location: 'Dhaka (District) - District: Dhaka',
      phone: '014586987',
    },
    {
      email: 'hracedhaka@gmail.com',
      name: 'Sharif Mohammad Helal Uddin',
      role: Role.ADMIN,
      roleId: adminRole.id,
      designation: 'Senior HR Executive',
      department: 'Human Resource Management',
      section: 'Establishment Section',
      location: 'Dhaka (District) - District: Dhaka',
      phone: '0172868595',
    },
    {
      email: 'adcdevelopmentdhaka@gmail.com',
      name: 'Md. Mahbub Ullah Majumder',
      role: Role.SUPER_ADMIN,
      roleId: superAdminRole.id,
      designation: 'Deputy General Manager',
      department: 'Human Resource Management',
      section: 'N/A',
      location: 'Dhaka (District) - District: Dhaka',
      phone: '01300029796',
    },
    {
      email: 'ddlgdhaka@gmail.com',
      name: 'Jaber Md. Shoaib',
      role: Role.SHOP_MANAGER,
      roleId: shopManagerRole.id,
      designation: 'Branch Merchandiser',
      department: 'Local Government Branch',
      section: 'N/A',
      location: 'Dhaka (District) - District: Dhaka',
      phone: '01728680879',
    },
    {
      email: 'admdhaka@gmail.com',
      name: 'Mr. Litus Lowrence Chiran',
      role: Role.ADMIN,
      roleId: adminRole.id,
      designation: 'Administrative Officer',
      department: 'ADM',
      section: 'N/A',
      location: 'Dhaka (District) - District: Dhaka',
      phone: '01951652634',
    },
  ];

  console.log('Seeding demo accounts for all roles and employee directory...');
  for (const user of demoUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existing) {
      await prisma.user.update({
        where: { email: user.email },
        data: {
          role: user.role,
          roleId: user.roleId,
          name: user.name,
          phone: user.phone,
          designation: user.designation,
          department: user.department,
          section: user.section,
          location: user.location,
          isActive: true,
          passwordHash,
        },
      });
      console.log(`Updated demo user: ${user.email} (${user.role})`);
    } else {
      const created = await prisma.user.create({
        data: {
          email: user.email,
          passwordHash,
          name: user.name,
          role: user.role,
          roleId: user.roleId,
          phone: user.phone,
          designation: user.designation,
          department: user.department,
          section: user.section,
          location: user.location,
          isActive: true,
          emailVerifiedAt: new Date(),
        },
      });
      console.log(`Created demo user: ${created.email} (${created.role})`);
    }
  }
}

async function seedCategories() {
  console.log('Seeding category demo hierarchy...');
  const totalSeeded = await seedCategoryTree(CATEGORY_DEMO_DATA, null);
  console.log(`Successfully seeded/updated ${totalSeeded} categories.`);
}

interface BrandSeedItem {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
}

const BRAND_DEMO_DATA: BrandSeedItem[] = [
  {
    name: 'Apple',
    slug: 'apple',
    description: 'Innovative consumer electronics, smartphones, and personal computing.',
    website: 'https://www.apple.com',
    sortOrder: 1,
    isActive: true,
  },
  {
    name: 'Samsung',
    slug: 'samsung',
    description: 'Global leader in mobile electronics, displays, and smart home tech.',
    website: 'https://www.samsung.com',
    sortOrder: 2,
    isActive: true,
  },
  {
    name: 'Sony',
    slug: 'sony',
    description: 'Pioneering audio, visual, gaming entertainment, and cameras.',
    website: 'https://www.sony.com',
    sortOrder: 3,
    isActive: true,
  },
  {
    name: 'Nike',
    slug: 'nike',
    description: 'World-class athletic footwear, performance sportswear, and accessories.',
    website: 'https://www.nike.com',
    sortOrder: 4,
    isActive: true,
  },
  {
    name: 'Adidas',
    slug: 'adidas',
    description: 'Iconic three-stripe athletic footwear, sportswear, and lifestyle apparel.',
    website: 'https://www.adidas.com',
    sortOrder: 5,
    isActive: true,
  },
  {
    name: "Levi's",
    slug: 'levis',
    description: 'Authentic denim jeans, heritage apparel, and timeless American fashion.',
    website: 'https://www.levi.com',
    sortOrder: 6,
    isActive: true,
  },
  {
    name: 'Retro Audio Co',
    slug: 'retro-audio-co',
    description: 'Archived boutique manufacturer of vintage reel-to-reel and vinyl systems.',
    website: 'https://example.com/retro-audio',
    sortOrder: 99,
    isActive: false,
  },
];

async function seedBrands() {
  console.log('Seeding brand demo data...');
  let count = 0;
  for (const brand of BRAND_DEMO_DATA) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {
        name: brand.name,
        description: brand.description,
        website: brand.website,
        logoUrl: brand.logoUrl,
        sortOrder: brand.sortOrder ?? 0,
        isActive: brand.isActive ?? true,
      },
      create: {
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
        website: brand.website,
        logoUrl: brand.logoUrl,
        sortOrder: brand.sortOrder ?? 0,
        isActive: brand.isActive ?? true,
      },
    });
    count++;
  }
  console.log(`Successfully seeded/updated ${count} brands.`);
}

interface AttributeValueSeedItem {
  value: string;
  label?: string;
  colorCode?: string;
  sortOrder?: number;
  isActive?: boolean;
}

interface AttributeSeedItem {
  name: string;
  slug: string;
  type: AttributeType;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  values: AttributeValueSeedItem[];
}

const ATTRIBUTE_DEMO_DATA: AttributeSeedItem[] = [
  {
    name: 'Color',
    slug: 'color',
    type: AttributeType.COLOR,
    description: 'Product color options with visual swatches.',
    sortOrder: 1,
    isActive: true,
    values: [
      { value: 'Black', label: 'Matte Black', colorCode: '#000000', sortOrder: 1 },
      { value: 'White', label: 'Pearl White', colorCode: '#FFFFFF', sortOrder: 2 },
      { value: 'Navy Blue', label: 'Navy Blue', colorCode: '#000080', sortOrder: 3 },
      { value: 'Crimson Red', label: 'Crimson Red', colorCode: '#DC143C', sortOrder: 4 },
      { value: 'Space Gray', label: 'Space Gray', colorCode: '#708090', sortOrder: 5 },
      { value: 'Emerald Green', label: 'Emerald Green', colorCode: '#50C878', sortOrder: 6 },
    ],
  },
  {
    name: 'Apparel Size',
    slug: 'apparel-size',
    type: AttributeType.BUTTON,
    description: 'Standard sizing for clothing and fashion apparel.',
    sortOrder: 2,
    isActive: true,
    values: [
      { value: 'XS', label: 'Extra Small', sortOrder: 1 },
      { value: 'S', label: 'Small', sortOrder: 2 },
      { value: 'M', label: 'Medium', sortOrder: 3 },
      { value: 'L', label: 'Large', sortOrder: 4 },
      { value: 'XL', label: 'Extra Large', sortOrder: 5 },
      { value: 'XXL', label: '2X Large', sortOrder: 6 },
    ],
  },
  {
    name: 'Shoe Size',
    slug: 'shoe-size',
    type: AttributeType.BUTTON,
    description: 'Footwear sizing in EU standards.',
    sortOrder: 3,
    isActive: true,
    values: [
      { value: '39', label: 'EU 39', sortOrder: 1 },
      { value: '40', label: 'EU 40', sortOrder: 2 },
      { value: '41', label: 'EU 41', sortOrder: 3 },
      { value: '42', label: 'EU 42', sortOrder: 4 },
      { value: '43', label: 'EU 43', sortOrder: 5 },
      { value: '44', label: 'EU 44', sortOrder: 6 },
    ],
  },
  {
    name: 'Storage Capacity',
    slug: 'storage-capacity',
    type: AttributeType.BUTTON,
    description: 'On-board flash storage capacity for electronics.',
    sortOrder: 4,
    isActive: true,
    values: [
      { value: '64GB', label: '64 GB', sortOrder: 1 },
      { value: '128GB', label: '128 GB', sortOrder: 2 },
      { value: '256GB', label: '256 GB', sortOrder: 3 },
      { value: '512GB', label: '512 GB', sortOrder: 4 },
      { value: '1TB', label: '1 TB', sortOrder: 5 },
    ],
  },
  {
    name: 'Material',
    slug: 'material',
    type: AttributeType.TEXT,
    description: 'Fabric or physical material composition.',
    sortOrder: 5,
    isActive: true,
    values: [
      { value: '100% Cotton', label: '100% Cotton', sortOrder: 1 },
      { value: 'Genuine Leather', label: 'Genuine Leather', sortOrder: 2 },
      { value: 'Polyester Blend', label: 'Polyester Blend', sortOrder: 3 },
      { value: 'Merino Wool', label: 'Merino Wool', sortOrder: 4 },
    ],
  },
];

async function seedAttributes() {
  console.log('Seeding attribute demo data...');
  let attrCount = 0;
  let valCount = 0;
  for (const attr of ATTRIBUTE_DEMO_DATA) {
    const attribute = await prisma.attribute.upsert({
      where: { slug: attr.slug },
      update: {
        name: attr.name,
        type: attr.type,
        description: attr.description,
        sortOrder: attr.sortOrder ?? 0,
        isActive: attr.isActive ?? true,
      },
      create: {
        name: attr.name,
        slug: attr.slug,
        type: attr.type,
        description: attr.description,
        sortOrder: attr.sortOrder ?? 0,
        isActive: attr.isActive ?? true,
      },
    });
    attrCount++;

    for (const val of attr.values) {
      await prisma.attributeValue.upsert({
        where: {
          attributeId_value: {
            attributeId: attribute.id,
            value: val.value,
          },
        },
        update: {
          label: val.label,
          colorCode: val.colorCode,
          sortOrder: val.sortOrder ?? 0,
          isActive: val.isActive ?? true,
        },
        create: {
          attributeId: attribute.id,
          value: val.value,
          label: val.label,
          colorCode: val.colorCode,
          sortOrder: val.sortOrder ?? 0,
          isActive: val.isActive ?? true,
        },
      });
      valCount++;
    }
  }
  console.log(`Successfully seeded/updated ${attrCount} attributes with ${valCount} values.`);
}

interface ProductSeedVariant {
  sku: string;
  barcode?: string;
  regularPrice: number;
  salePrice?: number;
  weightGrams?: number;
  imageUrl?: string;
  isActive?: boolean;
  attributes: {
    attributeSlug: string;
    value: string;
  }[];
  inventory: {
    quantity: number;
    reservedQuantity?: number;
    lowStockThreshold?: number;
  };
}

interface ProductSeedItem {
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categorySlug: string;
  brandSlug?: string;
  thumbnailUrl: string;
  isFeatured?: boolean;
  isActive?: boolean;
  images: {
    imageUrl: string;
    altText?: string;
    isPrimary?: boolean;
    sortOrder?: number;
  }[];
  variants: ProductSeedVariant[];
}

const PRODUCT_DEMO_DATA: ProductSeedItem[] = [
  {
    title: 'Apple iPhone 16 Pro Max',
    slug: 'apple-iphone-16-pro-max',
    description:
      'The iPhone 16 Pro Max features a durable and lightweight titanium design with the thinnest borders on any Apple product. Powered by the A18 Pro chip, it brings unprecedented efficiency and graphics performance with Camera Control and 48MP Fusion camera system.',
    shortDescription:
      'Grade 5 titanium design, A18 Pro chip, 48MP Fusion camera, and best-ever battery life.',
    categorySlug: 'apple-iphones',
    brandSlug: 'apple',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
    isFeatured: true,
    isActive: true,
    images: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
        altText: 'iPhone 16 Pro Max front and back view',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
        altText: 'iPhone 16 Pro Max camera module',
        isPrimary: false,
        sortOrder: 2,
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80',
        altText: 'iPhone 16 Pro Max display angle',
        isPrimary: false,
        sortOrder: 3,
      },
    ],
    variants: [
      {
        sku: 'IPHONE16PM-SG-256',
        barcode: '194253123456',
        regularPrice: 1299.0,
        salePrice: 1199.0,
        weightGrams: 227,
        imageUrl:
          'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Space Gray' },
          { attributeSlug: 'storage-capacity', value: '256GB' },
        ],
        inventory: { quantity: 45, reservedQuantity: 2, lowStockThreshold: 5 },
      },
      {
        sku: 'IPHONE16PM-SG-512',
        barcode: '194253123463',
        regularPrice: 1499.0,
        salePrice: 1399.0,
        weightGrams: 227,
        imageUrl:
          'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Space Gray' },
          { attributeSlug: 'storage-capacity', value: '512GB' },
        ],
        inventory: { quantity: 30, reservedQuantity: 1, lowStockThreshold: 5 },
      },
      {
        sku: 'IPHONE16PM-WH-256',
        barcode: '194253123470',
        regularPrice: 1299.0,
        salePrice: 1199.0,
        weightGrams: 227,
        imageUrl:
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'White' },
          { attributeSlug: 'storage-capacity', value: '256GB' },
        ],
        inventory: { quantity: 20, reservedQuantity: 0, lowStockThreshold: 5 },
      },
      {
        sku: 'IPHONE16PM-WH-1TB',
        barcode: '194253123487',
        regularPrice: 1699.0,
        salePrice: 1599.0,
        weightGrams: 227,
        imageUrl:
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'White' },
          { attributeSlug: 'storage-capacity', value: '1TB' },
        ],
        inventory: { quantity: 4, reservedQuantity: 0, lowStockThreshold: 5 },
      },
    ],
  },
  {
    title: 'Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra',
    description:
      'Welcome to the era of mobile AI. With Galaxy S24 Ultra in your hands, you can unleash whole new levels of creativity, productivity, and possibility. Encased in durable titanium with a flat 6.8-inch Dynamic AMOLED 2X display and embedded S Pen.',
    shortDescription:
      'Galaxy AI powered flagship with 200MP camera, titanium frame, and built-in S Pen.',
    categorySlug: 'android-smartphones',
    brandSlug: 'samsung',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80',
    isFeatured: true,
    isActive: true,
    images: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80',
        altText: 'Samsung Galaxy S24 Ultra',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
        altText: 'Samsung Galaxy S24 Ultra in hand',
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    variants: [
      {
        sku: 'S24U-BLK-256',
        barcode: '880609123401',
        regularPrice: 1299.0,
        salePrice: 1149.0,
        weightGrams: 232,
        imageUrl:
          'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Black' },
          { attributeSlug: 'storage-capacity', value: '256GB' },
        ],
        inventory: { quantity: 35, reservedQuantity: 3, lowStockThreshold: 5 },
      },
      {
        sku: 'S24U-BLK-512',
        barcode: '880609123418',
        regularPrice: 1419.0,
        salePrice: 1299.0,
        weightGrams: 232,
        imageUrl:
          'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Black' },
          { attributeSlug: 'storage-capacity', value: '512GB' },
        ],
        inventory: { quantity: 15, reservedQuantity: 0, lowStockThreshold: 5 },
      },
      {
        sku: 'S24U-GRY-256',
        barcode: '880609123425',
        regularPrice: 1299.0,
        salePrice: 1149.0,
        weightGrams: 232,
        imageUrl:
          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Space Gray' },
          { attributeSlug: 'storage-capacity', value: '256GB' },
        ],
        inventory: { quantity: 2, reservedQuantity: 0, lowStockThreshold: 5 },
      },
    ],
  },
  {
    title: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones',
    slug: 'sony-wh-1000xm5-wireless-headphones',
    description:
      'Industry-leading noise cancellation optimized with two processors and 8 microphones. Magnificent sound engineered to perfection with Integrated Processor V1, crystal clear hands-free calling, and up to 30 hours of battery life with quick charging.',
    shortDescription:
      'Premium wireless noise-cancelling overhead headphones with 30-hour battery.',
    categorySlug: 'wireless-earbuds',
    brandSlug: 'sony',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    isFeatured: true,
    isActive: true,
    images: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        altText: 'Sony WH-1000XM5 Black',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
        altText: 'Sony WH-1000XM5 profile angle',
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    variants: [
      {
        sku: 'SONY-XM5-BLK',
        barcode: '027242921504',
        regularPrice: 399.99,
        salePrice: 349.99,
        weightGrams: 250,
        imageUrl:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [{ attributeSlug: 'color', value: 'Black' }],
        inventory: { quantity: 60, reservedQuantity: 4, lowStockThreshold: 8 },
      },
      {
        sku: 'SONY-XM5-WHT',
        barcode: '027242921511',
        regularPrice: 399.99,
        salePrice: 349.99,
        weightGrams: 250,
        imageUrl:
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [{ attributeSlug: 'color', value: 'White' }],
        inventory: { quantity: 18, reservedQuantity: 1, lowStockThreshold: 5 },
      },
      {
        sku: 'SONY-XM5-NVY',
        barcode: '027242921528',
        regularPrice: 399.99,
        salePrice: 349.99,
        weightGrams: 250,
        imageUrl:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [{ attributeSlug: 'color', value: 'Navy Blue' }],
        inventory: { quantity: 0, reservedQuantity: 0, lowStockThreshold: 5 },
      },
    ],
  },
  {
    title: 'Apple MacBook Pro 16-inch M3 Max',
    slug: 'apple-macbook-pro-16-m3-max',
    description:
      'MacBook Pro blasts forward with M3 Max, an insanely advanced chip designed for extreme workflows. Featuring up to 22 hours of battery life, Liquid Retina XDR display with 1600 nits peak brightness, and an array of pro connectivity ports.',
    shortDescription:
      '16.2-inch Liquid Retina XDR display, M3 Max chip, and up to 22 hours battery.',
    categorySlug: 'ultrabooks-workstations',
    brandSlug: 'apple',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    isFeatured: true,
    isActive: true,
    images: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
        altText: 'MacBook Pro 16 open on desk',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80',
        altText: 'MacBook Pro keyboard and trackpad',
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    variants: [
      {
        sku: 'MBP16-SG-512',
        barcode: '194253987654',
        regularPrice: 2699.0,
        salePrice: 2499.0,
        weightGrams: 2160,
        imageUrl:
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Space Gray' },
          { attributeSlug: 'storage-capacity', value: '512GB' },
        ],
        inventory: { quantity: 12, reservedQuantity: 1, lowStockThreshold: 3 },
      },
      {
        sku: 'MBP16-SG-1TB',
        barcode: '194253987661',
        regularPrice: 3199.0,
        salePrice: 2999.0,
        weightGrams: 2160,
        imageUrl:
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Space Gray' },
          { attributeSlug: 'storage-capacity', value: '1TB' },
        ],
        inventory: { quantity: 8, reservedQuantity: 0, lowStockThreshold: 3 },
      },
    ],
  },
  {
    title: 'Nike Air Zoom Pegasus 40 Running Shoes',
    slug: 'nike-air-zoom-pegasus-40',
    description:
      'A springy ride for every run, the Peg familiar, just-for-you feel returns to help you crush your running goals. This milestone edition provides responsive dual Zoom Air cushioning and engineered mesh for superior breathability.',
    shortDescription:
      'Responsive daily road running sneakers with dual Zoom Air units.',
    categorySlug: 'mens-footwear-sneakers',
    brandSlug: 'nike',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    isFeatured: true,
    isActive: true,
    images: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
        altText: 'Nike Pegasus 40 Red/Black',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80',
        altText: 'Nike Pegasus 40 side angle',
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    variants: [
      {
        sku: 'NIKE-PEG40-BLK-41',
        barcode: '019660812301',
        regularPrice: 140.0,
        salePrice: 119.99,
        weightGrams: 285,
        imageUrl:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Black' },
          { attributeSlug: 'shoe-size', value: '41' },
        ],
        inventory: { quantity: 25, reservedQuantity: 2, lowStockThreshold: 5 },
      },
      {
        sku: 'NIKE-PEG40-BLK-42',
        barcode: '019660812318',
        regularPrice: 140.0,
        salePrice: 119.99,
        weightGrams: 290,
        imageUrl:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Black' },
          { attributeSlug: 'shoe-size', value: '42' },
        ],
        inventory: { quantity: 30, reservedQuantity: 0, lowStockThreshold: 5 },
      },
      {
        sku: 'NIKE-PEG40-BLK-43',
        barcode: '019660812325',
        regularPrice: 140.0,
        salePrice: 119.99,
        weightGrams: 300,
        imageUrl:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Black' },
          { attributeSlug: 'shoe-size', value: '43' },
        ],
        inventory: { quantity: 3, reservedQuantity: 0, lowStockThreshold: 5 },
      },
      {
        sku: 'NIKE-PEG40-WHT-42',
        barcode: '019660812332',
        regularPrice: 140.0,
        salePrice: 119.99,
        weightGrams: 290,
        imageUrl:
          'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'White' },
          { attributeSlug: 'shoe-size', value: '42' },
        ],
        inventory: { quantity: 15, reservedQuantity: 0, lowStockThreshold: 5 },
      },
      {
        sku: 'NIKE-PEG40-RED-42',
        barcode: '019660812349',
        regularPrice: 140.0,
        salePrice: 124.99,
        weightGrams: 290,
        imageUrl:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Crimson Red' },
          { attributeSlug: 'shoe-size', value: '42' },
        ],
        inventory: { quantity: 0, reservedQuantity: 0, lowStockThreshold: 5 },
      },
    ],
  },
  {
    title: 'Adidas Originals Trefoil Classic Polo Shirt',
    slug: 'adidas-originals-trefoil-classic-polo',
    description:
      'Rooted in sportswear legacy and refined for casual elegance, this polo shirt is woven from pure 100% breathable pique cotton with the signature embroidered Trefoil on the chest and ribbed polo collar.',
    shortDescription:
      'Timeless short-sleeve athletic polo shirt tailored from 100% breathable cotton.',
    categorySlug: 'mens-casual-shirts-polos',
    brandSlug: 'adidas',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
    isFeatured: false,
    isActive: true,
    images: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
        altText: 'Adidas Classic Polo front',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
        altText: 'Adidas Classic Polo texture detail',
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    variants: [
      {
        sku: 'ADI-POLO-NVY-M',
        barcode: '406542109801',
        regularPrice: 60.0,
        salePrice: 49.99,
        weightGrams: 220,
        imageUrl:
          'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Navy Blue' },
          { attributeSlug: 'apparel-size', value: 'M' },
          { attributeSlug: 'material', value: '100% Cotton' },
        ],
        inventory: { quantity: 40, reservedQuantity: 1, lowStockThreshold: 5 },
      },
      {
        sku: 'ADI-POLO-NVY-L',
        barcode: '406542109818',
        regularPrice: 60.0,
        salePrice: 49.99,
        weightGrams: 230,
        imageUrl:
          'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Navy Blue' },
          { attributeSlug: 'apparel-size', value: 'L' },
          { attributeSlug: 'material', value: '100% Cotton' },
        ],
        inventory: { quantity: 35, reservedQuantity: 2, lowStockThreshold: 5 },
      },
      {
        sku: 'ADI-POLO-WHT-M',
        barcode: '406542109825',
        regularPrice: 60.0,
        salePrice: 49.99,
        weightGrams: 220,
        imageUrl:
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'White' },
          { attributeSlug: 'apparel-size', value: 'M' },
          { attributeSlug: 'material', value: '100% Cotton' },
        ],
        inventory: { quantity: 20, reservedQuantity: 0, lowStockThreshold: 5 },
      },
      {
        sku: 'ADI-POLO-WHT-L',
        barcode: '406542109832',
        regularPrice: 60.0,
        salePrice: 49.99,
        weightGrams: 230,
        imageUrl:
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'White' },
          { attributeSlug: 'apparel-size', value: 'L' },
          { attributeSlug: 'material', value: '100% Cotton' },
        ],
        inventory: { quantity: 5, reservedQuantity: 0, lowStockThreshold: 5 },
      },
    ],
  },
  {
    title: "Levi's 501 Original Fit Denim Jeans",
    slug: 'levis-501-original-fit-jeans',
    description:
      'Close your eyes. Think "jeans." Now open. They were 501 Originals, right? With a timeless straight leg and iconic styling, they are literally the blueprint for every pair of modern jeans in existence. Crafted from 100% heavyweight cotton denim.',
    shortDescription:
      'The authentic straight-leg blue jeans featuring the iconic signature button fly.',
    categorySlug: 'mens-jeans-chinos',
    brandSlug: 'levis',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80',
    isFeatured: true,
    isActive: true,
    images: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80',
        altText: "Levi's 501 Denim front",
        isPrimary: true,
        sortOrder: 1,
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80',
        altText: "Levi's 501 folded stack",
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    variants: [
      {
        sku: 'LEVI-501-NVY-M',
        barcode: '052177000101',
        regularPrice: 89.5,
        salePrice: 79.5,
        weightGrams: 650,
        imageUrl:
          'https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Navy Blue' },
          { attributeSlug: 'apparel-size', value: 'M' },
          { attributeSlug: 'material', value: '100% Cotton' },
        ],
        inventory: { quantity: 50, reservedQuantity: 3, lowStockThreshold: 10 },
      },
      {
        sku: 'LEVI-501-NVY-L',
        barcode: '052177000118',
        regularPrice: 89.5,
        salePrice: 79.5,
        weightGrams: 670,
        imageUrl:
          'https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Navy Blue' },
          { attributeSlug: 'apparel-size', value: 'L' },
          { attributeSlug: 'material', value: '100% Cotton' },
        ],
        inventory: { quantity: 45, reservedQuantity: 0, lowStockThreshold: 10 },
      },
      {
        sku: 'LEVI-501-BLK-M',
        barcode: '052177000125',
        regularPrice: 89.5,
        salePrice: 79.5,
        weightGrams: 650,
        imageUrl:
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Black' },
          { attributeSlug: 'apparel-size', value: 'M' },
          { attributeSlug: 'material', value: '100% Cotton' },
        ],
        inventory: { quantity: 28, reservedQuantity: 1, lowStockThreshold: 5 },
      },
      {
        sku: 'LEVI-501-BLK-XL',
        barcode: '052177000132',
        regularPrice: 89.5,
        salePrice: 79.5,
        weightGrams: 710,
        imageUrl:
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Black' },
          { attributeSlug: 'apparel-size', value: 'XL' },
          { attributeSlug: 'material', value: '100% Cotton' },
        ],
        inventory: { quantity: 0, reservedQuantity: 0, lowStockThreshold: 5 },
      },
    ],
  },
  {
    title: 'Apple Watch Series 9 GPS',
    slug: 'apple-watch-series-9-gps',
    description:
      'Smarter, brighter, mightier. Introducing the S9 chip, enabling a magical new double tap gesture to interact with your watch without touching the screen, along with advanced health sensors, Crash Detection, and an edge-to-edge Always-On Retina display.',
    shortDescription:
      'Advanced smartwatch with S9 SiP, always-on display, and Double Tap gesture.',
    categorySlug: 'smartwatches',
    brandSlug: 'apple',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
    isFeatured: true,
    isActive: true,
    images: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
        altText: 'Apple Watch Series 9 Space Gray',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80',
        altText: 'Apple Watch display face',
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    variants: [
      {
        sku: 'AW9-GPS-SG-45',
        barcode: '194253770101',
        regularPrice: 429.0,
        salePrice: 399.0,
        weightGrams: 39,
        imageUrl:
          'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Space Gray' },
          { attributeSlug: 'storage-capacity', value: '64GB' },
        ],
        inventory: { quantity: 22, reservedQuantity: 2, lowStockThreshold: 5 },
      },
      {
        sku: 'AW9-GPS-RED-45',
        barcode: '194253770118',
        regularPrice: 429.0,
        salePrice: 399.0,
        weightGrams: 39,
        imageUrl:
          'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Crimson Red' },
          { attributeSlug: 'storage-capacity', value: '64GB' },
        ],
        inventory: { quantity: 8, reservedQuantity: 0, lowStockThreshold: 5 },
      },
    ],
  },
  {
    title: 'Samsung Galaxy Watch 6 Classic',
    slug: 'samsung-galaxy-watch-6-classic',
    description:
      'A timeless design featuring a physical rotating bezel. Keep your fitness, sleep, and overall wellness goals on track with comprehensive body composition analysis (BIA), ECG, heart rhythm notifications, and durable sapphire crystal glass.',
    shortDescription:
      'Iconic rotating physical bezel with advanced fitness and wellness coaching.',
    categorySlug: 'smartwatches',
    brandSlug: 'samsung',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
    isFeatured: false,
    isActive: true,
    images: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
        altText: 'Galaxy Watch 6 Classic stainless steel',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
        altText: 'Galaxy Watch lifestyle shot',
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    variants: [
      {
        sku: 'GW6C-BLK-47',
        barcode: '880609501201',
        regularPrice: 429.99,
        salePrice: 369.99,
        weightGrams: 59,
        imageUrl:
          'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'Black' },
          { attributeSlug: 'storage-capacity', value: '64GB' },
        ],
        inventory: { quantity: 19, reservedQuantity: 1, lowStockThreshold: 5 },
      },
      {
        sku: 'GW6C-WHT-47',
        barcode: '880609501218',
        regularPrice: 429.99,
        salePrice: 369.99,
        weightGrams: 59,
        imageUrl:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [
          { attributeSlug: 'color', value: 'White' },
          { attributeSlug: 'storage-capacity', value: '64GB' },
        ],
        inventory: { quantity: 4, reservedQuantity: 0, lowStockThreshold: 5 },
      },
    ],
  },
  {
    title: 'Sony PlayStation 5 DualSense Wireless Controller',
    slug: 'sony-dualsense-wireless-controller',
    description:
      'Discover a deeper, highly immersive gaming experience with innovative tactile haptic feedback, dynamic adaptive triggers, and a built-in microphone, all integrated into an iconic ergonomic design with USB-C fast charging.',
    shortDescription:
      'Immersive haptic feedback, dynamic adaptive triggers, and built-in mic.',
    categorySlug: 'pc-accessories',
    brandSlug: 'sony',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1606318801954-d46d46d3360a?w=800&auto=format&fit=crop&q=80',
    isFeatured: true,
    isActive: true,
    images: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1606318801954-d46d46d3360a?w=800&auto=format&fit=crop&q=80',
        altText: 'PS5 DualSense Controller White',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&auto=format&fit=crop&q=80',
        altText: 'DualSense controller trigger and grips',
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    variants: [
      {
        sku: 'SONY-DS5-WHT',
        barcode: '711719541201',
        regularPrice: 74.99,
        salePrice: 69.99,
        weightGrams: 280,
        imageUrl:
          'https://images.unsplash.com/photo-1606318801954-d46d46d3360a?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [{ attributeSlug: 'color', value: 'White' }],
        inventory: { quantity: 80, reservedQuantity: 5, lowStockThreshold: 10 },
      },
      {
        sku: 'SONY-DS5-BLK',
        barcode: '711719541218',
        regularPrice: 79.99,
        salePrice: 74.99,
        weightGrams: 280,
        imageUrl:
          'https://images.unsplash.com/photo-1606318801954-d46d46d3360a?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [{ attributeSlug: 'color', value: 'Black' }],
        inventory: { quantity: 35, reservedQuantity: 0, lowStockThreshold: 10 },
      },
      {
        sku: 'SONY-DS5-RED',
        barcode: '711719541225',
        regularPrice: 79.99,
        salePrice: 74.99,
        weightGrams: 280,
        imageUrl:
          'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [{ attributeSlug: 'color', value: 'Crimson Red' }],
        inventory: { quantity: 1, reservedQuantity: 0, lowStockThreshold: 5 },
      },
    ],
  },
  {
    title: 'Eco-Friendly High Density Non-Slip Yoga Mat',
    slug: 'eco-friendly-high-density-yoga-mat',
    description:
      'Engineered with premium non-toxic eco TPE material, dual-sided non-slip texture, and laser-engraved alignment guides for optimal posture stability and joint protection during intense yoga, pilates, and floor workouts.',
    shortDescription:
      'Dual-sided textured 6mm yoga mat with posture alignment guides.',
    categorySlug: 'yoga-mats-foam-rollers',
    brandSlug: undefined,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop&q=80',
    isFeatured: false,
    isActive: true,
    images: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop&q=80',
        altText: 'Rolled Yoga Mat on studio floor',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
        altText: 'Yoga mat in active use',
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    variants: [
      {
        sku: 'YOGA-MAT-EMR',
        barcode: '697123456701',
        regularPrice: 49.99,
        salePrice: 39.99,
        weightGrams: 900,
        imageUrl:
          'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [{ attributeSlug: 'color', value: 'Emerald Green' }],
        inventory: { quantity: 50, reservedQuantity: 0, lowStockThreshold: 5 },
      },
      {
        sku: 'YOGA-MAT-NVY',
        barcode: '697123456718',
        regularPrice: 49.99,
        salePrice: 39.99,
        weightGrams: 900,
        imageUrl:
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [{ attributeSlug: 'color', value: 'Navy Blue' }],
        inventory: { quantity: 40, reservedQuantity: 0, lowStockThreshold: 5 },
      },
    ],
  },
  {
    title: 'Cast Iron Hex Dumbbell Pair',
    slug: 'cast-iron-hex-dumbbell-pair',
    description:
      'Heavy-duty cast iron hex dumbbells with anti-roll hexagonal heads and ergonomic knurled chrome handles. Ideal for compound lifts, strength training, arm curls, squats, and functional home gym workouts.',
    shortDescription:
      'Anti-roll hexagonal rubber encased dumbbells with ergonomic knurled grip.',
    categorySlug: 'dumbbells-barbells',
    brandSlug: undefined,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80',
    isFeatured: false,
    isActive: true,
    images: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80',
        altText: 'Cast iron hex dumbbells pair',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80',
        altText: 'Dumbbells set in gym rack',
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    variants: [
      {
        sku: 'HEX-DB-10KG',
        barcode: '697123456801',
        regularPrice: 69.99,
        salePrice: 59.99,
        weightGrams: 20000,
        imageUrl:
          'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [{ attributeSlug: 'color', value: 'Black' }],
        inventory: { quantity: 25, reservedQuantity: 0, lowStockThreshold: 5 },
      },
      {
        sku: 'HEX-DB-15KG',
        barcode: '697123456818',
        regularPrice: 99.99,
        salePrice: 89.99,
        weightGrams: 30000,
        imageUrl:
          'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [{ attributeSlug: 'color', value: 'Black' }],
        inventory: { quantity: 15, reservedQuantity: 0, lowStockThreshold: 5 },
      },
    ],
  },
  {
    title: 'Advanced Hyaluronic Acid Hydrating Serum',
    slug: 'advanced-hyaluronic-acid-serum',
    description:
      'Formulated with 5 molecular weights of pure hyaluronic acid, niacinamide, and panthenol. Deeply penetrates multi-layer skin barriers to lock in intense 72-hour moisture, smooth fine lines, and restore skin elasticity.',
    shortDescription:
      'Multi-depth intensive hydration facial serum with pure vitamin B5.',
    categorySlug: 'face-serums-creams',
    brandSlug: undefined,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
    isFeatured: true,
    isActive: true,
    images: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
        altText: 'Hyaluronic Acid Face Serum dropper bottle',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
        altText: 'Skincare serum and cream collection',
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    variants: [
      {
        sku: 'SERUM-HA-30ML',
        barcode: '880912345001',
        regularPrice: 35.0,
        salePrice: 28.5,
        weightGrams: 80,
        imageUrl:
          'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [{ attributeSlug: 'color', value: 'White' }],
        inventory: { quantity: 75, reservedQuantity: 4, lowStockThreshold: 10 },
      },
      {
        sku: 'SERUM-HA-50ML',
        barcode: '880912345018',
        regularPrice: 52.0,
        salePrice: 42.0,
        weightGrams: 120,
        imageUrl:
          'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
        isActive: true,
        attributes: [{ attributeSlug: 'color', value: 'White' }],
        inventory: { quantity: 40, reservedQuantity: 0, lowStockThreshold: 8 },
      },
    ],
  },
];

async function seedProductsAndInventory() {
  console.log('Seeding product and inventory demo data...');
  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  const brands = await prisma.brand.findMany();
  const brandMap = new Map(brands.map((b) => [b.slug, b.id]));

  const attributes = await prisma.attribute.findMany({
    include: { values: true },
  });
  const attrValueMap = new Map<string, string>();
  for (const attr of attributes) {
    for (const val of attr.values) {
      attrValueMap.set(`${attr.slug}:${val.value}`, val.id);
    }
  }

  const superAdmin = await prisma.user.findFirst({
    where: { role: Role.SUPER_ADMIN },
  });

  let productCount = 0;
  let variantCount = 0;
  let inventoryCount = 0;

  for (const item of PRODUCT_DEMO_DATA) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) {
      console.warn(
        `Category slug '${item.categorySlug}' not found. Skipping product '${item.title}'`,
      );
      continue;
    }
    const brandId = item.brandSlug
      ? brandMap.get(item.brandSlug) ?? null
      : null;

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: item.description,
        shortDescription: item.shortDescription ?? null,
        categoryId,
        brandId,
        thumbnailUrl: item.thumbnailUrl,
        isFeatured: item.isFeatured ?? false,
        isActive: item.isActive ?? true,
      },
      create: {
        title: item.title,
        slug: item.slug,
        description: item.description,
        shortDescription: item.shortDescription ?? null,
        categoryId,
        brandId,
        thumbnailUrl: item.thumbnailUrl,
        isFeatured: item.isFeatured ?? false,
        isActive: item.isActive ?? true,
      },
    });
    productCount++;

    for (const img of item.images) {
      const existing = await prisma.productImage.findFirst({
        where: { productId: product.id, imageUrl: img.imageUrl },
      });
      if (existing) {
        await prisma.productImage.update({
          where: { id: existing.id },
          data: {
            altText: img.altText ?? item.title,
            isPrimary: img.isPrimary ?? false,
            sortOrder: img.sortOrder ?? 0,
          },
        });
      } else {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            imageUrl: img.imageUrl,
            altText: img.altText ?? item.title,
            isPrimary: img.isPrimary ?? false,
            sortOrder: img.sortOrder ?? 0,
          },
        });
      }
    }

    for (const v of item.variants) {
      const variant = await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          productId: product.id,
          barcode: v.barcode ?? `BC-${v.sku}`,
          regularPrice: v.regularPrice,
          salePrice: v.salePrice ?? null,
          weightGrams: v.weightGrams ?? null,
          imageUrl: v.imageUrl ?? item.thumbnailUrl,
          isActive: v.isActive ?? true,
        },
        create: {
          productId: product.id,
          sku: v.sku,
          barcode: v.barcode ?? `BC-${v.sku}`,
          regularPrice: v.regularPrice,
          salePrice: v.salePrice ?? null,
          weightGrams: v.weightGrams ?? null,
          imageUrl: v.imageUrl ?? item.thumbnailUrl,
          isActive: v.isActive ?? true,
        },
      });
      variantCount++;

      for (const attr of v.attributes) {
        const attrValId = attrValueMap.get(
          `${attr.attributeSlug}:${attr.value}`,
        );
        if (attrValId) {
          await prisma.productVariantAttributeValue.upsert({
            where: {
              variantId_attributeValueId: {
                variantId: variant.id,
                attributeValueId: attrValId,
              },
            },
            update: {},
            create: {
              variantId: variant.id,
              attributeValueId: attrValId,
            },
          });
        }
      }

      const invQty = v.inventory.quantity;
      const invReserved = v.inventory.reservedQuantity ?? 0;
      const invThreshold = v.inventory.lowStockThreshold ?? 5;

      await prisma.inventory.upsert({
        where: { variantId: variant.id },
        update: {
          quantity: invQty,
          reservedQuantity: invReserved,
          lowStockThreshold: invThreshold,
        },
        create: {
          variantId: variant.id,
          quantity: invQty,
          reservedQuantity: invReserved,
          lowStockThreshold: invThreshold,
        },
      });
      inventoryCount++;

      const existingMovement = await prisma.stockMovement.findFirst({
        where: {
          variantId: variant.id,
          type: StockMovementType.INITIAL,
        },
      });

      if (!existingMovement) {
        await prisma.stockMovement.create({
          data: {
            variantId: variant.id,
            type: StockMovementType.INITIAL,
            quantityChange: invQty,
            previousQuantity: 0,
            newQuantity: invQty,
            referenceId: 'SEED-INIT',
            notes: 'Initial seed demo stock balance',
            performedByUserId: superAdmin?.id ?? null,
          },
        });
      }

      if (invReserved > 0) {
        const existingReserve = await prisma.stockMovement.findFirst({
          where: {
            variantId: variant.id,
            type: StockMovementType.PURCHASE_RESERVE,
          },
        });
        if (!existingReserve) {
          await prisma.stockMovement.create({
            data: {
              variantId: variant.id,
              type: StockMovementType.PURCHASE_RESERVE,
              quantityChange: -invReserved,
              previousQuantity: invQty,
              newQuantity: invQty,
              referenceId: 'DEMO-ORDER-1001',
              notes: `Customer pre-order reservation of ${invReserved} unit(s)`,
              performedByUserId: superAdmin?.id ?? null,
            },
          });
        }
      }
    }
  }

  console.log(
    `Successfully seeded/updated ${productCount} products, ${variantCount} variants, and ${inventoryCount} inventory records.`,
  );
}

async function seedStoreSettings() {
  console.log('Seeding default store settings...');
  let count = 0;
  for (const s of DEFAULT_STORE_SETTINGS) {
    await prisma.storeSetting.upsert({
      where: { key: s.key },
      create: {
        key: s.key,
        value: s.value,
        dataType: s.dataType,
        group: s.group,
        isPublic: s.isPublic,
        description: s.description,
      },
      update: {
        dataType: s.dataType,
        group: s.group,
        isPublic: s.isPublic,
        description: s.description,
      },
    });
    count++;
  }
  console.log(`Successfully seeded ${count} default store settings.`);
}

const DEFAULT_STORE_SETTINGS = [
  {
    key: 'store_name',
    value: 'A2Z E-Commerce Store',
    dataType: 'STRING',
    group: 'GENERAL',
    isPublic: true,
    description: 'Primary customer-facing store brand name',
  },
  {
    key: 'store_legal_name',
    value: 'A2Z Retail & Logistics Ltd.',
    dataType: 'STRING',
    group: 'GENERAL',
    isPublic: true,
    description: 'Registered corporate or legal trading business name',
  },
  {
    key: 'store_tagline',
    value: 'Your One-Stop Shop for Electronics, Fashion & Home',
    dataType: 'STRING',
    group: 'GENERAL',
    isPublic: true,
    description: 'Promotional tagline or store headline',
  },
  {
    key: 'contact_email',
    value: 'support@az-ecommerce.com',
    dataType: 'STRING',
    group: 'GENERAL',
    isPublic: true,
    description: 'General support email address',
  },
  {
    key: 'contact_phone',
    value: '+880 1700 000000',
    dataType: 'STRING',
    group: 'GENERAL',
    isPublic: true,
    description: 'Public contact telephone number',
  },
  {
    key: 'support_hotline',
    value: '16247',
    dataType: 'STRING',
    group: 'GENERAL',
    isPublic: true,
    description: 'Short helpline/hotline number',
  },
  {
    key: 'store_address',
    value: 'House 42, Road 11, Block D, Banani',
    dataType: 'STRING',
    group: 'GENERAL',
    isPublic: true,
    description: 'Physical warehouse or business headquarters address',
  },
  {
    key: 'store_city',
    value: 'Dhaka',
    dataType: 'STRING',
    group: 'GENERAL',
    isPublic: true,
    description: 'Headquarters municipality or city',
  },
  {
    key: 'store_postal_code',
    value: '1213',
    dataType: 'STRING',
    group: 'GENERAL',
    isPublic: true,
    description: 'ZIP or Postal code of store headquarters',
  },
  {
    key: 'store_country',
    value: 'Bangladesh',
    dataType: 'STRING',
    group: 'GENERAL',
    isPublic: true,
    description: 'Country of primary operations',
  },
  {
    key: 'store_logo_url',
    value: '/images/logo.png',
    dataType: 'STRING',
    group: 'GENERAL',
    isPublic: true,
    description: 'Relative path or CDN URL for store brand logo',
  },
  {
    key: 'store_favicon_url',
    value: '/favicon.ico',
    dataType: 'STRING',
    group: 'GENERAL',
    isPublic: true,
    description: 'Store favicon image URL',
  },
  {
    key: 'default_currency',
    value: 'BDT',
    dataType: 'STRING',
    group: 'LOCALIZATION',
    isPublic: true,
    description: 'Three-letter ISO currency code',
  },
  {
    key: 'currency_symbol',
    value: '৳',
    dataType: 'STRING',
    group: 'LOCALIZATION',
    isPublic: true,
    description: 'Currency glyph or symbol displayed alongside prices',
  },
  {
    key: 'currency_symbol_position',
    value: 'BEFORE',
    dataType: 'STRING',
    group: 'LOCALIZATION',
    isPublic: true,
    description: 'Position of currency symbol relative to amount (BEFORE / AFTER)',
  },
  {
    key: 'timezone',
    value: 'Asia/Dhaka',
    dataType: 'STRING',
    group: 'LOCALIZATION',
    isPublic: true,
    description: 'Primary server and reporting timezone',
  },
  {
    key: 'date_format',
    value: 'YYYY-MM-DD',
    dataType: 'STRING',
    group: 'LOCALIZATION',
    isPublic: true,
    description: 'Standard date display format across storefront and invoices',
  },
  {
    key: 'order_number_prefix',
    value: 'AZ-',
    dataType: 'STRING',
    group: 'ORDER',
    isPublic: true,
    description: 'Prefix prepended to generated sequential order numbers',
  },
  {
    key: 'min_order_subtotal',
    value: '100.00',
    dataType: 'NUMBER',
    group: 'ORDER',
    isPublic: true,
    description: 'Minimum required cart subtotal to proceed with checkout',
  },
  {
    key: 'max_order_subtotal',
    value: '500000.00',
    dataType: 'NUMBER',
    group: 'ORDER',
    isPublic: true,
    description: 'Maximum allowable subtotal per single order transaction',
  },
  {
    key: 'enable_cod',
    value: 'true',
    dataType: 'BOOLEAN',
    group: 'ORDER',
    isPublic: true,
    description: 'Global toggle enabling Cash on Delivery payment option',
  },
  {
    key: 'enable_guest_checkout',
    value: 'false',
    dataType: 'BOOLEAN',
    group: 'ORDER',
    isPublic: true,
    description: 'Whether customers can place orders without registering an account',
  },
  {
    key: 'auto_cancel_unpaid_hours',
    value: '72',
    dataType: 'NUMBER',
    group: 'ORDER',
    isPublic: false,
    description: 'Hours after which uncollected or unpaid pending orders expire',
  },
  {
    key: 'default_low_stock_threshold',
    value: '5',
    dataType: 'NUMBER',
    group: 'INVENTORY',
    isPublic: false,
    description: 'Default inventory threshold triggering low-stock warnings',
  },
  {
    key: 'track_inventory_ledger',
    value: 'true',
    dataType: 'BOOLEAN',
    group: 'INVENTORY',
    isPublic: false,
    description: 'Whether all quantity adjustments require StockMovement audit rows',
  },
  {
    key: 'allow_backorders',
    value: 'false',
    dataType: 'BOOLEAN',
    group: 'INVENTORY',
    isPublic: false,
    description: 'Allow customers to order items when available stock reaches zero',
  },
  {
    key: 'stock_reservation_minutes',
    value: '60',
    dataType: 'NUMBER',
    group: 'INVENTORY',
    isPublic: false,
    description: 'Duration pending checkout cart holds stock before timeout release',
  },
  {
    key: 'free_shipping_threshold',
    value: '5000.00',
    dataType: 'NUMBER',
    group: 'SHIPPING',
    isPublic: true,
    description: 'Order subtotal qualifying for free courier delivery (0 to disable)',
  },
  {
    key: 'estimated_processing_days',
    value: '2',
    dataType: 'NUMBER',
    group: 'SHIPPING',
    isPublic: true,
    description: 'Standard business days required to pick, pack, and dispatch parcel',
  },
  {
    key: 'return_window_days',
    value: '7',
    dataType: 'NUMBER',
    group: 'SHIPPING',
    isPublic: true,
    description: 'Calendar days after delivery within which customer can request returns',
  },
  {
    key: 'shipping_policy_notice',
    value: 'Standard delivery within 2-3 days inside Dhaka, 3-5 days outside Dhaka.',
    dataType: 'STRING',
    group: 'SHIPPING',
    isPublic: true,
    description: 'Public courier expectation announcement displayed at checkout',
  },
  {
    key: 'customer_order_placed_notify',
    value: 'true',
    dataType: 'BOOLEAN',
    group: 'NOTIFICATION',
    isPublic: false,
    description: 'Send automatic email/SMS confirmation upon order placement',
  },
  {
    key: 'admin_low_stock_notify',
    value: 'true',
    dataType: 'BOOLEAN',
    group: 'NOTIFICATION',
    isPublic: false,
    description: 'Send automated email to store managers when variant hits threshold',
  },
  {
    key: 'system_sender_email',
    value: 'noreply@az-ecommerce.com',
    dataType: 'STRING',
    group: 'NOTIFICATION',
    isPublic: false,
    description: 'System sender email address for transactional communications',
  },
  {
    key: 'system_sender_name',
    value: 'A2Z Store Dispatch',
    dataType: 'STRING',
    group: 'NOTIFICATION',
    isPublic: false,
    description: 'Friendly display sender name for automated customer notifications',
  },
  {
    key: 'maintenance_mode',
    value: 'false',
    dataType: 'BOOLEAN',
    group: 'SECURITY',
    isPublic: true,
    description: 'Puts customer storefront in maintenance mode while keeping admin accessible',
  },
  {
    key: 'allow_registration',
    value: 'true',
    dataType: 'BOOLEAN',
    group: 'SECURITY',
    isPublic: true,
    description: 'Enable or disable new customer self-service registration',
  },
  {
    key: 'store_meta_title',
    value: 'A2Z E-Commerce - Single Vendor Online Store',
    dataType: 'STRING',
    group: 'SECURITY',
    isPublic: true,
    description: 'Default SEO HTML meta title for storefront',
  },
  {
    key: 'store_meta_description',
    value: 'Premium physical products delivered swiftly across Bangladesh.',
    dataType: 'STRING',
    group: 'SECURITY',
    isPublic: true,
    description: 'Default SEO HTML meta description for storefront',
  },
];

const TAX_CLASSES_DATA = [
  {
    name: 'Standard Electronics VAT',
    code: 'VAT-ELEC-5',
    rate: 5.00,
    isDefault: true,
    isActive: true,
    description: 'Standard 5% VAT rate for consumer electronics, laptops, and IT hardware.',
  },
  {
    name: 'General VAT',
    code: 'VAT-GEN-15',
    rate: 15.00,
    isDefault: false,
    isActive: true,
    description: 'General 15% statutory VAT rate for lifestyle goods and accessories.',
  },
  {
    name: 'Zero-Rated / Exempt',
    code: 'VAT-ZERO-0',
    rate: 0.00,
    isDefault: false,
    isActive: true,
    description: '0% tax rate for exempt educational materials or zero-rated goods.',
  },
];

async function seedTaxClasses() {
  console.log('Seeding baseline Tax Classes...');
  for (const tc of TAX_CLASSES_DATA) {
    await prisma.taxClass.upsert({
      where: { code: tc.code },
      update: {
        name: tc.name,
        rate: tc.rate,
        isDefault: tc.isDefault,
        isActive: tc.isActive,
        description: tc.description,
      },
      create: tc,
    });
  }
  console.log('Tax classes seeded successfully.');
}

const COUPONS_DATA = [
  {
    code: 'AZDEAL',
    description: 'Flat ৳500 discount on orders over ৳1,000',
    discountType: DiscountType.FIXED_AMOUNT,
    discountValue: 500.0,
    minOrderAmount: 1000.0,
    maxDiscountAmount: null,
    totalUsageLimit: 1000,
    perCustomerLimit: 1,
    startDate: new Date('2026-01-01T00:00:00Z'),
    endDate: new Date('2027-12-31T23:59:59Z'),
    isActive: true,
  },
  {
    code: 'TECH10',
    description: '10% discount on tech & lifestyle orders up to ৳2,000 off',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10.0,
    minOrderAmount: 500.0,
    maxDiscountAmount: 2000.0,
    totalUsageLimit: 500,
    perCustomerLimit: 2,
    startDate: new Date('2026-01-01T00:00:00Z'),
    endDate: new Date('2027-12-31T23:59:59Z'),
    isActive: true,
  },
];

async function seedCoupons() {
  console.log('Seeding baseline Promotional Coupons...');
  for (const c of COUPONS_DATA) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderAmount: c.minOrderAmount,
        maxDiscountAmount: c.maxDiscountAmount,
        totalUsageLimit: c.totalUsageLimit,
        perCustomerLimit: c.perCustomerLimit,
        startDate: c.startDate,
        endDate: c.endDate,
        isActive: c.isActive,
      },
      create: c,
    });
  }
  console.log('Coupons seeded successfully.');
}

async function seedShippingZonesAndMethods() {
  console.log('Seeding baseline Shipping Zones and Methods...');
  const dhakaZone = await prisma.shippingZone.findFirst({
    where: { name: 'Dhaka Metro' },
  });
  const outsideZone = await prisma.shippingZone.findFirst({
    where: { name: 'Outside Dhaka' },
  });

  const dhaka =
    dhakaZone ||
    (await prisma.shippingZone.create({
      data: {
        name: 'Dhaka Metro',
        description: 'Deliveries within Dhaka City Corporation',
        isActive: true,
        sortOrder: 1,
      },
    }));

  const outside =
    outsideZone ||
    (await prisma.shippingZone.create({
      data: {
        name: 'Outside Dhaka',
        description: 'Nationwide delivery across all divisions outside Dhaka',
        isActive: true,
        sortOrder: 2,
      },
    }));

  const methods = [
    {
      zoneId: dhaka.id,
      name: 'Standard Delivery (Inside Dhaka)',
      cost: 60.0,
      estimatedDays: 2,
      isActive: true,
      sortOrder: 1,
    },
    {
      zoneId: dhaka.id,
      name: 'Express Priority Courier',
      cost: 150.0,
      estimatedDays: 1,
      isActive: true,
      sortOrder: 2,
    },
    {
      zoneId: outside.id,
      name: 'Standard Courier (Outside Dhaka)',
      cost: 120.0,
      estimatedDays: 4,
      isActive: true,
      sortOrder: 1,
    },
    {
      zoneId: outside.id,
      name: 'Express Air / Priority Courier',
      cost: 210.0,
      estimatedDays: 2,
      isActive: true,
      sortOrder: 2,
    },
  ];

  for (const m of methods) {
    const existing = await prisma.shippingMethod.findFirst({
      where: { zoneId: m.zoneId, name: m.name },
    });
    if (!existing) {
      await prisma.shippingMethod.create({ data: m });
    }
  }
  console.log('Shipping Zones and Methods seeded successfully.');
}

async function seedPaymentMethods() {
  const methods = [
    {
      code: 'CASH_ON_DELIVERY',
      name: 'Cash on Delivery',
      description: 'Pay with cash upon delivery of your items.',
      instructions: 'Please have the exact cash ready when the delivery rider arrives at your doorstep.',
      isEnabled: true,
      sortOrder: 1,
    },
    {
      code: 'CHECK_PAYMENT',
      name: 'Check / Cheque Payment',
      description: 'Pay via bank check, banker cheque, or money order.',
      instructions: 'Please send your check payable to "A to Z E-Commerce Ltd.", Mail to: House 12, Road 5, Dhanmondi, Dhaka 1205. Your order will be dispatched once the check clears.',
      isEnabled: false,
      sortOrder: 2,
    },
    {
      code: 'BANK_TRANSFER',
      name: 'Direct Bank Transfer',
      description: 'Make a direct wire or transfer to our corporate bank account.',
      instructions: 'Bank: City Bank Ltd. Account Name: A to Z E-Commerce Ltd. Account Number: 1102938475001. Branch: Gulshan 1, Dhaka. Please use your Order Number as payment reference.',
      isEnabled: false,
      sortOrder: 3,
    },
    {
      code: 'MOBILE_BANKING',
      name: 'Mobile Banking (bKash / Nagad)',
      description: 'Pay instantly using bKash, Nagad, or Rocket mobile wallet.',
      instructions: 'Please send payment to Merchant bKash/Nagad Number: 01700000000 (Counter: 1). Enter your Order Number in the reference field.',
      isEnabled: false,
      sortOrder: 4,
    },
  ];

  for (const m of methods) {
    await prisma.paymentMethodSetting.upsert({
      where: { code: m.code },
      update: {},
      create: m,
    });
  }
  console.log('Payment Methods seeded successfully.');
}

async function seed() {
  await seedDemoUsers();
  await seedTaxClasses();
  await seedCoupons();
  await seedShippingZonesAndMethods();
  await seedPaymentMethods();
  await seedCategories();
  await seedBrands();
  await seedAttributes();
  await seedProductsAndInventory();
  await seedStoreSettings();
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


