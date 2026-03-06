import defaultThumb from '@/assets/course-thumbnail-default.jpg';
import thumbCompliance from '@/assets/thumb-compliance.jpg';
import thumbVendas from '@/assets/thumb-vendas.jpg';
import thumbOperacoes from '@/assets/thumb-operacoes.jpg';
import thumbMercado from '@/assets/thumb-mercado.jpg';
import thumbTecnologia from '@/assets/thumb-tecnologia.jpg';
import thumbLideranca from '@/assets/thumb-lideranca.jpg';

// Individual video thumbnails
import thumbVideo01 from '@/assets/thumbs/thumb-video-01.jpg';
import thumbVideo02 from '@/assets/thumbs/thumb-video-02.jpg';
import thumbVideo03 from '@/assets/thumbs/thumb-video-03.jpg';
import thumbVideo04 from '@/assets/thumbs/thumb-video-04.jpg';
import thumbVideo05 from '@/assets/thumbs/thumb-video-05.jpg';
import thumbVideo06 from '@/assets/thumbs/thumb-video-06.jpg';
import thumbVideo07 from '@/assets/thumbs/thumb-video-07.jpg';
import thumbVideo08 from '@/assets/thumbs/thumb-video-08.jpg';
import thumbVideo09 from '@/assets/thumbs/thumb-video-09.jpg';
import thumbVideo10 from '@/assets/thumbs/thumb-video-10.jpg';

const categoryThumbnails: Record<string, string> = {
  compliance: thumbCompliance,
  regulação: thumbCompliance,
  regulatório: thumbCompliance,
  vendas: thumbVendas,
  comercial: thumbVendas,
  negócios: thumbVendas,
  operações: thumbOperacoes,
  operacional: thumbOperacoes,
  financeiro: thumbOperacoes,
  mercado: thumbMercado,
  análise: thumbMercado,
  estratégia: thumbMercado,
  tecnologia: thumbTecnologia,
  inovação: thumbTecnologia,
  digital: thumbTecnologia,
  liderança: thumbLideranca,
  gestão: thumbLideranca,
  management: thumbLideranca,
};

const videoThumbnails: string[] = [
  thumbVideo01,
  thumbVideo02,
  thumbVideo03,
  thumbVideo04,
  thumbVideo05,
  thumbVideo06,
  thumbVideo07,
  thumbVideo08,
  thumbVideo09,
  thumbVideo10,
];

export function getCategoryThumb(categoria: string | null): string {
  if (!categoria) return defaultThumb;
  const lower = categoria.toLowerCase();
  for (const [key, thumb] of Object.entries(categoryThumbnails)) {
    if (lower.includes(key)) return thumb;
  }
  return defaultThumb;
}

/** Returns a consistent thumbnail for a given course based on its index/id */
export function getVideoThumb(cursoId: string, index: number): string {
  // Use a hash-like approach based on the id to get consistent but varied thumbs
  let hash = 0;
  for (let i = 0; i < cursoId.length; i++) {
    hash = ((hash << 5) - hash) + cursoId.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash + index) % videoThumbnails.length;
  return videoThumbnails[idx];
}
