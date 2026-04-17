# 📦 Guia Completo de Deployment - IndusScan AI

## Índice
1. [Deployment Ubuntu Server](#deployment-ubuntu-server)
2. [Deployment Windows Server](#deployment-windows-server)
3. [Docker (Recomendado)](#docker-recomendado)
4. [Troubleshooting](#troubleshooting)
5. [Scripts Prontos](#scripts-prontos)

---

## 🐧 Deployment Ubuntu Server

### Ambiente Testado
- Ubuntu 20.04 LTS, 22.04 LTS
- Node.js 22.13.0
- MySQL 8.0
- Nginx 1.18+

### Script de Instalação Automática

Crie um arquivo `install-ubuntu.sh`:

```bash
#!/bin/bash
set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== IndusScan AI - Instalação Automática ===${NC}"

# 1. Atualizar sistema
echo -e "${YELLOW}[1/10] Atualizando sistema...${NC}"
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git build-essential

# 2. Instalar Node.js
echo -e "${YELLOW}[2/10] Instalando Node.js 22...${NC}"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Instalar pnpm
echo -e "${YELLOW}[3/10] Instalando pnpm...${NC}"
npm install -g pnpm

# 4. Instalar MySQL
echo -e "${YELLOW}[4/10] Instalando MySQL Server...${NC}"
sudo apt install -y mysql-server

# 5. Configurar MySQL
echo -e "${YELLOW}[5/10] Configurando MySQL...${NC}"
sudo systemctl start mysql
sudo systemctl enable mysql

# Criar banco de dados
sudo mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS indusscan_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'indusscan'@'localhost' IDENTIFIED BY 'indusscan_secure_pass_2024';
GRANT ALL PRIVILEGES ON indusscan_v2.* TO 'indusscan'@'localhost';
FLUSH PRIVILEGES;
EOF

echo -e "${GREEN}✓ MySQL configurado${NC}"

# 6. Clonar repositório
echo -e "${YELLOW}[6/10] Clonando repositório...${NC}"
cd /opt
sudo git clone https://github.com/seu-usuario/indusscan-v2.git
sudo chown -R $USER:$USER indusscan-v2
cd indusscan-v2

# 7. Instalar dependências
echo -e "${YELLOW}[7/10] Instalando dependências...${NC}"
pnpm install

# 8. Configurar .env
echo -e "${YELLOW}[8/10] Criando arquivo .env...${NC}"
cat > .env << 'ENVEOF'
DATABASE_URL="mysql://indusscan:indusscan_secure_pass_2024@localhost:3306/indusscan_v2"
JWT_SECRET="seu-jwt-secret-super-seguro-aqui-$(date +%s)"
VITE_APP_ID="seu-app-id-manus"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://manus.im/login"
OWNER_OPEN_ID="seu-open-id"
OWNER_NAME="Seu Nome"
BUILT_IN_FORGE_API_URL="https://api.manus.im"
BUILT_IN_FORGE_API_KEY="sua-chave-api-manus"
VITE_FRONTEND_FORGE_API_KEY="sua-chave-frontend"
VITE_FRONTEND_FORGE_API_URL="https://api.manus.im"
NODE_ENV="production"
PORT="3000"
ENVEOF

echo -e "${YELLOW}⚠️  Edite o arquivo .env com suas credenciais reais${NC}"

# 9. Executar migrações
echo -e "${YELLOW}[9/10] Executando migrações do banco de dados...${NC}"
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# 10. Build
echo -e "${YELLOW}[10/10] Compilando aplicação...${NC}"
pnpm build

# Instalar PM2
echo -e "${YELLOW}Instalando PM2...${NC}"
sudo npm install -g pm2

# Criar arquivo de configuração PM2
cat > ecosystem.config.cjs << 'PMEOF'
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
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      merge_logs: true
    }
  ]
};
PMEOF

# Iniciar com PM2
pm2 start ecosystem.config.cjs
pm2 save
sudo pm2 startup ubuntu -u $USER --hp /home/$USER

# Instalar Nginx
echo -e "${YELLOW}Instalando Nginx...${NC}"
sudo apt install -y nginx

# Configurar Nginx
sudo tee /etc/nginx/sites-available/indusscan > /dev/null << 'NGINXEOF'
upstream indusscan_backend {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name _;
    client_max_body_size 50M;

    location / {
        proxy_pass http://indusscan_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINXEOF

# Habilitar site
sudo ln -sf /etc/nginx/sites-available/indusscan /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar e reiniciar Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Configurar Firewall
echo -e "${YELLOW}Configurando Firewall...${NC}"
sudo ufw enable --force
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status

echo -e "${GREEN}=== Instalação Concluída ===${NC}"
echo -e "${GREEN}✓ Node.js instalado${NC}"
echo -e "${GREEN}✓ MySQL configurado${NC}"
echo -e "${GREEN}✓ Aplicação compilada${NC}"
echo -e "${GREEN}✓ PM2 configurado${NC}"
echo -e "${GREEN}✓ Nginx configurado${NC}"
echo -e "${GREEN}✓ Firewall ativado${NC}"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Edite o arquivo .env com suas credenciais reais"
echo "2. Configure seu domínio no Nginx"
echo "3. Instale certificado SSL: sudo certbot --nginx -d seu-dominio.com"
echo "4. Acesse: http://seu-servidor"
echo ""
echo -e "${YELLOW}Comandos úteis:${NC}"
echo "pm2 logs              - Ver logs em tempo real"
echo "pm2 status            - Ver status dos processos"
echo "pm2 restart all       - Reiniciar aplicação"
echo "pm2 stop all          - Parar aplicação"
```

### Executar Script

```bash
chmod +x install-ubuntu.sh
./install-ubuntu.sh
```

### Configurar SSL com Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx

# Gerar certificado
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática (já habilitada por padrão)
sudo systemctl status certbot.timer
```

### Monitoramento Contínuo

```bash
# Ver logs em tempo real
pm2 logs

# Dashboard interativo
pm2 monit

# Ver status
pm2 status

# Reiniciar aplicação
pm2 restart indusscan-api

# Parar aplicação
pm2 stop indusscan-api

# Iniciar aplicação
pm2 start indusscan-api
```

---

## 🪟 Deployment Windows Server

### Ambiente Testado
- Windows Server 2019, 2022
- Node.js 22.13.0
- MySQL 8.0
- IIS 10.0+

### Script de Instalação Automática (PowerShell)

Crie um arquivo `install-windows.ps1`:

```powershell
# Executar como Administrador
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Write-Host "=== IndusScan AI - Instalação Automática (Windows) ===" -ForegroundColor Yellow

# 1. Instalar Chocolatey (se não estiver instalado)
Write-Host "[1/8] Verificando Chocolatey..." -ForegroundColor Yellow
if (-not (Test-Path "C:\ProgramData\chocolatey")) {
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# 2. Instalar Node.js
Write-Host "[2/8] Instalando Node.js 22..." -ForegroundColor Yellow
choco install nodejs -y --version=22.13.0

# Recarregar PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 3. Instalar pnpm
Write-Host "[3/8] Instalando pnpm..." -ForegroundColor Yellow
npm install -g pnpm

# 4. Instalar MySQL
Write-Host "[4/8] Instalando MySQL Server..." -ForegroundColor Yellow
choco install mysql -y

# 5. Instalar Git
Write-Host "[5/8] Instalando Git..." -ForegroundColor Yellow
choco install git -y

# 6. Clonar repositório
Write-Host "[6/8] Clonando repositório..." -ForegroundColor Yellow
cd C:\
git clone https://github.com/seu-usuario/indusscan-v2.git
cd indusscan-v2

# 7. Instalar dependências
Write-Host "[7/8] Instalando dependências..." -ForegroundColor Yellow
pnpm install

# 8. Criar arquivo .env
Write-Host "[8/8] Criando arquivo .env..." -ForegroundColor Yellow
@"
DATABASE_URL="mysql://root:senha-mysql@localhost:3306/indusscan_v2"
JWT_SECRET="seu-jwt-secret-super-seguro-aqui"
VITE_APP_ID="seu-app-id-manus"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://manus.im/login"
OWNER_OPEN_ID="seu-open-id"
OWNER_NAME="Seu Nome"
BUILT_IN_FORGE_API_URL="https://api.manus.im"
BUILT_IN_FORGE_API_KEY="sua-chave-api-manus"
VITE_FRONTEND_FORGE_API_KEY="sua-chave-frontend"
VITE_FRONTEND_FORGE_API_URL="https://api.manus.im"
NODE_ENV="production"
PORT="3000"
"@ | Out-File -Encoding UTF8 ".env"

Write-Host "Executando migrações..." -ForegroundColor Yellow
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

Write-Host "Compilando aplicação..." -ForegroundColor Yellow
pnpm build

Write-Host "=== Instalação Concluída ===" -ForegroundColor Green
Write-Host "✓ Node.js instalado" -ForegroundColor Green
Write-Host "✓ MySQL instalado" -ForegroundColor Green
Write-Host "✓ Aplicação compilada" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Edite o arquivo .env com suas credenciais reais"
Write-Host "2. Instale NSSM para criar serviço Windows"
Write-Host "3. Configure IIS como reverse proxy"
Write-Host "4. Acesse: http://localhost:3000"
```

### Executar Script

```powershell
# Abrir PowerShell como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\install-windows.ps1
```

### Criar Serviço Windows com NSSM

```powershell
# 1. Baixar NSSM
# https://nssm.cc/download
# Extrair em C:\nssm

# 2. Instalar serviço
C:\nssm\nssm.exe install IndusScanAI "C:\Program Files\nodejs\node.exe" "C:\indusscan-v2\dist\index.js"

# 3. Configurar variáveis de ambiente
C:\nssm\nssm.exe set IndusScanAI AppEnvironmentExtra NODE_ENV=production
C:\nssm\nssm.exe set IndusScanAI AppDirectory "C:\indusscan-v2"

# 4. Iniciar serviço
C:\nssm\nssm.exe start IndusScanAI

# 5. Verificar status
Get-Service IndusScanAI
```

### Configurar IIS

```powershell
# 1. Instalar IIS
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CGI
Enable-WindowsOptionalFeature -Online -FeatureName IIS-URLRewrite

# 2. Abrir IIS Manager
inetmgr

# 3. Criar novo site:
# - Nome: IndusScan
# - Binding: http seu-dominio.com porta 80
# - Caminho físico: C:\indusscan-v2\public

# 4. Adicionar regra URL Rewrite:
# - Abrir URL Rewrite
# - Criar nova regra "Reverse Proxy"
# - Servidor: localhost:3000
```

---

## 🐳 Docker (Recomendado)

### Dockerfile

```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar arquivos
COPY package.json pnpm-lock.yaml ./
COPY drizzle ./drizzle
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY tsconfig.json vite.config.ts ./

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm build

# Runtime stage
FROM node:22-alpine

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar package.json
COPY package.json pnpm-lock.yaml ./

# Instalar dependências de produção
RUN pnpm install --prod --frozen-lockfile

# Copiar aplicação compilada
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Criar diretórios de logs
RUN mkdir -p logs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar aplicação
CMD ["node", "dist/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: indusscan-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root_password_secure
      MYSQL_DATABASE: indusscan_v2
      MYSQL_USER: indusscan
      MYSQL_PASSWORD: indusscan_secure_pass
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - indusscan-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  app:
    build: .
    container_name: indusscan-app
    environment:
      DATABASE_URL: "mysql://indusscan:indusscan_secure_pass@mysql:3306/indusscan_v2"
      JWT_SECRET: "seu-jwt-secret-super-seguro"
      VITE_APP_ID: "seu-app-id-manus"
      OAUTH_SERVER_URL: "https://api.manus.im"
      VITE_OAUTH_PORTAL_URL: "https://manus.im/login"
      OWNER_OPEN_ID: "seu-open-id"
      OWNER_NAME: "Seu Nome"
      BUILT_IN_FORGE_API_URL: "https://api.manus.im"
      BUILT_IN_FORGE_API_KEY: "sua-chave-api-manus"
      VITE_FRONTEND_FORGE_API_KEY: "sua-chave-frontend"
      VITE_FRONTEND_FORGE_API_URL: "https://api.manus.im"
      NODE_ENV: "production"
      PORT: "3000"
    ports:
      - "3000:3000"
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - indusscan-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: indusscan-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - indusscan-network
    restart: unless-stopped

volumes:
  mysql_data:

networks:
  indusscan-network:
    driver: bridge
```

### Executar com Docker

```bash
# Build
docker-compose build

# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down

# Limpar tudo
docker-compose down -v
```

---

## 🔧 Troubleshooting

### Erro: "Cannot connect to database"

```bash
# Ubuntu
sudo systemctl restart mysql

# Windows
Restart-Service MySQL80

# Verificar conexão
mysql -u indusscan -p -h localhost indusscan_v2
```

### Erro: "Port 3000 already in use"

```bash
# Ubuntu/Linux
sudo lsof -i :3000
sudo kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Erro: "Permission denied"

```bash
# Ubuntu
sudo chown -R $USER:$USER /opt/indusscan-v2
chmod -R 755 /opt/indusscan-v2
```

### Aplicação não inicia após reboot

```bash
# Ubuntu - Verificar PM2
pm2 status
pm2 logs

# Windows - Verificar serviço
Get-Service IndusScanAI
Get-EventLog -LogName Application -Source "IndusScanAI" -Newest 10
```

### Nginx retorna 502 Bad Gateway

```bash
# Verificar se aplicação está rodando
curl http://localhost:3000

# Verificar logs Nginx
sudo tail -f /var/log/nginx/error.log

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 📊 Scripts Prontos

### Backup Automático (Ubuntu)

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/indusscan"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Backup MySQL
mysqldump -u indusscan -p'indusscan_secure_pass_2024' indusscan_v2 | gzip > $BACKUP_DIR/mysql_$TIMESTAMP.sql.gz

# Backup arquivos
tar -czf $BACKUP_DIR/app_$TIMESTAMP.tar.gz /opt/indusscan-v2 --exclude=node_modules --exclude=dist

# Limpar backups antigos
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup realizado: $TIMESTAMP"
```

Agendar com cron:

```bash
crontab -e
# Adicionar: 0 2 * * * /path/to/backup.sh
```

### Monitoramento (Ubuntu)

```bash
#!/bin/bash
# monitor.sh

while true; do
  echo "=== Status da Aplicação ==="
  echo "Hora: $(date)"
  echo ""
  
  # Verificar se aplicação está rodando
  if curl -s http://localhost:3000/health > /dev/null; then
    echo "✓ Aplicação: Online"
  else
    echo "✗ Aplicação: Offline"
    pm2 restart indusscan-api
  fi
  
  # Verificar MySQL
  if mysqladmin ping -u indusscan -p'indusscan_secure_pass_2024' > /dev/null 2>&1; then
    echo "✓ MySQL: Online"
  else
    echo "✗ MySQL: Offline"
    sudo systemctl restart mysql
  fi
  
  # Verificar Nginx
  if systemctl is-active --quiet nginx; then
    echo "✓ Nginx: Online"
  else
    echo "✗ Nginx: Offline"
    sudo systemctl restart nginx
  fi
  
  echo ""
  sleep 300  # Verificar a cada 5 minutos
done
```

---

## 📞 Suporte

Para problemas adicionais:
- Verifique os logs: `pm2 logs` (Ubuntu) ou Event Viewer (Windows)
- Consulte a documentação: https://docs.indusscan.com
- Abra uma issue no GitHub

---

**Última atualização:** 2026-04-17
