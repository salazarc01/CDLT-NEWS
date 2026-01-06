
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
  const shareText = `🔴 *REPORTE CDLT NEWS*\n\n*${data.category}:* ${data.title}\n\n${data.firstParagraph}\n\n🕒 ${data.time}\n✍️ ${data.author}\n\n🔗 Ver más en: https://cdlt-news.vercel.app/\n🆔 REF: ${newsCode}`;

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    canvas.width = 1080;
    canvas.height = 1920;

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    const blob = await new Promise<Blob | null>((resolve) => {
      img.onload = () => {
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        try {
          const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        } catch (e) {
          console.warn("CORS/Draw error, basic background used");
        }

        const topGrad = ctx.createLinearGradient(0, 0, 0, 400);
        topGrad.addColorStop(0, 'rgba(0,0,0,0.8)');
        topGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, canvas.width, 400);

        const bottomGrad = ctx.createLinearGradient(0, canvas.height - 1000, 0, canvas.height);
        bottomGrad.addColorStop(0, 'rgba(10,10,12,0)');
        bottomGrad.addColorStop(0.4, 'rgba(10,10,12,0.8)');
        bottomGrad.addColorStop(1, 'rgba(10,10,12,1)');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, canvas.height - 1000, canvas.width, 1000);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 50px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('CDLT', 60, 120);
        
        ctx.fillStyle = '#2563eb';
        ctx.font = 'bold 50px sans-serif';
        ctx.fillText('NEWS', 205, 120);

        const categoryText = (data.category || 'INFO').toUpperCase();
        const catWidth = ctx.measureText(categoryText).width + 40;
        ctx.fillStyle = '#2563eb';
        if (ctx.roundRect) {
            ctx.roundRect(60, 160, catWidth, 60, 8);
        } else {
            ctx.fillRect(60, 160, catWidth, 60);
        }
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'black 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(categoryText, 60 + catWidth/2, 202);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic bold 85px serif';
        
        const words = (data.title || '').split(' ');
        let line = '';
        let yPos = canvas.height - 650;
        const lineHeight = 100;
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > canvas.width - 120 && n > 0) {
            ctx.fillText(line, 60, yPos);
            line = words[n] + ' ';
            yPos += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 60, yPos);

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(`${data.time || ''} • VERIFICADO POR CDLT NEWS`, 60, canvas.height - 180);
        
        ctx.fillStyle = 'rgba(37,99,235,1)';
        ctx.font = 'bold 35px sans-serif';
        ctx.fillText(`ID REF: ${newsCode}`, 60, canvas.height - 120);

        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width - 260, canvas.height - 200, 200, 80);
        ctx.globalAlpha = 1.0;

        canvas.toBlob(resolve, 'image/png', 0.9);
      };
      
      img.onerror = () => resolve(null);
      img.src = data.imageUrl.includes('?') ? `${data.imageUrl}&t=${Date.now()}` : `${data.imageUrl}?t=${Date.now()}`;
    });

    return { blob, text: shareText, code: newsCode };
  } catch (error) {
    console.error("Preparation error:", error);
    return { blob: null, text: shareText, code: newsCode };
  }
};

export const shareToPlatform = async (platform: 'whatsapp' | 'facebook' | 'gmail', shareData: {blob: Blob | null, text: string}) => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (shareData.blob && navigator.share && navigator.canShare) {
    try {
      const file = new File([shareData.blob], 'CDLT_NEWS_REPORT.png', { type: 'image/png' });
      const dataToShare = {
        files: [file],
        title: 'CDLT NEWS',
        text: shareData.text,
      };

      if (navigator.canShare(dataToShare)) {
        await navigator.share(dataToShare);
        return true;
      }
    } catch (e) {
      console.warn("Native file share failed", e);
    }
  }

  const encodedText = encodeURIComponent(shareData.text);
  
  if (platform === 'whatsapp') {
    const url = isMobile ? `whatsapp://send?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
    window.open(url, '_blank');
  } else if (platform === 'facebook') {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://cdlt-news.vercel.app/')}&quote=${encodedText}`, '_blank');
  } else if (platform === 'gmail') {
    window.open(`mailto:?subject=REPORTE CDLT NEWS&body=${encodedText}`, '_blank');
  }
  
  return true;
};
