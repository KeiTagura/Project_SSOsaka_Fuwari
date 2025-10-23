import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { normalizeLang } from "./lang";

export function pathsEqual(path1: string, path2: string) {
	const normalizedPath1 = path1.replace(/^\/|\/$/g, "").toLowerCase();
	const normalizedPath2 = path2.replace(/^\/|\/$/g, "").toLowerCase();
	return normalizedPath1 === normalizedPath2;
}

function joinUrl(...parts: string[]): string {
	const joined = parts.join("/");
	return joined.replace(/\/+/g, "/");
}

export function getPostUrlBySlug(slug: string): string {
	return url(`/posts/${slug}/`);
}

export function getPostUrlBySlugLang(
	slug: string,
	lang?: string | null,
): string {
	const p = getPostUrlBySlug(slug);
	// If slug already starts with a locale (e.g., 'en/...' or 'ja/...'), return as-is
	const hasLocale = /^(en|ja)\//.test(slug);
	if (hasLocale) return p;
	const l = lang ? normalizeLang(lang) : null;
	return l ? `/${l}${p}` : p;
}

export function getTagUrl(tag: string): string {
	if (!tag) return url("/archive/");
	return url(`/archive/?tag=${encodeURIComponent(tag.trim())}`);
}

export function getTagUrlLang(tag: string, lang?: string | null): string {
	const p = getTagUrl(tag);
	const l = lang ? normalizeLang(lang) : null;
	return l ? `/${l}${p}` : p;
}

export function getCategoryUrl(category: string | null): string {
	if (
		!category ||
		category.trim() === "" ||
		category.trim().toLowerCase() === i18n(I18nKey.uncategorized).toLowerCase()
	)
		return url("/archive/?uncategorized=true");
	return url(`/archive/?category=${encodeURIComponent(category.trim())}`);
}

export function getCategoryUrlLang(
	category: string | null,
	lang?: string | null,
): string {
	const p = getCategoryUrl(category);
	const l = lang ? normalizeLang(lang) : null;
	return l ? `/${l}${p}` : p;
}

export function getDir(path: string): string {
	const lastSlashIndex = path.lastIndexOf("/");
	if (lastSlashIndex < 0) {
		return "/";
	}
	return path.substring(0, lastSlashIndex + 1);
}

export function url(path: string) {
	return joinUrl("", import.meta.env.BASE_URL, path);
}

export function urlLang(path: string, lang?: string | null) {
	const l = lang ? normalizeLang(lang) : null;
	return l ? joinUrl("/", l, url(path)) : url(path);
}
