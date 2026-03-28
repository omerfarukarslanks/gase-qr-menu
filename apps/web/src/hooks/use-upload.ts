import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/api-response";

export interface UploadedImage {
  url: string;
  thumbnailUrl: string;
  key: string;
}

export interface UploadedFile {
  url: string;
  key: string;
}

interface UploadImagesPayload {
  files: File[];
  folder?: string;
}

interface UploadImagePayload {
  file: File;
  folder?: string;
}

interface UploadFilePayload {
  file: File;
  folder?: string;
}

interface DeleteUploadedFilePayload {
  key: string;
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async ({ file, folder = "products" }: UploadImagePayload) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<ApiResponse<UploadedImage>>(
        `/api/upload/image?folder=${encodeURIComponent(folder)}`,
        formData
      );

      return response.data.data;
    },
  });
}

export function useUploadImages() {
  return useMutation({
    mutationFn: async ({ files, folder = "products" }: UploadImagesPayload) => {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await api.post<ApiResponse<UploadedImage[]>>(
        `/api/upload/images?folder=${encodeURIComponent(folder)}`,
        formData
      );

      return response.data.data ?? [];
    },
  });
}

export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ file, folder = "model3d" }: UploadFilePayload) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<ApiResponse<UploadedFile>>(
        `/api/upload/file?folder=${encodeURIComponent(folder)}`,
        formData
      );

      return response.data.data;
    },
  });
}

export function useDeleteUploadedFile() {
  return useMutation({
    mutationFn: async ({ key }: DeleteUploadedFilePayload) => {
      await api.delete(`/api/upload?key=${encodeURIComponent(key)}`);
      return key;
    },
  });
}
