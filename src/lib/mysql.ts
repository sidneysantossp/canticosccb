/**
 * Configuração de conexão com MySQL
 * Como estamos no frontend, vamos usar fetch para uma API backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://canticosccb.com.br/api';

/**
 * Configurações do MySQL (usar apenas no backend)
 */
export const MYSQL_CONFIG = {
  host: '203.161.46.119',
  user: 'canticosccb_plataforma',
  database: 'canticosccb_plataforma',
  // Senha deve estar no backend, não no frontend!
};

/**
 * Interface para Hino
 */
export interface Hino {
  id?: number;
  numero?: number;
  titulo: string;
  compositor?: string;
  categoria?: string;
  audio_url: string;
  cover_url?: string;
  duracao?: number;
  letra?: string;
  tags?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Classe para interagir com a API de Hinos
 */
class HinosAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Lista todos os hinos
   */
  async list(filters?: {
    categoria?: string;
    compositor?: string;
    ativo?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ hinos: Hino[]; total: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${this.baseUrl}/hinos/index.php?${params}`);
    if (!response.ok) throw new Error('Erro ao listar hinos');
    return response.json();
  }

  /**
   * Busca um hino por ID
   */
  async get(id: number): Promise<Hino> {
    const response = await fetch(`${this.baseUrl}/hinos/index.php?id=${id}`);
    if (!response.ok) throw new Error('Erro ao buscar hino');
    return response.json();
  }

  /**
   * Cria um novo hino
   */
  async create(hino: Omit<Hino, 'id' | 'created_at' | 'updated_at'>): Promise<Hino> {
    const response = await fetch(`${this.baseUrl}/hinos/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hino),
    });
    if (!response.ok) throw new Error('Erro ao criar hino');
    return response.json();
  }

  /**
   * Atualiza um hino existente
   */
  async update(id: number, hino: Partial<Hino>): Promise<Hino> {
    const response = await fetch(`${this.baseUrl}/hinos/index.php?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hino),
    });
    if (!response.ok) throw new Error('Erro ao atualizar hino');
    return response.json();
  }

  /**
   * Deleta um hino
   */
  async delete(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/hinos/index.php?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Erro ao deletar hino');
  }

  /**
   * Upload de arquivo de áudio
   */
  async uploadAudio(file: File, onProgress?: (progress: number) => void): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('audio', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      // Success
      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Erro no upload de áudio: ${xhr.status} - ${xhr.responseText}`));
        }
      });

      // Error
      xhr.addEventListener('error', () => reject(new Error('Erro na conexão')));

      xhr.open('POST', `${this.baseUrl}/upload/audio.php`);
      xhr.send(formData);
    });
  }

  /**
   * Upload de capa
   */
  async uploadCover(file: File, onProgress?: (progress: number) => void): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('cover', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      // Success
      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Erro no upload de capa: ${xhr.status} - ${xhr.responseText}`));
        }
      });

      // Error
      xhr.addEventListener('error', () => reject(new Error('Erro na conexão')));

      xhr.open('POST', `${this.baseUrl}/upload/cover.php`);
      xhr.send(formData);
    });
  }
}

// Exportar instância
export const hinosAPI = new HinosAPI();

// Para usar Firestore como alternativa (se MySQL não estiver disponível)
export const useFirestore = import.meta.env.VITE_USE_FIRESTORE === 'true';
