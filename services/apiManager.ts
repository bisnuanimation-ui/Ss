import { ApiKeyConfig, ApiProvider, KeyStatus } from '../types';

const STORAGE_KEY = 'promptvision_api_keys_v2';

// Default built-in key templates for easy one-click setup
const DEFAULT_KEYS: ApiKeyConfig[] = [
  {
    id: 'key_gemini_primary',
    name: 'Gemini 3.8 Flash (সিস্টেম ইঞ্জিন)',
    provider: 'gemini',
    key: 'SYSTEM_DEFAULT',
    model: 'gemini-3.8-flash',
    status: 'active',
    usageCount: 0,
    isSystem: true,
  },
  {
    id: 'key_gemini_backup',
    name: 'Gemini Backup #2',
    provider: 'gemini',
    key: '',
    model: 'gemini-3.8-flash',
    status: 'standby',
    usageCount: 0,
  },
  {
    id: 'key_friendli_vision',
    name: 'Friendli AI Vision (হাই-স্পিড)',
    provider: 'friendli',
    key: '',
    endpoint: 'https://api.friendli.ai/serverless/v1',
    model: 'meta-llama/Llama-3.2-11B-Vision-Instruct',
    status: 'standby',
    usageCount: 0,
  },
  {
    id: 'key_openai_gpt4o',
    name: 'OpenAI (GPT-4o Vision)',
    provider: 'openai',
    key: '',
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    status: 'standby',
    usageCount: 0,
  },
];

type KeyRotationCallback = (info: {
  fromKey: ApiKeyConfig;
  toKey: ApiKeyConfig;
  reason: string;
}) => void;

class ApiManagerService {
  private keys: ApiKeyConfig[] = [];
  private rotationListeners: KeyRotationCallback[] = [];

  constructor() {
    this.loadKeys();
  }

  private loadKeys() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ApiKeyConfig[];
        this.keys = parsed.map(k => {
          if (k.id === 'key_gemini_primary') {
            return {
              ...k,
              name: 'Gemini 3.8 Flash (সিস্টেম ইঞ্জিন)',
              key: 'SYSTEM_DEFAULT',
              model: 'gemini-3.8-flash',
              isSystem: true,
              errorMessage: undefined,
            };
          }
          return k;
        });

