@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Prospects Haute-Marne

echo Recherche de mises a jour...
git pull --ff-only -q

echo Installation des composants...
call npm.cmd install --silent
if errorlevel 1 goto erreur

if exist .env goto netlify
echo.
echo Premiere configuration : vos cles restent sur cet ordinateur, dans le fichier .env
set /p GKEY=Collez votre cle Google Places (clic droit pour coller) puis Entree : 
set /p AKEY=Collez votre cle Anthropic (sk-ant-...) puis Entree : 
(echo GOOGLE_PLACES_API_KEY=%GKEY%& echo ANTHROPIC_API_KEY=%AKEY%& echo GOOGLE_LIMIT=30& echo PORT=3000)> .env

:netlify
findstr /b /c:"NETLIFY_TOKEN=" .env >nul
if not errorlevel 1 goto demarrer
echo.
echo Publication en ligne (facultatif) : collez votre jeton Netlify, ou appuyez sur Entree pour passer.
set NKEY=
set /p NKEY=Jeton Netlify : 
(echo NETLIFY_TOKEN=%NKEY%)>> .env

:demarrer
echo.
echo Interface sur http://localhost:3000  -  laissez cette fenetre ouverte, fermez-la pour arreter.
start "" cmd /c "timeout /t 2 >nul & start http://localhost:3000"
call npm.cmd start
goto fin

:erreur
echo.
echo Echec de l'installation. Verifiez que Node.js est installe (https://nodejs.org) puis relancez.

:fin
pause
