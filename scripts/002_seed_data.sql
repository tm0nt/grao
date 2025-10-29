-- GRÃO Platform - Seed Data
-- Initial data for development and testing

-- ============================================
-- SEED INVESTMENT PLANS
-- ============================================
INSERT INTO investment_plans (
  name, category, description, location, min_investment, 
  daily_return_rate, monthly_return_rate, duration_months, 
  risk_level, features, rewards, is_new
) VALUES
(
  'Residencial Alto Padrão SP',
  'Residencial',
  'Empreendimento residencial de alto padrão localizado em área nobre de São Paulo.',
  'São Paulo, SP',
  1000.00,
  0.0004,
  0.012,
  12,
  'Moderado',
  '["Área de lazer completa", "Segurança 24h", "Localização privilegiada"]'::jsonb,
  '["Cashback 2%", "Bônus indicação"]'::jsonb,
  true
),
(
  'Comercial Prime Centro',
  'Comercial',
  'Complexo comercial premium no centro financeiro do Rio de Janeiro.',
  'Rio de Janeiro, RJ',
  5000.00,
  0.0006,
  0.018,
  18,
  'Alto',
  '["Alto fluxo de pessoas", "Infraestrutura moderna", "Valorização garantida"]'::jsonb,
  '["Cashback 3%", "Prioridade novos lançamentos"]'::jsonb,
  true
),
(
  'Loteamento Urbano',
  'Terrenos',
  'Loteamento urbano em região de expansão com infraestrutura completa.',
  'Curitiba, PR',
  500.00,
  0.0003,
  0.009,
  24,
  'Baixo',
  '["Documentação regularizada", "Infraestrutura pronta", "Baixo risco"]'::jsonb,
  '["Cashback 1.5%"]'::jsonb,
  false
),
(
  'Condomínio Logístico',
  'Industrial',
  'Condomínio logístico estrategicamente localizado próximo a rodovias principais.',
  'Campinas, SP',
  10000.00,
  0.0008,
  0.024,
  12,
  'Alto',
  '["Localização estratégica", "Contratos de longo prazo", "Alta rentabilidade"]'::jsonb,
  '["Cashback 5%", "Bônus indicação", "Relatórios exclusivos"]'::jsonb,
  false
);

-- ============================================
-- SEED AWARDS/PRIZES
-- ============================================
INSERT INTO awards (
  name, description, required_investment, award_type, image_url
) VALUES
(
  'Viagem para Dubai',
  'Pacote completo de 7 dias em Dubai com hospedagem 5 estrelas e passeios inclusos',
  100000.00,
  'travel',
  '/placeholder.svg?height=200&width=300'
),
(
  'Cruzeiro pelo Caribe',
  'Cruzeiro de luxo de 10 dias pelo Caribe com todas as refeições incluídas',
  75000.00,
  'travel',
  '/placeholder.svg?height=200&width=300'
),
(
  'Viagem para Paris',
  'Pacote romântico de 5 dias em Paris com hospedagem boutique e tours gastronômicos',
  50000.00,
  'travel',
  '/placeholder.svg?height=200&width=300'
),
(
  'Cashback Premium 10%',
  'Receba 10% de cashback em todos os seus investimentos por 6 meses',
  30000.00,
  'cashback',
  '/placeholder.svg?height=200&width=300'
),
(
  'Bônus de R$ 5.000',
  'Bônus direto de R$ 5.000 creditado na sua carteira',
  25000.00,
  'bonus',
  '/placeholder.svg?height=200&width=300'
);

-- ============================================
-- CREATE DEMO USER (for testing)
-- ============================================
-- Password: Demo@123 (hashed with bcrypt)
INSERT INTO users (
  email, password_hash, name, cpf, phone, 
  balance, referral_code, kyc_status
) VALUES
(
  'demo@grao.com',
  '$2a$10$rKZLvXZnJQQJ5K5K5K5K5uO5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K',
  'Usuário Demo',
  '123.456.789-00',
  '(11) 99999-9999',
  50000.00,
  'DEMO2024',
  'approved'
);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE users IS 'Stores user account information including authentication, balance, and KYC status';
COMMENT ON TABLE kyc_documents IS 'Stores KYC verification documents uploaded by users';
COMMENT ON TABLE investment_plans IS 'Available investment opportunities with returns and risk levels';
COMMENT ON TABLE user_investments IS 'User investments in specific plans with tracking of returns';
COMMENT ON TABLE transactions IS 'All financial transactions including deposits, withdrawals, and returns';
COMMENT ON TABLE investment_returns IS 'Dividend/return payments made to investors';
COMMENT ON TABLE referrals IS 'Multi-level referral relationships between users';
COMMENT ON TABLE referral_commissions IS 'Commission payments for referrals';
COMMENT ON TABLE awards IS 'Available prizes and awards for high-value investors';
COMMENT ON TABLE user_awards IS 'Awards earned by users';
COMMENT ON TABLE notifications IS 'User notifications for various platform events';
COMMENT ON TABLE audit_logs IS 'Audit trail of all important actions in the platform';
