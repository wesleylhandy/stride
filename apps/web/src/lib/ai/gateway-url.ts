/**
 * AI Gateway URL helper
 * Provides AI Gateway URL with precedence: env var → global config → default
 * 
 * This is a wrapper around the infrastructure config resolver for better organization
 * within the AI module.
 */
export { getAIGatewayUrl } from '@/lib/config/ai-gateway-config';
