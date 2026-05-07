export const SENEGAL_SUPPLIERS = [
  { name: 'GMD (Grands Moulins de Dakar)', phone: '338398585', category: 'Farine/Céréales' },
  { name: 'CSS (Compagnie Sucrière Sénégalaise)', phone: '339671005', category: 'Sucre' },
  { name: 'Suneor Sénégal', phone: '338397100', category: 'Huile' },
  { name: 'Kirène (Groupe Siagro)', phone: '338321010', category: 'Boissons/Lait' },
  { name: 'Nestlé Sénégal', phone: '338398000', category: 'Lait/Café' },
  { name: 'Patisen', phone: '338397777', category: 'Alimentation/Bouillon' },
  { name: 'Vivo Energy Sénégal', phone: '338496060', category: 'Gaz/Carburant' },
  { name: 'NMA Sanders', phone: '338398888', category: 'Farine/Pâtes' },
  { name: 'SODEFITEX', phone: '339811010', category: 'Alimentation' },
  { name: 'La Laiterie du Berger (Dolima)', phone: '338320000', category: 'Laitage' },
  { name: 'Chocosen', phone: '338390000', category: 'Confiserie' },
  { name: 'GIAC (Pasta Bella)', phone: '338391111', category: 'Pâtes' },
  { name: 'Agroline (Linguère)', phone: '338392222', category: 'Condiments' },
  { name: 'MasterFood Sénégal', phone: '338393333', category: 'Distribution' },
  { name: 'SOBOA', phone: '338394444', category: 'Boissons' },
  { name: 'Touba Gaz', phone: '338395555', category: 'Gaz' },
  { name: 'TotalEnergies Sénégal', phone: '338495050', category: 'Gaz/Carburant' },
  { name: 'Sedima Group', phone: '338396666', category: 'Aviculture' },
  { name: 'Fruitales', phone: '338397778', category: 'Jus/Conserves' },
  { name: 'SIPL (Plastique)', phone: '338398889', category: 'Emballage' }
];

