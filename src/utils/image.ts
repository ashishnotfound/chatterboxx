export const compressImage = (file: File, maxWidth = 2560, maxHeight = 1440, quality = 0.92): Promise<File> => {
    return new Promise((resolve) => {
        // Only compress images
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: true });
        const img = new Image();

        img.onload = () => {
            let { width, height } = img;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;

            // Enable high-quality image rendering
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
            }

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        // Use JPEG for photos with high quality
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    } else {
                        resolve(file);
                    }
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => resolve(file);
        img.src = URL.createObjectURL(file);
    });
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
            URL.revokeObjectURL(img.src);
        };
        img.onerror = () => {
            reject(new Error('Failed to load image'));
            URL.revokeObjectURL(img.src);
        };
        img.src = URL.createObjectURL(file);
    });
};
