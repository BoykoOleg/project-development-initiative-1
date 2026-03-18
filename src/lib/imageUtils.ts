/**
 * Сжимает изображение через canvas и возвращает base64 (без data: префикса).
 * Максимальный размер стороны — maxSize px, качество JPEG — quality (0..1).
 * Итоговый файл ~200-400 КБ — безопасен для отправки в Cloud Functions.
 */
export function compressImageToBase64(
  file: File,
  maxSize = 1280,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas недоступен")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl.split(",", 2)[1]);
    };
    img.onerror = reject;
    img.src = url;
  });
}