export const SENEGAL_PRODUCTS = [
  // Alimentation de Base
  { name: 'Riz Parfumé Royal (50kg)', category: 'Riz', price_buy: 22500, price_sell: 25000, current_stock: 25, alert_threshold: 5 },
  { name: 'Riz Brisé Local "Vallée" (50kg)', category: 'Riz', price_buy: 17500, price_sell: 19500, current_stock: 40, alert_threshold: 10 },
  { name: 'Huile Niinal (20L)', category: 'Huile', price_buy: 18500, price_sell: 21000, current_stock: 15, alert_threshold: 3 },
  { name: 'Huile J\'adore (5L)', category: 'Huile', price_buy: 5800, price_sell: 6500, current_stock: 20, alert_threshold: 5 },
  { name: 'Sucre Cristallisé CSS (50kg)', category: 'Sucre', price_buy: 28250, price_sell: 30000, current_stock: 12, alert_threshold: 4 },
  { name: 'Farine GMD (50kg)', category: 'Céréales', price_buy: 19000, price_sell: 21000, current_stock: 5, alert_threshold: 2 },
  
  // Épicerie & Petit Déjeuner
  { name: 'Café Touba Keur Khadim (250g)', category: 'Boisson', price_buy: 1250, price_sell: 1500, current_stock: 50, alert_threshold: 10 },
  { name: 'Café Touba Serigne Bi (500g)', category: 'Boisson', price_buy: 2400, price_sell: 2800, current_stock: 30, alert_threshold: 5 },
  { name: 'Thé Ataya Lion (Boîte)', category: 'Boisson', price_buy: 400, price_sell: 600, current_stock: 100, alert_threshold: 20 },
  { name: 'Lait Gloria (Carton 48)', category: 'Lait', price_buy: 16500, price_sell: 19200, current_stock: 10, alert_threshold: 2 },
  { name: 'Lait Bridel (Sac 25kg)', category: 'Lait', price_buy: 58000, price_sell: 65000, current_stock: 2, alert_threshold: 1 },
  { name: 'Yaourt Dolima (Pot 125g)', category: 'Laitage', price_buy: 150, price_sell: 200, current_stock: 48, alert_threshold: 12 },
  { name: 'Choco-Pâte Patisen (Pot)', category: 'Épicerie', price_buy: 1200, price_sell: 1500, current_stock: 24, alert_threshold: 6 },
  { name: 'Pâtes Pasta Bella (500g)', category: 'Céréales', price_buy: 350, price_sell: 450, current_stock: 60, alert_threshold: 15 },
  { name: 'Bouillon Maggi (Seau 100)', category: 'Condiment', price_buy: 2400, price_sell: 3000, current_stock: 45, alert_threshold: 10 },
  { name: 'Bouillon Adja (Sachet)', category: 'Condiment', price_buy: 400, price_sell: 500, current_stock: 80, alert_threshold: 20 },
  
  // Boissons
  { name: 'Eau Kirène 1.5L (Pack 6)', category: 'Boissons', price_buy: 1900, price_sell: 2400, current_stock: 60, alert_threshold: 12 },
  { name: 'Eau Casamançaise 1.5L (Pack 6)', category: 'Boissons', price_buy: 1800, price_sell: 2200, current_stock: 40, alert_threshold: 10 },
  { name: 'Jus Pressea 1L (Bissap)', category: 'Boissons', price_buy: 900, price_sell: 1200, current_stock: 24, alert_threshold: 6 },
  { name: 'Jus Pressea 1L (Bouye)', category: 'Boissons', price_buy: 900, price_sell: 1200, current_stock: 24, alert_threshold: 6 },
  { name: 'Boisson Top Oranger (60cl)', category: 'Boissons', price_buy: 450, price_sell: 600, current_stock: 36, alert_threshold: 12 },
  { name: 'Coca-Cola 1.5L (Bouteille)', category: 'Boissons', price_buy: 900, price_sell: 1100, current_stock: 24, alert_threshold: 6 },
  { name: 'Gazelle Bière 63cl (Caisse)', category: 'Boissons', price_buy: 10500, price_sell: 12000, current_stock: 5, alert_threshold: 2 },
  
  // Hygiène & Entretien
  { name: 'Savon Marseille (Pack 4)', category: 'Hygiène', price_buy: 1600, price_sell: 2000, current_stock: 30, alert_threshold: 5 },
  { name: 'Savon Diama (Lot 3)', category: 'Hygiène', price_buy: 900, price_sell: 1200, current_stock: 40, alert_threshold: 10 },
  { name: 'Détergent Madar (Pot 1kg)', category: 'Hygiène', price_buy: 1200, price_sell: 1500, current_stock: 24, alert_threshold: 6 },
  { name: 'Javel Lacroix (1L)', category: 'Hygiène', price_buy: 850, price_sell: 1100, current_stock: 24, alert_threshold: 6 },
  { name: 'Papier Toilette Lotus (Pack 6)', category: 'Hygiène', price_buy: 1400, price_sell: 1800, current_stock: 20, alert_threshold: 5 },
  { name: 'Couches Bébé Molfix (Pack)', category: 'Hygiène', price_buy: 6500, price_sell: 7500, current_stock: 15, alert_threshold: 4 },
  
  // Divers
  { name: 'Gaz Touba Gaz (12kg)', category: 'Gaz', price_buy: 6000, price_sell: 6500, current_stock: 10, alert_threshold: 2 },
  { name: 'Insecticide Baygon (Aérosol)', category: 'Divers', price_buy: 1800, price_sell: 2200, current_stock: 12, alert_threshold: 3 },
  { name: 'Allumettes (Paquet de 10)', category: 'Divers', price_buy: 300, price_sell: 500, current_stock: 50, alert_threshold: 10 }
];

