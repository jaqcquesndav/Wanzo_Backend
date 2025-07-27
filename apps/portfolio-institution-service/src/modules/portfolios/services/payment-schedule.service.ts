import { Injectable } from '@nestjs/common';
import { AmortizationType } from '../entities/contract.entity';

export interface ScheduleGenerationParams {
  principal: number;
  interestRate: number;
  term: number;
  startDate: Date;
  frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  amortizationType: AmortizationType;
  gracePeriod?: number;
  balloonPayment?: number;
}

export interface ScheduleItem {
  installmentNumber: number;
  dueDate: Date;
  principal: number;
  interest: number;
  totalPayment: number;
  remainingBalance: number;
}

@Injectable()
export class PaymentScheduleService {

  /**
   * Génère un échéancier de remboursement en fonction des paramètres du contrat
   */
  generateSchedule(params: ScheduleGenerationParams): ScheduleItem[] {
    switch (params.amortizationType) {
      case AmortizationType.CONSTANT:
        return this.generateConstantSchedule(params);
      case AmortizationType.DEGRESSIVE:
        return this.generateDegressiveSchedule(params);
      case AmortizationType.BALLOON:
        return this.generateBalloonSchedule(params);
      case AmortizationType.BULLET:
        return this.generateBulletSchedule(params);
      default:
        return this.generateConstantSchedule(params);
    }
  }

  /**
   * Calcule un échéancier à amortissement constant (mensualités constantes)
   */
  private generateConstantSchedule(params: ScheduleGenerationParams): ScheduleItem[] {
    const schedule: ScheduleItem[] = [];
    const periodicRate = this.calculatePeriodicRate(params.interestRate, params.frequency);
    
    // Calcul de la mensualité constante (formule: M = P * r * (1 + r)^n / ((1 + r)^n - 1))
    const paymentPerPeriod = params.principal * periodicRate * Math.pow(1 + periodicRate, params.term) / 
                          (Math.pow(1 + periodicRate, params.term) - 1);
    
    let remainingBalance = params.principal;
    let dueDate = new Date(params.startDate);
    
    // Période de grâce (si applicable)
    if (params.gracePeriod && params.gracePeriod > 0) {
      for (let i = 0; i < params.gracePeriod; i++) {
        const interest = remainingBalance * periodicRate;
        
        schedule.push({
          installmentNumber: i + 1,
          dueDate: new Date(dueDate),
          principal: 0,
          interest,
          totalPayment: interest,
          remainingBalance
        });
        
        dueDate = this.addPeriod(dueDate, params.frequency);
      }
    }
    
    // Échéancier régulier
    for (let i = (params.gracePeriod || 0); i < params.term; i++) {
      const interest = remainingBalance * periodicRate;
      const principal = paymentPerPeriod - interest;
      
      remainingBalance -= principal;
      
      // Correction d'arrondi pour la dernière échéance
      if (i === params.term - 1) {
        schedule.push({
          installmentNumber: i + 1,
          dueDate: new Date(dueDate),
          principal: principal + remainingBalance,
          interest,
          totalPayment: interest + principal + remainingBalance,
          remainingBalance: 0
        });
      } else {
        schedule.push({
          installmentNumber: i + 1,
          dueDate: new Date(dueDate),
          principal,
          interest,
          totalPayment: paymentPerPeriod,
          remainingBalance
        });
      }
      
      dueDate = this.addPeriod(dueDate, params.frequency);
    }
    
    return schedule;
  }

  /**
   * Calcule un échéancier à amortissement dégressif (capital constant)
   */
  private generateDegressiveSchedule(params: ScheduleGenerationParams): ScheduleItem[] {
    const schedule: ScheduleItem[] = [];
    const periodicRate = this.calculatePeriodicRate(params.interestRate, params.frequency);
    
    let remainingBalance = params.principal;
    let dueDate = new Date(params.startDate);
    
    // Période de grâce (si applicable)
    if (params.gracePeriod && params.gracePeriod > 0) {
      for (let i = 0; i < params.gracePeriod; i++) {
        const interest = remainingBalance * periodicRate;
        
        schedule.push({
          installmentNumber: i + 1,
          dueDate: new Date(dueDate),
          principal: 0,
          interest,
          totalPayment: interest,
          remainingBalance
        });
        
        dueDate = this.addPeriod(dueDate, params.frequency);
      }
    }
    
    // Calcul du principal constant par période
    const effectiveTerm = params.term - (params.gracePeriod || 0);
    const principalPerPeriod = params.principal / effectiveTerm;
    
    // Échéancier régulier
    for (let i = (params.gracePeriod || 0); i < params.term; i++) {
      const interest = remainingBalance * periodicRate;
      const principal = principalPerPeriod;
      
      remainingBalance -= principal;
      
      // Correction d'arrondi pour la dernière échéance
      if (i === params.term - 1) {
        schedule.push({
          installmentNumber: i + 1,
          dueDate: new Date(dueDate),
          principal: principal + remainingBalance,
          interest,
          totalPayment: interest + principal + remainingBalance,
          remainingBalance: 0
        });
      } else {
        schedule.push({
          installmentNumber: i + 1,
          dueDate: new Date(dueDate),
          principal,
          interest,
          totalPayment: principal + interest,
          remainingBalance
        });
      }
      
      dueDate = this.addPeriod(dueDate, params.frequency);
    }
    
    return schedule;
  }

