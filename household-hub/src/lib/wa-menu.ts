import { addYoutubeDinnerRecipe } from "./add-youtube-recipe";
import {
  clearDinnerMenuOverride,
  clearWhatsAppMenuPick,
  getDinnerMenuOverrides,
  getDinnerRecipes,
  getWhatsAppMenuPick,
  saveWhatsAppMenuPick,
  upsertDinnerMenuOverride,
} from "./data";
import {
  addHongKongDays,
  hongKongDateKey,
  resolveTonightMenu,
  tonightDishes,
} from "./dinner";
import { getRecipeDisplayName } from "./recipe-display";
import type { DinnerRecipe, TonightMenu, WhatsAppMenuPickOption } from "./types";
import {
  isYoutubeDishToken,
  numberedRecipeLine,
  parseMenuCommand,
  recipeLabel,
  searchSimilarRecipes,
  conflictCategories,
  groupRecipeIds,
  mergeCategoryIds,
  type MenuDay,
  type MenuCat,
} from "./wa-menu-parse";

export { looksLikeMenuCommand, parseMenuCommand } from "./wa-menu-parse";

function dateForDay(day: MenuDay, now = new Date()): string {
  const today = hongKongDateKey(now);
  return day === "tomorrow" ? addHongKongDays(today, 1) : today;
}

function dayTitle(day: MenuDay, dateKey: string): string {
  return day === "tomorrow" ? `Tomorrow (${dateKey})` : `Tonight (${dateKey})`;
}

function dishLine(recipe: DinnerRecipe): string {
  const en = getRecipeDisplayName(recipe, "en");
  const fil = getRecipeDisplayName(recipe, "fil");
  const extra = fil && fil !== en ? ` / ${fil}` : "";
  return `• ${recipe.category}: ${en}${extra}`;
}

function formatMenu(day: MenuDay, menu: TonightMenu | null): string {
  const title = dayTitle(day, menu?.date || dateForDay(day));
  if (!menu) return `${title}: no dishes yet`;
  const dishes = tonightDishes(menu);
  const kind = menu.overridden ? "saved pick" : "random";
  if (!dishes.length) return `${title} — ${kind}: (none)`;
  return [`${title} — ${kind}:`, ...dishes.map(dishLine)].join("\n");
}

export function formatMenuReply(parts: string[]): string {
  return parts.filter(Boolean).join("\n\n");
}

function nameLine(recipe: DinnerRecipe): string {
  const zh = recipe.name?.trim() || "";
  const en = (recipe.nameEn || recipe.nameFil || "").trim();
  const name = zh && en && zh !== en ? `${zh} / ${en}` : en || zh || recipe.id;
  return `• ${name} (${recipe.category})`;
}

function recipesByIds(all: DinnerRecipe[], ids: string[]): DinnerRecipe[] {
  const out: DinnerRecipe[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    const recipe = all.find((r) => r.id === id);
    if (recipe) {
      out.push(recipe);
      seen.add(id);
    }
  }
  return out;
}

async function saveCategoryIds(
  day: MenuDay,
  ids: ReturnType<typeof mergeCategoryIds>,
  allRecipes: DinnerRecipe[]
): Promise<string> {
  const date = dateForDay(day);
  await upsertDinnerMenuOverride({
    date,
    meatIds: ids.Meat,
    vegetableIds: ids.Vegetable,
    soupIds: ids.Soup,
  });
  const latest = await getDinnerRecipes();
  const menu = resolveTonightMenu(latest, date, {
    date,
    meatIds: ids.Meat,
    vegetableIds: ids.Vegetable,
    soupIds: ids.Soup,
  });
  return formatMenuReply([`${dayTitle(day, date)} saved.`, formatMenu(day, menu)]);
}

function formatCategoryConflict(
  day: MenuDay,
  existingMenu: TonightMenu,
  incoming: DinnerRecipe[],
  conflicts: MenuCat[]
): string {
  const date = dateForDay(day);
  const lines = [
    `${dayTitle(day, date)} already has ${conflicts.join(" / ")}. Overwrite or add?`,
  ];
  const existing = tonightDishes(existingMenu);
  for (const cat of conflicts) {
    lines.push("", `Now (${cat}):`);
    for (const r of existing.filter((d) => d.category === cat)) {
      lines.push(nameLine(r));
    }
    lines.push(`Your pick (${cat}):`);
    for (const r of incoming.filter((d) => d.category === cat)) {
      lines.push(nameLine(r));
    }
  }
  lines.push(
    "",
    "?overwrite  — replace that category only (other dishes stay)",
    "?also  — keep the old dish and add this one"
  );
  return lines.join("\n");
}

