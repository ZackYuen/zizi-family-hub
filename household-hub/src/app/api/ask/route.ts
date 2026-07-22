import { NextResponse } from "next/server";
import { answerFamilyQuestion } from "@/lib/ask-agent";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      question?: string;
      allowInternet?: boolean;
    };
    const question = body.question?.trim();
    if (!question) {
      return NextResponse.json({ error: "question required" }, { status: 400 });
    }
    if (question.length > 800) {
      return NextResponse.json({ error: "question too long" }, { status: 400 });
    }

    const result = await answerFamilyQuestion(question, {
      allowInternet: body.allowInternet !== false,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("ask error", err);
    return NextResponse.json({ error: "ask failed" }, { status: 500 });
  }
}
