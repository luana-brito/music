import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Musica, Tribo, Usuario } from '@/types';

const api = axios.create({ baseURL: '/api' });

export function useMusicas() {
  return useQuery({
    queryKey: ['musicas'],
    queryFn: async () => {
      const { data } = await api.get<Musica[]>('/musicas');
      return data;
    },
    initialData: [],
  });
}

export function useTribos() {
  return useQuery({
    queryKey: ['tribos'],
    queryFn: async () => {
      const { data } = await api.get<Tribo[]>('/tribos');
      return data;
    },
    initialData: [],
  });
}

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data } = await api.get<Omit<Usuario, 'senha'>[]>('/usuarios');
      return data;
    },
    initialData: [],
  });
}

export function useCreateTribo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nome: string; cor: string; logo?: string }) => {
      const { data: response } = await api.post<Tribo>('/tribos', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tribos'] });
    },
  });
}

export function useCreateMusica() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nome: string; ano: number; blobUrl: string; duracao: number; triboId: string }) => {
      const { data: response } = await api.post<Musica>('/musicas', data);
      return response;
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

export function useUploadMusica() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<{ url: string; filename: string }>('/musicas/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
  });
}
