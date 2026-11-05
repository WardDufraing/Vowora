import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { AppShell } from "../../../../components/app-shell";
import { getAuth } from "../../../../lib/auth";
import {
  weddingLocale,
  weddingMessages,
} from "../../../../lib/wedding-messages";
import { resolveWeddingShellNavigation } from "../../../../lib/workspace-navigation";
import { loadWeddingSettingsForActor } from "../../../../lib/wedding-service";
import { WeddingForm } from "../../wedding-form";

export const dynamic = "force-dynamic";

export default async function WeddingSettingsPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly weddingId: string }>;
  readonly searchParams: Promise<{ readonly locale?: string }>;
}) {
  const weddingId = z.uuidv7().safeParse((await params).weddingId);
  if (!weddingId.success) notFound();
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (!session) redirect(`/sign-in?next=/weddings/${weddingId.data}/settings`);

  let pageData;
  try {
    const loaded = await loadWeddingSettingsForActor({
      actorId: session.user.id,
      correlationId: randomUUID(),
      weddingId: weddingId.data,
    });
    if (!loaded) notFound();
    const navigation = resolveWeddingShellNavigation({
      actorId: session.user.id,
      weddingId: weddingId.data,
      membership: loaded.membership,
      workspaces: [
        {
          weddingId: weddingId.data,
          name: loaded.wedding.name,
          weddingDate: loaded.wedding.weddingDate,
          lastOpenedAt: loaded.lastOpenedAt,
          membership: loaded.membership,
        },
      ],
      requestedPath: `/weddings/${weddingId.data}/settings`,
    });
    pageData = { loaded, navigation };
  } catch {
    notFound();
  }
  const locale = weddingLocale((await searchParams).locale);
  const messages = weddingMessages(locale);
  return (
    <AppShell model={pageData.navigation}>
      <div lang={locale}>
        <nav aria-label={messages.language} className="language-links">
          {(["en", "nl", "fr", "de"] as const).map((language) => (
            <a
              aria-current={language === locale ? "page" : undefined}
              href={`/weddings/${weddingId.data}/settings?locale=${language}`}
              key={language}
            >
              {language.toUpperCase()}
            </a>
          ))}
        </nav>
        <p className="eyebrow">{messages.settingsEyebrow}</p>
        <h1>{messages.settingsTitle}</h1>
        <WeddingForm
          endpoint={`/api/v1/weddings/${weddingId.data}`}
          initial={{ ...pageData.loaded.wedding }}
          messages={messages}
          mode="settings"
        />
      </div>
    </AppShell>
  );
}
