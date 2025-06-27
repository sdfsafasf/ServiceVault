export function renderBrandLogo(brandCode) {
  const logoImg = document.getElementById('model-logo');
  if (!brandCode || !logoImg) return;

  fetch('/data/brands.json')
    .then(resp => resp.json())
    .then(brands => {
      const brand = brands.find(b => b.code.toUpperCase() === brandCode.toUpperCase());
      if (brand && brand.logo) {
        logoImg.src = brand.logo;
        logoImg.style.display = 'block';
        logoImg.alt = brand.name + " logo";
      } else {
        logoImg.style.display = 'none';
      }
    });
}
