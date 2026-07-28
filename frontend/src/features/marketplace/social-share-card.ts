// VENDOR_BACKLOG.md VND-021: "One-click Create social post -- generates a
// formatted image of the product (name, price, vendor name, platform logo)
// sized for Instagram / WhatsApp / Twitter." Canvas-based, client-side --
// no server round trip, no image-generation service to run/maintain.
// One 1080x1080 square covers all three platforms well enough (Instagram
// feed/WhatsApp status are square-friendly; Twitter crops to fit but the
// centered layout below still reads fine cropped).

export interface SocialShareCardInput {
  productName: string;
  price: number;
  currency: string;
  vendorName: string;
  imageUrl?: string;
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
};

export async function generateSocialShareCard(input: SocialShareCardInput): Promise<Blob> {
  const size = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#1f2937');
  gradient.addColorStop(1, '#78350f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Product image, centered, letterboxed into a rounded card
  const imageBoxSize = 640;
  const imageBoxX = (size - imageBoxSize) / 2;
  const imageBoxY = 100;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(imageBoxX, imageBoxY, imageBoxSize, imageBoxSize, 24);
  ctx.fill();

  if (input.imageUrl) {
    try {
      const img = await loadImage(input.imageUrl);
      const scale = Math.max(imageBoxSize / img.width, imageBoxSize / img.height);
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imageBoxX, imageBoxY, imageBoxSize, imageBoxSize, 24);
      ctx.clip();
      ctx.drawImage(
        img,
        imageBoxX + (imageBoxSize - drawWidth) / 2,
        imageBoxY + (imageBoxSize - drawHeight) / 2,
        drawWidth,
        drawHeight
      );
      ctx.restore();
    } catch {
      // Image failed to load (CORS or network) -- card still renders with
      // just the white placeholder box, not a broken/blank image.
    }
  }

  // Product name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center';
  const nameLines = wrapText(ctx, input.productName, size - 120).slice(0, 2);
  nameLines.forEach((line, i) => {
    ctx.fillText(line, size / 2, imageBoxY + imageBoxSize + 100 + i * 64);
  });

  // Price
  const priceY = imageBoxY + imageBoxSize + 100 + nameLines.length * 64 + 50;
  ctx.font = 'bold 64px sans-serif';
  ctx.fillStyle = '#fbbf24';
  const priceText = `${input.currency === 'NGN' ? '₦' : '$'}${input.price.toLocaleString()}`;
  ctx.fillText(priceText, size / 2, priceY);

  // Vendor name
  ctx.font = '36px sans-serif';
  ctx.fillStyle = '#e5e7eb';
  ctx.fillText(`by ${input.vendorName}`, size / 2, priceY + 60);

  // Platform brand
  ctx.font = 'bold 32px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Ìlú Àṣẹ', size / 2, size - 50);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Failed to generate image'))), 'image/png');
  });
}
