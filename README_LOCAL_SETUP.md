# Local LLM Setup Guide

It appears you are running **Python 3.12**, which has compatibility issues with the `ctransformers` library used for local models (causing it to hang indefinitely).

## Recommended Solution: Use Ollama

The most robust way to run local models on Windows is using **Ollama**. It runs as a separate service and avoids Python dependency issues.

### 1. Install Ollama
Download and install Ollama from the official website:
**[https://ollama.com/download/windows](https://ollama.com/download/windows)**

### 2. Pull a Model
Open your terminal (PowerShell or Command Prompt) and run:
```powershell
ollama pull mistral
```
(You can also use `llama2`, `gemma`, etc.)

### 3. Configure the App
The application is already configured to support Ollama.
In your `.env` file, set:
```ini
LLM_PROVIDER=ollama
EMAIL_GEN_MODEL=mistral
```

### 4. Run the App
Restart your backend server:
```powershell
python -m uvicorn backend.app:app --reload --port 8000
```

## Alternative: Python 3.10/3.11
If you strictly want to use the embedded `ctransformers` library, you would need to downgrade your Python version to 3.10 or 3.11, as pre-built binaries for 3.12 are not yet stable for this library.
