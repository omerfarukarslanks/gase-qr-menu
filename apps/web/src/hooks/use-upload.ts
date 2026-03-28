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

function validateImageFile(file: File) {
  const normalizedType = file.type.toLowerCase();
  const normalizedName = file.name.toLowerCase();

  if (
    normalizedType.includes("heic") ||
    normalizedType.includes("heif") ||
    normalizedName.endsWith(".heic") ||
    normalizedName.endsWith(".heif")
  ) {
    throw new Error(
      "HEIC/HEIF gorseller su an desteklenmiyor. Lutfen gorseli JPEG, PNG, WebP veya GIF formatina cevirip tekrar deneyin."
    );
  }

  if (normalizedType.includes("avif") || normalizedName.endsWith(".avif")) {
    throw new Error(
      "AVIF gorseller su an desteklenmiyor. Lutfen JPEG, PNG, WebP veya GIF kullanin."
    );
  }
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async ({ file, folder = "products" }: UploadImagePayload) => {
      validateImageFile(file);

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
      files.forEach(validateImageFile);

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