async function applyIncomingDishes(
  day: MenuDay,
  incoming: DinnerRecipe[],
  allRecipes: DinnerRecipe[],
  overrides: Awaited<ReturnType<typeof getDinnerMenuOverrides>>,
  jid: string,
  session: {
    options: WhatsAppMenuPickOption[];
    preselectedIds: string[];
  },
  mode?: "overwrite" | "also"
): Promise<string> {
  if (!incoming.length) return "Add at least one dish.";
  const date = dateForDay(day);
  const current = resolveTonightMenu(
    allRecipes,
    date,
    overrides.byDate[date] ?? null
  );
  const existingIds = groupRecipeIds(tonightDishes(current));
  const incomingIds = groupRecipeIds(incoming);
  const newDishes = incoming.filter(
    (r) => !existingIds[r.category].includes(r.id)
  );

  if (!newDishes.length) {
    await clearWhatsAppMenuPick(jid);
    return formatMenuReply([
      `${dayTitle(day, date)} already has that dish.`,
      formatMenu(day, current),
    ]);
  }

  const conflicts = conflictCategories(existingIds, incomingIds);
  if (conflicts.length && !mode) {
    await saveWhatsAppMenuPick({
      jid,
      day,
      options: session.options,
      preselectedIds: session.preselectedIds,
      incomingIds: incoming.map((r) => r.id),
      createdAt: new Date().toISOString(),
    });
    return formatCategoryConflict(day, current, newDishes, conflicts);
  }

  const merged = mergeCategoryIds(
    existingIds,
    incomingIds,
    mode || "also"
  );
  await clearWhatsAppMenuPick(jid);
  return saveCategoryIds(day, merged, allRecipes);
}

function formatPickList(
  day: MenuDay,
  groups: { query: string; options: WhatsAppMenuPickOption[] }[],
  preselected: DinnerRecipe[]
): string {
  const date = dateForDay(day);
  const lines = [
    `${dayTitle(day, date)} — similar recipes. Reply with a number:`,
  ];
  if (preselected.length) {
    lines.push("", "Already from link:");
    for (const r of preselected) lines.push(`• ${recipeLabel(r)} (${r.category})`);
  }
  for (const group of groups) {
    lines.push("", `Similar to “${group.query}”:`);
    for (const opt of group.options) {
      lines.push(opt.label);
    }
  }
  const cmd = day === "tomorrow" ? "tomorrow" : "today";
  const sample = groups[0]?.options[0]?.n ?? 1;
  const extra = groups.flatMap((g) => g.options).map((o) => o.n);
  const two = extra.length > 1 ? `${extra[0]}, ${extra[extra.length - 1]}` : String(sample);
  lines.push("", `Reply: ?${cmd} ${sample}`);
  if (extra.length > 1) lines.push(`Or several: ?${cmd} ${two}`);
  lines.push("Or just: ?1");
  return lines.join("\n");
}

