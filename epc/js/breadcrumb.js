// epc/js/breadcrumb.js - UNIVERSAL VERSION

function createBreadcrumbLink(text, onClickHandler) {
    const link = document.createElement('a');
    link.href = '#'; // Always a neutral href
    link.textContent = text;
    if (onClickHandler) {
        link.onclick = (e) => {
            e.preventDefault();
            onClickHandler();
        };
    }
    return link;
}

function createBreadcrumbItem(text, active = false, handler = null) {
    const li = document.createElement('li');
    li.className = 'breadcrumb-item';
    if (active) {
        li.classList.add('active');
        li.textContent = text;
    } else {
        li.appendChild(createBreadcrumbLink(text, handler));
    }
    return li;
}

export function renderBreadcrumb({
    breadcrumbEl,
    brandName,
    modelName,
    selectedSection,
    selectedSubsection,
    selectedDetail,
    onHomeClick,
    onBrandClick,
    onModelClick,
    onSectionClick,
    onSubsectionClick
}) {
    if (!breadcrumbEl) return;
    breadcrumbEl.innerHTML = '';

    // Home
    breadcrumbEl.appendChild(createBreadcrumbItem('EPC', false, onHomeClick));

    // Brand
    if (brandName) {
        breadcrumbEl.appendChild(createBreadcrumbItem(brandName, false, onBrandClick));
    }

    // Model
    if (modelName) {
        const isModelActive = !selectedSection && !selectedDetail;
        breadcrumbEl.appendChild(createBreadcrumbItem(modelName, isModelActive, onModelClick));
    }

    // Section
    if (selectedSection) {
        const isSectionActive = !selectedSubsection && !selectedDetail;
        breadcrumbEl.appendChild(createBreadcrumbItem(selectedSection.name, isSectionActive, onSectionClick));
    }

    // Subsection
    if (selectedSubsection) {
        const isSubsectionActive = !selectedDetail;
        breadcrumbEl.appendChild(createBreadcrumbItem(selectedSubsection.name, isSubsectionActive, onSubsectionClick));
    }

    // Detail (always active on diagram page)
    if (selectedDetail) {
        breadcrumbEl.appendChild(createBreadcrumbItem(selectedDetail.name, true, null));
    }
}