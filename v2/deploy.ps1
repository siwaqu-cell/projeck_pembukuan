# ============================================================
# ServicePro HP v2 — Automated Deployment Script
# Menggunakan Google Apps Script CLI (clasp)
# ============================================================

# -- KONFIGURASI --
$PROJECT_NAME = "ServicePro HP v2"
$SOURCE_DIR = "."
$DEPLOY_DESC = "ServicePro HP v2 - Auto Deploy"

# -- WARNA --
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

# ============================================================
# STEP 1: VALIDASI CLASP
# ============================================================
Write-Info "Memeriksa clasp..."
$claspCheck = cmd /c "clasp --version 2>&1"
if ($LASTEXITCODE -ne 0) {
    Write-Err "clasp tidak ditemukan! Install dulu:"
    Write-Host "  npm install -g @google/clasp" -ForegroundColor White
    exit 1
}
Write-Ok "clasp v$claspCheck terdeteksi"

# ============================================================
# STEP 2: CEK LOGIN
# ============================================================
Write-Info "Memeriksa login status..."
$whoami = cmd /c "clasp whoami 2>&1" | Out-String
if ($whoami -match "not logged in" -or $whoami -match "Error" -or $LASTEXITCODE -ne 0) {
    Write-Warn "Kamu belum login ke Google. Menjalankan clasp login..."
    cmd /c "clasp login"
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Login gagal. Coba jalankan manual: clasp login"
        exit 1
    }
    Write-Ok "Login berhasil!"
} else {
    Write-Ok "Sudah login: $whoami"
}

# ============================================================
# STEP 3: CEK FILE .clasp.json
# ============================================================
if (-not (Test-Path ".clasp.json")) {
    Write-Info "File .clasp.json tidak ditemukan."
    Write-Info "Membuat project baru di Google Apps Script..."
    
    cmd /c "clasp create --type standalone --title `"$PROJECT_NAME`""
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Gagal membuat project. Coba manual:"
        Write-Host "  clasp create --type standalone --title `"$PROJECT_NAME`"" -ForegroundColor White
        exit 1
    }
    Write-Ok "Project baru dibuat!"
} else {
    Write-Ok ".clasp.json sudah ada, menggunakan project yang sama"
}

# ============================================================
# STEP 4: CEK FILE YANG AKAN DI-PUSH
# ============================================================
Write-Info "Mengecek file yang akan di-push..."

$gsFiles = Get-ChildItem -Path $SOURCE_DIR -Filter "*.gs" -File
$htmlFiles = Get-ChildItem -Path $SOURCE_DIR -Filter "*.html" -File
$ignoreFiles = @("code-review-servicepro.md", "CODE_REVIEW.md", "PANDUAN_SETUP_v2.md")

$totalFiles = ($gsFiles.Count) + ($htmlFiles.Count)
Write-Info "Ditemukan: $($gsFiles.Count) file .gs + $($htmlFiles.Count) file .html = $totalFiles file"

if ($totalFiles -eq 0) {
    Write-Err "Tidak ada file .gs atau .html ditemukan di: $SOURCE_DIR"
    exit 1
}

# ============================================================
# STEP 5: PUSH SEMUA FILE
# ============================================================
Write-Info "Pushing semua file ke Google Apps Script..."
Write-Host "  (ini akan menimpa semua file di project)" -ForegroundColor DarkGray

cmd /c "clasp push --force"
if ($LASTEXITCODE -ne 0) {
    Write-Err "Push gagal! Cek error di atas."
    exit 1
}
Write-Ok "Semua file berhasil di-push!"

# ============================================================
# STEP 6: SET SPREADSHEET ID
# ============================================================
Write-Info ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  SETUP DATABASE (Perlu 1 langkah manual)" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Info "File sudah di-push. Sekarang:"
Write-Host ""
Write-Host "  1. Buka Google Sheets (https://sheets.google.com)" -ForegroundColor White
Write-Host "  2. Buat spreadsheet baru, beri nama: ServicePro HP Database v2" -ForegroundColor White
Write-Host "  3. Copy Spreadsheet ID dari URL" -ForegroundColor White
Write-Host "  4. Jalankan perintah ini:" -ForegroundColor White
Write-Host ""
Write-Host "     clasp run setupAll" -ForegroundColor Green
Write-Host ""
Write-Host "  Atau buka Apps Script editor di browser dan jalankan setupAll()" -ForegroundColor White
Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow

# ============================================================
# STEP 7: DEPLOY SEBAGAI WEB APP
# ============================================================
Write-Info ""
Write-Host "Setelah setup selesai, deploy sebagai Web App:" -ForegroundColor White
Write-Host ""
Write-Host "  clasp deploy --description `"$DEPLOY_DESC`"" -ForegroundColor Green
Write-Host ""
Write-Host "Atau manual di editor: Deploy > New Deployment > Web App" -ForegroundColor White
Write-Host ""

Write-Ok "Deployment script selesai!"
