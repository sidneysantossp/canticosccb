import { hinosApi, uploadAudio, uploadCover } from '@/lib/api-client';

const unwrapData = (response: any) => response?.data ?? response;

export const hinosAPI = {
  list: async (params?: Parameters<typeof hinosApi.list>[0]) => {
    const response = await hinosApi.list(params);
    const data = unwrapData(response);
    const hinos = data?.hinos || data?.data || data || [];
    return { hinos: Array.isArray(hinos) ? hinos : [] };
  },

  get: async (id: string | number) => {
    const response = await hinosApi.get(id);
    return unwrapData(response);
  },

  create: async (data: any) => {
    const response = await hinosApi.create(data);
    return unwrapData(response);
  },

  update: async (id: string | number, data: any) => {
    const response = await hinosApi.update(id, data);
    return unwrapData(response);
  },

  delete: async (id: string | number) => {
    const response = await hinosApi.delete(id);
    return unwrapData(response);
  },

  uploadAudio: async (file: File, onProgress?: (progress: number) => void) => {
    onProgress?.(10);
    const result = await uploadAudio(file);
    onProgress?.(100);
    return result;
  },

  uploadCover: async (file: File, onProgress?: (progress: number) => void) => {
    onProgress?.(10);
    const url = await uploadCover(file, 'covers');
    onProgress?.(100);
    return { url };
  },
};
