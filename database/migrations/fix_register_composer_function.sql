-- ============================================
-- FIX: Corrigir função register_composer
-- Erro: column "ativo" is of type boolean but expression is of type integer
-- A função usava ativo = 1 (integer) mas a coluna é boolean
-- ============================================

-- Recriar a função register_composer com tipos corretos
CREATE OR REPLACE FUNCTION public.register_composer(
  p_nome TEXT,
  p_nome_artistico TEXT,
  p_email TEXT,
  p_senha TEXT,
  p_telefone TEXT DEFAULT NULL,
  p_biografia TEXT DEFAULT NULL,
  p_documento_tipo TEXT DEFAULT NULL,
  p_documento_numero TEXT DEFAULT NULL,
  p_documento_imagem TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_composer_id BIGINT;
  v_auth_user_id UUID;
BEGIN
  -- 1. Criar usuário no auth.users do Supabase
  v_auth_user_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at
  ) VALUES (
    v_auth_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_senha, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('name', p_nome),
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
  );

  -- 2. Criar identidade no auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_auth_user_id,
    v_auth_user_id,
    jsonb_build_object('sub', v_auth_user_id::text, 'email', p_email),
    'email',
    v_auth_user_id::text,
    NOW(),
    NOW(),
    NOW()
  );

  -- 3. Criar perfil na tabela public.users
  INSERT INTO public.users (
    id,
    email,
    name,
    phone,
    is_admin,
    is_composer,
    is_blocked,
    status,
    plan,
    created_at,
    updated_at
  ) VALUES (
    v_auth_user_id,
    p_email,
    p_nome,
    p_telefone,
    false,
    true,
    false,
    'active',
    'free',
    NOW(),
    NOW()
  );

  v_user_id := v_auth_user_id;

  -- 4. Criar registro na tabela composers
  INSERT INTO public.composers (
    name,
    artistic_name,
    email,
    phone,
    bio,
    verified,
    status,
    slug,
    category,
    created_at,
    updated_at
  ) VALUES (
    p_nome,
    COALESCE(p_nome_artistico, p_nome),
    p_email,
    p_telefone,
    p_biografia,
    false,
    'pending',
    LOWER(REPLACE(REPLACE(COALESCE(p_nome_artistico, p_nome), ' ', '-'), '.', '')),
    'solo',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_composer_id;

  -- 5. Salvar documentos se fornecidos
  IF p_documento_tipo IS NOT NULL AND p_documento_numero IS NOT NULL THEN
    BEGIN
      INSERT INTO public.composer_documents (
        composer_id,
        document_type,
        document_number,
        document_image,
        status,
        created_at
      ) VALUES (
        v_composer_id,
        p_documento_tipo,
        p_documento_numero,
        p_documento_imagem,
        'pending',
        NOW()
      );
    EXCEPTION WHEN OTHERS THEN
      -- Tabela pode não existir, ignorar
      RAISE NOTICE 'Tabela composer_documents não encontrada ou erro ao inserir: %', SQLERRM;
    END;
  END IF;

  -- 6. Retornar resultado
  RETURN json_build_object(
    'success', true,
    'compositor_id', v_composer_id,
    'usuario_id', v_user_id,
    'message', 'Compositor registrado com sucesso'
  );

EXCEPTION WHEN unique_violation THEN
  RETURN json_build_object(
    'success', false,
    'error', 'Email já cadastrado. Use outro email ou faça login.'
  );
WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Permitir execução anônima (para registro público)
GRANT EXECUTE ON FUNCTION public.register_composer TO anon;
GRANT EXECUTE ON FUNCTION public.register_composer TO authenticated;

SELECT '✅ Função register_composer corrigida!' AS status;
