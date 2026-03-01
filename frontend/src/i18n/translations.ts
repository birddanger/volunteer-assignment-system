export type Language = 'en' | 'fi';

export interface Translations {
  // Navigation
  nav: {
    appName: string;
    setup: string;
    dashboard: string;
    myTasks: string;
    calendar: string;
    profile: string;
    logout: string;
    login: string;
    register: string;
    competition: string;
    users: string;
  };
  // User management
  userManagement: {
    title: string;
    subtitle: string;
    totalUsers: string;
    admins: string;
    volunteers: string;
    searchPlaceholder: string;
    name: string;
    team: string;
    role: string;
    registered: string;
    actions: string;
    admin: string;
    volunteer: string;
    you: string;
    grantAdmin: string;
    revokeAdmin: string;
    confirmGrantAdmin: string;
    confirmRevokeAdmin: string;
    adminGranted: string;
    adminRevoked: string;
    loadFailed: string;
    updateFailed: string;
    noUsers: string;
  };
  // Common
  common: {
    loading: string;
    email: string;
    password: string;
    phone: string;
    location: string;
    date: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    description: string;
    optional: string;
    status: string;
    task: string;
    session: string;
    time: string;
    assigned: string;
    volunteers: string;
    accessDenied: string;
    organizersOnly: string;
    to: string;
  };
  // Login page
  loginPage: {
    title: string;
    loggingIn: string;
    loginBtn: string;
    noAccount: string;
    registerHere: string;
  };
  // Register page
  registerPage: {
    title: string;
    firstName: string;
    lastName: string;
    swimmerTeam: string;
    creatingAccount: string;
    registerBtn: string;
    hasAccount: string;
    loginHere: string;
  };
  // Volunteer dashboard
  volunteerDashboard: {
    welcome: string;
    subtitle: string;
    myAssignments: string;
    noAssignments: string;
    availableTasks: string;
    noAvailableTasks: string;
    signUp: string;
    cancelSignUp: string;
    cancelConfirm: string;
    failedToLoad: string;
    failedToSignUp: string;
    failedToCancel: string;
  };
  // Admin dashboard
  adminDashboard: {
    title: string;
    subtitle: string;
    selectEvent: string;
    totalVolunteers: string;
    totalAssignments: string;
    totalTasks: string;
    fillRate: string;
    exportCSV: string;
    taskStatus: string;
    failedToLoadEvents: string;
    failedToLoadDashboard: string;
    failedToExport: string;
    filled: string;
    partiallyFilled: string;
    open: string;
    sessionOverview: string;
    slots: string;
    tasks: string;
    searchFilter: string;
    searchPlaceholder: string;
    filterByStatus: string;
    filterBySession: string;
    allStatuses: string;
    allSessions: string;
    assignmentGrid: string;
    dragVolunteer: string;
    volunteers: string;
    printSchedule: string;
    noResults: string;
    overview: string;
    manage: string;
    print: string;
  };
  // Event setup
  eventSetup: {
    title: string;
    events: string;
    sessions: string;
    tasks: string;
    // Event form
    createEvent: string;
    eventName: string;
    descriptionOptional: string;
    creating: string;
    createEventBtn: string;
    yourEvents: string;
    // Session form
    addSession: string;
    sessionName: string;
    sessionNamePlaceholder: string;
    locationOptional: string;
    adding: string;
    addSessionBtn: string;
    // Task form
    addTask: string;
    taskTitle: string;
    taskTitlePlaceholder: string;
    instructions: string;
    instructionsPlaceholder: string;
    volunteersNeeded: string;
    selectEvent: string;
    selectSession: string;
    createTaskBtn: string;
    noTasks: string;
    noSessions: string;
    // Templates
    templates: string;
    saveAsTemplate: string;
    templateNameLabel: string;
    templateNamePlaceholder: string;
    saveTemplateBtn: string;
    templateSaved: string;
    templateSaveFailed: string;
    useTemplate: string;
    deleteTemplate: string;
    deleteTemplateConfirm: string;
    noTemplates: string;
    noTemplatesHint: string;
    eventCreatedFromTemplate: string;
    templateCreateFailed: string;
    cancel: string;
  };
  // Notifications
  notifications: {
    title: string;
    markAllRead: string;
    empty: string;
    delete: string;
    justNow: string;
  };
  // Hub & Timeline
  hub: {
    welcomeBack: string;
    hubView: string;
    timelineView: string;
    upcoming: string;
    openTasks: string;
    yourStats: string;
    recentNotifications: string;
    yourSchedule: string;
    searchPlaceholder: string;
    anyDay: string;
    tasks: string;
    filled: string;
    full: string;
    spots: string;
    events: string;
    totalHours: string;
    upcomingCount: string;
    noResults: string;
    noTasksOnDate: string;
    unknownLocation: string;
    cancelBtn: string;
    today: string;
    tomorrow: string;
    inDays: string;
    past: string;
  };
  // Profile
  profile: {
    title: string;
    subtitle: string;
    personalInfo: string;
    name: string;
    totalAssignments: string;
    totalHours: string;
    totalEvents: string;
    assignmentHistory: string;
    noHistory: string;
    saveBtn: string;
    saving: string;
    saved: string;
    saveFailed: string;
    memberSince: string;
  };
  // Competition schedule
  competition: {
    title: string;
    subtitle: string;
    addEntry: string;
    editEntry: string;
    hideForm: string;
    teamName: string;
    teamNamePlaceholder: string;
    swimmerName: string;
    swimmerNamePlaceholder: string;
    discipline: string;
    disciplinePlaceholder: string;
    category: string;
    categoryPlaceholder: string;
    estimatedEnd: string;
    poolLocation: string;
    poolLocationPlaceholder: string;
    notes: string;
    notesPlaceholder: string;
    createBtn: string;
    updateBtn: string;
    edit: string;
    delete: string;
    entryCreated: string;
    entryUpdated: string;
    saveFailed: string;
    deleteConfirm: string;
    deleteFailed: string;
    failedToLoad: string;
    noEntries: string;
    noEntriesHint: string;
    noEntriesOrganizerHint: string;
    searchPlaceholder: string;
    allTeams: string;
    myTeamHint: string;
    filterMyTeam: string;
    showAll: string;
    totalEntries: string;
    totalTeams: string;
    competitionDays: string;
    disciplines: string;
    importCSV: string;
    downloadTemplate: string;
    importFromFile: string;
    selectFile: string;
    importBtn: string;
    importing: string;
    importSuccess: string;
    importPartial: string;
    importErrors: string;
    importFailed: string;
    csvFormatHint: string;
  };
}

