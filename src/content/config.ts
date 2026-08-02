import { defineCollection, z } from "astro:content";

const postsCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		published: z.date(),
		eventDate: z.date().optional(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),
		eventStart: z.string().optional(),
		eventEnd: z.string().optional(),
		eventStatus: z.string().optional(),
		eventAttendanceMode: z.string().optional(),
		eventTicketUrl: z.string().optional(),
		eventTicketPrice: z.union([z.string(), z.number()]).optional(),
		eventTicketCurrency: z.string().optional().default("JPY"),
		eventTicketAvailability: z.string().optional(),
		featured: z.boolean().optional(), // ✅ Add this line

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});
const specCollection = defineCollection({
	schema: z.object({}),
});
export const collections = {
	posts: postsCollection,
	spec: specCollection,
};
