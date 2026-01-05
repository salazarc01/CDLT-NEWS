
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
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const img = new Image();
  img.crossOrigin = "anonymous";
  
  return new Promise<{blob: Blob, text: string, code: string}>((resolve, reject) => {
    img.onload = () => {
      // Formato vertical optimizado para móviles (Instagram/WhatsApp Story style)
      canvas.width = 1080;
      canvas.height = 1600;

      // Dibujar fondo negro base
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dibujar imagen principal
      const scale = Math.max(canvas.width / img.width, (canvas.height - 300) / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = 0;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // Añadir degradado elegante para la marca de agua
      const gradient = ctx.createLinearGradient(0, canvas.height - 400, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(10,10,12,0)');
      gradient.addColorStop(0.5, 'rgba(10,10,12,0.9)');
      gradient.addColorStop(1, 'rgba(10,10,12,1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height - 450, canvas.width, 450);

      // Marca de Agua: CDLT NEWS
      ctx.fillStyle = '#ffffff';
      ctx.font = 'italic 900 70px "Playfair Display", serif';
      ctx.textAlign = 'center';
      ctx.fillText('CDLT NEWS', canvas.width / 2, canvas.height - 180);

      // Línea decorativa azul
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(canvas.width / 2 - 60, canvas.height - 155, 120, 4);

      // Código de Identificación Único
      ctx.fillStyle = '#64748b'; // zinc-400
      ctx.font = '700 28px "Inter", sans-serif';
      ctx.letterSpacing = '6px';
      ctx.fillText(`ID: ${newsCode}`, canvas.width / 2, canvas.height - 100);

      canvas.toBlob((blob) => {
        if (blob) {
          // Formato solicitado: Tema -> Párrafo -> Hora -> Autor + LINK
          const shareText = `🔴 *NOTICIA: ${data.category}*\n\n"${data.title}"\n\n${data.firstParagraph}\n\n🕒 *HORA:* ${data.time}\n✍️ *SUBIDO POR:* ${data.author}\n\n🔗 *VER MÁS:* https://cdlt-news.vercel.app/\n🆔 *REF-ID:* ${newsCode}\n\n_Enviado vía CDLT NEWS_`;
          resolve({ blob, text: shareText, code: newsCode });
        } else {
          reject('Error al procesar imagen');
        }
      }, 'image/png');
    };
    img.onerror = () => reject('Error al cargar recurso visual');
    img.src = data.imageUrl;
  });
};

export const shareToPlatform = async (platform: 'whatsapp' | 'facebook' | 'gmail', shareData: {blob: Blob, text: string}) => {
  const file = new File([shareData.blob], 'CDLT_NEWS_REPORT.png', { type: 'image/png' });
  
  // En móviles, navigator.share es lo más potente para enviar archivos + texto a apps específicas
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'CDLT NEWS',
        text: shareData.text,
      });
      return;
    } catch (e) {
      console.log('Share nativo cancelado o no disponible, usando fallback manual');
    }
  }

  // Fallback manual si el navegador no soporta compartir archivos directamente
  const encodedText = encodeURIComponent(shareData.text);
  if (platform === 'whatsapp') {
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  } else if (platform === 'facebook') {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://cdlt-news.vercel.app/')}&quote=${encodedText}`, '_blank');
  } else if (platform === 'gmail') {
    window.open(`mailto:?subject=REPORTE CDLT NEWS&body=${encodedText}`, '_blank');
  }
};
