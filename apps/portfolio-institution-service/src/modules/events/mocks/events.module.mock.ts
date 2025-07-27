import { Module } from '@nestjs/common';
import { EventsServiceMock } from './events.service.mock';

@Module({
  providers: [
    {
      provide: 'EventsService',
      useClass: EventsServiceMock,
    },
  ],
  exports: ['EventsService'],
})
export class EventsModuleMock {}
