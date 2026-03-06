import { useSyncExternalStore } from 'react';

// Default images (static imports mapped by key)
import dashboardHeroBg from '@/assets/dashboard-hero-bg.jpg';
import opportunitiesHeroBg from '@/assets/opportunities-hero-bg.jpg';
import thesesHeroBg from '@/assets/theses-hero-bg.jpg';
import trainingHeroBg from '@/assets/training-hero-bg.jpg';
import materialsHeroBg from '@/assets/materials-hero-bg.jpg';
import guidesHeroBg from '@/assets/guides-hero-bg.jpg';
import reportsHeroBg from '@/assets/reports-hero-bg.jpg';
import authHeroLogin from '@/assets/auth-hero.jpg';
import authHeroRegister from '@/assets/auth-hero-register.png';
import profileParceiro from '@/assets/profile-parceiro.png';
import profileEmpresa from '@/assets/profile-empresa.jpg';
import profileInvestidor from '@/assets/profile-investidor.jpg';

const STORAGE_KEY = 'admin-configuracoes-cache';

const defaults: Record<string, string> = {
  img_dashboard_hero: dashboardHeroBg,
  img_oportunidades_hero: opportunitiesHeroBg,
  img_teses_hero: thesesHeroBg,
  img_treinamentos_hero: trainingHeroBg,
  img_materiais_hero: materialsHeroBg,
  img_guias_hero: guidesHeroBg,
  img_relatorios_hero: reportsHeroBg,
  img_relatorios_admin_hero: dashboardHeroBg,
  img_relatorios_empresa_hero: reportsHeroBg,
  img_relatorios_investidor_hero: opportunitiesHeroBg,
  img_login_hero: authHeroLogin,
  img_registro_hero: authHeroRegister,
  img_perfil_parceiro: profileParceiro,
  img_perfil_empresa: profileEmpresa,
  img_perfil_investidor: profileInvestidor,
};

function getConfigs(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

let cachedSnapshot = getConfigs();

const listeners = new Set<() => void>();

// Listen for storage changes (cross-tab + same-tab after admin saves)
window.addEventListener('storage', () => {
  cachedSnapshot = getConfigs();
  listeners.forEach((l) => l());
});

// Allow admin page to notify same-tab updates
export function notifyConfigChange() {
  cachedSnapshot = getConfigs();
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return cachedSnapshot;
}

export function useConfigImage(key: string): string {
  const configs = useSyncExternalStore(subscribe, getSnapshot);
  return configs[key] || defaults[key] || '';
}

export function useConfigImages() {
  const configs = useSyncExternalStore(subscribe, getSnapshot);
  return (key: string) => configs[key] || defaults[key] || '';
}
