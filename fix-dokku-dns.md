# Solución: Configurar DNS en Dokku para acceder a Supabase

## Problema Identificado
El contenedor Docker de Dokku no puede resolver `db.vohlomomrskxnuksodmt.supabase.co`

## Soluciones por Prioridad

### Solución 1: Configurar DNS de Google en Docker (RECOMENDADO)

Ejecuta estos comandos **en el servidor Dokku** (no en tu máquina local):

```bash
# Conectarse al servidor
ssh <tu-usuario>@192.168.80.17

# Crear o editar la configuración de Docker daemon
sudo nano /etc/docker/daemon.json
```

Agrega o modifica el archivo para que contenga:

```json
{
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1"]
}
```

Luego reinicia Docker:

```bash
sudo systemctl restart docker

# Espera unos segundos y reinicia la app
dokku ps:restart nexopos
```

### Solución 2: Usar IP directa en lugar de dominio (TEMPORAL)

Si Supabase tiene una IP estática, puedes usarla temporalmente:

```bash
# Obtener la IP de Supabase
nslookup db.vohlomomrskxnuksodmt.supabase.co 8.8.8.8

# Configurar DATABASE_URL con la IP
# NOTA: Esto es temporal, Supabase puede cambiar IPs
dokku config:set nexopos DATABASE_URL="postgresql://postgres:WHsA3FfvLFDCzQqv@<IP_OBTENIDA>:5432/postgres"
```

⚠️ **ADVERTENCIA**: Usar IP directa no es recomendado porque Supabase puede cambiar sus IPs.

### Solución 3: Verificar y configurar resolv.conf del host

```bash
# En el servidor, verifica el archivo DNS
cat /etc/resolv.conf

# Si no tiene servidores DNS adecuados, edítalo:
sudo nano /etc/resolv.conf
```

Asegúrate de que contenga al menos:

```
nameserver 8.8.8.8
nameserver 8.8.4.4
```

**NOTA**: En sistemas con `systemd-resolved`, este archivo puede ser un enlace simbólico. En ese caso:

```bash
# Ver configuración actual
resolvectl status

# Configurar DNS globalmente
sudo nano /etc/systemd/resolved.conf
```

Agrega:

```ini
[Resolve]
DNS=8.8.8.8 8.8.4.4 1.1.1.1
FallbackDNS=1.0.0.1
```

Luego reinicia:

```bash
sudo systemctl restart systemd-resolved
```

### Solución 4: Verificar firewall y conectividad

```bash
# Verificar si hay firewall activo
sudo ufw status

# Si está bloqueando, permitir salida a Supabase
sudo ufw allow out 5432/tcp

# Probar conectividad directa al puerto
telnet db.vohlomomrskxnuksodmt.supabase.co 5432
# O con nc:
nc -zv db.vohlomomrskxnuksodmt.supabase.co 5432
```

### Solución 5: Configurar DNS específico para la app Dokku

```bash
# Configurar DNS solo para esta app
dokku docker-options:add nexopos build,deploy,run "--dns 8.8.8.8"
dokku docker-options:add nexopos build,deploy,run "--dns 8.8.4.4"

# Reconstruir y desplegar
dokku ps:rebuild nexopos
```

## Verificación

Después de aplicar cualquiera de las soluciones, verifica:

```bash
# Ver logs de la app
dokku logs nexopos -t

# Entrar al contenedor y probar DNS (cuando esté corriendo)
dokku enter nexopos
nslookup db.vohlomomrskxnuksodmt.supabase.co
exit
```

## Script de Diagnóstico Completo

Guarda este script como `diagnose.sh` y ejecútalo en el servidor:

```bash
#!/bin/bash
echo "=== Diagnóstico de DNS y Conectividad ==="
echo ""
echo "1. DNS del host:"
cat /etc/resolv.conf
echo ""
echo "2. Resolución desde host:"
nslookup db.vohlomomrskxnuksodmt.supabase.co
echo ""
echo "3. Ping a Google DNS:"
ping -c 3 8.8.8.8
echo ""
echo "4. Config de Docker:"
cat /etc/docker/daemon.json 2>/dev/null || echo "No existe daemon.json"
echo ""
echo "5. Estado de systemd-resolved:"
systemctl status systemd-resolved --no-pager
echo ""
echo "6. Conectividad al puerto 5432 de Supabase:"
timeout 5 bash -c 'cat < /dev/null > /dev/tcp/db.vohlomomrskxnuksodmt.supabase.co/5432' && echo "✅ Conectado" || echo "❌ No conecta"
```

```bash
chmod +x diagnose.sh
./diagnose.sh
```

## Orden Recomendado de Soluciones

1. **Primero**: Ejecuta el script de diagnóstico
2. **Segundo**: Aplica Solución 1 (DNS en Docker daemon)
3. **Si falla**: Aplica Solución 5 (DNS específico para la app)
4. **Si sigue fallando**: Verifica Solución 3 (resolv.conf del host)
5. **Último recurso**: Solución 2 (IP directa, solo temporal)

## Notas Importantes

- **No uses IP directa permanentemente**: Supabase puede cambiar IPs sin aviso
- **Reinicia Docker** después de cambiar daemon.json
- **Los cambios en resolv.conf pueden revertirse** al reiniciar si usas NetworkManager o systemd-resolved
- **Verifica que el servidor tenga acceso a Internet** antes de todo
