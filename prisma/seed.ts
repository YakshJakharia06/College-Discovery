import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("🚀 Fetching universities from Hipolabs API...");

  // Seed Demo User
  const demoPasswordHash = await bcrypt.hash("Demo@1234", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@example.com",
      passwordHash: demoPasswordHash,
    },
  });
  console.log(`Demo user ready: ${demoUser.email} (password: Demo@1234)`);

  // You can change "India" to any country or remove the query to search globally
  const response = await fetch("http://universities.hipolabs.com/search?country=India");
  if (!response.ok) {
    throw new Error("Failed to fetch universities from Hipolabs API");
  }

  const universities = await response.json();
  console.log(`Fetched ${universities.length} universities. Saving to database...`);

  let count = 0;

  // Limit to 200 or loop through all depending on your preference
  const targetList = universities.slice(0, 300);

  for (const uni of targetList) {
    const name = uni.name;
    const slug = slugify(name);
    const country = uni.country || "India";
    const state = uni["state-province"] || country;
    const city = uni.city || state;

    // Default mock stats for dynamic entries
    const fees = 200000;
    const rating = 4.2;
    const avgPackage = 1000000;
    const highPackage = 3000000;
    const placementPct = 85;

    const college = await prisma.college.upsert({
      where: { slug },
      update: {
        name,
        city,
        state,
        fees,
        rating,
        description: `${name} is located in ${city}, ${country}. Official website: ${uni.web_pages?.[0] || "N/A"}`,
        averagePackage: avgPackage,
        highestPackage: highPackage,
        placementPercentage: placementPct,
        topRecruiters: ["Google", "Microsoft", "Amazon", "TCS", "Infosys"],
      },
      create: {
        name,
        slug,
        city,
        state,
        fees,
        rating,
        description: `${name} is located in ${city}, ${country}. Official website: ${uni.web_pages?.[0] || "N/A"}`,
        averagePackage: avgPackage,
        highestPackage: highPackage,
        placementPercentage: placementPct,
        topRecruiters: ["Google", "Microsoft", "Amazon", "TCS", "Infosys"],
      },
    });

    // Add standard courses
    await prisma.course.deleteMany({ where: { collegeId: college.id } });
    await prisma.course.createMany({
      data: [
        { collegeId: college.id, name: "Computer Science and Engineering", duration: "4 years", fees },
        { collegeId: college.id, name: "Electronics and Communication", duration: "4 years", fees },
        { collegeId: college.id, name: "Mechanical Engineering", duration: "4 years", fees },
      ],
    });

    count++;
  }

  console.log(`✅ Successfully seeded ${count} colleges from Hipolabs API!`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });