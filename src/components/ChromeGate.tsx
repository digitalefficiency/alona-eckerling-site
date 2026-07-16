"use client";
import { usePathname } from "next/navigation";

// Site chrome (header, footer, sticky bar, cookie banner, analytics bootstrap)
// belongs to the PUBLIC site, not to the client's content desk. The CMS addon
// mounts /admin inside the same app, so without this gate an admin would inherit
// the marketing nav, the consent banner, and — worse — fire the analytics
// bootstrap on every editing session.
//
// DORMANT on a site without the CMS: no /admin route exists, so the gate always
// renders its children. usePathname resolves during SSR too, so /admin never
// flashes the chrome before hydration.
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname?.startsWith("/admin/")) return null;
  return <>{children}</>;
}
