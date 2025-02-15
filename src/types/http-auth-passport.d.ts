// src/types/http-auth-passport.d.ts
declare module 'http-auth-passport' {
  import { Basic } from 'http-auth';
  import { Strategy } from 'passport';

  /**
   * Creates a Passport authentication strategy using HTTP Basic Auth
   * @param auth - http-auth Basic auth instance
   * @returns Passport Strategy instance
   */
  function HttpAuthPassport(auth: Basic): Strategy;
  
  export = HttpAuthPassport;
}