  /**
   * Calcule un échéancier avec paiement balloon (paiement plus important à la fin)
   */
  private generateBalloonSchedule(params: ScheduleGenerationParams): ScheduleItem[] {
    if (!params.balloonPayment) {
      return this.generateConstantSchedule(params);
    }
    
    const schedule: ScheduleItem[] = [];
    const periodicRate = this.calculatePeriodicRate(params.interestRate, params.frequency);
    
    // Calcul de la mensualité constante, excluant le paiement balloon
    const adjustedPrincipal = params.principal - (params.balloonPayment / Math.pow(1 + periodicRate, params.term - 1));
    const paymentPerPeriod = adjustedPrincipal * periodicRate * Math.pow(1 + periodicRate, params.term - 1) / 
                          (Math.pow(1 + periodicRate, params.term - 1) - 1);
    
    let remainingBalance = params.principal;
    let dueDate = new Date(params.startDate);
    
    // Échéancier régulier jusqu'à l'avant-dernière échéance
    for (let i = 0; i < params.term - 1; i++) {
      const interest = remainingBalance * periodicRate;
      const principal = paymentPerPeriod - interest;
      
      remainingBalance -= principal;
      
      schedule.push({
        installmentNumber: i + 1,
        dueDate: new Date(dueDate),
        principal,
        interest,
        totalPayment: paymentPerPeriod,
        remainingBalance
      });
      
      dueDate = this.addPeriod(dueDate, params.frequency);
    }
    
    // Dernière échéance avec paiement balloon
    const lastInterest = remainingBalance * periodicRate;
    
    schedule.push({
      installmentNumber: params.term,
      dueDate: new Date(dueDate),
      principal: remainingBalance,
      interest: lastInterest,
      totalPayment: remainingBalance + lastInterest,
      remainingBalance: 0
    });
    
    return schedule;
  }

  /**
   * Calcule un échéancier bullet (paiement du principal à la fin)
   */
  private generateBulletSchedule(params: ScheduleGenerationParams): ScheduleItem[] {
    const schedule: ScheduleItem[] = [];
    const periodicRate = this.calculatePeriodicRate(params.interestRate, params.frequency);
    
    let remainingBalance = params.principal;
    let dueDate = new Date(params.startDate);
    
    // Paiements d'intérêts uniquement jusqu'à l'avant-dernière échéance
    for (let i = 0; i < params.term - 1; i++) {
      const interest = remainingBalance * periodicRate;
      
      schedule.push({
        installmentNumber: i + 1,
        dueDate: new Date(dueDate),
        principal: 0,
        interest,
        totalPayment: interest,
        remainingBalance
      });
      
      dueDate = this.addPeriod(dueDate, params.frequency);
    }
    
    // Dernière échéance avec remboursement du principal
    const lastInterest = remainingBalance * periodicRate;
    
    schedule.push({
      installmentNumber: params.term,
      dueDate: new Date(dueDate),
      principal: remainingBalance,
      interest: lastInterest,
      totalPayment: remainingBalance + lastInterest,
      remainingBalance: 0
    });
    
    return schedule;
  }

  /**
   * Calcule le taux périodique en fonction du taux annuel et de la fréquence
   */
  private calculatePeriodicRate(annualRate: number, frequency: string): number {
    const rate = annualRate / 100; // Convertir le pourcentage en décimal
    
    switch (frequency) {
      case 'monthly':
        return rate / 12;
      case 'quarterly':
        return rate / 4;
      case 'biannual':
        return rate / 2;
      case 'annual':
        return rate;
      default:
        return rate / 12;
    }
  }

  /**
   * Ajoute une période à une date en fonction de la fréquence
   */
  private addPeriod(date: Date, frequency: string): Date {
    const newDate = new Date(date);
    
    switch (frequency) {
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'quarterly':
        newDate.setMonth(newDate.getMonth() + 3);
        break;
      case 'biannual':
        newDate.setMonth(newDate.getMonth() + 6);
        break;
      case 'annual':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    
    return newDate;
  }

  /**
   * Recalcule les échéances futures après un paiement partiel
   */
  recalculateScheduleAfterPartialPayment(
    schedule: ScheduleItem[],
    paymentDate: Date,
    paidAmount: number,
    params: ScheduleGenerationParams
  ): ScheduleItem[] {
    // Trouver l'échéance concernée
    const currentIndex = schedule.findIndex(item => 
      item.dueDate >= paymentDate && item.totalPayment > paidAmount);
    
    if (currentIndex === -1) {
      return schedule;
    }
    
    const updatedSchedule = [...schedule];
    const currentItem = updatedSchedule[currentIndex];
    
    // Mettre à jour l'échéance courante
    const remainingAfterPayment = currentItem.totalPayment - paidAmount;
    updatedSchedule[currentIndex] = {
      ...currentItem,
      principal: currentItem.principal * (1 - (paidAmount / currentItem.totalPayment)),
      interest: currentItem.interest * (1 - (paidAmount / currentItem.totalPayment)),
      totalPayment: remainingAfterPayment,
    };
    
    // Recalculer le solde restant
    let newRemainingBalance = currentIndex > 0 
      ? updatedSchedule[currentIndex - 1].remainingBalance - (currentItem.principal * (paidAmount / currentItem.totalPayment))
      : params.principal - (currentItem.principal * (paidAmount / currentItem.totalPayment));
    
    updatedSchedule[currentIndex].remainingBalance = newRemainingBalance;
    
    // Recalculer les échéances futures
    const newParams: ScheduleGenerationParams = {
      ...params,
      principal: newRemainingBalance,
      term: params.term - currentIndex - 1,
      startDate: this.addPeriod(currentItem.dueDate, params.frequency)
    };
    
    const newSchedule = this.generateSchedule(newParams);
    
    // Fusionner les échéances
    return [
      ...updatedSchedule.slice(0, currentIndex + 1),
      ...newSchedule.map((item, index) => ({
        ...item,
        installmentNumber: currentIndex + 1 + index + 1
      }))
    ];
  }
}
