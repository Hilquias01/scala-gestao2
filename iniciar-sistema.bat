@echo off
ECHO Iniciando o servidor Backend...
cd backend
START "Backend - Scala Gestao" cmd /k npm run dev

ECHO Iniciando o servidor Frontend...
cd ../frontend
START "Frontend - Scala Gestao" cmd /k npm run dev

ECHO Aguardando 7 segundos para os servidores iniciarem...
:: Este comando cria uma pausa de 7 segundos
TIMEOUT /T 7 /NOBREAK > nul

ECHO Abrindo a aplicacao no navegador...
:: Este comando abre a URL no seu navegador padrão
START http://localhost:5173/