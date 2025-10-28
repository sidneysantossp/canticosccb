# Criar pasta documents se não existir
$docsPath = "media_protegida\documents"

if (!(Test-Path $docsPath)) {
    New-Item -ItemType Directory -Path $docsPath -Force | Out-Null
    Write-Host "✅ Pasta criada: $docsPath"
} else {
    Write-Host "✅ Pasta já existe: $docsPath"
}

# Criar imagem SVG de teste
$svgContent = @"
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#f8f9fa"/>
  <rect x="50" y="50" width="700" height="500" fill="white" stroke="#dee2e6" stroke-width="2"/>
  
  <!-- Header -->
  <rect x="50" y="50" width="700" height="80" fill="#e9ecef"/>
  <text x="400" y="100" text-anchor="middle" font-family="Arial" font-size="28" font-weight="bold" fill="#212529">
    REPÚBLICA FEDERATIVA DO BRASIL
  </text>
  
  <!-- Title -->
  <text x="400" y="170" text-anchor="middle" font-family="Arial" font-size="36" font-weight="bold" fill="#0d6efd">
    REGISTRO GERAL - RG
  </text>
  
  <!-- Document Number -->
  <text x="100" y="240" font-family="Arial" font-size="18" fill="#495057">
    Nº: 12.345.678-9
  </text>
  
  <!-- Name -->
  <text x="100" y="290" font-family="Arial" font-size="16" fill="#6c757d">
    Nome:
  </text>
  <text x="100" y="320" font-family="Arial" font-size="22" font-weight="bold" fill="#212529">
    ACERVO CÂNTICOS CCB
  </text>
  
  <!-- Birth Date -->
  <text x="100" y="370" font-family="Arial" font-size="16" fill="#6c757d">
    Data de Nascimento: 01/01/2000
  </text>
  
  <!-- CPF -->
  <text x="100" y="410" font-family="Arial" font-size="16" fill="#6c757d">
    CPF: 123.456.789-00
  </text>
  
  <!-- Footer -->
  <text x="400" y="520" text-anchor="middle" font-family="Arial" font-size="14" fill="#adb5bd">
    DOCUMENTO DE TESTE - APENAS PARA VALIDAÇÃO
  </text>
</svg>
"@

$svgPath = "$docsPath\test-rg.jpg"
Set-Content -Path $svgPath -Value $svgContent -Encoding UTF8
Write-Host "✅ Imagem de teste criada: $svgPath"

Write-Host ""
Write-Host "Estrutura completa criada com sucesso!"
Write-Host "Agora execute o SQL para atualizar o banco de dados."
