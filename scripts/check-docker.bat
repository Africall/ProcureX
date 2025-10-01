@echo off
setlocal enabledelayedexpansion

echo 🐳 Checking Docker Desktop status...

:: Check if Docker is running by trying to get Docker info
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Desktop is not running or not accessible
    echo.
    echo To start Docker Desktop:
    echo   • Open Docker Desktop from Start Menu
    echo   • Wait for "Docker Desktop is running" in system tray
    echo   • Ensure Docker Engine is started
    echo.
    echo After starting Docker Desktop, wait for it to be ready and try again.
    pause
    exit /b 1
) else (
    echo ✅ Docker Desktop is running
)

:: Check Docker Compose availability
docker compose version > nul 2>&1
if %errorlevel% neq 0 (
    docker-compose --version > nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Docker Compose is not available
        echo Please ensure Docker Desktop is properly installed with Compose support
        pause
        exit /b 1
    ) else (
        echo ℹ️  Using legacy docker-compose command
        set COMPOSE_CMD=docker-compose
    )
) else (
    echo ✅ Docker Compose is available
    set COMPOSE_CMD=docker compose
)

:: Show Docker version info
echo.
echo 📋 Docker Environment:
for /f "tokens=*" %%i in ('docker version --format "Client: {{.Client.Version}}"') do echo %%i
for /f "tokens=*" %%i in ('docker version --format "Server: {{.Server.Version}}"') do echo %%i
echo.

:: If arguments provided, execute the command
if "%~1" neq "" (
    echo 🚀 Executing: %*
    %*
) else (
    echo ✅ Docker Desktop is ready for use!
    echo.
    echo Available commands:
    echo   scripts\check-docker.bat docker compose up
    echo   scripts\check-docker.bat docker compose build  
    echo   scripts\check-docker.bat docker compose down
    echo   scripts\check-docker.bat docker ps
    pause
)
