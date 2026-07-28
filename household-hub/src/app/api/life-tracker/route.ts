import { NextResponse } from "next/server";
import { getContent, saveContent } from "@/lib/data";
import { getHongKongDateKey } from "@/lib/hk-holidays";

export const dynamic = "force-dynamic";

type Body = {
  kind: "holiday" | "salary";
  id: string;
  value: boolean;
};

/**
 * Toggle statutory-holiday "taken" or salary "received" on live content.
 * Family-hub only — flips confirm flags, does not rewrite lists.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    if (
      (body.kind !== "holiday" && body.kind !== "salary") ||
      !body.id ||
      typeof body.value !== "boolean"
    ) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const content = await getContent();
    const today = getHongKongDateKey();

    if (body.kind === "holiday") {
      const list = [...(content.statutoryHolidays ?? [])];
      const idx = list.findIndex((h) => h.id === body.id);
      if (idx < 0) {
        return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
      }
      if (list[idx].entitled === false) {
        return NextResponse.json(
          { error: "Not entitled to this holiday yet" },
          { status: 400 }
        );
      }
      list[idx] = {
        ...list[idx],
        taken: body.value,
        takenOn: body.value ? today : undefined,
      };
      const saved = await saveContent({ ...content, statutoryHolidays: list });
      return NextResponse.json({
        ok: true,
        item: saved.statutoryHolidays?.find((h) => h.id === body.id),
      });
    }

    const list = [...(content.salaryPayments ?? [])];
    const idx = list.findIndex((s) => s.id === body.id);
    if (idx < 0) {
      return NextResponse.json({ error: "Salary row not found" }, { status: 404 });
    }
    list[idx] = {
      ...list[idx],
      received: body.value,
      receivedOn: body.value ? today : undefined,
    };
    const saved = await saveContent({ ...content, salaryPayments: list });
    return NextResponse.json({
      ok: true,
      item: saved.salaryPayments?.find((s) => s.id === body.id),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
