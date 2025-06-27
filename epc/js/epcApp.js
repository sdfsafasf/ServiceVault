// epc/js/epcApp.js

import { renderBreadcrumb } from './breadcrumb.js';

export async function initEPCApp({
    brandCode,
    modelCode,
    rootPath,
    breadcrumbEl,
    sectionsListEl,
    subsectionsListEl,
    detailsListEl,
    errorMessageEl,
    mainContentEl
}) {
    let sections = [], subsections = [], details = [];
    let selectedSection = null, selectedSubsection = null, selectedDetail = null;
    let brandName = '', modelName = '';

    const stateKey = `epcState-${brandCode}-${modelCode}`;

    function saveState() {
        if (selectedSection) {
            sessionStorage.setItem(stateKey, JSON.stringify({
                sectionCode: selectedSection.code,
                subsectionCode: selectedSubsection ? selectedSubsection.code : null,
            }));
        } else {
            sessionStorage.removeItem(stateKey);
        }
    }

    function loadState() {
        const saved = sessionStorage.getItem(stateKey);
        return saved ? JSON.parse(saved) : null;
    }

    async function fetchJSON(path) {
        const fullPath = rootPath + path;
        const resp = await fetch(fullPath);
        if (!resp.ok) throw new Error(`Failed to load ${fullPath}`);
        return resp.json();
    }
    
    function resetAllSelections() {
        selectedSection = null;
        selectedSubsection = null;
        subsections = [];
        details = [];
        renderAll();
        saveState();
    }

    function resetSubsectionAndBelow() {
        selectedSubsection = null;
        details = [];
        renderAll();
        loadAndRenderDetails();
        saveState();
    }
    
    // Renders everything based on current state
    function renderAll() {
        renderSections();
        renderSubsections();
        renderDetails();
        updateBreadcrumb();
    }

    function updateBreadcrumb() {
        renderBreadcrumb({
            breadcrumbEl, brandName, modelName,
            selectedSection, selectedSubsection,
            selectedDetail: null, // Not used on this page
            onHomeClick: () => { window.location.href = `index.html`; },
            onBrandClick: () => { window.location.href = `index.html`; },
            onModelClick: () => { resetAllSelections(); },
            onSectionClick: () => { resetSubsectionAndBelow(); },
            onSubsectionClick: null // Not clickable on this page
        });
    }

    function renderList(listEl, items, selectedItem, onClickCallback) {
        listEl.innerHTML = '';
        if (!items || items.length === 0) return;
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.code} - ${item.name}`;
            li.classList.toggle('selected', selectedItem && selectedItem.code === item.code);
            li.onclick = () => onClickCallback(item);
            listEl.appendChild(li);
        });
    }

    function renderSections() {
        renderList(sectionsListEl, sections, selectedSection, (section) => {
            selectedSection = section;
            selectedSubsection = null;
            details = [];
            loadSubsections();
            // Re-render immediately to show selection and update breadcrumb
            renderAll(); 
        });
    }
    
    function renderSubsections() {
        if (!selectedSection) {
            subsectionsListEl.innerHTML = '<li>Please select a section.</li>';
            return;
        }
        if (subsections.length === 0) {
            subsectionsListEl.innerHTML = '<li style="color:#666;font-style:italic;">No subsections for this section.</li>';
            return;
        }
        renderList(subsectionsListEl, subsections, selectedSubsection, (subsection) => {
            selectedSubsection = subsection;
            details = [];
            loadAndRenderDetails();
            // Re-render immediately to show selection and update breadcrumb
            renderAll();
        });
    }

    function renderDetails() {
        if (!selectedSection) {
            detailsListEl.innerHTML = '<li>Please select a section first.</li>';
            return;
        }
        if (subsections.length > 0 && !selectedSubsection) {
            detailsListEl.innerHTML = '<li>Please select a subsection.</li>';
            return;
        }
        if (details.length === 0) {
            detailsListEl.innerHTML = '<li>No details found.</li>';
            return;
        }
        renderList(detailsListEl, details, selectedDetail, (detail) => {
            selectedDetail = detail;
            const params = new URLSearchParams({ brand: brandCode, model: modelCode, section: selectedSection.code, detail: detail.code });
            if (selectedSubsection) {
                params.set('subsection', selectedSubsection.code);
            }
            window.location.href = `diagram.html?${params.toString()}`;
        });
    }

    async function loadAndRenderDetails() {
        detailsListEl.innerHTML = '<li>Loading...</li>';
        saveState();
        if (!selectedSection || (subsections.length > 0 && !selectedSubsection)) {
            renderAll();
            return;
        }
        let path;
        if (selectedSubsection) {
            path = `data/brands/${brandCode}/${modelCode}/details_${selectedSection.code}_${selectedSubsection.code}.json`;
        } else if (subsections.length === 0) {
            path = `data/brands/${brandCode}/${modelCode}/details_${selectedSection.code}.json`;
        } else {
            details = [];
            renderAll();
            return;
        }
        try {
            details = await fetchJSON(path);
        } catch (error) {
            details = [];
        }
        renderAll();
    }
    
    async function loadSubsections() {
        if (!selectedSection) return;
        subsectionsListEl.innerHTML = '<li>Loading...</li>';
        try {
            subsections = await fetchJSON(`data/brands/${brandCode}/${modelCode}/subsections_${selectedSection.code}.json`);
        } catch (error) {
            subsections = [];
        }
        await loadAndRenderDetails();
    }
    
    async function init() {
        if (!brandCode || !modelCode) {
            showError('Missing brand or model parameter.');
            return;
        }
        try {
            const brands = await fetchJSON('data/brands.json');
            const brand = brands.find(b => b.code.toLowerCase() === brandCode);
            brandName = brand ? brand.name : brandCode.toUpperCase();

            const modelsData = await fetchJSON(`data/brands/${brandCode}/models.json`);
            const models = modelsData[brandCode];
            const model = models.find(m => m.code.toLowerCase() === modelCode);
            modelName = model ? model.name : modelCode.toUpperCase();
            
            sections = await fetchJSON(`data/brands/${brandCode}/${modelCode}/sections.json`);
            
            const saved = loadState();
            if (saved && saved.sectionCode) {
                selectedSection = sections.find(s => s.code === saved.sectionCode) || null;
                if (selectedSection) {
                    try {
                        subsections = await fetchJSON(`data/brands/${brandCode}/${modelCode}/subsections_${selectedSection.code}.json`);
                    } catch {
                        subsections = [];
                    }
                    if (saved.subsectionCode) {
                       selectedSubsection = subsections.find(s => s.code === saved.subsectionCode) || null;
                    }
                    await loadAndRenderDetails();
                }
            } else {
                renderAll();
            }

            mainContentEl.style.display = 'flex';

        } catch (error) {
            console.error("Initialization failed:", error);
            showError("Could not load vehicle data.");
        }
    }

    function showError(msg) {
        errorMessageEl.textContent = msg;
        errorMessageEl.style.display = 'block';
        mainContentEl.style.display = 'none';
    }

    init();
}