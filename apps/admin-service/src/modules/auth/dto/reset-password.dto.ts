export class ResetPasswordDto {
  token!: string;
  newPassword!: string;
}

export class ResetPasswordResponseDto {
  message!: string;
}
