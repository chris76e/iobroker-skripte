@echo off
chcp 65001 >nul
title 📥 Git Pull Automatisierung – ioBroker Skripte

echo =====================================================
echo 📥 Git Pull Automatisierung – ioBroker Skripte
echo =====================================================

echo.
echo 🔄 Änderungen von GitHub abrufen und lokalen Stand aktualisieren...

:: ✅ Holt Änderungen, versucht Rebase für saubere History
git pull --rebase

echo.
echo 🔍 Aktueller Git-Status:
git status

echo.
echo ✅ Lokales Repository ist aktuell!
echo =====================================================
pause
