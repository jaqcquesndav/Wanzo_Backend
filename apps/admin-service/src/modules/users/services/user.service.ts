import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { ActivityService } from '../../activities/services/activity.service';
import { Transporter } from 'nodemailer';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private httpService: HttpService,
    private configService: ConfigService,
    @Inject('MAILER') private mailer: Transporter,
    private activityService: ActivityService,
  ) {}

  async findAll(page = 1, perPage = 10, search?: string, companyId?: string) {
    try {
      const query = this.userRepository.createQueryBuilder('user');

      if (search) {
        query.where('user.name ILIKE :search OR user.email ILIKE :search', {
          search: `%${search}%`,
        });
      }
      
      if (companyId) {
        if (search) {
          query.andWhere('user.companyId = :companyId', { companyId });
        } else {
          query.where('user.companyId = :companyId', { companyId });
        }
      }

      const [users, total] = await query
        .skip((page - 1) * perPage)
        .take(perPage)
        .getManyAndCount();

      return {
        users,
        page,
        perPage,
        total,
      };
    } catch (error) {
      throw new Error(`Failed to fetch users: ${(error as Error).message}`);
    }
  }

  async findById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(createUserDto: CreateUserDto) {
    try {
      // Check if email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email }
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // Create user in auth service first
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      const response = await firstValueFrom(
        this.httpService.post(
          `${authServiceUrl}/users`,
          createUserDto,
        )
      );

      const authUser = response.data.user;

      // Generate email verification token
      const verificationToken = authenticator.generateSecret();
      const tokenExpires = new Date();
      tokenExpires.setHours(tokenExpires.getHours() + 24);

      // Create local user record
      const user = this.userRepository.create({
        ...createUserDto,
        kiotaId: authUser.kiotaId,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpires: tokenExpires,
      });

      const savedUser = await this.userRepository.save(user);

      // Send verification email
      await this.sendVerificationEmail(savedUser);

      return savedUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to create user: ${(error as Error).message}`);
    }
  }

  async inviteUser(inviteData: {
    email: string;
    name: string;
    role: string;
    companyId: string;
    permissions?: any[];
    invitedBy: string;
  }) {
    try {
      // Vérifier si l'email existe déjà
      const existingUser = await this.userRepository.findOne({
        where: { email: inviteData.email }
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // Générer un mot de passe temporaire
      const tempPassword = Math.random().toString(36).slice(-10);

      // Créer l'utilisateur dans le service d'authentification
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      const response = await firstValueFrom(
        this.httpService.post(
          `${authServiceUrl}/users`,
          {
            email: inviteData.email,
            password: tempPassword,
            name: inviteData.name,
            role: inviteData.role,
            companyId: inviteData.companyId,
            metadata: {
              invited: true,
              invitedBy: inviteData.invitedBy,
              invitedAt: new Date().toISOString()
            }
          }
        )
      );

      const authUser = response.data.user;

      // Générer un token d'invitation
      const invitationToken = authenticator.generateSecret();
      const tokenExpires = new Date();
      tokenExpires.setHours(tokenExpires.getHours() + 48); // 48 heures pour accepter l'invitation

      // Créer l'enregistrement utilisateur local
      const user = this.userRepository.create({
        email: inviteData.email,
        name: inviteData.name,
        role: inviteData.role,
        companyId: inviteData.companyId,
        permissions: inviteData.permissions || [],
        kiotaId: authUser.kiotaId,
        password: '', // Le mot de passe est géré par le service d'authentification
        emailVerified: false,
        emailVerificationToken: invitationToken,
        emailVerificationTokenExpires: tokenExpires,
        metadata: {
          invited: true,
          invitedBy: inviteData.invitedBy,
          invitedAt: new Date().toISOString()
        }
      });

      const savedUser = await this.userRepository.save(user);

      // Envoyer l'email d'invitation
      await this.sendInvitationEmail(savedUser as unknown as User, invitationToken, tempPassword);

      return savedUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to invite user: ${(error as Error).message}`);
    }
  }

  async verifyEmail(token: string) {
    try {
      const user = await this.userRepository.findOne({
        where: {
          emailVerificationToken: token,
          emailVerified: false,
        },
      });

      if (!user) {
        throw new NotFoundException('Invalid verification token');
      }

      if (new Date() > user.emailVerificationTokenExpires) {
        throw new BadRequestException('Verification token has expired');
      }

      user.emailVerified = true;
      user.emailVerificationToken = '';
      user.emailVerificationTokenExpires = new Date(0);

      const savedUser = await this.userRepository.save(user);

      await this.activityService.logUserActivity(
        user.id,
        'EMAIL_VERIFIED',
        `Email verified for user ${user.name}`,
      );

      return savedUser;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Failed to verify email: ${(error as Error).message}`);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.findById(id);

      // Update user in auth service
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      await firstValueFrom(
        this.httpService.put(
          `${authServiceUrl}/users/${user.kiotaId}`,
          updateUserDto,
        )
      );

      // Update local user record
      Object.assign(user, updateUserDto);
      const savedUser = await this.userRepository.save(user);

      return savedUser;
    } catch (error) {
      throw new Error(`Failed to update user: ${(error as Error).message}`);
    }
  }

  async delete(id: string) {
    try {
      const user = await this.findById(id);

      // Delete user in auth service
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      await firstValueFrom(
        this.httpService.delete(
          `${authServiceUrl}/users/${user.kiotaId}`,
        )
      );

      // Delete local user record
      await this.userRepository.remove(user);
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete user: ${(error as Error).message}`);
    }
  }

  async enable2FA(userId: string) {
    try {
      const user = await this.findById(userId);

      if (user.twoFactorEnabled) {
        throw new BadRequestException('2FA is already enabled');
      }

      // Generate secret
      const secret = authenticator.generateSecret();
      const appName = this.configService.get('APP_NAME', 'Kiota');
      const otpauthUrl = authenticator.keyuri(user.email, appName, secret);

      // Generate QR code
      const qrCode = await QRCode.toDataURL(otpauthUrl);

      // Save secret
      user.twoFactorSecret = secret;
      await this.userRepository.save(user);

      await this.activityService.logUserActivity(
        user.id,
        '2FA_SETUP_INITIATED',
        '2FA setup was initiated',
      );

      return {
        secret,
        qrCode,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Failed to enable 2FA: ${(error as Error).message}`);
    }
  }

  async verify2FA(userId: string, token: string) {
    try {
      const user = await this.findById(userId);

      if (!user.twoFactorSecret) {
        throw new BadRequestException('2FA is not set up');
      }

      const isValid = authenticator.verify({
        token,
        secret: user.twoFactorSecret,
      });

      if (!isValid) {
        throw new BadRequestException('Invalid 2FA token');
      }

      user.twoFactorEnabled = true;
      await this.userRepository.save(user);

      await this.activityService.logUserActivity(
        user.id,
        '2FA_ENABLED',
        '2FA was enabled',
      );

      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Failed to verify 2FA: ${(error as Error).message}`);
    }
  }

  async disable2FA(userId: string) {
    try {
      const user = await this.findById(userId);

      if (!user.twoFactorEnabled) {
        throw new BadRequestException('2FA is not enabled');
      }

      user.twoFactorEnabled = false;
      user.twoFactorSecret = '';
      await this.userRepository.save(user);

      await this.activityService.logUserActivity(
        user.id,
        '2FA_DISABLED',
        '2FA was disabled',
      );

      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Failed to disable 2FA: ${(error as Error).message}`);
    }
  }

  private async sendVerificationEmail(user: User) {
    try {
      const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${user.emailVerificationToken}`;

      await this.mailer.sendMail({
        from: this.configService.get('mail.from'),
        to: user.email,
        subject: 'Verify your email address',
        html: `
          <h2>Welcome to Kiota!</h2>
          <p>Hello ${user.name},</p>
          <p>Thank you for registering. Please click the link below to verify your email address:</p>
          <p>
            <a href="${verificationUrl}">Verify Email Address</a>
          </p>
          <p>If you did not create an account, no further action is required.</p>
          <p>
            Regards,<br>
            The Kiota Team
          </p>
        `,
      });
    } catch (error) {
      throw new Error(`Failed to send verification email: ${(error as Error).message}`);
    }
  }

  private async sendInvitationEmail(user: User, token: string, tempPassword: string) {
    try {
      const invitationUrl = `${this.configService.get('FRONTEND_URL')}/accept-invitation?token=${token}`;

      await this.mailer.sendMail({
        from: this.configService.get('mail.from'),
        to: user.email,
        subject: 'You have been invited to join Kiota',
        html: `
          <h2>Welcome to Kiota!</h2>
          <p>Hello ${user.name},</p>
          <p>You have been invited to join Kiota. Please click the link below to accept the invitation:</p>
          <p>
            <a href="${invitationUrl}">Accept Invitation</a>
          </p>
          <p>Your temporary password is: <strong>${tempPassword}</strong></p>
          <p>You will be asked to change this password when you first log in.</p>
          <p>If you did not expect this invitation, please ignore this email.</p>
          <p>
            Regards,<br>
            The Kiota Team
          </p>
        `,
      });
    } catch (error) {
      throw new Error(`Failed to send invitation email: ${(error as Error).message}`);
    }
  }

  async requestPasswordReset(email: string) {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
        return { success: true, message: 'If your email exists in our system, you will receive a password reset link.' };
      }

      const resetToken = authenticator.generateSecret();
      const tokenExpires = new Date();
      tokenExpires.setHours(tokenExpires.getHours() + 1);

      user.passwordResetToken = resetToken;
      user.passwordResetTokenExpires = tokenExpires;

      await this.userRepository.save(user);
      await this.sendPasswordResetEmail(user);

      await this.activityService.logUserActivity(
        user.id,
        'PASSWORD_RESET_REQUESTED',
        'Password reset was requested',
      );

      return { success: true, message: 'If your email exists in our system, you will receive a password reset link.' };
    } catch (error) {
      throw new Error(`Failed to request password reset: ${(error as Error).message}`);
    }
  }

  private async sendPasswordResetEmail(user: User) {
    try {
      const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${user.passwordResetToken}`;

      await this.mailer.sendMail({
        from: this.configService.get('mail.from'),
        to: user.email,
        subject: 'Reset your password',
        html: `
          <h2>Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You have requested to reset your password. Please click the link below to set a new password:</p>
          <p>
            <a href="${resetUrl}">Reset Password</a>
          </p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>
            Regards,<br>
            The Kiota Team
          </p>
        `,
      });
    } catch (error) {
      throw new Error(`Failed to send password reset email: ${(error as Error).message}`);
    }
  }
}