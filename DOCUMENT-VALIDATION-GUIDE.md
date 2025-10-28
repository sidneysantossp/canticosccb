# 📋 GUIA COMPLETO: VALIDAÇÃO DE DOCUMENTOS COM OCR

## 🎯 **OBJETIVO**
Validar automaticamente documentos (RG, CPF, CNH, Passaporte) verificando:
1. ✅ Se a imagem é realmente um documento válido
2. ✅ Se o nome no documento corresponde ao nome cadastrado
3. ✅ Se o tipo de documento está correto

---

## 🔧 **SOLUÇÕES DISPONÍVEIS**

### **1. Tesseract OCR (RECOMENDADO para começar)** ⭐

**Vantagens:**
- ✅ 100% Gratuito e Open Source
- ✅ Roda no seu servidor (self-hosted)
- ✅ Suporte a português
- ✅ Integração fácil com PHP
- ✅ Sem limites de uso

**Desvantagens:**
- ⚠️ Precisão 70-85% (depende da qualidade da foto)
- ⚠️ Requer instalação no servidor
- ⚠️ Não detecta automaticamente o tipo de documento

**Custo:** $0/mês

---

### **2. DocTR (Deep Learning OCR)** 🚀

**Vantagens:**
- ✅ Precisão 85-95%
- ✅ Open Source
- ✅ Detecta orientação automaticamente
- ✅ Self-hosted

**Desvantagens:**
- ⚠️ Requer Python no servidor
- ⚠️ Mais complexo de configurar
- ⚠️ Consome mais recursos (CPU/GPU)

**Custo:** $0/mês

---

### **3. Mindee API** 💳

**Vantagens:**
- ✅ Precisão 95%+
- ✅ API simples (REST)
- ✅ Detecta tipo de documento automaticamente
- ✅ Extrai campos estruturados

**Desvantagens:**
- ⚠️ Serviço externo (depende de API)
- ⚠️ Limite gratuito: 250 documentos/mês
- ⚠️ Acima do limite: pago

**Custo:** Gratuito até 250 docs/mês, depois $0.10 por documento

---

### **4. AWS Textract** 💰

**Vantagens:**
- ✅ Precisão 98%+
- ✅ Infraestrutura AWS
- ✅ Detecta campos automaticamente
- ✅ Suporta documentos complexos

**Desvantagens:**
- ⚠️ Totalmente pago
- ⚠️ Requer conta AWS
- ⚠️ Mais caro

**Custo:** $1.50 por 1000 páginas

---

## 📦 **INSTALAÇÃO: TESSERACT OCR**

### **Windows (XAMPP)**

1. **Baixar Tesseract:**
   - Acesse: https://github.com/UB-Mannheim/tesseract/wiki
   - Baixe: `tesseract-ocr-w64-setup-5.x.x.exe`

2. **Instalar:**
   ```
   - Execute o instalador
   - Caminho padrão: C:\Program Files\Tesseract-OCR
   - ✅ Marque "Additional language data (download)"
   - ✅ Selecione "Portuguese" na lista
   ```

3. **Adicionar ao PATH:**
   ```
   - Painel de Controle → Sistema → Configurações avançadas
   - Variáveis de Ambiente
   - Path → Editar → Novo
   - Adicionar: C:\Program Files\Tesseract-OCR
   ```

4. **Testar instalação:**
   ```bash
   tesseract --version
   # Deve mostrar: tesseract 5.x.x
   ```

### **Linux (Ubuntu/Debian)**

```bash
# Atualizar repositórios
sudo apt-get update

# Instalar Tesseract + idioma português
sudo apt-get install tesseract-ocr tesseract-ocr-por

# Testar instalação
tesseract --version
```

### **macOS**

```bash
# Instalar via Homebrew
brew install tesseract tesseract-lang

# Testar instalação
tesseract --version
```

---

## 🔧 **CONFIGURAÇÃO NO PROJETO**

### **1. Criar pasta de uploads temporários**

```bash
cd c:\xampp\htdocs\1canticosccb
mkdir uploads\temp
```

### **2. Configurar permissões (Linux/Mac)**

```bash
chmod 777 uploads/temp
```

### **3. Testar API manualmente**

