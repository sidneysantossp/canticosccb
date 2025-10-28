$settingsStubs = @(
    "usersSettingsApi",
    "composersSettingsApi",
    "premiumSettingsApi",
    "emailSettingsApi",
    "securitySettingsApi",
    "integrationsSettingsApi"
)

$stubContent = @"
// STUB temporário
export const getSettings = async () => ({});
export const updateSettings = async (...args: any[]) => ({ success: true });
export const resetSettings = async () => ({ success: true });
export type Settings = any;
"@

foreach ($stub in $settingsStubs) {
    $filePath = "src\lib\admin\$stub.ts"
    New-Item -ItemType File -Path $filePath -Force | Out-Null
    Set-Content -Path $filePath -Value $stubContent
    Write-Host "Created: $filePath"
}

Write-Host "All settings stubs created!"
