#!/bin/bash
# Script de diagnóstico de red para servidor Dokku

echo "=== Diagnóstico de Conectividad de Red para NexoPOS en Dokku ==="
echo ""

echo "1. Probando conectividad básica a Internet (Google DNS)..."
ping -c 3 8.8.8.8 2>&1

echo ""
echo "2. Probando resolución DNS de Google..."
nslookup google.com 2>&1

echo ""
echo "3. Probando resolución DNS de Supabase..."
nslookup db.vohlomomrskxnuksodmt.supabase.co 2>&1

echo ""
echo "4. Probando conectividad al puerto de PostgreSQL de Supabase..."
timeout 5 bash -c 'cat < /dev/null > /dev/tcp/db.vohlomomrskxnuksodmt.supabase.co/5432' 2>&1 && echo "✅ Puerto 5432 accesible" || echo "❌ Puerto 5432 no accesible"

echo ""
echo "5. Verificando servidores DNS configurados..."
cat /etc/resolv.conf 2>&1

echo ""
echo "6. Probando con curl si alcanza Supabase..."
curl -v --connect-timeout 5 https://db.vohlomomrskxnuksodmt.supabase.co 2>&1 | head -n 20

echo ""
echo "7. Verificando si Docker tiene acceso a DNS..."
docker run --rm alpine nslookup db.vohlomomrskxnuksodmt.supabase.co 2>&1

echo ""
echo "8. Verificando configuración de red de Docker..."
docker network inspect bridge 2>&1 | grep -A 5 "IPAM"

echo ""
echo "=== Fin del diagnóstico ==="
