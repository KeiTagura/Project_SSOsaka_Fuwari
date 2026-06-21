import I18nKey from "@i18n/i18nKey";
import { i18n, i18nFor } from "@i18n/translation";
import { LinkPreset, type NavBarLink } from "@/types/config";

export function getLinkPresets(lang?: string): {
	[key in LinkPreset]: NavBarLink;
} {
	const t = lang ? i18nFor(lang) : i18n;
	return {
		[LinkPreset.Home]: {
			name: t(I18nKey.home),
			url: "/",
		},
		[LinkPreset.About]: {
			name: t(I18nKey.about),
			url: "/about/",
		},
		[LinkPreset.Archive]: {
			name: "Events",
			url: "/events/",
		},
		[LinkPreset.Events]: {
			name: "Events",
			url: "/events/",
		},
		[LinkPreset.Studio]: {
			name: "Studio",
			url:
				lang === "ja"
					? "/ja/studio/"
					: lang === "en"
						? "/en/studio/"
						: "/studio/",
		},
	};
}

// Backward-compatible constant using global i18n
export const LinkPresets: { [key in LinkPreset]: NavBarLink } =
	getLinkPresets();
