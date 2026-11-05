import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, SkillStatus } from '@prisma/client';

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:62348787@localhost:5432/az_ecommerce?schema=public';

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Seeding Marketplace Taxonomy...');

  const categories = [
    {
      name: 'Home Maintenance & Repair',
      bnName: 'গৃহ মেরামত ও রক্ষণাবেক্ষণ',
      icon: 'home-repair',
      sortOrder: 1,
      professions: [
        {
          name: 'Electrician',
          bnName: 'ইলেকট্রিশিয়ান',
          sortOrder: 1,
          skills: [
            { name: 'House Wiring', bnName: 'হাউস ওয়্যারিং' },
            { name: 'Circuit Breaker Installation', bnName: 'সার্কিট ব্রেকার স্থাপন' },
            { name: 'Fan & Light Repair', bnName: 'ফ্যান ও লাইট মেরামত' },
            { name: 'Generator Wiring', bnName: 'জেনারেটর ওয়্যারিং' },
            { name: 'Short Circuit Troubleshooting', bnName: 'শর্ট সার্কিট ত্রুটি সমাধান' },
          ],
        },
        {
          name: 'Plumber',
          bnName: 'প্লাম্বার / স্যানিটারি মিস্ত্রি',
          sortOrder: 2,
          skills: [
            { name: 'Pipe Fitting & Leak Repair', bnName: 'পাইপ ফিটিং ও লিকেজ মেরামত' },
            { name: 'Water Pump Repair', bnName: 'পানির পাম্প মেরামত' },
            { name: 'Bathroom Fixtures Installation', bnName: 'বাথরুম ফিটিংস স্থাপন' },
            { name: 'Drain Cleaning', bnName: 'ড্রেন লাইন পরিষ্কার' },
            { name: 'Water Tank Cleaning', bnName: 'পানির ট্যাংক পরিষ্কার' },
          ],
        },
        {
          name: 'Carpenter',
          bnName: 'কাঠমিস্ত্রি',
          sortOrder: 3,
          skills: [
            { name: 'Furniture Assembly', bnName: 'ফার্নিচার সংযোজন' },
            { name: 'Door & Lock Repair', bnName: 'দরজা ও লক মেরামত' },
            { name: 'Custom Cabinetry', bnName: 'কাস্টম ক্যাবিনেট তৈরি' },
            { name: 'Wood Polishing & Varnishing', bnName: 'কাঠ পলিশ ও বার্নিশ' },
            { name: 'Wooden Partitioning', bnName: 'কাঠের পার্টিশন তৈরি' },
          ],
        },
        {
          name: 'Painter',
          bnName: 'রংমিস্ত্রি',
          sortOrder: 4,
          skills: [
            { name: 'Interior Wall Painting', bnName: 'ঘরের দেয়াল পেইন্টিং' },
            { name: 'Exterior Weatherproof Coating', bnName: 'বাইরের ওয়েদারকোট পেইন্ট' },
            { name: 'Wall Putty & Primer', bnName: 'ওয়াল পুটি ও প্রাইমার' },
            { name: 'Spray Painting', bnName: 'স্প্রে পেইন্টিং' },
            { name: 'Wood & Metal Painting', bnName: 'কাঠ ও মেটাল পেইন্ট' },
          ],
        },
        {
          name: 'Mason & Tiles Worker',
          bnName: 'রাজমিস্ত্রি ও টাইলস মিস্ত্রি',
          sortOrder: 5,
          skills: [
            { name: 'Floor Tiling', bnName: 'মেঝে টাইলস স্থাপন' },
            { name: 'Wall Tiling', bnName: 'দেয়াল টাইলস স্থাপন' },
            { name: 'Brick Masonry', bnName: 'ইট গাঁথুনি' },
            { name: 'Plastering', bnName: 'প্লাস্টার কাজ' },
            { name: 'Concrete Repair', bnName: 'কংক্রিট মেরামত' },
          ],
        },
      ],
    },
    {
      name: 'Appliance Servicing',
      bnName: 'ইলেকট্রনিক্স ও গৃহস্থালি যন্ত্রপাতি',
      icon: 'cpu',
      sortOrder: 2,
      professions: [
        {
          name: 'AC Technician',
          bnName: 'এসি টেকনিশিয়ান',
          sortOrder: 1,
          skills: [
            { name: 'AC Installation & Uninstallation', bnName: 'এসি স্থাপন ও স্থানান্তর' },
            { name: 'AC Master Servicing', bnName: 'এসি মাস্টার সার্ভিসিং' },
            { name: 'Gas Refill & Leak Check', bnName: 'গ্যাস রিফিল ও লিকেজ চেক' },
            { name: 'PCB Circuit Repair', bnName: 'পিসিবি সার্কিট মেরামত' },
            { name: 'Compressor Replacement', bnName: 'কম্প্রেসার প্রতিস্থাপন' },
          ],
        },
        {
          name: 'Refrigerator Technician',
          bnName: 'ফ্রিজ টেকনিশিয়ান',
          sortOrder: 2,
          skills: [
            { name: 'Cooling Troubleshooting', bnName: 'কুলিং সমস্যা সমাধান' },
            { name: 'Gas Charging', bnName: 'গ্যাস চার্জিং' },
            { name: 'Thermostat Replacement', bnName: 'থার্মোস্ট্যাট পরিবর্তন' },
            { name: 'Compressor Servicing', bnName: 'কম্প্রেসার সার্ভিসিং' },
          ],
        },
        {
          name: 'Washing Machine Technician',
          bnName: 'ওয়াশিং মেশিন টেকনিশিয়ান',
          sortOrder: 3,
          skills: [
            { name: 'Motor & Belt Repair', bnName: 'মোটর ও বেল্ট মেরামত' },
            { name: 'Drain Pump Repair', bnName: 'ড্রেন পাম্প মেরামত' },
            { name: 'PCB Control Board Repair', bnName: 'কন্ট্রোল বোর্ড মেরামত' },
            { name: 'Drum Balancing', bnName: 'ড্রাম ব্যালেন্সিং' },
          ],
        },
      ],
    },
    {
      name: 'Vehicle Care & Mechanics',
      bnName: 'গাড়ি ও মোটরবাইক সার্ভিসিং',
      icon: 'wrench',
      sortOrder: 3,
      professions: [
        {
          name: 'Motorcycle Mechanic',
          bnName: 'মোটরবাইক মেকানিক',
          sortOrder: 1,
          skills: [
            { name: 'Engine Overhauling', bnName: 'ইঞ্জিন ওভারহলিং' },
            { name: 'Brake & Suspension Servicing', bnName: 'ব্রেক ও সাসপেনশন সার্ভিসিং' },
            { name: 'Carburetor / EFI Tuning', bnName: 'কার্বুরেটর ও ইএফআই টিউনিং' },
            { name: 'Electrical Wiring Repair', bnName: 'ইলেকট্রিক্যাল ওয়্যারিং মেরামত' },
          ],
        },
      ],
    },
  ];

  for (const catData of categories) {
    let cat = await prisma.professionCategory.findFirst({
      where: { name: catData.name },
    });

    if (!cat) {
      cat = await prisma.professionCategory.create({
        data: {
          name: catData.name,
          bnName: catData.bnName,
          icon: catData.icon,
          sortOrder: catData.sortOrder,
        },
      });
      console.log(`Created category: ${cat.name}`);
    }

    for (const profData of catData.professions) {
      let prof = await prisma.profession.findFirst({
        where: { categoryId: cat.id, name: profData.name },
      });

      if (!prof) {
        prof = await prisma.profession.create({
          data: {
            categoryId: cat.id,
            name: profData.name,
            bnName: profData.bnName,
            sortOrder: profData.sortOrder,
          },
        });
        console.log(`  Created profession: ${prof.name}`);
      }

      for (const skillData of profData.skills) {
        const existingSkill = await prisma.skill.findUnique({
          where: {
            professionId_name: {
              professionId: prof.id,
              name: skillData.name,
            },
          },
        });

        if (!existingSkill) {
          await prisma.skill.create({
            data: {
              professionId: prof.id,
              name: skillData.name,
              bnName: skillData.bnName,
              status: SkillStatus.ACTIVE,
            },
          });
          console.log(`    Created skill: ${skillData.name}`);
        }
      }
    }
  }

  const [categoriesCount, professionsCount, skillsCount] = await Promise.all([
    prisma.professionCategory.count(),
    prisma.profession.count(),
    prisma.skill.count(),
  ]);

  console.log('Seeding complete:', {
    categories: categoriesCount,
    professions: professionsCount,
    skills: skillsCount,
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error('Error seeding taxonomy:', err);
  process.exit(1);
});

