export const LOYALTY_LEVELS = [
  { name: 'Standard', minPoints: 0, color: 'text-muted-foreground', bg: 'bg-muted/10', icon: '👤' },
  { name: 'Bronze', minPoints: 500, color: 'text-orange-600', bg: 'bg-orange-500/10', icon: '🥉' },
  { name: 'Argent', minPoints: 2000, color: 'text-slate-500', bg: 'bg-slate-500/10', icon: '🥈' },
  { name: 'Or', minPoints: 5000, color: 'text-amber-500', bg: 'bg-amber-500/10', icon: '🥇' },
  { name: 'Diamant', minPoints: 10000, color: 'text-blue-600', bg: 'bg-blue-500/10', icon: '💎' }
];

export const getLoyaltyLevel = (points = 0) => {
  return [...LOYALTY_LEVELS].reverse().find(level => points >= level.minPoints) || LOYALTY_LEVELS[0];
};

export const getNextLevelProgress = (points = 0) => {
  const currentLevelIndex = LOYALTY_LEVELS.findIndex(level => level === getLoyaltyLevel(points));
  const nextLevel = LOYALTY_LEVELS[currentLevelIndex + 1];
  
  if (!nextLevel) return { progress: 100, remaining: 0, next: null };
  
  const range = nextLevel.minPoints - LOYALTY_LEVELS[currentLevelIndex].minPoints;
  const currentProgress = points - LOYALTY_LEVELS[currentLevelIndex].minPoints;
  const progress = Math.min(100, Math.max(0, (currentProgress / range) * 100));
  
  return {
    progress,
    remaining: nextLevel.minPoints - points,
    next: nextLevel
  };
};

export const getClientSegment = (client) => {
  const lastTxDate = client.transactions?.length > 0 
    ? client.transactions[client.transactions.length - 1].date 
    : (client.createdAt || new Date().toISOString());
  
  const daysSinceLastActivity = Math.floor((new Date() - new Date(lastTxDate)) / (1000 * 60 * 60 * 24));
  const points = client.loyalty_points || 0;

  if (daysSinceLastActivity > 60) return { id: 'lost', name: 'Perdu', color: 'text-red-600', bg: 'bg-red-500/10', icon: '🥀' };
  if (daysSinceLastActivity > 30) return { id: 'inactive', name: 'Inactif', color: 'text-orange-600', bg: 'bg-orange-500/10', icon: '⏳' };
  if (points > 5000) return { id: 'champion', name: 'Champion', color: 'text-blue-600', bg: 'bg-blue-500/10', icon: '🏆' };
  if (points > 1000) return { id: 'potential', name: 'Potentiel', color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: '📈' };
  
  return { id: 'new', name: 'Nouveau / Standard', color: 'text-muted-foreground', bg: 'bg-muted/10', icon: '👶' };
};

export const getMarketingMessage = (segmentId, clientName, points = 0) => {
  const templates = {
    inactive: `Bonjour ${clientName} ! Vous nous manquez chez Butik 🏪. Vous avez ${points} points de fidélité qui n'attendent que vous. Passez nous voir cette semaine ! 🙏`,
    lost: `Cher ${clientName}, cela fait longtemps ! Nous avons de nouveaux arrivages qui pourraient vous plaire. Profitez de vos ${points} points de fidélité lors de votre prochaine visite. ✨`,
    potential: `Félicitations ${clientName} ! Vous êtes proche du prochain niveau VIP. Plus que quelques points pour débloquer de nouvelles réductions ! 🚀`,
    champion: `Merci pour votre fidélité exemplaire, ${clientName} ! En tant que client Or/Diamant, vous bénéficiez de remises exclusives sur notre nouvelle collection. À bientôt ! 💎`
  };
  return templates[segmentId] || `Bonjour ${clientName}, merci de votre fidélité chez Butik ! Vous avez actuellement ${points} points. 🙏`;
};
