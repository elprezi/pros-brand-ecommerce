import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  LoyaltyProgramConfig,
  LoyaltyLevel,
  LoyaltyMember,
  LoyaltyReward,
  LoyaltyRule,
  LoyaltyCampaign,
  LoyaltyTransaction,
  LoyaltyAuditLog,
} from '../types/loyalty';

interface LoyaltyContextType {
  config: LoyaltyProgramConfig;
  levels: LoyaltyLevel[];
  members: LoyaltyMember[];
  rewards: LoyaltyReward[];
  rules: LoyaltyRule[];
  campaigns: LoyaltyCampaign[];
  transactions: LoyaltyTransaction[];
  auditLogs: LoyaltyAuditLog[];

  // Dynamic Calculated Statistics
  stats: {
    totalMembers: number;
    totalPointsDistributed: number;
    totalPointsSpent: number;
    totalRewardsRedeemed: number;
    premiumMembersCount: number;
    activityRatePercent: number;
  };

  // Program & Config Actions
  toggleProgramStatus: (active: boolean, adminName: string) => void;
  updateConfig: (newConfig: Partial<LoyaltyProgramConfig>, adminName: string) => void;
  
  // Member & Points Engine Actions
  adjustMemberPoints: (
    memberId: string,
    pointsDelta: number,
    type: 'GAIN' | 'UTILISATION' | 'AJUSTEMENT' | 'BONUS' | 'EXPIRATION' | 'ANNULATION',
    source: any,
    notes: string,
    adminName: string
  ) => { success: boolean; error?: string };

  processOrderPoints: (
    orderId: string,
    customerId: string,
    customerName: string,
    email: string,
    orderTotal: number,
    adminName?: string
  ) => { success: boolean; pointsEarned: number };

  cancelOrderPoints: (
    orderId: string,
    customerId: string,
    orderTotal: number,
    adminName?: string
  ) => { success: boolean; pointsDeducted: number };

  // Rewards Actions
  addReward: (reward: Omit<LoyaltyReward, 'id' | 'totalRedeemedCount' | 'createdAt'>, adminName: string) => LoyaltyReward;
  updateReward: (reward: LoyaltyReward, adminName: string) => void;
  deleteReward: (rewardId: string, adminName: string) => void;
  redeemRewardForMember: (memberId: string, rewardId: string, adminName: string) => { success: boolean; couponCode?: string; error?: string };

  // Levels Actions
  addLevel: (level: Omit<LoyaltyLevel, 'id' | 'membersCount'>, adminName: string) => LoyaltyLevel;
  updateLevel: (level: LoyaltyLevel, adminName: string) => void;
  deleteLevel: (levelId: string, adminName: string) => void;

  // Rules Actions
  toggleRule: (ruleId: string, adminName: string) => void;
  updateRule: (rule: LoyaltyRule, adminName: string) => void;

