/**
 * GRAFEIO · Cookie Consent Banner
 * GDPR + ZVOP-2 · Consent Mode v2 za Google Analytics
 * Dvojezično (SL/EN) — jezik se prebere iz <html lang="..."> strani, ki naloži ta file.
 *
 * PRIVACY_URL / COOKIES_URL sta jezikovno odvisna:
 *  - SL: /politika-zasebnosti/, /politika-piskotkov/
 *  - EN: /en/privacy-policy/, /en/cookie-policy/
 *
 * KAKO DELUJE:
 * - Ob prvem obisku se prikaže baner
 * - Obiskovalec sprejme, zavrne ali nastavi po meri
 * - Odločitev se shrani v localStorage za 365 dni
 * - Google Analytics se aktivira SAMO ob privolitvi
 */

(function() {

  // ── JEZIK ───────────────────────────────────────────────────
  const LANG = (document.documentElement.lang || 'sl').toLowerCase().startsWith('en') ? 'en' : 'sl';

  // ── PREVODI ─────────────────────────────────────────────────
  const I18N = {
    sl: {
      privacyUrl: '/politika-zasebnosti/',
      cookiesUrl: '/politika-piskotkov/',
      bannerTitle: 'Piškotki na grafeio.si',
      bannerText: 'Uporabljamo piškotke za analitiko obiskanosti. Vaši podatki so vaši — soglasje lahko kadar koli spremenite.',
      settings: 'Nastavitve',
      privacyPolicy: 'Politika zasebnosti',
      cookiePolicy: 'Politika piškotkov',
      rejectAll: 'Zavrni vse',
      acceptAll: 'Sprejmi vse',
      modalTitle: 'Nastavitve piškotkov',
      modalSub: 'Izberite katere piškotke dovolite. Nujno potrebni piškotki so vedno aktivni in zagotavljajo osnovno delovanje strani.',
      necessaryTitle: 'Nujno potrebni',
      necessaryDesc: 'Zagotavljajo osnovno delovanje strani. Ne morejo biti onemogočeni.',
      analyticsTitle: 'Analitika (Google Analytics)',
      analyticsDesc: 'Pomagajo nam razumeti kako obiskovalci uporabljajo stran. Podatki so anonimni in se ne delijo z oglaševalci.',
      saveSettings: 'Shrani nastavitve'
    },
    en: {
      privacyUrl: '/en/privacy-policy/',
      cookiesUrl: '/en/cookie-policy/',
      bannerTitle: 'Cookies on grafeio.si',
      bannerText: 'We use cookies for visit analytics. Your data is yours — you can change your consent at any time.',
      settings: 'Settings',
      privacyPolicy: 'Privacy Policy',
      cookiePolicy: 'Cookie Policy',
      rejectAll: 'Reject all',
      acceptAll: 'Accept all',
      modalTitle: 'Cookie settings',
      modalSub: 'Choose which cookies to allow. Strictly necessary cookies are always active and ensure the site’s basic functioning.',
      necessaryTitle: 'Strictly necessary',
      necessaryDesc: 'Ensure the site’s basic functioning. Cannot be disabled.',
      analyticsTitle: 'Analytics (Google Analytics)',
      analyticsDesc: 'Help us understand how visitors use the site. Data is anonymous and never shared with advertisers.',
      saveSettings: 'Save settings'
    }
  };
  const T = I18N[LANG];

  // ── KONFIGURACIJA ──────────────────────────────────────────
  const CONFIG = {
    GA_ID: 'G-HWDJSS1EM5',
    PRIVACY_URL: T.privacyUrl,
    COOKIES_URL: T.cookiesUrl,
    STORAGE_KEY: 'grafeio_consent',
    EXPIRY_DAYS: 365
  };

  let analyticsLoaded = false;

  function ensureGtag() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function() {
      window.dataLayer.push(arguments);
    };
  }

  function loadAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    ensureGtag();
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.GA_ID);
    document.head.appendChild(script);

    gtag('js', new Date());
    gtag('config', CONFIG.GA_ID);
  }

  // ── PRIVZETE NASTAVITVE (pred privolitivjo) ─────────────────
  // Consent Mode v2 — vse zavrnjeno dokler ne da privolitve
  function setDefaultConsent() {
    ensureGtag();
    gtag('consent', 'default', {
      ad_storage:              'denied',
      ad_user_data:            'denied',
      ad_personalization:      'denied',
      analytics_storage:       'denied',
      functionality_storage:   'denied',
      personalization_storage: 'denied',
      security_storage:        'granted',
      wait_for_update:         500
    });
  }

  // ── POSODOBI CONSENT ────────────────────────────────────────
  function updateConsent(analytics) {
    ensureGtag();
    gtag('consent', 'update', {
      analytics_storage:       analytics ? 'granted' : 'denied',
      functionality_storage:   analytics ? 'granted' : 'denied',
      personalization_storage: 'denied',
      ad_storage:              'denied',
      ad_user_data:            'denied',
      ad_personalization:      'denied',
      security_storage:        'granted'
    });
    if (analytics) loadAnalytics();
  }

  // ── SHRANI ODLOČITEV ────────────────────────────────────────
  function saveConsent(data) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + CONFIG.EXPIRY_DAYS);
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
      expires: expiry.toISOString()
    }));
  }

  // ── PREBERI SHRANJENO ODLOČITEV ─────────────────────────────
  function getConsent() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (new Date() > new Date(data.expires)) {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  // ── SKRIJ BANER ─────────────────────────────────────────────
  function hideBanner() {
    const banner = document.getElementById('gc-banner');
    const modal  = document.getElementById('gc-modal');
    if (banner) banner.classList.add('gc-hidden');
    if (modal)  modal.classList.add('gc-hidden');
  }

  // ── SPREJMI VSE ─────────────────────────────────────────────
  function acceptAll() {
    saveConsent({ analytics: true, choice: 'accept_all' });
    updateConsent(true);
    hideBanner();
  }

  // ── ZAVRNI VSE ──────────────────────────────────────────────
  function rejectAll() {
    saveConsent({ analytics: false, choice: 'reject_all' });
    updateConsent(false);
    hideBanner();
  }

  // ── SHRANI PO MERI ──────────────────────────────────────────
  function saveCustom() {
    const analytics = document.getElementById('gc-toggle-analytics').checked;
    saveConsent({ analytics, choice: 'custom' });
    updateConsent(analytics);
    hideBanner();
  }

  // ── ODPRI NASTAVITVE ────────────────────────────────────────
  function openSettings() {
    const modal = document.getElementById('gc-modal');
    if (modal) modal.classList.remove('gc-hidden');
  }

  // ── USTVARI BANER HTML ──────────────────────────────────────
  function createBanner() {
    const banner = document.createElement('div');
    banner.id = 'gc-banner';
    banner.innerHTML = `
      <div class="gc-text">
        <strong>${T.bannerTitle}</strong><br>
        ${T.bannerText}
        <button type="button" onclick="document.getElementById('gc-modal').classList.remove('gc-hidden')">${T.settings}</button>
        &nbsp;·&nbsp;
        <a href="${CONFIG.PRIVACY_URL}" target="_blank">${T.privacyPolicy}</a>
        &nbsp;·&nbsp;
        <a href="${CONFIG.COOKIES_URL}" target="_blank">${T.cookiePolicy}</a>
      </div>
      <div class="gc-buttons">
        <button class="gc-btn gc-btn-settings" onclick="window._gcOpenSettings()">${T.settings}</button>
        <button class="gc-btn gc-btn-reject"   onclick="window._gcRejectAll()">${T.rejectAll}</button>
        <button class="gc-btn gc-btn-accept"   onclick="window._gcAcceptAll()">${T.acceptAll}</button>
      </div>
    `;
    document.body.appendChild(banner);
  }

  // ── USTVARI MODAL HTML ──────────────────────────────────────
  function createModal() {
    const modal = document.createElement('div');
    modal.id = 'gc-modal';
    modal.classList.add('gc-hidden');
    modal.innerHTML = `
      <div class="gc-modal-box">
        <h3 class="gc-modal-title">${T.modalTitle}</h3>
        <p class="gc-modal-sub">
          ${T.modalSub}
        </p>

        <div class="gc-option">
          <div class="gc-option-text">
            <h4>${T.necessaryTitle}</h4>
            <p>${T.necessaryDesc}</p>
          </div>
          <label class="gc-toggle">
            <input type="checkbox" checked disabled>
            <span class="gc-toggle-slider"></span>
          </label>
        </div>

        <div class="gc-option">
          <div class="gc-option-text">
            <h4>${T.analyticsTitle}</h4>
            <p>${T.analyticsDesc}</p>
          </div>
          <label class="gc-toggle">
            <input type="checkbox" id="gc-toggle-analytics">
            <span class="gc-toggle-slider"></span>
          </label>
        </div>

        <div class="gc-modal-buttons">
          <button class="gc-btn gc-btn-reject"  onclick="window._gcRejectAll()">${T.rejectAll}</button>
          <button class="gc-btn gc-btn-settings" onclick="window._gcSaveCustom()">${T.saveSettings}</button>
          <button class="gc-btn gc-btn-accept"  onclick="window._gcAcceptAll()">${T.acceptAll}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // ── INICIALIZACIJA ──────────────────────────────────────────
  function init() {
    setDefaultConsent();

    const existing = getConsent();

    if (existing) {
      // Obnovi privolitev iz localStorage
      updateConsent(existing.analytics);
      return;
    }

    // Prikaži baner ob nalaganju strani
    window.addEventListener('DOMContentLoaded', function() {
      createBanner();
      createModal();
    });
  }

  // ── GLOBALNE FUNKCIJE (za onclick atribute) ─────────────────
  window._gcAcceptAll   = acceptAll;
  window._gcRejectAll   = rejectAll;
  window._gcSaveCustom  = saveCustom;
  window._gcOpenSettings = openSettings;

  // Zaženemo
  init();

})();
