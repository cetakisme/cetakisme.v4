"use server";

import { utapi } from "./core";

export async function uploadFile(file: File) {
  const response = await utapi.uploadFiles([file]);

  if (!response[0]) {
    throw new Error("File Not Found!");
  }
  if (response[0].error) {
    throw new Error(response[0].error.message);
  }

  return response[0].data;
}

export async function deleteFile(url: string) {
  const key = url.split("/f/")[1];
  if (!key) throw new Error("wrong url format!");
  const response = await utapi.deleteFiles([key]);

  if (!response.success) {
    throw new Error("Delete Failed");
  }
}

export async function deleteFiles(url: string[]) {
  const key = url.map((x) => x.split("/f/")[1]!);
  const response = await utapi.deleteFiles(key);

  if (!response.success) {
    throw new Error("Delete Failed");
  }
}
