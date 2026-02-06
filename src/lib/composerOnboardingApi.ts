import { supabaseRPC, supabaseFetch, isSupabaseConfigured, supabaseUploadFile } from './supabaseRest';

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
}

export interface RegistrationResult {
  success: boolean;
  compositor_id?: number;
  usuario_id?: number;
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
export async function checkEmailAvailability(email: string): Promise<EmailCheckResult> {
  if (!isSupabaseConfigured) {
    return { available: false, exists: false, message: 'Supabase not configured' };
  }

  try {
    const users = await supabaseFetch<any>('users', {
      email: `eq.${email}`,
      select: 'id',
      limit: '1'
    });

    const exists = users.length > 0;
    return {
      available: !exists,
      exists,
      message: exists ? 'Email já cadastrado' : 'Email disponível'
    };
  } catch (error: any) {
    console.error('Error checking email:', error);
    return {
      available: false,
      exists: false,
      message: error.message || 'Erro ao verificar email'
    };
  }
}

/**
 * Registers a new composer
 */
export async function registerComposer(data: ComposerRegistrationData): Promise<RegistrationResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const result = await supabaseRPC<any>('register_composer', {
      p_nome: data.nome,
      p_nome_artistico: data.nome_artistico,
      p_email: data.email,
      p_senha: data.senha,
      p_telefone: data.telefone || null,
      p_biografia: data.biografia || null,
      p_documento_tipo: data.documento_tipo,
      p_documento_numero: data.documento_numero,
      p_documento_imagem: data.documento_imagem || null
    });

    return {
      success: true,
      compositor_id: result.compositor_id,
      usuario_id: result.usuario_id,
      message: 'Compositor registrado com sucesso'
    };
  } catch (error: any) {
    console.error('Error registering composer:', error);
    return {
      success: false,
      error: error.message || 'Erro ao registrar compositor'
    };
  }
}

/**
 * Uploads a document image to Supabase Storage
 */
export async function uploadDocumentImage(file: File): Promise<string | null> {
  if (!isSupabaseConfigured) {
    console.error('Supabase not configured');
    return null;
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const path = `${fileName}`;

    const result = await supabaseUploadFile('documents', path, file);
    return result;
  } catch (error) {
    console.error('Error uploading document:', error);
    return null;
  }
}
