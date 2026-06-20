"use client";

import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";

import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = () => {
    const next = locale === "zh" ? "en" : "zh";
    router.replace(pathname, { locale: next });
  };

  const navItems = [
    { href: "/", label: t("home") },
    { href: "/battle", label: t("battle") },
    { href: "/arena", label: t("arena") },
    { href: "/agent", label: t("agent") },
    { href: "/dashboard", label: t("dashboard") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-foreground">
          找猹 / FindX
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={switchLocale}
            className="inline-flex h-8 items-center justify-center rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted"
          >
            {locale === "zh" ? "EN" : "中"}
          </button>
        </div>
      </div>
    </header>
  );
}
