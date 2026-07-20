/** Free MyMemory translation EN → Filipino (Tagalog) */
export async function translateEnToFil(text: string): Promise<string> {
  if (!text.trim()) return "";

  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|tl`
  );
  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
  };

  const translated = data.responseData?.translatedText?.trim();
  if (!translated || translated.toUpperCase() === text.toUpperCase()) {
    return text;
  }
  return translated;
}