export const en: Translations = {
  nav: {
    appName: '📋 Volunteer Manager',
    setup: 'Setup',
    dashboard: 'Dashboard',
    myTasks: 'My Tasks',
    calendar: 'Calendar',
    profile: 'Profile',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    competition: 'Competition',
    users: 'Users',
  },
  userManagement: {
    title: 'User Management',
    subtitle: 'View all registered users and manage admin privileges.',
    totalUsers: 'Total Users',
    admins: 'Admins',
    volunteers: 'Volunteers',
    searchPlaceholder: 'Search by name, email, or team...',
    name: 'Name',
    team: 'Team',
    role: 'Role',
    registered: 'Registered',
    actions: 'Actions',
    admin: 'Admin',
    volunteer: 'Volunteer',
    you: 'you',
    grantAdmin: 'Grant Admin',
    revokeAdmin: 'Revoke Admin',
    confirmGrantAdmin: 'Grant admin privileges to {name}?',
    confirmRevokeAdmin: 'Revoke admin privileges from {name}?',
    adminGranted: '{name} is now an admin.',
    adminRevoked: '{name} is no longer an admin.',
    loadFailed: 'Failed to load users.',
    updateFailed: 'Failed to update user role.',
    noUsers: 'No users found.',
  },
  common: {
    loading: 'Loading...',
    email: 'Email',
    password: 'Password',
    phone: 'Phone',
    location: 'Location',
    date: 'Date',
    startDate: 'Start Date',
    endDate: 'End Date',
    startTime: 'Start Time',
    endTime: 'End Time',
    description: 'Description',
    optional: 'Optional',
    status: 'Status',
    task: 'Task',
    session: 'Session',
    time: 'Time',
    assigned: 'Assigned',
    volunteers: 'Volunteers',
    accessDenied: 'Access denied.',
    organizersOnly: 'Organizers only.',
    to: 'to',
  },
  loginPage: {
    title: 'Volunteer Manager',
    loggingIn: 'Logging in...',
    loginBtn: 'Login',
    noAccount: "Don't have an account?",
    registerHere: 'Register here',
  },
  registerPage: {
    title: 'Join as Volunteer',
    firstName: 'First Name',
    lastName: 'Last Name',
    swimmerTeam: 'Swimmer Team',
    creatingAccount: 'Creating account...',
    registerBtn: 'Register',
    hasAccount: 'Already have an account?',
    loginHere: 'Login here',
  },
  volunteerDashboard: {
    welcome: 'Welcome',
    subtitle: 'View your assignments and find new volunteer opportunities',
    myAssignments: 'My Assignments',
    noAssignments: 'No assignments yet. Browse available tasks below!',
    availableTasks: 'Available Tasks',
    noAvailableTasks: 'No available tasks at this time.',
    signUp: 'Sign Up',
    cancelSignUp: 'Cancel Sign-Up',
    cancelConfirm: 'Are you sure you want to cancel this sign-up?',
    failedToLoad: 'Failed to load data',
    failedToSignUp: 'Failed to sign up',
    failedToCancel: 'Failed to cancel sign-up',
  },
  adminDashboard: {
    title: 'Admin Dashboard',
    subtitle: 'Manage event tasks and volunteer assignments',
    selectEvent: 'Select Event',
    totalVolunteers: 'Total Volunteers Assigned',
    totalAssignments: 'Total Assignments',
    totalTasks: 'Total Tasks',
    fillRate: 'Fill Rate',
    exportCSV: '📥 Export to CSV',
    taskStatus: 'Task Status',
    failedToLoadEvents: 'Failed to load events',
    failedToLoadDashboard: 'Failed to load dashboard',
    failedToExport: 'Failed to export',
    filled: 'Filled',
    partiallyFilled: 'Partially Filled',
    open: 'Open',
    sessionOverview: 'Session Overview',
    slots: 'slots',
    tasks: 'tasks',
    searchFilter: 'Search & Filter',
    searchPlaceholder: 'Search tasks or volunteers...',
    filterByStatus: 'Filter by status',
    filterBySession: 'Filter by session',
    allStatuses: 'All statuses',
    allSessions: 'All sessions',
    assignmentGrid: 'Assignment Grid',
    dragVolunteer: 'Drag volunteers onto tasks to assign',
    volunteers: 'Volunteers',
    printSchedule: '🖨️ Print Schedule',
    noResults: 'No matching results',
    overview: 'Overview',
    manage: 'Manage',
    print: 'Print',
  },
  eventSetup: {
    title: 'Event Setup',
    events: 'Events',
    sessions: 'Sessions',
    tasks: 'Tasks',
    createEvent: 'Create Event',
    eventName: 'Event Name',
    descriptionOptional: 'Description (Optional)',
    creating: 'Creating...',
    createEventBtn: 'Create Event',
    yourEvents: 'Your Events',
    addSession: 'Add Session',
    sessionName: 'Session Name',
    sessionNamePlaceholder: 'e.g., Friday Evening - Setup',
    locationOptional: 'Location (Optional)',
    adding: 'Adding...',
    addSessionBtn: 'Add Session',
    addTask: 'Add Task',
    taskTitle: 'Task Title',
    taskTitlePlaceholder: 'e.g., Poolside Judge',
    instructions: 'Instructions (Optional)',
    instructionsPlaceholder: 'Special instructions for volunteers',
    volunteersNeeded: 'Volunteers Needed',
    selectEvent: 'Event',
    selectSession: 'Session',
    createTaskBtn: 'Create Task',
    noTasks: 'No tasks yet',
    noSessions: 'No sessions yet. Create sessions in the Sessions tab first.',
    templates: 'Templates',
    saveAsTemplate: 'Save as Template',
    templateNameLabel: 'Template Name',
    templateNamePlaceholder: 'e.g., Swimming Championship Setup',
    saveTemplateBtn: 'Save Template',
    templateSaved: 'Template saved! ({sessions} sessions, {tasks} tasks)',
    templateSaveFailed: 'Failed to save template',
    useTemplate: 'Use This Template',
    deleteTemplate: 'Delete template',
    deleteTemplateConfirm: 'Are you sure you want to delete this template?',
    noTemplates: 'No templates yet',
    noTemplatesHint: 'Save an event as a template from the Events tab to reuse its structure.',
    eventCreatedFromTemplate: 'Event created! ({sessions} sessions, {tasks} tasks)',
    templateCreateFailed: 'Failed to create event from template',
    cancel: 'Cancel',
  },
  notifications: {
    title: 'Notifications',
    markAllRead: 'Mark all read',
    empty: 'No notifications',
    delete: 'Delete',
    justNow: 'Just now',
  },
  hub: {
    welcomeBack: 'Welcome back',
    hubView: 'Hub',
    timelineView: 'Timeline',
    upcoming: 'Upcoming',
    openTasks: 'Open Tasks',
    yourStats: 'Your Stats',
    recentNotifications: 'Recent Notifications',
    yourSchedule: 'Your Schedule',
    searchPlaceholder: 'Search tasks...',
    anyDay: 'Any day',
    tasks: 'tasks',
    filled: 'filled',
    full: 'full',
    spots: 'spots',
    events: 'events',
    totalHours: 'total hours',
    upcomingCount: 'upcoming',
    noResults: 'No matching tasks',
    noTasksOnDate: 'No tasks on this date',
    unknownLocation: 'TBD',
    cancelBtn: 'Cancel',
    today: 'Today!',
    tomorrow: 'Tomorrow',
    inDays: 'In {days} days',
    past: 'Past',
  },
  profile: {
    title: 'My Profile',
    subtitle: 'View your information, stats and assignment history',
    personalInfo: 'Personal Information',
    name: 'Name',
    totalAssignments: 'Total Assignments',
    totalHours: 'Total Hours',
    totalEvents: 'Events Participated',
    assignmentHistory: 'Assignment History',
    noHistory: 'No assignment history yet.',
    saveBtn: 'Save Changes',
    saving: 'Saving...',
    saved: 'Profile saved successfully!',
    saveFailed: 'Failed to save profile',
    memberSince: 'Member since',
  },
  competition: {
    title: 'Competition Schedule',
    subtitle: 'See when swimmers and teams are set to compete',
    addEntry: '+ Add Entry',
    editEntry: 'Edit Entry',
    hideForm: 'Hide Form',
    teamName: 'Team',
    teamNamePlaceholder: 'e.g. Dolphins SC',
    swimmerName: 'Swimmer',
    swimmerNamePlaceholder: 'e.g. Anna Johnson',
    discipline: 'Discipline',
    disciplinePlaceholder: 'e.g. 100m Freestyle',
    category: 'Category',
    categoryPlaceholder: 'e.g. Girls 10-12',
    estimatedEnd: 'Est. End Time',
    poolLocation: 'Pool / Lane',
    poolLocationPlaceholder: 'e.g. Pool A, Lane 3',
    notes: 'Notes',
    notesPlaceholder: 'Optional notes',
    createBtn: 'Add Entry',
    updateBtn: 'Update Entry',
    edit: 'Edit',
    delete: 'Delete',
    entryCreated: 'Entry added to schedule!',
    entryUpdated: 'Entry updated!',
    saveFailed: 'Failed to save entry',
    deleteConfirm: 'Delete this competition entry?',
    deleteFailed: 'Failed to delete entry',
    failedToLoad: 'Failed to load competition schedule',
    noEntries: 'No competition entries yet',
    noEntriesHint: 'The organizer has not added the competition schedule yet.',
    noEntriesOrganizerHint: 'Click "+ Add Entry" to start building the competition schedule.',
    searchPlaceholder: 'Search teams, swimmers, disciplines...',
    allTeams: 'All teams',
    myTeamHint: 'Your team: {team}',
    filterMyTeam: 'Show my team only',
    showAll: 'Show all',
    totalEntries: 'Total Entries',
    totalTeams: 'Teams',
    competitionDays: 'Competition Days',
    disciplines: 'Disciplines',
    importCSV: 'Import CSV',
    downloadTemplate: 'Download Template',
    importFromFile: 'Import from File',
    selectFile: 'Select CSV file',
    importBtn: 'Import',
    importing: 'Importing...',
    importSuccess: '{count} entries imported successfully!',
    importPartial: '{created} of {total} entries imported. {errorCount} had errors.',
    importErrors: 'Import errors',
    importFailed: 'Failed to import CSV',
    csvFormatHint: 'Use the template file for the correct format. Columns: team_name, swimmer_name, discipline, category, scheduled_date (YYYY-MM-DD), scheduled_time (HH:MM), estimated_end_time, pool_location, notes.',
  },
};

