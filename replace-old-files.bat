@echo off
echo Substituindo arquivos antigos...

REM Backup dos arquivos antigos
if exist "src\pages\admin\AdminPlaylists.tsx" (
    echo Fazendo backup de AdminPlaylists.tsx...
    move "src\pages\admin\AdminPlaylists.tsx" "src\pages\admin\AdminPlaylists.tsx.backup"
)

if exist "src\pages\admin\AdminBanners.tsx" (
    echo Fazendo backup de AdminBanners.tsx...
    move "src\pages\admin\AdminBanners.tsx" "src\pages\admin\AdminBanners.tsx.backup"
)

REM Renomear arquivos novos
if exist "src\pages\admin\playlists\AdminPlaylistsNew.tsx" (
    echo Ativando novo AdminPlaylists...
    move "src\pages\admin\playlists\AdminPlaylistsNew.tsx" "src\pages\admin\playlists\AdminPlaylists.tsx"
)

if exist "src\pages\admin\AdminBannersNew.tsx" (
    echo Ativando novo AdminBanners...
    move "src\pages\admin\AdminBannersNew.tsx" "src\pages\admin\AdminBanners.tsx"
)

echo.
echo ✅ Arquivos substituídos com sucesso!
echo.
echo Backups criados:
echo - AdminPlaylists.tsx.backup
echo - AdminBanners.tsx.backup
echo.
pause
