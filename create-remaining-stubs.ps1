$remainingStubs = @(
    "admin/logsAdminApi",
    "admin/notificationsAdminApi",
    "composerApi",
    "uploadHelpers",
    "playlistsApi",
    "userApi",
    "searchApi",
    "categoriesApi",
    "trendsApi"
)

$stubContent = @"
// STUB temporário
export const getAll = async (...args: any[]) => [];
export const getById = async (...args: any[]) => null;
export const create = async (...args: any[]) => ({ success: true });
export const update = async (...args: any[]) => ({ success: true });
export const deleteItem = async (...args: any[]) => ({ success: true });
"@

foreach ($stub in $remainingStubs) {
    $filePath = "src\lib\$stub.ts"
    New-Item -ItemType File -Path $filePath -Force | Out-Null
    Set-Content -Path $filePath -Value $stubContent
    Write-Host "Created: $filePath"
}

Write-Host "All remaining stubs created!"
