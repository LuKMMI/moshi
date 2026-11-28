@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Prospects Haute-Marne

if exist node_modules goto config
echo Installation des composants (une seule fois)...
call npm.cmd install
if errorlevel 1 goto erreur

:config
if exist .env goto collecte
echo.
echo Premiere configuration : vos cles restent sur cet ordinateur, dans le fichier .env
set /p GKEY=Collez votre cle Google Places (clic droit pour coller) puis Entree : 
set /p AKEY=Collez votre cle Anthropic (sk-ant-...) puis Entree : 
(echo GOOGLE_PLACES_API_KEY=%GKEY%& echo ANTHROPIC_API_KEY=%AKEY%& echo GOOGLE_LIMIT=30& echo PORT=3000)> .env
echo Cles enregistrees.

:collecte
echo.
set CHOIX=N
set /p CHOIX=Mettre a jour la liste et verifier 30 commerces sur Google (gratuit) ? (O/N) : 
if /i "%CHOIX%"=="O" call npm.cmd run collect

:demarrer
echo.
echo Interface sur http://localhost:3000  -  fermez cette fenetre pour arreter.
start "" cmd /c "timeout /t 2 >nul & start http://localhost:3000"
call npm.cmd start
goto fin

:erreur
echo.
echo Echec de l'installation. Verifiez que Node.js est installe (https://nodejs.org) puis relancez.

:fin
pause
