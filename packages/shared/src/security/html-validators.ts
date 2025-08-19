import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { sanitizeHtmlContent, containsDangerousHtml } from './html-sanitizer';

/**
 * Décorateur qui sanétise automatiquement le HTML pour prévenir les attaques XSS
 * @param validationOptions Options de validation pour class-validator
 */
export function SanitizeHtml(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'sanitizeHtml',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Si la valeur est une chaîne et contient du HTML
          if (typeof value === 'string') {
            // Sanétiser la valeur et la mettre à jour directement dans l'objet
            const sanitized = sanitizeHtmlContent(value);
            (args.object as any)[propertyName] = sanitized;
            return true;
          }
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} contient du HTML potentiellement dangereux qui a été sanétisé`;
        }
      }
    });
  };
}

/**
 * Décorateur qui vérifie si une chaîne contient du HTML potentiellement dangereux
 * @param validationOptions Options de validation pour class-validator
 */
export function IsSafeHtml(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSafeHtml',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          // Si la valeur est une chaîne, vérifier si elle contient du HTML dangereux
          if (typeof value === 'string') {
            return !containsDangerousHtml(value);
          }
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} contient du HTML potentiellement dangereux`;
        }
      }
    });
  };
}
