#!/bin/bash
# Script de despliegue para VPS Minerva
# Ejecutar con: bash deploy.sh

echo "🚀 Iniciando despliegue a VPS..."

# Conectar al VPS y ejecutar comandos
ssh ubuntu@51.195.109.26 << 'ENDSSH'
    echo "📦 Navegando al directorio del proyecto..."
    cd /var/www/portal

    echo "⬇️  Descargando últimos cambios de GitHub..."
    git pull origin main

    echo "📚 Instalando dependencias del backend..."
    cd server
    npm install

    echo "🗄️  Ejecutando migración de base de datos..."
    npx prisma migrate deploy

    echo "🔄 Regenerando cliente de Prisma..."
    npx prisma generate

    echo "🔨 Compilando código TypeScript..."
    npm run build

    echo "♻️  Reiniciando servidor con PM2..."
    pm2 restart portal-api

    echo "✅ Verificando estado del servidor..."
    pm2 status

    echo "📋 Mostrando logs recientes..."
    pm2 logs portal-api --lines 20 --nostream

    echo "🏥 Verificando salud del API..."
    curl -s http://localhost:3001/api/health | jq '.'

    echo ""
    echo "✨ Despliegue completado!"
ENDSSH

echo ""
echo "🎉 Proceso de despliegue finalizado"
