import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang, LANGUAGES } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'

// ── TRANSLATIONS ───────────────────────────────────────────────
const T = {
  en: {
    settings: 'Settings', profile: 'Profile', personalInfo: 'Personal information',
    firstName: 'First name', lastName: 'Last name', email: 'Email address',
    phone: 'Phone number', address: 'Address', country: 'Country', language: 'Language',
    save: 'Save changes', discard: 'Discard', saving: 'Saving...', saved: 'Changes saved',
    unsaved: 'You have unsaved changes',
    security: 'Security', currentPw: 'Current password', newPw: 'New password',
    confirmPw: 'Confirm new password', updatePw: 'Update password',
    devices: 'Connected devices', thisDevice: 'This device',
    notifications: 'Notifications', appearance: 'Appearance',
    subscription: 'Subscription', account: 'Account', help: 'Help & Support',
    signOut: 'Sign out', dangerZone: 'Danger zone',
    cancelSub: 'Cancel subscription', exportData: 'Export my data', deleteAccount: 'Delete account',
    theme: 'Appearance — Theme', preferences: 'Display preferences',
    compactView: 'Compact view', compactViewSub: 'Show more tools per page',
    showIds: 'Show tool IDs', showIdsSub: 'Display CL-XXXX codes on cards',
    defaultPage: 'Default page on open',
    notifNewTools: 'New tools added', notifNewToolsSub: 'When new tools are released',
    notifBilling: 'Billing reminders', notifBillingSub: '7 days before renewal',
    notifUpdates: 'App updates', notifUpdatesSub: 'New features and improvements',
    notifTips: 'Weekly tips', notifTipsSub: 'How to get more from CLARIS',
    editProfile: 'Edit profile', editProfileSub: 'Name, email, photo',
    securitySub: 'Password & 2FA', connectedDevices: 'Connected devices',
    connectedDevicesSub: '3 devices active', switchAnnual: 'Switch to Annual',
    manageBilling: 'Manage billing', nextBilling: 'Next billing',
    onlyLetters: 'Only letters allowed', onlyNumbers: 'Only numbers allowed', invalidEmail: 'Invalid email',
    twoFactor: 'Two-factor authentication', twoFactorSub: 'Extra security via authenticator app',
    forgotPw: 'Forgot password?', resetSent: 'Password reset email sent! Check your inbox.',
    cancelConfirm: 'Are you sure you want to cancel your subscription? You will lose access at the end of your billing period.',
    deleteConfirm: 'Are you sure you want to DELETE your account? This cannot be undone.',
    exportConfirm: 'Your data export will be prepared and emailed to you.',
    active: 'Active', trialing: 'Trial',
  },
  el: {
    settings: 'Ρυθμίσεις', profile: 'Προφίλ', personalInfo: 'Προσωπικά στοιχεία',
    firstName: 'Όνομα', lastName: 'Επώνυμο', email: 'Email διεύθυνση',
    phone: 'Τηλέφωνο', address: 'Διεύθυνση', country: 'Χώρα', language: 'Γλώσσα',
    save: 'Αποθήκευση', discard: 'Άκυρο', saving: 'Αποθήκευση...', saved: 'Αποθηκεύτηκε',
    unsaved: 'Έχετε μη αποθηκευμένες αλλαγές',
    security: 'Ασφάλεια', currentPw: 'Τρέχων κωδικός', newPw: 'Νέος κωδικός',
    confirmPw: 'Επιβεβαίωση κωδικού', updatePw: 'Ενημέρωση κωδικού',
    devices: 'Συνδεδεμένες συσκευές', thisDevice: 'Αυτή η συσκευή',
    notifications: 'Ειδοποιήσεις', appearance: 'Εμφάνιση',
    subscription: 'Συνδρομή', account: 'Λογαριασμός', help: 'Βοήθεια',
    signOut: 'Αποσύνδεση', dangerZone: 'Επικίνδυνη ζώνη',
    cancelSub: 'Ακύρωση συνδρομής', exportData: 'Εξαγωγή δεδομένων', deleteAccount: 'Διαγραφή λογαριασμού',
    theme: 'Εμφάνιση — Θέμα', preferences: 'Προτιμήσεις εμφάνισης',
    compactView: 'Συμπαγής εμφάνιση', compactViewSub: 'Εμφάνιση περισσότερων tools',
    showIds: 'Εμφάνιση IDs', showIdsSub: 'Εμφάνιση κωδικών CL-XXXX',
    defaultPage: 'Αρχική σελίδα',
    notifNewTools: 'Νέα tools', notifNewToolsSub: 'Όταν προστίθενται νέα tools',
    notifBilling: 'Υπενθύμιση χρέωσης', notifBillingSub: '7 ημέρες πριν την ανανέωση',
    notifUpdates: 'Ενημερώσεις', notifUpdatesSub: 'Νέες λειτουργίες',
    notifTips: 'Εβδομαδιαίες συμβουλές', notifTipsSub: 'Αξιοποιήστε το CLARIS',
    editProfile: 'Επεξεργασία προφίλ', editProfileSub: 'Όνομα, email, φωτογραφία',
    securitySub: 'Κωδικός & 2FA', connectedDevices: 'Συνδεδεμένες συσκευές',
    connectedDevicesSub: '3 συσκευές ενεργές', switchAnnual: 'Ετήσια συνδρομή',
    manageBilling: 'Διαχείριση χρέωσης', nextBilling: 'Επόμενη χρέωση',
    onlyLetters: 'Μόνο γράμματα', onlyNumbers: 'Μόνο αριθμοί', invalidEmail: 'Μη έγκυρο email',
    twoFactor: 'Διπλή επαλήθευση', twoFactorSub: 'Επιπλέον ασφάλεια',
    forgotPw: 'Ξεχάσατε τον κωδικό;', resetSent: 'Το email επαναφοράς στάλθηκε!',
    cancelConfirm: 'Είστε σίγουροι ότι θέλετε να ακυρώσετε τη συνδρομή σας;',
    deleteConfirm: 'Είστε σίγουροι ότι θέλετε να ΔΙΑΓΡΑΨΕΤΕ τον λογαριασμό σας; Αυτό δεν μπορεί να αναιρεθεί.',
    exportConfirm: 'Η εξαγωγή δεδομένων θα προετοιμαστεί και θα σταλεί στο email σας.',
    active: 'Ενεργή', trialing: 'Δοκιμαστική',
  },
  es: {
    settings: 'Configuración', profile: 'Perfil', personalInfo: 'Información personal',
    firstName: 'Nombre', lastName: 'Apellido', email: 'Correo electrónico',
    phone: 'Teléfono', address: 'Dirección', country: 'País', language: 'Idioma',
    save: 'Guardar cambios', discard: 'Descartar', saving: 'Guardando...', saved: 'Guardado',
    unsaved: 'Tienes cambios sin guardar',
    security: 'Seguridad', currentPw: 'Contraseña actual', newPw: 'Nueva contraseña',
    confirmPw: 'Confirmar contraseña', updatePw: 'Actualizar contraseña',
    devices: 'Dispositivos conectados', thisDevice: 'Este dispositivo',
    notifications: 'Notificaciones', appearance: 'Apariencia',
    subscription: 'Suscripción', account: 'Cuenta', help: 'Ayuda',
    signOut: 'Cerrar sesión', dangerZone: 'Zona de peligro',
    cancelSub: 'Cancelar suscripción', exportData: 'Exportar mis datos', deleteAccount: 'Eliminar cuenta',
    theme: 'Apariencia — Tema', preferences: 'Preferencias de visualización',
    compactView: 'Vista compacta', compactViewSub: 'Mostrar más tools por página',
    showIds: 'Mostrar IDs', showIdsSub: 'Mostrar códigos CL-XXXX',
    defaultPage: 'Página predeterminada',
    notifNewTools: 'Nuevas tools', notifNewToolsSub: 'Cuando se añaden nuevas tools',
    notifBilling: 'Recordatorio de pago', notifBillingSub: '7 días antes de la renovación',
    notifUpdates: 'Actualizaciones', notifUpdatesSub: 'Nuevas funciones',
    notifTips: 'Consejos semanales', notifTipsSub: 'Aproveche CLARIS',
    editProfile: 'Editar perfil', editProfileSub: 'Nombre, email, foto',
    securitySub: 'Contraseña y 2FA', connectedDevices: 'Dispositivos conectados',
    connectedDevicesSub: '3 dispositivos activos', switchAnnual: 'Plan anual',
    manageBilling: 'Gestionar facturación', nextBilling: 'Próxima facturación',
    onlyLetters: 'Solo letras', onlyNumbers: 'Solo números', invalidEmail: 'Email inválido',
    twoFactor: 'Autenticación de dos factores', twoFactorSub: 'Seguridad adicional',
    forgotPw: '¿Olvidaste tu contraseña?', resetSent: '¡Email de restablecimiento enviado!',
    cancelConfirm: '¿Estás seguro de que quieres cancelar tu suscripción?',
    deleteConfirm: '¿Estás seguro de que quieres ELIMINAR tu cuenta? Esto no se puede deshacer.',
    exportConfirm: 'Tu exportación de datos será preparada y enviada a tu email.',
    active: 'Activa', trialing: 'Prueba',
  },
  fr: {
    settings: 'Paramètres', profile: 'Profil', personalInfo: 'Informations personnelles',
    firstName: 'Prénom', lastName: 'Nom', email: 'Adresse email',
    phone: 'Téléphone', address: 'Adresse', country: 'Pays', language: 'Langue',
    save: 'Enregistrer', discard: 'Annuler', saving: 'Enregistrement...', saved: 'Enregistré',
    unsaved: 'Vous avez des modifications non enregistrées',
    security: 'Sécurité', currentPw: 'Mot de passe actuel', newPw: 'Nouveau mot de passe',
    confirmPw: 'Confirmer le mot de passe', updatePw: 'Mettre à jour',
    devices: 'Appareils connectés', thisDevice: 'Cet appareil',
    notifications: 'Notifications', appearance: 'Apparence',
    subscription: 'Abonnement', account: 'Compte', help: 'Aide',
    signOut: 'Se déconnecter', dangerZone: 'Zone dangereuse',
    cancelSub: "Annuler l'abonnement", exportData: 'Exporter mes données', deleteAccount: 'Supprimer le compte',
    theme: 'Apparence — Thème', preferences: "Préférences d'affichage",
    compactView: 'Vue compacte', compactViewSub: 'Afficher plus de tools',
    showIds: 'Afficher les IDs', showIdsSub: 'Afficher les codes CL-XXXX',
    defaultPage: 'Page par défaut',
    notifNewTools: 'Nouveaux tools', notifNewToolsSub: 'Quand de nouveaux tools sont ajoutés',
    notifBilling: 'Rappel de facturation', notifBillingSub: '7 jours avant le renouvellement',
    notifUpdates: 'Mises à jour', notifUpdatesSub: 'Nouvelles fonctionnalités',
    notifTips: 'Conseils hebdomadaires', notifTipsSub: 'Profitez de CLARIS',
    editProfile: 'Modifier le profil', editProfileSub: 'Nom, email, photo',
    securitySub: 'Mot de passe et 2FA', connectedDevices: 'Appareils connectés',
    connectedDevicesSub: '3 appareils actifs', switchAnnual: 'Plan annuel',
    manageBilling: 'Gérer la facturation', nextBilling: 'Prochain paiement',
    onlyLetters: 'Lettres uniquement', onlyNumbers: 'Chiffres uniquement', invalidEmail: 'Email invalide',
    twoFactor: 'Authentification à deux facteurs', twoFactorSub: 'Sécurité supplémentaire',
    forgotPw: 'Mot de passe oublié?', resetSent: 'Email de réinitialisation envoyé!',
    cancelConfirm: 'Êtes-vous sûr de vouloir annuler votre abonnement?',
    deleteConfirm: 'Êtes-vous sûr de vouloir SUPPRIMER votre compte? Cela ne peut pas être annulé.',
    exportConfirm: 'Votre export de données sera préparé et envoyé à votre email.',
    active: 'Active', trialing: 'Essai',
  },
  de: {
    settings: 'Einstellungen', profile: 'Profil', personalInfo: 'Persönliche Informationen',
    firstName: 'Vorname', lastName: 'Nachname', email: 'E-Mail-Adresse',
    phone: 'Telefonnummer', address: 'Adresse', country: 'Land', language: 'Sprache',
    save: 'Speichern', discard: 'Verwerfen', saving: 'Wird gespeichert...', saved: 'Gespeichert',
    unsaved: 'Sie haben ungespeicherte Änderungen',
    security: 'Sicherheit', currentPw: 'Aktuelles Passwort', newPw: 'Neues Passwort',
    confirmPw: 'Passwort bestätigen', updatePw: 'Passwort aktualisieren',
    devices: 'Verbundene Geräte', thisDevice: 'Dieses Gerät',
    notifications: 'Benachrichtigungen', appearance: 'Erscheinungsbild',
    subscription: 'Abonnement', account: 'Konto', help: 'Hilfe',
    signOut: 'Abmelden', dangerZone: 'Gefahrenzone',
    cancelSub: 'Abonnement kündigen', exportData: 'Meine Daten exportieren', deleteAccount: 'Konto löschen',
    theme: 'Erscheinungsbild — Thema', preferences: 'Anzeigeeinstellungen',
    compactView: 'Kompakte Ansicht', compactViewSub: 'Mehr Tools pro Seite anzeigen',
    showIds: 'IDs anzeigen', showIdsSub: 'CL-XXXX Codes anzeigen',
    defaultPage: 'Standardseite',
    notifNewTools: 'Neue Tools', notifNewToolsSub: 'Wenn neue Tools hinzugefügt werden',
    notifBilling: 'Zahlungserinnerung', notifBillingSub: '7 Tage vor der Verlängerung',
    notifUpdates: 'Updates', notifUpdatesSub: 'Neue Funktionen',
    notifTips: 'Wöchentliche Tipps', notifTipsSub: 'CLARIS optimal nutzen',
    editProfile: 'Profil bearbeiten', editProfileSub: 'Name, E-Mail, Foto',
    securitySub: 'Passwort & 2FA', connectedDevices: 'Verbundene Geräte',
    connectedDevicesSub: '3 Geräte aktiv', switchAnnual: 'Jahresplan',
    manageBilling: 'Abrechnung verwalten', nextBilling: 'Nächste Abrechnung',
    onlyLetters: 'Nur Buchstaben', onlyNumbers: 'Nur Zahlen', invalidEmail: 'Ungültige E-Mail',
    twoFactor: 'Zwei-Faktor-Authentifizierung', twoFactorSub: 'Zusätzliche Sicherheit',
    forgotPw: 'Passwort vergessen?', resetSent: 'E-Mail zum Zurücksetzen gesendet!',
    cancelConfirm: 'Sind Sie sicher, dass Sie Ihr Abonnement kündigen möchten?',
    deleteConfirm: 'Sind Sie sicher, dass Sie Ihr Konto LÖSCHEN möchten? Dies kann nicht rückgängig gemacht werden.',
    exportConfirm: 'Ihr Datenexport wird vorbereitet und an Ihre E-Mail gesendet.',
    active: 'Aktiv', trialing: 'Testphase',
  },
}