  // Campaigns Actions
  addCampaign: (campaign: Omit<LoyaltyCampaign, 'id'>, adminName: string) => LoyaltyCampaign;
  updateCampaign: (campaign: LoyaltyCampaign, adminName: string) => void;
  archiveCampaign: (campaignId: string, adminName: string) => void;
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

// INITIAL SEED DATASETS
const INITIAL_CONFIG: LoyaltyProgramConfig = {
  programName: 'PROS CLUB',
  isActive: true,
  currency: 'FCFA',
  pointsPerSpend: 1,
  spendAmountPerPoint: 100, // 1 point per 100 FCFA
  signupBonusPoints: 100,
  firstOrderBonusPoints: 250,
  birthdayBonusPoints: 500,
  referralBonusPoints: 300,
  reviewBonusPoints: 50,
  pointsExpirationEnabled: true,
  expirationMonths: 12,
  minimumPointsToRedeem: 500,
  dailyRedeemLimit: 5000,
  monthlyRedeemLimit: 20000,
  allowStackingWithCoupons: true,
  autoSendNotifications: true,
  lastModifiedAt: '2026-08-18T14:30:00Z',
};

const INITIAL_LEVELS: LoyaltyLevel[] = [
  {
    id: 'LOYALTY-LEVEL-001',
    name: 'BRONZE',
    minPoints: 0,
    maxPoints: 999,
    membersCount: 840,
    perks: ['1 point tous les 100 FCFA d’achat', 'Bonus anniversaire 500 points', 'Accès newsletters membres'],
    badgeColor: 'bg-amber-800 text-amber-100',
    status: 'ACTIVE',
  },
  {
    id: 'LOYALTY-LEVEL-002',
    name: 'SILVER',
    minPoints: 1000,
    maxPoints: 4999,
    membersCount: 321,
    perks: ['Livraison prioritaire à Dakar', 'Bonus points x1.25', 'Accès avant-premières ventes privées'],
    badgeColor: 'bg-slate-400 text-slate-900',
    status: 'ACTIVE',
  },
  {
    id: 'LOYALTY-LEVEL-003',
    name: 'GOLD',
    minPoints: 5000,
    maxPoints: 9999,
    membersCount: 64,
    perks: ['Livraison offerte dès 25 000 FCFA', 'Bonus points x1.5', 'Réductions exclusives 10%', 'Support client prioritaire WhatsApp'],
    badgeColor: 'bg-amber-400 text-amber-950 font-bold',
    status: 'ACTIVE',
  },
  {
    id: 'LOYALTY-LEVEL-004',
    name: 'PLATINUM',
    minPoints: 10000,
    maxPoints: null,
    membersCount: 20,
    perks: ['Livraison toujours gratuite', 'Bonus points x2.0', 'Accès VIP sur-mesure & Conciergerie PROS', 'Invité spécial événements PROS Sénégal'],
    badgeColor: 'bg-pros-black text-pros-gold border border-pros-gold font-bold',
    status: 'ACTIVE',
  },
];

const INITIAL_MEMBERS: LoyaltyMember[] = [];
const INITIAL_CAMPAIGNS: LoyaltyCampaign[] = [];
const INITIAL_TRANSACTIONS: LoyaltyTransaction[] = [];

const INITIAL_REWARDS: LoyaltyReward[] = [
  {
    id: 'LOYALTY-REWARD-0001',
    name: 'Bon de réduction 500 FCFA',
    description: 'Bénéficiez de 500 FCFA de remise immédiate sur votre prochaine commande PROS.',
    type: 'COUPON',
    pointsCost: 500,
    monetaryValue: 500,
    stock: null,
    totalRedeemedCount: 94,
    userLimit: 5,
    allowedLevels: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
    status: 'ACTIVE',
    createdAt: '2026-01-01',
  },
  {
    id: 'LOYALTY-REWARD-0002',
    name: 'Bon de réduction 1 000 FCFA',
    description: 'Remise exceptionnelle de 1 000 FCFA valable sur tout le catalogue PROS.',
    type: 'COUPON',
    pointsCost: 900,
    monetaryValue: 1000,
    stock: null,
    totalRedeemedCount: 52,
    userLimit: 3,
    allowedLevels: ['SILVER', 'GOLD', 'PLATINUM'],
    status: 'ACTIVE',
    createdAt: '2026-01-01',
  },
  {
    id: 'LOYALTY-REWARD-0003',
    name: 'Livraison Gratuite Dakar',
    description: 'Frais de livraison offerts pour toute commande à Dakar et banlieue.',
    type: 'SHIPPING',
    pointsCost: 750,
    monetaryValue: 2000,
    stock: null,
    totalRedeemedCount: 28,
    userLimit: null,
    allowedLevels: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
    status: 'ACTIVE',
    createdAt: '2026-01-01',
  },
  {
    id: 'LOYALTY-REWARD-0004',
    name: 'Bon d’achat 2 500 FCFA',
    description: 'Bon d’achat exclusif réservé aux membres fidèles PROS Club.',
    type: 'COUPON',
    pointsCost: 2000,
    monetaryValue: 2500,
    stock: 50,
    totalRedeemedCount: 12,
    userLimit: 2,
    allowedLevels: ['GOLD', 'PLATINUM'],
    status: 'ACTIVE',
    createdAt: '2026-02-15',
  },
  {
    id: 'LOYALTY-REWARD-0005',
    name: 'Accès Offre VIP Sur-Mesure',
    description: 'Invitation VIP pour séance d’essayage privée à l’Atelier PROS Dakar.',
    type: 'VIP_ACCESS',
    pointsCost: 5000,
    monetaryValue: 10000,
    stock: 10,
    totalRedeemedCount: 0,
    userLimit: 1,
    allowedLevels: ['PLATINUM'],
    status: 'ACTIVE',
    createdAt: '2026-03-01',
  },
];

const INITIAL_RULES: LoyaltyRule[] = [
  {
    id: 'LOYALTY-RULE-001',
    code: 'PURCHASE',
    name: 'Achat sur la boutique',
    description: '1 point accumulé tous les 100 FCFA dépensés lors de vos commandes.',
    pointsAwarded: 1,
    status: 'ACTIVE',
  },
  {
    id: 'LOYALTY-RULE-002',
    code: 'SIGNUP',
    name: 'Inscription au PROS Club',
    description: '100 points de bienvenue offerts à la création de votre compte.',
    pointsAwarded: 100,
    status: 'ACTIVE',
  },
  {
    id: 'LOYALTY-RULE-003',
    code: 'FIRST_ORDER',
    name: 'Première commande',
    description: '250 points bonus accordés lors de votre tout premier achat.',
    pointsAwarded: 250,
    status: 'ACTIVE',
  },
  {
    id: 'LOYALTY-RULE-004',
    code: 'BIRTHDAY',
    name: 'Anniversaire membre',
    description: '500 points cadeaux crédités le jour de votre anniversaire.',
    pointsAwarded: 500,
    status: 'ACTIVE',
  },
  {
    id: 'LOYALTY-RULE-005',
    code: 'REFERRAL',
    name: 'Parrainage d’un proche',
    description: '300 points gagnés lorsqu’un ami parrainé réalise sa première commande.',
    pointsAwarded: 300,
    status: 'ACTIVE',
  },
  {
    id: 'LOYALTY-RULE-006',
    code: 'REVIEW',
    name: 'Avis client produit',
    description: '50 points offerts pour chaque avis certifié laissé sur un produit.',
    pointsAwarded: 50,
    status: 'ACTIVE',
  },
];



const INITIAL_AUDIT_LOGS: LoyaltyAuditLog[] = [
  {
    id: 'LOYALTY-AUDIT-0001',
    adminName: 'Super Admin PROS',
    action: 'AJUSTEMENT_POINTS',
    targetMemberName: 'Moussa Diop',
    valueBefore: '8 200 pts',
    valueAfter: '8 450 pts',
    timestamp: '2026-08-18T14:16:00Z',
    details: 'Ajustement manuel suite à réclamation commande',
  },
  {
    id: 'LOYALTY-AUDIT-0002',
    adminName: 'Super Admin PROS',
    action: 'ACTIVATION_PROGRAMME',
    valueBefore: 'INACTIF',
    valueAfter: 'ACTIF',
    timestamp: '2026-08-01T00:00:00Z',
    details: 'Mise en service officielle du PROS Club V2',
  },
];

export const LoyaltyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<LoyaltyProgramConfig>(() => {
    const saved = localStorage.getItem('pros_loyalty_config_v1');
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });

