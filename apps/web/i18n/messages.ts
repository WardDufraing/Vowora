export const appLocales = ["en", "nl", "fr", "de"] as const;
export type AppLocale = (typeof appLocales)[number];

const en = {
  SharedPatterns: {
    eyebrow: "Shared patterns · synthetic content",
    title: "Accessible patterns for every workspace",
    intro:
      "Forms, records and dates stay understandable across languages and screen sizes.",
    formTitle: "Structured form",
    formDescription:
      "This example validates locally and does not save product data.",
    nameLabel: "Example title",
    nameDescription: "Use a clear title that people can recognize.",
    nameError: "Enter an example title.",
    dateLabel: "Example wedding date",
    dateDescription: "Enter a calendar date in the displayed local format.",
    dateError: "Enter a valid date.",
    optional: "Optional",
    submit: "Review example",
    errorSummaryTitle: "Check the highlighted fields",
    dialogTitle: "Confirm this example",
    dialogDescription:
      "This demonstrates confirmation behavior and does not change data.",
    confirm: "Confirm example",
    cancel: "Keep editing",
    recordsTitle: "Responsive records",
    recordsDescription:
      "The table and mobile list expose the same facts and selection state.",
    task: "Task",
    owner: "Owner",
    status: "Status",
    selection: "Selection",
    selected: "Selected",
    notSelected: "Not selected",
    selectRecord: "Select {title}",
    sortByTask: "Sort by task, currently {direction}",
    ascending: "ascending",
    descending: "descending",
    couple: "Couple",
    planner: "Planner",
    reviewGuestList: "Review guest list",
    confirmVenueDetails: "Confirm venue details",
    inProgress: "In progress",
    confirmed: "Confirmed",
    selectedCount:
      "{count, plural, =0 {No records selected} one {# record selected} other {# records selected}}",
    statesTitle: "Truthful view states",
    loadingTitle: "Loading records",
    loadingBody: "The records are still loading.",
    emptyTitle: "No records yet",
    emptyBody:
      "Records will appear here when an approved workflow creates them.",
    errorTitle: "Records could not be loaded",
    errorBody: "Try again only when the owning feature supports a retry.",
    restrictedTitle: "Records are unavailable",
    restrictedBody: "Your current access does not include this information.",
    dateTitle: "Wedding-local date and time",
    dateOnlyLabel: "Calendar date",
    instantLabel: "Local time in Europe/Brussels",
    longLabel:
      "A deliberately long translated label demonstrates resilient wrapping without hiding required context",
  },
} as const;

export type AppMessages = {
  readonly SharedPatterns: {
    readonly [Key in keyof typeof en.SharedPatterns]: string;
  };
};

