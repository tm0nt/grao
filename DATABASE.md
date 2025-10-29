# GRÃO Platform - Database Documentation

## Overview
This document describes the complete database schema for the GRÃO real estate investment platform.

## Database Structure

### Core Tables

#### `users`
Stores user account information including authentication, balance, and KYC status.

**Key Fields:**
- `id`: Unique user identifier (UUID)
- `email`: User email (unique, required)
- `password_hash`: Bcrypt hashed password
- `cpf`: Brazilian tax ID (unique)
- `balance`: Current wallet balance
- `total_invested`: Total amount invested
- `kyc_status`: KYC verification status
- `referral_code`: Unique referral code for affiliate program

#### `kyc_documents`
Stores KYC verification documents uploaded by users.

**Document Types:**
- `rg`: Brazilian ID card (front and back)
- `cnh`: Driver's license (front and back)
- `passport`: Passport (single document)

**Status Flow:**
1. `not_uploaded` → User hasn't uploaded yet
2. `pending` → Document uploaded, awaiting review
3. `approved` → Document verified and approved
4. `rejected` → Document rejected (with reason)

#### `investment_plans`
Available investment opportunities with returns and risk levels.

**Categories:**
- Residencial
- Comercial
- Terrenos
- Industrial

**Risk Levels:**
- Baixo (Low)
- Moderado (Moderate)
- Alto (High)

#### `user_investments`
Tracks user investments in specific plans.

**Status:**
- `pending`: Investment being processed
- `active`: Currently active investment
- `completed`: Investment period completed
- `cancelled`: Investment cancelled

#### `transactions`
All financial transactions in the platform.

**Transaction Types:**
- `deposit`: Money added to wallet
- `withdraw`: Money withdrawn from wallet
- `investment`: Money invested in a plan
- `return`: Investment returns/dividends
- `referral_bonus`: Commission from referrals
- `cashback`: Cashback rewards

#### `referrals`
Multi-level referral system (3 levels).

**Commission Rates:**
- Level 1 (Direct): 5%
- Level 2 (Indirect): 3%
- Level 3 (Third level): 1%

#### `awards`
Prizes and rewards for high-value investors.

**Award Types:**
- `travel`: Travel packages (Dubai, Caribbean, Paris)
- `cashback`: Cashback bonuses
- `bonus`: Direct cash bonuses
- `physical_item`: Physical prizes

## Relationships

\`\`\`
users
  ├── kyc_documents (1:N)
  ├── user_investments (1:N)
  ├── transactions (1:N)
  ├── referrals (1:N as referrer)
  ├── referrals (1:N as referred)
  ├── user_awards (1:N)
  └── notifications (1:N)

investment_plans
  └── user_investments (1:N)

user_investments
  ├── transactions (1:N)
  └── investment_returns (1:N)

referrals
  └── referral_commissions (1:N)
\`\`\`

## Indexes

All tables have appropriate indexes for:
- Primary keys (UUID)
- Foreign keys
- Frequently queried fields (email, cpf, status fields)
- Date fields for sorting

## Triggers

Automatic `updated_at` timestamp updates on:
- users
- investment_plans
- user_investments
- transactions
- referrals
- awards

## Security Considerations

1. **Password Storage**: Always use bcrypt with salt rounds ≥ 10
2. **CPF Validation**: Validate CPF format before insertion
3. **Balance Checks**: Always verify sufficient balance before transactions
4. **KYC Enforcement**: Check KYC status before allowing withdrawals
5. **Audit Logging**: All sensitive operations logged in `audit_logs`

## Running the Schema

\`\`\`bash
# Create schema
psql -U your_user -d your_database -f scripts/001_create_schema.sql

# Seed initial data
psql -U your_user -d your_database -f scripts/002_seed_data.sql
\`\`\`

## Demo Account

For testing purposes, a demo account is created:
- **Email**: demo@grao.com
- **Password**: Demo@123
- **Balance**: R$ 50,000.00
- **KYC Status**: Approved

## Future Enhancements

- Add support for multiple currencies
- Implement automatic dividend distribution
- Add support for fractional investments
- Create investment portfolio analytics
- Add support for investment groups/pools
