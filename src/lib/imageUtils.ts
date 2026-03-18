/**
 * Читает файл и возвращает base64 без сжатия (без data: префикса).
 */
export function compressImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(",", 2)[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}