const nl: AppMessages = {
  SharedPatterns: {
    eyebrow: "Gedeelde patronen · synthetische inhoud",
    title: "Toegankelijke patronen voor elke werkruimte",
    intro:
      "Formulieren, records en datums blijven begrijpelijk in elke taal en op elk scherm.",
    formTitle: "Gestructureerd formulier",
    formDescription:
      "Dit voorbeeld valideert lokaal en slaat geen productgegevens op.",
    nameLabel: "Voorbeeldtitel",
    nameDescription: "Gebruik een duidelijke, herkenbare titel.",
    nameError: "Vul een voorbeeldtitel in.",
    dateLabel: "Voorbeeld van de trouwdatum",
    dateDescription: "Vul een kalenderdatum in het getoonde lokale formaat in.",
    dateError: "Vul een geldige datum in.",
    optional: "Optioneel",
    submit: "Voorbeeld bekijken",
    errorSummaryTitle: "Controleer de gemarkeerde velden",
    dialogTitle: "Bevestig dit voorbeeld",
    dialogDescription: "Dit toont bevestigingsgedrag en wijzigt geen gegevens.",
    confirm: "Voorbeeld bevestigen",
    cancel: "Verder bewerken",
    recordsTitle: "Responsieve records",
    recordsDescription:
      "De tabel en mobiele lijst tonen dezelfde gegevens en selectiestatus.",
    task: "Taak",
    owner: "Eigenaar",
    status: "Status",
    selection: "Selectie",
    selected: "Geselecteerd",
    notSelected: "Niet geselecteerd",
    selectRecord: "Selecteer {title}",
    sortByTask: "Sorteer op taak, momenteel {direction}",
    ascending: "oplopend",
    descending: "aflopend",
    couple: "Koppel",
    planner: "Planner",
    reviewGuestList: "Gastenlijst controleren",
    confirmVenueDetails: "Locatiegegevens bevestigen",
    inProgress: "Bezig",
    confirmed: "Bevestigd",
    selectedCount:
      "{count, plural, =0 {Geen records geselecteerd} one {# record geselecteerd} other {# records geselecteerd}}",
    statesTitle: "Eerlijke weergavestaten",
    loadingTitle: "Records laden",
    loadingBody: "De records worden nog geladen.",
    emptyTitle: "Nog geen records",
    emptyBody:
      "Records verschijnen hier wanneer een goedgekeurde workflow ze aanmaakt.",
    errorTitle: "Records konden niet worden geladen",
    errorBody:
      "Probeer alleen opnieuw wanneer de bijbehorende functie dat ondersteunt.",
    restrictedTitle: "Records zijn niet beschikbaar",
    restrictedBody: "Uw huidige toegang omvat deze informatie niet.",
    dateTitle: "Trouwdatum en -tijd in lokale tijd",
    dateOnlyLabel: "Kalenderdatum",
    instantLabel: "Lokale tijd in Europa/Brussel",
    longLabel:
      "Een bewust lang vertaald label toont robuuste tekstomloop zonder vereiste context te verbergen",
  },
};

const fr: AppMessages = {
  SharedPatterns: {
    eyebrow: "Modèles partagés · contenu synthétique",
    title: "Des modèles accessibles pour chaque espace de travail",
    intro:
      "Les formulaires, les enregistrements et les dates restent compréhensibles dans chaque langue et sur chaque écran.",
    formTitle: "Formulaire structuré",
    formDescription:
      "Cet exemple effectue une validation locale et n’enregistre aucune donnée produit.",
    nameLabel: "Titre d’exemple",
    nameDescription: "Utilisez un titre clair et reconnaissable.",
    nameError: "Saisissez un titre d’exemple.",
    dateLabel: "Date de mariage d’exemple",
    dateDescription:
      "Saisissez une date calendrier dans le format local affiché.",
    dateError: "Saisissez une date valide.",
    optional: "Facultatif",
    submit: "Examiner l’exemple",
    errorSummaryTitle: "Vérifiez les champs signalés",
    dialogTitle: "Confirmer cet exemple",
    dialogDescription:
      "Ceci illustre la confirmation sans modifier de données.",
    confirm: "Confirmer l’exemple",
    cancel: "Continuer la modification",
    recordsTitle: "Enregistrements adaptatifs",
    recordsDescription:
      "Le tableau et la liste mobile présentent les mêmes informations et le même état de sélection.",
    task: "Tâche",
    owner: "Responsable",
    status: "Statut",
    selection: "Sélection",
    selected: "Sélectionné",
    notSelected: "Non sélectionné",
    selectRecord: "Sélectionner {title}",
    sortByTask: "Trier par tâche, actuellement {direction}",
    ascending: "croissant",
    descending: "décroissant",
    couple: "Couple",
    planner: "Organisateur",
    reviewGuestList: "Vérifier la liste des invités",
    confirmVenueDetails: "Confirmer les détails du lieu",
    inProgress: "En cours",
    confirmed: "Confirmé",
    selectedCount:
      "{count, plural, =0 {Aucun enregistrement sélectionné} one {# enregistrement sélectionné} other {# enregistrements sélectionnés}}",
    statesTitle: "États d’affichage fidèles",
    loadingTitle: "Chargement des enregistrements",
    loadingBody: "Les enregistrements sont encore en cours de chargement.",
    emptyTitle: "Aucun enregistrement pour le moment",
    emptyBody:
      "Les enregistrements apparaîtront lorsqu’un flux approuvé les créera.",
    errorTitle: "Impossible de charger les enregistrements",
    errorBody:
      "Réessayez uniquement si la fonctionnalité concernée prend en charge une nouvelle tentative.",
    restrictedTitle: "Enregistrements indisponibles",
    restrictedBody: "Votre accès actuel n’inclut pas ces informations.",
    dateTitle: "Date et heure locales du mariage",
    dateOnlyLabel: "Date calendrier",
    instantLabel: "Heure locale en Europe/Bruxelles",
    longLabel:
      "Un libellé traduit volontairement long démontre une mise en page robuste sans masquer le contexte requis",
  },
};

