/**
 * Renders clickable SVG callouts over an image.
 * The overlay is sized to the DISPLAYED size of the image
 * and absolute-positioned in #diagram-callouts-layer.
 * Callout coordinates (x/y) should be given as if for the natural/original image size.
 * They are auto-scaled for the display size.
 */
export function renderDiagramCallouts(parts, calloutsLayerId, tableSelector) {
    const container = document.getElementById(calloutsLayerId);
    if (!container) return;

    // Clear previous
    container.innerHTML = '';

    // Get the <img>
    const img = container.parentNode.querySelector('img');
    if (!img || !img.complete) {
        if (img) img.addEventListener('load', () => renderDiagramCallouts(parts, calloutsLayerId, tableSelector), { once: true });
        return;
    }

    // Size info
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const displayWidth = img.clientWidth;
    const displayHeight = img.clientHeight;

    // Ratio to scale coordinates
    const scaleX = displayWidth / naturalWidth;
    const scaleY = displayHeight / naturalHeight;

    // Style overlay div
    container.style.position = "absolute";
    container.style.left = "0";
    container.style.top = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.pointerEvents = "none"; // callouts will set their own

    // Make SVG for callouts
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", displayWidth);
    svg.setAttribute("height", displayHeight);
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.pointerEvents = "none"; // g elements override

    // Render each part with callout position
    parts.forEach((part, i) => {
        if (!isNaN(part.x) && !isNaN(part.y)) {
            const group = document.createElementNS(svgNS, "g");
            group.classList.add("diagram-callout");
            group.setAttribute("data-call", part.call);
            group.style.cursor = "pointer";
            group.style.pointerEvents = "all";

            // Box size (tweak as you wish)
            const boxW = 32, boxH = 32;
            const cx = part.x * scaleX;
            const cy = part.y * scaleY;

            // Highlight rect
            const hiRect = document.createElementNS(svgNS, "rect");
            hiRect.setAttribute("x", cx - boxW / 2);
            hiRect.setAttribute("y", cy - boxH / 2);
            hiRect.setAttribute("width", boxW);
            hiRect.setAttribute("height", boxH);
            hiRect.setAttribute("fill", "#a8dcff");
            hiRect.setAttribute("opacity", "0");
            hiRect.setAttribute("rx", "6");
            group.appendChild(hiRect);

            // Click target
            const rect = document.createElementNS(svgNS, "rect");
            rect.setAttribute("x", cx - boxW / 2);
            rect.setAttribute("y", cy - boxH / 2);
            rect.setAttribute("width", boxW);
            rect.setAttribute("height", boxH);
            rect.setAttribute("fill", "transparent");
            group.appendChild(rect);

            // Number/text (optional)
            // const text = document.createElementNS(svgNS, "text");
            // text.setAttribute("x", cx);
            // text.setAttribute("y", cy + 6);
            // text.setAttribute("text-anchor", "middle");
            // text.setAttribute("font-size", "18");
            // text.setAttribute("font-weight", "bold");
            // text.setAttribute("fill", "#003366");
            // text.textContent = part.call;
            // group.appendChild(text);

            // Click logic for highlight + table
            group.addEventListener("click", e => {
                e.stopPropagation();
                const callNum = part.call;
                const isActive = group.classList.contains("active");
                document.querySelectorAll(".diagram-callout").forEach(g => {
                    g.classList.remove("active");
                    g.querySelector("rect").setAttribute("opacity", "0");
                });
                document.querySelectorAll(tableSelector + " tbody tr").forEach(row =>
                    row.classList.remove("highlight")
                );
                if (!isActive) {
                    document.querySelectorAll('.diagram-callout[data-call="' + callNum + '"]').forEach(g => {
                        g.classList.add("active");
                        g.querySelector("rect").setAttribute("opacity", "0.8");
                    });
                    document.querySelectorAll(tableSelector + ' tbody tr[data-call="' + callNum + '"]').forEach(tr =>
                        tr.classList.add("highlight")
                    );
                }
            });

            svg.appendChild(group);
        }
    });

    container.appendChild(svg);
}

/**
 * Adds data-call attributes to table rows (one row per part in the same order).
 */
export function addCallAttrToRows(tableSelector, parts) {
    const rows = document.querySelectorAll(tableSelector + " tbody tr");
    rows.forEach((row, i) => {
        if (parts[i] && parts[i].call) {
            row.setAttribute("data-call", parts[i].call);
        }
    });
}
