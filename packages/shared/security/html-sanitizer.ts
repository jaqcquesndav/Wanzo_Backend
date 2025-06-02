import sanitizeHtml from 'sanitize-html';

/**
 * Configuration par défaut pour sanitize-html
 * Cette configuration autorise uniquement les balises HTML de base sans attributs dangereux
 */
export const defaultSanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    'b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br', 'span',
    'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'tr', 'td', 'th'
  ],
  allowedAttributes: {
    'a': ['href', 'target', 'rel'],
    'span': ['class'],
    'div': ['class'],
    'p': ['class'],
    'h1': ['class'],
    'h2': ['class'],
    'h3': ['class'],
    'h4': ['class'],
    'h5': ['class'],
    'h6': ['class'],
    'table': ['class'],
    'tr': ['class'],
    'td': ['class', 'colspan', 'rowspan'],
    'th': ['class', 'colspan', 'rowspan']
  },
  // Force tous les liens à s'ouvrir dans un nouvel onglet avec noopener et noreferrer
  transformTags: {
    'a': (tagName, attribs) => {
      return {
        tagName,
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      };
    }
  },
  // Désactive les scripts et styles
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  // Supprime les balises vides
  nonTextTags: ['style', 'script', 'textarea', 'noscript', 'iframe'],
};

/**
 * Sanétise le HTML pour prévenir les attaques XSS
 * @param html Le HTML à sanétiser
 * @param options Options personnalisées pour sanitize-html
 * @returns Le HTML sanétisé
 */
export function sanitizeHtmlContent(html: string, options?: sanitizeHtml.IOptions): string {
  if (!html) return '';
  
  // Utilise les options par défaut si aucune option n'est fournie
  const sanitizeOptions = options || defaultSanitizeOptions;
  
  return sanitizeHtml(html, sanitizeOptions);
}

/**
 * Vérifie si une chaîne contient du HTML potentiellement dangereux
 * @param html La chaîne à vérifier
 * @returns true si la chaîne contient du HTML potentiellement dangereux
 */
export function containsDangerousHtml(html: string): boolean {
  if (!html) return false;
  
  // Sanitize et compare avec l'original pour détecter les changements
  const sanitized = sanitizeHtml(html, defaultSanitizeOptions);
  return sanitized !== html;
}