export async function handleWhatsAppMenu(
  question: string,
  meta?: { jid?: string }
): Promise<{
  answer: string;
  handled: "menu";
}> {
  const jid = (meta?.jid || "ask").trim() || "ask";
  const parsed = parseMenuCommand(question);
  if (!parsed) {
    return {
      handled: "menu",
      answer:
        "Try:\n?today honey wings, garlic cabbage\nThen reply ?today 1\n?tomorrow https://youtube.com/… or Instagram reel\n?menu",
    };
  }

  const [recipes, overrides] = await Promise.all([
    getDinnerRecipes(),
    getDinnerMenuOverrides(),
  ]);

  if (parsed.action === "show") {
    const blocks = parsed.days.map((day) => {
      const date = dateForDay(day);
      const menu = recipes.length
        ? resolveTonightMenu(recipes, date, overrides.byDate[date] ?? null)
        : null;
      return formatMenu(day, menu);
    });
    return { handled: "menu", answer: formatMenuReply(blocks) };
  }

  if (parsed.action === "clear") {
    const blocks: string[] = [];
    for (const day of parsed.days) {
      const date = dateForDay(day);
      await clearDinnerMenuOverride(date);
      const menu = recipes.length ? resolveTonightMenu(recipes, date, null) : null;
      blocks.push(`${dayTitle(day, date)} back to random.`);
      if (menu) blocks.push(formatMenu(day, menu));
    }
    return { handled: "menu", answer: formatMenuReply(blocks) };
  }

  if (parsed.action === "merge") {
    const session = await getWhatsAppMenuPick(jid);
    if (!session?.incomingIds?.length) {
      return {
        handled: "menu",
        answer:
          "Nothing waiting to confirm. Pick a dish number first, e.g. ?today 1\nThen ?overwrite or ?also",
      };
    }
    const incoming = recipesByIds(recipes, session.incomingIds);
    return {
      handled: "menu",
      answer: await applyIncomingDishes(
        session.day,
        incoming,
        recipes,
        overrides,
        jid,
        session,
        parsed.mode
      ),
    };
  }

  if (parsed.action === "pick") {
    const session = await getWhatsAppMenuPick(jid);
    if (!session) {
      return {
        handled: "menu",
        answer:
          "No numbered list waiting. Send a dish name first, e.g.\n?today honey wings\nThen reply ?today 1",
      };
    }
    const byN = new Map(session.options.map((o) => [o.n, o]));
    const missing = parsed.numbers.filter((n) => !byN.has(n));
    if (missing.length) {
      return {
        handled: "menu",
        answer: formatMenuReply([
          `Not on the list: ${missing.join(", ")}. Use a number from the last list.`,
          session.options.map((o) => o.label).join("\n"),
          `Reply: ?today ${session.options[0]?.n ?? 1}`,
        ]),
      };
    }
    const pickedIds = [
      ...session.preselectedIds,
      ...parsed.numbers.map((n) => byN.get(n)!.id),
    ];
    const picked = recipesByIds(recipes, pickedIds);
    return {
      handled: "menu",
      answer: await applyIncomingDishes(
        session.day,
        picked,
        recipes,
        overrides,
        jid,
        session
      ),
    };
  }

  const blocks: string[] = [];
  for (const assignment of parsed.assignments) {
    const mediaTokens = assignment.dishes.filter((d) => isYoutubeDishToken(d));
    const nameTokens = assignment.dishes.filter((d) => !isYoutubeDishToken(d));
    let pool = recipes;
    const preselected: DinnerRecipe[] = [];
    const addedFromLink: string[] = [];

    for (const token of mediaTokens) {
      const added = await addYoutubeDinnerRecipe(token);
      pool = await getDinnerRecipes();
      if (!preselected.some((r) => r.id === added.recipe.id)) {
        preselected.push(added.recipe);
      }
      if (!added.duplicate) addedFromLink.push(recipeLabel(added.recipe));
    }

    if (!nameTokens.length) {
      if (!preselected.length) {
        blocks.push("Add at least one dish.");
        continue;
      }
      let text = await applyIncomingDishes(
        assignment.day,
        preselected,
        pool,
        overrides,
        jid,
        { options: [], preselectedIds: preselected.map((r) => r.id) }
      );
      if (addedFromLink.length) {
        text = formatMenuReply([
          `Also added to Meals: ${addedFromLink.join(", ")}`,
          text,
        ]);
      }
      blocks.push(text);
      continue;
    }

    const groups: { query: string; options: WhatsAppMenuPickOption[] }[] = [];
    const options: WhatsAppMenuPickOption[] = [];
    const unmatched: string[] = [];
    let n = 1;
    const usedIds = new Set(preselected.map((r) => r.id));

    for (const query of nameTokens) {
      const similar = searchSimilarRecipes(query, pool).filter(
        (s) => !usedIds.has(s.recipe.id)
      );
      if (!similar.length) {
        unmatched.push(query);
        continue;
      }
      const groupOpts: WhatsAppMenuPickOption[] = [];
      for (const hit of similar) {
        usedIds.add(hit.recipe.id);
        const opt: WhatsAppMenuPickOption = {
          n,
          id: hit.recipe.id,
          category: hit.recipe.category,
          label: numberedRecipeLine(n, hit.recipe),
          query,
        };
        options.push(opt);
        groupOpts.push(opt);
        n += 1;
      }
      groups.push({ query, options: groupOpts });
    }

    if (!options.length) {
      blocks.push(
        [
          unmatched.length
            ? `No similar Meals for: ${unmatched.join(", ")}`
            : "No similar Meals.",
          "Try another name, or paste a YouTube / Instagram link:",
          "?today https://youtube.com/…",
        ].join("\n")
      );
      continue;
    }

    await saveWhatsAppMenuPick({
      jid,
      day: assignment.day,
      options,
      preselectedIds: preselected.map((r) => r.id),
      createdAt: new Date().toISOString(),
    });

    const extra = [
      unmatched.length ? `No similar Meals for: ${unmatched.join(", ")}` : "",
      addedFromLink.length ? `Added to Meals library: ${addedFromLink.join(", ")}` : "",
    ];
    blocks.push(formatMenuReply([formatPickList(assignment.day, groups, preselected), ...extra]));
  }

  return { handled: "menu", answer: formatMenuReply(blocks) };
}
