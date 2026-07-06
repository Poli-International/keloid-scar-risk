'use strict';

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const FACTORS = [
  {
    id: 'personal',
    label: 'Personal history of raised scars',
    help: 'Have you developed a keloid or hypertrophic scar from a wound, surgery, vaccination, or prior piercing?',
    options: [
      { text: 'No history of raised scars', score: 0 },
      { text: 'One raised scar that flattened over time (hypertrophic)', score: 4 },
      { text: 'Persistent or growing keloid at any prior site', score: 10 },
    ],
  },
  {
    id: 'family',
    label: 'Family history of keloids',
    help: 'Keloid tendency is strongly heritable. First-degree relatives with keloids significantly elevate your personal risk.',
    options: [
      { text: 'No known family history', score: 0 },
      { text: 'One parent or sibling with keloids', score: 3 },
      { text: 'Multiple relatives affected', score: 6 },
    ],
  },
  {
    id: 'skin',
    label: 'Skin phototype (Fitzpatrick scale)',
    help: 'Keloid incidence is approximately 15× higher in Fitzpatrick types V–VI compared to types I–II. This is a population-level risk factor, not a personal certainty.',
    options: [
      { text: 'Type I–II (very fair / fair — burns easily, rarely tans)', score: 0 },
      { text: 'Type III–IV (medium / olive — tans moderately)', score: 2 },
      { text: 'Type V–VI (brown / dark brown — tans easily, rarely burns)', score: 4 },
    ],
  },
  {
    id: 'location',
    label: 'Intended procedure location',
    help: 'Chest, upper back, shoulders, and jaw are the highest-risk anatomical sites for keloid formation. Earlobes and facial areas carry lower risk.',
    options: [
      { text: 'Earlobe, nose, eyebrow, lip, or other facial site', score: 0 },
      { text: 'Ear cartilage, navel, tongue, or upper arm', score: 3 },
      { text: 'Chest, upper back, shoulder, or jawline', score: 6 },
    ],
  },
  {
    id: 'age',
    label: 'Current age',
    help: 'Keloid formation peaks between ages 10–30 and declines significantly after 40. Hormonal activity during puberty and pregnancy further elevates risk.',
    options: [
      { text: 'Under 25', score: 3 },
      { text: '25–40', score: 2 },
      { text: 'Over 40', score: 0 },
    ],
  },
  {
    id: 'prior',
    label: 'Reaction at any previous piercing or tattoo site',
    help: 'A raised bump or scar at a prior piercing or tattoo is one of the strongest individual predictors of recurrence.',
    options: [
      { text: 'No prior procedure, or healed with no raised tissue', score: 0 },
      { text: 'Had a bump that resolved over several months', score: 3 },
      { text: 'Persistent raised scar or still-present bump', score: 6 },
    ],
  },
];

const form = document.getElementById('risk-form');
const btn  = document.getElementById('calc-btn');
const resultDiv = document.getElementById('result');

FACTORS.forEach(f => {
  const block = document.createElement('div');
  block.className = 'factor-block';
  block.innerHTML = `
    <div class="factor-label">${escHtml(f.label)}</div>
    <div class="factor-help">${escHtml(f.help)}</div>
    <div class="factor-opts">
      ${f.options.map(o => `
        <label class="opt-label">
          <input type="radio" name="${escHtml(f.id)}" value="${o.score}" required>
          <span class="opt-text">${escHtml(o.text)}</span>
        </label>`).join('')}
    </div>`;
  form.appendChild(block);
});

form.addEventListener('change', () => {
  btn.disabled = !FACTORS.every(f => form.querySelector(`input[name="${f.id}"]:checked`));
});

btn.addEventListener('click', calculate);

function getTier(score) {
  if (score <= 5)  return { tier:'Low',      cls:'tier-low',   icon:'🟢', msg:'Your risk profile suggests low keloid tendency. Standard healing protocols should apply. Monitor the site during healing and contact your piercer if a raised or itchy bump develops after the initial healing phase.' };
  if (score <= 12) return { tier:'Moderate', cls:'tier-mod',   icon:'🟡', msg:'One or more risk factors are present. Discuss your history with your piercer before proceeding. Choose implant-grade materials, avoid high-risk body locations, and plan for extended healing follow-up.' };
  if (score <= 20) return { tier:'Elevated', cls:'tier-high',  icon:'🟠', msg:'Multiple risk factors are active. Keloid formation is a genuine possibility, particularly at cartilage, chest, and back sites. A dermatology consultation before any new procedure is advisable. Prioritise flexible, low-trauma jewellery.' };
  return             { tier:'High',     cls:'tier-vhigh', icon:'🔴', msg:'Your profile indicates significant keloid predisposition. A dermatology consultation before any new piercing or tattoo is strongly recommended. Avoid the chest, upper back, and cartilage entirely. Consider pressure therapy or silicone sheeting protocols if you proceed.' };
}

function calculate() {
  let score = 0;
  FACTORS.forEach(f => {
    const el = form.querySelector(`input[name="${f.id}"]:checked`);
    if (el) score += parseInt(el.value, 10);
  });

  const { tier, cls, icon, msg } = getTier(score);
  const pct = Math.min(100, Math.round(score / 29 * 100));

  resultDiv.innerHTML = `
    <div class="result-card">
      <div class="result-header ${escHtml(cls)}">
        <span class="result-icon">${icon}</span>
        <div>
          <div class="result-tier">${escHtml(tier)} Risk</div>
          <div class="result-score">Score: ${score} / 29</div>
        </div>
      </div>
      <div class="risk-bar-wrap">
        <div class="risk-bar-fill ${escHtml(cls)}" style="width:${pct}%"></div>
      </div>
      <div class="result-msg">${escHtml(msg)}</div>
      <div class="result-section">
        <div class="result-section-title">Material recommendation</div>
        <p class="result-section-body">For elevated or high-risk profiles, implant-grade materials that minimise ongoing tissue stress are critical. Rigid metal creates microtrauma and pressure on the fistula — a key trigger for keloid initiation. <a href="https://poliinternational.com/bioflex/" target="_blank" rel="noopener noreferrer">BioFlex® polymer</a> flexes with the body, reducing chronic irritation at vulnerable sites.</p>
      </div>
      <div class="result-section">
        <div class="result-section-title">Warning signs to watch for</div>
        <ul class="result-list">
          <li>A firm lump that grows <em>beyond</em> the wound margin — this is a keloid, not a hypertrophic scar</li>
          <li>Persistent itching, pain, or tenderness at a site that appeared healed</li>
          <li>Raised tissue still growing after 3 months — document with photos and seek early dermatology review</li>
          <li>Hypertrophic scars (raised but within wound edges) may regress; keloids do not without treatment</li>
        </ul>
      </div>
    </div>`;
  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
