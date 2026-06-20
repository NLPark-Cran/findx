"use client";

import { IntlProvider } from "use-intl/react";

interface Props {
  locale: string;
  messages: Record<string, any>;
  children: React.ReactNode;
}

export function ClientIntlProvider({ locale, messages, children }: Props) {
  return (
    <IntlProvider locale={locale} messages={messages}>
      {children}
    </IntlProvider>
  );
}
