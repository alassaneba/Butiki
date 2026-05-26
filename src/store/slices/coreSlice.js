export const createCoreSlice = (set, get) => ({
  // Multi-Boutiques & Utilisateurs
  boutiques: [{ id: 'b1', name: 'Boutique Principale', location: 'Dakar', phone: '', color: 'blue', emoji: '🏪' }],
  activeBoutiqueId: 'b1',
  users: [],
  activeUserId: null,
  audit_log: [],

  // Configurations
  config: {
    prices: {
      pain: { miche: 135, deuxTiers: 90, demi: 65, unTiers: 45 },
      gaz: { b6: 2800, b9: 4175, b12: 6000 },
      loyalty: { ratio: 100, minPointsToRedeem: 500 } // 1 pt pour 100F d'achat
    },
    dailyTarget: 0,
    boutiqueName: 'Ma Boutique',
    boutiqueAddress: '',
    boutiqueWhatsApp: '',
    boutiqueLegal: '',
    boutiqueLogo: '',       // base64
    appPin: '',             // PIN de verrouillage global (vide = désactivé)
    sessionTimeoutMin: 0,   // 0 = jamais (en minutes)
    
    // Listes éditables
    expense_categories: [
      { value: 'loyer', label: 'Loyer Boutique', emoji: '🏠' },
      { value: 'electricite', label: 'Électricité (SENELEC)', emoji: '⚡' },
      { value: 'eau', label: 'Eau (SEN\'EAU)', emoji: '💧' },
      { value: 'salaire', label: 'Salaires & Primes', emoji: '💰' },
      { value: 'transport', label: 'Transport / Logistique', emoji: '🚚' },
      { value: 'maintenance', label: 'Maintenance / Réparation', emoji: '🔧' },
      { value: 'fournitures', label: 'Fournitures de bureau', emoji: '📁' },
      { value: 'marketing', label: 'Marketing / Publicité', emoji: '📢' },
      { value: 'frais_bancaires', label: 'Frais Mob. Money / Banques', emoji: '🏦' },
      { value: 'divers', label: 'Divers / Imprévus', emoji: '⚙️' }
    ],
    vault_categories_in: [
      'Fond de roulement initial',
      'Apport Gérant / Actionnaire',
      'Versement Caisse (Fin de journée)',
      'Dépôt de Sécurité',
      'Remboursement de Prêt',
      'Autre Entrée Exceptionnelle'
    ],
    vault_categories_out: [
      'Retrait Personnel Gérant',
      'Achat Marchandise (Gros)',
      'Investissement Matériel',
      'Paiement Fournisseur Stratégique',
      'Avance sur Salaire',
      'Dépôt en Banque',
      'Frais d\'Urgence Boutique',
      'Autre Sortie Exceptionnelle'
    ],
    fintech_providers: [
      { name: 'Wave', value: 'wave', color: '#1e40af' },
      { name: 'Orange Money', value: 'orange', color: '#ea580c' }
    ],
    phone_credit_providers: [
      { name: 'Orange', value: 'orange', emoji: '🟠' },
      { name: 'Free', value: 'free', emoji: '🔴' },
      { name: 'Expresso', value: 'expresso', emoji: '🔵' }
    ],
    active_modules: ['dashboard', 'caisse', 'stock', 'pain', 'gaz', 'credit', 'charges', 'depot', 'clients', 'fournisseurs', 'historique', 'previsions', 'settings', 'tresorerie', 'procurement', 'audit'],
    role_permissions: {
      proprietaire: { full_access: true },
      gerant: { full_access: true },
      caissier: { 
        modules: ['dashboard', 'caisse', 'stock', 'pain', 'gaz', 'credit', 'clients'],
        can_delete: false,
        can_view_reports: false
      }
    }
  },
  updateConfig: (category, key, value) => {
    get().logAction('Config Update', `Prix ${category}/${key} changé à ${value}`)
    set((state) => ({
      config: {
        ...state.config,
        prices: {
          ...state.config?.prices,
          [category]: {
            ...state.config?.prices?.[category],
            [key]: Number(value)
          }
        }
      }
    }))
  },
  updateConfigField: (key, value) => {
    get().logAction('Config Update', `Champ ${key} mis à jour`)
    set((state) => ({
      config: { ...state.config, [key]: value }
    }))
  },
  updateConfigList: (key, newList) => {
    get().logAction('Config Update', `Liste ${key} mise à jour`)
    set((state) => ({
      config: { ...state.config, [key]: newList }
    }))
  },
  resetConfigLists: () => {
    get().logAction('Config Update', 'Réinitialisation des listes par défaut')
    set((state) => ({
      config: {
        ...state.config,
        expense_categories: [
          { value: 'loyer', label: 'Loyer Boutique', emoji: '🏠' },
          { value: 'electricite', label: 'Électricité (SENELEC)', emoji: '⚡' },
          { value: 'eau', label: 'Eau (SEN\'EAU)', emoji: '💧' },
          { value: 'salaire', label: 'Salaires & Primes', emoji: '💰' },
          { value: 'transport', label: 'Transport / Logistique', emoji: '🚚' },
          { value: 'maintenance', label: 'Maintenance / Réparation', emoji: '🔧' },
          { value: 'fournitures', label: 'Fournitures de bureau', emoji: '📁' },
          { value: 'marketing', label: 'Marketing / Publicité', emoji: '📢' },
          { value: 'frais_bancaires', label: 'Frais Mob. Money / Banques', emoji: '🏦' },
          { value: 'divers', label: 'Divers / Imprévus', emoji: '⚙️' }
        ],
        vault_categories_in: [
          'Fond de roulement initial',
          'Apport Gérant / Actionnaire',
          'Versement Caisse (Fin de journée)',
          'Dépôt de Sécurité',
          'Remboursement de Prêt',
          'Autre Entrée Exceptionnelle'
        ],
        vault_categories_out: [
          'Retrait Personnel Gérant',
          'Achat Marchandise (Gros)',
          'Investissement Matériel',
          'Paiement Fournisseur Stratégique',
          'Avance sur Salaire',
          'Dépôt en Banque',
          'Frais d\'Urgence Boutique',
          'Autre Sortie Exceptionnelle'
        ]
      }
    }))
  },

  // Notifications
  notifications: [],
  addNotification: (notif) => set((state) => {
    const alreadyExists = state.notifications.some(
      n => n.type === notif.type && n.refId === notif.refId && !n.read
    )
    if (alreadyExists) return {}
    return {
      notifications: [
        { ...notif, id: crypto.randomUUID(), date: new Date().toISOString(), read: false },
        ...state.notifications
      ].slice(0, 50)
    }
  }),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
  markAllRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),
  clearAllNotifications: () => set({ notifications: [] }),

  // ── Multi-utilisateurs ──────────────────────────────────────────
  addUser: (user) => {
    get().logAction('Nouveau Compte', `Utilisateur ${user.name} créé (Rôle: ${user.role})`)
    set((state) => ({
      users: [...state.users, {
        id: crypto.randomUUID(),
        name: user.name,
        role: user.role || 'caissier', // 'proprietaire' | 'gerant' | 'caissier'
        pin: user.pin || '',
        whatsapp: user.whatsapp || '',
        createdAt: new Date().toISOString()
      }]
    }))
  },
  updateUser: (id, changes) => set((state) => ({
    users: state.users.map(u => u.id === id ? { ...u, ...changes } : u)
  })),
  deleteUser: (id) => {
    const user = get().users.find(u => u.id === id)
    get().logAction('Suppression Utilisateur', `Utilisateur ${user?.name} supprimé`)
    set((state) => ({
      users: state.users.filter(u => u.id !== id),
      activeUserId: state.activeUserId === id ? null : state.activeUserId
    }))
  },
  setActiveUser: (userId) => set((state) => {
    if (state.activeUserId === userId && !userId) return {}
    return {
      activeUserId: userId,
      users: state.users.map(u => u.id === userId ? { ...u, last_login: new Date().toISOString() } : u)
    }
  }),

  addBoutique: (boutique) => {
    get().logAction('Multi-Boutique', `Nouvelle boutique ajoutée : ${boutique.name}`)
    set((state) => ({
      boutiques: [...state.boutiques, { 
        id: crypto.randomUUID(), 
        name: boutique.name, 
        location: boutique.location || '',
        phone: boutique.phone || '',
        color: boutique.color || 'blue',
        emoji: boutique.emoji || '🏪',
        createdAt: new Date().toISOString()
      }]
    }))
  },
  
  switchBoutique: (id) => {
    const boutique = get().boutiques.find(b => b.id === id)
    get().logAction('Multi-Boutique', `Passage vers la boutique : ${boutique?.name}`)
    set({ activeBoutiqueId: id })
  },

  deleteBoutique: (id, transferStock = false) => {
    if (id === 'b1') return; // Sécurité : on ne supprime jamais la boutique principale
    const state = get()
    if (state.boutiques.length <= 1) return; // Sécurité : il faut au moins une boutique
    
    const boutiqueToDelete = state.boutiques.find(b => b.id === id)
    get().logAction('Multi-Boutique', `Boutique ${boutiqueToDelete?.name} supprimée. Transfert stock: ${transferStock ? 'Oui' : 'Non'}`)

    // 1. Transfert de stock optionnel
    let newStock = [...(state.stock || [])]
    if (transferStock) {
      const stockToTransfer = newStock.filter(s => (s.boutiqueId || 'b1') === id)
      stockToTransfer.forEach(item => {
        if (item.current_stock > 0) {
          // Chercher si l'item existe déjà dans b1
          const existingInB1 = newStock.find(s => s.barcode === item.barcode && (s.boutiqueId || 'b1') === 'b1')
          if (existingInB1) {
            existingInB1.current_stock += item.current_stock
          } else {
            // Créer le produit dans b1
            newStock.push({ ...item, id: crypto.randomUUID(), boutiqueId: 'b1' })
          }
        }
      })
    }

    // 2. Nettoyage en cascade (on enlève toutes les données liées à `id`)
    set({
      boutiques: state.boutiques.filter(b => b.id !== id),
      activeBoutiqueId: state.activeBoutiqueId === id ? 'b1' : state.activeBoutiqueId,
      
      // Stock
      stock: newStock.filter(s => (s.boutiqueId || 'b1') !== id),
      stock_logs: (state.stock_logs || []).filter(l => (l.boutiqueId || 'b1') !== id),
      inventory_history: (state.inventory_history || []).filter(h => (h.boutiqueId || 'b1') !== id),
      
      // Ventes
      sales: (state.sales || []).filter(s => (s.boutiqueId || 'b1') !== id),
      
      // Finance
      expenses: (state.expenses || []).filter(e => (e.boutiqueId || 'b1') !== id),
      inflows: (state.inflows || []).filter(i => (i.boutiqueId || 'b1') !== id),
      daily_cash_register: (state.daily_cash_register || []).filter(r => (r.boutiqueId || 'b1') !== id),
      fixed_charges: (state.fixed_charges || []).filter(f => (f.boutiqueId || 'b1') !== id),
      debt_payments: (state.debt_payments || []).filter(p => (p.boutiqueId || 'b1') !== id),
      
      // Personnes
      clients: (state.clients || []).filter(c => (c.boutiqueId || 'b1') !== id),
      suppliers: (state.suppliers || []).filter(s => (s.boutiqueId || 'b1') !== id),
      supplier_evaluations: (state.supplier_evaluations || []).filter(e => (e.boutiqueId || 'b1') !== id),
      
      // Modules
      purchase_orders: (state.purchase_orders || []).filter(p => (p.boutiqueId || 'b1') !== id),
      bread_logs: (state.bread_logs || []).filter(b => (b.boutiqueId || 'b1') !== id),
      gas_logs: (state.gas_logs || []).filter(g => (g.boutiqueId || 'b1') !== id),
      credit_logs: (state.credit_logs || []).filter(c => (c.boutiqueId || 'b1') !== id),
      deliveries: (state.deliveries || []).filter(d => (d.boutiqueId || 'b1') !== id),
      delivery_staff: (state.delivery_staff || []).filter(d => (d.boutiqueId || 'b1') !== id),
      
      // RH
      staff_profiles: (state.staff_profiles || []).filter(p => (p.boutiqueId || 'b1') !== id),
      attendance_logs: (state.attendance_logs || []).filter(a => (a.boutiqueId || 'b1') !== id),
      salary_advances: (state.salary_advances || []).filter(s => (s.boutiqueId || 'b1') !== id),
      payroll_history: (state.payroll_history || []).filter(p => (p.boutiqueId || 'b1') !== id)
    })
  },

  // ── Audit Trail ────────────────────────────────────────────────
  logAction: (action, details = '') => set((state) => {
    const user = state.users.find(u => u.id === state.activeUserId)
    return {
      audit_log: [{
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        userId: state.activeUserId,
        user: user?.name || 'Inconnu',
        action,
        details
      }, ...state.audit_log].slice(0, 500)
    }
  }),
  clearAuditLogs: () => {
    set({ audit_log: [] })
  },

  // Cloud Backup state
  cloudToken: null,
  lastBackupDate: null,
  setCloudToken: (token) => set({ cloudToken: token }),
  setLastBackupDate: (dateString) => set({ lastBackupDate: dateString }),

  // Utilitaires de réinitialisation (appelé à travers le store global, on le laissera dans useStore ou ici)
  clearAllData: () => set({
    suppliers: [], 
    clients: [], 
    supplier_evaluations: [],
    expenses: [], 
    daily_cash_register: [], 
    debt_payments: [], 
    inflows: [],
    fixed_charges: [],
    fintech_balances: {},
    vault_balance: 0,
    vault_transactions: [],
    vault_audits: [],
    stock: [], 
    stock_logs: [],
    inventory_history: [],
    purchase_orders: [],
    procurement_cart: [],
    bread_logs: [], 
    gas_logs: [], 
    credit_logs: [],
    fintech_transactions: [],
    sales: [],
    deliveries: [],
    delivery_staff: [],
    users: [],
    activeUserId: null,
    audit_log: [],
    notifications: [],
    staff_profiles: [],
    attendance_logs: [],
    salary_advances: [],
    payroll_history: [],
    boutiques: [{ id: 'b1', name: 'Boutique Principale', location: 'Dakar', phone: '' }],
    activeBoutiqueId: 'b1',
    config: {
      prices: {
        pain: { miche: 135, deuxTiers: 90, demi: 65, unTiers: 45 },
        gaz: { b6: 2800, b9: 4175, b12: 6000 },
        loyalty: { ratio: 100, minPointsToRedeem: 500 }
      },
      dailyTarget: 0,
      boutiqueName: 'Ma Boutique',
      boutiqueAddress: '',
      boutiqueWhatsApp: '',
      boutiqueLegal: '',
      boutiqueLogo: '',
      appPin: '',
      sessionTimeoutMin: 0,
      expense_categories: [
        { value: 'loyer', label: 'Loyer Boutique', emoji: '🏠' },
        { value: 'electricite', label: 'Électricité (SENELEC)', emoji: '⚡' },
        { value: 'eau', label: 'Eau (SEN\'EAU)', emoji: '💧' },
        { value: 'salaire', label: 'Salaires & Primes', emoji: '💰' },
        { value: 'transport', label: 'Transport / Logistique', emoji: '🚚' },
        { value: 'maintenance', label: 'Maintenance / Réparation', emoji: '🔧' },
        { value: 'fournitures', label: 'Fournitures de bureau', emoji: '📁' },
        { value: 'marketing', label: 'Marketing / Publicité', emoji: '📢' },
        { value: 'frais_bancaires', label: 'Frais Mob. Money / Banques', emoji: '🏦' },
        { value: 'divers', label: 'Divers / Imprévus', emoji: '⚙️' }
      ],
      vault_categories_in: [
        'Fond de roulement initial',
        'Apport Gérant / Actionnaire',
        'Versement Caisse (Fin de journée)',
        'Dépôt de Sécurité',
        'Remboursement de Prêt',
        'Autre Entrée Exceptionnelle'
      ],
      vault_categories_out: [
        'Retrait Personnel Gérant',
        'Achat Marchandise (Gros)',
        'Investissement Matériel',
        'Paiement Fournisseur Stratégique',
        'Avance sur Salaire',
        'Dépôt en Banque',
        'Frais d\'Urgence Boutique',
        'Autre Sortie Exceptionnelle'
      ],
      fintech_providers: [
        { name: 'Wave', value: 'wave', color: '#1e40af' },
        { name: 'Orange Money', value: 'orange', color: '#ea580c' }
      ],
      phone_credit_providers: [
        { name: 'Orange', value: 'orange', emoji: '🟠' },
        { name: 'Free', value: 'free', emoji: '🔴' },
        { name: 'Expresso', value: 'expresso', emoji: '🔵' }
      ],
      active_modules: ['dashboard', 'caisse', 'stock', 'pain', 'gaz', 'credit', 'charges', 'depot', 'clients', 'fournisseurs', 'historique', 'previsions', 'settings', 'tresorerie', 'procurement', 'audit'],
      role_permissions: {
        gerant: { full_access: true },
        caissier: { 
          modules: ['dashboard', 'caisse', 'stock', 'pain', 'gaz', 'credit', 'clients'],
          can_delete: false,
          can_view_reports: false
        }
      }
    }
  })
});
