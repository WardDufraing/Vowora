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
