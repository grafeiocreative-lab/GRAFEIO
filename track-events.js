/* GRAFEIO — merjenje klikov (GA4 dogodki)
 * gtag obstaja tudi pred privolitvijo; zato preverimo shranjeno dovoljenje
 * pred vsakim dogodkom in zavrnjenih dogodkov ne dodajamo v čakalno vrsto. */
(function () {
  'use strict';

  var LANG = (document.documentElement.lang || 'sl').slice(0, 2);

  function hasAnalyticsConsent() {
    try {
      var consent = JSON.parse(localStorage.getItem('grafeio_consent') || 'null');
      return !!(consent && consent.analytics === true &&
        consent.expires && new Date(consent.expires) > new Date());
    } catch (e) {
      return false;
    }
  }

  function track(name, params) {
    if (!hasAnalyticsConsent() || typeof window.gtag !== 'function') return;
    params = params || {};
    params.page_lang = LANG;
    window.gtag('event', name, params);
  }
  window.trackEvent = track;

  function text(el) {
    return (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;

    var href = a.getAttribute('href') || '';
    var label = text(a);

    if (href.indexOf('tel:') === 0) {
      track('click_phone', { link_text: label });
    } else if (href.indexOf('mailto:') === 0) {
      track('click_email', { link_text: label });
    } else if (/instagram\.com|tiktok\.com/i.test(href)) {
      track('click_social', { network: /instagram/i.test(href) ? 'instagram' : 'tiktok' });
    } else if (href === '#povprasajte' || href === '#contact') {
      track('click_cta', { cta_target: href.slice(1), link_text: label });
    } else if (href.charAt(0) === '#' && href.length > 1) {
      track('click_nav', { section: href.slice(1), link_text: label });
    } else if (href.charAt(0) === '/' || href.indexOf(location.origin) === 0) {
      track('click_nav', { link_url: href, link_text: label });
    }
  }, true);
})();
