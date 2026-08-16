# ModelDock USB: Complete Deployment & Launcher Guide

**ModelDock USB** is a portable, local-first LLM command center that runs entirely from removable flash storage. This guide walks you through formatting your USB drive, installing Llama binaries, downloading GGUF models from Hugging Face, configuring the custom `.eye` format, and generating the batch launch script.

---

## Step 1: Formatting Your USB Drive to exFAT

To ensure cross-platform compatibility (Windows, macOS, Linux) and support for large model files exceeding 4GB, your USB drive must be formatted to **exFAT**.

### On Windows:
1. Insert your USB flash drive into an available USB port.
2. Open **File Explorer** and click on **This PC**.
3. Right-click your USB drive and select **Format...**
4. In the File System dropdown, choose **exFAT** (Allocation unit size: Default).
5. Enter a volume label (e.g., `MODELDOCK`).
6. Ensure **Quick Format** is checked, then click **Start** and confirm.

### On macOS:
1. Open **Disk Utility** (via Spotlight or Applications > Utilities).
2. Select your USB drive from the left sidebar (select the parent physical disk, not just the volume).
3. Click the **Erase** button at the top toolbar.
4. Set the Format to **ExFAT**.
5. Click **Erase** to complete formatting.

---

## Step 2: Setting Up the Directory Structure

Create the following folder hierarchy on the root of your USB drive (`E:\` or `/Volumes/MODELDOCK/`):

```text
MODELDOCK/
├── bin/
│   └── llama-cpp/       # Llama runtime binaries
├── models/              # GGUF models (.eye extension)
├── workflows/           # Local JSON workflow state
└── launch_modeldock.bat # Master launcher script
```

---

## Step 3: Downloading Llama Binaries

1. Navigate to the official [llama.cpp releases page on GitHub](https://github.com/ggml-org/llama.cpp/releases).
2. Download the latest pre-compiled build for your target OS (e.g., `llama-bXXXX-bin-win-avx2-x64.zip` for Windows).
3. Extract the contents into `bin/llama-cpp/` on your USB drive. Ensure `llama-cli.exe` and `llama-server.exe` are located directly inside `bin/llama-cpp/`.

---

## Step 4: Downloading a Model from Hugging Face & Converting to `.eye`

ModelDock USB uses a portable extension convention (`.eye`) for local weights to streamline inspection and sandboxing.

1. Visit [Hugging Face](https://huggingface.co/) and search for a GGUF model (e.g., `Llama-3-8B-Instruct-GGUF` or `Mistral-7B-Instruct-v0.3-GGUF`).
2. Download a quantized GGUF file (e.g., `llama-3-8b-instruct.Q4_K_M.gguf`).
3. Move the downloaded file into your USB's `models/` folder.
4. **Rename the file extension from `.gguf` to `.eye`** (e.g., `llama-3-8b-instruct.Q4_K_M.eye`). This signals to ModelDock's engine that the weight file has passed local schema validation and is ready for secure offline mounting.

---

## Step 5: Creating the Batch Launch Script (`launch_modeldock.bat`)

Create a file named `launch_modeldock.bat` on the root of your USB drive. This script dynamically resolves the USB drive letter, configures local environment paths, boots the llama-server inference engine, and mounts your `.eye` model.

```bat
@echo off
TITLE ModelDock USB - Local LLM Command Center
COLOR 0A

echo ========================================================
echo          MODEL-DOCK USB: PORTABLE LLM RUNTIME          
echo ========================================================

:: Resolve USB root directory dynamically
set "USB_ROOT=%~d0"
echo [INFO] Detected USB Drive Root: %USB_ROOT%

set "BIN_DIR=%USB_ROOT%\bin\llama-cpp"
set "MODEL_DIR=%USB_ROOT%\models"
set "MODEL_FILE=%MODEL_DIR%\llama-3-8b-instruct.Q4_K_M.eye"

:: Verify runtime binaries
if not exist "%BIN_DIR%\llama-server.exe" (
    echo [ERROR] llama-server.exe not found in %BIN_DIR%!
    pause
    exit /b 1
)

:: Verify model existence
if not exist "%MODEL_FILE%" (
    echo [ERROR] Target .eye model file not found at %MODEL_FILE%!
    pause
    exit /b 1
)

echo [INFO] Initializing ModelDock Inference Server...
echo [INFO] Mounting Model: %MODEL_FILE%
echo [INFO] Port: 8080 | Context Window: 4096

:: Launch llama-server pointing to the .eye model
"%BIN_DIR%\llama-server.exe" ^
    -m "%MODEL_FILE%" ^
    --port 8080 ^
    -c 4096 ^
    --n-gpu-layers 33

pause
```

---

## Step 6: Launching Your Portable AI Command Center

1. Double-click `launch_modeldock.bat` on your USB drive.
2. The terminal will initialize the local inference server on `http://localhost:8080`.
3. Open your browser or connect your local agent workflows to access your fully air-gapped, portable AI command center!
