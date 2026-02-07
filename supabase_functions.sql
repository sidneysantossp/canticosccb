-- ============================================
-- Supabase RPC Functions for Canticos CCB
-- ============================================

-- 1. Get Composer Overview (Analytics)
CREATE OR REPLACE FUNCTION get_composer_overview(
  p_usuario_id INT,
  p_period TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  days_count INT;
BEGIN
  -- Convert period to days
  days_count := CASE p_period
    WHEN '7d' THEN 7
    WHEN '30d' THEN 30
    WHEN '90d' THEN 90
    WHEN '1y' THEN 365
    ELSE 30
  END;

  -- Get composer stats
  SELECT json_build_object(
    'total_plays', COALESCE(SUM(h.plays), 0),
    'total_followers', COALESCE(COUNT(DISTINCT cs.id), 0),
    'total_likes', 0,
    'avg_listen_time', 0
  ) INTO result
  FROM compositores c
  LEFT JOIN hinos h ON h.compositor_id = c.id
  LEFT JOIN compositor_seguidores cs ON cs.compositor_id = c.id
  WHERE c.usuario_id = p_usuario_id;

  RETURN result;
END;
$$;

-- 2. Get Plays Series (Time series data)
CREATE OR REPLACE FUNCTION get_plays_series(
  p_usuario_id INT,
  p_days INT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  -- Return empty array for now (can be enhanced with actual play tracking)
  SELECT json_agg(
    json_build_object(
      'day', generate_series::date,
      'plays', 0
    )
  ) INTO result
  FROM generate_series(
    CURRENT_DATE - (p_days || ' days')::INTERVAL,
    CURRENT_DATE,
    '1 day'::INTERVAL
  );

  RETURN COALESCE(result, '[]'::JSON);
END;
$$;

-- 3. Get Engagement Counts
CREATE OR REPLACE FUNCTION get_engagement_counts(
  p_usuario_id INT,
  p_days INT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'likes', 0,
    'shares', 0,
    'downloads', 0
  ) INTO result;

  RETURN result;
END;
$$;

-- 4. Get Engagement Counts by Composer ID
CREATE OR REPLACE FUNCTION get_engagement_counts_by_composer(
  p_compositor_id INT,
  p_days INT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'likes', 0,
    'shares', 0,
    'downloads', 0
  ) INTO result;

  RETURN result;
END;
$$;

-- 5. Get Follower Stats
CREATE OR REPLACE FUNCTION get_follower_stats(
  p_usuario_id INT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  total_count INT;
  this_month_count INT;
BEGIN
  -- Get total followers
  SELECT COUNT(*) INTO total_count
  FROM compositor_seguidores cs
  JOIN compositores c ON c.id = cs.compositor_id
  WHERE c.usuario_id = p_usuario_id;

  -- Get this month's followers
  SELECT COUNT(*) INTO this_month_count
  FROM compositor_seguidores cs
  JOIN compositores c ON c.id = cs.compositor_id
  WHERE c.usuario_id = p_usuario_id
    AND cs.created_at >= DATE_TRUNC('month', CURRENT_DATE);

  SELECT json_build_object(
    'total', total_count,
    'this_month', this_month_count,
    'growth', 0,
    'engagement', 0,
    'average_plays', 0
  ) INTO result;

  RETURN result;
END;
$$;

-- 6. Get Top Fans
CREATE OR REPLACE FUNCTION get_top_fans(
  p_usuario_id INT,
  p_limit INT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', u.id,
      'name', u.name,
      'avatar_url', u.avatar_url,
      'total_plays', 0,
      'total_likes', 0,
      'engagement_score', 0
    )
  ) INTO result
  FROM compositor_seguidores cs
  JOIN compositores c ON c.id = cs.compositor_id
  JOIN usuarios u ON u.id = cs.usuario_id
  WHERE c.usuario_id = p_usuario_id
  ORDER BY cs.created_at DESC
  LIMIT p_limit;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$;

-- 7. Get Follower Growth
CREATE OR REPLACE FUNCTION get_follower_growth(
  p_usuario_id INT,
  p_days INT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'date', day::date,
      'count', COALESCE(follower_count, 0)
    )
  ) INTO result
  FROM (
    SELECT 
      generate_series::date AS day,
      COUNT(cs.id) AS follower_count
    FROM generate_series(
      CURRENT_DATE - (p_days || ' days')::INTERVAL,
      CURRENT_DATE,
      '1 day'::INTERVAL
    )
    LEFT JOIN compositor_seguidores cs ON cs.created_at::date = generate_series::date
    LEFT JOIN compositores c ON c.id = cs.compositor_id AND c.usuario_id = p_usuario_id
    GROUP BY generate_series::date
    ORDER BY generate_series::date
  ) sub;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$;

-- 8. Validate Composer Document
CREATE OR REPLACE FUNCTION validate_composer_document(
  p_document_type TEXT,
  p_document_number TEXT,
  p_has_image BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  is_valid BOOLEAN;
BEGIN
  -- Basic validation (can be enhanced with actual document validation logic)
  is_valid := LENGTH(p_document_number) >= 8;

  SELECT json_build_object(
    'valid', is_valid,
    'message', CASE 
      WHEN is_valid THEN 'Documento válido'
      ELSE 'Número de documento inválido'
    END
  ) INTO result;

  RETURN result;
END;
$$;

-- 9. Register Composer
CREATE OR REPLACE FUNCTION register_composer(
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
AS $$
DECLARE
  new_usuario_id INT;
  new_compositor_id INT;
  result JSON;
BEGIN
  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM usuarios WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email já cadastrado'
    );
  END IF;

  -- Create user account
  INSERT INTO usuarios (nome, email, senha, tipo, ativo, created_at)
  VALUES (p_nome, p_email, p_senha, 'compositor', 1, NOW())
  RETURNING id INTO new_usuario_id;

  -- Create composer profile
  INSERT INTO compositores (
    user_id,
    nome,
    nome_artistico,
    biografia,
    telefone,
    verificado,
    created_at
  )
  VALUES (
    new_usuario_id,
    p_nome,
    p_nome_artistico,
    p_biografia,
    p_telefone,
    false,
    NOW()
  )
  RETURNING id INTO new_compositor_id;

  SELECT json_build_object(
    'compositor_id', new_compositor_id,
    'usuario_id', new_usuario_id
  ) INTO result;

  RETURN result;
END;
$$;

-- 10. Send Test Push Notification
CREATE OR REPLACE FUNCTION send_test_push(
  p_title TEXT,
  p_message TEXT,
  p_url TEXT DEFAULT NULL,
  p_topic TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  -- Placeholder for push notification logic
  SELECT json_build_object(
    'success', true,
    'message', 'Test push notification sent'
  ) INTO result;

  RETURN result;
END;
$$;

-- 11. Send Notification Campaign
CREATE OR REPLACE FUNCTION send_notification_campaign(
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_target_type TEXT DEFAULT 'all',
  p_target_id INT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  affected_count INT;
BEGIN
  -- Insert notifications based on target type
  IF p_target_type = 'all' THEN
    INSERT INTO notifications (composer_id, title, message, type, created_at)
    -- Selecionar apenas usuários que são compositores
    SELECT id, p_title, p_message, 'admin', NOW()
    FROM usuarios WHERE tipo = 'compositor';
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
  ELSIF p_target_type = 'user' AND p_target_id IS NOT NULL THEN
    INSERT INTO notifications (composer_id, title, message, type, created_at)
    VALUES (p_target_id, p_title, p_message, 'admin', NOW());
    
    affected_count := 1;
  ELSE
    affected_count := 0;
  END IF;

  SELECT json_build_object(
    'success', true,
    'sent_count', affected_count
  ) INTO result;

  RETURN result;
END;
$$;
