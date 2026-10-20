@echo off
cd /d "%~dp0\.."
echo Membuat cadangan basis data...
node -e "import('./src/tugas/cadangan-harian.js').then(m => m.cadangkanBasisData())"
echo Selesai.
pause
