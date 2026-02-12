/**
 * Script para corrigir as políticas RLS que estão quebrando o Supabase Auth
 * Execute com: node fix-rls-policies.js
 */

const SUPABASE_URL = 'https://rdogsfrplohxnemvtetn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkb2dzZnJwbG9oeG5lbXZ0ZXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTM0OTYsImV4cCI6MjA3NTE2OTQ5Nn0.xCgnffZoXbw2W5eRsArjq2jKBZLLuRRi1Lr8xDPSK2g';

async function fixRLSPolicies() {
  console.log('🔧 Tentando corrigir políticas RLS via REST API...\n');
  
  // Infelizmente, não podemos executar DROP POLICY via REST API
  // A única forma é via SQL Editor do Supabase Dashboard
  
  console.log('❌ ERRO: Não é possível executar DROP POLICY via REST API.');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 VOCÊ PRECISA EXECUTAR ESTE SQL MANUALMENTE:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('1. Abra este link no navegador:');
  console.log('   https://supabase.com/dashboard/project/rdogsfrplohxnemvtetn/sql/new');
  console.log('');
  console.log('2. Cole EXATAMENTE este SQL:');
  console.log('');
  console.log('DROP POLICY IF EXISTS "Admins can view all users" ON public.users;');
  console.log('DROP POLICY IF EXISTS "Admins can update all users" ON public.users;');
  console.log('DROP POLICY IF EXISTS "Admins can delete all users" ON public.users;');
  console.log('');
  console.log('3. Clique em RUN');
  console.log('');
  console.log('4. Volte ao site, faça LOGOUT e LOGIN novamente');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('⚠️  SEM ISSO, O LOGIN VAI CONTINUAR DANDO ERRO 500!');
  console.log('');
}

fixRLSPolicies();
