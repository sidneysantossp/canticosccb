# Script para adicionar exports genéricos em todos os stubs

$files = Get-ChildItem -Path "src\lib\admin\*AdminApi.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Adicionar exports genéricos se não existirem
    $genericExports = @"
export const getSiteSettings = async (...args: any[]) => ({});
export const updateSiteSettings = async (...args: any[]) => ({ success: true });
export const getComments = async (...args: any[]) => [];
export const deleteComment = async (...args: any[]) => ({ success: true });
export const approv Comment = async (...args: any[]) => ({ success: true });
export const getClaims = async (...args: any[]) => [];
export const getCopyrightClaims = async (...args: any[]) => [];
export const updateClaim = async (...args: any[]) => ({ success: true });
export const getRoyalties = async (...args: any[]) => [];
export const processPayment = async (...args: any[]) => ({ success: true });
export const getAllPlaylists = async (...args: any[]) => [];
export const createPlaylist = async (...args: any[]) => ({ success: true });
export const updatePlaylist = async (...args: any[]) => ({ success: true });
export const deletePlaylist = async (...args: any[]) => ({ success: true });
export type SiteSettings = any;
export type Comment = any;
export type Claim = any;
export type CopyrightClaim = any;
export type Royalty = any;
export type Playlist = any;
"@
    
    # Append se o arquivo não tiver essas exportações
    if ($content -notmatch "getSiteSettings") {
        Add-Content -Path $file.FullName -Value $genericExports
        Write-Host "Updated: $($file.Name)"
    }
}

Write-Host "Done! All API files updated."
