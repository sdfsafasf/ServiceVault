// vehiclelist.js
function getDataPath(file) {
  // 1. Try to find the "/data/brands.json" relative to site/app root
  // 2. If running inside /servicemanuals/, go up a level
  // 3. Fallback: try local relative
  // 4. You can add more rules as needed

  // Get current location path
  const loc = window.location.pathname;
  
  // Electron/file: look for known directory structures
  if (loc.includes('/servicemanuals/')) {
    return '../data/' + file;
  }
  if (loc.includes('/app-home.html')) {
    return 'data/' + file; // at root
  }
  // fallback for root
  return 'data/' + file;
}

async function fetchBrands() {
  const response = await fetch(getDataPath('brands.json'));
  if (!response.ok) throw new Error('Could not load brands.json');
  return await response.json();
}

async function fetchModels(brandCode) {
  const response = await fetch(getDataPath(`brands/${brandCode}/models.json`));
  if (!response.ok) return [];
  const allModels = await response.json();
  return allModels[brandCode] || [];
}


function iconHtml(model) {
  let icons = '';
  if (model.servicemanual) {
    icons += `<span title="Service Manual" class="model-icons">
      <svg style="width:1em;height:1em;fill:#198754;" viewBox="0 0 24 24"><path d="M22.7 19.3c-.4.4-1 .4-1.4 0l-3-3-2.3 2.3c-.4-.4-1 .4-1.4 0l-7.3-7.3c-.4-.4-.4-1 0-1.4l2.3-2.3-3-3c-.4-.4-.4-1 0-1.4.4-.4 1-.4 1.4 0l3 3 2.3-2.3c.4-.4 1-.4 1.4 0l7.3 7.3c.4.4.4 1 0 1.4l-2.3 2.3 3 3c.4.4.4 1 0 1.4z"/></svg>
    </span>`;
  }
  if (model.epc) {
    icons += `<span title="Parts Catalog" class="model-icons">
      <svg style="width:1em;height:1em;fill:#007bff;" viewBox="0 0 24 24"><path d="M10.67,3.16a1,1,0,0,1,1.09-.09l8.38,5A1,1,0,0,1,21,8.91V19a3,3,0,0,1-3,3H6A3,3,0,0,1,3,19V8.91A1,1,0,0,1,4,8.07l8.38-5A1,1,0,0,1,10.67,3.16ZM12,5.13,5,9.09V19a1,1,0,0,0,1,1H18a1,1,0,0,0,1-1V9.09Z"/></svg>
    </span>`;
  }
  return icons;
}
async function renderVehicleList(targetSelector, filter = '') {
  const container = document.querySelector(targetSelector);
  if (!container) return;
  container.innerHTML = `<div style="text-align:center; padding:2rem;">Loading...</div>`;
  const brands = await fetchBrands();
  let sections = [];
  for (const brand of brands) {
    const models = await fetchModels(brand.code.toLowerCase());
    if (models.length === 0) continue;
    if (
      filter &&
      !brand.name.toLowerCase().includes(filter) &&
      !models.some(m => m.name.toLowerCase().includes(filter))
    ) continue;
    const firstLetter = brand.name[0].toUpperCase();
    let section = sections.find(s => s.letter === firstLetter);
    if (!section) {
      section = { letter: firstLetter, brands: [] };
      sections.push(section);
    }
    let modelsToShow = filter
      ? models.filter(m => m.name.toLowerCase().includes(filter))
      : models;
    if (modelsToShow.length === 0) continue;
    section.brands.push({
      brand,
      models: modelsToShow
    });
  }
  sections.sort((a, b) => a.letter.localeCompare(b.letter));
  let html = '';
for (const section of sections) {
  html += `
    <section id="${section.letter}" class="vehicle-list-section" style="margin-bottom:2.2rem;">
      <h2 class="letter-heading" style="font-size:1.25rem;font-weight:700;margin-bottom:1.1rem;padding-bottom:0.4rem;border-bottom:2px solid var(--bs-border-color);color:var(--bs-body-color);">${section.letter}</h2>
      <ul class="brand-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:1.2rem 1.8rem;padding:0;margin:0;list-style-type:none;">
        ${section.brands.map(({brand, models}) => `
		
		
          <li class="brand-item" style="background-color:var(--sv-card-color);border:1px solid var(--bs-border-color);border-radius:12px;padding:1.1rem;">
            <h3 class="brand-name" style="font-size:1.15rem;font-weight:600;margin:0 0 0.7rem 0;">${brand.name}</h3>
            <ul class="model-list" style="list-style-type:none;padding:0;margin:0;line-height:1.7;">
              ${models.map(model => `
                <li>
                  <a href="#" style="color:var(--sv-font-color-muted);text-decoration:none;display:inline-block;padding:0.1rem 0;">${model.name}</a>
                  ${iconHtml(model)}
                </li>
              `).join('')}
            </ul>
          </li>
		  
		  
        `).join('')}
      </ul>
    </section>`;
}

  container.innerHTML = html || `<div style="text-align:center; padding:2rem;">No vehicles found.</div>`;
}
