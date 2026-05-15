# Deploy Compapptition Frontend → Hostinger

> Frontend Angular bundle estático servido por Apache de Hostinger en `compapptition.com`. El backend vive aparte en Railway (`api.compapptition.com`).
>
> **Nota sobre datos sensibles.** Los valores reales (usuario FTP, email de la cuenta admin del sistema, IPs concretas) se han sustituido por _placeholders_ entre `<>`. Cualquier persona que vaya a redesplegar este frontend debe sustituirlos por los suyos antes de ejecutar los comandos.

## Pre-requisitos

- Cuenta Hostinger activa con plan compatible (Premium / Business / Cloud — todos sirven hosting estático).
- Dominio `compapptition.com` registrado y con DNS gestionable desde Hostinger (o externo apuntando a Hostinger).
- Acceso al **File Manager** del panel Hostinger o credenciales **FTP/SFTP**.

## 1. Build de producción (local)

```bash
cd <ruta-del-repo-clonado>
rm -rf dist
npm run build
```

Output esperado: `dist/compapptition-front-web/browser/` (~1.3 MB total).

Verificación rápida:
```bash
ls dist/compapptition-front-web/browser/.htaccess     # debe existir (6 KB)
ls dist/compapptition-front-web/browser/index.html    # debe existir
ls dist/compapptition-front-web/browser/manual-usuario.html  # debe existir
find dist/compapptition-front-web/browser/ -name "*.map" | wc -l  # debe ser 0 (sin source maps en prod)
```

## 2. Subida a Hostinger

### Opción A — File Manager (más simple, recomendada primera vez)

1. Panel Hostinger → tu dominio `compapptition.com` → **Administrar** → **File Manager**.
2. Entra a `public_html/`.
3. **Borra todo el contenido** existente (si hay un `default.php` o `index.html` placeholder de Hostinger).
4. **Sube** todos los archivos y carpetas que están dentro de `dist/compapptition-front-web/browser/`. Importante: subes el **contenido** de `browser/`, no la carpeta `browser/` en sí. La estructura final en Hostinger debe ser:
   ```
   public_html/
     index.html
     .htaccess
     manual-usuario.html
     favicon.ico
     chunk-XXXX.js
     chunk-XXXX.css
     assets/
     ...
   ```
5. Confirma que `.htaccess` aparece (algunos File Manager ocultan dotfiles por defecto; activa "Mostrar archivos ocultos").

### Opción B — FTP/SFTP (más rápido para deploys recurrentes)

```bash
# Credenciales FTP del panel Hostinger (Hosting → Avanzado → Cuentas FTP)
# No commitear estos valores reales — leerlos de un gestor de secretos o variables de entorno.
HOST=<host-ftp-hostinger>          # típicamente ftp.<tu-dominio>
USER=<usuario-ftp-hostinger>       # el panel lo genera con formato u########
PASS=<password-ftp-hostinger>

# Con lftp (instalable: pacman -S lftp en MSYS2 o desde el repo MinGW)
lftp -u "$USER","$PASS" "$HOST" -e "
  cd public_html;
  mirror -R --delete --verbose dist/compapptition-front-web/browser/ .;
  bye
"
```

(En el Bloque 5 del plan TFG, esto se automatiza con un workflow de GitHub Actions.)

## 3. Configurar DNS

Si el dominio se compró en Hostinger, los DNS apuntan automáticamente al hosting. Si no:

- Registro `A` `@` → IP del hosting Hostinger (la encuentras en panel).
- Registro `CNAME` `www` → `compapptition.com`.
- Registro `CNAME` `api` → `xxxxx.up.railway.app` (URL provisional Railway, cambiará al dominio custom).

## 4. SSL Let's Encrypt

Panel Hostinger → tu dominio → **SSL** → "Instalar SSL". Hostinger lo emite gratis con Let's Encrypt. Espera ~1-5 min.

Verifica con `https://compapptition.com` que el candado aparece y no hay warning.

**Importante**: el `.htaccess` añade `Strict-Transport-Security` con HSTS. Activa esto **solo cuando el SSL esté operativo**, sino los navegadores que ya hayan visitado el sitio quedarán bloqueados sin poder acceder por HTTP de fallback.

## 5. SPF + DKIM + DMARC (para email transaccional desde `no-reply@compapptition.com`)

En el panel DNS de Hostinger:

```
TXT @       "v=spf1 include:hostinger.com -all"
TXT default._domainkey  "v=DKIM1; k=rsa; p=<clave-publica-DKIM>"   # Hostinger genera esta clave en panel Email
TXT _dmarc  "v=DMARC1; p=quarantine; rua=mailto:contacto@marionaya.com"
```

(La clave DKIM la genera Hostinger en panel Email → Configuración → DKIM. Cópiala literalmente.)

Esto evita que Gmail mande los emails de la app a spam.

## 6. Verificación post-deploy

```bash
# Health check del SPA (debe devolver 200 + HTML)
curl -I https://compapptition.com

# Routing SPA (rutas Angular deben servir index.html, no 404)
curl -I https://compapptition.com/auth/login
curl -I https://compapptition.com/legal/privacidad
# Espera: 200 OK con Content-Type: text/html

# Manual usuario (asset estático, NO routing Angular)
curl -I https://compapptition.com/manual-usuario.html
# Espera: 200 OK, Content-Type: text/html, Content-Length ~37 KB

# Cabeceras de seguridad presentes
curl -I https://compapptition.com | grep -iE "strict-transport|x-frame|x-content|referrer|permissions"

# Backend Railway accesible y CORS abierto a este dominio
curl https://api.compapptition.com/actuator/health
# Espera: {"status":"UP"}
```

## 7. Smoke test funcional

Abre `https://compapptition.com` en navegador anónimo:

1. Carga la landing → OK.
2. Login con la cuenta del **administrador de sistema** (el email se define en `init-prod.sql`; la contraseña se genera con BCrypt _strength_ 12 y se guarda fuera del repo) → llega al dashboard.
3. Navega a `/app/admin/dashboard` → ve los 5 tiles del panel admin (Deportes, Tipos estadística, Usuarios, Tickets soporte, Logs).
4. Navega a `/app/tickets` → ve listado vacío (BD prod limpia).
5. Click en "Manual de usuario" del navbar dropdown → abre `manual-usuario.html` en pestaña nueva con tema claro.
6. Cierra sesión y abre `/legal/privacidad` → carga sin auth (página pública).

Si algo de esto falla, revisar logs Apache desde panel Hostinger → Avanzado → Logs.

## Re-deploys

Repetir pasos 1 y 2. Hostinger no cachea el bundle entre versiones, los `chunk-XXX.js` con hash distinto fuerzan recarga del navegador. El `.htaccess` mantiene `index.html` siempre revalidado para que la app abra siempre el bundle nuevo.

## Limpieza de cache navegador (si pruebas dan inconsistencias post-deploy)

- Chrome DevTools → Network → Disable cache → recargar.
- O hard reload con `Ctrl+Shift+R`.
- Si tras esto siguen los problemas, sospecha del `.htaccess` (puede haberse subido mal) o de cabeceras Hostinger.
