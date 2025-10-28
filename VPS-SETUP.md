# 🖥️ Configuração da VPS - Cânticos CCB

## 📋 Informações da VPS

```
IP: 203.161.46.119
Painel: WHM/cPanel (porta 2087)
Usuário: root
SO: Detectado automaticamente
```

⚠️ **IMPORTANTE**: Guarde suas credenciais em local seguro. Nunca compartilhe em repositórios públicos.

---

## 🚀 Passo 1: Acessar o Painel WHM/cPanel

### Via Navegador (Recomendado)
```
URL: https://203.161.46.119:2087/
Usuário: root
Senha: [sua senha]
```

### Via SSH (Terminal)
```bash
# Windows PowerShell ou CMD
ssh root@203.161.46.119

# Linux/Mac Terminal
ssh root@203.161.46.119
```

---

## 🔧 Passo 2: Configuração Inicial

### 2.1 Atualizar Sistema

Após conectar via SSH:

```bash
# Atualizar pacotes
yum update -y  # CentOS/AlmaLinux
# OU
apt update && apt upgrade -y  # Ubuntu/Debian

# Instalar utilitários básicos
yum install -y wget curl nano git  # CentOS
# OU
apt install -y wget curl nano git  # Ubuntu
```

### 2.2 Verificar Sistema

```bash
# Ver informações do sistema
cat /etc/os-release

# Ver espaço em disco
df -h

# Ver RAM disponível
free -h

# Ver processos
top
```

---

## 🎵 Passo 3: Criar Estrutura de Diretórios

```bash
# Criar diretório principal para mídia
mkdir -p /var/www/media

# Criar subdiretórios
mkdir -p /var/www/media/hinos
mkdir -p /var/www/media/albuns
mkdir -p /var/www/media/avatars
mkdir -p /var/www/media/covers

# Definir permissões
chown -R nginx:nginx /var/www/media  # CentOS
# OU
chown -R www-data:www-data /var/www/media  # Ubuntu

chmod -R 755 /var/www/media
```

---

## 🌐 Passo 4: Configurar Domínio/Subdomínio

### 4.1 Criar Subdomínio no WHM/cPanel

1. Acesse WHM: https://203.161.46.119:2087/
2. Navegue para: **DNS Functions** → **Edit DNS Zone**
3. Selecione seu domínio (se tiver)
4. Adicione registro A:
   ```
   Nome: media
   Tipo: A
   Valor: 203.161.46.119
   TTL: 14400
   ```

### 4.2 Aguardar Propagação DNS

```bash
# Testar DNS (após algumas horas)
nslookup media.seudominio.com
ping media.seudominio.com
```

---

## 🔒 Passo 5: Configurar SSL (HTTPS)

### Via WHM/cPanel (Mais Fácil)

1. Acesse WHM: https://203.161.46.119:2087/
2. Navegue para: **SSL/TLS** → **Install a SSL Certificate on a Domain**
3. Selecione o domínio: `media.seudominio.com`
4. Clique em **AutoSSL** ou instale Let's Encrypt

### Via SSH (Certbot)

```bash
# Instalar Certbot
yum install -y certbot python3-certbot-nginx  # CentOS
# OU
apt install -y certbot python3-certbot-nginx  # Ubuntu

# Obter certificado
certbot --nginx -d media.seudominio.com

# Renovação automática
certbot renew --dry-run
```

---

## ⚙️ Passo 6: Configurar nginx (via WHM ou Manual)

### Opção A: Via WHM/cPanel

1. Acesse WHM → **Service Configuration** → **nginx Configuration**
2. Adicione configuração customizada:

```nginx
# Arquivo: /etc/nginx/conf.d/media.conf

server {
    listen 80;
    server_name media.seudominio.com 203.161.46.119;
    
    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name media.seudominio.com;
    
    # SSL configurado via AutoSSL/Certbot
    
    root /var/www/media;
    index index.html;
    
    # Logs
    access_log /var/log/nginx/media-access.log;
    error_log /var/log/nginx/media-error.log;
    
    # CORS Headers
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept" always;
    
    # Cache Headers
    add_header Cache-Control "public, max-age=31536000, immutable";
    
    # Streaming de Áudio
    location /hinos/ {
        mp4;
        mp4_buffer_size 1m;
        mp4_max_buffer_size 5m;
        
        # Tipos MIME
        types {
            audio/mpeg mp3;
            video/mp4 mp4;
        }
        
        # Permite range requests (seek no player)
        add_header Accept-Ranges bytes;
    }
    
    # Imagens de Capas
    location /albuns/ {
        types {
            image/jpeg jpg jpeg;
            image/png png;
            image/webp webp;
        }
    }
    
    # Avatares
    location /avatars/ {
        types {
            image/jpeg jpg jpeg;
            image/png png;
            image/webp webp;
        }
    }
    
    # Bloquear acesso a arquivos ocultos
    location ~ /\. {
        deny all;
    }
}
```

3. Salve e teste a configuração:

```bash
nginx -t
systemctl reload nginx
```

### Opção B: Manual (via SSH)

