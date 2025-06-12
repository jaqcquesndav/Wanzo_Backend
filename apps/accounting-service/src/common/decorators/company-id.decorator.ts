import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract companyId from the request.
 * This can be extracted from different sources based on your application's needs:
 * - From JWT payload
 * - From request headers
 * - From query parameters
 * - From path parameters
 * 
 * This implementation extracts from query parameters by default,
 * but should be adapted based on your authentication strategy.
 */
export const CompanyId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    // Option 1: Extract from query parameters
    const companyIdFromQuery = request.query.companyId;
    
    // Option 2: Extract from headers (if passed as a custom header)
    const companyIdFromHeader = request.headers['x-company-id'];
    
    // Option 3: Extract from JWT payload (if using JWT authentication)
    // Requires auth guard to have parsed and attached the token payload
    const companyIdFromJwt = request.user?.companyId;
    
    // Choose the source or use fallback logic
    // Prioritize JWT if available, then header, then query parameter
    return companyIdFromJwt || companyIdFromHeader || companyIdFromQuery;
  },
);
