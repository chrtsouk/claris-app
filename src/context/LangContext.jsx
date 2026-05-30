import { createContext, useContext, useState, useEffect } from 'react'

export const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'el', label: 'Ελληνικά',  flag: '🇬🇷' },
  { code: 'es', label: 'Español',   flag: '🇪🇸' },
  { code: 'fr', label: 'Français',  flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch',   flag: '🇩🇪' },
]

// All UI strings
export const TRANSLATIONS = {
  en: {
    // Nav
    dashboard: 'Dashboard', allTools: 'All Tools', favourites: 'Favourites', search: 'Search', export: 'Export',
    help: 'Help', // Tools
    openTool: 'Open tool', comingSoon: 'Coming soon', downloadOffline: 'Download offline',
    addToFavourites: 'Add to favourites', removeFromFavourites: 'Remove from favourites',
    relatedTools: 'Related tools', whoIsThisFor: 'Who is this for',
    exportFormats: 'Export formats', availableOn: 'Available on',
    complexity: 'Complexity', priority: 'Priority', offline: 'Offline',
    // Filters
    allLevels: 'All levels', simple: 'Simple', standard: 'Standard',
    advanced: 'Advanced', professional: 'Professional', p0only: 'P0 MVP only',
    noToolsFound: 'No tools found', clearFilters: 'Clear all filters',
    showing: 'Showing', of: 'of', tools: 'tools',
    // Settings
    settings: 'Settings', appearance: 'Appearance', language: 'Language',
    notifications: 'Notifications', subscription: 'Subscription', account: 'Account',
    dangerZone: 'Danger zone', signOut: 'Sign out',
    cancelSub: 'Cancel subscription', exportData: 'Export my data',
    deleteAccount: 'Delete account', saveChanges: 'Save changes',
    discard: 'Discard', unsavedChanges: 'You have unsaved changes',
    saved: 'Changes saved successfully',
    // Profile
    profile: 'Profile', personalInfo: 'Personal information',
    firstName: 'First name', lastName: 'Last name', email: 'Email address',
    phone: 'Phone number', address: 'Address', country: 'Country',
    security: 'Security', devices: 'Connected devices',
    currentPw: 'Current password', newPw: 'New password', confirmPw: 'Confirm password',
    updatePw: 'Update password',
    // Dashboard
    welcome: 'Welcome back', totalTools: 'Total tools', categories: 'Categories',
    recentlyViewed: 'Recently viewed', featuredTools: 'Featured tools',
    // Auth
    signIn: 'Sign in', signUp: 'Create account', forgotPw: 'Forgot password?',
    resetPw: 'Reset password', sendReset: 'Send reset link',
  },
  el: {
    dashboard: 'Αρχική', allTools: 'Όλα τα Tools', favourites: 'Αγαπημένα', search: 'Αναζήτηση', export: 'Εξαγωγή',
    help: 'Βοήθεια', openTool: 'Άνοιγμα tool', comingSoon: '近く開通', downloadOffline: 'Λήψη offline',
    addToFavourites: 'Προσθήκη στα αγαπημένα', removeFromFavourites: 'Αφαίρεση',
    relatedTools: 'Σχετικά tools', whoIsThisFor: 'Για ποιον είναι',
    exportFormats: 'Μορφές εξαγωγής', availableOn: 'Διαθέσιμο σε',
    complexity: 'Πολυπλοκότητα', priority: 'Προτεραιότητα', offline: 'Offline',
    allLevels: 'Όλα τα επίπεδα', simple: 'Απλό', standard: 'Κανονικό',
    advanced: 'Προχωρημένο', professional: 'Επαγγελματικό', p0only: 'Μόνο P0 MVP',
    noToolsFound: 'Δεν βρέθηκαν tools', clearFilters: 'Καθαρισμός φίλτρων',
    showing: 'Εμφάνιση', of: 'από', tools: 'tools',
    settings: 'Ρυθμίσεις', appearance: 'Εμφάνιση', language: 'Γλώσσα',
    notifications: 'Ειδοποιήσεις', subscription: 'Συνδρομή', account: 'Λογαριασμός',
    dangerZone: 'Επικίνδυνη ζώνη', signOut: 'Αποσύνδεση',
    cancelSub: 'Ακύρωση συνδρομής', exportData: 'Εξαγωγή δεδομένων',
    deleteAccount: 'Διαγραφή λογαριασμού', saveChanges: 'Αποθήκευση',
    discard: 'Άκυρο', unsavedChanges: 'Έχετε μη αποθηκευμένες αλλαγές',
    saved: 'Αποθηκεύτηκε επιτυχώς',
    profile: 'Προφίλ', personalInfo: 'Προσωπικά στοιχεία',
    firstName: 'Όνομα', lastName: 'Επώνυμο', email: 'Email',
    phone: 'Τηλέφωνο', address: 'Διεύθυνση', country: 'Χώρα',
    security: 'Ασφάλεια', devices: 'Συσκευές',
    currentPw: 'Τρέχων κωδικός', newPw: 'Νέος κωδικός', confirmPw: 'Επιβεβαίωση',
    updatePw: 'Ενημέρωση κωδικού',
    welcome: 'Καλώς ήρθατε', totalTools: 'Σύνολο tools', categories: 'Κατηγορίες',
    recentlyViewed: 'Πρόσφατα', featuredTools: 'Προτεινόμενα tools',
    signIn: 'Σύνδεση', signUp: 'Εγγραφή', forgotPw: 'Ξεχάσατε τον κωδικό;',
    resetPw: 'Επαναφορά κωδικού', sendReset: 'Αποστολή συνδέσμου',
  },
  es: {
    dashboard: 'Panel', allTools: 'Todas las Tools', favourites: 'Favoritos', search: 'Buscar', export: 'Exportar',
    help: 'Ayuda', openTool: 'Abrir tool', comingSoon: 'Próximamente', downloadOffline: 'Descargar offline',
    addToFavourites: 'Añadir a favoritos', removeFromFavourites: 'Quitar de favoritos',
    relatedTools: 'Tools relacionadas', whoIsThisFor: 'Para quién es',
    exportFormats: 'Formatos de exportación', availableOn: 'Disponible en',
    complexity: 'Complejidad', priority: 'Prioridad', offline: 'Sin conexión',
    allLevels: 'Todos los niveles', simple: 'Simple', standard: 'Estándar',
    advanced: 'Avanzado', professional: 'Profesional', p0only: 'Solo P0 MVP',
    noToolsFound: 'No se encontraron tools', clearFilters: 'Limpiar filtros',
    showing: 'Mostrando', of: 'de', tools: 'tools',
    settings: 'Configuración', appearance: 'Apariencia', language: 'Idioma',
    notifications: 'Notificaciones', subscription: 'Suscripción', account: 'Cuenta',
    dangerZone: 'Zona de peligro', signOut: 'Cerrar sesión',
    cancelSub: 'Cancelar suscripción', exportData: 'Exportar datos',
    deleteAccount: 'Eliminar cuenta', saveChanges: 'Guardar cambios',
    discard: 'Descartar', unsavedChanges: 'Tienes cambios sin guardar',
    saved: 'Guardado correctamente',
    profile: 'Perfil', personalInfo: 'Información personal',
    firstName: 'Nombre', lastName: 'Apellido', email: 'Correo electrónico',
    phone: 'Teléfono', address: 'Dirección', country: 'País',
    security: 'Seguridad', devices: 'Dispositivos',
    currentPw: 'Contraseña actual', newPw: 'Nueva contraseña', confirmPw: 'Confirmar',
    updatePw: 'Actualizar contraseña',
    welcome: 'Bienvenido', totalTools: 'Total de tools', categories: 'Categorías',
    recentlyViewed: 'Vistos recientemente', featuredTools: 'Tools destacadas',
    signIn: 'Iniciar sesión', signUp: 'Crear cuenta', forgotPw: '¿Olvidaste tu contraseña?',
    resetPw: 'Restablecer contraseña', sendReset: 'Enviar enlace',
  },
  fr: {
    dashboard: 'Tableau de bord', allTools: 'Tous les outils', favourites: 'Favoris', search: 'Rechercher', export: 'Exporter',
    help: 'Aide', openTool: 'Ouvrir', comingSoon: 'Bientôt disponible', downloadOffline: 'Télécharger hors ligne',
    addToFavourites: 'Ajouter aux favoris', removeFromFavourites: 'Retirer des favoris',
    relatedTools: 'Outils similaires', whoIsThisFor: 'Pour qui',
    exportFormats: "Formats d'export", availableOn: 'Disponible sur',
    complexity: 'Complexité', priority: 'Priorité', offline: 'Hors ligne',
    allLevels: 'Tous les niveaux', simple: 'Simple', standard: 'Standard',
    advanced: 'Avancé', professional: 'Professionnel', p0only: 'P0 MVP seulement',
    noToolsFound: 'Aucun outil trouvé', clearFilters: 'Effacer les filtres',
    showing: 'Affichage', of: 'sur', tools: 'outils',
    settings: 'Paramètres', appearance: 'Apparence', language: 'Langue',
    notifications: 'Notifications', subscription: 'Abonnement', account: 'Compte',
    dangerZone: 'Zone dangereuse', signOut: 'Se déconnecter',
    cancelSub: "Annuler l'abonnement", exportData: 'Exporter mes données',
    deleteAccount: 'Supprimer le compte', saveChanges: 'Enregistrer',
    discard: 'Annuler', unsavedChanges: 'Modifications non enregistrées',
    saved: 'Enregistré avec succès',
    profile: 'Profil', personalInfo: 'Informations personnelles',
    firstName: 'Prénom', lastName: 'Nom', email: 'E-mail',
    phone: 'Téléphone', address: 'Adresse', country: 'Pays',
    security: 'Sécurité', devices: 'Appareils',
    currentPw: 'Mot de passe actuel', newPw: 'Nouveau mot de passe', confirmPw: 'Confirmer',
    updatePw: 'Mettre à jour',
    welcome: 'Bienvenue', totalTools: 'Total outils', categories: 'Catégories',
    recentlyViewed: 'Récemment consultés', featuredTools: 'Outils en vedette',
    signIn: 'Se connecter', signUp: 'Créer un compte', forgotPw: 'Mot de passe oublié?',
    resetPw: 'Réinitialiser', sendReset: 'Envoyer le lien',
  },
  de: {
    dashboard: 'Dashboard', allTools: 'Alle Tools', favourites: 'Favoriten', search: 'Suchen', export: 'Exportieren',
    help: 'Hilfe', openTool: 'Tool öffnen', comingSoon: 'Demnächst', downloadOffline: 'Offline herunterladen',
    addToFavourites: 'Zu Favoriten hinzufügen', removeFromFavourites: 'Aus Favoriten entfernen',
    relatedTools: 'Ähnliche Tools', whoIsThisFor: 'Für wen ist das',
    exportFormats: 'Exportformate', availableOn: 'Verfügbar auf',
    complexity: 'Komplexität', priority: 'Priorität', offline: 'Offline',
    allLevels: 'Alle Stufen', simple: 'Einfach', standard: 'Standard',
    advanced: 'Fortgeschritten', professional: 'Professionell', p0only: 'Nur P0 MVP',
    noToolsFound: 'Keine Tools gefunden', clearFilters: 'Filter zurücksetzen',
    showing: 'Zeige', of: 'von', tools: 'Tools',
    settings: 'Einstellungen', appearance: 'Erscheinungsbild', language: 'Sprache',
    notifications: 'Benachrichtigungen', subscription: 'Abonnement', account: 'Konto',
    dangerZone: 'Gefahrenzone', signOut: 'Abmelden',
    cancelSub: 'Abonnement kündigen', exportData: 'Daten exportieren',
    deleteAccount: 'Konto löschen', saveChanges: 'Speichern',
    discard: 'Verwerfen', unsavedChanges: 'Ungespeicherte Änderungen',
    saved: 'Erfolgreich gespeichert',
    profile: 'Profil', personalInfo: 'Persönliche Informationen',
    firstName: 'Vorname', lastName: 'Nachname', email: 'E-Mail',
    phone: 'Telefon', address: 'Adresse', country: 'Land',
    security: 'Sicherheit', devices: 'Geräte',
    currentPw: 'Aktuelles Passwort', newPw: 'Neues Passwort', confirmPw: 'Bestätigen',
    updatePw: 'Aktualisieren',
    welcome: 'Willkommen', totalTools: 'Gesamt Tools', categories: 'Kategorien',
    recentlyViewed: 'Zuletzt angesehen', featuredTools: 'Empfohlene Tools',
    signIn: 'Anmelden', signUp: 'Konto erstellen', forgotPw: 'Passwort vergessen?',
    resetPw: 'Passwort zurücksetzen', sendReset: 'Link senden',
  },
}

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('claris-lang') || 'en'
  )

  const setLang = (code) => {
    setLangState(code)
    localStorage.setItem('claris-lang', code)
  }

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en

  return (
    <LangContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
