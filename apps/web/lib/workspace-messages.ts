import type { AppLocale } from "../i18n/messages";

export interface WorkspaceMessages {
  readonly account: string;
  readonly additionalDestinations: string;
  readonly appearance: string;
  readonly chooseDescription: string;
  readonly chooseTitle: string;
  readonly clearSearch: string;
  readonly closeMore: string;
  readonly current: string;
  readonly currentWorkspace: string;
  readonly dashboardDescription: string;
  readonly dashboardTitle: string;
  readonly dateNotSet: string;
  readonly itemUnavailable: string;
  readonly itemUnavailableAction: string;
  readonly more: string;
  readonly noAdditionalAreas: string;
  readonly noWeddings: string;
  readonly noWorkspacesDescription: string;
  readonly noWorkspacesTitle: string;
  readonly planning: string;
  readonly people: string;
  readonly reports: string;
  readonly searchWeddings: string;
  readonly switchCurrent: string;
  readonly weddingUnavailable: string;
  readonly weddingUnavailableAction: string;
  readonly destinations: Readonly<Record<string, string>>;
  readonly roles: Readonly<Record<string, string>>;
}

const en: WorkspaceMessages = {
  account: "Account",
  additionalDestinations: "Additional destinations for",
  appearance: "Appearance",
  chooseDescription: "Choose an accessible wedding workspace to continue.",
  chooseTitle: "Choose a wedding",
  clearSearch: "Clear search",
  closeMore: "Close more navigation",
  current: "Current",
  currentWorkspace: "Current wedding workspace",
  dashboardDescription: "Your wedding workspace is ready for planning.",
  dashboardTitle: "Dashboard",
  dateNotSet: "Date not set",
  itemUnavailable: "This item is unavailable",
  itemUnavailableAction: "Go to this wedding’s Dashboard",
  more: "More",
  noAdditionalAreas: "No additional areas are available.",
  noWeddings: "No weddings found",
  noWorkspacesDescription: "Create a wedding workspace to start planning.",
  noWorkspacesTitle: "No wedding workspaces yet",
  planning: "Planning",
  people: "People",
  reports: "Reports",
  searchWeddings: "Search weddings",
  switchCurrent: "Switch wedding workspace. Current:",
  weddingUnavailable: "This wedding is unavailable",
  weddingUnavailableAction: "View your accessible weddings",
  destinations: {
    dashboard: "Dashboard",
    timeline: "Timeline",
    decisions: "Decisions",
    vendors: "Vendors",
    budget: "Budget",
    guests: "Guests",
    schedule: "Wedding-day schedule",
    contacts: "Contacts",
    "documents-notes": "Documents & notes",
    inspiration: "Inspiration",
    reports: "Reports & exports",
    settings: "Workspace settings",
  },
  roles: {
    partner: "Partner",
    planner: "Planner",
    coordinator: "Coordinator",
    helper: "Helper",
    read_only_guest: "Read-only guest",
  },
};

