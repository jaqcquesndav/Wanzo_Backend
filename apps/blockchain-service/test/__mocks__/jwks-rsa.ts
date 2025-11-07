const mock = {
  passportJwtSecret: (..._args: any[]) => {
    // Return a function compatible with passport-jwt secretOrKeyProvider
    return (_req: any, _rawJwt: any, done: Function) => done(null, 'secret');
  },
};

export default mock;
