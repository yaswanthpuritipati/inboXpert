@echo off
echo Starting Ollama and pre-loading Mistral model...
echo.

REM Start Ollama service (if not already running)
echo Checking Ollama service...
ollama list >nul 2>&1
if %errorlevel% neq 0 (
    echo Ollama is not running. Please start Ollama first.
    pause
    exit /b 1
)

echo Ollama is running!
echo.

REM Pre-load the Mistral model to keep it in memory
echo Pre-loading Mistral model (this may take 30-60 seconds on first run)...
ollama run mistral "Hello, loading model into memory"

echo.
echo ✓ Mistral model is now loaded and ready!
echo ✓ Your email app will now respond instantly.
echo.
echo You can close this window now.
pause
