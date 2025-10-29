export interface User {
  name: string
  email: string
  cpf?: string
  avatar?: string
}

export interface InvestmentPlan {
  id: string
  name: string
  location: string
  minInvestment: number
  monthlyReturn: number
  duration: number
  risk: "Baixo" | "Moderado" | "Alto"
  category: string
  image: string
  features: string[]
  description: string
}

export interface Investment {
  id: string
  planName: string
  amount: number
  date: string
  monthlyReturn: number
  totalReturn: number
  status: "active" | "completed" | "pending"
}

export interface Transaction {
  id: string
  type: "deposit" | "withdraw" | "investment" | "return"
  amount: number
  date: string
  status: "completed" | "pending" | "failed"
  description: string
}

export type PixKeyType = "email" | "phone" | "cpf" | "random"

export type DocumentType = "rg" | "cnh" | "passport"

export interface DatabaseUser extends User {
  id: string
  passwordHash: string
  balance: number
  totalInvested: number
  totalReturns: number
  kycStatus: "not_started" | "pending" | "approved" | "rejected"
  kycVerifiedAt?: Date
  isActive: boolean
  referralCode: string
  referredByUserId?: string
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

export interface KYCDocument {
  id: string
  userId: string
  documentType: DocumentType
  documentSide?: "front" | "back" | "single"
  fileUrl: string
  fileType?: string
  status: "pending" | "approved" | "rejected" | "not_uploaded"
  rejectionReason?: string
  uploadedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
}

export interface DatabaseInvestmentPlan extends InvestmentPlan {
  dailyReturnRate: number
  monthlyReturnRate: number
  riskLevel: "Baixo" | "Moderado" | "Alto"
  imageUrl?: string
  isActive: boolean
  isNew: boolean
  totalInvested: number
  maxInvestmentLimit?: number
  createdAt: Date
  updatedAt: Date
}

export interface DatabaseInvestment extends Investment {
  userId: string
  planId: string
  startDate: Date
  endDate?: Date
  lastReturnDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface DatabaseTransaction extends Transaction {
  userId: string
  investmentId?: string
  paymentMethod?: string
  pixKey?: string
  pixKeyType?: PixKeyType
  externalTransactionId?: string
  metadata?: Record<string, any>
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Referral {
  id: string
  referrerUserId: string
  referredUserId: string
  level: 1 | 2 | 3
  commissionRate: number
  totalEarned: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ReferralCommission {
  id: string
  referralId: string
  transactionId: string
  referrerUserId: string
  referredUserId: string
  investmentAmount: number
  commissionAmount: number
  commissionRate: number
  level: number
  status: "pending" | "paid" | "cancelled"
  paidAt?: Date
  createdAt: Date
}

export interface Award {
  id: string
  name: string
  description: string
  imageUrl?: string
  requiredInvestment: number
  awardType: "travel" | "cashback" | "bonus" | "physical_item"
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserAward {
  id: string
  userId: string
  awardId: string
  earnedAt: Date
  claimedAt?: Date
  status: "earned" | "claimed" | "expired"
  createdAt: Date
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "investment" | "return" | "withdrawal" | "kyc" | "referral" | "award" | "system"
  isRead: boolean
  metadata?: Record<string, any>
  createdAt: Date
}
