// Script para testar conexão com Supabase
// Abra o console do navegador e cole este código para testar

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...');
  
  // Substitua com suas credenciais reais ou pegue do window
  const supabaseUrl = 'https://rdogsfrplohxnemvtetn.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkb2dzZnJwbG9oeG5lbXZ0ZXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTM0OTYsImV4cCI6MjA3NTE2OTQ5Nn0.xCgnffZoXbw2W5eRsArjq2jKBZLLuRRi1Lr8xDPSK2g';
  
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? '***present***' : '***missing***');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis do Supabase não encontradas');
    return;
  }
  
  try {
    // Testar conexão básica
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Conexão básica funcionando');
      
      // Testar tabela de categorias
      const catsResponse = await fetch(`${supabaseUrl}/rest/v1/categorias?limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (catsResponse.ok) {
        const cats = await catsResponse.json();
        console.log('✅ Tabela categorias acessível, registros:', cats.length);
        console.log('📋 Dados:', cats);
      } else {
        console.error('❌ Erro ao acessar categorias:', catsResponse.status);
        console.error('Response:', await catsResponse.text());
      }
      
      // Testar tabela de hinos
      const hymnsResponse = await fetch(`${supabaseUrl}/rest/v1/hinos?limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (hymnsResponse.ok) {
        const hymns = await hymnsResponse.json();
        console.log('✅ Tabela hinos acessível, registros:', hymns.length);
        console.log('📋 Dados:', hymns);
      } else {
        console.error('❌ Erro ao acessar hinos:', hymnsResponse.status);
        console.error('Response:', await hymnsResponse.text());
      }
      
    } else {
      console.error('❌ Erro na conexão:', response.status);
      console.error('Response:', await response.text());
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

// Executar teste
testSupabaseConnection();
testSupabaseConnection();
