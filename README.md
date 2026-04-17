# 🌿 IndusScan AI - Plataforma de Análise de Emissões CO₂ Industrial

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22.13.0-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey)](https://expressjs.com/)
[![tRPC](https://img.shields.io/badge/tRPC-11-purple)](https://trpc.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue)](https://www.mysql.com/)

**IndusScan AI** é uma plataforma web profissional de análise de emissões de CO₂ para máquinas industriais, utilizando inteligência artificial para identificação automática, Deep Research de dados técnicos e cálculos precisos de emissões com recomendações de descarbonização.

## 🎯 Funcionalidades Principais

### 1. **Análise por Visão Computacional**
- Upload de imagens de máquinas industriais
- Identificação automática de modelo, marca e ano de fabricação
- Detecção de estado e condição da máquina
- Suporte para múltiplos formatos (JPG, PNG)

### 2. **Deep Research Automático**
- Busca inteligente de dados técnicos na internet
- Enriquecimento de perfil da máquina com:
  - Potência nominal (kW)
  - Eficiência energética (%)
  - Tipo de combustível/energia
  - Consumo específico
- Cache inteligente para reutilização de dados

### 3. **Cálculo Preciso de Emissões CO₂**
- Fórmulas baseadas em ISO 14040/14044 (LCA)
- Cálculo de emissões:
  - **Mínima**: Cenário otimista com máxima eficiência
  - **Média**: Cenário realista com eficiência nominal
  - **Máxima**: Cenário pessimista com degradação
- Projeções futuras (1, 3, 5 anos) com modelo de degradação
- Projeção mensal para análise detalhada

### 4. **Dashboard Consolidado**
- Métricas em tempo real:
  - Total de análises realizadas
  - Máquinas catalogadas
  - Emissão total acumulada (kg CO₂)
  - Economia potencial (kg CO₂)
- Gráfico de emissões mensais
- Indicador de progresso Net Zero
- Status de redução de emissões

### 5. **Histórico e Gestão de Dados**
- Visualização completa de todas as análises
- Filtros por período, tipo de máquina e nível de emissão
- Exclusão individual de análises
- Página de detalhes com informações completas
- Gráfico de projeção de emissões por análise

### 6. **Recomendações de Descarbonização**
- Geração automática de recomendações baseadas em nível de emissão
- Sugestões específicas:
  - **Sensores IoT**: Monitoramento em tempo real
  - **Atuadores**: Controle automático de processos
  - **Filtros**: Redução de poluentes
  - **Manutenção**: Otimização de eficiência
  - **Retrofit**: Modernização de equipamentos
- Estimativa de economia de CO₂ por recomendação

### 7. **Banco de Dados Auto-Alimentado**
- Catálogo de máquinas catalogadas
- Busca por modelo, marca ou tipo
- Histórico de emissões por máquina
- Aprendizado contínuo com cada nova análise

### 8. **Autenticação Segura**
- Integração com Manus OAuth
- Controle de acesso por usuário
- Proteção de dados pessoais
- Histórico isolado por usuário

## 📋 Requisitos do Sistema

### Mínimos
- **Node.js**: 18.0 ou superior (recomendado 22.13.0)
- **npm** ou **pnpm**: 8.0 ou superior
- **MySQL**: 8.0 ou superior (ou TiDB compatível)
- **RAM**: 2GB mínimo
- **Disco**: 5GB mínimo

### Recomendados (Produção)
- **Node.js**: 22.13.0 LTS
- **MySQL**: 8.0 com SSL habilitado
- **RAM**: 4GB ou superior
- **Disco**: 20GB SSD
- **Processador**: 2 cores ou superior

## 🚀 Instalação Local

### Pré-requisitos
1. Node.js 18+ instalado
2. MySQL 8.0+ rodando
3. Git instalado
4. Chave de API OpenAI (para análise por IA)

### Passo 1: Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/indusscan-v2.git
cd indusscan-v2
```

### Passo 2: Instalar Dependências

```bash
# Usando pnpm (recomendado)
pnpm install

# Ou usando npm
npm install
```

### Passo 3: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Banco de Dados
DATABASE_URL="mysql://usuario:senha@localhost:3306/indusscan_v2"

# Autenticação
JWT_SECRET="sua-chave-secreta-super-segura-aqui"
VITE_APP_ID="seu-app-id-manus"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://manus.im/login"

# Proprietário
OWNER_OPEN_ID="seu-open-id"
OWNER_NAME="Seu Nome"

# APIs Manus
BUILT_IN_FORGE_API_URL="https://api.manus.im"
BUILT_IN_FORGE_API_KEY="sua-chave-api-manus"
VITE_FRONTEND_FORGE_API_KEY="sua-chave-frontend"
VITE_FRONTEND_FORGE_API_URL="https://api.manus.im"

# Analytics (opcional)
VITE_ANALYTICS_ENDPOINT="https://analytics.example.com"
VITE_ANALYTICS_WEBSITE_ID="seu-website-id"
```

### Passo 4: Criar Banco de Dados

```bash
# Conectar ao MySQL
mysql -u root -p

# Criar banco de dados
CREATE DATABASE indusscan_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'indusscan'@'localhost' IDENTIFIED BY 'senha-segura';
GRANT ALL PRIVILEGES ON indusscan_v2.* TO 'indusscan'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Passo 5: Executar Migrações

```bash
# Gerar migrações
pnpm drizzle-kit generate

# Aplicar migrações
pnpm drizzle-kit migrate
```

### Passo 6: Iniciar Servidor de Desenvolvimento

```bash
pnpm dev
```

O servidor estará disponível em: `http://localhost:3000`

## 📦 Deployment em Ubuntu Server

### Pré-requisitos
- Ubuntu 20.04 LTS ou superior
- Acesso root ou sudo
- Domínio configurado (opcional)
- SSL/TLS (recomendado)

### Instalação Completa do Sistema

#### 1. Atualizar Sistema

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

#### 2. Instalar Node.js

```bash
# Usando NodeSource (recomendado)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version
npm --version
```

#### 3. Instalar pnpm

```bash
npm install -g pnpm

# Verificar instalação
pnpm --version
```

#### 4. Instalar MySQL Server

```bash
sudo apt install -y mysql-server

# Iniciar serviço
sudo systemctl start mysql
sudo systemctl enable mysql

# Verificar status
sudo systemctl status mysql
```

#### 5. Configurar MySQL

```bash
# Executar script de segurança
sudo mysql_secure_installation

# Conectar e criar banco de dados
sudo mysql -u root -p

# Execute os comandos SQL:
CREATE DATABASE indusscan_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'indusscan'@'localhost' IDENTIFIED BY 'senha-super-segura-aqui';
GRANT ALL PRIVILEGES ON indusscan_v2.* TO 'indusscan'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 6. Clonar Repositório

```bash
cd /opt
sudo git clone https://github.com/seu-usuario/indusscan-v2.git
sudo chown -R $USER:$USER indusscan-v2
cd indusscan-v2
```

#### 7. Instalar Dependências

```bash
pnpm install
```

#### 8. Configurar Variáveis de Ambiente

```bash
nano .env
```

Adicione o conteúdo (veja seção "Configurar Variáveis de Ambiente" acima)

#### 9. Executar Migrações

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

#### 10. Build para Produção

```bash
pnpm build
```

#### 11. Instalar PM2 (Gerenciador de Processos)

```bash
sudo npm install -g pm2

# Criar arquivo de configuração
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'indusscan-api',
      script: './dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
EOF

# Iniciar aplicação
pm2 start ecosystem.config.cjs

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar com o sistema
sudo pm2 startup ubuntu -u $USER --hp /home/$USER
```

#### 12. Instalar Nginx (Reverse Proxy)

```bash
sudo apt install -y nginx

# Criar configuração
sudo nano /etc/nginx/sites-available/indusscan

# Adicione:
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Habilitar site
sudo ln -s /etc/nginx/sites-available/indusscan /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

#### 13. Configurar SSL com Let's Encrypt (Recomendado)

```bash
sudo apt install -y certbot python3-certbot-nginx

# Gerar certificado
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

#### 14. Configurar Firewall

```bash
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3306/tcp  # MySQL (apenas se necessário)
sudo ufw status
```

#### 15. Monitoramento e Logs

```bash
# Ver logs em tempo real
pm2 logs

# Ver status dos processos
pm2 status

# Monitorar recursos
pm2 monit
```

## 🪟 Deployment em Windows Server

### Pré-requisitos
- Windows Server 2019 ou superior
- Acesso de administrador
- PowerShell 5.0 ou superior

### Instalação Completa do Sistema

#### 1. Instalar Node.js

1. Baixar instalador: https://nodejs.org/ (versão 22.13.0 LTS)
2. Executar instalador como administrador
3. Seguir as instruções padrão
4. Verificar instalação:

```powershell
node --version
npm --version
```

#### 2. Instalar pnpm

```powershell
npm install -g pnpm
pnpm --version
```

#### 3. Instalar MySQL Server

1. Baixar MySQL Community Server: https://dev.mysql.com/downloads/mysql/
2. Executar instalador como administrador
3. Escolher "Server only" ou "Full"
4. Configurar como serviço Windows
5. Definir porta 3306
6. Criar usuário root com senha segura

#### 4. Configurar MySQL

```powershell
# Conectar ao MySQL
mysql -u root -p

# Execute:
CREATE DATABASE indusscan_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'indusscan'@'localhost' IDENTIFIED BY 'senha-super-segura-aqui';
GRANT ALL PRIVILEGES ON indusscan_v2.* TO 'indusscan'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 5. Clonar Repositório

```powershell
cd C:\
git clone https://github.com/seu-usuario/indusscan-v2.git
cd indusscan-v2
```

#### 6. Instalar Dependências

```powershell
pnpm install
```

#### 7. Configurar Variáveis de Ambiente

```powershell
# Criar arquivo .env
New-Item -Path ".env" -ItemType File

# Editar com Notepad
notepad .env
```

Adicione o conteúdo (veja seção "Configurar Variáveis de Ambiente" acima)

#### 8. Executar Migrações

```powershell
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

#### 9. Build para Produção

```powershell
pnpm build
```

#### 10. Criar Serviço Windows com NSSM

```powershell
# Baixar NSSM: https://nssm.cc/download
# Extrair em C:\nssm

# Instalar serviço
C:\nssm\nssm.exe install IndusScanAI "C:\Program Files\nodejs\node.exe" "C:\indusscan-v2\dist\index.js"

# Configurar variáveis de ambiente
C:\nssm\nssm.exe set IndusScanAI AppEnvironmentExtra NODE_ENV=production

# Iniciar serviço
C:\nssm\nssm.exe start IndusScanAI

# Verificar status
Get-Service IndusScanAI
```

#### 11. Instalar IIS (Internet Information Services)

```powershell
# Abrir "Turn Windows features on or off"
# Habilitar: Internet Information Services
# Habilitar: Application Development > CGI
# Habilitar: Application Development > URL Rewrite
```

#### 12. Configurar IIS como Reverse Proxy

1. Abrir IIS Manager
2. Criar novo site:
   - Nome: IndusScan
   - Binding: http seu-dominio.com porta 80
   - Caminho físico: C:\indusscan-v2\public (ou qualquer pasta)

3. Adicionar regra URL Rewrite:
   - Abrir URL Rewrite
   - Criar nova regra "Reverse Proxy"
   - Servidor: localhost:3000

#### 13. Instalar SSL com Let's Encrypt

```powershell
# Instalar Certbot
choco install certbot -y

# Gerar certificado
certbot certonly --standalone -d seu-dominio.com

# Importar certificado no IIS
# Abrir IIS Manager > Server Certificates > Import
```

#### 14. Configurar Firewall Windows

```powershell
# Abrir Windows Defender Firewall with Advanced Security
# Criar regra de entrada para porta 80 e 443
# Criar regra de entrada para porta 3000 (apenas localhost)
```

#### 15. Monitoramento

```powershell
# Ver logs de evento
Get-EventLog -LogName Application -Source "IndusScanAI" -Newest 10

# Ver status do serviço
Get-Service IndusScanAI

# Reiniciar serviço
Restart-Service IndusScanAI
```

## 🔧 Configuração Avançada

### Variáveis de Ambiente Detalhadas

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | String de conexão MySQL | `mysql://user:pass@localhost:3306/db` |
| `JWT_SECRET` | Chave para assinar JWT | `sua-chave-super-segura` |
| `NODE_ENV` | Ambiente (development/production) | `production` |
| `PORT` | Porta do servidor | `3000` |
| `VITE_APP_ID` | ID da aplicação Manus | `seu-app-id` |
| `BUILT_IN_FORGE_API_KEY` | Chave de API Manus | `sua-chave-api` |

### Otimizações de Produção

#### 1. Aumentar Limite de Conexões MySQL

```sql
SET GLOBAL max_connections = 1000;
SET GLOBAL max_allowed_packet = 256M;
```

#### 2. Configurar Cache

```bash
# Instalar Redis (Ubuntu)
sudo apt install -y redis-server

# Iniciar Redis
sudo systemctl start redis-server
```

#### 3. Configurar Backup Automático

```bash
# Script de backup (Ubuntu)
#!/bin/bash
BACKUP_DIR="/backups/indusscan"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p $BACKUP_DIR

mysqldump -u indusscan -p indusscan_v2 > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Agendar com cron
crontab -e
# Adicionar: 0 2 * * * /path/to/backup.sh
```

## 📊 Monitoramento e Manutenção

### Verificar Saúde da Aplicação

```bash
# Ubuntu/Linux
curl http://localhost:3000/health

# PowerShell (Windows)
Invoke-WebRequest -Uri "http://localhost:3000/health"
```

### Limpar Histórico (Desenvolvimento)

```bash
cd /path/to/indusscan-v2
npx tsx cleanup.mjs
```

### Atualizar Aplicação

```bash
# Parar aplicação
pm2 stop indusscan-api  # Linux
# ou
Stop-Service IndusScanAI  # Windows

# Atualizar código
git pull origin main

# Instalar dependências
pnpm install

# Executar migrações
pnpm drizzle-kit migrate

# Build
pnpm build

# Reiniciar
pm2 start indusscan-api  # Linux
# ou
Start-Service IndusScanAI  # Windows
```

## 🧪 Testes

### Executar Testes Unitários

```bash
pnpm test
```

### Testes de Cálculo de Emissões

```bash
pnpm test -- emissionsCalculationService
```

### Testes de Análise de Imagem

```bash
pnpm test -- imageAnalysisService
```

## 📝 Estrutura do Projeto

```
indusscan-v2/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas principais
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── lib/           # Utilitários
│   │   └── App.tsx        # Aplicação principal
│   └── index.html
├── server/                # Backend Express + tRPC
│   ├── routers/           # Rotas tRPC
│   ├── *Service.ts        # Serviços de negócio
│   ├── db.ts              # Helpers de banco de dados
│   └── _core/             # Infraestrutura
├── drizzle/               # Migrações e schema
├── shared/                # Código compartilhado
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato através de:
- Email: support@indusscan.com
- Discord: [Link do servidor Discord]
- Documentação: https://docs.indusscan.com

## 🙏 Agradecimentos

- OpenAI pela Vision API
- Manus pela plataforma de OAuth e APIs
- Comunidade open-source

---

**Desenvolvido com ❤️ para sustentabilidade industrial**
