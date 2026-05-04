export const createCoreSlice = (set, get) => ({
  // Multi-Boutiques & Utilisateurs
  boutiques: [{ id: 'b1', name: 'Boutique Principale', location: 'Dakar', phone: '' }],
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
        role: user.role || 'caissier', // 'gerant' | 'caissier'
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
        createdAt: new Date().toISOString()
      }]
    }))
  },
  
  switchBoutique: (id) => {
    const boutique = get().boutiques.find(b => b.id === id)
    get().logAction('Multi-Boutique', `Passage vers la boutique : ${boutique?.name}`)
    set({ activeBoutiqueId: id })
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

  // Cloud Backup state
  cloudToken: null,
  lastBackupDate: null,
  setCloudToken: (token) => set({ cloudToken: token }),
  setLastBackupDate: (dateString) => set({ lastBackupDate: dateString }),

  // Utilitaires de réinitialisation (appelé à travers le store global, on le laissera dans useStore ou ici)
  clearAllData: () => set({
    suppliers: [], 
    clients: [], 
    expenses: [], 
    daily_cash_register: [], 
    bread_logs: [], 
    gas_logs: [], 
    debt_payments: [], 
    stock: [], 
    stock_logs: [],
    inventory_history: [],
    purchase_orders: [],
    users: [],
    activeUserId: null,
    audit_log: [],
    notifications: [],
    credit_logs: [],
    inflows: []
  })
});
