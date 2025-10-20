<script lang="ts">
import { onMount } from "svelte";
import I18nKey from "../i18n/i18nKey";
import { i18nFor } from "../i18n/translation";
import { getPostUrlBySlugLang } from "../utils/url-utils";

export let tags: string[] = [];
export let categories: string[] = [];
export let sortedPosts: Post[] = [];

let currentLang: string | null = null;
let t = (k: I18nKey) => i18nFor("ja")(k); // default fallback, will be updated on mount

// NOTE: query parsing moved into onMount to avoid SSR window access

interface Post {
  slug: string;
  data: {
    title: string;
    tags: string[];
    category?: string;
    published: Date;
  };
}

interface Group {
  year: number;
  posts: Post[];
}

type Status = "past" | "upcoming" | "today";
interface EventInfo {
  status: Status;
  label: string;
}
type PostWithStatus = Post & { eventInfo: EventInfo };
type GroupWithStatus = { year: number; posts: PostWithStatus[] };

let groups: Group[] = [];
let groupsWithStatus: GroupWithStatus[] = [];

function formatDate(date: Date) {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}-${day}`;
}
function formatTag(tagList: string[]) {
  return tagList.map((t) => `#${t}`).join(" ");
}

function eventSpaceTime(date: Date): EventInfo {
  const today = new Date();
  // compare by day (ignore time)
  const isSameDay = date.toDateString() === today.toDateString();
  if (isSameDay) return { status: "today", label: t(I18nKey.today) };
  if (date < today) return { status: "past", label: t(I18nKey.past) };
  return { status: "upcoming", label: t(I18nKey.upcoming) };
}

onMount(async () => {
  const params = new URLSearchParams(window.location.search);
  tags = params.has("tag") ? params.getAll("tag") : [];
  categories = params.has("category") ? params.getAll("category") : [];
  const uncategorized = params.get("uncategorized");
  try {
    const q = (params.get('lang') || '').toLowerCase();
    if (q === 'en' || q === 'ja') {
      currentLang = q;
    } else {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const first = parts[0]?.toLowerCase?.();
      currentLang = first === 'en' || first === 'ja' ? first : null;
      if (!currentLang) {
        try {
          const pref = (localStorage.getItem('preferredLang') || '').toLowerCase();
          if (pref === 'en' || pref === 'ja') currentLang = pref;
        } catch {}
      }
      if (!currentLang) {
        currentLang = 'ja';
      }
    }
    if (currentLang) {
      t = i18nFor(currentLang);
    }
  } catch {}

  let filtered: Post[] = sortedPosts;

  // Apply language filter first to show only relevant posts
  if (currentLang) {
    const l = currentLang.toLowerCase();
    filtered = filtered.filter((post) => {
      const slugLang = typeof post.slug === 'string' ? post.slug.split('/')?.[0]?.toLowerCase?.() : undefined;
      // @ts-ignore optional custom frontmatter lang
      const fmLang = (post.data as any)?.lang?.toLowerCase?.();
      const byFrontmatter = !!fmLang && fmLang === l;
      const byFolder = !!slugLang && slugLang === l;
      return byFrontmatter || byFolder;
    });
  }

  if (tags.length > 0) {
    filtered = filtered.filter(
      (post) =>
        Array.isArray(post.data.tags) &&
        post.data.tags.some((tag) => tags.includes(tag)),
    );
  }

  if (categories.length > 0) {
    filtered = filtered.filter(
      (post) => post.data.category && categories.includes(post.data.category),
    );
  }

  if (uncategorized) {
    filtered = filtered.filter((post) => !post.data.category);
  }

  // group by year
  const grouped = filtered.reduce((acc, post) => {
    const year = post.data.published.getFullYear();
    (acc[year] ??= []).push(post);
    return acc;
  }, {} as Record<number, Post[]>);

  groups = Object.keys(grouped)
    .map((yearStr) => ({
      year: Number(yearStr),
      posts: grouped[Number(yearStr)],
    }))
    .sort((a, b) => b.year - a.year);

  // add eventInfo (typed) per post
  groupsWithStatus = groups.map((g) => ({
    year: g.year,
    posts: g.posts.map((p) => ({
      ...p,
      eventInfo: eventSpaceTime(p.data.published),
    })),
  }));
});
</script>

<div class="card-base px-8 py-6">
  {#each groupsWithStatus as group}
    <div>
      <div class="flex flex-row w-full items-center h-[3.75rem]">
        <div class="w-[15%] md:w-[10%] transition text-2xl font-bold text-right text-75">
          {group.year}
        </div>
        <div class="w-[15%] md:w-[10%]">
          <div
            class="h-3 w-3 bg-none rounded-full outline outline-[var(--primary)] mx-auto -outline-offset-[2px] z-50 outline-3"
          ></div>
        </div>
        <div class="w-[70%] md:w-[80%] transition text-left text-50">
          {group.posts.length} {t(group.posts.length === 1 ? I18nKey.event : I18nKey.events)}
        </div>
      </div>

      {#each group.posts as post}
        <a
          href={getPostUrlBySlugLang(post.slug, currentLang || undefined)}
          aria-label={post.data.title}
          class="group btn-plain !block h-10 w-full rounded-lg hover:text-[initial]"
        >
          <div class="flex flex-row justify-start items-center h-full">
            <!-- date -->
            <div class="w-[15%] md:w-[10%] transition text-sm text-right text-50">
              {formatDate(post.data.published)}
            </div>

            <!-- status (colored by status) -->
            <div
              class={`w-[15%] md:w-[10%] transition text-sm text-right
                ${post.eventInfo.status === 'past' ? 'text-red-500' : ''}
                ${post.eventInfo.status === 'upcoming' ? 'text-green-500' : ''}
                ${post.eventInfo.status === 'today' ? 'text-yellow-500' : ''}`}
            >
              {post.eventInfo.label}
            </div>

            <!-- dot + vertical line -->
            <div class="w-[15%] md:w-[10%] relative dash-line h-full flex items-center">
              <div
                class={`transition-all mx-auto w-1 h-1 rounded group-hover:h-5
                    ${post.eventInfo.status === 'past' ? 'bg-red-500' : ''}
                    ${post.eventInfo.status === 'upcoming' ? 'bg-green-500' : ''}
                    ${post.eventInfo.status === 'today' ? 'bg-yellow-500' : ''}
                    outline outline-4 z-50
                    outline-[var(--card-bg)]
                    group-hover:outline-[var(--btn-plain-bg-hover)]
                    group-active:outline-[var(--btn-plain-bg-active)]`}
              ></div>
            </div>

            <!-- title -->
            <div
              class="w-[70%] md:max-w-[65%] md:w-[65%] text-left font-bold
                     group-hover:translate-x-1 transition-all group-hover:text-[var(--primary)]
                     text-75 pr-8 whitespace-nowrap overflow-ellipsis overflow-hidden"
            >
              {post.data.title}
            </div>

            <!-- tags -->
            <div
              class="hidden md:block md:w-[15%] text-left text-sm transition
                     whitespace-nowrap overflow-ellipsis overflow-hidden text-30"
            >
              {formatTag(post.data.tags)}
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/each}
</div>

