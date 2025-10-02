@echo off
chcp 65001 >nul
title 📥 Git Pull – ioBroker Skripte

cd /d "D:\Github\ioBroker\Skripte"

echo =====================================================
echo 📥 Git Pull Automatisierung – ioBroker Skripte
echo =====================================================

echo.
echo 🔄 Hole neueste Änderungen von GitHub...
git pull --rebase

echo.
echo ✅ Fertig! Dein lokales Repository ist jetzt auf dem neuesten Stand.
echo =====================================================

pause
