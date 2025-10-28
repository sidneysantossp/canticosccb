$stubs = @(
    "admin/bannersAdminApi",
    "admin/albumsAdminApi",
    "admin/playlistsAdminApi",
    "admin/featuredAdminApi",
    "admin/collectionsAdminApi",
    "admin/campaignsAdminApi",
    "admin/promotionsAdminApi",
    "admin/couponsAdminApi",
    "admin/analyticsAdminApi",
    "admin/reportsAdminApi",
    "admin/commentsAdminApi",
    "admin/copyrightAdminApi",
    "admin/royaltiesAdminApi",
    "admin/settingsAdminApi",
    "admin/seoAdminApi",
    "admin/menusAdminApi",
    "admin/themeAdminApi",
    "admin/logosAdminApi",
    "admin/backupAdminApi",
    "admin/importAdminApi",
    "admin/exportAdminApi",
    "admin/apiAdminApi",
    "admin/bibleAdminApi"
)

$stubContent = @"
// STUB temporário - Substituir com implementação real quando backend estiver pronto
export const getAll = async (...args: any[]) => [];
export const getById = async (...args: any[]) => null;
export const create = async (...args: any[]) => ({ success: true });
export const update = async (...args: any[]) => ({ success: true });
export const deleteItem = async (...args: any[]) => ({ success: true });
"@

foreach ($stub in $stubs) {
    $filePath = "src\lib\$stub.ts"
    New-Item -ItemType File -Path $filePath -Force | Out-Null
    Set-Content -Path $filePath -Value $stubContent
    Write-Host "Created: $filePath"
}

Write-Host "All stubs created!"
