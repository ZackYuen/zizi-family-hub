"use client";

import { GoogleAuthCallback } from "@/components/GoogleAuthCallback";

export default function FrontendGoogleCallbackPage() {
  return (
    <GoogleAuthCallback
      defaultAudience="frontend"
      failHref="/"
      okHref="/"
    />
  );
}
