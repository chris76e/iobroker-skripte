@echo off
cd /d "D:\Github\ioBroker\Skripte"

echo 🔍 Git Status prüfen...
git status

echo.
echo 📁 Änderungen hinzufügen...
git add .

echo.
set /p msg=💬 Commit-Nachricht eingeben (z.B. 'Update Spülmaschine README'): 
if "%msg%"=="" set msg=🧰 Automatischer Commit

echo.
echo 💾 Commit erstellen: %msg%
git commit -m "%msg%"

echo.
echo 🚀 Änderungen auf GitHub hochladen...
git push

echo.
echo ✅ Fertig! Änderungen wurden erfolgreich übertragen.
pause
