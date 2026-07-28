import { LanguageProvider } from "@/contexts/LanguageContext";
import { HomeApp } from "@/components/HomeApp";
import { FrontendAuthGate } from "@/components/FrontendAuthGate";
import { getContent } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await getContent();

  return (
    <LanguageProvider>
      <FrontendAuthGate>
        <HomeApp content={content} />
      </FrontendAuthGate>
    </LanguageProvider>
  );
}
