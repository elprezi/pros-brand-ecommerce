export type LoyaltyMemberStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type LoyaltyLevelName = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export type LoyaltyTransactionType = 
  | 'GAIN' 
  | 'UTILISATION' 
  | 'EXPIRATION' 
  | 'AJUSTEMENT' 
  | 'BONUS' 
  | 'ANNULATION';

export type LoyaltyTransactionSource = 
  | 'COMMANDE' 
  | 'INSCRIPTION' 
  | 'PREMIERE_COMMANDE' 
  | 'ANNIVERSAIRE' 
  | 'PARRAINAGE' 
  | 'AVIS_CLIENT' 
  | 'RECOMPENSE' 
  | 'ADMIN_ADJUSTMENT' 
  | 'CAMPAGNE_BONUS';

export type LoyaltyRewardStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

export type LoyaltyCampaignStatus = 'ACTIVE' | 'SCHEDULED' | 'ENDED' | 'ARCHIVED';

export interface LoyaltyProgramConfig {
  programName: string; // 'PROS CLUB'
  isActive: boolean;
  currency: string; // 'FCFA'
  pointsPerSpend: number; // 1 point per 100 FCFA -> spendRatio = 100
  spendAmountPerPoint: number; // 100
  signupBonusPoints: number; // 100
  firstOrderBonusPoints: number; // 250
  birthdayBonusPoints: number; // 500
  referralBonusPoints: number; // 300
  reviewBonusPoints: number; // 50
  pointsExpirationEnabled: boolean;
  expirationMonths: number; // 12
  minimumPointsToRedeem: number; // 500
  dailyRedeemLimit: number; // 5000
  monthlyRedeemLimit: number; // 20000
  allowStackingWithCoupons: boolean;
  autoSendNotifications: boolean;
  lastModifiedAt: string;
}

export interface LoyaltyLevel {
  id: string; // 'LOYALTY-LEVEL-001'
  name: LoyaltyLevelName;
  minPoints: number;
  maxPoints: number | null; // null for highest level
  membersCount: number;
  perks: string[];
  badgeColor: string; // Tailwind color class or hex
  status: 'ACTIVE' | 'INACTIVE';
}

export interface LoyaltyMember {
  id: string; // 'LOYALTY-MEMBER-0001'
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  levelName: LoyaltyLevelName;
  availablePoints: number;
  totalEarnedPoints: number;
  totalSpentPoints: number;
  rewardsRedeemedCount: number;
  joinedAt: string;
  lastActivityDate: string;
  status: LoyaltyMemberStatus;
}

export interface LoyaltyReward {
  id: string; // 'LOYALTY-REWARD-0001'
  name: string; // 'Bon de réduction 500 FCFA'
  description: string;
  imageUrl?: string;
  type: 'COUPON' | 'SHIPPING' | 'GIFT' | 'VIP_ACCESS';
  pointsCost: number; // 500
  monetaryValue: number; // 500 FCFA
  stock: number | null; // null = unlimited
  totalRedeemedCount: number;
  userLimit: number | null; // limit per customer
  allowedLevels: LoyaltyLevelName[];
  startDate?: string;
  endDate?: string;
  status: LoyaltyRewardStatus;
  createdAt: string;
}

export interface LoyaltyRule {
  id: string; // 'LOYALTY-RULE-001'
  code: string;
  name: string; // 'Points sur achats'
  description: string;
  pointsAwarded: number;
  pointsMultiplier?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface LoyaltyCampaign {
  id: string; // 'LOYALTY-CAMP-001'
  name: string; // 'Double Points Week-end'
  description: string;
  multiplier: number; // 2x
  bonusPoints: number;
  startDate: string;
  endDate: string;
  status: LoyaltyCampaignStatus;
  targetLevels: LoyaltyLevelName[];
}

export interface LoyaltyTransaction {
  id: string; // 'LOYALTY-TXN-0001'
  memberId: string;
  memberName: string;
  type: LoyaltyTransactionType;
  source: LoyaltyTransactionSource;
  points: number; // positive for GAIN/BONUS, negative for UTILISATION
  balanceAfter: number;
  adminName?: string;
  notes?: string;
  timestamp: string;
}

export interface LoyaltyAuditLog {
  id: string; // 'LOYALTY-AUDIT-0001'
  adminName: string;
  action: string; // 'AJUSTEMENT_POINTS', 'MODIFICATION_CONFIG', etc.
  targetMemberName?: string;
  valueBefore: string;
  valueAfter: string;
  timestamp: string;
  details?: string;
}
