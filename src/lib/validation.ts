import { z } from "zod";

// Every one of these mirrors (or exceeds) whatever validation exists on the
// frontend. The backend never trusts frontend validation alone — this file
// is the actual enforcement layer.

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Enter a valid email").max(255).toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(5, "Review must be at least 5 characters").max(1000),
});

export const predictorSchema = z.object({
  exam: z.enum(["JEE Main", "JEE Advanced", "BITSAT", "VITEEE", "State CET"]),
  rank: z.coerce.number().int().positive().max(2000000),
  location: z.string().trim().max(100).optional(),
  budget: z.coerce.number().int().positive().max(10000000).optional(),
  course: z.string().trim().max(100).optional(),
});

export const collegesQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  minFee: z.coerce.number().min(0).max(100000000).optional(),
  maxFee: z.coerce.number().min(0).max(100000000).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(["rating_desc", "rating_asc", "fees_asc", "fees_desc", "name_asc"]).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
  slugs: z.string().trim().max(500).optional(),
});

export const savedCollegeSchema = z.object({
  slug: z.string().trim().min(1).max(200),
});
