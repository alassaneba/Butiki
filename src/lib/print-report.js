/**
 * lib/print-report.js
 * Génère des rapports imprimables en HTML natif (pas de dépendance externe)
 */

export function printDailyReport(register, expenses, boutiqueName = 'Butiki') {
  const date = new Date(register.date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const totalExp = expenses.reduce((a, e) => a + Number(e.amount), 0)

  const rows = expenses.map(e => `
    <tr>
      <td>${new Date(e.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
      <td>${e.description}</td>
      <td style="text-align:right; color:#dc2626;">${Number(e.amount).toLocaleString('fr-FR')} F</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Rapport Caisse – ${date}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; padding: 24px; max-width: 600px; margin: auto; }
    .header { text-align: center; border-bottom: 3px solid #1d4ed8; padding-bottom: 16px; margin-bottom: 20px; }
    .header h1 { font-size: 28px; font-weight: 900; color: #1d4ed8; letter-spacing: -1px; }
    .header p { color: #6b7280; font-size: 13px; margin-top: 4px; }
    .kpis { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
    .kpi label { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 700; letter-spacing: .5px; }
    .kpi .val { font-size: 24px; font-weight: 900; margin-top: 4px; }
    .kpi.blue .val { color: #1d4ed8; }
    .kpi.red .val { color: #dc2626; }
    .kpi.green .val { color: #16a34a; }
    .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; color: #374151; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-weight: 700; color: #374151; }
    td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
    .total-row td { font-weight: 900; border-top: 2px solid #e2e8f0; }
    .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700; }
    .badge-open { background: #dcfce7; color: #16a34a; }
    .badge-closed { background: #dbeafe; color: #1d4ed8; }
    @media print {
      body { padding: 10px; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${boutiqueName.toUpperCase()}</h1>
    <p>Rapport de Caisse Journalier</p>
    <p style="margin-top:6px; font-size:14px; font-weight:600; color:#374151;">${date}</p>
    <span class="badge ${register.closing_balance !== null ? 'badge-closed' : 'badge-open'}">
      ${register.closing_balance !== null ? '✓ Clôturée' : '🟢 Ouverte'}
    </span>
  </div>

  <div class="kpis">
    <div class="kpi blue">
      <label>Fond Initial</label>
      <div class="val">${Number(register.opening_balance || 0).toLocaleString('fr-FR')} F</div>
    </div>
    ${register.closing_balance !== null ? `
    <div class="kpi blue">
      <label>Arrêt de Caisse</label>
      <div class="val">${Number(register.closing_balance).toLocaleString('fr-FR')} F</div>
    </div>
    <div class="kpi red">
      <label>Total Dépenses</label>
      <div class="val">${totalExp.toLocaleString('fr-FR')} F</div>
    </div>
    <div class="kpi green">
      <label>Ventes Calculées</label>
      <div class="val">${Math.max(0, register.calculated_sales || 0).toLocaleString('fr-FR')} F</div>
    </div>` : `
    <div class="kpi red">
      <label>Dépenses du Jour</label>
      <div class="val">${totalExp.toLocaleString('fr-FR')} F</div>
    </div>`}
  </div>

  ${expenses.length > 0 ? `
  <p class="section-title">Détail des Dépenses</p>
  <table>
    <thead><tr><th>Heure</th><th>Description</th><th style="text-align:right">Montant</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="2">Total Dépenses</td>
        <td style="text-align:right; color:#dc2626;">${totalExp.toLocaleString('fr-FR')} F</td>
      </tr>
    </tfoot>
  </table>` : ''}

  <div class="footer">
    <p>Généré le ${new Date().toLocaleString('fr-FR')} par Butiki</p>
    <p style="margin-top:4px;">© ${new Date().getFullYear()} ${boutiqueName}</p>
  </div>
  <br/>
  <button onclick="window.print()" style="width:100%;padding:12px;background:#1d4ed8;color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">
    🖨️ Imprimer / Enregistrer en PDF
  </button>
</body>
</html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
}

export function printAuditReport(session, boutiqueName = 'Butiki') {
  const date = new Date(session.date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  
  const rows = session.details.map(d => {
    const diff = d.counted - d.theoretical
    return `
      <tr>
        <td>
          <div style="font-weight:700;">${d.name}</div>
        </td>
        <td style="text-align:center;">${d.theoretical}</td>
        <td style="text-align:center;">${d.counted}</td>
        <td style="text-align:right; font-weight:900; color: ${diff === 0 ? '#6b7280' : diff > 0 ? '#16a34a' : '#dc2626'}">
          ${diff > 0 ? '+' : ''}${diff}
        </td>
      </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Audit Stock – ${date}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; padding: 24px; max-width: 700px; margin: auto; }
    .header { text-align: center; border-bottom: 3px solid #f97316; padding-bottom: 16px; margin-bottom: 20px; }
    .header h1 { font-size: 28px; font-weight: 900; color: #f97316; letter-spacing: -1px; }
    .header p { color: #6b7280; font-size: 13px; margin-top: 4px; }
    .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .kpi { background: #fff7ed; border: 1px solid #ffedd5; border-radius: 10px; padding: 14px; }
    .kpi label { font-size: 10px; color: #9a3412; text-transform: uppercase; font-weight: 800; letter-spacing: .5px; }
    .kpi .val { font-size: 20px; font-weight: 900; margin-top: 4px; color: #c2410c; }
    .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #374151; margin-bottom: 12px; border-left: 4px solid #f97316; padding-left: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    th { background: #fdf2f8; padding: 10px; text-align: left; font-weight: 800; color: #374151; border-bottom: 2px solid #ffedd5; }
    td { padding: 10px; border-bottom: 1px solid #ffedd5; }
    .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    @media print {
      body { padding: 0; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${boutiqueName.toUpperCase()}</h1>
    <p>Rapport d'Audit d'Inventaire</p>
    <p style="margin-top:6px; font-size:14px; font-weight:600; color:#374151;">${date}</p>
  </div>

  <div class="kpis">
    <div class="kpi">
      <label>Articles Contrôlés</label>
      <div class="val">${session.details.length}</div>
    </div>
    <div class="kpi">
      <label>Articles Écartés</label>
      <div class="val">${session.stats.totalEcarts}</div>
    </div>
    <div class="kpi">
      <label>Impact Valeur</label>
      <div class="val">${Number(session.stats.discrepancyValue || 0).toLocaleString('fr-FR')} F</div>
    </div>
  </div>

  <p class="section-title">Détail des Écarts de Stock</p>
  <table>
    <thead>
      <tr>
        <th>Désignation Produit</th>
        <th style="text-align:center;">Théorique</th>
        <th style="text-align:center;">Physique</th>
        <th style="text-align:right;">Écart</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div style="margin-top:20px; padding:16px; background:#f8fafc; border-radius:12px; font-size:11px; color:#475569;">
    <p><b>Observateur :</b> ${session.userName}</p>
    <p style="margin-top:4px;"><b>Note :</b> Cet inventaire a été validé et les stocks systèmes ont été synchronisés avec les quantités physiques enregistrées ci-dessus.</p>
  </div>

  <div class="footer">
    <p>Document généré par Butiki ERP – Le ${new Date().toLocaleString('fr-FR')}</p>
    <p style="margin-top:4px;">Signature de l'Auditeur : __________________________</p>
  </div>
  <br/>
  <button onclick="window.print()" style="width:100%;padding:14px;background:#f97316;color:white;border:none;border-radius:10px;font-size:14px;font-weight:900;cursor:pointer;box-shadow: 0 4px 12px rgba(249,115,22,0.2);">
    🖨️ Télécharger le Rapport d'Audit
  </button>
</body>
</html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
}
