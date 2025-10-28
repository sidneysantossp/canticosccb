@echo off
echo Criando estrutura de pastas para documentos...

:: Criar pasta documents em media_protegida
if not exist "media_protegida\documents" (
    mkdir "media_protegida\documents"
    echo Pasta media_protegida\documents criada!
) else (
    echo Pasta media_protegida\documents ja existe.
)

:: Criar arquivo de teste (imagem SVG simples)
echo ^<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"^> > "media_protegida\documents\test-rg.jpg"
echo   ^<rect width="800" height="600" fill="#f0f0f0"/^> >> "media_protegida\documents\test-rg.jpg"
echo   ^<text x="400" y="300" text-anchor="middle" font-size="24" fill="#333"^>DOCUMENTO DE TESTE - RG^</text^> >> "media_protegida\documents\test-rg.jpg"
echo   ^<text x="400" y="350" text-anchor="middle" font-size="18" fill="#666"^>Nome: Acervo Canticos CCB^</text^> >> "media_protegida\documents\test-rg.jpg"
echo ^</svg^> >> "media_protegida\documents\test-rg.jpg"

echo.
echo Estrutura criada com sucesso!
echo Pasta: media_protegida\documents
echo Arquivo de teste: test-rg.jpg
echo.
pause
