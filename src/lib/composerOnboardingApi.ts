import { supabase } from './supabase-auth';
import { supabaseRPC, isSupabaseConfigured, supabaseAuthInsert, supabaseUploadFile } from './supabaseRest';

export interface DocumentValidationResult {
  valid: boolean;
  message?: string;
  error?: string;
}

export interface EmailCheckResult {
  available: boolean;
  exists: boolean;
  message?: string;
}

export interface ComposerRegistrationData {
  nome: string;
  nome_artistico: string;
  email: string;
  senha: string;
  telefone?: string;
  biografia?: string;
  documento_tipo: string;
  documento_numero: string;
  documento_imagem?: string;
  documento_imagem_verso?: string;
}

export interface RegistrationResult {
  success: boolean;
  compositor_id?: string | number;
  usuario_id?: string | number;
  message?: string;
  error?: string;
}

/**
 * Validates a composer's document (CPF/CNPJ/RG)
 */
export async function validateDocument(
  documentType: string,
  documentNumber: string,
  documentImage?: File
): Promise<DocumentValidationResult> {
  if (!isSupabaseConfigured) {
    return { valid: false, error: 'Supabase not configured' };
  }

  try {
    const result = await supabaseRPC<DocumentValidationResult>('validate_composer_document', {
      p_document_type: documentType,
      p_document_number: documentNumber,
      p_has_image: !!documentImage
    });

    return result;
  } catch (error: any) {
    console.error('Error validating document:', error);
    return {
      valid: false,
      error: error.message || 'Erro ao validar documento'
    };
  }
}

/**
 * Checks if an email is available for registration
 */
export async function checkEmailAvailability(_email: string): Promise<EmailCheckResult> {
  // Não consultar `users` pelo navegador: mesmo um SELECT de ID permite
  // enumerar contas existentes. A verificação definitiva é feita pelo Supabase
  // Auth durante o envio do cadastro, com uma mensagem neutra para o visitante.
  return {
    available: true,
    exists: false,
    message: 'A disponibilidade do e-mail será confirmada ao enviar o cadastro.'
  };
}

/**
 * Registers a new composer
 */
export async function registerComposer(_data: ComposerRegistrationData): Promise<RegistrationResult> {
  // Fluxo legado removido: o RPC register_composer era SECURITY DEFINER e
  // executável por anon. O onboarding atual usa Supabase Auth, criação por
  // proprietário e upload privado de documentos.
  return {
    success: false,
    error: 'Fluxo legado desativado. Use o cadastro seguro de compositor.'
  };
}

/**
 * Creates only the composer profile (without auth user — that's handled by supabase.auth.signUp)
 */
export async function createComposerProfile(data: Omit<ComposerRegistrationData, 'senha'> & { user_id?: string }): Promise<{ success: boolean; compositor_id?: string | number; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const slug = (data.nome_artistico || data.nome)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const composerData: Record<string, any> = {
      name: data.nome,
      artistic_name: data.nome_artistico || data.nome,
      email: data.email,
      phone: data.telefone || null,
      bio: data.biografia || null,
      verified: false,
      status: 'pending',
      slug: slug || `composer-${Date.now()}`,
      category: 'solo',
    };

    // Vincular ao user_id do auth se fornecido
    if (data.user_id) {
      composerData.user_id = data.user_id;
    }

    const result = await supabaseAuthInsert<any>('composers', composerData);
    const compositorId = result[0]?.id || null;
    console.log('[createComposerProfile] Composer created, ID:', compositorId, 'Result:', result);

    if (!compositorId) {
      console.error('[createComposerProfile] CRITICAL: compositorId is null after insert! Result was:', result);
    }

    // Documents are intentionally not persisted from this function. The caller
    // must create the composer first, upload to the private Storage path and
    // then create pending document rows with the authenticated session.

    return {
      success: true,
      compositor_id: compositorId,
    };
  } catch (error: any) {
    console.error('[createComposerProfile] Error:', error);
    return { success: false, error: error.message || 'Erro ao criar perfil de compositor' };
  }
}

/**
 * Uploads a document image to Supabase Storage
 */
export async function uploadDocumentImage(
  file: File,
  composerId: string | number,
  side: 'front' | 'back'
): Promise<string | null> {
  if (!isSupabaseConfigured) {
    console.error('Supabase not configured');
    return null;
  }

  try {
    const extension = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const safeExtension = extension || 'bin';
    const randomPart = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `composer/${String(composerId)}/${side}-${randomPart}.${safeExtension}`;

    return await supabaseUploadFile('documents', path, file);
  } catch (error) {
    console.error('Error uploading document:', error);
    return null;
  }
}

export async function createComposerDocumentRecord(data: {
  composerId: string | number;
  documentType: string;
  documentNumber?: string;
  imagePath: string;
  expectedName?: string;
}): Promise<void> {
  if (!data.imagePath || data.imagePath.startsWith('data:') || /^https?:\/\//i.test(data.imagePath)) {
    throw new Error('Documento inválido. O arquivo deve estar no armazenamento privado.');
  }

  await supabaseAuthInsert('composer_documents', {
    composer_id: data.composerId,
    document_type: data.documentType,
    document_number: data.documentNumber || null,
    document_image: data.imagePath,
    expected_name: data.expectedName || '',
    status: 'pending',
    reviewed_by: null,
    reviewed_at: null,
  });
}
