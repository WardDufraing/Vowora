import { appLocales, type AppLocale } from "../i18n/messages";

export interface WeddingFormMessages {
  readonly createEyebrow: string;
  readonly createTitle: string;
  readonly createIntro: string;
  readonly settingsEyebrow: string;
  readonly settingsTitle: string;
  readonly name: string;
  readonly nameDescription: string;
  readonly date: string;
  readonly dateDescription: string;
  readonly timeZone: string;
  readonly timeZoneDescription: string;
  readonly optional: string;
  readonly create: string;
  readonly save: string;
  readonly saving: string;
  readonly invalidName: string;
  readonly invalidDate: string;
  readonly invalidTimeZone: string;
  readonly errorTitle: string;
  readonly requestError: string;
  readonly saved: string;
  readonly language: string;
  readonly unsavedTitle: string;
  readonly unsavedDescription: string;
  readonly unsavedSave: string;
  readonly unsavedDiscard: string;
  readonly unsavedStay: string;
  readonly invitationTitle: string;
  readonly invitationIntro: string;
  readonly invitationEmail: string;
  readonly invitationEmailDescription: string;
  readonly invitationSend: string;
  readonly invitationSending: string;
  readonly invitationSent: string;
  readonly invitationPending: string;
  readonly invitationExpires: string;
  readonly invitationCopy: string;
  readonly invitationError: string;
  readonly invitationRevoke: string;
  readonly invitationRevoking: string;
  readonly invitationRevoked: string;
  readonly invitationAcceptTitle: string;
  readonly invitationAcceptIntro: string;
  readonly invitationAccept: string;
  readonly invitationAccepting: string;
  readonly invitationAcceptError: string;
  readonly invitationExpired: string;
}

const en: WeddingFormMessages = {
  createEyebrow: "Wedding workspace",
  createTitle: "Create your wedding workspace",
  createIntro: "Start with the details you know. You can update them later.",
  settingsEyebrow: "Workspace settings",
  settingsTitle: "Wedding details",
  name: "Wedding name",
  nameDescription: "Use a name both partners will recognize.",
  date: "Wedding date",
  dateDescription: "This is a calendar date and does not shift by time zone.",
  timeZone: "Wedding time zone",
  timeZoneDescription: "Used for schedules and reminders.",
  optional: "Optional",
  create: "Create workspace",
  save: "Save changes",
  saving: "Saving…",
  invalidName: "Enter a wedding name.",
  invalidDate: "Enter a valid calendar date.",
  invalidTimeZone: "Enter a supported time zone, such as Europe/Brussels.",
  errorTitle: "Check the highlighted fields",
  requestError:
    "Your changes could not be saved. Review the details and try again.",
  saved: "Wedding settings saved.",
  language: "Language",
  unsavedTitle: "Unsaved changes",
  unsavedDescription: "Save your wedding settings before leaving this page?",
  unsavedSave: "Save",
  unsavedDiscard: "Discard",
  unsavedStay: "Stay",
  invitationTitle: "Invite your partner",
  invitationIntro:
    "The invitation expires after 14 days and can be used only by the verified invited email address.",
  invitationEmail: "Partner email",
  invitationEmailDescription: "We use this address to verify who may join.",
  invitationSend: "Create invitation",
  invitationSending: "Creating invitation…",
  invitationSent:
    "Invitation created. Share this secure link only with your partner.",
  invitationPending:
    "An invitation is pending. Revoke it to create and share a replacement link.",
  invitationExpires: "Expires:",
  invitationCopy: "Copy invitation link",
  invitationError:
    "The invitation could not be created. A partner or pending invitation may already exist.",
  invitationRevoke: "Revoke invitation",
  invitationRevoking: "Revoking invitation…",
  invitationRevoked: "Invitation revoked.",
  invitationAcceptTitle: "Join this wedding",
  invitationAcceptIntro:
    "Confirm to join as an equal partner. You must be signed in with the verified invited email address.",
  invitationAccept: "Accept invitation",
  invitationAccepting: "Accepting invitation…",
  invitationAcceptError:
    "This invitation cannot be accepted with this account. It may be expired or already used.",
  invitationExpired:
    "This invitation has expired. Ask an existing partner for a replacement invitation.",
};