  const [levels, setLevels] = useState<LoyaltyLevel[]>(() => {
    const saved = localStorage.getItem('pros_loyalty_levels_v1');
    return saved ? JSON.parse(saved) : INITIAL_LEVELS;
  });

  const [members, setMembers] = useState<LoyaltyMember[]>(() => {
    const saved = localStorage.getItem('pros_loyalty_members_v1');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [rewards, setRewards] = useState<LoyaltyReward[]>(() => {
    const saved = localStorage.getItem('pros_loyalty_rewards_v1');
    return saved ? JSON.parse(saved) : INITIAL_REWARDS;
  });

  const [rules, setRules] = useState<LoyaltyRule[]>(() => {
    const saved = localStorage.getItem('pros_loyalty_rules_v1');
    return saved ? JSON.parse(saved) : INITIAL_RULES;
  });

  const [campaigns, setCampaigns] = useState<LoyaltyCampaign[]>(() => {
    const saved = localStorage.getItem('pros_loyalty_campaigns_v1');
    return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS;
  });

  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>(() => {
    const saved = localStorage.getItem('pros_loyalty_txns_v1');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [auditLogs, setAuditLogs] = useState<LoyaltyAuditLog[]>(() => {
    const saved = localStorage.getItem('pros_loyalty_audit_v1');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Dynamic Calculated Statistics (No hardcoded values!)
  const stats = {
    totalMembers: members.length,
    totalPointsDistributed: members.reduce((sum, m) => sum + m.totalEarnedPoints, 0),
    totalPointsSpent: members.reduce((sum, m) => sum + m.totalSpentPoints, 0),
    totalRewardsRedeemed: members.reduce((sum, m) => sum + m.rewardsRedeemedCount, 0),
    premiumMembersCount: members.filter((m) => m.levelName === 'GOLD' || m.levelName === 'PLATINUM').length,
    activityRatePercent:
      members.length > 0 ? Math.round((members.filter((m) => m.status === 'ACTIVE').length / members.length) * 100) : 0,
  };

  // Save to localStorage
  useEffect(() => { localStorage.setItem('pros_loyalty_config_v1', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('pros_loyalty_levels_v1', JSON.stringify(levels)); }, [levels]);
  useEffect(() => { localStorage.setItem('pros_loyalty_members_v1', JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem('pros_loyalty_rewards_v1', JSON.stringify(rewards)); }, [rewards]);
  useEffect(() => { localStorage.setItem('pros_loyalty_rules_v1', JSON.stringify(rules)); }, [rules]);
  useEffect(() => { localStorage.setItem('pros_loyalty_campaigns_v1', JSON.stringify(campaigns)); }, [campaigns]);
  useEffect(() => { localStorage.setItem('pros_loyalty_txns_v1', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('pros_loyalty_audit_v1', JSON.stringify(auditLogs)); }, [auditLogs]);

  // Sync member counts on levels
  useEffect(() => {
    setLevels((prevLevels) =>
      prevLevels.map((lvl) => ({
        ...lvl,
        membersCount: members.filter((m) => m.levelName === lvl.name).length,
      }))
    );
  }, [members]);

  // Helper: Audit Logger
  const logAudit = (adminName: string, action: string, valueBefore: string, valueAfter: string, targetMemberName?: string, details?: string) => {
    const newLog: LoyaltyAuditLog = {
      id: `LOYALTY-AUDIT-${Date.now()}`,
      adminName: adminName || 'Admin PROS',
      action,
      targetMemberName,
      valueBefore,
      valueAfter,
      timestamp: new Date().toISOString(),
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Toggle Program Status
  const toggleProgramStatus = (active: boolean, adminName: string) => {
    const prevStatus = config.isActive ? 'ACTIF' : 'INACTIF';
    const nextStatus = active ? 'ACTIF' : 'INACTIF';
    setConfig((prev) => ({
      ...prev,
      isActive: active,
      lastModifiedAt: new Date().toISOString(),
    }));
    logAudit(adminName, 'MODIFICATION_STATUT_PROGRAMME', prevStatus, nextStatus, undefined, `Programme ${nextStatus}`);
  };

  // Update Config
  const updateConfig = (newConfig: Partial<LoyaltyProgramConfig>, adminName: string) => {
    setConfig((prev) => ({
      ...prev,
      ...newConfig,
      lastModifiedAt: new Date().toISOString(),
    }));
    logAudit(adminName, 'MODIFICATION_PARAMETRES', 'Config précédente', 'Config mise à jour');
  };

  // Member Points Engine
  const adjustMemberPoints = (
    memberId: string,
    pointsDelta: number,
    type: 'GAIN' | 'UTILISATION' | 'AJUSTEMENT' | 'BONUS' | 'EXPIRATION' | 'ANNULATION',
    source: any,
    notes: string,
    adminName: string
  ) => {
    const member = members.find((m) => m.id === memberId || m.customerId === memberId);
    if (!member) return { success: false, error: 'Membre introuvable.' };

    const newAvailable = Math.max(0, member.availablePoints + pointsDelta);
    const earnedDelta = pointsDelta > 0 ? pointsDelta : 0;
    const spentDelta = pointsDelta < 0 ? Math.abs(pointsDelta) : 0;

    const newTotalEarned = member.totalEarnedPoints + earnedDelta;
    const newTotalSpent = member.totalSpentPoints + spentDelta;

    // Automatic Tier Level Recalculation (Bronze -> Silver -> Gold -> Platinum)
    let newLevel = member.levelName;
    if (newTotalEarned >= 10000) newLevel = 'PLATINUM';
    else if (newTotalEarned >= 5000) newLevel = 'GOLD';
    else if (newTotalEarned >= 1000) newLevel = 'SILVER';
    else newLevel = 'BRONZE';

    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? {
              ...m,
              availablePoints: newAvailable,
              totalEarnedPoints: newTotalEarned,
              totalSpentPoints: newTotalSpent,
              levelName: newLevel,
              lastActivityDate: new Date().toISOString().split('T')[0],
            }
          : m
      )
    );

    // Record Transaction
    const newTxn: LoyaltyTransaction = {
      id: `LOYALTY-TXN-${Date.now()}`,
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      type,
      source,
      points: pointsDelta,
      balanceAfter: newAvailable,
      adminName,
      notes,
      timestamp: new Date().toISOString(),
    };
    setTransactions((prev) => [newTxn, ...prev]);

    // Record Audit Entry
    logAudit(
      adminName,
      'AJUSTEMENT_POINTS',
      `${member.availablePoints} pts`,
      `${newAvailable} pts`,
      `${member.firstName} ${member.lastName}`,
      notes || `Ajustement de ${pointsDelta} points`
    );

    return { success: true };
  };

  // Order Points Automatic Processing Engine
  const processOrderPoints = (
    orderId: string,
    customerId: string,
    customerName: string,
    email: string,
    orderTotal: number,
    adminName = 'System Order Engine'
  ) => {
    if (!config.isActive) return { success: false, pointsEarned: 0 };

    const pointsEarned = Math.floor((orderTotal / (config.spendAmountPerPoint || 100)) * (config.pointsPerSpend || 1));
    if (pointsEarned <= 0) return { success: true, pointsEarned: 0 };

    let member = members.find((m) => m.customerId === customerId || m.email.toLowerCase() === email.toLowerCase());

    if (!member) {
      // Auto-enroll new customer in PROS Club
      const [firstName, ...rest] = customerName.split(' ');
      const lastName = rest.join(' ') || 'Client';
      const newM: LoyaltyMember = {
        id: `LOYALTY-MEMBER-${String(members.length + 1).padStart(4, '0')}`,
        customerId,
        firstName,
        lastName,
        email,
        phone: '+221 77 000 00 00',
        levelName: 'BRONZE',
        availablePoints: pointsEarned,
        totalEarnedPoints: pointsEarned,
        totalSpentPoints: 0,
        rewardsRedeemedCount: 0,
        joinedAt: new Date().toISOString().split('T')[0],
        lastActivityDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
      };
      setMembers((prev) => [...prev, newM]);
      member = newM;
    } else {
      adjustMemberPoints(
        member.id,
        pointsEarned,
        'GAIN',
        'COMMANDE',
        `Commande #${orderId} (${orderTotal.toLocaleString('fr-FR')} FCFA)`,
        adminName
      );
    }

    return { success: true, pointsEarned };
  };

  // Cancel Order Points (Order refund/cancellation)
  const cancelOrderPoints = (
    orderId: string,
    customerId: string,
    orderTotal: number,
    adminName = 'System Order Engine'
  ) => {
    const pointsDeducted = Math.floor((orderTotal / (config.spendAmountPerPoint || 100)) * (config.pointsPerSpend || 1));
    if (pointsDeducted <= 0) return { success: true, pointsDeducted: 0 };

    const member = members.find((m) => m.customerId === customerId || m.id === customerId);
    if (member) {
      adjustMemberPoints(
        member.id,
        -pointsDeducted,
        'ANNULATION',
        'COMMANDE',
        `Annulation commande #${orderId}`,
        adminName
      );
    }
    return { success: true, pointsDeducted };
  };

  // Add Reward
  const addReward = (rewardData: Omit<LoyaltyReward, 'id' | 'totalRedeemedCount' | 'createdAt'>, adminName: string) => {
    const newReward: LoyaltyReward = {
      ...rewardData,
      id: `LOYALTY-REWARD-${String(rewards.length + 1).padStart(4, '0')}`,
      totalRedeemedCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setRewards((prev) => [newReward, ...prev]);
    logAudit(adminName, 'CREATION_RECOMPENSE', '—', newReward.name, undefined, `Récompense ${newReward.id} créée`);
    return newReward;
  };

  // Update Reward
  const updateReward = (reward: LoyaltyReward, adminName: string) => {
    setRewards((prev) => prev.map((r) => (r.id === reward.id ? reward : r)));
    logAudit(adminName, 'MODIFICATION_RECOMPENSE', reward.id, reward.name);
  };

  // Delete Reward
  const deleteReward = (rewardId: string, adminName: string) => {
    const r = rewards.find((item) => item.id === rewardId);
    setRewards((prev) => prev.filter((item) => item.id !== rewardId));
    logAudit(adminName, 'SUPPRESSION_RECOMPENSE', r?.name || rewardId, 'SUPPRIMÉ');
  };

  // Redeem Reward for Member
  const redeemRewardForMember = (memberId: string, rewardId: string, adminName: string) => {
    const member = members.find((m) => m.id === memberId);
    const reward = rewards.find((r) => r.id === rewardId);

    if (!member) return { success: false, error: 'Membre introuvable.' };
    if (!reward) return { success: false, error: 'Récompense introuvable.' };
    if (member.availablePoints < reward.pointsCost) {
      return { success: false, error: `Points insuffisants (${member.availablePoints} / ${reward.pointsCost} requis).` };
    }
    if (reward.stock !== null && reward.stock <= 0) {
      return { success: false, error: 'Récompense en rupture de stock.' };
    }

    // Deduct points
    adjustMemberPoints(
      memberId,
      -reward.pointsCost,
      'UTILISATION',
      'RECOMPENSE',
      `Échange de la récompense: ${reward.name}`,
      adminName
    );

    // Update reward count and stock
    setRewards((prev) =>
      prev.map((r) =>
        r.id === rewardId
          ? {
              ...r,
              totalRedeemedCount: r.totalRedeemedCount + 1,
              stock: r.stock !== null ? Math.max(0, r.stock - 1) : null,
            }
          : r
      )
    );

    // Increment member redeemed count
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, rewardsRedeemedCount: m.rewardsRedeemedCount + 1 } : m))
    );

    // Generate unique coupon code
    const couponCode = `PROSCLUB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const generatedCoupons = JSON.parse(localStorage.getItem('pros_reward_coupons_v1') || '[]');
    generatedCoupons.push({
      code: couponCode,
      rewardName: reward.name,
      value: reward.monetaryValue,
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('pros_reward_coupons_v1', JSON.stringify(generatedCoupons));

    logAudit(adminName, 'ECHANGE_RECOMPENSE', reward.name, couponCode, `${member.firstName} ${member.lastName}`);

    return { success: true, couponCode };
  };

  // Add Level
  const addLevel = (levelData: Omit<LoyaltyLevel, 'id' | 'membersCount'>, adminName: string) => {
    const newLevel: LoyaltyLevel = {
      ...levelData,
      id: `LOYALTY-LEVEL-${String(levels.length + 1).padStart(3, '0')}`,
      membersCount: 0,
    };
    setLevels((prev) => [...prev, newLevel]);
    logAudit(adminName, 'CREATION_NIVEAU', '—', newLevel.name);
    return newLevel;
  };

  // Update Level
  const updateLevel = (level: LoyaltyLevel, adminName: string) => {
    setLevels((prev) => prev.map((l) => (l.id === level.id ? level : l)));
    logAudit(adminName, 'MODIFICATION_NIVEAU', level.id, level.name);
  };

  // Delete Level
  const deleteLevel = (levelId: string, adminName: string) => {
    const l = levels.find((item) => item.id === levelId);
    setLevels((prev) => prev.filter((item) => item.id !== levelId));
    logAudit(adminName, 'SUPPRESSION_NIVEAU', l?.name || levelId, 'SUPPRIMÉ');
  };

  // Toggle Rule
  const toggleRule = (ruleId: string, adminName: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === ruleId) {
          const nextStatus = r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          logAudit(adminName, 'TOGGLE_REGLE', r.status, nextStatus, undefined, `Règle ${r.name}`);
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  };

  // Update Rule
  const updateRule = (rule: LoyaltyRule, adminName: string) => {
    setRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
    logAudit(adminName, 'MODIFICATION_REGLE', rule.id, rule.name);
  };

  // Add Campaign
  const addCampaign = (campaignData: Omit<LoyaltyCampaign, 'id'>, adminName: string) => {
    const newCamp: LoyaltyCampaign = {
      ...campaignData,
      id: `LOYALTY-CAMP-${String(campaigns.length + 1).padStart(3, '0')}`,
    };
    setCampaigns((prev) => [newCamp, ...prev]);
    logAudit(adminName, 'CREATION_CAMPAGNE', '—', newCamp.name);
    return newCamp;
  };

  // Update Campaign
  const updateCampaign = (campaign: LoyaltyCampaign, adminName: string) => {
    setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? campaign : c)));
    logAudit(adminName, 'MODIFICATION_CAMPAGNE', campaign.id, campaign.name);
  };

  // Archive Campaign
  const archiveCampaign = (campaignId: string, adminName: string) => {
    setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? { ...c, status: 'ARCHIVED' } : c)));
    logAudit(adminName, 'ARCHIVAGE_CAMPAGNE', campaignId, 'ARCHIVÉ');
  };

  return (
    <LoyaltyContext.Provider
      value={{
        config,
        levels,
        members,
        rewards,
        rules,
        campaigns,
        transactions,
        auditLogs,
        stats,
        toggleProgramStatus,
        updateConfig,
        adjustMemberPoints,
        processOrderPoints,
        cancelOrderPoints,
        addReward,
        updateReward,
        deleteReward,
        redeemRewardForMember,
        addLevel,
        updateLevel,
        deleteLevel,
        toggleRule,
        updateRule,
        addCampaign,
        updateCampaign,
        archiveCampaign,
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
};

export const useLoyalty = () => {
  const context = useContext(LoyaltyContext);
  if (!context) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return context;
};
