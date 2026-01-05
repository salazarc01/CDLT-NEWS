
export const generateUniqueCode = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

interface ShareData {
  title: string;
  category: string;
  firstParagraph: string;
  time: string;
  author: string;
  imageUrl: string;
}

export const prepareShareContent = async (data: ShareData) => {
  const newsCode = generateUniqueCode();
  const shareText = `🔴 *NOTICIA: ${data.category}*\n\n"${data.title}"\n\n${data.firstParagraph}\n\n🕒 *HORA:* ${data.time}\n✍️ *SUBIDO POR:* ${data.author}\n\n🔗 *VER MÁS:* https://cdlt-news.vercel.app/\n🆔 *REF-ID:* ${newsCode}\n\n_Enviado vía CDLT NEWS_`;

  // Intentar generar imagen con Canvas
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    const img = new Image();
    // Importante: anonymous solo funciona si el servidor de la imagen tiene CORS habilitado
    img.crossOrigin = "anonymous";
    
    const blob = await new Promise<Blob | null>((resolve) => {
      img.onload = () => {
        canvas.width = 1080;
        canvas.height = 1600;
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        try {
          // Intentar dibujar la imagen
          const scale = Math.max(canvas.width / img.width, (canvas.height - 300) / img.height);
          const x = (canvas.width - img.width * scale) / 2;
          ctx.drawImage(img, x, 0, img.width * scale, img.height * scale);
        } catch (e) {
          // Si falla por Tainted Canvas (CORS), resolvemos null para usar solo texto
          console.warn("CORS block on image, sharing text only");
          return resolve(null);
        }

        // Overlay elegante
        const gradient = ctx.createLinearGradient(0, canvas.height - 450, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(10,10,12,0)');
        gradient.addColorStop(1, 'rgba(10,10,12,1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height - 450, canvas.width, 450);

        // Marca de Agua
        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic 900 70px serif'; // Fallback simple para evitar errores de carga de fuente
        ctx.textAlign = 'center';
        ctx.fillText('CDLT NEWS', canvas.width / 2, canvas.height - 180);

        ctx.fillStyle = '#2563eb';
        ctx.fillRect(canvas.width / 2 - 60, canvas.height - 155, 120, 4);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(`ID: ${newsCode}`, canvas.width / 2, canvas.height - 100);

        canvas.toBlob(resolve, 'image/png');
      };
      
      img.onerror = () => {
        console.warn("Image load error, sharing text only");
        resolve(null);
      };
      
      // Añadimos un pequeño delay para asegurar el inicio del proceso
      img.src = data.imageUrl + (data.imageUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
    });

    return { blob, text: shareText, code: newsCode };
  } catch (error) {
    console.error("Share preparation failed:", error);
    return { blob: null, text: shareText, code: newsCode };
  }
};

export const shareToPlatform = async (platform: 'whatsapp' | 'facebook' | 'gmail', shareData: {blob: Blob | null, text: string}) => {
  const encodedText = encodeURIComponent(shareData.text);
  
  // 1. Intentar compartir archivo si existe el blob
  if (shareData.blob && navigator.share && navigator.canShare) {
    try {
      const file = new File([shareData.blob], 'CDLT_NEWS_REPORT.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'CDLT NEWS',
          text: shareData.text,
        });
        return true;
      }
    } catch (e) {
      console.log('Native file share failed, falling back to text...');
    }
  }

  // 2. Fallback de compartir solo texto si navigator.share está disponible
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'CDLT NEWS',
        text: shareData.text,
      });
      return true;
    } catch (e) {
      console.log('Native text share failed, falling back to URL scheme...');
    }
  }

  // 3. Fallbacks manuales (URL Schemes)
  try {
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://cdlt-news.vercel.app/')}&quote=${encodedText}`, '_blank');
    } else if (platform === 'gmail') {
      window.open(`mailto:?subject=REPORTE CDLT NEWS&body=${encodedText}`, '_blank');
    }
    return true;
  } catch (e) {
    alert("No se pudo abrir la aplicación de destino.");
    return false;
  }
};
