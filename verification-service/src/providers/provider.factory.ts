import { VerificationProvider } from './base.provider';
import { DojahProvider } from './dojah.provider';

/**
 * Provider Factory
 * Manages provider instances and allows easy switching between providers
 */
export class ProviderFactory {
  private static providers: Map<string, VerificationProvider> = new Map();

  /**
   * Get provider instance by name
   * @param name - Provider name ('dojah', 'youverify', etc.)
   * @returns VerificationProvider instance
   */
  static getProvider(name: string = 'dojah'): VerificationProvider {
    // Return cached instance if exists
    if (this.providers.has(name)) {
      return this.providers.get(name)!;
    }

    // Create new instance based on provider name
    let provider: VerificationProvider;

    switch (name.toLowerCase()) {
      case 'dojah':
        provider = new DojahProvider();
        break;

      // Future providers can be added here
      // case 'youverify':
      //   provider = new YouverifyProvider();
      //   break;
      // case 'smile_identity':
      //   provider = new SmileIdentityProvider();
      //   break;

      default:
        throw new Error(`Unknown verification provider: ${name}`);
    }

    // Cache the instance
    this.providers.set(name, provider);

    console.log(`[ProviderFactory] Initialized provider: ${name}`);

    return provider;
  }

  /**
   * Get all available provider names
   */
  static getAvailableProviders(): string[] {
    return ['dojah']; // Add more as they're implemented
  }

  /**
   * Check if provider is available
   */
  static isProviderAvailable(name: string): boolean {
    return this.getAvailableProviders().includes(name.toLowerCase());
  }

  /**
   * Clear cached providers (useful for testing)
   */
  static clearCache(): void {
    this.providers.clear();
  }
}

