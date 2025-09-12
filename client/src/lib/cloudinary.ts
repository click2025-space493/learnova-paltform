interface CloudinaryAccount {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

interface CloudinaryConfig {
  accounts: CloudinaryAccount[];
  currentAccountIndex: number;
}

// Load all Cloudinary accounts from environment variables
const loadCloudinaryAccounts = (): CloudinaryAccount[] => {
  const accounts: CloudinaryAccount[] = [];
  
  for (let i = 1; i <= 5; i++) {
    const cloudName = import.meta.env[`VITE_CLOUDINARY_CLOUD_NAME_${i}`];
    const apiKey = import.meta.env[`VITE_CLOUDINARY_API_KEY_${i}`];
    const apiSecret = import.meta.env[`VITE_CLOUDINARY_API_SECRET_${i}`];
    
    // Only add accounts with real credentials (not placeholder values)
    if (cloudName && apiKey && apiSecret && 
        !cloudName.includes('your_cloud_name') && 
        !apiKey.includes('your_api_key') && 
        !apiSecret.includes('your_api_secret')) {
      accounts.push({ cloudName, apiKey, apiSecret });
    }
  }
  
  if (accounts.length === 0) {
    throw new Error('No valid Cloudinary accounts configured. Please check your environment variables.');
  }
  
  console.log(`Loaded ${accounts.length} valid Cloudinary account(s)`);
  return accounts;
};

class CloudinaryManager {
  private config: CloudinaryConfig;
  private accountHealth: Map<string, { failures: number; lastFailure: number }>;
  
  constructor() {
    this.config = {
      accounts: loadCloudinaryAccounts(),
      currentAccountIndex: 0
    };
    this.accountHealth = new Map();
    
    // Initialize health tracking for all accounts
    this.config.accounts.forEach(account => {
      this.accountHealth.set(account.cloudName, { failures: 0, lastFailure: 0 });
    });
  }
  
  // Get current account for upload
  getCurrentAccount(): CloudinaryAccount {
    return this.config.accounts[this.config.currentAccountIndex];
  }

  // Get account index by cloud name
  getAccountIndex(cloudName: string): number {
    return this.config.accounts.findIndex(acc => acc.cloudName === cloudName);
  }
  
  // Rotate to next account for load balancing
  rotateAccount(): CloudinaryAccount {
    this.config.currentAccountIndex = 
      (this.config.currentAccountIndex + 1) % this.config.accounts.length;
    return this.getCurrentAccount();
  }
  
  // Get account by index
  getAccountByIndex(index: number): CloudinaryAccount {
    if (index >= 0 && index < this.config.accounts.length) {
      return this.config.accounts[index];
    }
    return this.getCurrentAccount();
  }
  
  // Get total number of accounts
  getAccountCount(): number {
    return this.config.accounts.length;
  }
  
  // Mark account as failed (for health tracking)
  markAccountFailure(account: CloudinaryAccount, error: string): void {
    const health = this.accountHealth.get(account.cloudName);
    if (health) {
      health.failures++;
      health.lastFailure = Date.now();
      
      // Log the failure for debugging
      console.warn(`Account ${account.cloudName} failed: ${error}. Total failures: ${health.failures}`);
    }
  }
  
  // Mark account as successful (reset failure count)
  markAccountSuccess(account: CloudinaryAccount): void {
    const health = this.accountHealth.get(account.cloudName);
    if (health) {
      health.failures = 0;
      health.lastFailure = 0;
    }
  }
  
  // Get healthy accounts (accounts with fewer recent failures)
  getHealthyAccounts(): CloudinaryAccount[] {
    const now = Date.now();
    const healthyAccounts = this.config.accounts.filter(account => {
      const health = this.accountHealth.get(account.cloudName);
      if (!health) return true;
      
      // Consider account healthy if:
      // 1. No failures, or
      // 2. Less than 3 failures and last failure was more than 5 minutes ago
      return health.failures === 0 || 
             (health.failures < 3 && (now - health.lastFailure) > 5 * 60 * 1000);
    });
    
    return healthyAccounts.length > 0 ? healthyAccounts : this.config.accounts;
  }
  
  // Generate upload signature for secure uploads
  generateSignature(params: Record<string, any>, account: CloudinaryAccount): string {
    // This would typically be done on the server side for security
    // For now, we'll use unsigned uploads with upload presets
    return '';
  }
  
  // Get upload URL for specific account
  getUploadUrl(account: CloudinaryAccount): string {
    return `https://api.cloudinary.com/v1_1/${account.cloudName}/video/upload`;
  }
  
  // Get optimal account with intelligent selection
  getOptimalAccount(): CloudinaryAccount {
    const healthyAccounts = this.getHealthyAccounts();
    
    // Use round-robin among healthy accounts
    const healthyIndex = this.config.currentAccountIndex % healthyAccounts.length;
    const selectedAccount = healthyAccounts[healthyIndex];
    
    // Update the current index to point to the next account in the full list
    this.rotateAccount();
    
    return selectedAccount;
  }
  
  // Get next available account (for failover)
  getNextAccount(currentAccount: CloudinaryAccount): CloudinaryAccount | null {
    const currentIndex = this.config.accounts.findIndex(acc => acc.cloudName === currentAccount.cloudName);
    const healthyAccounts = this.getHealthyAccounts().filter(acc => acc.cloudName !== currentAccount.cloudName);
    
    if (healthyAccounts.length === 0) {
      // No other healthy accounts, try the next account in sequence
      const nextIndex = (currentIndex + 1) % this.config.accounts.length;
      return this.config.accounts[nextIndex];
    }
    
    return healthyAccounts[0];
  }
}

// Export singleton instance
export const cloudinaryManager = new CloudinaryManager();

// Export types
export type { CloudinaryAccount };
