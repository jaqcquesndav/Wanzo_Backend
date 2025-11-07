export const PassportModule = {
  // Accept options and return something that looks like a DynamicModule
  register: (_opts?: any) => ({ module: class MockPassportModule {} }) as any,
};

// Mimic Nest's AuthGuard factory: AuthGuard('jwt') returns a guard class
export function AuthGuard(_name?: string) {
  return class MockAuthGuard {
    canActivate() {
      return true;
    }
  } as any;
}

// Mimic PassportStrategy factory used as: class X extends PassportStrategy(Strategy,'jwt') {}
export function PassportStrategy(_strategy?: any, _name?: string) {
  return class {} as any;
}
