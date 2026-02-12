-- VPN Nexus Panel - PostgreSQL Schema v2.0
-- This schema is generated based on the definitions in `types.ts`.
-- It includes tables for users, clients, servers, finance, store, affiliates, and more.

-- Drop existing tables in reverse order of dependency to avoid foreign key errors.
-- This is useful for development and resetting the database.
DROP TABLE IF EXISTS commission_logs CASCADE;
DROP TABLE IF EXISTS affiliate_relationships CASCADE;
DROP TABLE IF EXISTS whatsapp_instances CASCADE;
DROP TABLE IF EXISTS reseller_sales CASCADE;
DROP TABLE IF EXISTS app_payloads CASCADE;
DROP TABLE IF EXISTS app_proxies CASCADE;
DROP TABLE IF EXISTS remarketing_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS withdrawal_requests CASCADE;
DROP TABLE IF EXISTS recharge_requests CASCADE;
DROP TABLE IF EXISTS gateways CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS servers CASCADE;
DROP TABLE IF EXISTS reseller_applications CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS financial_config CASCADE;
DROP TABLE IF EXISTS affiliate_config CASCADE;
DROP TABLE IF EXISTS chatbot_config CASCADE;
DROP TABLE IF EXISTS app_config CASCADE;


-- Tabela de Usuários (Admins e Revendedores)
-- Merges User and Reseller interfaces from types.ts
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'reseller')),
    category VARCHAR(50) DEFAULT 'BASIC', -- 'PREMIUM', 'BASIC'
    expiration TIMESTAMP WITH TIME ZONE,
    avatar TEXT,
    whatsapp VARCHAR(20),
    credits INTEGER DEFAULT 0,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    pix_key VARCHAR(255),
    pix_key_type VARCHAR(20) CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
    can_use_n8n BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Solicitações de Revenda
CREATE TABLE reseller_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    experience TEXT,
    referrer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Servidores
CREATE TABLE servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    flag VARCHAR(10),
    ip VARCHAR(45) NOT NULL,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'maintenance')),
    ssh_user VARCHAR(50),
    ssh_password_encrypted TEXT, -- Store encrypted
    ssh_port INTEGER DEFAULT 22,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Clientes VPN
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES users(id) ON DELETE SET NULL,
    login VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plan_name VARCHAR(100),
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'blocked', 'suspended', 'test')),
    is_v2ray BOOLEAN DEFAULT FALSE,
    uuid VARCHAR(100),
    whatsapp VARCHAR(20),
    email VARCHAR(100),
    last_online TIMESTAMP WITH TIME ZONE,
    connection_limit INTEGER DEFAULT 1,
    renewal_streak INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Logs de Atividade
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(50),
    action VARCHAR(100),
    message TEXT,
    success BOOLEAN DEFAULT TRUE,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Planos
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    duration_days INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(5) DEFAULT 'BRL',
    max_connections INTEGER DEFAULT 1,
    type VARCHAR(20) NOT NULL CHECK (type IN ('client', 'reseller', 'test')),
    credits_generated INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- MÓDULO FINANCEIRO
CREATE TABLE gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('mercadopago', 'stone', 'stripe', 'pix_manual')),
    public_key_encrypted TEXT,
    secret_key_encrypted TEXT,
    is_active BOOLEAN DEFAULT FALSE
);

CREATE TABLE recharge_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    credits INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    proof_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    pix_key_type VARCHAR(20) NOT NULL,
    pix_key VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percent', 'fixed')),
    value DECIMAL(10, 2) NOT NULL,
    usage_limit INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- MÓDULO LOJA
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id VARCHAR(36) NOT NULL, -- 'admin' or UUID of user
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    gallery TEXT[], -- PostgreSQL array of TEXT
    is_active BOOLEAN DEFAULT TRUE,
    category VARCHAR(50),
    sales_count INTEGER DEFAULT 0,
    variations JSONB, -- For ProductVariant
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(50),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transações Financeiras Gerais
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    fee DECIMAL(10, 2) DEFAULT 0.00,
    gateway VARCHAR(50),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'withdrawn')),
    type VARCHAR(30) NOT NULL CHECK (type IN ('credit_purchase', 'store_sale', 'withdrawal')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MÓDULO NOTIFICAÇÕES
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(20) CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MÓDULO REMARKETING
CREATE TABLE remarketing_logs (
    id BIGSERIAL PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    event VARCHAR(20) NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'whatsapp')),
    status VARCHAR(20) CHECK (status IN ('sent', 'failed')),
    message_preview TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MÓDULO APLICATIVO
