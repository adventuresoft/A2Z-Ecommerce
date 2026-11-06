import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  Role,
  FreelancerStatus,
  FreelancerAvailability,
  ServicePriceType,
  MembershipPaymentStatus,
  SubscriptionStatus,
  ConversationStatus,
  MessageFlag,
  FreelancerReviewStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch {
  // Ignored if file does not exist
}

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:62348787@localhost:5432/az_ecommerce?schema=public';

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedFreelancers() {
  console.log('Seeding Freelancer Module demonstration data...');

  const passwordHash = await argon2.hash('FreelancerPass123!', {
    type: argon2.argon2id,
  });
  const clientPasswordHash = await argon2.hash('CustomerPass123!', {
    type: argon2.argon2id,
  });

  // 1. Fetch available taxonomy from DB
  const professions = await prisma.profession.findMany({
    include: { skills: true },
  });

  if (professions.length === 0) {
    throw new Error('No professions found. Please run seed-taxonomy.ts first.');
  }

  const profMap = new Map(professions.map((p) => [p.name.toLowerCase(), p]));

  // Helper to find profession
  const getProf = (nameSub: string) => {
    for (const [key, val] of profMap.entries()) {
      if (key.includes(nameSub.toLowerCase())) return val;
    }
    return professions[0];
  };

  // 2. Fetch valid locations from DB (Dhaka, Division 4, District 14)
  const dhakaDistrict = await prisma.district.findFirst({
    where: { name: { contains: 'Dhaka', mode: 'insensitive' } },
    include: {
      division: true,
      cityCorporations: { include: { wards: true } },
      thanas: { include: { postOffices: true, unions: true } },
      paurashavas: true,
    },
  });

  if (!dhakaDistrict) {
    throw new Error('Dhaka district not found. Please run seed-locations.ts first.');
  }

  const divisionId = dhakaDistrict.division.id;
  const districtId = dhakaDistrict.id;
  const dhakaNorthCorp = dhakaDistrict.cityCorporations.find((c) =>
    c.name.toLowerCase().includes('north')
  ) || dhakaDistrict.cityCorporations[0];
  const wards = dhakaNorthCorp?.wards || [];

  // Find thanas with post offices
  const thanasWithPost = dhakaDistrict.thanas.filter((t) => t.postOffices.length > 0);
  const bananiThana = thanasWithPost.find((t) => t.name.toLowerCase().includes('banani')) || thanasWithPost[0];
  const dhanmondiThana = thanasWithPost.find((t) => t.name.toLowerCase().includes('dhanmondi')) || thanasWithPost[1] || thanasWithPost[0];
  const cantonmentThana = thanasWithPost.find((t) => t.name.toLowerCase().includes('cantonment')) || thanasWithPost[2] || thanasWithPost[0];
  const demraThana = thanasWithPost.find((t) => t.name.toLowerCase().includes('demra')) || thanasWithPost[3] || thanasWithPost[0];

  const thanaPool = [bananiThana, dhanmondiThana, cantonmentThana, demraThana];

  // 3. Define 19 Freelancers
  const freelancerSeeds = [
    {
      phone: '+8801700000001',
      name: 'Md. Rafiqul Islam',
      email: 'rafiqul.electric@example.com',
      title: 'সার্টিফাইড এক্সপার্ট ইলেকট্রিশিয়ান ও ওয়্যারিং স্পেশালিস্ট',
      about:
        '৮ বছরের অভিজ্ঞতাসম্পন্ন ইলেকট্রিশিয়ান। বাসা-বাড়ি, অফিস ও কল-কারখানার যে কোনো ওয়্যারিং, সার্কিট ব্রেকার সমস্যা এবং বৈদ্যুতিক শর্ট সার্কিট ত্রুটি দ্রুত সমাধান করে থাকি। শতভাগ নিরাপত্তার সাথে বিশ্বস্ত সেবা প্রদান আমার অঙ্গীকার।',
      experienceYears: 8,
      status: FreelancerStatus.APPROVED,
      availability: FreelancerAvailability.AVAILABLE,
      featuredUntil: new Date(Date.now() + 15 * 86400 * 1000), // Featured next 15 days
      approvedAt: new Date(Date.now() - 30 * 86400 * 1000),
      photoUrl:
        'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80',
      profKey: 'electrician',
      address: 'House 14, Road 7, Block D, Mirpur-12, Dhaka',
      thanaIndex: 0,
      wardIndex: 1,
      startingPrice: 350,
      services: [
        {
          title: 'ফুল হাউস ওয়্যারিং ও সার্কিট চেকআপ',
          description: 'নতুন ও পুরাতন ভবনের সম্পূর্ণ ওয়্যারিং, ডিবি বোর্ড স্থাপন ও আর্দিং টেস্ট।',
          priceType: ServicePriceType.FIXED,
          amount: 2500,
        },
        {
          title: 'জরুরি শর্ট সার্কিট ও ফল্ট ট্রাবলশুটিং',
          description: 'তাত্ক্ষণিক বিদ্যুৎ চলে যাওয়া ও শর্ট সার্কিট সমাধান।',
          priceType: ServicePriceType.HOURLY,
          amount: 350,
        },
        {
          title: 'সিলিং ফ্যান, লাইট ও সুইচ বোর্ড ইনস্টলেশন',
          description: 'নতুন ফ্যান ফিটিং এবং সুইচবোর্ড পরিবর্তন।',
          priceType: ServicePriceType.FIXED,
          amount: 400,
        },
      ],
      portfolio: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
          caption: 'উত্তরা সেক্টর ৭ এ রেসিডেন্সিয়াল ডিবি বোর্ড ওয়্যারিং',
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
          caption: 'কমার্শিয়াল অফিসের প্যানেল বোর্ড ও জেনারেটর সংযোগ',
        },
      ],
    },
    {
      phone: '+8801700000002',
      name: 'Abdur Rahim',
      email: 'abdur.plumber@example.com',
      title: 'সিনিয়র প্লাম্বার ও পাইপ ফিটিং টেকনিশিয়ান',
      about:
        '১০ বছরের অধিক সময় ধরে স্যানিটারি পাইপ ফিটিং, পানির পাম্প স্থাপন, বাথরুম ফিটিংস এবং লিকেজ সমাধানে কাজ করছি। আধুনিক সরঞ্জাম ব্যবহারের মাধ্যমে টেকসই ও নিখুঁত কাজ উপহার দেই।',
      experienceYears: 10,
      status: FreelancerStatus.APPROVED,
      availability: FreelancerAvailability.AVAILABLE,
      featuredUntil: new Date(Date.now() + 10 * 86400 * 1000), // Featured 10 days
      approvedAt: new Date(Date.now() - 45 * 86400 * 1000),
      photoUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      profKey: 'plumber',
      address: 'Plot 22, Road 4, Banani DOHS, Dhaka',
      thanaIndex: 0,
      wardIndex: 2,
      startingPrice: 400,
      services: [
        {
          title: 'বাথরুম স্যানিটারি ওয়্যার ও ফলস ফিটিংস',
          description: 'কমোড, বেসিন, মিক্সার ও শাওয়ার সেটআপ।',
          priceType: ServicePriceType.FIXED,
          amount: 1200,
        },
        {
          title: 'পানির পাম্প মেরামত ও অটোমেটিক কন্ট্রোলার স্থাপন',
          description: 'মোটর পাম্প চেকআপ ও পানির লেভেল সেন্সর ইনস্টল।',
          priceType: ServicePriceType.FIXED,
          amount: 800,
        },
        {
          title: 'হিডেন পাইপ লিকেজ ডিটেকশন ও মেরামত',
          description: 'দেয়ালের ভেতরের পাইপ লিকেজ সনাক্তকরণ ও স্থায়ী মেরামত।',
          priceType: ServicePriceType.FIXED,
          amount: 1500,
        },
      ],
      portfolio: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
          caption: 'মডার্ন বাথরুম ক্যাবিনেট ও ফিটিংস ইনস্টলেশন',
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
          caption: 'রুফটপ ওয়াটার ট্যাংক পাইপলাইন রেনোভেশন',
        },
      ],
    },
    {
      phone: '+8801700000003',
      name: 'Kamrul Hasan',
      email: 'kamrul.ac@example.com',
      title: 'ইনভার্টার এসি সার্ভিসিং ও গ্যাস চার্জিং বিশেষজ্ঞ',
      about:
        'সকল ব্র্যান্ডের ইনভার্টার ও নন-ইনভার্টার এসি ইন্সটলেশন, মাস্টার ওয়াশ সার্ভিসিং, গ্যাস লিকেজ চেক এবং পিসিবি বোর্ড মেরামতে বিশেষ পারদর্শী। দ্রুত ও দক্ষ টেকনিক্যাল সার্ভিস।',
      experienceYears: 6,
      status: FreelancerStatus.APPROVED,
      availability: FreelancerAvailability.AVAILABLE,
      featuredUntil: null,
      approvedAt: new Date(Date.now() - 20 * 86400 * 1000),
      photoUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      profKey: 'ac technician',
      address: 'House 8, Road 27, Dhanmondi, Dhaka',
      thanaIndex: 1,
      wardIndex: 3,
      startingPrice: 600,
      services: [
        {
          title: 'এসি জেট ওয়াশ মাস্টার সার্ভিসিং',
          description: 'হাই-প্রেশার ওয়াটার জেট দিয়ে ইনডোর ও আউটডোর গভীর পরিষ্কার।',
          priceType: ServicePriceType.FIXED,
          amount: 800,
        },
        {
          title: 'এসি ইনস্টলেশন ও আন-ইনস্টলেশন',
          description: 'নিরাপদ কপার পাইপ সংযোগ ও ভ্যাকুয়াম টেস্টিং সহ এসি স্থাপন।',
          priceType: ServicePriceType.FIXED,
          amount: 1800,
        },
        {
          title: 'R32 / R410A রেফ্রিজারেন্ট গ্যাস রিফিল',
          description: 'প্রেশার টেস্ট সহ ১০০% আসল গ্যাস চার্জিং।',
          priceType: ServicePriceType.FIXED,
          amount: 2200,
        },
      ],
      portfolio: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&auto=format&fit=crop&q=80',
          caption: '২ টন ইনভার্টার স্প্লিট এসি জেট ওয়াশ',
        },
      ],
    },
    {
      phone: '+8801700000004',
      name: 'Tanvir Ahmed',
      email: 'tanvir.moto@example.com',
      title: 'এফআই ও কার্বুরেটর মোটরবাইক মেকানিক',
      about:
        'ইয়ামাহা, হোন্ডা, বাজাজ ও সুজুকি সহ যে কোনো মোটরবাইকের ইঞ্জিন ওভারহোলিং, এফআই টিউনিং, ওয়্যারিং সমস্যা এবং ব্রেক সার্ভিসিংয়ে বিশেষ প্রশিক্ষণপ্রাপ্ত মেকানিক। বাসা বা অফিসে গিয়েও সার্ভিস দেই।',
      experienceYears: 5,
      status: FreelancerStatus.APPROVED,
      availability: FreelancerAvailability.AVAILABLE,
      featuredUntil: null,
      approvedAt: new Date(Date.now() - 15 * 86400 * 1000),
      photoUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
      profKey: 'motorcycle mechanic',
      address: 'Shahid Nagar, Demra, Dhaka',
      thanaIndex: 3,
      wardIndex: 4,
      startingPrice: 500,
      services: [
        {
          title: 'ফুল মোটরবাইক জেনারেল মাস্টার সার্ভিসিং',
          description: 'কার্বুরেটর/থ্রটল বডি ক্লিন, টেপেট এডজাস্ট, ব্রেক প্যাড চেক ও চেইন লুব।',
          priceType: ServicePriceType.FIXED,
          amount: 600,
        },
        {
          title: 'ইঞ্জিন ওভারহোলিং ও ক্লাচ প্লেট পরিবর্তন',
          description: 'স্মুথ পাওয়ার ও পিকআপ ফিরিয়ে আনার সম্পূর্ণ ইঞ্জিন কাজ।',
          priceType: ServicePriceType.FIXED,
          amount: 2500,
        },
      ],
      portfolio: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
          caption: 'ইয়ামাহা আর১৫ ভি৩ এফআই ডায়াগনোসিস ও সার্ভিসিং',
        },
      ],
    },
    {
      phone: '+8801700000005',
      name: 'Sumon Mia',
      email: 'sumon.wood@example.com',
      title: 'কাস্টম ফার্নিচার ও কাঠ পলিশিং কারিগর',
      about:
        '১২ বছরের অভিজ্ঞ অভিজ্ঞ কাঠমিস্ত্রি। সেগুন, মেহগনি ও গামারি কাঠের সোফা, খাট, ওয়ারড্রোব তৈরি ও বার্নিশ পলিশের নিপুণ কারিগর। মডার্ন ফার্নিচার ফিটিংস ও মেরামতেও পারদর্শী।',
      experienceYears: 12,
      status: FreelancerStatus.APPROVED,
      availability: FreelancerAvailability.BUSY, // BUSY status test
      featuredUntil: null,
      approvedAt: new Date(Date.now() - 60 * 86400 * 1000),
      photoUrl:
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
      profKey: 'carpenter',
      address: 'South Dhanmondi, Dhaka',
      thanaIndex: 1,
      wardIndex: 5,
      startingPrice: 600,
      services: [
        {
          title: 'ফার্নিচার ফিটিংস ও লক মেরামত',
          description: 'দরজার লক, কব্জা, ড্রয়ার চ্যানেল মেরামত ও নতুন ফিটিং।',
          priceType: ServicePriceType.HOURLY,
          amount: 300,
        },
        {
          title: 'হ্যান্ড পলিশ ও স্প্রে বার্নিশ',
          description: 'পুরাতন কাঠের ফার্নিচারে নতুন ঝকঝকে লুক ফিরিয়ে আনা।',
          priceType: ServicePriceType.DAILY,
          amount: 1500,
        },
      ],
      portfolio: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&auto=format&fit=crop&q=80',
          caption: 'হ্যান্ডমেড সলিড টিক উড ডাইনিং টেবিল পলিশিং',
        },
      ],
    },
    {
      phone: '+8801700000006',
      name: 'Al-Amin Hossain',
      email: 'alamin.paint@example.com',
      title: 'হোম ডেকোর ও ইন্টেরিয়র ওয়াল পেইন্টার',
      about:
        'বার্জার, এশিয়ান ও রবিন পেইন্টসের দক্ষ পেইন্টার। দেয়ালের পুটিং, প্রাইমার, প্লাস্টিক ইমালশন ও ওয়েদারকোট পেইন্টিং নিখুঁতভাবে শেষ করি। আধুনিক কালার কম্বিনেশন পরামর্শ প্রদান করি।',
      experienceYears: 7,
      status: FreelancerStatus.APPROVED,
      availability: FreelancerAvailability.AVAILABLE,
      featuredUntil: null,
      approvedAt: new Date(Date.now() - 25 * 86400 * 1000),
      photoUrl:
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
      profKey: 'painter',
      address: 'Dhaka Cantonment, Matikata, Dhaka',
      thanaIndex: 2,
      wardIndex: 6,
      startingPrice: 1400,
      services: [
        {
          title: 'দৈনিক পেইন্টিং সার্ভিস (মাস্টার কারিগর)',
          description: 'প্রতি দিনের ভিত্তিতে ইন্টেরিয়র ও এক্সটেরিয়র কালার কাজ।',
          priceType: ServicePriceType.DAILY,
          amount: 1400,
        },
        {
          title: 'স্কয়ার ফুট চুক্তিতে ওয়াল পুটিং ও পেইন্ট',
          description: 'মসৃণ সারফেস প্রিপারেশন সহ ২ কোট প্রিমিয়াম পেইন্ট।',
          priceType: ServicePriceType.NEGOTIABLE,
          amount: null,
        },
      ],
      portfolio: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
          caption: 'লিভিং রুম এক্সেন্ট ওয়াল রয়্যাল প্লে ডিজাইন',
        },
      ],
    },
    {
      phone: '+8801700000007',
      name: 'Jahangir Alam',
      email: 'jahangir.mason@example.com',
      title: 'দক্ষ রাজমিস্ত্রি ও আধুনিক টাইলস ফিটিং স্পেশালিস্ট',
      about:
        '১৪ বছরের মাঠ পর্যায়ের কাজের অভিজ্ঞতা। গ্রানাইট, মার্বেল ও টাইলস লেজার ব্যালান্স সহকারে বসানো, বাথরুম ওয়াটারপ্রুফিং ও ইট গাঁথুনির নির্ভরযোগ্য রাজমিস্ত্রি।',
      experienceYears: 14,
      status: FreelancerStatus.APPROVED,
      availability: FreelancerAvailability.BUSY,
      featuredUntil: null,
      approvedAt: new Date(Date.now() - 90 * 86400 * 1000),
      photoUrl:
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
      profKey: 'mason',
      address: 'Chairman Bari, Banani, Dhaka',
      thanaIndex: 0,
      wardIndex: 7,
      startingPrice: 1800,
      services: [
        {
          title: 'ফ্লোর ও ওয়াল টাইলস ফিটিং সার্ভিস (দৈনিক)',
          description: 'লেভেলিং ও ফিনিশিং সহ টাইলস স্থাপনের কাজ।',
          priceType: ServicePriceType.DAILY,
          amount: 1800,
        },
      ],
      portfolio: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
          caption: 'ডুপ্লেক্স ভিলায় হাই-গ্লস ফ্লোর টাইলস ফিটিংস',
        },
      ],
    },
    {
      phone: '+8801700000008',
      name: 'Shafiqul Islam',
      email: 'shafiqul.fridge@example.com',
      title: 'ডিপ ফ্রিজ ও রেফ্রিজারেটর রিপেয়ার টেকনিশিয়ান',
      about:
        'ওয়ালটন, স্যামসাং, এলজি এবং সিঙ্গার রেফ্রিজারেটরের কুলিং না হওয়া, গ্যাস লিক হওয়া, থার্মোস্ট্যাট সমস্যা এবং কম্প্রেসার পরিবর্তনের অভিজ্ঞ কারিগর। জেনুইন পার্টস গ্যারান্টি।',
      experienceYears: 9,
      status: FreelancerStatus.APPROVED,
      availability: FreelancerAvailability.AVAILABLE,
      featuredUntil: null,
      approvedAt: new Date(Date.now() - 40 * 86400 * 1000),
      photoUrl:
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
      profKey: 'refrigerator',
      address: 'Road 15, Dhanmondi, Dhaka',
      thanaIndex: 1,
      wardIndex: 8,
      startingPrice: 600,
      services: [
        {
          title: 'রেফ্রিজারেটর ফল্ট ডায়াগনোসিস ও সার্ভিস',
          description: 'কুলিং ফল্ট, গ্যাস লিক ও ইলেকট্রিকাল রিলে মেরামত।',
          priceType: ServicePriceType.FIXED,
          amount: 600,
        },
        {
          title: 'কম্প্রেসার প্রতিস্থাপন ও গ্যাস চার্জিং',
          description: 'নতুন কম্প্রেসার সেটিং এবং ১২ মাসের ওয়ারেন্টি সহায়তা।',
          priceType: ServicePriceType.FIXED,
          amount: 2800,
        },
      ],
      portfolio: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80',
          caption: 'ইনভার্টার সাইড বাই সাইড ফ্রিজের গ্যাস লিক টেস্টিং',
        },
      ],
    },
    {
      phone: '+8801700000009',
      name: 'Nazmul Huda',
      email: 'nazmul.wash@example.com',
      title: 'অটোমেটিক ওয়াশিং মেশিন সার্ভিসিং ও পিসিবি এক্সপার্ট',
      about:
        'টপ লোড ও ফ্রন্ট লোড ওয়াশিং মেশিনের ড্রাম ভাইব্রেশন, ড্রেন পাম্প সমস্যা, মোটর ও মাদারবোর্ড (পিসিবি) সার্ভিসিংয়ে বিশেষজ্ঞ। নির্ভরযোগ্য হোম সার্ভিস দিয়ে থাকি।',
      experienceYears: 4,
      status: FreelancerStatus.APPROVED,
      availability: FreelancerAvailability.UNAVAILABLE, // UNAVAILABLE status test
      featuredUntil: null,
      approvedAt: new Date(Date.now() - 10 * 86400 * 1000),
      photoUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      profKey: 'washing machine',
      address: 'Staff Quarter, Demra, Dhaka',
      thanaIndex: 3,
      wardIndex: 9,
      startingPrice: 700,
      services: [
        {
          title: 'ওয়াশিং মেশিন ড্রেন ও মোটর রিপেয়ার',
          description: 'ড্রেন মোটর জ্যাম বা ই-এরর কোড সমাধান।',
          priceType: ServicePriceType.FIXED,
          amount: 700,
        },
      ],
      portfolio: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80',
          caption: 'ফ্রন্ট লোড ওয়াশিং মেশিনের বিয়ারিং ও ড্রাম রিপেয়ার',
        },
      ],
    },
    {
      phone: '+8801700000010',
      name: 'Belal Hossain',
      email: 'belal.electric@example.com',
      title: 'হাউজ ওয়্যারিং ও জেনারেটর সংযোগ মিস্ত্রি',
      about:
        '৩ বছরের অভিজ্ঞ তরুণ ইলেকট্রিশিয়ান। বাসা-বাড়ির ওয়্যারিং, সুইচ সকেট বদল ও ডেকোরেটিভ লাইটিং দ্রুততম সময়ে কম খরচে করে দেই।',
      experienceYears: 3,
      status: FreelancerStatus.APPROVED,
      availability: FreelancerAvailability.AVAILABLE,
      featuredUntil: null,
      approvedAt: new Date(Date.now() - 5 * 86400 * 1000),
      photoUrl:
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      profKey: 'electrician',
      address: 'ECB Chattar, Cantonment, Dhaka',
      thanaIndex: 2,
      wardIndex: 10,
      startingPrice: 300,
      services: [
        {
          title: 'সুইচ, সকেট ও হোল্ডার রিপ্লেসমেন্ট',
          description: 'ছোটখাটো বৈদ্যুতিক রিপেয়ারিং সার্ভিস।',
          priceType: ServicePriceType.FIXED,
          amount: 300,
        },
      ],
      portfolio: [],
    },
    {
      phone: '+8801700000011',
      name: 'Mizanur Rahman',
      email: 'mizan.plumb@example.com',
      title: 'স্যানিটারি ফিটিংস ও পানির ট্যাংক পরিষ্কারক',
      about:
        '৫ বছরের অভিজ্ঞ প্লাম্বার। ওভারহেড ও আন্ডারগ্রাউন্ড পানির ট্যাংক বৈজ্ঞানিক পদ্ধতিতে ব্লিচিং দিয়ে সম্পূর্ণ পরিষ্কার এবং ড্রেন লাইন আনক্লগিং করে থাকি।',
      experienceYears: 5,
      status: FreelancerStatus.APPROVED,
      availability: FreelancerAvailability.AVAILABLE,
      featuredUntil: null,
      approvedAt: new Date(Date.now() - 12 * 86400 * 1000),
      photoUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      profKey: 'plumber',
      address: 'Road 11, Block C, Banani, Dhaka',
      thanaIndex: 0,
      wardIndex: 11,
      startingPrice: 500,
      services: [
        {
          title: 'ওয়াটার ট্যাংক ডিপ ক্লিনিং (১০০০ লিটার)',
          description: 'জীবাণুনাশক ও প্রেশার ওয়াশ দিয়ে ট্যাংক ওয়াশ।',
          priceType: ServicePriceType.FIXED,
          amount: 1200,
        },
      ],
      portfolio: [],
    },
    {
      phone: '+8801700000012',
      name: 'Monirul Islam',
      email: 'monirul.ac@example.com',
      title: 'স্প্লিট ও ক্যাসেট এসি ইনস্টলেশন বিশেষজ্ঞ',
      about:
        '৭ বছরের অভিজ্ঞ টেকনিশিয়ান। অফিস ও বাসাবাড়িতে নিখুঁত ড্রিলিং ও পাইপিং সহ এসি প্রতিস্থাপন এবং গ্যাস লিকেজ টেস্ট করে থাকি।',
      experienceYears: 7,
      status: FreelancerStatus.APPROVED,
      availability: FreelancerAvailability.BUSY,
      featuredUntil: null,
      approvedAt: new Date(Date.now() - 18 * 86400 * 1000),
      photoUrl:
        'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&auto=format&fit=crop&q=80',
      profKey: 'ac technician',
      address: 'Zigatal, Dhanmondi, Dhaka',
      thanaIndex: 1,
      wardIndex: 12,
      startingPrice: 900,
      services: [
        {
          title: 'ইনডোর ও আউটডোর কপার পাইপিং সহ ইনস্টলেশন',
          description: 'সুরক্ষিত এসি হ্যাঙ্গিং ও পাইপ ইনসুলেশন।',
          priceType: ServicePriceType.FIXED,
          amount: 1900,
        },
      ],
      portfolio: [],
    },
    {
      phone: '+8801700000013',
      name: 'Faisal Mahmud',
      email: 'faisal.moto@example.com',
      title: 'স্পোর্টস বাইক ও স্কুটার সার্ভিস মাস্টার',
      about:
        '৮ বছরের অভিজ্ঞ বাইক মেকানিক। স্পোর্টস বাইকের ইএফআই সেন্সর টিউনিং, ডিস্ক ব্রেক অয়েল চেঞ্জ ও সাইলেন্সার কার্বন রিমুভে পারদর্শী।',
      experienceYears: 8,
      status: FreelancerStatus.APPROVED,
      availability: FreelancerAvailability.AVAILABLE,
      featuredUntil: null,
      approvedAt: new Date(Date.now() - 8 * 86400 * 1000),
      photoUrl:
        'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&auto=format&fit=crop&q=80',
      profKey: 'motorcycle mechanic',
      address: 'Vasantek, Cantonment, Dhaka',
      thanaIndex: 2,
      wardIndex: 13,
      startingPrice: 500,
      services: [
        {
          title: 'ফুল থ্রটল বডি আল্ট্রাসোনিক ক্লিনিং',
          description: 'পিকআপ ড্রপ সমস্যা দূরীকরণ ও মাইলেজ বৃদ্ধি।',
          priceType: ServicePriceType.FIXED,
          amount: 800,
        },
      ],
      portfolio: [],
    },
    {
      phone: '+8801700000014',
      name: 'Sohel Rana',
      email: 'sohel.wood@example.com',
      title: 'মডার্ন কিচেন ক্যাবিনেট ও কাঠের কাজ',
      about:
        '৬ বছরের অভিজ্ঞতা সহ মডার্ন মেলামাইন বোর্ড ও সলিড উড কিচেন ক্যাবিনেট তৈরি করি। উন্নত মানের হাইড্রোলিক কব্জা ফিটিংস করি।',
      experienceYears: 6,
      status: FreelancerStatus.APPROVED,
      availability: FreelancerAvailability.AVAILABLE,
      featuredUntil: null,
      approvedAt: new Date(Date.now() - 14 * 86400 * 1000),
      photoUrl:
        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80',
      profKey: 'carpenter',
      address: 'Kamarpara, Demra, Dhaka',
      thanaIndex: 3,
      wardIndex: 14,
      startingPrice: 700,
      services: [
        {
          title: 'কিচেন ক্যাবিনেট ফিটিংস ও সংস্কার',
          description: 'দরজার কব্জা, ড্রয়ার চ্যানেল মেরামত ও নতুন ফিটিং।',
          priceType: ServicePriceType.HOURLY,
          amount: 400,
        },
      ],
      portfolio: [],
    },
    // --- PENDING FREELANCERS (For Admin Queue Testing) ---
    {
      phone: '+8801700000015',
      name: 'Mehedi Hasan',
      email: 'mehedi.new@example.com',
      title: 'নতুন ইলেকট্রিশিয়ান - হাউজ ওয়্যারিং ও লাইট ফিটিং',
      about:
        'পলিটেকনিক থেকে ইলেকট্রিকাল ইঞ্জিনিয়ারিং ডিপ্লোমা সম্পন্ন করেছি। বাসা-বাড়ির নতুন ওয়্যারিং ও সুইচ সকেট ফিটিংসের কাজ বিশ্বস্ততার সাথে করতে চাই।',
      experienceYears: 2,
      status: FreelancerStatus.PENDING, // Pending approval
      availability: FreelancerAvailability.AVAILABLE,
      featuredUntil: null,
      approvedAt: null,
      photoUrl:
        'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400&auto=format&fit=crop&q=80',
      profKey: 'electrician',
      address: 'Road 5, Banani, Dhaka',
      thanaIndex: 0,
      wardIndex: 15,
      startingPrice: 300,
      services: [
        {
          title: 'হাউজ ওয়্যারিং হেল্পার ও ইন্সপেকশন',
          description: 'নতুন লাইনের ফল্ট ডিটেকশন ও ফিটিংস।',
          priceType: ServicePriceType.FIXED,
          amount: 500,
        },
      ],
      portfolio: [],
    },
    {
      phone: '+8801700000016',
      name: 'Tariqul Islam',
      email: 'tariqul.pending@example.com',
      title: 'এসি মেরামত ও গ্যাস লিকেজ সমাধান',
      about:
        '৪ বছরের অভিজ্ঞতা। সকল ধরণের নন-ইনভার্টার এসি গ্যাস চার্জ ও সাধারণ সার্ভিসিং অত্যন্ত যত্ন সহকারে করে থাকি।',
      experienceYears: 4,
      status: FreelancerStatus.PENDING, // Pending approval
      availability: FreelancerAvailability.AVAILABLE,
      featuredUntil: null,
      approvedAt: null,
      photoUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      profKey: 'ac technician',
      address: 'Road 12, Dhanmondi, Dhaka',
      thanaIndex: 1,
      wardIndex: 16,
      startingPrice: 650,
      services: [
        {
          title: 'এসি কুলিং ট্রাবলশুটিং',
          description: 'ঠান্ডা না হওয়ার কারণ সনাক্ত ও মেরামত।',
          priceType: ServicePriceType.FIXED,
          amount: 700,
        },
      ],
      portfolio: [],
    },
    // --- REJECTED FREELANCER (For Admin Rejection / Resubmit Testing) ---
    {
      phone: '+8801700000017',
      name: 'Anwar Hossain',
      email: 'anwar.rejected@example.com',
      title: 'অভিজ্ঞ রংমিস্ত্রি',
      about: 'দেয়ালের রং ও প্লাস্টার কাজের মিস্ত্রি।',
      experienceYears: 5,
      status: FreelancerStatus.REJECTED,
      rejectionReason:
        'জাতীয় পরিচয়পত্র ও প্রোফাইল ছবি অস্পষ্ট। অনুগ্রহ করে পরিষ্কার ছবি দিয়ে এবং সম্পূর্ণ অভিজ্ঞতার বিবরণ সহ পুনরায় সাবমিট করুন।',
      rejectionCount: 1,
      availability: FreelancerAvailability.AVAILABLE,
      featuredUntil: null,
      approvedAt: null,
      photoUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80',
      profKey: 'painter',
      address: 'Bhasantek, Cantonment, Dhaka',
      thanaIndex: 2,
      wardIndex: 17,
      startingPrice: 1200,
      services: [
        {
          title: 'ওয়াল পেইন্টিং সার্ভিস',
          description: 'রংমিস্ত্রির সাধারণ সেবা।',
          priceType: ServicePriceType.DAILY,
          amount: 1200,
        },
      ],
      portfolio: [],
    },
    // --- SUSPENDED FREELANCER (For Suspension / Moderation Testing) ---
    {
      phone: '+8801700000018',
      name: 'Habibur Rahman',
      email: 'habib.suspended@example.com',
      title: 'সিনিয়র প্লাম্বার',
      about: '১১ বছর ধরে ঢাকার বিভিন্ন এলাকায় স্যানিটারি লাইনের কাজ করছি।',
      experienceYears: 11,
      status: FreelancerStatus.SUSPENDED,
      suspendReason:
        'গ্রাহকের গুরুতর অভিযোগ এবং সেবার নির্ধারিত শর্ত লঙ্ঘনের কারণে অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে।',
      suspendedAt: new Date(Date.now() - 2 * 86400 * 1000),
      availability: FreelancerAvailability.AVAILABLE,
      featuredUntil: null,
      approvedAt: new Date(Date.now() - 100 * 86400 * 1000),
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      profKey: 'plumber',
      address: 'Main Road, Demra, Dhaka',
      thanaIndex: 3,
      wardIndex: 18,
      startingPrice: 400,
      services: [
        {
          title: 'জরুরি পাইপ লিকেজ মেরামত',
          description: 'প্লাম্বিং সমাধান।',
          priceType: ServicePriceType.FIXED,
          amount: 500,
        },
      ],
      portfolio: [],
    },
    // --- DRAFT FREELANCER (For Registration Step Testing) ---
    {
      phone: '+8801700000019',
      name: 'Zubayer Ahmed',
      email: 'zubayer.draft@example.com',
      title: 'টাইলস সহকারী',
      about: 'টাইলস ও রাজমিস্ত্রি সহযোগী হিসেবে কাজ শিখছি।',
      experienceYears: 1,
      status: FreelancerStatus.DRAFT,
      availability: FreelancerAvailability.AVAILABLE,
      featuredUntil: null,
      approvedAt: null,
      photoUrl: null,
      profKey: 'mason',
      address: 'Banani, Dhaka',
      thanaIndex: 0,
      wardIndex: 19,
      startingPrice: 600,
      services: [],
      portfolio: [],
    },
  ];

  console.log(`Creating ${freelancerSeeds.length} demonstration freelancers...`);

  const createdFreelancers: any[] = [];

  for (const s of freelancerSeeds) {
    // 1. Create or update User
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {
        name: s.name,
        phone: s.phone,
        isActive: true,
        role: Role.CUSTOMER,
      },
      create: {
        phone: s.phone,
        name: s.name,
        email: s.email,
        passwordHash: passwordHash,
        isActive: true,
        role: Role.CUSTOMER,
      },
    });

    const prof = getProf(s.profKey);

    // 2. Upsert FreelancerProfile
    const profile = await prisma.freelancerProfile.upsert({
      where: { userId: user.id },
      update: {
        displayName: s.name,
        photoUrl: s.photoUrl,
        professionId: prof.id,
        title: s.title,
        about: s.about,
        experienceYears: s.experienceYears,
        email: s.email,
        address: s.address,
        availability: s.availability,
        startingPrice: s.startingPrice,
        status: s.status,
        rejectionReason: (s as any).rejectionReason || null,
        rejectionCount: (s as any).rejectionCount || 0,
        approvedAt: s.approvedAt || null,
        suspendedAt: (s as any).suspendedAt || null,
        suspendReason: (s as any).suspendReason || null,
        featuredUntil: s.featuredUntil,
        lastActiveAt: new Date(),
      },
      create: {
        userId: user.id,
        displayName: s.name,
        photoUrl: s.photoUrl,
        professionId: prof.id,
        title: s.title,
        about: s.about,
        experienceYears: s.experienceYears,
        email: s.email,
        address: s.address,
        availability: s.availability,
        startingPrice: s.startingPrice,
        status: s.status,
        rejectionReason: (s as any).rejectionReason || null,
        rejectionCount: (s as any).rejectionCount || 0,
        approvedAt: s.approvedAt || null,
        suspendedAt: (s as any).suspendedAt || null,
        suspendReason: (s as any).suspendReason || null,
        featuredUntil: s.featuredUntil,
        lastActiveAt: new Date(),
      },
    });

    createdFreelancers.push({ profile, user, prof });

    // 3. Location
    const selectedThana = thanaPool[s.thanaIndex % thanaPool.length];
    const selectedPostOffice = selectedThana.postOffices[0];
    const selectedWard = wards.length > 0 ? wards[s.wardIndex % wards.length] : null;

    if (selectedPostOffice) {
      await prisma.freelancerLocation.deleteMany({
        where: { freelancerId: profile.id },
      });

      await prisma.freelancerLocation.create({
        data: {
          freelancerId: profile.id,
          divisionId: divisionId,
          districtId: districtId,
          thanaId: selectedThana.id,
          postOfficeId: selectedPostOffice.id,
          cityCorporationId: dhakaNorthCorp?.id || null,
          wardId: selectedWard?.id || null,
          localityText: s.address,
          isPrimary: true,
        },
      });
    }

    // 4. Skills (Link 2-4 skills from the profession)
    if (prof.skills && prof.skills.length > 0) {
      await prisma.freelancerSkill.deleteMany({
        where: { freelancerId: profile.id },
      });

      const skillSubset = prof.skills.slice(0, 3);
      for (const skill of skillSubset) {
        await prisma.freelancerSkill.create({
          data: {
            freelancerId: profile.id,
            skillId: skill.id,
          },
        });
      }
    }

    // 5. Services
    if (s.services && s.services.length > 0) {
      await prisma.freelancerService.deleteMany({
        where: { freelancerId: profile.id },
      });

      for (const srv of s.services) {
        await prisma.freelancerService.create({
          data: {
            freelancerId: profile.id,
            title: srv.title,
            description: srv.description,
            priceType: srv.priceType,
            amount: srv.amount,
          },
        });
      }
    }

    // 6. Portfolio
    if (s.portfolio && s.portfolio.length > 0) {
      await prisma.portfolioItem.deleteMany({
        where: { freelancerId: profile.id },
      });

      let sort = 1;
      for (const item of s.portfolio) {
        await prisma.portfolioItem.create({
          data: {
            freelancerId: profile.id,
            imageUrl: item.imageUrl,
            caption: item.caption,
            sortOrder: sort++,
          },
        });
      }
    }
  }

  console.log('Freelancer profiles, locations, skills, and services created.');

  // =========================================================================
  // 4. Test Customer Accounts & Membership Subscriptions
  // =========================================================================
  console.log('Seeding test client accounts and subscriptions...');

  // Client 1: Has Active 30-day Subscription
  const client1 = await prisma.user.upsert({
    where: { email: 'client1@example.com' },
    update: {
      name: 'Sabbir Ahmed (Active Member)',
      phone: '+8801811000001',
      isActive: true,
      role: Role.CUSTOMER,
    },
    create: {
      phone: '+8801811000001',
      name: 'Sabbir Ahmed (Active Member)',
      email: 'client1@example.com',
      passwordHash: clientPasswordHash,
      isActive: true,
      role: Role.CUSTOMER,
    },
  });

  // Client 2: Free Customer without subscription
  const client2 = await prisma.user.upsert({
    where: { email: 'client2@example.com' },
    update: {
      name: 'Nusrat Jahan (Free Client)',
      phone: '+8801811000002',
      isActive: true,
      role: Role.CUSTOMER,
    },
    create: {
      phone: '+8801811000002',
      name: 'Nusrat Jahan (Free Client)',
      email: 'client2@example.com',
      passwordHash: clientPasswordHash,
      isActive: true,
      role: Role.CUSTOMER,
    },
  });

  // Assign monthly plan subscription to Client 1
  const monthlyPlan = await prisma.membershipPlan.findFirst({
    where: { durationDays: 30, isActive: true },
  });

  if (monthlyPlan) {
    const paymentIdempotency = `DEMO-PAY-${client1.id.slice(0, 8)}`;
    const gatewayTxn = `PAYSTATION-TXN-${Date.now()}`;

    // Clean up existing demo payment / subscription for clean rerun
    const existingPayment = await prisma.membershipPayment.findUnique({
      where: { idempotencyKey: paymentIdempotency },
      include: { subscription: true },
    });

    let payment = existingPayment;
    if (!payment) {
      payment = await prisma.membershipPayment.create({
        data: {
          userId: client1.id,
          planId: monthlyPlan.id,
          amount: monthlyPlan.price,
          gateway: 'PAYSTATION',
          gatewayTxnId: gatewayTxn,
          idempotencyKey: paymentIdempotency,
          status: MembershipPaymentStatus.PAID,
          paidAt: new Date(),
          rawPayload: { demo: true, simulatedGateway: 'PayStation', cardType: 'bKash' },
        },
      });
    }

    if (payment) {
      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 86400 * 1000);

      await prisma.subscription.upsert({
        where: { paymentId: payment.id },
        update: {
          status: SubscriptionStatus.ACTIVE,
          startsAt: now,
          expiresAt: expires,
        },
        create: {
          userId: client1.id,
          planId: monthlyPlan.id,
          paymentId: payment.id,
          startsAt: now,
          expiresAt: expires,
          status: SubscriptionStatus.ACTIVE,
        },
      });
    }
  }

  // =========================================================================
  // 5. Contact Reveals & Chat Conversations
  // =========================================================================
  console.log('Seeding demo Contact Reveals and Conversations...');

  const approvedFreelancers = createdFreelancers.filter(
    (f) => f.profile.status === FreelancerStatus.APPROVED
  );

  if (approvedFreelancers.length > 0) {
    const targetFreelancer1 = approvedFreelancers[0]; // Rafiqul (Electrician)
    const targetFreelancer2 = approvedFreelancers[1]; // Abdur Rahim (Plumber)

    // Contact Reveals by Client 1
    await prisma.contactReveal.deleteMany({
      where: { userId: client1.id },
    });

    await prisma.contactReveal.create({
      data: {
        userId: client1.id,
        freelancerId: targetFreelancer1.profile.id,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000),
      },
    });

    await prisma.contactReveal.create({
      data: {
        userId: client1.id,
        freelancerId: targetFreelancer2.profile.id,
        createdAt: new Date(Date.now() - 24 * 3600 * 1000),
      },
    });

    // Conversation between Client 1 and Freelancer 1
    const conv = await prisma.conversation.upsert({
      where: {
        clientId_freelancerId: {
          clientId: client1.id,
          freelancerId: targetFreelancer1.profile.id,
        },
      },
      update: {
        lastMessageAt: new Date(),
        clientUnread: 0,
        freelancerUnread: 0,
        status: ConversationStatus.OPEN,
      },
      create: {
        clientId: client1.id,
        freelancerId: targetFreelancer1.profile.id,
        lastMessageAt: new Date(),
        clientUnread: 0,
        freelancerUnread: 0,
        status: ConversationStatus.OPEN,
      },
    });

    // Clear old demo messages for clean rerun
    await prisma.message.deleteMany({
      where: { conversationId: conv.id },
    });

    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: client1.id,
        body: 'আসসালামু আলাইকুম রফিকুল ভাই, মিরপুর ১২ তে আমার বাসায় একটি ডিবি বোর্ডের সুইচ রিপ্লেস করা দরকার। আপনি কি আজ বিকেলে আসতে পারবেন?',
        flags: [],
        createdAt: new Date(Date.now() - 3 * 3600 * 1000),
        readAt: new Date(Date.now() - 2 * 3600 * 1000),
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: targetFreelancer1.user.id,
        body: 'ওয়ালাইকুম আসসালাম ভাই। জি, আমি আজ বিকাল ৫টায় আপনার ওখানে আসতে পারব। প্রয়োজনীয় পার্টস কি আপনার কাছে আছে নাকি আমি নিয়ে আসব?',
        flags: [],
        createdAt: new Date(Date.now() - 2 * 3600 * 1000),
        readAt: new Date(Date.now() - 1 * 3600 * 1000),
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: client1.id,
        body: 'আপনি সাথে নিয়ে আসলে ভালো হয় ভাই। আসার আগে একটু ফোন দিয়েন। আমার নাম্বার ০১৮১১০0000১।',
        flags: [MessageFlag.PHONE], // Flagged message test!
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        readAt: null,
      },
    });

    // =========================================================================
    // 6. Demo Reviews & Public Replies
    // =========================================================================
    console.log('Seeding demo Freelancer Reviews & Replies...');

    // Clean up existing demo reviews for clean rerun
    await prisma.freelancerReview.deleteMany({
      where: {
        freelancerId: { in: [targetFreelancer1.profile.id, targetFreelancer2.profile.id] },
      },
    });

    // Review 1: Client 1 reviews Rafiqul Islam (Electrician) - 5 Stars
    await prisma.freelancerReview.create({
      data: {
        freelancerId: targetFreelancer1.profile.id,
        clientId: client1.id,
        rating: 5,
        comment:
          'রফিকুল ভাই খুবই দক্ষ ও অভিজ্ঞ ইলেকট্রিশিয়ান। মিরপুরে আমার বাসার সম্পূর্ণ ডিবি বোর্ড ও সার্কিট ব্রেকার অত্যন্ত নিখুঁতভাবে স্থাপন করে দিয়েছেন। কাজের ফিনিশিং চমৎকার ছিল।',
        images: [
          'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
        ],
        freelancerReply: 'ধন্যবাদ সাব্বির ভাই! সুন্দর ফিডব্যাকের জন্য আন্তরিক কৃতজ্ঞতা।',
        repliedAt: new Date(Date.now() - 1 * 3600 * 1000),
        isVerifiedContact: true,
        editCount: 0,
        status: FreelancerReviewStatus.APPROVED,
        createdAt: new Date(Date.now() - 24 * 3600 * 1000),
      },
    });

    // Contact reveal for Client 2 to make them verified contact
    await prisma.contactReveal.create({
      data: {
        userId: client2.id,
        freelancerId: targetFreelancer1.profile.id,
        createdAt: new Date(Date.now() - 12 * 3600 * 1000),
      },
    });

    // Review 2: Client 2 reviews Rafiqul Islam - 4 Stars
    await prisma.freelancerReview.create({
      data: {
        freelancerId: targetFreelancer1.profile.id,
        clientId: client2.id,
        rating: 4,
        comment: 'ভালো কাজ করেছেন। সিলিং ফ্যান ও লাইটের ফল্ট দ্রুত বের করে সমাধান করে দিয়েছেন। দামও যুক্তিযুক্ত।',
        images: [],
        isVerifiedContact: true,
        editCount: 0,
        status: FreelancerReviewStatus.APPROVED,
        createdAt: new Date(Date.now() - 6 * 3600 * 1000),
      },
    });

    // Update Rafiqul's stats: avg 4.50, total 2
    await prisma.freelancerProfile.update({
      where: { id: targetFreelancer1.profile.id },
      data: {
        averageRating: 4.5,
        totalReviews: 2,
      },
    });

    // Review 3: Client 1 reviews Abdur Rahim (Plumber) - 5 Stars
    await prisma.freelancerReview.create({
      data: {
        freelancerId: targetFreelancer2.profile.id,
        clientId: client1.id,
        rating: 5,
        comment:
          'বাথরুমের হিডেন পাইপ লিকেজ খুব অল্প সময়ে সনাক্ত করে স্থায়ী সমাধান দিয়েছেন। সৎ ও পরিশ্রমী প্লাম্বার। নিঃসন্দেহে নির্ভরযোগ্য।',
        images: [
          'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
        ],
        freelancerReply: 'অনেক ধন্যবাদ ভাই! যেকোনো প্রয়োজনে কল করবেন।',
        repliedAt: new Date(Date.now() - 4 * 3600 * 1000),
        isVerifiedContact: true,
        editCount: 0,
        status: FreelancerReviewStatus.APPROVED,
        createdAt: new Date(Date.now() - 18 * 3600 * 1000),
      },
    });

    // Update Abdur Rahim's stats: avg 5.00, total 1
    await prisma.freelancerProfile.update({
      where: { id: targetFreelancer2.profile.id },
      data: {
        averageRating: 5.0,
        totalReviews: 1,
      },
    });
  }

  console.log('✅ Freelancer Module Demo Data Seed Completed Successfully!');
}

seedFreelancers()
  .catch((e) => {
    console.error('Error seeding freelancers:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