const messages: Readonly<Record<AppLocale, WorkspaceMessages>> = {
  en,
  nl: {
    ...en,
    account: "Account",
    additionalDestinations: "Extra bestemmingen voor",
    appearance: "Weergave",
    chooseDescription: "Kies een toegankelijke trouwruimte om verder te gaan.",
    chooseTitle: "Kies een bruiloft",
    clearSearch: "Zoekopdracht wissen",
    closeMore: "Meer navigatie sluiten",
    current: "Huidig",
    currentWorkspace: "Huidige trouwruimte",
    dashboardDescription: "Jullie trouwruimte is klaar om te plannen.",
    dateNotSet: "Datum niet ingesteld",
    itemUnavailable: "Dit item is niet beschikbaar",
    itemUnavailableAction: "Ga naar het dashboard van deze bruiloft",
    more: "Meer",
    noAdditionalAreas: "Er zijn geen extra onderdelen beschikbaar.",
    noWeddings: "Geen bruiloften gevonden",
    noWorkspacesDescription: "Maak een trouwruimte aan om te beginnen.",
    noWorkspacesTitle: "Nog geen trouwruimtes",
    planning: "Planning",
    people: "Personen",
    reports: "Rapporten",
    searchWeddings: "Bruiloften zoeken",
    switchCurrent: "Van trouwruimte wisselen. Huidig:",
    weddingUnavailable: "Deze bruiloft is niet beschikbaar",
    weddingUnavailableAction: "Bekijk je toegankelijke bruiloften",
    destinations: {
      ...en.destinations,
      dashboard: "Dashboard",
      timeline: "Tijdlijn",
      decisions: "Beslissingen",
      vendors: "Leveranciers",
      budget: "Budget",
      guests: "Gasten",
      schedule: "Draaiboek",
      contacts: "Contacten",
      "documents-notes": "Documenten en notities",
      inspiration: "Inspiratie",
      reports: "Rapporten en exports",
      settings: "Instellingen van de werkruimte",
    },
    roles: {
      partner: "Partner",
      planner: "Planner",
      coordinator: "Coördinator",
      helper: "Helper",
      read_only_guest: "Alleen-lezen gast",
    },
  },
  fr: {
    ...en,
    account: "Compte",
    additionalDestinations: "Destinations supplémentaires pour",
    appearance: "Apparence",
    chooseDescription:
      "Choisissez un espace de mariage accessible pour continuer.",
    chooseTitle: "Choisissez un mariage",
    clearSearch: "Effacer la recherche",
    closeMore: "Fermer la navigation supplémentaire",
    current: "Actuel",
    currentWorkspace: "Espace de mariage actuel",
    dashboardDescription:
      "Votre espace de mariage est prêt pour la planification.",
    dateNotSet: "Date non définie",
    itemUnavailable: "Cet élément est indisponible",
    itemUnavailableAction: "Aller au tableau de bord de ce mariage",
    more: "Plus",
    noAdditionalAreas: "Aucune zone supplémentaire n’est disponible.",
    noWeddings: "Aucun mariage trouvé",
    noWorkspacesDescription: "Créez un espace de mariage pour commencer.",
    noWorkspacesTitle: "Aucun espace de mariage",
    planning: "Planification",
    people: "Personnes",
    reports: "Rapports",
    searchWeddings: "Rechercher des mariages",
    switchCurrent: "Changer d’espace de mariage. Actuel :",
    weddingUnavailable: "Ce mariage est indisponible",
    weddingUnavailableAction: "Voir vos mariages accessibles",
    destinations: {
      ...en.destinations,
      dashboard: "Tableau de bord",
      timeline: "Chronologie",
      decisions: "Décisions",
      vendors: "Prestataires",
      budget: "Budget",
      guests: "Invités",
      schedule: "Programme du mariage",
      contacts: "Contacts",
      "documents-notes": "Documents et notes",
      inspiration: "Inspiration",
      reports: "Rapports et exports",
      settings: "Paramètres de l’espace",
    },
    roles: {
      partner: "Partenaire",
      planner: "Organisateur",
      coordinator: "Coordinateur",
      helper: "Assistant",
      read_only_guest: "Invité en lecture seule",
    },
  },
  de: {
    ...en,
    account: "Konto",
    additionalDestinations: "Weitere Ziele für",
    appearance: "Darstellung",
    chooseDescription: "Wählt einen zugänglichen Hochzeitsbereich aus.",
    chooseTitle: "Hochzeit auswählen",
    clearSearch: "Suche löschen",
    closeMore: "Weitere Navigation schließen",
    current: "Aktuell",
    currentWorkspace: "Aktueller Hochzeitsbereich",
    dashboardDescription: "Euer Hochzeitsbereich ist bereit für die Planung.",
    dateNotSet: "Datum nicht festgelegt",
    itemUnavailable: "Dieses Element ist nicht verfügbar",
    itemUnavailableAction: "Zum Dashboard dieser Hochzeit",
    more: "Mehr",
    noAdditionalAreas: "Keine weiteren Bereiche verfügbar.",
    noWeddings: "Keine Hochzeiten gefunden",
    noWorkspacesDescription: "Erstellt einen Hochzeitsbereich, um zu beginnen.",
    noWorkspacesTitle: "Noch keine Hochzeitsbereiche",
    planning: "Planung",
    people: "Personen",
    reports: "Berichte",
    searchWeddings: "Hochzeiten suchen",
    switchCurrent: "Hochzeitsbereich wechseln. Aktuell:",
    weddingUnavailable: "Diese Hochzeit ist nicht verfügbar",
    weddingUnavailableAction: "Zugängliche Hochzeiten anzeigen",
    destinations: {
      ...en.destinations,
      dashboard: "Dashboard",
      timeline: "Zeitplan",
      decisions: "Entscheidungen",
      vendors: "Dienstleister",
      budget: "Budget",
      guests: "Gäste",
      schedule: "Hochzeitstagesplan",
      contacts: "Kontakte",
      "documents-notes": "Dokumente und Notizen",
      inspiration: "Inspiration",
      reports: "Berichte und Exporte",
      settings: "Bereichseinstellungen",
    },
    roles: {
      partner: "Partner",
      planner: "Planer",
      coordinator: "Koordinator",
      helper: "Helfer",
      read_only_guest: "Gast mit Lesezugriff",
    },
  },
};

export function workspaceMessages(locale: AppLocale): WorkspaceMessages {
  return messages[locale];
}
