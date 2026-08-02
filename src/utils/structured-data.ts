import type { CollectionEntry } from "astro:content";

const DEFAULT_SITE_URL = "https://secretshop.osaka/";
const SECRET_SHOP_ID = "#secret-shop-osaka";

const secretShopAddress = {
	"@type": "PostalAddress",
	streetAddress: "3 Chome-5 Sanno, Nishinari Ward",
	addressLocality: "Osaka",
	addressRegion: "Osaka",
	postalCode: "557-0001",
	addressCountry: "JP",
};

const socialUrls = [
	"https://www.instagram.com/secretshop.osaka/",
	"https://discord.gg/AE94Z8hhpn",
	"https://bsky.app/profile/ssosaka.bsky.social",
	"https://www.meetup.com/secretshop/",
	"https://ssosaka.peatix.com/",
];

function siteRoot(site?: URL | string | null): string {
	return new URL("/", site ?? DEFAULT_SITE_URL).href;
}

function absoluteUrl(path: string, site?: URL | string | null): string {
	return new URL(path, siteRoot(site)).href;
}

function cleanObject<T extends Record<string, any>>(value: T): T {
	return Object.fromEntries(
		Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ""),
	) as T;
}

function toDateString(date: Date | string | undefined): string | undefined {
	if (!date) return undefined;
	if (typeof date === "string") return date;
	return date.toISOString().slice(0, 10);
}

function normalizeLang(lang?: string | null): string {
	const normalized = (lang || "en").replace("_", "-").toLowerCase();
	if (normalized.startsWith("ja")) return "ja";
	return "en";
}

function getRouteLangFromPath(pathname: string, fallback?: string | null): string {
	if (pathname.startsWith("/ja/")) return "ja";
	if (pathname.startsWith("/en/")) return "en";
	return normalizeLang(fallback);
}

function localizedPath(path: string, currentPathname: string): string {
	const prefix = currentPathname.startsWith("/en/") || currentPathname === "/en/"
		? "/en"
		: currentPathname.startsWith("/ja/") || currentPathname === "/ja/"
			? "/ja"
			: "";
	return `${prefix}${path}`.replace(/\/+/g, "/");
}

function defaultImages(site?: URL | string | null): string[] {
	return [
		absoluteUrl("/images/LocationShot.webp", site),
		absoluteUrl("/images/StudioBanner.png", site),
		absoluteUrl("/images/09.webp", site),
	];
}

function organization(site?: URL | string | null) {
	const root = siteRoot(site);
	return {
		"@type": "Organization",
		"@id": `${root}${SECRET_SHOP_ID}`,
		name: "Secret Shop Osaka",
		alternateName: ["Secret Shop", "SS Osaka"],
		url: root,
		image: defaultImages(site),
		sameAs: socialUrls,
	};
}

function secretShopPlace(site?: URL | string | null) {
	const root = siteRoot(site);
	return {
		"@type": "Place",
		"@id": `${root}#secret-shop-osaka-place`,
		name: "Secret Shop Osaka",
		address: secretShopAddress,
		url: root,
	};
}

export function getSecretShopLocalBusinessJsonLd(site?: URL | string | null) {
	const root = siteRoot(site);
	return {
		"@context": "https://schema.org",
		"@type": "LocalBusiness",
		"@id": `${root}${SECRET_SHOP_ID}`,
		name: "Secret Shop Osaka",
		alternateName: ["Secret Shop", "SS Osaka"],
		description:
			"A creative community space in Osaka for indie game developers, digital artists, game jams, game nights, LAN party meetups, workshops, and open hours.",
		url: root,
		image: defaultImages(site),
		address: secretShopAddress,
		areaServed: {
			"@type": "City",
			name: "Osaka",
		},
		priceRange: "JPY",
		openingHoursSpecification: [
			{
				"@type": "OpeningHoursSpecification",
				dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday"],
				opens: "19:00",
				closes: "23:00",
			},
		],
		sameAs: socialUrls,
	};
}

function getOffer(data: any, site?: URL | string | null) {
	if (!data.eventTicketUrl) return undefined;
	return cleanObject({
		"@type": "Offer",
		url: absoluteUrl(data.eventTicketUrl, site),
		price: data.eventTicketPrice,
		priceCurrency: data.eventTicketCurrency || "JPY",
		availability: data.eventTicketAvailability || "https://schema.org/InStock",
		validFrom: toDateString(data.published),
	});
}

function getBreadcrumbJsonLd({
	pageUrl,
	pageTitle,
	site,
}: {
	pageUrl: URL;
	pageTitle: string;
	site?: URL | string | null;
}) {
	const pathname = pageUrl.pathname;
	return {
		"@type": "BreadcrumbList",
		"@id": `${pageUrl.href}#breadcrumb`,
		itemListElement: [
			{
				"@type": "ListItem",
				position: 1,
				name: "Home",
				item: absoluteUrl(localizedPath("/", pathname), site),
			},
			{
				"@type": "ListItem",
				position: 2,
				name: "Events",
				item: absoluteUrl(localizedPath("/events/", pathname), site),
			},
			{
				"@type": "ListItem",
				position: 3,
				name: pageTitle,
				item: pageUrl.href,
			},
		],
	};
}

function getBlogPostingJsonLd(entry: CollectionEntry<"posts">, pageUrl: URL, lang: string, site?: URL | string | null) {
	return cleanObject({
		"@type": "BlogPosting",
		"@id": `${pageUrl.href}#blogposting`,
		mainEntityOfPage: pageUrl.href,
		headline: entry.data.title,
		description: entry.data.description || entry.data.title,
		keywords: entry.data.tags,
		url: pageUrl.href,
		image: defaultImages(site),
		author: organization(site),
		publisher: organization(site),
		datePublished: toDateString(entry.data.published),
		dateModified: toDateString(entry.data.updated ?? entry.data.published),
		inLanguage: lang,
	});
}

function getEventJsonLd(entry: CollectionEntry<"posts">, pageUrl: URL, lang: string, site?: URL | string | null) {
	const data = entry.data as any;
	return cleanObject({
		"@type": "Event",
		"@id": `${pageUrl.href}#event`,
		name: data.title,
		description: data.description || data.title,
		url: pageUrl.href,
		image: defaultImages(site),
		startDate: data.eventStart || toDateString(data.eventDate),
		endDate: data.eventEnd,
		eventStatus: data.eventStatus || "https://schema.org/EventScheduled",
		eventAttendanceMode: data.eventAttendanceMode || "https://schema.org/OfflineEventAttendanceMode",
		location: secretShopPlace(site),
		organizer: organization(site),
		offers: getOffer(data, site),
		keywords: data.tags,
		inLanguage: lang,
		datePublished: toDateString(data.published),
	});
}

export function getPostStructuredData({
	entry,
	pageUrl,
	site,
	lang,
}: {
	entry: CollectionEntry<"posts">;
	pageUrl: URL;
	site?: URL | string | null;
	lang?: string | null;
}) {
	const routeLang = getRouteLangFromPath(pageUrl.pathname, lang || entry.data.lang);
	const mainEntity = entry.data.eventDate
		? getEventJsonLd(entry, pageUrl, routeLang, site)
		: getBlogPostingJsonLd(entry, pageUrl, routeLang, site);

	return {
		"@context": "https://schema.org",
		"@graph": [
			organization(site),
			mainEntity,
			getBreadcrumbJsonLd({
				pageUrl,
				pageTitle: entry.data.title,
				site,
			}),
		],
	};
}
