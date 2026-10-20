@echo off
echo =========================================================================
echo   PANDUAN PEMASANGAN SILAPURWA SEBAGAI WINDOWS SERVICE (NSSM)
echo =========================================================================
echo.
echo 1. Unduh nssm.exe dari https://nssm.cc/download atau salin nssm.exe ke folder ini.
echo 2. Buka Command Prompt / PowerShell sebagai Administrator.
echo 3. Jalankan perintah berikut:
echo.
echo    nssm.exe install Silapurwa "C:\Program Files\nodejs\node.exe" "C:\Users\kamtib\silapurwa\src\index.js"
echo    nssm.exe set Silapurwa AppDirectory "C:\Users\kamtib\silapurwa"
echo    nssm.exe set Silapurwa AppRestartDelay 5000
echo    nssm.exe set Silapurwa Start SERVICE_AUTO_START
echo    nssm.exe start Silapurwa
echo.
echo Layanan akan berjalan otomatis saat Windows menyala tanpa perlu login user.
echo =========================================================================
pause
