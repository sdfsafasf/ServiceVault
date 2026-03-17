// epc/js/epcApp.js

import { renderBreadcrumb } from './breadcrumb.js';

export async function initEPCApp({
    brandCode,
    modelCode,
    breadcrumbEl,
    sectionsListEl,
    subsectionsListEl,
    detailsListEl,
    errorMessageEl,
    mainContentEl,
    readDataJson
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

    function resetAllSelections() {
        selectedSection = null;
        selectedSubsection = null;
        selectedDetail = null;
        details = [];
        subsections = [];
        renderAll();
        saveState();
    }

    function resetSubsectionAndBelow() {
        selectedSubsection = null;
        selectedDetail = null;
        details = [];
        renderAll();
        loadAndRenderDetails();
        saveState();
    }

    function renderAll() {
        renderSections();
        renderSubsections();
        renderDetails();
        updateBreadcrumb();
    }

    function updateBreadcrumb() {
        renderBreadcrumb({
            breadcrumbEl,
            brandName,
            modelName,
            selectedSection,
            selectedSubsection,
            selectedDetail: null,
            onHomeClick: () => { window.location.href = `index.html`; },
            onBrandClick: () => { window.location.href = `index.html`; },
            onModelClick: () => { resetAllSelections(); },
            onSectionClick: () => { resetSubsectionAndBelow(); },
            onSubsectionClick: null
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
            selectedDetail = null;
            details = [];
            loadSubsections();
            renderAll();
        });
    }

    function renderSubsections() {
        if (!selectedSection) {
            subsectionsListEl.innerHTML = '<li>Please select a section.</li>';
            return;
        }

        if (subsections.length === 0) {
            subsectionsListEl.innerHTML =
                '<li style="color:#666;font-style:italic;">No subsections for this section.</li>';
            return;
        }

        renderList(subsectionsListEl, subsections, selectedSubsection, (subsection) => {
            selectedSubsection = subsection;
            selectedDetail = null;
            details = [];
            loadAndRenderDetails();
            renderAll();
        });
    }

    function getDetailDisplayName(detail) {
        return detail.display_name || detail.name || '';
    }

    function getDetailDisplayCode(detail) {
        return detail.display_code || detail.code || '';
    }

    function isHeadingRow(detail, index) {
        if (detail.display_type === 'heading' || detail.type === 'heading') return true;
        if (detail.display_type === 'item' || detail.type === 'item') return false;

        const currentName = getDetailDisplayName(detail).trim();
        const next = details[index + 1];
        if (!next) return false;

        const nextName = getDetailDisplayName(next).trim();
        const currentCode = String(getDetailDisplayCode(detail)).trim();
        const nextCode = String(getDetailDisplayCode(next)).trim();

        const currentNum = parseInt(currentCode, 10);
        const nextNum = parseInt(nextCode, 10);

        const sequential =
            Number.isFinite(currentNum) &&
            Number.isFinite(nextNum) &&
            nextNum === currentNum + 1;

        if (!sequential) return false;
        if (!currentName || !nextName) return false;

        const childStarts = [
            'FOR ',
            'EXCEPT ',
            'WITH ',
            'WITHOUT ',
            'LESS ',
            '5 DOOR',
            '3 DOOR',
            'ESTATE',
            'HATCH',
            'SALOON',
            'WAGON',
            'SPORTS TOURER',
            'DIESEL ',
            'PETROL ',
            'RHD',
            'LHD'
        ];

        const nextLooksChild =
            childStarts.some(prefix => nextName.toUpperCase().startsWith(prefix));

        if (!nextLooksChild) return false;

        return true;
    }

    function isChildRow(detail, index) {
        if (
            detail.display_type === 'child' ||
            detail.type === 'child' ||
            detail.parent_code
        ) return true;

        if (detail.display_type === 'heading' || detail.type === 'heading') return false;

        const prev = details[index - 1];
        if (!prev) return false;

        return isHeadingRow(prev, index - 1);
    }

    function detailIsClickable() {
        return true;
    }

function renderDetails() {
    detailsListEl.innerHTML = '';

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

    details.forEach((detail, index) => {
        const li = document.createElement('li');

        const code = getDetailDisplayCode(detail);
        const name = getDetailDisplayName(detail);

        const child = isChildRow(detail, index);
        const clickable = detailIsClickable(detail);

        li.textContent = `${code} - ${name}`;

        li.classList.toggle(
            'selected',
            selectedDetail && selectedDetail.code === detail.code
        );

        // all top-level rows bold (standalone + heading-with-children)
        if (!child) {
            li.style.fontWeight = '700';
        }

        // child rows only: indented + normal weight
        if (child) {
            li.style.paddingLeft = '1.6rem';
            li.style.fontWeight = '400';
        }

        if (clickable) {
            li.style.cursor = 'pointer';

            li.onclick = () => {
                selectedDetail = detail;

                const detailCode = detail.file_code || detail.code;

                const params = new URLSearchParams({
                    brand: brandCode,
                    model: modelCode,
                    section: selectedSection.code,
                    detail: detailCode
                });

                if (selectedSubsection) {
                    params.set('subsection', selectedSubsection.code);
                }

                window.location.href = `diagram.html?${params.toString()}`;
            };
        } else {
            li.style.cursor = 'default';
        }

        detailsListEl.appendChild(li);
    });
}


    async function loadAndRenderDetails() {
        detailsListEl.innerHTML = '<li>Loading...</li>';
        saveState();

        if (!selectedSection ||
            (subsections.length > 0 && !selectedSubsection)) {
            renderAll();
            return;
        }

        let path;

        if (selectedSubsection) {
            path =
                `data/brands/${brandCode}/${modelCode}/details_` +
                `${selectedSection.code}_${selectedSubsection.code}.json`;
        } else if (subsections.length === 0) {
            path =
                `data/brands/${brandCode}/${modelCode}/details_` +
                `${selectedSection.code}.json`;
        } else {
            details = [];
            renderAll();
            return;
        }

        try {
            details = await readDataJson(path);
        } catch {
            details = [];
        }

        renderAll();
    }

    async function loadSubsections() {
        if (!selectedSection) return;

        subsectionsListEl.innerHTML = '<li>Loading...</li>';

        try {
            subsections = await readDataJson(
                `data/brands/${brandCode}/${modelCode}/subsections_${selectedSection.code}.json`
            );
        } catch {
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
            const brands = await readDataJson('data/brands.json');
            const brand = brands.find(b => b.code.toLowerCase() === brandCode);
            brandName = brand ? brand.name : brandCode.toUpperCase();

            const modelsData = await readDataJson(`data/brands/${brandCode}/models.json`);
            const models = modelsData[brandCode];
            const model = models.find(m => m.code.toLowerCase() === modelCode);
            modelName = model ? model.name : modelCode.toUpperCase();

            sections = await readDataJson(
                `data/brands/${brandCode}/${modelCode}/sections.json`
            );

            const saved = loadState();

            if (saved && saved.sectionCode) {
                selectedSection =
                    sections.find(s => s.code === saved.sectionCode) || null;

                if (selectedSection) {
                    try {
                        subsections = await readDataJson(
                            `data/brands/${brandCode}/${modelCode}/subsections_${selectedSection.code}.json`
                        );
                    } catch {
                        subsections = [];
                    }

                    if (saved.subsectionCode) {
                        selectedSubsection =
                            subsections.find(s => s.code === saved.subsectionCode) || null;
                    }
                }
            }

            await loadAndRenderDetails();
            mainContentEl.style.display = 'flex';

        } catch (error) {
            console.error('Initialization failed:', error);

            showError(
                "Could not load vehicle data. Check if it's downloaded (in Electron) or if the server path is correct."
            );
        }
    }

    function showError(msg) {
        errorMessageEl.textContent = msg;
        errorMessageEl.style.display = 'block';
        mainContentEl.style.display = 'none';
    }

    init();
}
