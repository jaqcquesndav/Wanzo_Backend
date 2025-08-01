import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessSector } from '../entities/business-sector.entity';
import { CreateBusinessSectorDto } from '../dto/create-business-sector.dto';
import { UpdateBusinessSectorDto } from '../dto/update-business-sector.dto';
import { User, UserRole } from '../../auth/entities/user.entity';
import { UpdateUserProfileDto } from '../dto/update-user-profile.dto';
import { UpdateUserByAdminDto } from '../dto/update-user-by-admin.dto';
import { ChangeUserRoleDto } from '../dto/change-user-role.dto'; // Import ChangeUserRoleDto
import { ApplicationSettings } from '../entities/application-settings.entity';
import { ApplicationSettingsDto } from '../dto/application-settings.dto';

@Injectable()
export class SettingsUserProfileService {
  constructor(
    @InjectRepository(BusinessSector)
    private readonly businessSectorRepository: Repository<BusinessSector>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ApplicationSettings)
    private readonly applicationSettingsRepository: Repository<ApplicationSettings>,
  ) {}

  // --- Business Sector Management --- 

  async createBusinessSector(createBusinessSectorDto: CreateBusinessSectorDto): Promise<BusinessSector> {
    const { name, description } = createBusinessSectorDto;

    const existingSector = await this.businessSectorRepository.findOne({ where: { name } });
    if (existingSector) {
      throw new ConflictException(`Business sector with name '${name}' already exists.`);
    }

    const newSector = this.businessSectorRepository.create({
      name,
      description,
    });
    return this.businessSectorRepository.save(newSector);
  }

  async findAllBusinessSectors(): Promise<BusinessSector[]> {
    return this.businessSectorRepository.find();
  }

  async findBusinessSectorById(id: string): Promise<BusinessSector> {
    const sector = await this.businessSectorRepository.findOne({ where: { id } });
    if (!sector) {
      throw new NotFoundException(`Business sector with ID '${id}' not found.`);
    }
    return sector;
  }

  async updateBusinessSector(id: string, updateBusinessSectorDto: UpdateBusinessSectorDto): Promise<BusinessSector> {
    const sector = await this.findBusinessSectorById(id); // Handles NotFoundException

    const { name, description } = updateBusinessSectorDto;

    if (name && name !== sector.name) {
      const existingSectorWithName = await this.businessSectorRepository.findOne({ where: { name } });
      if (existingSectorWithName && existingSectorWithName.id !== id) {
        throw new ConflictException(`Another business sector with name '${name}' already exists.`);
      }
      sector.name = name;
    }

    if (description !== undefined) {
      sector.description = description;
    }
    
    return this.businessSectorRepository.save(sector);
  }

  async deleteBusinessSector(id: string): Promise<void> {
    const sector = await this.findBusinessSectorById(id); // Handles NotFoundException
    await this.businessSectorRepository.remove(sector);
    // In TypeORM, remove() or delete() can be used. 
    // delete() is faster if you don't need the entity to be returned or cascades to be handled by TypeORM.
    // const result = await this.businessSectorRepository.delete(id);
    // if (result.affected === 0) {
    //   throw new NotFoundException(`Business sector with ID '${id}' not found.`);
    // }
  }

  // --- User Profile Management (Self-service) --- 
  async getMyProfile(userId: string): Promise<Omit<User, 'password' | 'hashPassword' | 'validatePassword'> | null> {
    const user = await this.userRepository.findOne({ 
        where: { id: userId },
        relations: ['company'] // Optionally load company or other relations
    });
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, hashPassword, validatePassword, ...result } = user; // Exclude sensitive fields
    return result;
  }

  async updateMyProfile(userId: string, updateUserProfileDto: UpdateUserProfileDto): Promise<Omit<User, 'password' | 'hashPassword' | 'validatePassword'> | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }

    // Update only the fields provided in the DTO
    if (updateUserProfileDto.firstName) user.firstName = updateUserProfileDto.firstName;
    if (updateUserProfileDto.lastName) user.lastName = updateUserProfileDto.lastName;
    if (updateUserProfileDto.phoneNumber) user.phoneNumber = updateUserProfileDto.phoneNumber;
    if (updateUserProfileDto.profilePictureUrl) user.profilePictureUrl = updateUserProfileDto.profilePictureUrl;
    // Add other updatable fields from UpdateUserProfileDto as needed
    // For example, if you add address, dateOfBirth, languagePreference, timezone to User entity:
    // if (updateUserProfileDto.address) user.address = updateUserProfileDto.address;
    // if (updateUserProfileDto.dateOfBirth) user.dateOfBirth = new Date(updateUserProfileDto.dateOfBirth);
    // if (updateUserProfileDto.languagePreference) user.languagePreference = updateUserProfileDto.languagePreference;
    // if (updateUserProfileDto.timezone) user.timezone = updateUserProfileDto.timezone;

    const updatedUser = await this.userRepository.save(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, hashPassword, validatePassword, ...result } = updatedUser;
    return result;
  }

  // --- User Management (Admin/Owner) --- 
  async getAllUsers(companyId?: string): Promise<Omit<User, 'password' | 'hashPassword' | 'validatePassword'>[]> {
    const users = companyId 
        ? await this.userRepository.find({ where: { companyId }, relations: ['company'] })
        : await this.userRepository.find({ relations: ['company'] });

    return users.map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, hashPassword, validatePassword, ...result } = user;
      return result;
    });
  }

  async getUserById(userId: string): Promise<Omit<User, 'password' | 'hashPassword' | 'validatePassword'> | null> {
    const user = await this.userRepository.findOne({ 
        where: { id: userId }, 
        relations: ['company'] 
    });
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, hashPassword, validatePassword, ...result } = user;
    return result;
  }
  
  async getUserByIdWithCompanyCheck(userId: string, companyId: string): Promise<Omit<User, 'password' | 'hashPassword' | 'validatePassword'> | null> {
    const user = await this.userRepository.findOne({ 
        where: { id: userId }, 
        relations: ['company'] 
    });
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }
    
    // Check if user belongs to the same company as the requesting admin
    if (user.companyId !== companyId) {
      throw new ForbiddenException(`Access denied: You can only access users from your own company.`);
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, hashPassword, validatePassword, ...result } = user;
    return result;
  }

  async updateUserById(userId: string, updateUserByAdminDto: UpdateUserByAdminDto): Promise<Omit<User, 'password' | 'hashPassword' | 'validatePassword'>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }

    if (updateUserByAdminDto.email && updateUserByAdminDto.email !== user.email) {
      const existingUserWithEmail = await this.userRepository.findOne({ where: { email: updateUserByAdminDto.email } });
      if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
        throw new ConflictException(`User with email '${updateUserByAdminDto.email}' already exists.`);
      }
      user.email = updateUserByAdminDto.email;
    }

    if (updateUserByAdminDto.firstName) user.firstName = updateUserByAdminDto.firstName;
    if (updateUserByAdminDto.lastName) user.lastName = updateUserByAdminDto.lastName;
    if (updateUserByAdminDto.phoneNumber) user.phoneNumber = updateUserByAdminDto.phoneNumber;
    if (updateUserByAdminDto.profilePictureUrl) user.profilePictureUrl = updateUserByAdminDto.profilePictureUrl;
    if (typeof updateUserByAdminDto.isActive === 'boolean') user.isActive = updateUserByAdminDto.isActive;
    
    // Save the user entity with the updated fields
    const updatedUser = await this.userRepository.save(user);
    
    // Create a new object without password and methods
    const { password, ...userWithoutPassword } = updatedUser;
    
    // TypeScript will infer the correct return type
    return userWithoutPassword as Omit<User, 'password' | 'hashPassword' | 'validatePassword'>;
  }
  
  async updateUserByIdWithCompanyCheck(userId: string, updateUserByAdminDto: UpdateUserByAdminDto, companyId: string): Promise<Omit<User, 'password' | 'hashPassword' | 'validatePassword'>> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['company']
    });
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }
    
    // Check if user belongs to the same company as the requesting admin
    if (user.companyId !== companyId) {
      throw new ForbiddenException(`Access denied: You can only update users from your own company.`);
    }
    
    // Use the updateUserById method to perform the update
    return this.updateUserById(userId, updateUserByAdminDto);
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }
    await this.userRepository.remove(user); 
  }

  async changeUserRole(userId: string, changeUserRoleDto: ChangeUserRoleDto,  requestingUser: User): Promise<Omit<User, 'password' | 'hashPassword' | 'validatePassword'> | null> {
    const userToUpdate = await this.userRepository.findOne({ where: { id: userId } });
    if (!userToUpdate) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }

    const newRole = changeUserRoleDto.role;

    // Security: Prevent an ADMIN from escalating their own role or another ADMIN's role to OWNER.
    // Prevent an ADMIN from changing an OWNER's role.
    if (requestingUser.role === UserRole.ADMIN) {
      if (userToUpdate.role === UserRole.OWNER) {
        throw new BadRequestException('Admins cannot change the role of an Owner.');
      }
      if (newRole === UserRole.OWNER) {
        throw new BadRequestException('Admins cannot assign the Owner role.');
      }
      // Optional: Prevent ADMIN from changing another ADMIN to a non-ADMIN role if that's a business rule
    }
    
    // Prevent de-escalating the last OWNER of a company (if applicable, requires company context and more logic)
    // This is a more complex rule and might require checking if the user is the only OWNER in their company.
    // For now, we'll allow an OWNER to change any role, including their own (though self-demotion might be rare).

    userToUpdate.role = newRole;
    const updatedUser = await this.userRepository.save(userToUpdate);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, hashPassword, validatePassword, ...result } = updatedUser;
    return result;
  }

  // --- General Application Settings --- 

  async getApplicationSettings(): Promise<ApplicationSettings | null> {
    const settings = await this.applicationSettingsRepository.find();
    if (settings.length > 0) {
      return settings[0];
    }
    return null; 
  }

  async updateApplicationSettings(applicationSettingsDto: ApplicationSettingsDto): Promise<ApplicationSettings> {
    let settings = await this.applicationSettingsRepository.findOne({ where: {} }); 

    if (!settings) {
      settings = this.applicationSettingsRepository.create();
      // Set default for non-optional fields if creating new and DTO might not provide them
      settings.maintenanceMode = applicationSettingsDto.maintenanceMode ?? false;
    } else {
      // If DTO provides maintenanceMode, use it, otherwise keep existing or default to false if necessary
      settings.maintenanceMode = applicationSettingsDto.maintenanceMode ?? settings.maintenanceMode ?? false;
    }

    // Update optional fields from DTO if they are provided
    if (applicationSettingsDto.companyName !== undefined) settings.companyName = applicationSettingsDto.companyName;
    if (applicationSettingsDto.companyLogoUrl !== undefined) settings.companyLogoUrl = applicationSettingsDto.companyLogoUrl;
    if (applicationSettingsDto.defaultLanguage !== undefined) settings.defaultLanguage = applicationSettingsDto.defaultLanguage;
    if (applicationSettingsDto.currency !== undefined) settings.currency = applicationSettingsDto.currency;
    if (applicationSettingsDto.dateFormat !== undefined) settings.dateFormat = applicationSettingsDto.dateFormat;
    if (applicationSettingsDto.timeFormat !== undefined) settings.timeFormat = applicationSettingsDto.timeFormat;
    if (applicationSettingsDto.contactEmail !== undefined) settings.contactEmail = applicationSettingsDto.contactEmail;
    if (applicationSettingsDto.contactPhone !== undefined) settings.contactPhone = applicationSettingsDto.contactPhone;
    if (applicationSettingsDto.companyAddress !== undefined) settings.companyAddress = applicationSettingsDto.companyAddress;
    
    if (applicationSettingsDto.socialMediaLinks) {
      settings.socialMediaLinks = {
        facebook: applicationSettingsDto.socialMediaLinks.facebook,
        twitter: applicationSettingsDto.socialMediaLinks.twitter,
        linkedin: applicationSettingsDto.socialMediaLinks.linkedin,
        instagram: applicationSettingsDto.socialMediaLinks.instagram,
      };
    } else if (applicationSettingsDto.socialMediaLinks === null || applicationSettingsDto.socialMediaLinks === undefined) {
        // If explicitly set to null or undefined in DTO, clear it in the entity
        settings.socialMediaLinks = undefined; 
    }

    return this.applicationSettingsRepository.save(settings);
  }
}
