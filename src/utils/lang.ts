export type SupportedLang = "en" | "ja";

export function normalizeLang(lang?: string | null): SupportedLang {
	const v = (lang || "").toLowerCase();
	return v === "ja" ? "ja" : "en";
}

export function getLangFromPath(pathname: string): SupportedLang | null {
	const parts = pathname.split("/").filter(Boolean);
	const first = (parts[0] || "").toLowerCase();
	if (first === "en" || first === "ja") return first as SupportedLang;
	return null;
}

export function swapLangInPath(
	pathname: string,
	target: SupportedLang,
): string {
	const parts = pathname.split("/").filter(Boolean);
	const rest = parts[0] === "en" || parts[0] === "ja" ? parts.slice(1) : parts;
	const trailingSlash = pathname.endsWith("/");
	const next = `/${[target, ...rest].join("/")}${trailingSlash ? "/" : ""}`;
	return next;
}
