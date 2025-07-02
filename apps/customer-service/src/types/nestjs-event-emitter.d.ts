declare module '@nestjs/event-emitter' {
  export const OnEvent: (...args: any[]) => MethodDecorator;
  export const EventEmitter2: any;
  export const EventEmitterModule: {
    forRoot(options?: any): any;
  };
}
