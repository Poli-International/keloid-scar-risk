// js/app.js
// V2: Keloid, Hypertrophic Scar & Bump Guide
'use strict';

window.I18N = window.I18N || {};

(function () {
  const DEFAULT_LANG = 'en';
  const SUPPORTED_LANGS = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'nl', name: 'Nederlands' }
  ];

  let currentLang = DEFAULT_LANG;

  // Read language from localStorage
  try {
    const saved = localStorage.getItem('poli_tools_language');
    if (saved && SUPPORTED_LANGS.some(l => l.code === saved)) {
      currentLang = saved;
    }
  } catch (e) {
    // localStorage might be blocked in strict iframes
  }

  // Safe HTML Escaper (Ensures any untrusted or dynamic content is safely encoded before DOM insertion)
  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // URL parameters for Studio Co-branding (?studio=...&contact=...)
  function getUrlParams() {
    try {
      const params = new URLSearchParams(window.location.search);
      const studio = params.get('studio');
      const contact = params.get('contact');
      return {
        studio: studio ? studio.trim() : '',
        contact: contact ? contact.trim() : ''
      };
    } catch (e) {
      return { studio: '', contact: '' };
    }
  }

  // Translation lookup helper
  function t(path, params) {
    const dict = (window.I18N && window.I18N[currentLang]) || (window.I18N && window.I18N.en) || {};
    const parts = path.split('.');
    let val = dict;
    for (let i = 0; i < parts.length; i++) {
      if (val && typeof val === 'object' && parts[i] in val) {
        val = val[parts[i]];
      } else {
        // Fallback to English if currentLang failed
        let fb = (window.I18N && window.I18N.en) || {};
        for (let j = 0; j < parts.length; j++) {
          if (fb && typeof fb === 'object' && parts[j] in fb) {
            fb = fb[parts[j]];
          } else {
            fb = null;
            break;
          }
        }
        val = fb != null ? fb : path;
        break;
      }
    }

    if (typeof val === 'string' && params && typeof params === 'object') {
      return val.replace(/\{([^{}]+)\}/g, (match, key) => {
        return key in params ? String(params[key]) : match;
      });
    }

    return (typeof val === 'string' || (val && typeof val === 'object')) ? val : path;
  }

  // State for user entries to persist across language toggles
  const state = {
    factors: {
      personal: '',
      family: '',
      skin: '',
      location: '',
      past_reaction: ''
    },
    factorsEvaluated: false,
    consultation: {
      procedure_type: '',
      anatomical_site: '',
      procedure_date: '',
      bump_onset: '',
      behavior_since: '',
      symptoms: '',
      attempted_remedies: '',
      notes: ''
    },
    additionalSites: [], // Array of site objects { procedure_type, anatomical_site, bump_onset, behavior_since, symptoms }
    searchQuery: '', // Real-time search filter query for aftercare & sites
    troubleshootChecks: {}, // Friction & pressure checklist selections { [key]: boolean }
    activeLayerTooltip: { bump: null, hypertrophic: null, keloid: null }, // Micro-magnifier active layer
    zoomActive: { bump: false, hypertrophic: false, keloid: false }, // Micro-magnifier zoom toggles
    selectedDiagramSite: null // Active anatomical diagram selection
  };

  // SVGs for the three cross-sections (greyscale readable, inline SVG, semantic markup)
  function renderSvgBump() {
    return `
      <svg class="scar-svg" viewBox="0 0 320 170" role="img" aria-labelledby="svg-bump-title svg-bump-desc">
        <title id="svg-bump-title">${escHtml(t('comparison.bump.svg_title'))}</title>
        <desc id="svg-bump-desc">${escHtml(t('comparison.bump.svg_desc'))}</desc>
        <defs>
          <pattern id="pat-bump" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.6"/>
          </pattern>
        </defs>
        <!-- Skin base layers -->
        <rect x="10" y="70" width="300" height="90" fill="var(--bg-input)" stroke="var(--border)" stroke-width="1.5"/>
        <line x1="10" y1="115" x2="310" y2="115" stroke="var(--border)" stroke-dasharray="4 3" stroke-width="1"/>
        <text x="18" y="95" font-size="11" fill="var(--text-muted)">${escHtml(t('comparison.svg.layer_epidermis_dermis'))}</text>
        <text x="18" y="140" font-size="11" fill="var(--text-muted)">${escHtml(t('comparison.svg.layer_subcutaneous_cartilage'))}</text>
        
        <!-- Piercing fistula (channel) -->
        <rect x="154" y="50" width="12" height="110" fill="var(--bg-card)" stroke="var(--border)" stroke-width="1.5"/>
        <line x1="160" y1="30" x2="160" y2="165" stroke="currentColor" stroke-width="3"/>
        
        <!-- Original wound boundary markers -->
        <line x1="146" y1="40" x2="146" y2="100" stroke="var(--text-muted)" stroke-dasharray="2 2" stroke-width="1"/>
        <line x1="174" y1="40" x2="174" y2="100" stroke="var(--text-muted)" stroke-dasharray="2 2" stroke-width="1"/>
        <text x="95" y="45" font-size="11" fill="var(--text-muted)" text-anchor="middle">${escHtml(t('comparison.bump.svg_wound_margin'))}</text>
        <path d="M125 43 L144 43" stroke="var(--text-muted)" stroke-width="1"/>
        
        <!-- Focal irritation bump hugging exit orifice -->
        <path d="M 138 70 Q 148 44 160 44 Q 172 44 182 70 Z" fill="url(#pat-bump)" stroke="currentColor" stroke-width="2"/>
        
        <!-- Annotation label -->
        <rect x="185" y="40" width="125" height="34" rx="4" fill="var(--bg-card)" stroke="var(--border)" stroke-width="1"/>
        <text x="190" y="53" font-size="11" font-weight="bold" fill="var(--text-main)">${escHtml(t('comparison.bump.svg_focal_bump'))}</text>
        <text x="190" y="66" font-size="11" fill="var(--text-muted)">${escHtml(t('comparison.bump.svg_resolves_trigger'))}</text>

        <!-- Micro-magnifier interactive pinpoints -->
        <g class="svg-tooltip-pin" data-card="bump" data-layer="epidermis" tabindex="0" role="button" aria-label="${escHtml(t('magnifier.layers.epidermis.title'))}">
          <circle class="pin-base" cx="45" cy="74" r="5"/>
          <text x="45" y="77" font-size="8" fill="var(--bg-card)" font-weight="bold" text-anchor="middle">i</text>
        </g>
        <g class="svg-tooltip-pin" data-card="bump" data-layer="fistula" tabindex="0" role="button" aria-label="${escHtml(t('magnifier.layers.fistula.title'))}">
          <circle class="pin-base" cx="160" cy="115" r="5"/>
          <text x="160" y="118" font-size="8" fill="var(--bg-card)" font-weight="bold" text-anchor="middle">i</text>
        </g>
        <g class="svg-tooltip-pin" data-card="bump" data-layer="granulation" tabindex="0" role="button" aria-label="${escHtml(t('magnifier.layers.granulation.title'))}">
          <circle class="pin-base" cx="160" cy="56" r="5"/>
          <text x="160" y="59" font-size="8" fill="var(--bg-card)" font-weight="bold" text-anchor="middle">i</text>
        </g>
      </svg>
    `;
  }

  function renderSvgHypertrophic() {
    return `
      <svg class="scar-svg" viewBox="0 0 320 170" role="img" aria-labelledby="svg-hyper-title svg-hyper-desc">
        <title id="svg-hyper-title">${escHtml(t('comparison.hypertrophic.svg_title'))}</title>
        <desc id="svg-hyper-desc">${escHtml(t('comparison.hypertrophic.svg_desc'))}</desc>
        <defs>
          <pattern id="pat-hyper" width="6" height="6" patternUnits="userSpaceOnUse">
            <line x1="0" y1="3" x2="6" y2="3" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.7"/>
          </pattern>
        </defs>
        <!-- Skin base layers -->
        <rect x="10" y="70" width="300" height="90" fill="var(--bg-input)" stroke="var(--border)" stroke-width="1.5"/>
        <line x1="10" y1="115" x2="310" y2="115" stroke="var(--border)" stroke-dasharray="4 3" stroke-width="1"/>
        <text x="18" y="95" font-size="11" fill="var(--text-muted)">${escHtml(t('comparison.svg.layer_epidermis_dermis'))}</text>
        <text x="18" y="140" font-size="11" fill="var(--text-muted)">${escHtml(t('comparison.svg.layer_subcutaneous_cartilage'))}</text>
        
        <!-- Puncture channel -->
        <rect x="154" y="50" width="12" height="110" fill="var(--bg-card)" stroke="var(--border)" stroke-width="1.5"/>
        <line x1="160" y1="30" x2="160" y2="165" stroke="currentColor" stroke-width="3"/>
        
        <!-- Wound boundary markers (exact limits) -->
        <line x1="135" y1="30" x2="135" y2="110" stroke="currentColor" stroke-dasharray="3 2" stroke-width="1.5"/>
        <line x1="185" y1="30" x2="185" y2="110" stroke="currentColor" stroke-dasharray="3 2" stroke-width="1.5"/>
        <text x="135" y="22" font-size="11" font-weight="bold" fill="var(--text-muted)" text-anchor="middle">${escHtml(t('comparison.hypertrophic.svg_limit_a'))}</text>
        <text x="185" y="22" font-size="11" font-weight="bold" fill="var(--text-muted)" text-anchor="middle">${escHtml(t('comparison.hypertrophic.svg_limit_b'))}</text>
        
        <!-- Hypertrophic scar: elevated strictly within wound margins -->
        <path d="M 135 70 Q 140 38 160 38 Q 180 38 185 70 Z" fill="url(#pat-hyper)" stroke="currentColor" stroke-width="2"/>
        
        <!-- Annotation label -->
        <rect x="185" y="38" width="125" height="34" rx="4" fill="var(--bg-card)" stroke="var(--border)" stroke-width="1"/>
        <text x="190" y="52" font-size="11" font-weight="bold" fill="var(--text-main)">${escHtml(t('comparison.hypertrophic.svg_confined_wound'))}</text>
        <text x="190" y="66" font-size="11" fill="var(--text-muted)">${escHtml(t('comparison.hypertrophic.svg_no_invasion'))}</text>

        <!-- Micro-magnifier interactive pinpoints -->
        <g class="svg-tooltip-pin" data-card="hypertrophic" data-layer="reticular_dermis" tabindex="0" role="button" aria-label="${escHtml(t('magnifier.layers.reticular_dermis.title'))}">
          <circle class="pin-base" cx="55" cy="100" r="5"/>
          <text x="55" y="103" font-size="8" fill="var(--bg-card)" font-weight="bold" text-anchor="middle">i</text>
        </g>
        <g class="svg-tooltip-pin" data-card="hypertrophic" data-layer="hypertrophic_collagen" tabindex="0" role="button" aria-label="${escHtml(t('magnifier.layers.hypertrophic_collagen.title'))}">
          <circle class="pin-base" cx="160" cy="52" r="5"/>
          <text x="160" y="55" font-size="8" fill="var(--bg-card)" font-weight="bold" text-anchor="middle">i</text>
        </g>
        <g class="svg-tooltip-pin" data-card="hypertrophic" data-layer="subcutaneous" tabindex="0" role="button" aria-label="${escHtml(t('magnifier.layers.subcutaneous.title'))}">
          <circle class="pin-base" cx="240" cy="138" r="5"/>
          <text x="240" y="141" font-size="8" fill="var(--bg-card)" font-weight="bold" text-anchor="middle">i</text>
        </g>
      </svg>
    `;
  }

  function renderSvgKeloid() {
    return `
      <svg class="scar-svg" viewBox="0 0 320 170" role="img" aria-labelledby="svg-keloid-title svg-keloid-desc">
        <title id="svg-keloid-title">${escHtml(t('comparison.keloid.svg_title'))}</title>
        <desc id="svg-keloid-desc">${escHtml(t('comparison.keloid.svg_desc'))}</desc>
        <defs>
          <pattern id="pat-keloid" width="8" height="8" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="8" y2="8" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.8"/>
            <line x1="8" y1="0" x2="0" y2="8" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.8"/>
          </pattern>
        </defs>
        <!-- Skin base layers -->
        <rect x="10" y="70" width="300" height="90" fill="var(--bg-input)" stroke="var(--border)" stroke-width="1.5"/>
        <line x1="10" y1="115" x2="310" y2="115" stroke="var(--border)" stroke-dasharray="4 3" stroke-width="1"/>
        <text x="18" y="95" font-size="11" fill="var(--text-muted)">${escHtml(t('comparison.svg.layer_epidermis_dermis'))}</text>
        <text x="18" y="140" font-size="11" fill="var(--text-muted)">${escHtml(t('comparison.svg.layer_subcutaneous_cartilage'))}</text>
        
        <!-- Puncture channel -->
        <rect x="154" y="50" width="12" height="110" fill="var(--bg-card)" stroke="var(--border)" stroke-width="1.5"/>
        
        <!-- Original wound boundary markers (overpassed) -->
        <line x1="140" y1="35" x2="140" y2="105" stroke="var(--text-muted)" stroke-dasharray="2 2" stroke-width="1"/>
        <line x1="180" y1="35" x2="180" y2="105" stroke="var(--text-muted)" stroke-dasharray="2 2" stroke-width="1"/>
        
        <!-- Massive keloid growth overflowing original boundary -->
        <path d="M 85 70 C 80 15, 140 18, 160 20 C 180 18, 240 15, 235 70 C 220 85, 195 88, 160 88 C 125 88, 100 85, 85 70 Z" 
              fill="url(#pat-keloid)" stroke="currentColor" stroke-width="2.5"/>
        
        <!-- Arrows showing invasion beyond boundaries -->
        <text x="50" y="42" font-size="11" font-weight="bold" fill="var(--text-main)">${escHtml(t('comparison.keloid.svg_spreads_left'))}</text>
        <text x="215" y="42" font-size="11" font-weight="bold" fill="var(--text-main)">${escHtml(t('comparison.keloid.svg_spreads_right'))}</text>
        
        <!-- Annotation label -->
        <rect x="175" y="105" width="135" height="34" rx="4" fill="var(--bg-card)" stroke="var(--border)" stroke-width="1"/>
        <text x="180" y="118" font-size="11" font-weight="bold" fill="var(--text-main)">${escHtml(t('comparison.keloid.svg_true_invasion'))}</text>
        <text x="180" y="132" font-size="11" fill="var(--text-muted)">${escHtml(t('comparison.keloid.svg_invades_skin'))}</text>

        <!-- Micro-magnifier interactive pinpoints -->
        <g class="svg-tooltip-pin" data-card="keloid" data-layer="papillary_dermis" tabindex="0" role="button" aria-label="${escHtml(t('magnifier.layers.papillary_dermis.title'))}">
          <circle class="pin-base" cx="45" cy="85" r="5"/>
          <text x="45" y="88" font-size="8" fill="var(--bg-card)" font-weight="bold" text-anchor="middle">i</text>
        </g>
        <g class="svg-tooltip-pin" data-card="keloid" data-layer="keloid_collagen" tabindex="0" role="button" aria-label="${escHtml(t('magnifier.layers.keloid_collagen.title'))}">
          <circle class="pin-base" cx="160" cy="40" r="5"/>
          <text x="160" y="43" font-size="8" fill="var(--bg-card)" font-weight="bold" text-anchor="middle">i</text>
        </g>
      </svg>
    `;
  }

  // Render Co-branding banner if query parameters are supplied
  function renderCobrandBanner() {
    const { studio, contact } = getUrlParams();
    if (!studio) return '';

    return `
      <div class="cobrand-banner" id="cobrand-banner" role="banner">
        <div class="cobrand-info">
          <div class="cobrand-title">
            <strong>${escHtml(t('cobrand.provided_by', { studio }))}</strong>
          </div>
          ${contact ? `<div class="cobrand-contact">${escHtml(t('cobrand.contact', { contact }))}</div>` : ''}
        </div>
        <div class="cobrand-attribution">
          ${escHtml(t('cobrand.powered_by'))}
        </div>
      </div>
    `;
  }

  // Render Section 1: Comparison & Cross-Sections
  function renderComparisonSection() {
    const bumpLayer = state.activeLayerTooltip.bump;
    const hyperLayer = state.activeLayerTooltip.hypertrophic;
    const keloidLayer = state.activeLayerTooltip.keloid;

    return `
      <section class="tool-section" id="section-comparison">
        <div class="section-head">
          <h2>${escHtml(t('comparison.section_title'))}</h2>
          <p class="section-desc">${escHtml(t('comparison.section_desc'))}</p>
        </div>

        <div class="card-grid-3">
          <!-- Bump Card -->
          <article class="info-card" id="card-bump">
            <div class="card-badge badge-neutral">${escHtml(t('comparison.bump.badge'))}</div>
            <h3>${escHtml(t('comparison.bump.title'))}</h3>
            <div class="card-subtitle">${escHtml(t('comparison.bump.subtitle'))}</div>
            
            <div class="svg-wrap ${state.zoomActive.bump ? 'svg-magnifier-active' : ''}" id="svg-wrap-bump">
              <button type="button" class="magnifier-btn" data-card="bump" aria-label="${escHtml(t('magnifier.hint'))}">
                🔍 ${state.zoomActive.bump ? '1x' : '1.4x'}
              </button>
              ${renderSvgBump()}
            </div>

            ${bumpLayer ? `
              <div class="svg-pin-callout" role="tooltip">
                <strong>${escHtml(t('magnifier.layers.' + bumpLayer + '.title'))}:</strong>
                ${escHtml(t('magnifier.layers.' + bumpLayer + '.desc'))}
              </div>
            ` : `
              <div class="magnifier-hint-text text-muted" style="font-size:0.75rem;margin-top:0.4rem;">
                ${escHtml(t('magnifier.hint'))}
              </div>
            `}

            <ul class="card-meta">
              <li><strong>${escHtml(t('comparison.labels.boundary'))}</strong> ${escHtml(t('comparison.bump.boundary'))}</li>
              <li><strong>${escHtml(t('comparison.labels.onset'))}</strong> ${escHtml(t('comparison.bump.timing'))}</li>
              <li><strong>${escHtml(t('comparison.labels.cause'))}</strong> ${escHtml(t('comparison.bump.causes'))}</li>
              <li><strong>${escHtml(t('comparison.labels.outcome'))}</strong> ${escHtml(t('comparison.bump.resolution'))}</li>
            </ul>
          </article>

          <!-- Hypertrophic Card -->
          <article class="info-card" id="card-hypertrophic">
            <div class="card-badge badge-warning">${escHtml(t('comparison.hypertrophic.badge'))}</div>
            <h3>${escHtml(t('comparison.hypertrophic.title'))}</h3>
            <div class="card-subtitle">${escHtml(t('comparison.hypertrophic.subtitle'))}</div>
            
            <div class="svg-wrap ${state.zoomActive.hypertrophic ? 'svg-magnifier-active' : ''}" id="svg-wrap-hypertrophic">
              <button type="button" class="magnifier-btn" data-card="hypertrophic" aria-label="${escHtml(t('magnifier.hint'))}">
                🔍 ${state.zoomActive.hypertrophic ? '1x' : '1.4x'}
              </button>
              ${renderSvgHypertrophic()}
            </div>

            ${hyperLayer ? `
              <div class="svg-pin-callout" role="tooltip">
                <strong>${escHtml(t('magnifier.layers.' + hyperLayer + '.title'))}:</strong>
                ${escHtml(t('magnifier.layers.' + hyperLayer + '.desc'))}
              </div>
            ` : `
              <div class="magnifier-hint-text text-muted" style="font-size:0.75rem;margin-top:0.4rem;">
                ${escHtml(t('magnifier.hint'))}
              </div>
            `}

            <ul class="card-meta">
              <li><strong>${escHtml(t('comparison.labels.boundary'))}</strong> ${escHtml(t('comparison.hypertrophic.boundary'))}</li>
              <li><strong>${escHtml(t('comparison.labels.onset'))}</strong> ${escHtml(t('comparison.hypertrophic.timing'))}</li>
              <li><strong>${escHtml(t('comparison.labels.cause'))}</strong> ${escHtml(t('comparison.hypertrophic.causes'))}</li>
              <li><strong>${escHtml(t('comparison.labels.outcome'))}</strong> ${escHtml(t('comparison.hypertrophic.resolution'))}</li>
            </ul>
          </article>

          <!-- Keloid Card -->
          <article class="info-card" id="card-keloid">
            <div class="card-badge badge-danger">${escHtml(t('comparison.keloid.badge'))}</div>
            <h3>${escHtml(t('comparison.keloid.title'))}</h3>
            <div class="card-subtitle">${escHtml(t('comparison.keloid.subtitle'))}</div>
            
            <div class="svg-wrap ${state.zoomActive.keloid ? 'svg-magnifier-active' : ''}" id="svg-wrap-keloid">
              <button type="button" class="magnifier-btn" data-card="keloid" aria-label="${escHtml(t('magnifier.hint'))}">
                🔍 ${state.zoomActive.keloid ? '1x' : '1.4x'}
              </button>
              ${renderSvgKeloid()}
            </div>

            ${keloidLayer ? `
              <div class="svg-pin-callout" role="tooltip">
                <strong>${escHtml(t('magnifier.layers.' + keloidLayer + '.title'))}:</strong>
                ${escHtml(t('magnifier.layers.' + keloidLayer + '.desc'))}
              </div>
            ` : `
              <div class="magnifier-hint-text text-muted" style="font-size:0.75rem;margin-top:0.4rem;">
                ${escHtml(t('magnifier.hint'))}
              </div>
            `}

            <ul class="card-meta">
              <li><strong>${escHtml(t('comparison.labels.boundary'))}</strong> ${escHtml(t('comparison.keloid.boundary'))}</li>
              <li><strong>${escHtml(t('comparison.labels.onset'))}</strong> ${escHtml(t('comparison.keloid.timing'))}</li>
              <li><strong>${escHtml(t('comparison.labels.cause'))}</strong> ${escHtml(t('comparison.keloid.causes'))}</li>
              <li><strong>${escHtml(t('comparison.labels.outcome'))}</strong> ${escHtml(t('comparison.keloid.resolution'))}</li>
            </ul>
          </article>
        </div>

        <!-- Comparison Table (Responsive with mobile stacked card view) -->
        <div class="table-wrap">
          <table class="comparison-table">
            <thead>
              <tr>
                <th scope="col">${escHtml(t('comparison.table.feature'))}</th>
                <th scope="col">${escHtml(t('comparison.table.bump_col'))}</th>
                <th scope="col">${escHtml(t('comparison.table.hypertrophic_col'))}</th>
                <th scope="col">${escHtml(t('comparison.table.keloid_col'))}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">${escHtml(t('comparison.table.row_margin'))}</th>
                <td data-label="${escHtml(t('comparison.table.bump_col'))}">${escHtml(t('comparison.table.row_margin_bump'))}</td>
                <td data-label="${escHtml(t('comparison.table.hypertrophic_col'))}">${escHtml(t('comparison.table.row_margin_hypertrophic'))}</td>
                <td data-label="${escHtml(t('comparison.table.keloid_col'))}"><strong>${escHtml(t('comparison.table.row_margin_keloid'))}</strong></td>
              </tr>
              <tr>
                <th scope="row">${escHtml(t('comparison.table.row_onset'))}</th>
                <td data-label="${escHtml(t('comparison.table.bump_col'))}">${escHtml(t('comparison.table.row_onset_bump'))}</td>
                <td data-label="${escHtml(t('comparison.table.hypertrophic_col'))}">${escHtml(t('comparison.table.row_onset_hypertrophic'))}</td>
                <td data-label="${escHtml(t('comparison.table.keloid_col'))}">${escHtml(t('comparison.table.row_onset_keloid'))}</td>
              </tr>
              <tr>
                <th scope="row">${escHtml(t('comparison.table.row_resolution'))}</th>
                <td data-label="${escHtml(t('comparison.table.bump_col'))}">${escHtml(t('comparison.table.row_resolution_bump'))}</td>
                <td data-label="${escHtml(t('comparison.table.hypertrophic_col'))}">${escHtml(t('comparison.table.row_resolution_hypertrophic'))}</td>
                <td data-label="${escHtml(t('comparison.table.keloid_col'))}"><strong>${escHtml(t('comparison.table.row_resolution_keloid'))}</strong></td>
              </tr>
              <tr>
                <th scope="row">${escHtml(t('comparison.table.row_recurrence'))}</th>
                <td data-label="${escHtml(t('comparison.table.bump_col'))}">${escHtml(t('comparison.table.row_recurrence_bump'))}</td>
                <td data-label="${escHtml(t('comparison.table.hypertrophic_col'))}">${escHtml(t('comparison.table.row_recurrence_hypertrophic'))}</td>
                <td data-label="${escHtml(t('comparison.table.keloid_col'))}"><strong>${escHtml(t('comparison.table.row_recurrence_keloid'))}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  // Render Section 2: Timeline
  function renderTimelineSection() {
    const rawPhases = t('timeline.phases');
    const phases = Array.isArray(rawPhases) ? rawPhases : [];
    return `
      <section class="tool-section" id="section-timeline">
        <div class="section-head">
          <h2>${escHtml(t('timeline.section_title'))}</h2>
          <p class="section-desc">${escHtml(t('timeline.section_desc'))}</p>
        </div>

        <div class="timeline-container">
          ${phases.map((phase) => `
            <div class="timeline-node">
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <span class="timeline-time">${escHtml(phase.timeframe)}</span>
                <h3 class="timeline-title">${escHtml(phase.title)}</h3>
                <p class="timeline-body">${escHtml(phase.desc)}</p>
                <div class="timeline-clinical">
                  <strong>${escHtml(t('timeline.clinical_note_label'))}:</strong> ${escHtml(phase.clinical_note)}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  // Render Section 3: Pre-Procedure Discussion Factors (NO SCORE, NO RISK GRADE)
  function renderFactorsSection() {
    const personalOptions = Array.isArray(t('factors.personal.options')) ? t('factors.personal.options') : [];
    const familyOptions = Array.isArray(t('factors.family.options')) ? t('factors.family.options') : [];
    const skinOptions = Array.isArray(t('factors.skin.options')) ? t('factors.skin.options') : [];
    const locationOptions = Array.isArray(t('factors.location.options')) ? t('factors.location.options') : [];
    const reactionOptions = Array.isArray(t('factors.past_reaction.options')) ? t('factors.past_reaction.options') : [];

    return `
      <section class="tool-section" id="section-factors">
        <div class="section-head">
          <h2>${escHtml(t('factors.section_title'))}</h2>
          <p class="section-desc">${escHtml(t('factors.section_desc'))}</p>
        </div>

        <div class="factors-card">
          <form id="factors-form" class="factors-form" onsubmit="return false;">
            
            <!-- Factor 1: Personal History -->
            <fieldset class="factor-group" id="group-personal">
              <legend class="factor-legend">
                <span class="factor-num">1</span>
                ${escHtml(t('factors.personal.label'))}
              </legend>
              <div class="factor-options">
                ${personalOptions.map((opt, idx) => `
                  <label class="radio-label">
                    <input type="radio" name="personal" value="${idx}" ${state.factors.personal === String(idx) ? 'checked' : ''}>
                    <span>${escHtml(opt.text)}</span>
                  </label>
                `).join('')}
              </div>
            </fieldset>

            <!-- Factor 2: Family History -->
            <fieldset class="factor-group" id="group-family">
              <legend class="factor-legend">
                <span class="factor-num">2</span>
                ${escHtml(t('factors.family.label'))}
              </legend>
              <div class="factor-options">
                ${familyOptions.map((opt, idx) => `
                  <label class="radio-label">
                    <input type="radio" name="family" value="${idx}" ${state.factors.family === String(idx) ? 'checked' : ''}>
                    <span>${escHtml(opt.text)}</span>
                  </label>
                `).join('')}
              </div>
            </fieldset>

            <!-- Factor 3: Fitzpatrick / Skin Phototype -->
            <fieldset class="factor-group" id="group-skin">
              <legend class="factor-legend">
                <span class="factor-num">3</span>
                ${escHtml(t('factors.skin.label'))}
              </legend>
              <div class="factor-options">
                ${skinOptions.map((opt, idx) => `
                  <label class="radio-label">
                    <input type="radio" name="skin" value="${idx}" ${state.factors.skin === String(idx) ? 'checked' : ''}>
                    <span>${escHtml(opt.text)}</span>
                  </label>
                `).join('')}
              </div>
            </fieldset>

            <!-- Factor 4: Anatomical Location -->
            <fieldset class="factor-group" id="group-location">
              <legend class="factor-legend">
                <span class="factor-num">4</span>
                ${escHtml(t('factors.location.label'))}
              </legend>
              <div class="factor-options">
                ${locationOptions.map((opt, idx) => `
                  <label class="radio-label">
                    <input type="radio" name="location" value="${idx}" ${state.factors.location === String(idx) ? 'checked' : ''}>
                    <span>${escHtml(opt.text)}</span>
                  </label>
                `).join('')}
              </div>
            </fieldset>

            <!-- Factor 5: Reaction to Past Injuries -->
            <fieldset class="factor-group" id="group-past_reaction">
              <legend class="factor-legend">
                <span class="factor-num">5</span>
                ${escHtml(t('factors.past_reaction.label'))}
              </legend>
              <div class="factor-options">
                ${reactionOptions.map((opt, idx) => `
                  <label class="radio-label">
                    <input type="radio" name="past_reaction" value="${idx}" ${state.factors.past_reaction === String(idx) ? 'checked' : ''}>
                    <span>${escHtml(opt.text)}</span>
                  </label>
                `).join('')}
              </div>
            </fieldset>

            <div class="factors-actions">
              <button type="button" class="btn btn-primary" id="btn-eval-factors">
                ${escHtml(t('factors.evaluate_btn'))}
              </button>
              <button type="button" class="btn btn-secondary" id="btn-reset-factors">
                ${escHtml(t('factors.reset_btn'))}
              </button>
            </div>
          </form>

          <!-- Evaluation Results Panel (Neutral, Educational, No Score) -->
          <div class="factors-results" id="factors-results-container" ${state.factorsEvaluated ? '' : 'hidden'}>
            ${state.factorsEvaluated ? renderFactorsEvaluationResults() : ''}
          </div>
        </div>
      </section>
    `;
  }

  function renderFactorsEvaluationResults() {
    const persOpts = Array.isArray(t('factors.personal.options')) ? t('factors.personal.options') : [];
    const famOpts = Array.isArray(t('factors.family.options')) ? t('factors.family.options') : [];
    const skinOpts = Array.isArray(t('factors.skin.options')) ? t('factors.skin.options') : [];
    const locOpts = Array.isArray(t('factors.location.options')) ? t('factors.location.options') : [];
    const reactOpts = Array.isArray(t('factors.past_reaction.options')) ? t('factors.past_reaction.options') : [];

    const personal = state.factors.personal !== '' ? persOpts[state.factors.personal] : null;
    const family = state.factors.family !== '' ? famOpts[state.factors.family] : null;
    const skin = state.factors.skin !== '' ? skinOpts[state.factors.skin] : null;
    const location = state.factors.location !== '' ? locOpts[state.factors.location] : null;
    const reaction = state.factors.past_reaction !== '' ? reactOpts[state.factors.past_reaction] : null;

    return `
      <div class="results-header">
        <h3>${escHtml(t('factors.results_title'))}</h3>
        <p class="results-disclaimer">${escHtml(t('factors.results_disclaimer'))}</p>
      </div>

      <div class="observations-list">
        ${personal ? `
          <div class="obs-item">
            <span class="obs-tag">${escHtml(t('factors.labels.personal_history'))}</span>
            <p>${escHtml(personal.observation)}</p>
          </div>
        ` : ''}

        ${family ? `
          <div class="obs-item">
            <span class="obs-tag">${escHtml(t('factors.labels.family_history'))}</span>
            <p>${escHtml(family.observation)}</p>
          </div>
        ` : ''}

        ${skin ? `
          <div class="obs-item">
            <span class="obs-tag">${escHtml(t('factors.labels.skin_type'))}</span>
            <p>${escHtml(skin.observation)}</p>
          </div>
        ` : ''}

        ${location ? `
          <div class="obs-item">
            <span class="obs-tag">${escHtml(t('factors.labels.planned_site'))}</span>
            <p>${escHtml(location.observation)}</p>
          </div>
        ` : ''}

        ${reaction ? `
          <div class="obs-item">
            <span class="obs-tag">${escHtml(t('factors.labels.wound_healing'))}</span>
            <p>${escHtml(reaction.observation)}</p>
          </div>
        ` : ''}
      </div>

      <div class="transfer-box">
        <button type="button" class="btn btn-secondary" id="btn-transfer-to-consultation">
          📋 ${escHtml(t('factors.transfer_btn'))}
        </button>
      </div>
    `;
  }

  // Render Section 4: After a Piercing - What Helps a Bump Settle
  function renderAftercareSection() {
    const q = state.searchQuery.trim().toLowerCase();
    const rawPrinciples = t('aftercare.principles');
    const principles = Array.isArray(rawPrinciples) ? rawPrinciples : [];
    const rawFriction = t('aftercare.friction_items');
    const frictionItems = Array.isArray(rawFriction) ? rawFriction : [];
    const rawRemedies = t('aftercare.remedies_items');
    const remedies = Array.isArray(rawRemedies) ? rawRemedies : [];

    const filteredPrinciples = q ? principles.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)) : principles;
    const filteredFriction = q ? frictionItems.filter(c => c.name.toLowerCase().includes(q) || c.note.toLowerCase().includes(q)) : frictionItems;
    const filteredRemedies = q ? remedies.filter(r => r.name.toLowerCase().includes(q) || r.danger.toLowerCase().includes(q)) : remedies;

    const noMatches = q && filteredPrinciples.length === 0 && filteredFriction.length === 0 && filteredRemedies.length === 0;

    return `
      <section class="tool-section" id="section-aftercare">
        <div class="section-head">
          <h2>${escHtml(t('aftercare.section_title'))}</h2>
          <p class="section-desc">${escHtml(t('aftercare.section_desc'))}</p>
        </div>

        <!-- Real-time Search Filter Bar -->
        <div class="search-filter-bar no-print">
          <div class="search-input-wrap">
            <span class="search-icon" aria-hidden="true">🔍</span>
            <input type="text" id="filter-search-input" class="search-input"
                   placeholder="${escHtml(t('search.placeholder'))}"
                   value="${escHtml(state.searchQuery)}"
                   aria-label="${escHtml(t('search.label'))}">
            ${state.searchQuery ? `
              <button type="button" id="btn-clear-search" class="search-clear-btn" aria-label="${escHtml(t('search.clear'))}">✕</button>
            ` : ''}
          </div>
        </div>

        ${noMatches ? `
          <div class="search-no-results">
            <p>${escHtml(t('search.no_results'))}</p>
          </div>
        ` : ''}

        ${filteredPrinciples.length > 0 ? `
          <!-- 3 Principles -->
          <div class="card-grid-3">
            ${filteredPrinciples.map((p) => `
              <div class="info-card">
                <h3>${escHtml(p.title)}</h3>
                <p class="card-body-text">${escHtml(p.desc)}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${filteredFriction.length > 0 ? `
          <!-- Friction Causes Named -->
          <div class="content-block mt-4">
            <h3 class="block-title">${escHtml(t('aftercare.friction_title'))}</h3>
            <p class="block-desc">${escHtml(t('aftercare.friction_desc'))}</p>
            <div class="culprits-grid">
              ${filteredFriction.map(c => `
                <div class="culprit-card">
                  <strong>${escHtml(c.name)}</strong>
                  <p>${escHtml(c.note)}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${renderFrictionTroubleshootChecklist()}

        ${filteredRemedies.length > 0 ? `
          <!-- Dangerous Home Remedies Banned -->
          <div class="content-block mt-4 alert-box alert-warning">
            <h3 class="block-title">${escHtml(t('aftercare.remedies_title'))}</h3>
            <p class="block-desc">${escHtml(t('aftercare.remedies_desc'))}</p>
            <div class="remedies-list">
              ${filteredRemedies.map(r => `
                <div class="remedy-item">
                  <span class="remedy-badge">${escHtml(t('aftercare.do_not_use_badge'))}</span>
                  <strong>${escHtml(r.name)}:</strong>
                  <span>${escHtml(r.danger)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Outbound Poli Tools Links -->
        <div class="content-block mt-4">
          <h3 class="block-title">${escHtml(t('aftercare.links_title'))}</h3>
          <div class="card-grid-3">
            <a href="https://poliinternational.com/jewelry-size-visualizer/" target="_top" class="tool-link-card">
              <h4>${escHtml(t('aftercare.links.sizing'))} ↗</h4>
              <p>${escHtml(t('aftercare.links.sizing_desc'))}</p>
            </a>
            <a href="https://poliinternational.com/aftercare-schedule-generator/" target="_top" class="tool-link-card">
              <h4>${escHtml(t('aftercare.links.aftercare'))} ↗</h4>
              <p>${escHtml(t('aftercare.links.aftercare_desc'))}</p>
            </a>
            <a href="https://poliinternational.com/healing-tracker/" target="_top" class="tool-link-card">
              <h4>${escHtml(t('aftercare.links.tracker'))} ↗</h4>
              <p>${escHtml(t('aftercare.links.tracker_desc'))}</p>
            </a>
          </div>
        </div>
      </section>
    `;
  }

  // Render Friction & Pressure Troubleshooting Checklist (Interactive, generates specific habit adjustments)
  function renderFrictionTroubleshootChecklist() {
    const rawItems = t('troubleshoot.items');
    const items = (rawItems && typeof rawItems === 'object' && !Array.isArray(rawItems)) ? rawItems : {};
    const checkedKeys = Object.keys(state.troubleshootChecks).filter(k => state.troubleshootChecks[k]);

    return `
      <div class="friction-checklist-card no-print">
        <h3 class="block-title">${escHtml(t('troubleshoot.title'))}</h3>
        <p class="block-desc">${escHtml(t('troubleshoot.desc'))}</p>
        
        <div class="checklist-items-grid">
          ${Object.keys(items).map(key => {
            const item = items[key];
            const isChecked = !!state.troubleshootChecks[key];
            return `
              <label class="check-item-label">
                <input type="checkbox" class="friction-check-input" data-key="${escHtml(key)}" ${isChecked ? 'checked' : ''}>
                <span class="check-item-text">${escHtml(item.label)}</span>
              </label>
            `;
          }).join('')}
        </div>

        <div class="friction-actions-panel" id="friction-actions-panel">
          <div class="friction-actions-title">${escHtml(t('troubleshoot.actions_heading'))}</div>
          ${checkedKeys.length === 0 ? `
            <p class="text-muted">${escHtml(t('troubleshoot.no_items_selected'))}</p>
          ` : `
            <ul class="friction-actions-list">
              ${checkedKeys.map(k => `
                <li class="friction-action-item">
                  <strong>${escHtml(items[k].label)}:</strong> ${escHtml(items[k].action)}
                </li>
              `).join('')}
            </ul>
          `}
        </div>
      </div>
    `;
  }

  // Render Anatomical Diagram Selector (Inline SVGs for Body and Ear Cartilage)
  function renderAnatomicalDiagramSelector() {
    return `
      <div class="anatomical-diagram-card no-print" id="anatomical-diagram-card">
        <h3 class="block-title">${escHtml(t('map.title'))}</h3>
        <p class="diagram-instructions">${escHtml(t('map.desc'))}</p>
        
        <div class="diagram-maps-grid">
          <!-- Ear Cartilage & Lobe Map -->
          <div class="diagram-panel">
            <div class="diagram-panel-title">👂 ${escHtml(t('map.ear_view'))}</div>
            <div class="diagram-svg-wrap">
              <svg class="diagram-svg" viewBox="0 0 240 280" role="img" aria-label="${escHtml(t('map.ear_view'))}">
                <!-- Outer Ear Outline -->
                <path d="M 120 20 C 60 20, 30 70, 35 140 C 40 210, 75 250, 110 260 C 135 265, 155 240, 150 215 C 145 190, 135 185, 135 160 C 135 130, 165 90, 150 45 C 142 30, 132 20, 120 20 Z" 
                      fill="var(--bg-card)" stroke="var(--border)" stroke-width="2"/>
                <!-- Inner Concha / Antihelix Ridge -->
                <path d="M 115 50 C 85 55, 65 95, 75 145 C 80 170, 95 185, 115 180 C 125 175, 130 155, 125 135 C 120 115, 125 90, 130 75" 
                      fill="none" stroke="var(--border)" stroke-width="1.5" stroke-dasharray="3 2"/>
                <!-- Tragus flap -->
                <path d="M 60 135 C 50 142, 50 155, 62 160" fill="none" stroke="var(--border)" stroke-width="1.5"/>

                <!-- Clickable Site 0: Helix Cartilage -->
                <g class="svg-diagram-hit" data-site-index="0" data-site-name="Ear Cartilage (Helix)" tabindex="0" role="button" aria-label="${escHtml(t('map.aria.helix'))}">
                  <circle class="svg-hit-target" cx="125" cy="35" r="10"/>
                  <text class="svg-site-label" x="142" y="38">${escHtml(t('map.labels.helix'))}</text>
                </g>

                <!-- Clickable Site 0b: Industrial Bar Zone -->
                <g class="svg-diagram-hit" data-site-index="0" data-site-name="Ear Cartilage (Industrial)" tabindex="0" role="button" aria-label="${escHtml(t('map.aria.industrial'))}">
                  <line x1="75" y1="58" x2="135" y2="40" stroke="var(--text-muted)" stroke-width="2" stroke-dasharray="2 2"/>
                  <circle class="svg-hit-target" cx="75" cy="58" r="9"/>
                  <text class="svg-site-label" x="22" y="55">${escHtml(t('map.labels.industrial'))}</text>
                </g>

                <!-- Clickable Site 0c: Conch Cartilage -->
                <g class="svg-diagram-hit" data-site-index="0" data-site-name="Ear Cartilage (Conch)" tabindex="0" role="button" aria-label="${escHtml(t('map.aria.conch'))}">
                  <circle class="svg-hit-target" cx="105" cy="135" r="10"/>
                  <text class="svg-site-label" x="122" y="139">${escHtml(t('map.labels.conch'))}</text>
                </g>

                <!-- Clickable Site 0d: Tragus -->
                <g class="svg-diagram-hit" data-site-index="0" data-site-name="Ear Cartilage (Tragus)" tabindex="0" role="button" aria-label="${escHtml(t('map.aria.tragus'))}">
                  <circle class="svg-hit-target" cx="58" cy="148" r="9"/>
                  <text class="svg-site-label" x="12" y="152">${escHtml(t('map.labels.tragus'))}</text>
                </g>

                <!-- Clickable Site 1: Earlobe -->
                <g class="svg-diagram-hit" data-site-index="1" data-site-name="Earlobe" tabindex="0" role="button" aria-label="${escHtml(t('map.aria.lobe'))}">
                  <circle class="svg-hit-target" cx="118" cy="235" r="11"/>
                  <text class="svg-site-label" x="135" y="239">${escHtml(t('map.labels.lobe'))}</text>
                </g>
              </svg>
            </div>
          </div>

          <!-- Body & Facial Anatomy Map -->
          <div class="diagram-panel">
            <div class="diagram-panel-title">👤 ${escHtml(t('map.body_view'))}</div>
            <div class="diagram-svg-wrap">
              <svg class="diagram-svg" viewBox="0 0 240 280" role="img" aria-label="${escHtml(t('map.body_view'))}">
                <!-- Head & Torso outline -->
                <ellipse cx="120" cy="45" rx="30" ry="36" fill="var(--bg-card)" stroke="var(--border)" stroke-width="2"/>
                <!-- Neck -->
                <path d="M 108 78 L 108 95 L 132 95 L 132 78" fill="var(--bg-card)" stroke="var(--border)" stroke-width="1.5"/>
                <!-- Shoulders & Torso -->
                <path d="M 50 120 C 70 100, 100 95, 120 95 C 140 95, 170 100, 190 120 L 180 260 L 60 260 Z" 
                      fill="var(--bg-card)" stroke="var(--border)" stroke-width="2"/>
                <!-- Sternum & Rib reference line -->
                <line x1="120" y1="100" x2="120" y2="185" stroke="var(--border)" stroke-dasharray="3 3" stroke-width="1.5"/>

                <!-- Clickable Site 2: Nostril / Septum -->
                <g class="svg-diagram-hit" data-site-index="2" data-site-name="Nostril & Septum" tabindex="0" role="button" aria-label="${escHtml(t('map.aria.nose_septum'))}">
                  <circle class="svg-hit-target" cx="120" cy="52" r="9"/>
                  <text class="svg-site-label" x="135" y="55">${escHtml(t('map.labels.nose_septum'))}</text>
                </g>

                <!-- Clickable Site 4: Chest & Sternum -->
                <g class="svg-diagram-hit" data-site-index="4" data-site-name="Chest, Sternum, Shoulders" tabindex="0" role="button" aria-label="${escHtml(t('map.aria.chest_sternum'))}">
                  <circle class="svg-hit-target" cx="120" cy="130" r="11"/>
                  <text class="svg-site-label" x="137" y="134">${escHtml(t('map.labels.sternum'))}</text>
                </g>

                <!-- Clickable Site 4b: Shoulder -->
                <g class="svg-diagram-hit" data-site-index="4" data-site-name="Shoulders & Deltoid" tabindex="0" role="button" aria-label="${escHtml(t('map.aria.shoulder'))}">
                  <circle class="svg-hit-target" cx="62" cy="125" r="10"/>
                  <text class="svg-site-label" x="12" y="112">${escHtml(t('map.labels.shoulder'))}</text>
                </g>

                <!-- Clickable Site 3: Navel -->
                <g class="svg-diagram-hit" data-site-index="3" data-site-name="Navel" tabindex="0" role="button" aria-label="${escHtml(t('map.aria.navel'))}">
                  <circle class="svg-hit-target" cx="120" cy="225" r="10"/>
                  <text class="svg-site-label" x="136" y="229">${escHtml(t('map.labels.navel'))}</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Render Section 5: Behavior by Anatomical Site
  function renderSitesSection() {
    const q = state.searchQuery.trim().toLowerCase();
    const rawItems = t('sites.items');
    const items = Array.isArray(rawItems) ? rawItems : [];
    const filtered = q ? items.filter(s => s.site.toLowerCase().includes(q) || s.behavior.toLowerCase().includes(q) || s.healing.toLowerCase().includes(q)) : items;

    return `
      <section class="tool-section" id="section-sites">
        <div class="section-head">
          <h2>${escHtml(t('sites.section_title'))}</h2>
          <p class="section-desc">${escHtml(t('sites.section_desc'))}</p>
        </div>

        ${renderAnatomicalDiagramSelector()}

        <div class="sites-accordion">
          ${filtered.length === 0 ? `
            <div class="search-no-results">
              <p>${escHtml(t('search.no_results'))}</p>
            </div>
          ` : filtered.map((site, index) => `
            <article class="site-card" id="site-card-${index}">
              <div class="site-header">
                <h3>${escHtml(site.site)}</h3>
                <span class="site-healing-badge">${escHtml(t('sites.healing_label', { healing: site.healing }))}</span>
              </div>
              <p class="site-body">${escHtml(site.behavior)}</p>
            </article>
          `).join('')}
        </div>
      </section>
    `;
  }

  // Render Section 6: Common Questions (FAQ)
  function renderFaqSection() {
    const rawFaqs = t('faqs.items');
    const faqs = Array.isArray(rawFaqs) ? rawFaqs : [];
    const q = state.searchQuery.trim().toLowerCase();
    const filtered = q ? faqs.filter(item => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)) : faqs;

    return `
      <section class="tool-section" id="section-faq">
        <div class="section-head">
          <h2>${escHtml(t('faqs.section_title'))}</h2>
          <p class="section-desc">${escHtml(t('faqs.section_desc'))}</p>
        </div>

        <div class="faq-list">
          ${filtered.length === 0 ? `
            <div class="search-no-results">
              <p>${escHtml(t('search.no_results'))}</p>
            </div>
          ` : filtered.map((item, idx) => `
            <details class="faq-item" id="faq-item-${idx}">
              <summary class="faq-question">
                <span class="faq-question-text">${escHtml(item.q)}</span>
                <span class="faq-chevron" aria-hidden="true">▾</span>
              </summary>
              <div class="faq-answer">
                <p>${escHtml(item.a)}</p>
              </div>
            </details>
          `).join('')}
        </div>
      </section>
    `;
  }

  // Render Section 7: When to See a Doctor
  function renderDoctorSection() {
    const rawRedFlags = t('doctor.red_flags');
    const redFlags = Array.isArray(rawRedFlags) ? rawRedFlags : [];
    return `
      <section class="tool-section" id="section-doctor">
        <div class="section-head">
          <h2>${escHtml(t('doctor.section_title'))}</h2>
          <p class="section-desc">${escHtml(t('doctor.section_desc'))}</p>
        </div>

        <div class="doctor-flags-card" id="printable-flags">
          <div class="card-top-action">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-print-flags">
              🖨️ ${escHtml(t('doctor.print_btn'))}
            </button>
          </div>
          <ul class="flags-checklist">
            ${redFlags.map(rf => `
              <li class="flag-item">
                <div class="flag-title">⚠️ ${escHtml(rf.flag)}</div>
                <div class="flag-detail">${escHtml(rf.detail)}</div>
              </li>
            `).join('')}
          </ul>
        </div>
      </section>
    `;
  }

  // Generate plain text or Markdown report from worksheet for local download/clipboard
  function generateConsultationText() {
    const lines = [
      "===========================================================",
      "POLI INTERNATIONAL: CLINICAL CONSULTATION WORKSHEET",
      "Educational Raised Scar & Irritation Bump Guide",
      "===========================================================",
      "NOTE: Self-reported patient intake summary. Contains zero automated scores or diagnostic determinations.",
      "",
      "PRIMARY SITE EVALUATION (Site #1):",
      `Procedure Type: ${state.consultation.procedure_type || 'Not specified'}`,
      `Anatomical Site: ${state.consultation.anatomical_site || 'Not specified'}`,
      `Date of Procedure: ${state.consultation.procedure_date || 'Not specified'}`,
      `Bump / Growth Onset: ${state.consultation.bump_onset || 'Not specified'}`,
      `Behavior Since Appearance: ${state.consultation.behavior_since || 'Not specified'}`,
      `Reported Symptoms: ${state.consultation.symptoms || 'Not specified'}`,
      `Attempted Remedies: ${state.consultation.attempted_remedies || 'None reported'}`,
      `Patient Notes / Questions: ${state.consultation.notes || 'None reported'}`,
      ""
    ];

    if (state.additionalSites.length > 0) {
      lines.push("ADDITIONAL EVALUATED SITES:");
      state.additionalSites.forEach((s, idx) => {
        lines.push(`Site #${idx + 2}:`);
        lines.push(`  - Anatomical Location: ${s.anatomical_site || 'Not specified'}`);
        lines.push(`  - Procedure Type: ${s.procedure_type || 'Not specified'}`);
        lines.push(`  - Onset / Behavior: ${s.bump_onset || 'Not specified'} | ${s.behavior_since || 'Not specified'}`);
        lines.push(`  - Symptoms: ${s.symptoms || 'Not specified'}`);
        lines.push("");
      });
    }

    lines.push("===========================================================");
    return lines.join("\n");
  }

  // Render Section 7: Doctor Consultation Worksheet
  function renderConsultationSection() {
    return `
      <section class="tool-section" id="section-consultation">
        <div class="section-head">
          <h2>${escHtml(t('consultation.section_title'))}</h2>
          <p class="section-desc">${escHtml(t('consultation.section_desc'))}</p>
        </div>

        <div class="consultation-sheet-card" id="consultation-printable-area">
          <div class="sheet-print-header">
            <h3>${escHtml(t('consultation.print_title'))}</h3>
            <p class="sheet-subtitle">${escHtml(t('consultation.print_disclaimer'))}</p>
          </div>

          <form id="consultation-form" class="consultation-form" onsubmit="return false;">
            
            <div class="sites-container">
              <!-- Site #1 Block -->
              <div class="site-block" id="site-block-0">
                ${state.additionalSites.length > 0 ? `
                  <div class="site-block-header">
                    <span class="site-block-title">${escHtml(t('consultation.site_item_num', { num: 1 }))}</span>
                  </div>
                ` : ''}

                <div class="grid-2-col">
                  <div class="form-field">
                    <label for="f-proc-type">${escHtml(t('consultation.fields.procedure_type'))}</label>
                    <input type="text" id="f-proc-type" value="${escHtml(state.consultation.procedure_type)}" placeholder="${escHtml(t('consultation.placeholders.procedure_type'))}">
                  </div>
                  <div class="form-field">
                    <label for="f-site">${escHtml(t('consultation.fields.anatomical_site'))}</label>
                    <input type="text" id="f-site" value="${escHtml(state.consultation.anatomical_site)}" placeholder="${escHtml(t('consultation.placeholders.anatomical_site'))}">
                  </div>
                </div>

                <div class="grid-2-col">
                  <div class="form-field">
                    <label for="f-date">${escHtml(t('consultation.fields.procedure_date'))}</label>
                    <input type="text" id="f-date" value="${escHtml(state.consultation.procedure_date)}" placeholder="${escHtml(t('consultation.placeholders.procedure_date'))}">
                  </div>
                  <div class="form-field">
                    <label for="f-onset">${escHtml(t('consultation.fields.bump_onset'))}</label>
                    <input type="text" id="f-onset" value="${escHtml(state.consultation.bump_onset)}" placeholder="${escHtml(t('consultation.placeholders.bump_onset'))}">
                  </div>
                </div>

                <div class="form-field">
                  <label for="f-behavior">${escHtml(t('consultation.fields.behavior_since'))}</label>
                  <textarea id="f-behavior" rows="2" placeholder="${escHtml(t('consultation.placeholders.behavior_since'))}">${escHtml(state.consultation.behavior_since)}</textarea>
                </div>

                <div class="form-field">
                  <label for="f-symptoms">${escHtml(t('consultation.fields.symptoms'))}</label>
                  <input type="text" id="f-symptoms" value="${escHtml(state.consultation.symptoms)}" placeholder="${escHtml(t('consultation.placeholders.symptoms'))}">
                </div>
              </div>

              <!-- Additional Sites Blocks -->
              ${state.additionalSites.map((siteItem, idx) => `
                <div class="site-block" id="site-block-${idx + 1}">
                  <div class="site-block-header">
                    <span class="site-block-title">${escHtml(t('consultation.site_item_num', { num: idx + 2 }))}</span>
                    <button type="button" class="site-block-remove no-print" data-remove-index="${idx}">
                      ✕ ${escHtml(t('consultation.remove_site_btn'))}
                    </button>
                  </div>
                  <div class="grid-2-col">
                    <div class="form-field">
                      <label>${escHtml(t('consultation.fields.procedure_type'))}</label>
                      <input type="text" class="add-site-input" data-idx="${idx}" data-field="procedure_type" value="${escHtml(siteItem.procedure_type)}" placeholder="${escHtml(t('consultation.placeholders.procedure_type'))}">
                    </div>
                    <div class="form-field">
                      <label>${escHtml(t('consultation.fields.anatomical_site'))}</label>
                      <input type="text" class="add-site-input" data-idx="${idx}" data-field="anatomical_site" value="${escHtml(siteItem.anatomical_site)}" placeholder="${escHtml(t('consultation.placeholders.anatomical_site'))}">
                    </div>
                  </div>
                  <div class="form-field">
                    <label>${escHtml(t('consultation.fields.bump_onset'))}</label>
                    <input type="text" class="add-site-input" data-idx="${idx}" data-field="bump_onset" value="${escHtml(siteItem.bump_onset)}" placeholder="${escHtml(t('consultation.placeholders.bump_onset'))}">
                  </div>
                  <div class="form-field">
                    <label>${escHtml(t('consultation.fields.behavior_since'))}</label>
                    <textarea class="add-site-input" data-idx="${idx}" data-field="behavior_since" rows="2" placeholder="${escHtml(t('consultation.placeholders.behavior_since'))}">${escHtml(siteItem.behavior_since)}</textarea>
                  </div>
                  <div class="form-field">
                    <label>${escHtml(t('consultation.fields.symptoms'))}</label>
                    <input type="text" class="add-site-input" data-idx="${idx}" data-field="symptoms" value="${escHtml(siteItem.symptoms)}" placeholder="${escHtml(t('consultation.placeholders.symptoms'))}">
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Multi-site Add Control -->
            <div class="add-site-wrap no-print">
              <button type="button" class="btn btn-secondary btn-sm" id="btn-add-site">
                ${escHtml(t('consultation.add_site_btn'))}
              </button>
            </div>

            <div class="form-field mt-4">
              <label for="f-remedies">${escHtml(t('consultation.fields.attempted_remedies'))}</label>
              <input type="text" id="f-remedies" value="${escHtml(state.consultation.attempted_remedies)}" placeholder="${escHtml(t('consultation.placeholders.attempted_remedies'))}">
            </div>

            <div class="form-field">
              <label for="f-notes">${escHtml(t('consultation.fields.user_notes'))}</label>
              <textarea id="f-notes" rows="3" placeholder="${escHtml(t('consultation.placeholders.user_notes'))}">${escHtml(state.consultation.notes)}</textarea>
            </div>

            <div class="form-actions no-print">
              <button type="button" class="btn btn-primary" id="btn-print-consultation">
                🖨️ ${escHtml(t('consultation.print_btn'))}
              </button>
              <button type="button" class="btn btn-secondary" id="btn-copy-clipboard">
                📋 ${escHtml(t('consultation.copy_clipboard_btn'))}
              </button>
              <button type="button" class="btn btn-secondary" id="btn-download-file">
                💾 ${escHtml(t('consultation.download_file_btn'))}
              </button>
              <button type="button" class="btn btn-secondary" id="btn-clear-consultation">
                ${escHtml(t('consultation.clear_btn'))}
              </button>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  // Render Footer Disclaimer
  function renderDisclaimer() {
    return `
      <footer class="tool-disclaimer" id="tool-disclaimer">
        <strong>${escHtml(t('disclaimer.title'))}:</strong> ${escHtml(t('disclaimer.body'))}
      </footer>
    `;
  }

  // Toast notification popup
  function showToast(msg) {
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'toast-notice';
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 2800);
  }

  // Main Render Function (re-invoked on language switch or state change)
  function renderApp() {
    const root = document.getElementById('app-root');
    if (!root) return;

    document.title = t('app.page_title');
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', t('app.meta_description'));
    }

    // Header & Language selector
    const headerHtml = `
      <header class="tool-header" id="tool-header">
        <div class="header-top-row">
          <div class="tool-header__badge" id="tool-badge">🔴 ${escHtml(t('app.badge'))}</div>
          <div class="lang-selector-wrap">
            <label for="lang-select" class="lang-label">${escHtml(t('lang.label'))}</label>
            <select id="lang-select" class="lang-select">
              ${SUPPORTED_LANGS.map(l => `
                <option value="${l.code}" ${l.code === currentLang ? 'selected' : ''}>${escHtml(l.name)}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <h1 id="tool-title">${escHtml(t('app.title'))}</h1>
        <p id="tool-desc">${escHtml(t('app.description'))}</p>
        
        <!-- Navigation bar -->
        <nav class="tool-nav" aria-label="${escHtml(t('nav.aria_label'))}">
          <a href="#section-comparison" class="nav-link">${escHtml(t('nav.comparison'))}</a>
          <a href="#section-timeline" class="nav-link">${escHtml(t('nav.timeline'))}</a>
          <a href="#section-factors" class="nav-link">${escHtml(t('nav.factors'))}</a>
          <a href="#section-aftercare" class="nav-link">${escHtml(t('nav.aftercare'))}</a>
          <a href="#section-sites" class="nav-link">${escHtml(t('nav.sites'))}</a>
          <a href="#section-faq" class="nav-link">${escHtml(t('nav.faq'))}</a>
          <a href="#section-doctor" class="nav-link">${escHtml(t('nav.doctor'))}</a>
          <a href="#section-consultation" class="nav-link nav-link-highlight">${escHtml(t('nav.consultation'))}</a>
        </nav>
      </header>
    `;

    root.innerHTML = `
      <div class="tool-wrapper" id="tool-wrapper">
        ${renderCobrandBanner()}
        ${headerHtml}
        ${renderComparisonSection()}
        ${renderTimelineSection()}
        ${renderFactorsSection()}
        ${renderAftercareSection()}
        ${renderSitesSection()}
        ${renderFaqSection()}
        ${renderDoctorSection()}
        ${renderConsultationSection()}
        ${renderDisclaimer()}
      </div>
    `;

    attachEventListeners();
  }

  function attachEventListeners() {
    // Language select
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        const newLang = e.target.value;
        if (newLang !== currentLang) {
          currentLang = newLang;
          try {
            localStorage.setItem('poli_tools_language', newLang);
          } catch (err) {}
          document.documentElement.lang = newLang;
          renderApp();
        }
      });
    }

    // Micro-magnifier zoom toggle buttons
    document.querySelectorAll('.magnifier-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.getAttribute('data-card');
        if (card && card in state.zoomActive) {
          state.zoomActive[card] = !state.zoomActive[card];
          renderApp();
        }
      });
    });

    // Micro-magnifier SVG pinpoint pins
    document.querySelectorAll('.svg-tooltip-pin').forEach(pin => {
      const card = pin.getAttribute('data-card');
      const layer = pin.getAttribute('data-layer');
      
      const activate = () => {
        if (card && layer) {
          state.activeLayerTooltip[card] = (state.activeLayerTooltip[card] === layer) ? null : layer;
          renderApp();
        }
      };

      pin.addEventListener('click', activate);
      pin.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });

    // Real-time search filter input
    const searchInput = document.getElementById('filter-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderApp();
        // Restore focus to input after render
        const reInput = document.getElementById('filter-search-input');
        if (reInput) {
          reInput.focus();
          reInput.selectionStart = reInput.selectionEnd = reInput.value.length;
        }
      });
    }

    // Clear search button
    const btnClearSearch = document.getElementById('btn-clear-search');
    if (btnClearSearch) {
      btnClearSearch.addEventListener('click', () => {
        state.searchQuery = '';
        renderApp();
      });
    }

    // Friction checklist checkboxes
    document.querySelectorAll('.friction-check-input').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const key = chk.getAttribute('data-key');
        if (key) {
          state.troubleshootChecks[key] = chk.checked;
          const panel = document.getElementById('friction-actions-panel');
          if (panel) {
            const items = t('troubleshoot.items');
            const checkedKeys = Object.keys(state.troubleshootChecks).filter(k => state.troubleshootChecks[k]);
            panel.innerHTML = `
              <div class="friction-actions-title">${escHtml(t('troubleshoot.actions_heading'))}</div>
              ${checkedKeys.length === 0 ? `
                <p class="text-muted">${escHtml(t('troubleshoot.no_items_selected'))}</p>
              ` : `
                <ul class="friction-actions-list">
                  ${checkedKeys.map(k => `
                    <li class="friction-action-item">
                      <strong>${escHtml(items[k].label)}:</strong> ${escHtml(items[k].action)}
                    </li>
                  `).join('')}
                </ul>
              `}
            `;
          }
        }
      });
    });

    // Anatomical diagram hit zone clicks
    document.querySelectorAll('.svg-diagram-hit').forEach(hit => {
      const selectSite = () => {
        const siteIdx = hit.getAttribute('data-site-index');
        const siteName = hit.getAttribute('data-site-name');
        
        // 1. Scroll to and highlight matching card in Anatomical Sites
        const cardElem = document.getElementById(`site-card-${siteIdx}`);
        if (cardElem) {
          cardElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          cardElem.classList.add('site-card-highlight');
          setTimeout(() => {
            cardElem.classList.remove('site-card-highlight');
          }, 3000);
        }

        // 2. Pre-select in Clinical Consultation Worksheet
        if (siteName) {
          state.consultation.anatomical_site = siteName;
          const siteInput = document.getElementById('f-site');
          if (siteInput) {
            siteInput.value = siteName;
          }
        }
      };

      hit.addEventListener('click', selectSite);
      hit.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectSite();
        }
      });
    });

    // Factors radio change
    const factorsForm = document.getElementById('factors-form');
    if (factorsForm) {
      factorsForm.addEventListener('change', (e) => {
        if (e.target.name && e.target.type === 'radio') {
          state.factors[e.target.name] = e.target.value;
        }
      });
    }

    // Evaluate factors button
    const btnEval = document.getElementById('btn-eval-factors');
    if (btnEval) {
      btnEval.addEventListener('click', () => {
        const factorKeys = ['personal', 'family', 'skin', 'location', 'past_reaction'];
        const missing = factorKeys.filter(k => state.factors[k] === '');
        
        if (missing.length > 0) {
          // Highlight first missing field
          const firstMissing = document.getElementById(`group-${missing[0]}`);
          if (firstMissing) {
            firstMissing.classList.add('field-highlight-missing');
            firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
              firstMissing.classList.remove('field-highlight-missing');
            }, 2500);
          }
          return;
        }

        state.factorsEvaluated = true;
        const container = document.getElementById('factors-results-container');
        if (container) {
          container.hidden = false;
          container.innerHTML = renderFactorsEvaluationResults();
          attachTransferButton();
          container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }

    // Reset factors button
    const btnReset = document.getElementById('btn-reset-factors');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        state.factors = { personal: '', family: '', skin: '', location: '', past_reaction: '' };
        state.factorsEvaluated = false;
        renderApp();
      });
    }

    attachTransferButton();

    // Consultation inputs synchronization
    bindInput('f-proc-type', 'procedure_type');
    bindInput('f-site', 'anatomical_site');
    bindInput('f-date', 'procedure_date');
    bindInput('f-onset', 'bump_onset');
    bindInput('f-behavior', 'behavior_since');
    bindInput('f-symptoms', 'symptoms');
    bindInput('f-remedies', 'attempted_remedies');
    bindInput('f-notes', 'notes');

    // Multi-site additional inputs binding
    document.querySelectorAll('.add-site-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'), 10);
        const field = inp.getAttribute('data-field');
        if (!isNaN(idx) && state.additionalSites[idx] && field) {
          state.additionalSites[idx][field] = e.target.value;
        }
      });
    });

    // Add site button
    const btnAddSite = document.getElementById('btn-add-site');
    if (btnAddSite) {
      btnAddSite.addEventListener('click', () => {
        state.additionalSites.push({
          procedure_type: '',
          anatomical_site: '',
          bump_onset: '',
          behavior_since: '',
          symptoms: ''
        });
        renderApp();
      });
    }

    // Remove site buttons
    document.querySelectorAll('.site-block-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-remove-index'), 10);
        if (!isNaN(idx)) {
          state.additionalSites.splice(idx, 1);
          renderApp();
        }
      });
    });

    // Copy to clipboard button
    const btnCopy = document.getElementById('btn-copy-clipboard');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const text = generateConsultationText();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            showToast(t('consultation.copied_toast'));
          }).catch(() => {
            fallbackCopy(text);
          });
        } else {
          fallbackCopy(text);
        }
      });
    }

    function fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showToast(t('consultation.copied_toast'));
      } catch (err) {}
      document.body.removeChild(ta);
    }

    // Download text / markdown file
    const btnDownload = document.getElementById('btn-download-file');
    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
        const text = generateConsultationText();
        try {
          const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'consultation-summary.txt';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
        } catch (err) {}
      });
    }

    // Print consultation
    const btnPrintConsult = document.getElementById('btn-print-consultation');
    if (btnPrintConsult) {
      btnPrintConsult.addEventListener('click', () => {
        window.print();
      });
    }

    // Print doctor flags
    const btnPrintFlags = document.getElementById('btn-print-flags');
    if (btnPrintFlags) {
      btnPrintFlags.addEventListener('click', () => {
        window.print();
      });
    }

    // Clear consultation
    const btnClearConsult = document.getElementById('btn-clear-consultation');
    if (btnClearConsult) {
      btnClearConsult.addEventListener('click', () => {
        state.consultation = {
          procedure_type: '',
          anatomical_site: '',
          procedure_date: '',
          bump_onset: '',
          behavior_since: '',
          symptoms: '',
          attempted_remedies: '',
          notes: ''
        };
        state.additionalSites = [];
        renderApp();
      });
    }
  }

  function attachTransferButton() {
    const btnTransfer = document.getElementById('btn-transfer-to-consultation');
    if (btnTransfer) {
      btnTransfer.addEventListener('click', () => {
        // Map factors to consultation fields if empty
        const locIdx = state.factors.location;
        if (locIdx !== '' && locIdx != null && !state.consultation.anatomical_site) {
          const locOptions = Array.isArray(t('factors.location.options')) ? t('factors.location.options') : [];
          state.consultation.anatomical_site = locOptions[locIdx] ? locOptions[locIdx].text : '';
        }

        const persIdx = state.factors.personal;
        const famIdx = state.factors.family;
        let notesArr = [];

        if (persIdx !== '' && persIdx != null) {
          const persOptions = Array.isArray(t('factors.personal.options')) ? t('factors.personal.options') : [];
          const persOpt = persOptions[persIdx];
          if (persOpt) {
            notesArr.push(t('consultation.prefill_personal_history', { text: persOpt.text }));
          }
        }

        if (famIdx !== '' && famIdx != null) {
          const famOptions = Array.isArray(t('factors.family.options')) ? t('factors.family.options') : [];
          const famOpt = famOptions[famIdx];
          if (famOpt) {
            notesArr.push(t('consultation.prefill_family_history', { text: famOpt.text }));
          }
        }

        if (notesArr.length > 0 && !state.consultation.notes) {
          state.consultation.notes = notesArr.join('\n');
        }

        // Re-render and scroll to consultation
        renderApp();
        const consultElem = document.getElementById('section-consultation');
        if (consultElem) {
          consultElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }

  function bindInput(elemId, stateKey) {
    const el = document.getElementById(elemId);
    if (el) {
      el.addEventListener('input', (e) => {
        state.consultation[stateKey] = e.target.value;
      });
    }
  }

  // Initial boot
  function init() {
    document.documentElement.lang = currentLang;
    renderApp();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
