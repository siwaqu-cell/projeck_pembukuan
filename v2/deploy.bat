@echo off
REM ============================================================
REM ServicePro HP v2 — Quick Deploy (Double-click to run)
REM ============================================================
echo.
echo  ============================================
echo   ServicePro HP v2 — Auto Deploy
echo  ============================================
echo.
echo  Step 1: Login ke Google (jika belum)
clasp whoami >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  Kamu belum login. Membuka browser untuk login...
    clasp login
    if %ERRORLEVEL% neq 0 (
        echo  LOGIN GAGAL. Coba manual: clasp login
        pause
        exit /b 1
    )
)
echo  Sudah login.
echo.

echo  Step 2: Buat project baru (jika belum ada)
if not exist ".clasp.json" (
    echo  Membuat project baru...
    clasp create --type standalone --title "ServicePro HP v2"
    if %ERRORLEVEL% neq 0 (
        echo  Gagal membuat project!
        pause
        exit /b 1
    )
) else (
    echo  Project sudah ada.
)
echo.

echo  Step 3: Push semua file ke Google...
clasp push --force
if %ERRORLEVEL% neq 0 (
    echo  PUSH GAGAL!
    pause
    exit /b 1
)
echo.

echo  ============================================
echo   BERHASIL! Semua file sudah di Google.
echo  ============================================
echo.
echo  LANGKAH SELANJUTNYA:
echo.
echo  1. Buka https://sheets.google.com
echo  2. Buat spreadsheet baru: "ServicePro HP Database v2"
echo  3. Copy Spreadsheet ID dari URL
echo  4. Buka Apps Script editor di browser
echo  5. Project Settings ^> Script Properties
echo  6. Tambah: SS_ID = [paste Spreadsheet ID]
echo  7. Jalankan fungsi: setupAll
echo  8. Deploy: Deploy ^> New Deployment ^> Web App
echo.
pause
