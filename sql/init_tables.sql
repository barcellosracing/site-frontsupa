-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco NUMERIC NOT NULL,
    imagem TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Tabela de serviços
CREATE TABLE IF NOT EXISTS servicos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Tabela de orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id),
    produtos JSONB,
    servicos JSONB,
    status VARCHAR(50) DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT now()
);

-- Tabela de investimentos/despesas
CREATE TABLE IF NOT EXISTS investimentos (
    id SERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    data TIMESTAMP DEFAULT now()
);