```bash
# Criar arquivo de configuração
nano /etc/nginx/conf.d/media.conf

# Colar a configuração acima
# Salvar: Ctrl+O, Enter, Ctrl+X

# Testar configuração
nginx -t

# Recarregar nginx
systemctl reload nginx

# Verificar status
systemctl status nginx
```

---

## 📤 Passo 7: Upload de Arquivos

### Via SCP (Recomendado para muitos arquivos)

```bash
# Do seu computador local
scp -r C:\xampp\htdocs\1canticosccb\media\* root@203.161.46.119:/var/www/media/

# Ou arquivo por arquivo
scp arquivo.mp3 root@203.161.46.119:/var/www/media/hinos/
```

### Via SFTP (FileZilla)

1. Baixe [FileZilla](https://filezilla-project.org/)
2. Conecte:
   - Host: `sftp://203.161.46.119`
   - Usuário: `root`
   - Senha: [sua senha]
   - Porta: `22`
3. Navegue até `/var/www/media/`
4. Arraste e solte arquivos

### Via WHM File Manager

1. Acesse WHM → **File Manager**
2. Navegue até `/var/www/media/`
3. Clique em **Upload**
4. Selecione arquivos

---

## 🧪 Passo 8: Testar Configuração

### Teste 1: Acesso HTTP

```bash
# No navegador ou via curl
curl http://203.161.46.119/hinos/teste.mp3
# Deve retornar o arquivo ou 404 se não existir
```

### Teste 2: CORS

```bash
curl -H "Origin: https://canticosccb.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://203.161.46.119/hinos/teste.mp3 -I

# Deve retornar headers CORS
```

### Teste 3: Streaming

No navegador, acesse:
```
https://media.seudominio.com/hinos/teste.mp3
```

Deve tocar o áudio diretamente.

---

## 🔐 Passo 9: Segurança

### 9.1 Configurar Firewall

```bash
# CentOS/AlmaLinux (firewalld)
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=2087/tcp  # WHM
firewall-cmd --reload

# Ubuntu (UFW)
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 2087/tcp  # WHM
ufw enable
```

### 9.2 Limitar Acesso SSH

```bash
# Editar sshd_config
nano /etc/ssh/sshd_config

# Mudar porta SSH (opcional)
Port 2222

# Desabilitar login root direto (após criar usuário)
PermitRootLogin no

# Salvar e reiniciar SSH
systemctl restart sshd
```

### 9.3 Fail2Ban (Proteção contra Brute Force)

```bash
# Instalar
yum install -y fail2ban  # CentOS
# OU
apt install -y fail2ban  # Ubuntu

# Ativar
systemctl enable fail2ban
systemctl start fail2ban
```

---

## 📊 Passo 10: Monitoramento

### 10.1 Ver Logs nginx

```bash
# Logs de acesso
tail -f /var/log/nginx/media-access.log

# Logs de erro
tail -f /var/log/nginx/media-error.log
```

### 10.2 Monitorar Uso de Disco

```bash
# Espaço usado
du -sh /var/www/media/

# Espaço disponível
df -h
```

### 10.3 Monitorar Tráfego (Bandwidth)

```bash
# Instalar vnstat
yum install -y vnstat  # CentOS
apt install -y vnstat  # Ubuntu

# Ver estatísticas
vnstat -d  # Diário
vnstat -m  # Mensal
```

---

## 🔄 Passo 11: Backup Automático

### Script de Backup

```bash
# Criar script
nano /root/backup-media.sh
```

Conteúdo do script:

```bash
#!/bin/bash
# Backup automático de mídia

BACKUP_DIR="/root/backups"
MEDIA_DIR="/var/www/media"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Criar backup compactado
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz $MEDIA_DIR

# Manter apenas últimos 7 backups
ls -t $BACKUP_DIR/media_backup_*.tar.gz | tail -n +8 | xargs rm -f

echo "Backup concluído: media_backup_$DATE.tar.gz"
```

Tornar executável e agendar:

```bash
# Tornar executável
chmod +x /root/backup-media.sh

# Agendar com cron (todo dia às 2h da manhã)
crontab -e

# Adicionar linha:
0 2 * * * /root/backup-media.sh >> /var/log/backup-media.log 2>&1
```

---

## 📋 Checklist Final

- [ ] Sistema atualizado
- [ ] Diretórios criados (`/var/www/media/`)
- [ ] Subdomínio configurado (DNS)
- [ ] SSL/HTTPS ativado
- [ ] nginx configurado com CORS
- [ ] Arquivos de teste enviados
- [ ] Streaming testado e funcionando
- [ ] Firewall configurado
- [ ] Backup automático agendado
- [ ] Logs sendo monitorados

---

## 🆘 Troubleshooting

### "Connection refused" ao acessar
→ Verifique se nginx está rodando: `systemctl status nginx`

### "404 Not Found"
→ Verifique permissões: `ls -la /var/www/media/hinos/`

### "CORS error" no frontend
→ Verifique headers nginx: `curl -I http://203.161.46.119/hinos/teste.mp3`

### Áudio não toca no navegador
→ Verifique Content-Type: deve ser `audio/mpeg` ou `video/mp4`

---

## 📞 Suporte

Se tiver dúvidas em algum passo, me avise e vou te ajudar! 🚀

**Próximo passo**: Atualizar frontend para usar URLs da VPS.
