# Export Conflict Fix - TokenEventTopics

## Issue
TypeScript compiler error (TS2484): 
> Export declaration conflicts with exported declaration of 'TokenEventTopics'

The error occurred because `TokenEventTopics` was defined both in `kafka-config.ts` and in `token-events.ts`, and then re-exported in `kafka-config.ts`, causing a naming conflict.

## Fix

1. Removed the re-export of `TokenEventTopics` from `kafka-config.ts`:
   ```typescript
   // Before
   export type { TokenTransactionEvent } from './token-events';
   export { TokenEventTopics } from './token-events';
   
   // After
   export type { TokenTransactionEvent } from './token-events';
   ```

2. Updated `token-events.ts` to import and re-export `TokenEventTopics` from `kafka-config.ts` instead of defining it locally:
   ```typescript
   // Before
   export enum TokenEventTopics {
     TOKEN_PURCHASE = 'token.purchase',
     TOKEN_USAGE = 'token.usage',
     TOKEN_ALLOCATED = 'token.allocated',
     TOKEN_ALERT = 'token.alert',
   }
   
   // After
   import { TokenEventTopics } from './kafka-config';
   
   // Re-export the token event topics for convenience
   export { TokenEventTopics };
   ```

## Result
This fix ensures that `TokenEventTopics` is defined in a single location (`kafka-config.ts`) but can still be imported from either file, maintaining compatibility with existing code while resolving the export conflict.

## Prevention
To prevent similar issues in the future:

1. Keep common enums and interfaces in a central location
2. Use imports rather than duplicating definitions
3. Be careful with re-exports to avoid circular dependencies
4. Document shared types clearly to avoid confusion

This pattern can be applied to other parts of the codebase to maintain a clean and organized type system.