**Opção A - Via Postman:**
```
POST http://localhost/1canticosccb/api/validate-document.php

Form Data:
- document: [arquivo de imagem]
- expected_name: "João da Silva"
- doc_type: "rg"
```

**Opção B - Via cURL:**
```bash
curl -X POST http://localhost/1canticosccb/api/validate-document.php \
  -F "document=@caminho/para/rg.jpg" \
  -F "expected_name=João da Silva" \
  -F "doc_type=rg"
```

---

## 📱 **INTEGRAÇÃO NO FRONTEND**

### **Atualizar ComposerOnboarding.tsx**

```typescript
// Adicionar validação automática após upload
const handleDocumentUpload = async (file: File, type: 'front' | 'back') => {
  // 1. Upload normal
  handleFileUpload(file, type);
  
  // 2. Validar com OCR (se for frente do documento)
  if (type === 'front') {
    setValidatingDocument(true);
    
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('expected_name', formData.name);
      formData.append('doc_type', formData.documentType);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/validate-document.php`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      const result = await response.json();
      
      if (!result.valid) {
        setDocumentError(result.error);
        // Mostrar alerta para o usuário
        alert(`⚠️ ${result.error}\n\nSimilaridade: ${result.similarity}%\nNome encontrado: ${result.extracted_name}`);
      } else {
        setDocumentError(null);
        // Sucesso!
        console.log('✅ Documento validado:', result);
      }
      
    } catch (error) {
      console.error('Erro na validação:', error);
      // Continuar mesmo com erro (não bloquear usuário)
    } finally {
      setValidatingDocument(false);
    }
  }
};
```

---

## 🎨 **MELHORIAS DE UX**

### **1. Loading durante validação**

```tsx
{validatingDocument && (
  <div className="flex items-center gap-2 text-primary-400">
    <div className="animate-spin w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full" />
    <span>Validando documento...</span>
  </div>
)}
```

### **2. Feedback visual de validação**

```tsx
{documentValidation && (
  <div className={`mt-4 p-4 rounded-lg ${
    documentValidation.valid 
      ? 'bg-green-500/10 border border-green-500/30'
      : 'bg-red-500/10 border border-red-500/30'
  }`}>
    <div className="flex items-center gap-3">
      {documentValidation.valid ? (
        <>
          <CheckCircle className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-green-400 font-medium">
              ✅ Documento validado com sucesso
            </p>
            <p className="text-green-400/80 text-sm">
              Nome encontrado: {documentValidation.extracted_name}
            </p>
            <p className="text-green-400/60 text-xs">
              Confiança: {documentValidation.similarity}%
            </p>
          </div>
        </>
      ) : (
        <>
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-red-400 font-medium">
              ⚠️ {documentValidation.error}
            </p>
            <p className="text-red-400/80 text-sm">
              Nome esperado: {documentValidation.expected_name}
            </p>
            <p className="text-red-400/80 text-sm">
              Nome encontrado: {documentValidation.extracted_name}
            </p>
            <p className="text-red-400/60 text-xs">
              Similaridade: {documentValidation.similarity}%
            </p>
          </div>
        </>
      )}
    </div>
  </div>
)}
```

---

## 🔒 **SEGURANÇA ADICIONAL**

### **1. Validações no Frontend**

```typescript
// Antes de enviar para API
const validateImageQuality = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Verificar dimensões mínimas
      if (img.width < 800 || img.height < 600) {
        alert('⚠️ Imagem muito pequena. Use uma foto com melhor resolução.');
        resolve(false);
        return;
      }
      
      // Verificar dimensões máximas
      if (img.width > 5000 || img.height > 5000) {
        alert('⚠️ Imagem muito grande. Reduza o tamanho.');
        resolve(false);
        return;
      }
      
      resolve(true);
    };
    img.src = URL.createObjectURL(file);
  });
};
```

### **2. Rate Limiting no Backend**

```php
// Limitar tentativas por IP
function checkRateLimit($ip) {
    $cacheFile = sys_get_temp_dir() . '/rate_limit_' . md5($ip) . '.txt';
    
    if (file_exists($cacheFile)) {
        $data = json_decode(file_get_contents($cacheFile), true);
        $attempts = $data['attempts'] ?? 0;
        $timestamp = $data['timestamp'] ?? 0;
        
        // Reset a cada hora
        if (time() - $timestamp > 3600) {
            $attempts = 0;
        }
        
        if ($attempts >= 10) {
            jsonResponse([
                'error' => 'Muitas tentativas. Aguarde 1 hora.'
            ], 429);
        }
        
        $attempts++;
    } else {
        $attempts = 1;
    }
    
    file_put_contents($cacheFile, json_encode([
        'attempts' => $attempts,
        'timestamp' => time()
    ]));
}
```

---

## 📊 **PAINEL DE REVISÃO MANUAL**

### **Salvar documentos com baixa confiança**

```php
// No validate-document.php, após validação:
if ($similarity < 80) {
    // Salvar para revisão manual
    $conn = getDBConnection();
    $stmt = $conn->prepare("
        INSERT INTO document_reviews 
        (compositor_id, document_type, extracted_name, expected_name, similarity, status, image_path)
        VALUES (?, ?, ?, ?, ?, 'pending', ?)
    ");
    $stmt->execute([
        $compositorId,
        $docType,
        $extractedName,
        $expectedName,
        $similarity,
        $savedImagePath
    ]);
}
```

### **Criar página de revisão para Admin**

```sql
-- Tabela de revisão
CREATE TABLE document_reviews (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    compositor_id INT UNSIGNED NOT NULL,
    document_type ENUM('rg', 'cnh', 'passport', 'cpf') NOT NULL,
    extracted_name VARCHAR(255),
    expected_name VARCHAR(255),
    similarity DECIMAL(5,2),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    image_path TEXT,
    reviewed_by INT UNSIGNED,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (compositor_id) REFERENCES compositores(id) ON DELETE CASCADE,
    INDEX idx_status (status)
);
```

---

## 🚀 **EVOLUÇÃO FUTURA**

### **Fase 1 (Atual):** Validação Básica
- ✅ Tesseract OCR
- ✅ Comparação de nomes
- ✅ Revisão manual

### **Fase 2:** Machine Learning
- 🔄 Treinar modelo para classificar documentos
- 🔄 Detectar automaticamente o tipo
- 🔄 Identificar documentos falsos

### **Fase 3:** Verificação Avançada
- 🔄 Reconhecimento facial (comparar foto do documento com selfie)
- 🔄 Validação de CPF em base governamental
- 🔄 Detecção de adulteração

---

## 📈 **MÉTRICAS DE SUCESSO**

```sql
-- Dashboard de validação
SELECT 
    document_type,
    COUNT(*) as total,
    AVG(similarity) as avg_similarity,
    SUM(CASE WHEN similarity >= 80 THEN 1 ELSE 0 END) as auto_approved,
    SUM(CASE WHEN similarity < 80 THEN 1 ELSE 0 END) as manual_review
FROM document_reviews
GROUP BY document_type;
```

---

## ⚡ **QUICK START**

1. **Instalar Tesseract:** 
   - Windows: Baixe instalador oficial
   - Linux: `sudo apt-get install tesseract-ocr tesseract-ocr-por`

2. **Testar API:**
   ```bash
   curl -X POST http://localhost/1canticosccb/api/validate-document.php \
     -F "document=@test-rg.jpg" \
     -F "expected_name=João Silva" \
     -F "doc_type=rg"
   ```

3. **Integrar no Frontend:**
   - Adicionar validação após upload
   - Mostrar feedback visual
   - Permitir continuar mesmo com erro baixo

4. **Monitorar:**
   - Criar dashboard de revisão manual
   - Analisar taxa de sucesso
   - Ajustar threshold de similaridade

---

## 🆘 **TROUBLESHOOTING**

### **Erro: "Tesseract not found"**
```bash
# Verificar instalação
tesseract --version

# Adicionar ao PATH (Windows)
setx PATH "%PATH%;C:\Program Files\Tesseract-OCR"
```

### **Erro: "Could not extract text"**
- ✅ Verificar se imagem tem boa qualidade
- ✅ Aumentar contraste/brilho
- ✅ Usar imagem maior (min 800x600)

### **Baixa precisão**
- ✅ Pré-processar imagem (escala de cinza, contraste)
- ✅ Usar ImageMagick em vez de GD
- ✅ Considerar migrar para DocTR (Deep Learning)

---

**📝 Documentação criada em:** 19/10/2025  
**🔄 Última atualização:** 19/10/2025  
**✅ Status:** Pronto para implementação
