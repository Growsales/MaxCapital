/**
 * Shared store for manually added investors per opportunity.
 * Synchronizes state between CompatibleInvestorsTab and GlobalMatchmakingView.
 */

export interface ManualInvestorEntry {
  investorId: string;
  nome: string;
  email: string;
  thesisTitle: string;
  score: number;
  reasons: { label: string; matched: boolean }[];
  origem: 'sistema' | 'proprio';
  status: string;
  created_at: string;
}

type Listener = () => void;

class ManualInvestorsStore {
  private byOpp: Record<string, ManualInvestorEntry[]> = {};
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): Record<string, ManualInvestorEntry[]> {
    return this.byOpp;
  }

  getForOpportunity(oppId: string): ManualInvestorEntry[] {
    return this.byOpp[oppId] || [];
  }

  add(oppId: string, entry: ManualInvestorEntry): void {
    const existing = this.byOpp[oppId] || [];
    if (existing.some(e => e.investorId === entry.investorId)) return;
    this.byOpp = { ...this.byOpp, [oppId]: [...existing, entry] };
    this.emit();
  }

  remove(oppId: string, investorId: string): void {
    const existing = this.byOpp[oppId];
    if (!existing) return;
    this.byOpp = { ...this.byOpp, [oppId]: existing.filter(e => e.investorId !== investorId) };
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach(l => l());
  }
}

export const manualInvestorsStore = new ManualInvestorsStore();
