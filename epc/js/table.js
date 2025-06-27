// js/table.js

export function renderPartsTable(partsTableData) {
  const partsTableBody = document.querySelector('#parts-table tbody');
  if (!partsTableBody) return;
  partsTableBody.innerHTML = '';
  partsTableData.forEach(part => {
    const row = document.createElement('tr');
    row.setAttribute('data-call', part.call);
    row.innerHTML = `
      <td>${part.call}</td>
      <td>${part.part}</td>
      <td>${part.desc}</td>
      <td>${part.usage || ''}</td>
      <td>${part.qty || ''}</td>
    `;
    row.addEventListener('click', () => {
      document.querySelectorAll('.callout').forEach(c => c.classList.remove('active'));
      document.querySelectorAll('#parts-table tbody tr').forEach(r => r.classList.remove('highlight'));
      document.querySelectorAll(`.callout[data-call="${part.call}"]`).forEach(c => c.classList.add('active'));
      row.classList.add('highlight');
    });
    partsTableBody.appendChild(row);
  });
}