const de: AppMessages = {
  SharedPatterns: {
    eyebrow: "Gemeinsame Muster · synthetische Inhalte",
    title: "Barrierearme Muster für jeden Arbeitsbereich",
    intro:
      "Formulare, Datensätze und Datumsangaben bleiben in jeder Sprache und auf jedem Bildschirm verständlich.",
    formTitle: "Strukturiertes Formular",
    formDescription:
      "Dieses Beispiel validiert lokal und speichert keine Produktdaten.",
    nameLabel: "Beispieltitel",
    nameDescription: "Verwenden Sie einen klaren, erkennbaren Titel.",
    nameError: "Geben Sie einen Beispieltitel ein.",
    dateLabel: "Beispiel für das Hochzeitsdatum",
    dateDescription:
      "Geben Sie ein Kalenderdatum im angezeigten lokalen Format ein.",
    dateError: "Geben Sie ein gültiges Datum ein.",
    optional: "Optional",
    submit: "Beispiel prüfen",
    errorSummaryTitle: "Prüfen Sie die markierten Felder",
    dialogTitle: "Dieses Beispiel bestätigen",
    dialogDescription:
      "Dies zeigt das Bestätigungsverhalten und ändert keine Daten.",
    confirm: "Beispiel bestätigen",
    cancel: "Weiter bearbeiten",
    recordsTitle: "Responsive Datensätze",
    recordsDescription:
      "Tabelle und mobile Liste zeigen dieselben Fakten und denselben Auswahlstatus.",
    task: "Aufgabe",
    owner: "Verantwortlich",
    status: "Status",
    selection: "Auswahl",
    selected: "Ausgewählt",
    notSelected: "Nicht ausgewählt",
    selectRecord: "{title} auswählen",
    sortByTask: "Nach Aufgabe sortieren, derzeit {direction}",
    ascending: "aufsteigend",
    descending: "absteigend",
    couple: "Paar",
    planner: "Planung",
    reviewGuestList: "Gästeliste prüfen",
    confirmVenueDetails: "Details zum Veranstaltungsort bestätigen",
    inProgress: "In Bearbeitung",
    confirmed: "Bestätigt",
    selectedCount:
      "{count, plural, =0 {Keine Datensätze ausgewählt} one {# Datensatz ausgewählt} other {# Datensätze ausgewählt}}",
    statesTitle: "Wahrheitsgemäße Ansichtsstatus",
    loadingTitle: "Datensätze werden geladen",
    loadingBody: "Die Datensätze werden noch geladen.",
    emptyTitle: "Noch keine Datensätze",
    emptyBody:
      "Datensätze erscheinen hier, wenn ein genehmigter Ablauf sie erstellt.",
    errorTitle: "Datensätze konnten nicht geladen werden",
    errorBody:
      "Versuchen Sie es nur erneut, wenn die zuständige Funktion dies unterstützt.",
    restrictedTitle: "Datensätze sind nicht verfügbar",
    restrictedBody: "Ihr aktueller Zugriff umfasst diese Informationen nicht.",
    dateTitle: "Hochzeitsdatum und -zeit vor Ort",
    dateOnlyLabel: "Kalenderdatum",
    instantLabel: "Ortszeit in Europa/Brüssel",
    longLabel:
      "Eine bewusst lange übersetzte Beschriftung demonstriert robusten Umbruch, ohne erforderlichen Kontext auszublenden",
  },
};

export const appMessages: Readonly<Record<AppLocale, AppMessages>> = {
  en,
  nl,
  fr,
  de,
};