const messages: Readonly<Record<AppLocale, WeddingFormMessages>> = {
  en,
  nl: {
    ...en,
    createEyebrow: "Trouwruimte",
    createTitle: "Maak jullie trouwruimte aan",
    createIntro: "Begin met wat je al weet. Je kunt dit later aanpassen.",
    settingsEyebrow: "Instellingen van de werkruimte",
    settingsTitle: "Trouwgegevens",
    name: "Naam van de bruiloft",
    nameDescription: "Kies een naam die beide partners herkennen.",
    date: "Trouwdatum",
    dateDescription:
      "Dit is een kalenderdatum en verschuift niet door de tijdzone.",
    timeZone: "Tijdzone van de bruiloft",
    timeZoneDescription: "Wordt gebruikt voor planningen en herinneringen.",
    optional: "Optioneel",
    create: "Werkruimte aanmaken",
    save: "Wijzigingen opslaan",
    saving: "Opslaan…",
    invalidName: "Vul een naam voor de bruiloft in.",
    invalidDate: "Vul een geldige kalenderdatum in.",
    invalidTimeZone: "Vul een ondersteunde tijdzone in, zoals Europe/Brussels.",
    errorTitle: "Controleer de gemarkeerde velden",
    requestError:
      "Je wijzigingen konden niet worden opgeslagen. Controleer de gegevens en probeer opnieuw.",
    saved: "De trouwinstellingen zijn opgeslagen.",
    language: "Taal",
    unsavedTitle: "Niet-opgeslagen wijzigingen",
    unsavedDescription:
      "Wil je de trouwinstellingen opslaan voordat je deze pagina verlaat?",
    unsavedSave: "Opslaan",
    unsavedDiscard: "Negeren",
    unsavedStay: "Blijven",
    invitationTitle: "Nodig je partner uit",
    invitationIntro:
      "De uitnodiging verloopt na 14 dagen en werkt alleen met het geverifieerde uitgenodigde e-mailadres.",
    invitationEmail: "E-mailadres van je partner",
    invitationEmailDescription:
      "We gebruiken dit adres om te controleren wie mag deelnemen.",
    invitationSend: "Uitnodiging aanmaken",
    invitationSending: "Uitnodiging aanmaken…",
    invitationSent:
      "Uitnodiging aangemaakt. Deel deze beveiligde link alleen met je partner.",
    invitationPending:
      "Er staat een uitnodiging open. Trek ze in om een nieuwe link aan te maken en te delen.",
    invitationExpires: "Verloopt op:",
    invitationCopy: "Uitnodigingslink kopiëren",
    invitationError:
      "De uitnodiging kon niet worden aangemaakt. Er bestaat mogelijk al een partner of openstaande uitnodiging.",
    invitationRevoke: "Uitnodiging intrekken",
    invitationRevoking: "Uitnodiging intrekken…",
    invitationRevoked: "Uitnodiging ingetrokken.",
    invitationAcceptTitle: "Neem deel aan deze bruiloft",
    invitationAcceptIntro:
      "Bevestig om als gelijkwaardige partner deel te nemen. Meld je aan met het geverifieerde uitgenodigde e-mailadres.",
    invitationAccept: "Uitnodiging accepteren",
    invitationAccepting: "Uitnodiging accepteren…",
    invitationAcceptError:
      "Deze uitnodiging kan niet met dit account worden geaccepteerd. Ze is mogelijk verlopen of al gebruikt.",
    invitationExpired:
      "Deze uitnodiging is verlopen. Vraag een bestaande partner om een nieuwe uitnodiging.",
  },
  fr: {
    ...en,
    createEyebrow: "Espace du mariage",
    createTitle: "Créez votre espace de mariage",
    createIntro:
      "Commencez par les informations connues. Vous pourrez les modifier ensuite.",
    settingsEyebrow: "Paramètres de l’espace",
    settingsTitle: "Informations du mariage",
    name: "Nom du mariage",
    nameDescription:
      "Choisissez un nom reconnaissable par les deux partenaires.",
    date: "Date du mariage",
    dateDescription:
      "Cette date calendrier ne change pas selon le fuseau horaire.",
    timeZone: "Fuseau horaire du mariage",
    timeZoneDescription: "Utilisé pour le programme et les rappels.",
    optional: "Facultatif",
    create: "Créer l’espace",
    save: "Enregistrer",
    saving: "Enregistrement…",
    invalidName: "Saisissez un nom pour le mariage.",
    invalidDate: "Saisissez une date calendrier valide.",
    invalidTimeZone:
      "Saisissez un fuseau pris en charge, comme Europe/Brussels.",
    errorTitle: "Vérifiez les champs signalés",
    requestError:
      "Vos modifications n’ont pas été enregistrées. Vérifiez les informations et réessayez.",
    saved: "Les paramètres du mariage sont enregistrés.",
    language: "Langue",
    unsavedTitle: "Modifications non enregistrées",
    unsavedDescription:
      "Enregistrer les paramètres du mariage avant de quitter cette page ?",
    unsavedSave: "Enregistrer",
    unsavedDiscard: "Ignorer",
    unsavedStay: "Rester",
    invitationTitle: "Invitez votre partenaire",
    invitationIntro:
      "L’invitation expire après 14 jours et fonctionne uniquement avec l’adresse invitée vérifiée.",
    invitationEmail: "Adresse e-mail du partenaire",
    invitationEmailDescription:
      "Nous utilisons cette adresse pour vérifier qui peut rejoindre l’espace.",
    invitationSend: "Créer l’invitation",
    invitationSending: "Création de l’invitation…",
    invitationSent:
      "Invitation créée. Partagez ce lien sécurisé uniquement avec votre partenaire.",
    invitationPending:
      "Une invitation est en attente. Révoquez-la pour créer et partager un nouveau lien.",
    invitationExpires: "Expire le :",
    invitationCopy: "Copier le lien d’invitation",
    invitationError:
      "L’invitation n’a pas pu être créée. Un partenaire ou une invitation en attente existe peut-être déjà.",
    invitationRevoke: "Révoquer l’invitation",
    invitationRevoking: "Révocation de l’invitation…",
    invitationRevoked: "Invitation révoquée.",
    invitationAcceptTitle: "Rejoindre ce mariage",
    invitationAcceptIntro:
      "Confirmez pour rejoindre comme partenaire à égalité. Connectez-vous avec l’adresse invitée vérifiée.",
    invitationAccept: "Accepter l’invitation",
    invitationAccepting: "Acceptation de l’invitation…",
    invitationAcceptError:
      "Cette invitation ne peut pas être acceptée avec ce compte. Elle a peut-être expiré ou déjà été utilisée.",
    invitationExpired:
      "Cette invitation a expiré. Demandez une nouvelle invitation à un partenaire existant.",
  },
  de: {
    ...en,
    createEyebrow: "Hochzeitsbereich",
    createTitle: "Erstellt euren Hochzeitsbereich",
    createIntro:
      "Beginnt mit den bekannten Angaben. Ihr könnt sie später ändern.",
    settingsEyebrow: "Bereichseinstellungen",
    settingsTitle: "Hochzeitsdetails",
    name: "Name der Hochzeit",
    nameDescription: "Wählt einen Namen, den beide Partner erkennen.",
    date: "Hochzeitsdatum",
    dateDescription:
      "Dieses Kalenderdatum verschiebt sich nicht durch die Zeitzone.",
    timeZone: "Zeitzone der Hochzeit",
    timeZoneDescription: "Wird für Zeitpläne und Erinnerungen verwendet.",
    optional: "Optional",
    create: "Bereich erstellen",
    save: "Änderungen speichern",
    saving: "Speichern…",
    invalidName: "Gebt einen Namen für die Hochzeit ein.",
    invalidDate: "Gebt ein gültiges Kalenderdatum ein.",
    invalidTimeZone:
      "Gebt eine unterstützte Zeitzone ein, etwa Europe/Brussels.",
    errorTitle: "Prüft die markierten Felder",
    requestError:
      "Die Änderungen konnten nicht gespeichert werden. Prüft die Angaben und versucht es erneut.",
    saved: "Die Hochzeitseinstellungen wurden gespeichert.",
    language: "Sprache",
    unsavedTitle: "Nicht gespeicherte Änderungen",
    unsavedDescription:
      "Möchtet ihr die Hochzeitseinstellungen speichern, bevor ihr diese Seite verlasst?",
    unsavedSave: "Speichern",
    unsavedDiscard: "Verwerfen",
    unsavedStay: "Bleiben",
    invitationTitle: "Partner einladen",
    invitationIntro:
      "Die Einladung läuft nach 14 Tagen ab und gilt nur für die verifizierte eingeladene E-Mail-Adresse.",
    invitationEmail: "E-Mail-Adresse des Partners",
    invitationEmailDescription:
      "Wir verwenden diese Adresse, um den Beitritt zu prüfen.",
    invitationSend: "Einladung erstellen",
    invitationSending: "Einladung wird erstellt…",
    invitationSent:
      "Einladung erstellt. Teilt diesen sicheren Link nur mit eurem Partner.",
    invitationPending:
      "Eine Einladung ist offen. Widerruft sie, um einen neuen Link zu erstellen und zu teilen.",
    invitationExpires: "Läuft ab am:",
    invitationCopy: "Einladungslink kopieren",
    invitationError:
      "Die Einladung konnte nicht erstellt werden. Möglicherweise gibt es bereits einen Partner oder eine offene Einladung.",
    invitationRevoke: "Einladung widerrufen",
    invitationRevoking: "Einladung wird widerrufen…",
    invitationRevoked: "Einladung widerrufen.",
    invitationAcceptTitle: "Dieser Hochzeit beitreten",
    invitationAcceptIntro:
      "Bestätigt den Beitritt als gleichberechtigter Partner. Meldet euch mit der verifizierten eingeladenen E-Mail-Adresse an.",
    invitationAccept: "Einladung annehmen",
    invitationAccepting: "Einladung wird angenommen…",
    invitationAcceptError:
      "Diese Einladung kann mit diesem Konto nicht angenommen werden. Sie ist möglicherweise abgelaufen oder bereits verwendet.",
    invitationExpired:
      "Diese Einladung ist abgelaufen. Bittet einen bestehenden Partner um eine neue Einladung.",
  },
};

export function weddingLocale(value: unknown): AppLocale {
  return typeof value === "string" && appLocales.includes(value as AppLocale)
    ? (value as AppLocale)
    : "en";
}

export function weddingMessages(locale: AppLocale): WeddingFormMessages {
  return messages[locale];
}
