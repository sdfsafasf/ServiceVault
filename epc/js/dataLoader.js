// dataLoader.js
export async function fetchJSON(path) {
  const resp = await fetch(path);
  if (!resp.ok) throw new Error(`Failed to load ${path}`);
  return resp.json();
}

export async function loadBrandName(brandCode) {
  try {
    const brands = await fetchJSON('/data/brands.json');
    const brand = brands.find(b => b.code.toLowerCase() === brandCode);
    return brand ? brand.name : brandCode.toUpperCase();
  } catch {
    return brandCode.toUpperCase();
  }
}

export async function loadModelName(brandCode, modelCode) {
  try {
    const modelsData = await fetchJSON(`/data/brands/${brandCode}/models.json`);
    const models = modelsData[brandCode];
    const model = models.find(m => m.code.toLowerCase() === modelCode);
    return model ? model.name : modelCode.toUpperCase();
  } catch {
    return modelCode.toUpperCase();
  }
}