export const fi: Translations = {
  nav: {
    appName: '📋 Vapaaehtoismanageri',
    setup: 'Asetukset',
    dashboard: 'Hallintapaneeli',
    myTasks: 'Omat tehtävät',
    calendar: 'Kalenteri',
    profile: 'Profiili',
    logout: 'Kirjaudu ulos',
    login: 'Kirjaudu',
    register: 'Rekisteröidy',
    competition: 'Kilpailu',
    users: 'Käyttäjät',
  },
  userManagement: {
    title: 'Käyttäjähallinta',
    subtitle: 'Näytä kaikki rekisteröityneet käyttäjät ja hallinnoi ylläpitäjäoikeuksia.',
    totalUsers: 'Käyttäjiä yht.',
    admins: 'Ylläpitäjät',
    volunteers: 'Vapaaehtoiset',
    searchPlaceholder: 'Hae nimellä, sähköpostilla tai joukkueella...',
    name: 'Nimi',
    team: 'Joukkue',
    role: 'Rooli',
    registered: 'Rekisteröitynyt',
    actions: 'Toiminnot',
    admin: 'Ylläpitäjä',
    volunteer: 'Vapaaehtoinen',
    you: 'sinä',
    grantAdmin: 'Anna oikeudet',
    revokeAdmin: 'Poista oikeudet',
    confirmGrantAdmin: 'Annetaanko ylläpitäjäoikeudet käyttäjälle {name}?',
    confirmRevokeAdmin: 'Poistetaanko ylläpitäjäoikeudet käyttäjältä {name}?',
    adminGranted: '{name} on nyt ylläpitäjä.',
    adminRevoked: '{name} ei ole enää ylläpitäjä.',
    loadFailed: 'Käyttäjien lataus epäonnistui.',
    updateFailed: 'Käyttäjäroolin päivitys epäonnistui.',
    noUsers: 'Käyttäjiä ei löytynyt.',
  },
  common: {
    loading: 'Ladataan...',
    email: 'Sähköposti',
    password: 'Salasana',
    phone: 'Puhelin',
    location: 'Sijainti',
    date: 'Päivämäärä',
    startDate: 'Alkamispäivä',
    endDate: 'Päättymispäivä',
    startTime: 'Alkamisaika',
    endTime: 'Päättymisaika',
    description: 'Kuvaus',
    optional: 'Valinnainen',
    status: 'Tila',
    task: 'Tehtävä',
    session: 'Sessio',
    time: 'Aika',
    assigned: 'Osoitettu',
    volunteers: 'Vapaaehtoiset',
    accessDenied: 'Pääsy estetty.',
    organizersOnly: 'Vain järjestäjille.',
    to: '–',
  },
  loginPage: {
    title: 'Vapaaehtoismanageri',
    loggingIn: 'Kirjaudutaan...',
    loginBtn: 'Kirjaudu',
    noAccount: 'Eikö sinulla ole tiliä?',
    registerHere: 'Rekisteröidy tästä',
  },
  registerPage: {
    title: 'Liity vapaaehtoiseksi',
    firstName: 'Etunimi',
    lastName: 'Sukunimi',
    swimmerTeam: 'Uimaseura',
    creatingAccount: 'Luodaan tiliä...',
    registerBtn: 'Rekisteröidy',
    hasAccount: 'Onko sinulla jo tili?',
    loginHere: 'Kirjaudu tästä',
  },
  volunteerDashboard: {
    welcome: 'Tervetuloa',
    subtitle: 'Näytä omat tehtäväsi ja etsi uusia vapaaehtoismahdollisuuksia',
    myAssignments: 'Omat tehtävät',
    noAssignments: 'Ei vielä tehtäviä. Selaa saatavilla olevia tehtäviä alta!',
    availableTasks: 'Saatavilla olevat tehtävät',
    noAvailableTasks: 'Ei saatavilla olevia tehtäviä tällä hetkellä.',
    signUp: 'Ilmoittaudu',
    cancelSignUp: 'Peru ilmoittautuminen',
    cancelConfirm: 'Haluatko varmasti perua ilmoittautumisen?',
    failedToLoad: 'Tietojen lataus epäonnistui',
    failedToSignUp: 'Ilmoittautuminen epäonnistui',
    failedToCancel: 'Ilmoittautumisen peruminen epäonnistui',
  },
  adminDashboard: {
    title: 'Hallintapaneeli',
    subtitle: 'Hallitse tapahtumien tehtäviä ja vapaaehtoisten tehtäväjakoja',
    selectEvent: 'Valitse tapahtuma',
    totalVolunteers: 'Osoitetut vapaaehtoiset',
    totalAssignments: 'Tehtäväjaot yhteensä',
    totalTasks: 'Tehtäviä yhteensä',
    fillRate: 'Täyttöaste',
    exportCSV: '📥 Vie CSV-tiedostona',
    taskStatus: 'Tehtävien tila',
    failedToLoadEvents: 'Tapahtumien lataus epäonnistui',
    failedToLoadDashboard: 'Hallintapaneelin lataus epäonnistui',
    failedToExport: 'Vienti epäonnistui',
    filled: 'Täytetty',
    partiallyFilled: 'Osittain täytetty',
    open: 'Avoin',
    sessionOverview: 'Sessioiden yleiskatsaus',
    slots: 'paikkaa',
    tasks: 'tehtävää',
    searchFilter: 'Haku ja suodatus',
    searchPlaceholder: 'Hae tehtäviä tai vapaaehtoisia...',
    filterByStatus: 'Suodata tilan mukaan',
    filterBySession: 'Suodata session mukaan',
    allStatuses: 'Kaikki tilat',
    allSessions: 'Kaikki sessiot',
    assignmentGrid: 'Tehtäväruudukko',
    dragVolunteer: 'Vedä vapaaehtoisia tehtäviin osoittaaksesi',
    volunteers: 'Vapaaehtoiset',
    printSchedule: '🖨️ Tulosta aikataulu',
    noResults: 'Ei hakutuloksia',
    overview: 'Yleiskatsaus',
    manage: 'Hallinta',
    print: 'Tulosta',
  },
  eventSetup: {
    title: 'Tapahtuman asetukset',
    events: 'Tapahtumat',
    sessions: 'Sessiot',
    tasks: 'Tehtävät',
    createEvent: 'Luo tapahtuma',
    eventName: 'Tapahtuman nimi',
    descriptionOptional: 'Kuvaus (valinnainen)',
    creating: 'Luodaan...',
    createEventBtn: 'Luo tapahtuma',
    yourEvents: 'Omat tapahtumat',
    addSession: 'Lisää sessio',
    sessionName: 'Session nimi',
    sessionNamePlaceholder: 'esim. Perjantai-ilta - Valmistelut',
    locationOptional: 'Sijainti (valinnainen)',
    adding: 'Lisätään...',
    addSessionBtn: 'Lisää sessio',
    addTask: 'Lisää tehtävä',
    taskTitle: 'Tehtävän otsikko',
    taskTitlePlaceholder: 'esim. Altaan reunan tuomari',
    instructions: 'Ohjeet (valinnainen)',
    instructionsPlaceholder: 'Erityisohjeet vapaaehtoisille',
    volunteersNeeded: 'Tarvittavat vapaaehtoiset',
    selectEvent: 'Tapahtuma',
    selectSession: 'Sessio',
    createTaskBtn: 'Luo tehtävä',
    noTasks: 'Ei vielä tehtäviä',
    noSessions: 'Ei vielä sessioita. Luo sessiot ensin Sessiot-välilehdellä.',
    templates: 'Mallipohjat',
    saveAsTemplate: 'Tallenna malliksi',
    templateNameLabel: 'Mallipohjan nimi',
    templateNamePlaceholder: 'esim. Uintikilpailun asetukset',
    saveTemplateBtn: 'Tallenna mallipohja',
    templateSaved: 'Mallipohja tallennettu! ({sessions} sessiota, {tasks} tehtävää)',
    templateSaveFailed: 'Mallipohjan tallennus epäonnistui',
    useTemplate: 'Käytä tätä mallipohjaa',
    deleteTemplate: 'Poista mallipohja',
    deleteTemplateConfirm: 'Haluatko varmasti poistaa tämän mallipohjan?',
    noTemplates: 'Ei vielä mallipohjia',
    noTemplatesHint: 'Tallenna tapahtuma malliksi Tapahtumat-välilehdeltä, niin voit käyttää sen rakennetta uudelleen.',
    eventCreatedFromTemplate: 'Tapahtuma luotu! ({sessions} sessiota, {tasks} tehtävää)',
    templateCreateFailed: 'Tapahtuman luonti mallipohjasta epäonnistui',
    cancel: 'Peruuta',
  },
  notifications: {
    title: 'Ilmoitukset',
    markAllRead: 'Merkitse luetuksi',
    empty: 'Ei ilmoituksia',
    delete: 'Poista',
    justNow: 'Juuri nyt',
  },
  hub: {
    welcomeBack: 'Tervetuloa takaisin',
    hubView: 'Yleiskuva',
    timelineView: 'Aikajana',
    upcoming: 'Tulevat',
    openTasks: 'Avoimet tehtävät',
    yourStats: 'Tilastosi',
    recentNotifications: 'Viimeisimmät ilmoitukset',
    yourSchedule: 'Oma aikataulusi',
    searchPlaceholder: 'Hae tehtäviä...',
    anyDay: 'Kaikki päivät',
    tasks: 'tehtävää',
    filled: 'täytetty',
    full: 'täynnä',
    spots: 'paikkaa',
    events: 'tapahtumaa',
    totalHours: 'tuntia yht.',
    upcomingCount: 'tulossa',
    noResults: 'Ei hakutuloksia',
    noTasksOnDate: 'Ei tehtäviä tänä päivänä',
    unknownLocation: 'Ei tiedossa',
    cancelBtn: 'Peru',
    today: 'Tänään!',
    tomorrow: 'Huomenna',
    inDays: '{days} päivän päästä',
    past: 'Mennyt',
  },
  profile: {
    title: 'Profiilini',
    subtitle: 'Näytä tietosi, tilastot ja tehtävähistoria',
    personalInfo: 'Henkilötiedot',
    name: 'Nimi',
    totalAssignments: 'Tehtävät yhteensä',
    totalHours: 'Tunnit yhteensä',
    totalEvents: 'Osallistutut tapahtumat',
    assignmentHistory: 'Tehtävähistoria',
    noHistory: 'Ei vielä tehtävähistoriaa.',
    saveBtn: 'Tallenna muutokset',
    saving: 'Tallennetaan...',
    saved: 'Profiili tallennettu!',
    saveFailed: 'Profiilin tallennus epäonnistui',
    memberSince: 'Jäsen alkaen',
  },
  competition: {
    title: 'Kilpailuaikataulu',
    subtitle: 'Katso milloin uimarit ja joukkueet kilpailevat',
    addEntry: '+ Lisää merkintä',
    editEntry: 'Muokkaa merkintää',
    hideForm: 'Piilota lomake',
    teamName: 'Joukkue',
    teamNamePlaceholder: 'esim. Dolphins SC',
    swimmerName: 'Uimari',
    swimmerNamePlaceholder: 'esim. Anna Virtanen',
    discipline: 'Laji',
    disciplinePlaceholder: 'esim. 100m vapaauinti',
    category: 'Sarja',
    categoryPlaceholder: 'esim. Tytöt 10-12',
    estimatedEnd: 'Arvioitu loppu',
    poolLocation: 'Allas / Rata',
    poolLocationPlaceholder: 'esim. Allas A, Rata 3',
    notes: 'Muistiinpanot',
    notesPlaceholder: 'Valinnaisia muistiinpanoja',
    createBtn: 'Lisää merkintä',
    updateBtn: 'Päivitä merkintä',
    edit: 'Muokkaa',
    delete: 'Poista',
    entryCreated: 'Merkintä lisätty aikatauluun!',
    entryUpdated: 'Merkintä päivitetty!',
    saveFailed: 'Merkinnän tallennus epäonnistui',
    deleteConfirm: 'Poistetaanko tämä kilpailumerkintä?',
    deleteFailed: 'Merkinnän poisto epäonnistui',
    failedToLoad: 'Kilpailuaikataulun lataus epäonnistui',
    noEntries: 'Ei kilpailumerkintöjä',
    noEntriesHint: 'Järjestäjä ei ole vielä lisännyt kilpailuaikataulua.',
    noEntriesOrganizerHint: 'Klikkaa "+ Lisää merkintä" aloittaaksesi aikataulun luomisen.',
    searchPlaceholder: 'Hae joukkueita, uimareita, lajeja...',
    allTeams: 'Kaikki joukkueet',
    myTeamHint: 'Oma joukkueesi: {team}',
    filterMyTeam: 'Näytä vain oma joukkue',
    showAll: 'Näytä kaikki',
    totalEntries: 'Merkintöjä yht.',
    totalTeams: 'Joukkueet',
    competitionDays: 'Kilpailupäivät',
    disciplines: 'Lajit',
    importCSV: 'Tuo CSV',
    downloadTemplate: 'Lataa mallipohja',
    importFromFile: 'Tuo tiedostosta',
    selectFile: 'Valitse CSV-tiedosto',
    importBtn: 'Tuo',
    importing: 'Tuodaan...',
    importSuccess: '{count} merkintää tuotu onnistuneesti!',
    importPartial: '{created}/{total} merkintää tuotu. {errorCount} virheellistä.',
    importErrors: 'Tuontivirheet',
    importFailed: 'CSV-tuonti epäonnistui',
    csvFormatHint: 'Käytä mallitiedostoa oikeaan muotoon. Sarakkeet: team_name, swimmer_name, discipline, category, scheduled_date (VVVV-KK-PP), scheduled_time (TT:MM), estimated_end_time, pool_location, notes.',
  },
};

export const translations: Record<Language, Translations> = { en, fi };
