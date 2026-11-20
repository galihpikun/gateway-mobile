import * as DocumentPicker from 'expo-document-picker';

export type PickedDocument = DocumentPicker.DocumentPickerAsset;

export async function pickDocument(type: string[], maxMB: number): Promise<PickedDocument | null> {
  const response = await DocumentPicker.getDocumentAsync({ type, copyToCacheDirectory: true, multiple: false, base64: false });
  if (response.canceled) return null;
  const file = response.assets[0];
  if ((file.size ?? 0) > maxMB * 1024 ** 2) {
    throw new Error('Ukuran berkas melebihi ' + maxMB + ' MB.');
  }
  return file;
}

export const pickImageDocument = () => pickDocument(['image/jpeg', 'image/png', 'image/webp'], 5);
export const pickVideoDocument = () => pickDocument(['video/mp4', 'video/webm'], 25);

export function appendDocumentToFormData(formData: FormData, field: string, doc: PickedDocument) {
  if (doc.file) formData.append(field, doc.file);
  else {
    const extension = doc.name.toLowerCase().split('.').pop();
    const types: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm' };
    formData.append(field, { uri: doc.uri, name: doc.name, type: doc.mimeType || types[extension ?? ''] || 'application/octet-stream' } as unknown as Blob);
  }
}
