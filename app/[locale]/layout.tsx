import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await the params
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {/* Skip to content link for screen readers */}
      <a
        href="#main-content"
        className="skip-to-content sr-only focus:static focus:w-auto focus:h-auto focus:p-4 focus:m-0 focus:overflow-visible focus:whitespace-normal bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to content
      </a>

      <div id="root">{children}</div>
    </NextIntlClientProvider>
  );
}
