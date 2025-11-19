import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User, UserStatus, ProfileCompletionStatus } from '../entities/user.entity';

/**
 * Service de gestion des états intermédiaires des utilisateurs
 * Gère les timeouts, rappels et transitions d'état
 */
@Injectable()
export class UserStateManagerService {
  private readonly logger = new Logger(UserStateManagerService.name);
  private readonly PROFILE_COMPLETION_DEADLINE_DAYS = 7;
  private readonly MAX_REMINDERS = 3;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Initialise les champs d'état pour un nouveau user
   */
  initializeUserState(user: User): void {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + this.PROFILE_COMPLETION_DEADLINE_DAYS);

    user.profileCompletionStatus = ProfileCompletionStatus.NOT_STARTED;
    user.profileCompletionDeadline = deadline;
    user.profileCompletionReminders = 0;
    user.status = UserStatus.PENDING_PROFILE;
  }

  /**
   * Marque le profil comme complété
   */
  async markProfileCompleted(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    user.profileCompletionStatus = ProfileCompletionStatus.COMPLETED;
    user.profileCompletedAt = new Date();
    user.status = UserStatus.ACTIVE;
    user.profileCompletionDeadline = undefined;

    await this.userRepository.save(user);
    this.logger.log(`Profile completed for user ${userId}`);
  }

  /**
   * Vérifie et envoie des rappels pour les profils incomplets
   * Exécuté tous les jours à 10h00
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async checkIncompleteProfiles(): Promise<void> {
    this.logger.log('Checking incomplete profiles...');

    try {
      // Trouver les users avec profil incomplet
      const incompleteUsers = await this.userRepository.find({
        where: {
          profileCompletionStatus: ProfileCompletionStatus.NOT_STARTED,
          status: UserStatus.PENDING_PROFILE,
        },
      });

      this.logger.log(`Found ${incompleteUsers.length} users with incomplete profiles`);

      for (const user of incompleteUsers) {
        await this.processIncompleteUser(user);
      }
    } catch (error) {
      this.logger.error('Error checking incomplete profiles:', error);
    }
  }

  /**
   * Traite un user avec profil incomplet
   */
  private async processIncompleteUser(user: User): Promise<void> {
    const now = new Date();
    const deadline = user.profileCompletionDeadline;

    if (!deadline) {
      this.logger.warn(`User ${user.id} has no profile completion deadline`);
      return;
    }

    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Profil expiré
    if (daysRemaining <= 0) {
      await this.handleExpiredProfile(user);
      return;
    }

    // Envoyer des rappels à J-5, J-3, J-1
    const reminderDays = [5, 3, 1];
    if (reminderDays.includes(daysRemaining) && user.profileCompletionReminders < this.MAX_REMINDERS) {
      await this.sendProfileCompletionReminder(user, daysRemaining);
    }
  }

  /**
   * Gère les profils expirés
   */
  private async handleExpiredProfile(user: User): Promise<void> {
    this.logger.warn(`Profile completion expired for user ${user.id}`);

    user.profileCompletionStatus = ProfileCompletionStatus.EXPIRED;
    user.status = UserStatus.INACTIVE;
    
    await this.userRepository.save(user);

    // Émettre un événement pour notification
    // TODO: Implémenter l'émission d'événement pour notification
    this.logger.log(`User ${user.id} marked as inactive due to expired profile`);
  }

  /**
   * Envoie un rappel de complétion de profil
   */
  private async sendProfileCompletionReminder(user: User, daysRemaining: number): Promise<void> {
    this.logger.log(`Sending profile completion reminder to user ${user.id} (${daysRemaining} days remaining)`);

    user.profileCompletionReminders += 1;
    await this.userRepository.save(user);

    // TODO: Implémenter l'envoi d'email/notification
    // await this.notificationService.sendProfileReminder(user, daysRemaining);
  }

  /**
   * Marque le profil comme en cours de complétion
   */
  async markProfileInProgress(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    if (user.profileCompletionStatus === ProfileCompletionStatus.NOT_STARTED) {
      user.profileCompletionStatus = ProfileCompletionStatus.IN_PROGRESS;
      await this.userRepository.save(user);
      this.logger.log(`Profile marked as in progress for user ${userId}`);
    }
  }

  /**
   * Réactive un profil expiré (par admin)
   */
  async reactivateExpiredProfile(userId: string, extensionDays: number = 7): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    if (user.profileCompletionStatus === ProfileCompletionStatus.EXPIRED) {
      const newDeadline = new Date();
      newDeadline.setDate(newDeadline.getDate() + extensionDays);

      user.profileCompletionStatus = ProfileCompletionStatus.NOT_STARTED;
      user.profileCompletionDeadline = newDeadline;
      user.profileCompletionReminders = 0;
      user.status = UserStatus.PENDING_PROFILE;

      await this.userRepository.save(user);
      this.logger.log(`Profile reactivated for user ${userId} with ${extensionDays} days extension`);
    }
  }

  /**
   * Obtient les statistiques des états de profil
   */
  async getProfileCompletionStats(): Promise<{
    notStarted: number;
    inProgress: number;
    completed: number;
    expired: number;
    total: number;
  }> {
    const [notStarted, inProgress, completed, expired, total] = await Promise.all([
      this.userRepository.count({ where: { profileCompletionStatus: ProfileCompletionStatus.NOT_STARTED } }),
      this.userRepository.count({ where: { profileCompletionStatus: ProfileCompletionStatus.IN_PROGRESS } }),
      this.userRepository.count({ where: { profileCompletionStatus: ProfileCompletionStatus.COMPLETED } }),
      this.userRepository.count({ where: { profileCompletionStatus: ProfileCompletionStatus.EXPIRED } }),
      this.userRepository.count(),
    ]);

    return { notStarted, inProgress, completed, expired, total };
  }

  /**
   * Force la complétion du profil (bypass pour admin/tests)
   */
  async forceProfileCompletion(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    user.profileCompletionStatus = ProfileCompletionStatus.COMPLETED;
    user.profileCompletedAt = new Date();
    user.status = UserStatus.ACTIVE;
    user.profileCompletionDeadline = undefined;

    await this.userRepository.save(user);
    this.logger.log(`Profile force-completed for user ${userId} by admin`);
  }
}
