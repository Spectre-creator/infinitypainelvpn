# 🚀 VPN Nexus Panel - Guia de Deploy com Docker

Este é o manual completo para instalar o painel VPN Nexus em uma VPS usando Docker e Docker Compose, o método recomendado para produção.

---

## 📋 Pré-requisitos

1.  **VPS Linux:** Qualquer distribuição moderna (Ubuntu 22.04, Debian 11, etc.).
2.  **Docker e Docker Compose:** Instalados na VPS. [Guia Oficial do Docker](https://docs.docker.com/engine/install/ubuntu/).
3.  **Domínio:** Um domínio apontado para o IP da sua VPS (ex: `painel.seudominio.com`).
4.  **Acesso Root/Sudo:** Acesso SSH ao terminal da VPS.

---

## 🏗️ Passo 1: Preparação do Projeto

Primeiro, clone ou envie os arquivos do projeto para sua VPS.

```bash
# Instale o Git se ainda não tiver
sudo apt update && sudo apt install -y git

# Clone o seu repositório
git clone https://github.com/seu-usuario/vpn-nexus.git

# Entre na pasta do projeto
cd vpn-nexus
```

---

## ⚙️ Passo 2: Configuração do Ambiente

O coração do seu painel está no arquivo de variáveis de ambiente do backend.

```bash
# 1. Navegue até a pasta do backend
cd backend

# 2. Crie o arquivo .env a partir do exemplo (se houver) ou crie um novo
# Copie e cole o conteúdo abaixo no novo arquivo
nano .env
```

**Cole o seguinte conteúdo no arquivo `.env`**, substituindo os valores de exemplo pelas suas credenciais reais:

```ini
# --- CONFIGURAÇÃO DE PRODUÇÃO ---
# Desativa o modo de simulação para usar o banco de dados e SSH reais.
MOCK_MODE=false
NODE_ENV=production

# --- BANCO DE DADOS (PostgreSQL) ---
# Estas credenciais DEVEM ser as mesmas definidas no docker-compose.yml
DB_HOST=postgres
DB_PORT=5432
DB_USER=vpn_user
DB_PASS=YOUR_STRONG_POSTGRES_PASSWORD # <-- TROQUE PELA SENHA DO BANCO
DB_NAME=vpn_nexus

# --- CONEXÃO SSH (Para criar contas na VPS de conexão) ---
# Se o painel estiver na mesma VPS que vai gerar as contas SSH:
VPS_HOST=127.0.0.1
VPS_PORT=22
VPS_USER=root
VPS_PASSWORD=YOUR_VPS_ROOT_PASSWORD # <-- TROQUE PELA SENHA ROOT DA SUA VPS

# --- SEGURANÇA (OBRIGATÓRIO) ---
# Gere uma string aleatória longa e segura para este campo.
JWT_SECRET=YOUR_RANDOM_JWT_SECRET_KEY_HERE # <-- TROQUE POR UMA CHAVE SECRETA

# --- API GOOGLE (Opcional, para Chatbot IA) ---
GEMINI_API_KEY=
```

**Salve o arquivo** (`Ctrl+O`, `Enter`) e saia (`Ctrl+X`).

**Volte para a raiz do projeto:**
```bash
cd ..
```

---

## 🌐 Passo 3: Configurar Nginx e Domínio

Edite o arquivo de configuração do Nginx para usar o seu domínio.

```bash
nano nginx/nginx.conf
```

Encontre a linha `server_name seu-dominio.com;` e **substitua `seu-dominio.com` pelo seu domínio real**. Salve e saia.

---

## 🚀 Passo 4: Subir os Contêineres

Com tudo configurado, o Docker Compose irá orquestrar a construção e execução de todos os serviços.

```bash
# Construir as imagens e iniciar os serviços em background (-d)
sudo docker-compose up --build -d
```

O processo pode levar alguns minutos na primeira vez. Ele irá:
1.  Criar a rede interna.
2.  Iniciar o banco de dados PostgreSQL.
3.  Construir a imagem da sua API backend.
4.  Construir a imagem do seu frontend (compilando o React) e servi-lo com Nginx.
5.  Iniciar todos os serviços.

**Para verificar se tudo está rodando:**
```bash
sudo docker-compose ps
```
Você deverá ver todos os serviços com o status `Up` ou `running`.

---

## 🔒 Passo 5: Ativar HTTPS (SSL Grátis com Certbot)

Agora que seu site está no ar na porta 80, vamos adicionar a camada de segurança.

```bash
# 1. Instalar o Certbot
sudo apt install -y certbot python3-certbot-nginx

# 2. Gerar o certificado (use o mesmo domínio do nginx.conf)
sudo certbot --nginx -d seu-dominio.com
```

Siga as instruções na tela. Escolha a **opção 2 (Redirect)** para forçar todo o tráfego para HTTPS.

**Pronto!** Seu painel está no ar, seguro e configurado para produção em `https://seu-dominio.com`.

---

## 🛠️ Comandos Úteis de Manutenção

*   **Ver logs da API em tempo real:**
    ```bash
    sudo docker-compose logs -f api
    ```

*   **Parar todos os serviços:**
    ```bash
    sudo docker-compose down
    ```

*   **Reiniciar os serviços após uma alteração:**
    ```bash
    sudo docker-compose up -d --build
    ```
