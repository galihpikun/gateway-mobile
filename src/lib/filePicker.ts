/**
 * Gateway Mobile — Universal Document / Image Picker Helper
 * Works on Web (via native browser file input) and Native (with standard FormData file descriptor).
 */
import { Platform } from 'react-native';

export interface PickedDocument {
  name: string;
  size: number;
  type: string;
  uri?: string;
  file?: File;
}

export function pickImageDocument(): Promise<PickedDocument | null> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp';
        input.style.display = 'none';

        input.onchange = (e: Event) => {
          const target = e.target as HTMLInputElement;
          const file = target?.files?.[0];
          if (file) {
            resolve({
              name: file.name,
              size: file.size,
              type: file.type || 'image/jpeg',
              file: file,
            });
          } else {
            resolve(null);
          }
          if (input.parentNode) {
            document.body.removeChild(input);
          }
        };

        input.oncancel = () => {
          resolve(null);
          if (input.parentNode) {
            document.body.removeChild(input);
          }
        };

        document.body.appendChild(input);
        input.click();
      } catch (err) {
        console.warn('Web file picker error:', err);
        resolve(null);
      }
    } else {
      // Native fallback
      resolve(null);
    }
  });
}

/**
 * Appends a PickedDocument to a FormData instance in a cross-platform way.
 */
export function appendDocumentToFormData(
  formData: FormData,
  fieldName: string,
  doc: PickedDocument,
) {
  if (doc.file) {
    // Web: browser native File
    formData.append(fieldName, doc.file);
  } else if (doc.uri) {
    // React Native mobile: file object with uri, name, and type
    formData.append(fieldName, {
      uri: doc.uri,
      name: doc.name,
      type: doc.type,
    } as unknown as Blob);
  }
}