CREATE TABLE app_proxies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    ip VARCHAR(100) NOT NULL,
    port INTEGER NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'online'
);

CREATE TABLE app_payloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    operator VARCHAR(20),
    type VARCHAR(20),
    payload TEXT,
    proxy_id UUID REFERENCES app_proxies(id) ON DELETE SET NULL,
    proxy_string VARCHAR(255),
    proxy_port INTEGER,
    sni VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    color VARCHAR(20)
);

-- MÓDULO CHECKOUT REVENDEDOR
CREATE TABLE reseller_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id VARCHAR(50) UNIQUE NOT NULL,
    reseller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    operator VARCHAR(20),
    plan_name VARCHAR(100),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    pix_key TEXT,
    pix_key_type VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MÓDULO WHATSAPP
CREATE TABLE whatsapp_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    instance_id VARCHAR(100) UNIQUE,
    api_token_encrypted TEXT,
    api_url TEXT,
    status VARCHAR(20) DEFAULT 'DISCONNECTED',
    priority INTEGER DEFAULT 10,
    is_default BOOLEAN DEFAULT FALSE,
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MÓDULO SUB-REVENDA
CREATE TABLE affiliate_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE commission_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    beneficiary_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) CHECK (currency IN ('credits', 'balance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- TABELAS DE CONFIGURAÇÃO (SINGLE ROW)

-- Configurações visuais e gerais do sistema
CREATE TABLE system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    app_name VARCHAR(100) DEFAULT 'VPN Nexus Panel',
    logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(10) DEFAULT '#8b5cf6',
    secondary_color VARCHAR(10) DEFAULT '#6366f1',
    background_color VARCHAR(10) DEFAULT '#0a0a0f',
    card_color VARCHAR(10) DEFAULT '#11111e',
    text_color VARCHAR(10) DEFAULT '#fafafc',
    sidebar_text_color VARCHAR(10) DEFAULT '#9ca3af',
    n8n_webhook_url TEXT,
    store_config JSONB, -- For StoreConfig
    remarketing_config JSONB, -- For RemarketingConfig (non-sensitive parts)
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- Configurações financeiras globais
CREATE TABLE financial_config (
    id INT PRIMARY KEY DEFAULT 1,
    credit_price DECIMAL(10, 2) DEFAULT 5.00,
    min_recharge_amount DECIMAL(10, 2) DEFAULT 10.00,
    admin_store_fee_percent DECIMAL(5, 2) DEFAULT 10.00,
    loyalty_program_config JSONB,
    pix_config JSONB, -- For PixConfig (admin's pix)
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- Configurações de Afiliação
CREATE TABLE affiliate_config (
    id INT PRIMARY KEY DEFAULT 1,
    enabled BOOLEAN DEFAULT FALSE,
    levels INTEGER DEFAULT 2,
    commission_type VARCHAR(10) DEFAULT 'credits',
    level_percentage TEXT[], -- Array of percentages as strings
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- Configurações do Chatbot
CREATE TABLE chatbot_config (
    id INT PRIMARY KEY DEFAULT 1,
    config JSONB,
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- Configurações do App
CREATE TABLE app_config (
    id INT PRIMARY KEY DEFAULT 1,
    update_url TEXT,
    update_message TEXT,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    version_code INTEGER DEFAULT 1,
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- Seed Initial Data
INSERT INTO users (username, password_hash, role, credits, status)
VALUES ('admin', '$2b$10$YOUR_DEFAULT_HASH_HERE', 'admin', 9999, 'active')
ON CONFLICT (username) DO NOTHING;

-- Insert default single-row configs
INSERT INTO system_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
INSERT INTO financial_config (id) VALUES (1) ON CONFLICT DO NOTHING;
INSERT INTO affiliate_config (id) VALUES (1) ON CONFLICT DO NOTHING;
INSERT INTO chatbot_config (id) VALUES (1) ON CONFLICT DO NOTHING;
INSERT INTO app_config (id) VALUES (1) ON CONFLICT DO NOTHING;
