import type { Metadata } from "next";
import { getMessages, setRequestLocale } from "next-intl/server";

import { Navbar } from "@/components/Navbar";
import { ClientIntlProvider } from "@/components/IntlProvider";
import { routing } from "@/i18n/routing";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return {
    title: messages.metadata.title,
    description: messages.metadata.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <ClientIntlProvider locale={locale} messages={messages}>
      <Navbar />
      <main className="flex-1">{children}</main>
    </ClientIntlProvider>
  );
}
