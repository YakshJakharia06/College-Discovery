// src/scripts/sync-colleges.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface LiveCollegeData {
	name: string;
	city: string;
	state: string;
	fees: number;
	rating: number;
	averagePackage: number;
	highestPackage: number;
	placementPercentage: number;
	description: string;
}

// Convert college names to safe database slugs
function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/**
 * Performs a live web search for the requested college via Tavily API
 */
async function searchLiveWeb(queryName: string): Promise<string> {
	const apiKey = process.env.TAVILY_API_KEY;
	if (!apiKey) {
		throw new Error("Missing TAVILY_API_KEY environment variable.");
	}

	const response = await fetch("https://api.tavily.com/search", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			api_key: apiKey,
			query: `${queryName} engineering college total fees average package highest package placement percentage India`,
			search_depth: "advanced",
			include_answer: "advanced",
		}),
	});

	if (!response.ok) {
		throw new Error(`Web search failed for query: ${queryName}`);
	}

	const data = await response.json();
	const summary = data.answer || "";
	const pageContents =
		data.results?.map((r: { content: string }) => r.content).join("\n") || "";

	return `${summary}\n${pageContents}`;
}

/**
 * Extracts structured JSON matching the Prisma schema from live unstructured text
 */
// Replace parseWebDataWithAI in src/scripts/sync-colleges.ts
async function parseWebDataWithGroq(
	collegeName: string,
	webContent: string,
): Promise<LiveCollegeData> {
	const groqApiKey = process.env.GROQ_API_KEY;
	if (!groqApiKey) {
		throw new Error("Missing GROQ_API_KEY in .env file.");
	}

	const response = await fetch(
		"https://api.groq.com/openai/v1/chat/completions",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${groqApiKey}`,
			},
			body: JSON.stringify({
				model: "llama-3.3-70b-versatile",
				response_format: { type: "json_object" },
				messages: [
					{
						role: "system",
						content: `You extract real college data from search text. Return ONLY a valid JSON object matching this schema:
{
  "name": "Full Official College Name",
  "city": "City Name",
  "state": "State Name",
  "fees": number (annual/total tuition fee in INR as integer),
  "rating": number (float between 1.0 and 5.0),
  "averagePackage": number (annual average CTC in INR as integer),
  "highestPackage": number (annual highest CTC in INR as integer),
  "placementPercentage": number (integer between 0 and 100),
  "description": "Short 2-sentence summary"
}`,
					},
					{
						role: "user",
						content: `Extract data for "${collegeName}" from these live web search results:\n\n${webContent}`,
					},
				],
			}),
		},
	);

	if (!response.ok) {
		throw new Error(`Groq API error: ${response.statusText}`);
	}

	const data = await response.json();
	return JSON.parse(data.choices[0].message.content);
}

async function main() {
	// Capture target college names passed from CLI arguments
	const targetColleges = process.argv.slice(2);

	if (targetColleges.length === 0) {
		console.log("\n❌ Please provide at least one college name.");
		console.log(
			'Example: npx ts-node src/scripts/sync-colleges.ts "COEP Pune" "VJTI Mumbai"\n',
		);
		process.exit(1);
	}

	console.log(
		`\n🚀 Starting internet extraction for ${targetColleges.length} college(s)...\n`,
	);

	for (const collegeName of targetColleges) {
		try {
			console.log(`🔍 Querying live web data for: "${collegeName}"...`);
			const searchResults = await searchLiveWeb(collegeName);

			console.log(`🤖 Parsing extracted content into structured JSON...`);
			const liveData = await parseWebDataWithAI(collegeName, searchResults);

			const slug = slugify(liveData.name || collegeName);

			// Save live internet data directly into Prisma DB
			const savedCollege = await prisma.college.upsert({
				where: { slug },
				update: {
					name: liveData.name,
					city: liveData.city,
					state: liveData.state,
					fees: Number(liveData.fees),
					rating: Number(liveData.rating),
					averagePackage: Number(liveData.averagePackage),
					highestPackage: Number(liveData.highestPackage),
					placementPercentage: Number(liveData.placementPercentage),
					description: liveData.description,
				},
				create: {
					slug,
					name: liveData.name,
					city: liveData.city,
					state: liveData.state,
					fees: Number(liveData.fees),
					rating: Number(liveData.rating),
					averagePackage: Number(liveData.averagePackage),
					highestPackage: Number(liveData.highestPackage),
					placementPercentage: Number(liveData.placementPercentage),
					description: liveData.description,
				},
			});

			console.log(
				`✅ Successfully synced: ${savedCollege.name} [Slug: ${savedCollege.slug}]\n`,
			);
		} catch (error) {
			console.error(`❌ Failed to sync "${collegeName}":`, error, "\n");
		}
	}
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
