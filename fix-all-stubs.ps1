$stubs = @{
    "admin/bannersAdminApi" = @("getAllBanners", "createBanner", "updateBanner", "deleteBanner", "Banner")
    "admin/genresAdminApi" = @("getAllGenres", "Genre")
    "admin/categoriesAdminApi" = @("getAllCategories", "Category")
}

foreach ($file in $stubs.Keys) {
    $functions = $stubs[$file]
    $exports = ""
    
    foreach ($func in $functions) {
        if ($func -match "^[A-Z]") {
            # É um tipo
            $exports += "export type $func = any;`n"
        } else {
            $exports += "export const $func = async (...args: any[]) => ({ success: true });`n"
        }
    }
    
    $content = "// STUB temporário`nexport const getAll = async (...args: any[]) => [];`nexport const getById = async (...args: any[]) => null;`nexport const create = async (...args: any[]) => ({ success: true });`nexport const update = async (...args: any[]) => ({ success: true });`nexport const deleteItem = async (...args: any[]) => ({ success: true });`n$exports"
    
    $filePath = "src\lib\$file.ts"
    Set-Content -Path $filePath -Value $content
    Write-Host "Updated: $filePath"
}

Write-Host "All stubs updated!"