// ── PHONE COUNTRY CODES ────────────────────────────────────────
const COUNTRY_CODES = [
  { code: '+30',  flag: '🇬🇷', name: 'Greece' },
  { code: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+1',   flag: '🇺🇸', name: 'United States' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+34',  flag: '🇪🇸', name: 'Spain' },
  { code: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: '+31',  flag: '🇳🇱', name: 'Netherlands' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgium' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+357', flag: '🇨🇾', name: 'Cyprus' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: '+7',   flag: '🇷🇺', name: 'Russia' },
  { code: '+86',  flag: '🇨🇳', name: 'China' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea' },
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+90',  flag: '🇹🇷', name: 'Turkey' },
  { code: '+48',  flag: '🇵🇱', name: 'Poland' },
  { code: '+46',  flag: '🇸🇪', name: 'Sweden' },
  { code: '+47',  flag: '🇳🇴', name: 'Norway' },
  { code: '+45',  flag: '🇩🇰', name: 'Denmark' },
  { code: '+358', flag: '🇫🇮', name: 'Finland' },
  { code: '+41',  flag: '🇨🇭', name: 'Switzerland' },
  { code: '+43',  flag: '🇦🇹', name: 'Austria' },
]

const COUNTRIES = COUNTRY_CODES.map(c => c.name)
// LANGUAGES now imported from LangContext

// ── THEMES ─────────────────────────────────────────────────────
const THEMES = [
  { id: 'dark-gold',     name: 'Obsidian Gold',    desc: 'Default — refined dark with warm gold',      preview: { bg: '#0c0c12', surface: '#13131c', accent: '#c9a96e' } },
  { id: 'dark-slate',    name: 'Slate & Steel',    desc: 'Deep navy with cool silver accents',         preview: { bg: '#0b0d14', surface: '#111420', accent: '#94a3c4' } },
  { id: 'dark-copper',   name: 'Midnight Copper',  desc: 'Charcoal dark with warm copper tones',       preview: { bg: '#100c0a', surface: '#181210', accent: '#c47b4a' } },
  { id: 'dark-platinum', name: 'Carbon Platinum',  desc: 'Pure black with platinum silver',            preview: { bg: '#080808', surface: '#111111', accent: '#b0b8c8' } },
]

// ── ADDRESS AUTOCOMPLETE (Google Places-style mock) ────────────
// ── SHARED COMPONENTS ──────────────────────────────────────────
// NOTE: All form components defined OUTSIDE ProfilePage to prevent re-mount on every keystroke

const inputStyle = (hasError) => ({
  background: 'var(--bg3)', border: `1px solid ${hasError ? '#e24b4a' : 'var(--bdr)'}`,
  borderRadius: 'var(--r)', padding: '9px 12px', fontSize: 13, color: 'var(--txt)',
  fontFamily: 'inherit', outline: 'none', width: '100%', transition: 'border .15s',
})

function FieldLabel({ children }) {
  return <label style={{ fontSize: 10, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>{children}</label>
}

function FieldError({ msg }) {
  if (!msg) return null
  return <span style={{ fontSize: 10, color: '#e24b4a', marginTop: 3, display: 'block' }}><i className="ti ti-alert-circle" style={{ marginRight: 3 }} />{msg}</span>
}

// Standalone text input — NOT inside another component
function TextInput({ label, value, onChange, onValidate, placeholder, type = 'text', error }) {
  const ref = useRef(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <FieldLabel>{label}</FieldLabel>
      <input
        ref={ref}
        type={type}
        value={value}
        placeholder={placeholder}
        style={inputStyle(!!error)}
        onChange={e => onChange(e.target.value)}
        onBlur={onValidate}
        onFocus={e => { e.target.style.borderColor = error ? '#e24b4a' : 'var(--bdr2)' }}
      />
      <FieldError msg={error} />
    </div>
  )
}

// Phone input with country code selector
function PhoneInput({ label, value, onChange, countryCode, onCountryCode, error }) {
  const [open, setOpen] = useState(false)
  const selected = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ display: 'flex', gap: 6 }}>
        {/* Country code dropdown */}
        <div style={{ position: 'relative' }}>
          <button type="button" onClick={() => setOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 10px', background: 'var(--bg3)', border: `1px solid ${error ? '#e24b4a' : 'var(--bdr)'}`, borderRadius: 'var(--r)', cursor: 'pointer', fontSize: 13, color: 'var(--txt)', fontFamily: 'inherit', whiteSpace: 'nowrap', minWidth: 90 }}>
            <span>{selected.flag}</span>
            <span>{selected.code}</span>
            <i className="ti ti-chevron-down" style={{ fontSize: 11, color: 'var(--txt3)' }} aria-hidden="true" />
          </button>
          {open && (
            <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 200, background: 'var(--bg3)', border: '1px solid var(--bdr2)', borderRadius: 'var(--r)', marginTop: 4, maxHeight: 200, overflowY: 'auto', minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
              {COUNTRY_CODES.map((c, i) => (
                <div key={i} onClick={() => { onCountryCode(c.code); setOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: 'var(--txt2)', borderBottom: '1px solid var(--bdr)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg4)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span>{c.flag}</span>
                  <span style={{ flex: 1 }}>{c.name}</span>
                  <span style={{ color: 'var(--txt3)', fontSize: 11 }}>{c.code}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Number input */}
        <input
          type="tel"
          inputMode="numeric"
          value={value}
          placeholder="7700 000000"
          style={{ ...inputStyle(!!error), flex: 1 }}
          onChange={e => {
            const val = e.target.value.replace(/[^0-9\s\-()]/g, '')
            onChange(val)
          }}
          onFocus={e => { e.target.style.borderColor = error ? '#e24b4a' : 'var(--bdr2)' }}
          onBlur={e => { e.target.style.borderColor = error ? '#e24b4a' : 'var(--bdr)' }}
        />
      </div>
      <FieldError msg={error} />
    </div>
  )
}

// Address autocomplete using Photon (Komoot) — free, CORS-enabled, no API key
function AddressInput({ label, value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  const fetchSuggestions = (input) => {
    if (!input || input.length < 3) { setSuggestions([]); setOpen(false); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        // Photon is open-source geocoder by Komoot — CORS enabled, free, no API key
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(input)}&limit=6&lang=en`
        )
        const data = await res.json()
        setSuggestions(data.features || [])
        setOpen((data.features || []).length > 0)
      } catch (e) {
        setSuggestions([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 350)
  }

  const selectPlace = (feature) => {
    const p = feature.properties || {}
    // Build detailed address
    const streetLine = [p.housenumber, p.street].filter(Boolean).join(' ') || p.name || ''
    const cityLine = p.city || p.town || p.village || p.county || ''
    const parts = [streetLine, cityLine, p.postcode, p.country].filter(Boolean)
    const display = parts.join(', ')

    onChange(display)
    setOpen(false)
    setSuggestions([])
    onSelect?.({
      display,
      street: streetLine,
      city: cityLine,
      postcode: p.postcode || '',
      country: p.country || '',
      countryCode: p.countrycode?.toUpperCase() || '',
      // Pass country name for auto-filling the Country dropdown
      countryForDropdown: p.country || '',
    })
  }

  const getMain = (f) => {
    const p = f.properties || {}
    const street = [p.housenumber, p.street].filter(Boolean).join(' ')
    return street || p.name || p.street || ''
  }

  const getSub = (f) => {
    const p = f.properties || {}
    return [p.city || p.town || p.village || p.county, p.postcode, p.country].filter(Boolean).join(' · ')
  }

  const inputRef = useRef(null)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })

  const updateDropPos = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropPos({ top: rect.bottom + window.scrollY + 4, left: rect.left, width: rect.width })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ position: 'relative' }}>
        <i className="ti ti-map-pin" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--txt3)', pointerEvents: 'none', zIndex: 1 }} aria-hidden="true" />
        {loading && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, border: '2px solid var(--bdr)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); fetchSuggestions(e.target.value) }}
          onBlur={() => setTimeout(() => setOpen(false), 250)}
          onFocus={() => { updateDropPos(); if (suggestions.length) setOpen(true) }}
          placeholder="Start typing your address..."
          style={{ ...inputStyle(false), paddingLeft: 34, paddingRight: loading ? 34 : 12 }}
          autoComplete="off"
        />
      </div>
      {open && suggestions.length > 0 && (
        <div style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999, background: 'var(--bg2)', border: '1px solid var(--bdr2)', borderRadius: 'var(--r)', boxShadow: '0 16px 40px rgba(0,0,0,.8)', overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
          {suggestions.map((s, i) => (
            <div key={i} onMouseDown={() => selectPlace(s)}
              style={{ padding: '12px 14px', fontSize: 12, cursor: 'pointer', borderBottom: '1px solid var(--bdr)', display: 'flex', alignItems: 'flex-start', gap: 10 }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <i className="ti ti-map-pin" style={{ fontSize: 14, color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--txt)', marginBottom: 3, fontWeight: 500, fontSize: 13 }}>{getMain(s)}</div>
                <div style={{ fontSize: 11, color: 'var(--txt3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getSub(s)}</div>
              </div>
            </div>
          ))}
          <div style={{ padding: '6px 14px', background: 'var(--bg3)', display: 'flex', alignItems: 'center', gap: 5, borderTop: '1px solid var(--bdr)' }}>
            <i className="ti ti-map" style={{ fontSize: 11, color: 'var(--txt3)' }} aria-hidden="true" />
            <span style={{ fontSize: 9, color: 'var(--txt3)' }}>© OpenStreetMap · Photon by Komoot</span>
          </div>
        </div>
      )}
    </div>
  )
}

function Card({ children, style }) {
  return <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r2)', overflow: 'hidden', ...style }}>{children}</div>
}

function CardHeader({ icon, title, iconBg = 'var(--gold3)', iconColor = 'var(--gold)' }) {
  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={`ti ${icon}`} style={{ fontSize: 13, color: iconColor }} aria-hidden="true" />
      </div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{title}</div>
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: 36, height: 20, borderRadius: 10, background: value ? 'var(--gold2)' : 'var(--bg4)', border: `1px solid ${value ? 'var(--gold2)' : 'var(--bdr)'}`, position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: value ? '#0c0c12' : 'var(--txt3)', position: 'absolute', top: 2, left: value ? 19 : 2, transition: 'left .2s' }} />
    </div>
  )
}

function ToggleRow({ title, sub, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--bdr)' }}>
      <div><div style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt)' }}>{title}</div>{sub && <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 1 }}>{sub}</div>}</div>
      <Toggle value={value} onChange={onChange} />
    </div>
  )
}

function SaveBar({ onSave, onDiscard, saving, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg2)', border: '1px solid var(--bdr2)', borderRadius: 'var(--r2)', padding: '12px 18px' }}>
      <div style={{ fontSize: 12, color: 'var(--txt2)' }}>{label || 'You have'} <strong style={{ color: 'var(--gold)' }}>unsaved changes</strong></div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onDiscard} style={{ padding: '7px 16px', borderRadius: 'var(--r)', border: '1px solid var(--bdr)', background: 'transparent', fontSize: 12, color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit' }}>Discard</button>
        <button onClick={onSave} disabled={saving} style={{ padding: '7px 16px', borderRadius: 'var(--r)', border: 'none', background: 'var(--gold)', fontSize: 12, fontWeight: 600, color: '#0c0c12', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

function ThemeCard({ theme, active, onClick }) {
  return (
    <div onClick={onClick} style={{ borderRadius: 'var(--r2)', border: `2px solid ${active ? 'var(--gold)' : 'var(--bdr)'}`, background: active ? 'var(--gold3)' : 'var(--bg3)', padding: 12, cursor: 'pointer', transition: 'all .2s', position: 'relative' }}>
      <div style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 10, height: 56, background: theme.preview.bg, display: 'flex' }}>
        <div style={{ width: 28, background: theme.preview.surface, borderRight: `1px solid ${theme.preview.accent}22`, padding: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ width: 18, height: 4, borderRadius: 2, background: theme.preview.accent, opacity: .8 }} />
          {[1,2,3,4].map(i => <div key={i} style={{ width: 14, height: 3, borderRadius: 2, background: theme.preview.accent, opacity: .2 + i * .05 }} />)}
        </div>
        <div style={{ flex: 1, padding: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', gap: 3 }}>{[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 12, borderRadius: 4, background: theme.preview.surface, border: `1px solid ${theme.preview.accent}22` }} />)}</div>
          <div style={{ display: 'flex', gap: 3 }}>{[1,2].map(i => <div key={i} style={{ flex: 1, height: 16, borderRadius: 4, background: theme.preview.surface, border: `1px solid ${theme.preview.accent}22` }} />)}</div>
        </div>
      </div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--txt)', marginBottom: 2 }}>{theme.name}</div>
      <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{theme.desc}</div>
      {active && <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-check" style={{ fontSize: 10, color: '#0c0c12' }} aria-hidden="true" /></div>}
    </div>
  )
}

// ── MODAL ──────────────────────────────────────────────────────
function Modal({ open, title, message, onConfirm, onCancel, confirmLabel, confirmDanger }) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,.6)' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: confirmDanger ? '#e24b4a' : 'var(--txt)', marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.6, marginBottom: 24 }}>{message}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 18px', borderRadius: 'var(--r)', border: '1px solid var(--bdr)', background: 'transparent', fontSize: 12, color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '9px 18px', borderRadius: 'var(--r)', border: 'none', background: confirmDanger ? '#e24b4a' : 'var(--gold)', fontSize: 12, fontWeight: 600, color: confirmDanger ? '#fff' : '#0c0c12', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

// ── SETTINGS PAGE ──────────────────────────────────────────────
export function SettingsPage() {
  const { profile, signOut, user, setProfile } = useAuth()
  const { theme, setTheme } = useTheme()
  const { lang: globalLang, setLang } = useLang()
  const navigate = useNavigate()

  const [currentLang, setCurrentLang] = useState(
    globalLang || localStorage.getItem('claris-lang') || 'en'
  )
  const t = T[currentLang] || T.en
  const [notifs, setNotifs] = useState({ newTools: true, billing: true, updates: false, tips: false })
  const [prefs, setPrefs] = useState({ compactView: false, showIds: true, defaultPage: 'dashboard' })
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [modal, setModal] = useState(null) // { type, title, message, confirmLabel, danger }

  const markDirty = (setter) => (val) => { setter(val); setDirty(true) }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 700))
    setSaving(false); setDirty(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleCancelSub = () => {
    setModal({
      type: 'cancel',
      title: t.cancelSub,
      message: t.cancelConfirm,
      confirmLabel: t.cancelSub,
      danger: true,
    })
  }

  const handleExportData = () => {
    setModal({
      type: 'export',
      title: t.exportData,
      message: t.exportConfirm,
      confirmLabel: 'Send export',
      danger: false,
    })
  }

  const handleDeleteAccount = () => {
    setModal({
      type: 'delete',
      title: t.deleteAccount,
      message: t.deleteConfirm,
      confirmLabel: t.deleteAccount,
      danger: true,
    })
  }

  const handleModalConfirm = async () => {
    const type = modal.type
    setModal(null)

    if (type === 'delete') {
      try {
        if (user?.id) {
          // Delete all user data in order (respecting foreign keys)
          const tables = [
            ['tool_views',       'user_id'],
            ['collection_tools', null],      // cascade from collections
            ['collections',      'user_id'],
            ['favourites',       'user_id'],
            ['notifications',    'user_id'],
            ['preferences',      'user_id'],
            ['subscriptions',    'user_id'],
            ['profiles',         'id'],
          ]
          for (const [table, col] of tables) {
            if (!col) continue
            const field = col === 'id' ? 'id' : col
            await supabase.from(table).delete().eq(field, user.id)
          }
        }
        await signOut()
      } catch (e) {
        console.error('Delete error:', e)
        await signOut()
      }
    } else if (type === 'cancel') {
      alert('Subscription cancellation request sent.\nYou will retain access until the end of your current billing period.')
    } else if (type === 'export') {
      // Build export data
      const exportData = {
        profile: { name: `${user?.email}`, exportedAt: new Date().toISOString() },
        note: 'Full data export — contact support@claris.app for complete export'
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'claris-data-export.json'; a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <>
      <Modal
        open={!!modal}
        title={modal?.title}
        message={modal?.message}
        confirmLabel={modal?.confirmLabel}
        confirmDanger={modal?.danger}
        onConfirm={handleModalConfirm}
        onCancel={() => setModal(null)}
      />

      <div className="topbar"><div className="topbar-title">{t.settings}</div></div>
      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* Theme */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--txt)', marginBottom: 10 }}>{t.theme}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {THEMES.map(th => <ThemeCard key={th.id} theme={th} active={theme === th.id} onClick={() => { setTheme(th.id); setDirty(true) }} />)}
            </div>
          </div>

          {/* Notifications */}
          <Card>
            <CardHeader icon="ti-bell" title={t.notifications} iconBg="rgba(55,138,221,.10)" iconColor="#378add" />
            <ToggleRow title={t.notifNewTools} sub={t.notifNewToolsSub} value={notifs.newTools} onChange={markDirty(v => setNotifs(p => ({...p, newTools: v})))} />
            <ToggleRow title={t.notifBilling} sub={t.notifBillingSub} value={notifs.billing} onChange={markDirty(v => setNotifs(p => ({...p, billing: v})))} />
            <ToggleRow title={t.notifUpdates} sub={t.notifUpdatesSub} value={notifs.updates} onChange={markDirty(v => setNotifs(p => ({...p, updates: v})))} />
            <div style={{ borderBottom: 'none' }}>
              <ToggleRow title={t.notifTips} sub={t.notifTipsSub} value={notifs.tips} onChange={markDirty(v => setNotifs(p => ({...p, tips: v})))} />
            </div>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader icon="ti-adjustments-horizontal" title={t.preferences} />
            <ToggleRow title={t.compactView} sub={t.compactViewSub} value={prefs.compactView} onChange={markDirty(v => setPrefs(p => ({...p, compactView: v})))} />
            <ToggleRow title={t.showIds} sub={t.showIdsSub} value={prefs.showIds} onChange={markDirty(v => setPrefs(p => ({...p, showIds: v})))} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--bdr)' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt)' }}>{t.defaultPage}</div>
              <select value={prefs.defaultPage} onChange={e => markDirty(v => setPrefs(p => ({...p, defaultPage: v})))(e.target.value)}
                style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: 'var(--txt2)', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
                <option value="dashboard">Dashboard</option>
                <option value="tools">All Tools</option>
                <option value="favourites">Favourites</option>
                <option value="last">Last visited</option>
              </select>
            </div>
            {/* Language selector in Settings — real-time */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--bdr)' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt)' }}>{t.language}</div>
              <select value={currentLang} onChange={e => {
                const code = e.target.value
                setCurrentLang(code)
                setLang(code)
                setProfile(p => p ? {...p, language: code} : p)
                setDirty(true)
              }}
                style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: 'var(--txt2)', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader icon="ti-crown" title={t.subscription} />
            <div style={{ padding: 14 }}>
              <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: 14, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>CLARIS Pro</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#1d9e75', marginTop: 2 }}>
                      <i className="ti ti-circle-check" aria-hidden="true" /> {t.active}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>£10</div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)' }}>/month</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 10 }}>{t.nextBilling}: <strong style={{ color: 'var(--txt)' }}>15 June 2026</strong></div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => alert('Annual plan: £100/year — 2 months free!\n\nStripe integration coming soon. You will be redirected to the billing portal.')}
                    style={{ flex: 1, padding: '8px', borderRadius: 'var(--r)', background: 'var(--gold)', border: 'none', fontSize: 11, fontWeight: 600, color: '#0c0c12', cursor: 'pointer', fontFamily: 'Syne, sans-serif', transition: 'opacity .15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    {t.switchAnnual}
                  </button>
                  <button
                    onClick={() => alert('Billing portal coming soon.\n\nYou will be redirected to Stripe to manage your subscription, update payment method and view invoices.')}
                    style={{ flex: 1, padding: '8px', borderRadius: 'var(--r)', border: '1px solid var(--bdr)', background: 'transparent', fontSize: 11, color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bdr2)'; e.currentTarget.style.color = 'var(--txt)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.color = 'var(--txt2)' }}>
                    {t.manageBilling}
                  </button>
                </div>
              </div>
              {[['Plan', 'Pro Monthly'], ['Tools access', '3,560 tools'], ['Categories', 'All 15'], ['Member since', 'May 2026']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bdr)' }}>
                  <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{k}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: k === 'Tools access' ? 'var(--gold)' : 'var(--txt)' }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Account links */}
          <Card>
            <CardHeader icon="ti-user" title={t.account} />
            {[
              { icon: 'ti-user-circle', title: t.editProfile, sub: t.editProfileSub, bg: 'var(--gold3)', color: 'var(--gold)', to: '/profile' },
              { icon: 'ti-shield-lock', title: t.security, sub: t.securitySub, bg: 'rgba(55,138,221,.10)', color: '#378add', to: '/profile?tab=security' },
              { icon: 'ti-device-mobile', title: t.connectedDevices, sub: t.connectedDevicesSub, bg: 'rgba(29,158,117,.10)', color: '#1d9e75', to: '/profile?tab=devices' },
              { icon: 'ti-help-circle', title: t.help, sub: null, bg: 'var(--bg4)', color: 'var(--txt2)', to: '/help' },
            ].map(item => (
              <div key={item.title} onClick={() => navigate(item.to)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid var(--bdr)', cursor: 'pointer', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${item.icon}`} style={{ fontSize: 13, color: item.color }} aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt)' }}>{item.title}</div>
                  {item.sub && <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 1 }}>{item.sub}</div>}
                </div>
                <i className="ti ti-chevron-right" style={{ fontSize: 13, color: 'var(--txt3)' }} aria-hidden="true" />
              </div>
            ))}
            <div onClick={signOut}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', cursor: 'pointer', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(226,75,74,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-logout" style={{ fontSize: 13, color: '#e24b4a' }} aria-hidden="true" />
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#e24b4a' }}>{t.signOut}</div>
            </div>
          </Card>

          {/* Danger zone */}
          <div style={{ gridColumn: '1 / -1', background: 'rgba(226,75,74,0.04)', border: '1px solid rgba(226,75,74,0.12)', borderRadius: 'var(--r2)', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: 14, color: '#e24b4a' }} aria-hidden="true" />
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, color: '#e24b4a' }}>{t.dangerZone}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCancelSub}
                style={{ padding: '8px 16px', borderRadius: 'var(--r)', border: '1px solid rgba(226,75,74,.3)', background: 'transparent', fontSize: 12, fontWeight: 500, color: '#e24b4a', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(226,75,74,.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {t.cancelSub}
              </button>
              <button onClick={handleExportData}
                style={{ padding: '8px 16px', borderRadius: 'var(--r)', border: '1px solid rgba(226,75,74,.3)', background: 'transparent', fontSize: 12, fontWeight: 500, color: '#e24b4a', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(226,75,74,.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {t.exportData}
              </button>
              <button onClick={handleDeleteAccount}
                style={{ padding: '8px 16px', borderRadius: 'var(--r)', border: '1px solid rgba(226,75,74,.3)', background: 'transparent', fontSize: 12, fontWeight: 500, color: '#e24b4a', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(226,75,74,.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {t.deleteAccount}
              </button>
            </div>
          </div>

          {dirty && <div style={{ gridColumn: '1 / -1' }}><SaveBar onSave={handleSave} onDiscard={() => setDirty(false)} saving={saving} /></div>}
          {saved && <div style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: 12, color: '#1d9e75' }}><i className="ti ti-check" aria-hidden="true" /> {t.saved}</div>}
        </div>
      </div>
    </>
  )
}

// ── PROFILE PAGE ───────────────────────────────────────────────
export function ProfilePage() {
  const { user, profile, signOut, setProfile } = useAuth()
  const { lang: globalLang, setLang } = useLang()
  const navigate = useNavigate()
  const lang = globalLang || 'en'
  const t = T[lang] || T.en

  const [tab, setTab] = useState('personal')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef(null)
  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName, setLastName]   = useState(profile?.last_name  || '')
  const [email, setEmail]         = useState(user?.email || '')
  const [phone, setPhone]         = useState('')
  const [countryCode, setCountryCode] = useState('+44')
  const [address, setAddress]     = useState('')
  const [country, setCountry]     = useState('United Kingdom')
  const [language, setLanguage]   = useState(lang)
  const [errors, setErrors]       = useState({})
  const [dirty, setDirty]         = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew]         = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwError, setPwError]     = useState('')
  const [pwSaved, setPwSaved]     = useState(false)
  const [twoFA, setTwoFA]         = useState(false)

  const validateName = (v) => /[^a-zA-ZΑ-ωα-ωÀ-ÿ\s'\-]/.test(v) ? t.onlyLetters : ''
  const validateEmail = (v) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? t.invalidEmail : ''

  const handleSave = async () => {
    const e = { firstName: validateName(firstName), lastName: validateName(lastName), email: validateEmail(email) }
    if (Object.values(e).some(Boolean)) { setErrors(e); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 700))
    setSaving(false); setDirty(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handlePwChange = async () => {
    if (pwNew.length < 8) { setPwError('Password must be at least 8 characters'); return }
    if (pwNew !== pwConfirm) { setPwError('Passwords do not match'); return }
    setPwError(''); setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pwNew })
    setSaving(false)
    if (error) { setPwError(error.message) } else { setPwCurrent(''); setPwNew(''); setPwConfirm(''); setPwSaved(true); setTimeout(() => setPwSaved(false), 2500) }
  }

  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'U'

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 5 * 1024 * 1024) { alert('Max file size is 5MB'); return }
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return }
    setAvatarUploading(true)
    try {
      // Convert to base64 data URL for immediate display (no bucket needed)
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const dataUrl = ev.target.result
        setAvatarUrl(dataUrl)
        // Try Supabase storage (optional - works if bucket exists)
        try {
          const ext = file.name.split('.').pop()
          const path = `avatars/${user.id}.${ext}`
          const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
          if (!upErr) {
            const { data } = supabase.storage.from('avatars').getPublicUrl(path)
            const url = data.publicUrl + '?t=' + Date.now()
            setAvatarUrl(url)
            await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
            if (setProfile) setProfile(p => p ? { ...p, avatar_url: url } : p)
          } else {
            // Storage not set up - save data URL to profile
            await supabase.from('profiles').update({ avatar_url: dataUrl }).eq('id', user.id)
            if (setProfile) setProfile(p => p ? { ...p, avatar_url: dataUrl } : p)
          }
        } catch (storageErr) {
          console.log('Storage not configured, using local preview')
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Avatar upload:', err)
    }
    setAvatarUploading(false)
  }

  const TABS = [
    { id: 'personal', icon: 'ti-user', label: t.personalInfo },
    { id: 'security', icon: 'ti-shield-lock', label: t.security },
    { id: 'devices',  icon: 'ti-device-mobile', label: t.devices },
  ]

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--txt3)', flex: 1 }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Dashboard</span>
          <i className="ti ti-chevron-right" style={{ fontSize: 11 }} aria-hidden="true" />
          <span style={{ color: 'var(--txt)', fontWeight: 500 }}>{t.profile}</span>
        </div>
      </div>
      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Profile header + tabs */}
            <Card>
              <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="Profile" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bdr2)' }} />
                    : <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: '#0c0c12' }}>{initials}</div>
                  }
                  <div onClick={() => avatarInputRef.current?.click()}
                    style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: avatarUploading ? 'var(--bg4)' : 'var(--bg3)', border: '2px solid var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: avatarUploading ? 'wait' : 'pointer' }}>
                    {avatarUploading
                      ? <i className="ti ti-loader-2" style={{ fontSize: 10, color: 'var(--gold)', animation: 'spin .7s linear infinite' }} aria-hidden="true" />
                      : <i className="ti ti-camera" style={{ fontSize: 10, color: 'var(--txt2)' }} aria-hidden="true" />
                    }
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload}
                    style={{ display: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--txt)', marginBottom: 3 }}>{firstName} {lastName}</div>
                  <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 8 }}>{email}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: 'var(--gold3)', color: 'var(--gold)', border: '1px solid var(--bdr2)', fontWeight: 500 }}>
                      <i className="ti ti-crown" style={{ fontSize: 10, marginRight: 3 }} aria-hidden="true" />Pro Member
                    </span>
                    <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: 'rgba(29,158,117,.10)', color: '#1d9e75', border: '1px solid rgba(29,158,117,.2)', fontWeight: 500 }}>
                      <i className="ti ti-shield-check" style={{ fontSize: 10, marginRight: 3 }} aria-hidden="true" />Verified
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', borderTop: '1px solid var(--bdr)' }}>
                {TABS.map(tb => (
                  <div key={tb.id} onClick={() => setTab(tb.id)} style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: tab === tb.id ? 'var(--gold)' : 'var(--txt2)', borderBottom: `2px solid ${tab === tb.id ? 'var(--gold)' : 'transparent'}`, transition: 'all .15s', fontWeight: tab === tb.id ? 500 : 400 }}>
                    <i className={`ti ${tb.icon}`} style={{ fontSize: 13 }} aria-hidden="true" />{tb.label}
                  </div>
                ))}
              </div>
            </Card>

            {/* PERSONAL TAB */}
            {tab === 'personal' && (
              <Card>
                <CardHeader icon="ti-user" title={t.personalInfo} />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <TextInput
                      label={t.firstName}
                      value={firstName}
                      onChange={v => {
                        if (/[^a-zA-ZΑ-ωα-ωÀ-ÿ\s'\-]/.test(v)) return
                        setFirstName(v); setDirty(true)
                      }}
                      onValidate={() => setErrors(p => ({...p, firstName: validateName(firstName)}))}
                      placeholder="Alex"
                      error={errors.firstName}
                    />
                    <TextInput
                      label={t.lastName}
                      value={lastName}
                      onChange={v => {
                        if (/[^a-zA-ZΑ-ωα-ωÀ-ÿ\s'\-]/.test(v)) return
                        setLastName(v); setDirty(true)
                      }}
                      onValidate={() => setErrors(p => ({...p, lastName: validateName(lastName)}))}
                      placeholder="Smith"
                      error={errors.lastName}
                    />
                  </div>
                  <TextInput
                    label={t.email}
                    type="email"
                    value={email}
                    onChange={v => { setEmail(v); setDirty(true) }}
                    onValidate={() => setErrors(p => ({...p, email: validateEmail(email)}))}
                    placeholder="alex@email.com"
                    error={errors.email}
                  />
                  <PhoneInput
                    label={t.phone}
                    value={phone}
                    onChange={v => { setPhone(v); setDirty(true) }}
                    countryCode={countryCode}
                    onCountryCode={setCountryCode}
                    error={errors.phone}
                  />
                  <AddressInput
                    label={t.address}
                    value={address}
                    onChange={v => { setAddress(v); setDirty(true) }}
                    onSelect={s => {
                      // Auto-fill country from address selection
                      if (s.country) {
                        const match = COUNTRIES.find(c => c.toLowerCase() === s.country.toLowerCase())
                        if (match) setCountry(match)
                      }
                      setDirty(true)
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <FieldLabel>{t.country}</FieldLabel>
                      <select value={country} onChange={e => { setCountry(e.target.value); setDirty(true) }}
                        style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', padding: '9px 12px', fontSize: 13, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
                        {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <FieldLabel>{t.language}</FieldLabel>
                      <select value={language} onChange={e => { setLanguage(e.target.value); setDirty(true) }}
                        style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', padding: '9px 12px', fontSize: 13, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* SECURITY TAB */}
            {tab === 'security' && (
              <Card>
                <CardHeader icon="ti-shield-lock" title={t.security} iconBg="rgba(55,138,221,.10)" iconColor="#378add" />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[[t.currentPw, pwCurrent, setPwCurrent, '••••••••'], [t.newPw, pwNew, setPwNew, 'Min. 8 characters'], [t.confirmPw, pwConfirm, setPwConfirm, 'Repeat new password']].map(([label, val, set, ph]) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <FieldLabel>{label}</FieldLabel>
                      <input type="password" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                        style={inputStyle(false)}
                        onFocus={e => e.target.style.borderColor = 'var(--bdr2)'}
                        onBlur={e => e.target.style.borderColor = 'var(--bdr)'} />
                    </div>
                  ))}
                  {pwError && <div style={{ fontSize: 11, color: '#e24b4a' }}><i className="ti ti-alert-circle" style={{ marginRight: 5 }} />{pwError}</div>}
                  {pwSaved && <div style={{ fontSize: 11, color: '#1d9e75' }}><i className="ti ti-check" style={{ marginRight: 5 }} />Password updated successfully</div>}
                  <button onClick={handlePwChange} style={{ padding: 10, borderRadius: 'var(--r)', background: 'var(--gold)', border: 'none', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#0c0c12', cursor: 'pointer' }}>{t.updatePw}</button>
                  <div style={{ height: 1, background: 'var(--bdr)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt)' }}>{t.twoFactor}</div>
                      <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 1 }}>{t.twoFactorSub}</div>
                    </div>
                    <Toggle value={twoFA} onChange={setTwoFA} />
                  </div>
                </div>
              </Card>
            )}

            {/* DEVICES TAB */}
            {tab === 'devices' && (
              <Card>
                <CardHeader icon="ti-device-mobile" title={t.devices} iconBg="rgba(29,158,117,.10)" iconColor="#1d9e75" />
                {[
                  { name: 'This device — Mac', os: 'macOS', time: 'Active now', current: true, icon: 'ti-brand-apple' },
                  { name: 'iPhone 15 Pro', os: 'iOS', time: 'Last active 2h ago', current: false, icon: 'ti-brand-apple' },
                  { name: 'Windows PC', os: 'Windows', time: 'Last active 1d ago', current: false, icon: 'ti-brand-windows' },
                ].map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--bdr)' }}>
                    <i className={`ti ${d.icon}`} style={{ fontSize: 20, color: 'var(--txt2)', width: 24 }} aria-hidden="true" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt)', marginBottom: 2 }}>{d.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{d.os} · {d.time}</div>
                    </div>
                    {d.current
                      ? <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(29,158,117,.10)', color: '#1d9e75', border: '1px solid rgba(29,158,117,.2)' }}>{t.thisDevice}</span>
                      : <button style={{ fontSize: 10, color: 'var(--txt3)', background: 'none', border: '1px solid var(--bdr)', borderRadius: 6, cursor: 'pointer', padding: '3px 8px', fontFamily: 'inherit' }}>Remove</button>
                    }
                  </div>
                ))}
              </Card>
            )}

            {dirty && <SaveBar onSave={handleSave} onDiscard={() => { setDirty(false); setFirstName(profile?.first_name || ''); setLastName(profile?.last_name || '') }} saving={saving} />}
            {saved && <div style={{ textAlign: 'center', fontSize: 12, color: '#1d9e75' }}><i className="ti ti-check" aria-hidden="true" /> {t.saved}</div>}
          </div>

          {/* RIGHT panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Card>
              <div style={{ padding: 14 }}>
                {[['Account ID', (user?.id || '').slice(0,8)+'...'], ['Email', email], ['Plan', 'CLARIS Pro'], ['Billing', 'Monthly · £10'], ['Member since', 'May 2026'], ['Offline', 'Yes ✓']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bdr)' }}>
                    <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{k}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--txt)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
            </Card>
            <button onClick={signOut} style={{ width: '100%', padding: 10, borderRadius: 'var(--r)', border: '1px solid rgba(226,75,74,.22)', background: 'transparent', fontSize: 12, color: '#e24b4a', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <i className="ti ti-logout" aria-hidden="true" /> {t.signOut}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
