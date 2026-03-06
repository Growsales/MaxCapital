import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChamados } from '@/hooks/useChamados';
import { SupportModal } from './SupportModal';

export function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(() => {
    return localStorage.getItem('hideSupportButton') === 'true';
  });
  const { openCount } = useChamados();

  // Listen for visibility changes from AppHeader
  useEffect(() => {
    const handleVisibilityChange = (e: CustomEvent<{ hidden: boolean }>) => {
      setIsHidden(e.detail.hidden);
    };
    window.addEventListener('supportButtonVisibilityChange', handleVisibilityChange as EventListener);
    return () => {
      window.removeEventListener('supportButtonVisibilityChange', handleVisibilityChange as EventListener);
    };
  }, []);

  if (isHidden) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 relative group"
          size="icon"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Badge for open tickets */}
          {openCount > 0 && !isOpen && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {openCount}
            </Badge>
          )}
          
          {/* Tooltip */}
          <span className="absolute right-full mr-3 px-2 py-1 bg-popover text-popover-foreground text-sm rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Central de Suporte
          </span>
        </Button>
      </motion.div>

      {/* Support Modal */}
      <SupportModal open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
