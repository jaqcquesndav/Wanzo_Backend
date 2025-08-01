import { SetMetadata } from '@nestjs/common';

export const FEATURES_KEY = 'required_features';
export const RequireFeatures = (...features: string[]) => SetMetadata(FEATURES_KEY, features);
