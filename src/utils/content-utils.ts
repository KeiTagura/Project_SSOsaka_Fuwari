import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils.ts";

type PublishablePostData = {
	draft?: boolean;
	published: Date | string;
};

type EventDatedPostData = {
	eventStart?: string;
	eventDate?: Date | string;
	published: Date | string;
};

export function toDateKey(value: Date | string): string {
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
	if (match) return match[0];
	return new Date(value).toISOString().slice(0, 10);
}

export function todayDateKey(): string {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const day = String(today.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function isPostPublishable(data: PublishablePostData): boolean {
	if (!import.meta.env.PROD) return true;
	return data.draft !== true && toDateKey(data.published) <= todayDateKey();
}

export function getPostEventDate(data: EventDatedPostData): Date {
	const value = data.eventStart ?? data.eventDate ?? data.published;
	return value instanceof Date ? value : new Date(String(value));
}

// Retrieve posts and sort them by publication date
async function getRawSortedPosts(lang?: string) {
	const allBlogPosts = await getCollection("posts", ({ data, slug }) => {
		const draftOk = isPostPublishable(data);
		const langLower = lang?.toLowerCase();
		const slugLang =
			typeof slug === "string"
				? slug.split("/")[0]?.toLowerCase?.()
				: undefined;
		const byFrontmatter = langLower
			? data.lang?.toLowerCase?.() === langLower
			: true;
		const byFolder = langLower ? slugLang === langLower : true;
		const langOk = langLower ? byFrontmatter || byFolder : true;
		return draftOk && langOk;
	});

	const sorted = allBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

export async function getSortedPosts(lang?: string) {
	const sorted = await getRawSortedPosts(lang);

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].slug;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].slug;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}

export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};

export async function getSortedPostsList(
	lang?: string,
): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts(lang);

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.slug,
		data: post.data,
	}));

	return sortedPostsList;
}

export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(lang?: string): Promise<Tag[]> {
	const allBlogPosts = await getCollection<"posts">(
		"posts",
		({ data, slug }) => {
			const draftOk = isPostPublishable(data);
			const langLower = lang?.toLowerCase();
			const slugLang =
				typeof slug === "string"
					? slug.split("/")[0]?.toLowerCase?.()
					: undefined;
			const byFrontmatter = langLower
				? data.lang?.toLowerCase?.() === langLower
				: true;
			const byFolder = langLower ? slugLang === langLower : true;
			const langOk = langLower ? byFrontmatter || byFolder : true;
			return draftOk && langOk;
		},
	);

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
		post.data.tags.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export async function getCategoryList(lang?: string): Promise<Category[]> {
	const allBlogPosts = await getCollection<"posts">(
		"posts",
		({ data, slug }) => {
			const draftOk = isPostPublishable(data);
			const langLower = lang?.toLowerCase();
			const slugLang =
				typeof slug === "string"
					? slug.split("/")[0]?.toLowerCase?.()
					: undefined;
			const byFrontmatter = langLower
				? data.lang?.toLowerCase?.() === langLower
				: true;
			const byFolder = langLower ? slugLang === langLower : true;
			const langOk = langLower ? byFrontmatter || byFolder : true;
			return draftOk && langOk;
		},
	);

	const count: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { category: string | null } }) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c),
		});
	}
	return ret;
}
