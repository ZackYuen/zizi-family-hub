import { NextResponse } from "next/server";
import { answerFamilyQuestion } from "@/lib/ask-agent";
import { parseSaveCommand, handleWhatsAppSave } from "@/lib/whatsapp-save";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      question?: string;
      allowInternet?: boolean;
      jid?: string;
      fromName?: string;
    };
    const question = body.question?.trim();
    if (!question) {
      return NextResponse.json({ error: "question required" }, { status: 400 });
    }
    // Saves can include a long URL + notes; asks stay shorter
    const saveCmd = parseSaveCommand(question);
    if (saveCmd) {
      if (saveCmd.text.length > 2000) {
        return NextResponse.json({ error: "save text too long" }, { status: 400 });
      }
      const saved = await handleWhatsAppSave(saveCmd.text, {
        jid: body.jid,
        fromName: body.fromName,
      });
      return NextResponse.json({
        answer: saved.answer,
        handled: "save",
        digest: {
          kind: saved.digest.kind,
          summary: saved.digest.summary,
          link: saved.digest.link,
          category: saved.digest.category,
        },
      });
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
