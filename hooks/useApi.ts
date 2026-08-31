import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { upload } from '@vercel/blob/client';
import { Musica, Tribo, Usuario } from '@/types';
import { useOnlineStatus } from './useOnlineStatus';
import { assertUploadSize, audioBlobPath, imageBlobPath, isAllowedAudio } from '@/lib/uploadLimits';

const api = axios.create({ baseURL: '/api' });

const MINUTE = 60_000;

export function useMusicas() {
  const online = useOnlineStatus();
  return useQuery<Musica[]>({
    queryKey: ['musicas'],
    queryFn: async () => {
      const { data } = await api.get<Musica[]>('/musicas');
      return data;
    },
    refetchInterval: online ? MINUTE : false,
    refetchOnReconnect: true,
    staleTime: 20_000,
    placeholderData: (previous) => previous,
  });
}

export function useTribos() {
  const online = useOnlineStatus();
  return useQuery<Tribo[]>({
    queryKey: ['tribos'],
    queryFn: async () => {
      const { data } = await api.get<Tribo[]>('/tribos');
      return data;
    },
    refetchInterval: online ? MINUTE : false,
    refetchOnReconnect: true,
    staleTime: 20_000,
    placeholderData: (previous) => previous,
  });
}

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data } = await api.get<Omit<Usuario, 'senha'>[]>('/usuarios');
      return data;
    },
  });
}

export function useCreateTribo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nome: string; cor: string; logo?: string | null }) => {
      const { data: response } = await api.post<Tribo>('/tribos', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tribos'] });
    },
  });
}

export function useUpdateTribo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      nome: string;
      cor: string;
      logo?: string | null;
    }) => {
      const { data: response } = await api.put<Tribo>(`/tribos/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tribos'] });
      queryClient.invalidateQueries({ queryKey: ['musicas'] });
    },
  });
}

export function useDeleteTribo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tribos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tribos'] });
      queryClient.invalidateQueries({ queryKey: ['musicas'] });
    },
  });
}

export function useCreateMusica() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      nome: string;
      ano: number;
      blobUrl: string;
      capa?: string | null;
      duracao: number;
      triboId: string;
    }) => {
      const { data: response } = await api.post<Musica>('/musicas', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicas'] });
    },
  });
}

export function useUpdateMusica() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      nome: string;
      ano: number;
      blobUrl?: string;
      capa?: string | null;
      duracao?: number;
      triboId: string;
    }) => {
      const { data: response } = await api.put<Musica>(`/musicas/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicas'] });
    },
  });
}

export function useDeleteMusica() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/musicas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicas'] });
    },
  });
}

export function useCreateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nome: string; email: string; senha: string }) => {
      const { data: response } = await api.post('/usuarios', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      nome: string;
      email: string;
      senha?: string;
    }) => {
      const { data: response } = await api.put(`/usuarios/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}

export function useDeleteUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/usuarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}

async function uploadFile(file: File, kind: 'imagens' | 'musicas') {
  assertUploadSize(file.size);
  if (kind === 'musicas' && !isAllowedAudio(file.name, file.type)) {
    throw new Error('Apenas arquivos MP3, MPEG ou WAV são permitidos');
  }

  const handleUploadUrl = kind === 'imagens' ? '/api/imagens/upload' : '/api/musicas/upload';
  const pathname = kind === 'imagens' ? imageBlobPath(file.name) : audioBlobPath(file.name, file.type);

  try {
    const blob = await upload(pathname, file, {
      access: 'public',
      handleUploadUrl,
      multipart: true,
    });
    return { url: blob.url, filename: blob.pathname.split('/').pop() || file.name };
  } catch (error) {
    if (file.size > 4 * 1024 * 1024) {
      throw error instanceof Error ? error : new Error('Falha no upload do arquivo');
    }
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<{ url: string; filename: string }>(
      kind === 'imagens' ? '/imagens/upload' : '/musicas/upload',
      formData
    );
    return data;
  }
}

export function useUploadImagem() {
  return useMutation({
    mutationFn: (file: File) => uploadFile(file, 'imagens'),
  });
}

export function useUploadMusica() {
  return useMutation({
    mutationFn: (file: File) => uploadFile(file, 'musicas'),
  });
}
