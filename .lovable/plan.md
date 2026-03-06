# Plano: Animações de Transição e Remoção de Botões

## Status: ✅ Concluído

### Alterações Implementadas

1. **ThesesPage.tsx**
   - ✅ Removido botão "Submeter novo negócio" do hero
   - ✅ Removido state `showNewDealWizard`
   - ✅ Removido componente `NewDealWizard`
   - ✅ Adicionado `AnimatePresence` para animações de saída dos cards

2. **ThesisDetailsPage.tsx**
   - ✅ Removido botão "Submeter Negócio" da seção About
   - ✅ Removido botão CTA no final da página
   - ✅ Removido `NewDealWizard` e state relacionado
   - ✅ Adicionadas animações de entrada com stagger

3. **ThesisCard.tsx**
   - ✅ Adicionadas animações de entrada/saída (scale + opacity)
   - ✅ Hover effect com elevação suave
   - ✅ Stagger delay reduzido para 0.05s

### Resultado
- Teses são apenas informativas (sem ações transacionais)
- Transições suaves entre páginas com framer-motion
