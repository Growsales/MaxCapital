import { Link, useSearchParams } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, Gift, LogIn } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useConfigImages } from '@/hooks/useConfigImages';
import { Button } from '@/components/ui/button';

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', duration: 0.9 } },
};

const STAGGER: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const profileImageKeys = {
  parceiro: 'img_perfil_parceiro',
  empresa: 'img_perfil_empresa',
  investidor: 'img_perfil_investidor',
} as const;

const profilesData = [
  {
    id: 'parceiro',
    title: 'Parceiro',
    subtitle: 'Originador de Negócios',
    description: 'Para consultores, assessores, corretores e profissionais que desejam prospectar e trazer deals para a Max Capital.',
  },
  {
    id: 'empresa',
    title: 'Empresa',
    subtitle: 'Tomador de Recursos',
    description: 'Para incorporadoras, construtoras, startups, PMEs e empresas que buscam captação de recursos para seus projetos.',
  },
  {
    id: 'investidor',
    title: 'Investidor',
    subtitle: 'Alocador de Capital',
    description: 'Para fundos, family offices, bancos e investidores profissionais que buscam oportunidades estruturadas de investimento.',
  },
];

export default function ProfileSelectionPage() {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const getImage = useConfigImages();

  const profiles = profilesData.map(p => ({
    ...p,
    imageUrl: getImage(profileImageKeys[p.id as keyof typeof profileImageKeys]),
  }));

  const getRegisterUrl = (profileId: string) => {
    const params = new URLSearchParams();
    params.set('perfil', profileId);
    if (refCode) params.set('ref', refCode);
    return `/cadastro?${params.toString()}`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0">
        {/* Radial gradient from center */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,214,163,0.08) 0%, transparent 60%)',
          }}
        />
        {/* Subtle diagonal lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 40px)',
          }}
        />
        {/* Bottom fade */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{
            background: 'linear-gradient(to top, rgba(0,214,163,0.04) 0%, transparent 100%)',
          }}
        />
      </div>

      <motion.section
        initial="hidden"
        animate="show"
        variants={STAGGER}
        className="relative z-10 container mx-auto max-w-6xl px-4 py-6 sm:py-10"
      >
        {/* Top bar: Logo + Login */}
        <motion.div variants={FADE_UP} className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-1.5 text-2xl">
            <span className="font-bold text-white tracking-wide">MAX</span>
            <span className="w-px h-6 bg-primary mx-1" />
            <span className="font-medium text-white/70 tracking-wide">CAPITAL</span>
          </Link>
          <Link to="/login">
            <Button variant="outline" className="relative border-primary/40 bg-primary/10 text-white hover:bg-primary/20 hover:border-primary/60 gap-2 backdrop-blur-md px-5 py-2 rounded-full shadow-[0_0_15px_rgba(0,214,163,0.15)] hover:shadow-[0_0_25px_rgba(0,214,163,0.25)] transition-all duration-300">
              <LogIn className="h-4 w-4 text-primary" />
              <span className="font-semibold tracking-wide">Entrar</span>
            </Button>
          </Link>
        </motion.div>

        {/* Referral Banner */}
        {refCode && (
          <motion.div variants={FADE_UP} className="flex justify-center mb-8">
            <div className="px-4 py-2.5 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-3">
              <Gift className="h-4 w-4 text-primary shrink-0" />
              <div className="text-sm">
                <span className="text-white/50">Indicado por </span>
                <span className="font-mono font-semibold text-primary">{refCode}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Hero Text */}
        <div className="mx-auto max-w-3xl text-center mb-10 sm:mb-12">
          <motion.div variants={FADE_UP} className="mb-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
              Plataforma de Investimentos
            </span>
          </motion.div>

          <motion.h1
            variants={FADE_UP}
            className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl leading-[1.1]"
          >
            Sua jornada começa aqui.
          </motion.h1>

          <motion.h2
            variants={FADE_UP}
            className="mt-1 text-3xl font-extrabold tracking-tight sm:text-5xl leading-[1.1]"
            style={{
              background: 'linear-gradient(135deg, hsl(164 100% 42%), hsl(164 100% 60%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Selecione o seu perfil.
          </motion.h2>

          <motion.p
            variants={FADE_UP}
            className="mt-3 text-sm sm:text-base leading-relaxed text-white/45 max-w-xl mx-auto"
          >
            Escolha o perfil que mais se identifica e tenha acesso à plataforma
            mais completa do mercado de capitais.
          </motion.p>
        </div>

        {/* Profile Cards */}
        <motion.div
          variants={STAGGER}
          className="grid grid-cols-1 gap-6 md:grid-cols-3 max-w-5xl mx-auto"
        >
          {profiles.map((profile) => (
            <motion.div
              key={profile.id}
              variants={FADE_UP}
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Link to={getRegisterUrl(profile.id)} className="block h-full">
                <Card className="group relative h-full overflow-hidden rounded-2xl border-white/[0.08] bg-white/[0.04] backdrop-blur-sm transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/15 hover:bg-white/[0.06]">
                  {/* Card glow */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(0,214,163,0.15) 0%, transparent 60%)' }} />
                  
                  {/* Image */}
                  <div className="relative overflow-hidden">
                    <img
                      src={profile.imageUrl}
                      alt={profile.title}
                      className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md text-[10px] font-semibold text-white/70 uppercase tracking-[0.15em] border border-white/10">
                        {profile.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative p-5 pt-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        {profile.title}
                      </h3>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] border border-white/10 transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary/15 group-hover:scale-110">
                        <ArrowRight className="h-4 w-4 text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                    </div>
                    <p className="text-[13px] text-white/40 leading-relaxed">
                      {profile.description}
                    </p>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Login section */}
        <motion.div variants={FADE_UP} className="mt-8 flex flex-col items-center gap-3">
          <div className="h-px w-16 bg-white/10" />
          <p className="text-sm text-white/35">
            Já possui uma conta?{' '}
            <Link to="/login" className="text-primary hover:text-primary/80 transition-colors font-semibold underline underline-offset-4 decoration-primary/30 hover:decoration-primary/60">
              Faça login aqui
            </Link>
          </p>
        </motion.div>
      </motion.section>
    </div>
  );
}