import { useState } from 'react';
import { Share2, Link as LinkIcon, MessageCircle, Mail, Check } from 'lucide-react';
import { Button } from '@/shared/components/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/popover';
import { toast } from '@/shared/hooks/use-toast';

interface ShareButtonProps {
  opportunityId: string;
  opportunityName: string;
  /** "card" renders a small ghost button, "page" renders an outline button */
  variant?: 'card' | 'page';
}

export function ShareButton({ opportunityId, opportunityName, variant = 'page' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const publicUrl = `${window.location.origin}/oportunidade-publica/${opportunityId}`;
  const shareText = `Confira esta oportunidade de investimento: ${opportunityName}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast({ title: 'Link copiado!', description: 'Link público copiado para a área de transferência.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${publicUrl}`)}`, '_blank');
  };

  const handleEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareText}\n\nAcesse: ${publicUrl}`)}`, '_blank');
  };

  const isCard = variant === 'card';

  return (
    <Popover>
      <PopoverTrigger asChild>
        {isCard ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-1 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="h-3.5 w-3.5" />
            Compartilhar
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Compartilhar
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-52 p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors text-foreground"
          >
            {copied ? <Check className="h-4 w-4 text-primary" /> : <LinkIcon className="h-4 w-4 text-muted-foreground" />}
            {copied ? 'Copiado!' : 'Copiar link'}
          </button>
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors text-foreground"
          >
            <MessageCircle className="h-4 w-4 text-green-500" />
            WhatsApp
          </button>
          <button
            onClick={handleEmail}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors text-foreground"
          >
            <Mail className="h-4 w-4 text-muted-foreground" />
            E-mail
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
