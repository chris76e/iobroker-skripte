@echo off
chcp 65001 >nul
title 📤 Git Push – ioBroker Skripte

cd /d "D:\Github\ioBroker\Skripte"

echo =====================================================
echo 📁 Git Push Automatisierung – ioBroker Skripte
echo =====================================================

:: 1️⃣ Lokale Repo aktualisieren
echo.
echo 🔄 Holen der neuesten Änderungen von GitHub...
git pull --rebase

:: 2️⃣ Status anzeigen
echo.
echo 🔍 Aktueller Git-Status:
git status

:: 3️⃣ Änderungen hinzufügen
echo.
echo 📦 Änderungen zur Staging-Area hinzufügen...
git add .

:: 4️⃣ Commit-Nachricht abfragen
echo.
set /p msg=✏️  Commit-Nachricht eingeben (z.B. "Update README"): 
if "%msg%"=="" set msg=📦 Automatischer Commit

:: 5️⃣ Commit erstellen
echo.
echo 💾 Erstelle Commit mit Nachricht: "%msg%"
git commit -m "%msg%"

:: 6️⃣ Änderungen pushen
echo.
echo 🚀 Änderungen werden auf GitHub hochgeladen...
git push

echo.
echo ✅ Fertig! Alle Änderungen wurden erfolgreich übertragen.
echo =====================================================

pause
