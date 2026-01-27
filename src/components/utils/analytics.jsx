import { supabase } from '@/lib/supabase';

// E-mails excluídos do rastreamento
const EXCLUDED_EMAILS = [
  'anabeatriz17371@gmail.com',
  'isaduarte.design@gmail.com',
  'isadefigueredo@icloud.com'
];

/**
 * Rastreia eventos apenas se o usuário não estiver na lista de exclusão
 */
export async function trackEvent(eventName, properties = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Se o usuário estiver na lista de exclusão, não rastreia
    if (user && EXCLUDED_EMAILS.includes(user.email)) {
      console.log(`[Analytics] Evento "${eventName}" não rastreado - usuário na lista de exclusão`);
      return;
    }
  } catch (error) {
    // Usuário não logado, segue com o tracking
  }
  
  // Nota: Analytics precisa ser implementado via serviço externo (Google Analytics, Mixpanel, etc.)
  // Por enquanto, apenas logamos no console
  console.log('[Analytics]', eventName, properties);
  
  // Exemplo de integração futura:
  // if (window.gtag) {
  //   window.gtag('event', eventName, properties);
  // }
}