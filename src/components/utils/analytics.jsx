import { base44 } from '@/api/base44Client';

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
    const user = await base44.auth.me();
    
    // Se o usuário estiver na lista de exclusão, não rastreia
    if (user && EXCLUDED_EMAILS.includes(user.email)) {
      console.log(`[Analytics] Evento "${eventName}" não rastreado - usuário na lista de exclusão`);
      return;
    }
  } catch (error) {
    // Usuário não logado, segue com o tracking
  }
  
  // Rastreia o evento normalmente
  base44.analytics.track({
    eventName,
    properties
  });
}