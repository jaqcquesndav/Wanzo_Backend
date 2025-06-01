export class ChangePasswordDto {
  currentPassword!: string;
  newPassword!: string;
  confirmPassword!: string;
}

export class ChangePasswordResponseDto {
  success!: boolean;
  message!: string;
}
