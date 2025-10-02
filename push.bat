@echo off
chcp 65001 >nul
title 📤 Git Push Automatisierung – ioBroker Skripte

echo =====================================================
echo 📤 Git Push Automatisierung – ioBroker Skripte
echo =====================================================
echo.

:: 🔄 Neueste Änderungen holen
echo 🔄 Holen der neuesten Änderungen von GitHub...
git pull origin main
echo.

:: 📦 Änderungen zur Staging-Area hinzufügen (.bat-Dateien werden danach entfernt)
echo 📦 Änderungen zur Staging-Area hinzufügen...
git add .
git reset push.bat 2>nul
git reset pull.bat 2>nul
echo.

:: ✏️ Commit-Nachricht abfragen
set /p msg=✏️  Commit-Nachricht eingeben (z.B. "Update README"): 
if "%msg%"=="" set msg=📦 Automatischer Commit

echo.
echo 💾 Erstelle Commit mit Nachricht: "%msg%"
git commit -m "%msg%"
echo.

:: 🚀 Änderungen pushen
echo 🚀 Änderungen werden auf GitHub hochgeladen...
git push origin main
echo.

echo ✅ Fertig! Alle Änderungen wurden erfolgreich übertragen.
echo =====================================================
pause
