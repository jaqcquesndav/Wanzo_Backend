import { NotificationType } from '../enums/notification-type.enum';

/**
 * Factory pour créer différents types de notifications
 */
export class NotificationFactory {
  /**
   * Crée une notification de stock bas
   * @param productName Nom du produit
   * @param quantity Quantité en stock
   * @param productId ID du produit (optionnel)
   * @returns Configuration de la notification
   */
  static lowStock(userId: string, productName: string, quantity: number, productId?: string) {
    return {
      userId,
      type: NotificationType.LOW_STOCK,
      title: 'Alerte de stock bas',
      message: `Le produit ${productName} est en stock bas (${quantity} restant${quantity > 1 ? 's' : ''}).`,
      actionRoute: productId ? `/inventory/products/${productId}` : '/inventory/products',
      additionalData: {
        entityType: 'product',
        entityId: productId,
        productName,
        quantity
      }
    };
  }

  /**
   * Crée une notification de nouvelle vente
   * @param invoiceNumber Numéro de facture
   * @param amount Montant de la vente
   * @param customerName Nom du client
   * @param saleId ID de la vente (optionnel)
   * @returns Configuration de la notification
   */
  static newSale(userId: string, invoiceNumber: string, amount: number, customerName: string, saleId?: string) {
    return {
      userId,
      type: NotificationType.SALE,
      title: 'Nouvelle vente',
      message: `Une vente de ${amount} FCFA a été effectuée pour ${customerName} (Facture #${invoiceNumber}).`,
      actionRoute: saleId ? `/sales/${saleId}` : '/sales',
      additionalData: {
        entityType: 'sale',
        entityId: saleId,
        invoiceNumber,
        amount,
        customerName
      }
    };
  }

  /**
   * Crée une notification de paiement
   * @param amount Montant du paiement
   * @param customerName Nom du client
   * @param saleId ID de la vente (optionnel)
   * @returns Configuration de la notification
   */
  static payment(userId: string, amount: number, customerName: string, saleId?: string) {
    return {
      userId,
      type: NotificationType.PAYMENT,
      title: 'Paiement reçu',
      message: `Un paiement de ${amount} FCFA a été reçu de ${customerName}.`,
      actionRoute: saleId ? `/sales/${saleId}` : '/sales',
      additionalData: {
        entityType: 'payment',
        entityId: saleId,
        amount,
        customerName
      }
    };
  }
}