        // If key_gemini_primary wasn't in parsed array, add it
        if (!this.keys.some(k => k.id === 'key_gemini_primary')) {
          this.keys.unshift(DEFAULT_KEYS[0]);
        }
      } else {
        this.keys = [...DEFAULT_KEYS];
      }
    } catch {
      this.keys = [...DEFAULT_KEYS];
    }
  }

  private persistKeys() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.keys));
    } catch (e) {
      console.warn('Could not persist API keys in localStorage:', e);
    }
  }

  public getKeys(): ApiKeyConfig[] {
    return [...this.keys];
  }

  public getActiveKey(): ApiKeyConfig | null {
    // 1. Look for explicit active key with a key string
    const active = this.keys.find(k => k.status === 'active' && k.key.trim().length > 0);
    if (active) return active;

    // 2. Look for any standby key with a key string
    const standby = this.keys.find(k => k.status === 'standby' && k.key.trim().length > 0);
    if (standby) {
      this.setActiveKey(standby.id);
      return standby;
    }

    // 3. Fallback: check if system key exists even without explicit user entry
    const system = this.keys.find(k => k.isSystem && k.key.trim().length > 0);
    if (system) {
      this.setActiveKey(system.id);
      return system;
    }

    // 4. Return the first key configured or null
    return this.keys.find(k => k.key.trim().length > 0) || null;
  }

  public setActiveKey(id: string) {
    this.keys = this.keys.map(k => {
      if (k.id === id) {
        return { ...k, status: 'active' };
      }
      if (k.status === 'active') {
        return { ...k, status: 'standby' };
      }
      return k;
    });
    this.persistKeys();
  }

  public saveKey(config: Partial<ApiKeyConfig> & { id?: string }): ApiKeyConfig {
    if (config.id && this.keys.some(k => k.id === config.id)) {
      this.keys = this.keys.map(k => (k.id === config.id ? { ...k, ...config } : k));
      this.persistKeys();
      return this.keys.find(k => k.id === config.id)!;
    }

    const newKey: ApiKeyConfig = {
      id: config.id || `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: config.name || `Custom API Key (${config.provider || 'gemini'})`,
      provider: config.provider || 'gemini',
      key: config.key || '',
      endpoint: config.endpoint,
      model: config.model,
      status: this.keys.some(k => k.status === 'active') ? 'standby' : 'active',
      usageCount: 0,
      ...config,
    };

    this.keys.push(newKey);
    this.persistKeys();
    return newKey;
  }

  public deleteKey(id: string) {
    const target = this.keys.find(k => k.id === id);
    if (target?.isSystem) {
      // Just clear key content for system slot
      this.keys = this.keys.map(k => (k.id === id ? { ...k, key: '', status: 'standby' } : k));
    } else {
      this.keys = this.keys.filter(k => k.id !== id);
    }

    // Ensure at least one key is active if available
    if (!this.keys.some(k => k.status === 'active')) {
      const nextAvailable = this.keys.find(k => k.key.trim().length > 0);
      if (nextAvailable) {
        this.setActiveKey(nextAvailable.id);
      }
    }

    this.persistKeys();
  }

  public incrementUsage(id: string) {
    this.keys = this.keys.map(k => (k.id === id ? { ...k, usageCount: (k.usageCount || 0) + 1 } : k));
    this.persistKeys();
  }

  public updateKeyStatus(id: string, status: KeyStatus, errorMessage?: string, latencyMs?: number) {
    this.keys = this.keys.map(k => {
      if (k.id === id) {
        return {
          ...k,
          status,
          errorMessage,
          latencyMs: latencyMs ?? k.latencyMs,
          lastChecked: Date.now(),
        };
      }
      return k;
    });
    this.persistKeys();
  }

  /**
   * Automatic rotation/failover when limit or quota is exhausted
   */
  public rotateToNextKey(failedKeyId: string, reason: string): ApiKeyConfig | null {
    const failedKey = this.keys.find(k => k.id === failedKeyId);
    if (!failedKey) return null;

    // Mark failed key
    const isQuota =
      reason.includes('QUOTA') ||
      reason.includes('429') ||
      reason.includes('RESOURCE_EXHAUSTED') ||
      reason.includes('exceeded');

    const newStatus: KeyStatus = isQuota ? 'exhausted' : 'error';
    this.updateKeyStatus(failedKeyId, newStatus, reason);

    // Look for candidates: standby keys with non-empty key string
    const candidates = this.keys.filter(
      k => k.id !== failedKeyId && k.status !== 'exhausted' && k.status !== 'error' && k.key.trim().length > 0
    );

    if (candidates.length === 0) {
      console.warn('All configured API keys have been exhausted or are empty.');
      return null;
    }

    // Pick first candidate
    const nextKey = candidates[0];
    this.setActiveKey(nextKey.id);

    // Notify listeners
    this.rotationListeners.forEach(listener => {
      try {
        listener({ fromKey: failedKey, toKey: nextKey, reason });
      } catch (err) {
        console.error('Rotation listener error:', err);
      }
    });

    return nextKey;
  }

  public onKeyRotated(callback: KeyRotationCallback) {
    this.rotationListeners.push(callback);
    return () => {
      this.rotationListeners = this.rotationListeners.filter(l => l !== callback);
    };
  }

  /**
   * Test a single key's connectivity & response time
   */
  public async testKey(id: string): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const target = this.keys.find(k => k.id === id);
    if (!target) return { success: false, latencyMs: 0, message: 'Key not found' };
    if (!target.key || target.key.trim().length < 5) {
      this.updateKeyStatus(id, 'error', 'API Key ফাঁকা বা অসম্পূর্ণ');
      return { success: false, latencyMs: 0, message: 'API Key ফাঁকা বা অসম্পূর্ণ' };
    }

    this.updateKeyStatus(id, 'testing');
    const start = performance.now();

    try {
      if (target.key === 'SYSTEM_DEFAULT') {
        const latency = Math.round(performance.now() - start);
        this.updateKeyStatus(id, target.status === 'active' ? 'active' : 'standby', undefined, latency);
        return { success: true, latencyMs: latency, message: 'সিস্টেম ইঞ্জিন সক্রিয় (Gemini 3.8 Flash Connected)' };
      }

      if (target.provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${target.key.trim()}`;
        const res = await fetch(url);
        const latency = Math.round(performance.now() - start);

        if (res.ok) {
          this.updateKeyStatus(id, target.status === 'active' ? 'active' : 'standby', undefined, latency);
          return { success: true, latencyMs: latency, message: 'সক্রিয় ও সফল সংযোগ (Active & Connected)' };
        } else {
          const errBody = await res.json().catch(() => ({}));
          const errMsg = errBody?.error?.message || `HTTP ${res.status}`;
          const isQuota = res.status === 429 || errMsg.includes('Quota');
          this.updateKeyStatus(id, isQuota ? 'exhausted' : 'error', errMsg, latency);
          return { success: false, latencyMs: latency, message: errMsg };
        }
      } else if (target.provider === 'friendli') {
        const endpoint = (target.endpoint || 'https://api.friendli.ai/serverless/v1').replace(/\/+$/, '');
        const res = await fetch(`${endpoint}/models`, {
          headers: {
            Authorization: `Bearer ${target.key.trim()}`,
          },
        });
        const latency = Math.round(performance.now() - start);

        if (res.ok) {
          this.updateKeyStatus(id, target.status === 'active' ? 'active' : 'standby', undefined, latency);
          return { success: true, latencyMs: latency, message: 'Friendli AI সংযুক্ত (Connected)' };
        } else {
          const errBody = await res.json().catch(() => ({}));
          const errMsg = errBody?.error?.message || `HTTP ${res.status}`;
          this.updateKeyStatus(id, res.status === 429 ? 'exhausted' : 'error', errMsg, latency);
          return { success: false, latencyMs: latency, message: errMsg };
        }
      } else if (target.provider === 'openai') {
        const endpoint = (target.endpoint || 'https://api.openai.com/v1').replace(/\/+$/, '');
        const res = await fetch(`${endpoint}/models`, {
          headers: {
            Authorization: `Bearer ${target.key.trim()}`,
          },
        });
        const latency = Math.round(performance.now() - start);

        if (res.ok) {
          this.updateKeyStatus(id, target.status === 'active' ? 'active' : 'standby', undefined, latency);
          return { success: true, latencyMs: latency, message: 'OpenAI সংযুক্ত (Connected)' };
        } else {
          const errBody = await res.json().catch(() => ({}));
          const errMsg = errBody?.error?.message || `HTTP ${res.status}`;
          this.updateKeyStatus(id, res.status === 429 ? 'exhausted' : 'error', errMsg, latency);
          return { success: false, latencyMs: latency, message: errMsg };
        }
      }

      return { success: false, latencyMs: 0, message: 'অজানা প্রোভাইডার' };
    } catch (err: any) {
      const latency = Math.round(performance.now() - start);
      const errMsg = err?.message || 'নেটওয়ার্ক সংযোগ ত্রুটি';
      this.updateKeyStatus(id, 'error', errMsg, latency);
      return { success: false, latencyMs: latency, message: errMsg };
    }
  }

  /**
   * Test all keys sequentially
   */
  public async testAllKeys(): Promise<void> {
    for (const key of this.keys) {
      if (key.key && key.key.trim().length > 5) {
        await this.testKey(key.id);
      }
    }
  }

  /**
   * Reset exhausted status for a key
   */
  public resetKey(id: string) {
    this.keys = this.keys.map(k => (k.id === id ? { ...k, status: 'standby', errorMessage: undefined } : k));
    this.persistKeys();
  }
}

export const apiManager = new ApiManagerService();
