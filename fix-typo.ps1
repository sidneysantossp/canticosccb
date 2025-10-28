$files = Get-ChildItem -Path "src\lib\admin\*AdminApi.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $content = $content -replace 'export const approv Comment', 'export const approveComment'
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Fixed: $($file.Name)"
}

Write-Host "Done!"
