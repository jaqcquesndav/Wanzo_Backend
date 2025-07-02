import { SetMetadata } from '@nestjs/common';

export const ON_EVENT = 'ON_EVENT';

export function OnEvent(eventName: string): MethodDecorator {
  return SetMetadata(ON_EVENT, eventName);
}
