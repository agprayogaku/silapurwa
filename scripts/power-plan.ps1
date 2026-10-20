# =====================================================================
#  SILAPURWA — Konfigurasi Daya & Anti-Sleep (Windows)
#  Jalankan sebagai Administrator:  powershell -ExecutionPolicy Bypass -File .\scripts\power-plan.ps1
# =====================================================================

Write-Host "=== Konfigurasi Power Plan Anti-Sleep Silapurwa ===" -ForegroundColor Cyan

# 1. Aktifkan skema daya High Performance
$highPerf = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"
powercfg /setactive $highPerf
Write-Host "[OK] Power plan diatur ke High Performance."

# 2. Matikan sleep dan hibernate saat adaptor terpasang (AC)
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
powercfg /change disk-timeout-ac 0
powercfg /change monitor-timeout-ac 15
Write-Host "[OK] Sleep, hibernate, dan disk timeout dimatikan (mode AC)."

# 3. Matikan sleep juga saat memakai baterai (jika laptop)
powercfg /change standby-timeout-dc 0
powercfg /change hibernate-timeout-dc 0
Write-Host "[OK] Sleep dimatikan (mode DC/baterai)."

# 4. Izinkan bangun jaringan (Wake-on-LAN sederhana)
powercfg /setacvalueindex SCHEME_CURRENT SUB_NONE CONSOLELOCK 0 2>$null
Write-Host "[OK] Konfigurasi daya selesai."

Write-Host ""
Write-Host "CATATAN: Agar bot berjalan otomatis setelah reboot, pasang sebagai" -ForegroundColor Yellow
Write-Host "Windows Service menggunakan NSSM (lihat scripts\pasang-service.bat)." -ForegroundColor Yellow
