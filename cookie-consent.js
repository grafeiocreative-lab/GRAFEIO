/**
 * GRAFEIO · Cookie Consent Banner
 * GDPR + ZVOP-2 · Consent Mode v2 za Google Analytics
 *
 * KAKO AKTIVIRATI:
 * 1. Ko ima Barbara pripravljene dokumente, v index.html posodobi URL-je:
 *    - PRIVACY_URL → link na politiko zasebnosti
 *    - COOKIES_URL → link na politiko piškotkov
 *
 * KAKO DELUJE:
 * - Ob prvem obisku se prikaže baner
 * - Obiskovalec sprejme, zavrne ali nastavi po meri
 * - Odločitev se shrani v localStorage za 365 dni
 * - Google Analytics se aktivira SAMO ob privolitvi
 */

(function() {

  // ── KONFIGURACIJA ──────────────────────────────────────────
  const CONFIG = {
    GA_ID: 'G-HWDJSS1EM5',
    PRIVACY_URL: '/politika-zasebnosti',    // ← posodobi ko bo Barbara imela dokument
    COOKIES_URL: '/politika-piskotkov',     // ← posodobi ko bo Barbara imela dokument
    STORAGE_KEY: 'grafeio_consent',
    EXPIRY_DAYS: 365
  };

  // ── PRIVZETE NASTAVITVE (pred privolitivjo) ─────────────────
  // Consent Mode v2 — vse zavrnjeno dokler ne da privolitve
  function setDefaultConsent() {
    if (typeof gtag !== 'undefined') {
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
  }

  // ── POSODOBI CONSENT ────────────────────────────────────────
  function updateConsent(analytics) {
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        analytics_storage:       analytics ? 'granted' : 'denied',
        functionality_storage:   analytics ? 'granted' : 'denied',
        personalization_storage: 'denied',
        ad_storage:              'denied',
        ad_user_data:            'denied',
        ad_personalization:      'denied',
        security_storage:        'granted'
      });
    }
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
        <strong>Piškotki na grafeio.si</strong><br>
        Uporabljamo piškotke za analitiko obiskanosti. Vaši podatki so vaši —
        soglasje lahko kadar koli spremenite.
        <button type="button" onclick="document.getElementById('gc-modal').classList.remove('gc-hidden')">Nastavitve</button>
        &nbsp;·&nbsp;
        <a href="${CONFIG.PRIVACY_URL}" target="_blank">Politika zasebnosti</a>
        &nbsp;·&nbsp;
        <a href="${CONFIG.COOKIES_URL}" target="_blank">Politika piškotkov</a>
      </div>
      <div class="gc-buttons">
        <button class="gc-btn gc-btn-settings" onclick="window._gcOpenSettings()">Nastavitve</button>
        <button class="gc-btn gc-btn-reject"   onclick="window._gcRejectAll()">Zavrni vse</button>
        <button class="gc-btn gc-btn-accept"   onclick="window._gcAcceptAll()">Sprejmi vse</button>
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
        <h3 class="gc-modal-title">Nastavitve piškotkov</h3>
        <p class="gc-modal-sub">
          Izberite katere piškotke dovolite. Nujno potrebni piškotki so vedno aktivni
          in zagotavljajo osnovno delovanje strani.
        </p>

        <div class="gc-option">
          <div class="gc-option-text">
            <h4>Nujno potrebni</h4>
            <p>Zagotavljajo osnovno delovanje strani. Ne morejo biti onemogočeni.</p>
          </div>
          <label class="gc-toggle">
            <input type="checkbox" checked disabled>
            <span class="gc-toggle-slider"></span>
          </label>
        </div>

        <div class="gc-option">
          <div class="gc-option-text">
            <h4>Analitika (Google Analytics)</h4>
            <p>Pomagajo nam razumeti kako obiskovalci uporabljajo stran.
               Podatki so anonimni in se ne delijo z oglaševalci.</p>
          </div>
          <label class="gc-toggle">
            <input type="checkbox" id="gc-toggle-analytics">
            <span class="gc-toggle-slider"></span>
          </label>
        </div>

        <div class="gc-modal-buttons">
          <button class="gc-btn gc-btn-reject"  onclick="window._gcRejectAll()">Zavrni vse</button>
          <button class="gc-btn gc-btn-settings" onclick="window._gcSaveCustom()">Shrani nastavitve</button>
          <button class="gc-btn gc-btn-accept"  onclick="window._gcAcceptAll()">Sprejmi vse</button>
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
