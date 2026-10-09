// Daily Limit & Premium Token Activation Service

const STORAGE_KEY_COUNT = 'promptvision_daily_count_v1';
const STORAGE_KEY_DATE = 'promptvision_daily_date_v1';
const STORAGE_KEY_PREMIUM = 'promptvision_is_premium_v1';

export const FREE_DAILY_LIMIT = 10;
export const WHATSAPP_NUMBER = '01332756124';
export const WHATSAPP_LINK = `https://wa.me/8801332756124?text=${encodeURIComponent(
  'Hello PromptVision AI, I want to purchase Premium access token.'
)}`;

// Secret token code specified by user
export const SECRET_PREMIUM_TOKEN = '152643';

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const quotaService = {
  isPremium(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY_PREMIUM) === 'true';
    } catch {
      return false;
    }
  },

  setPremium(status: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEY_PREMIUM, status ? 'true' : 'false');
    } catch (e) {
      console.warn('Could not save premium status:', e);
    }
  },

  redeemToken(token: string): { success: boolean; message: string } {
    const cleanToken = token.trim();
    if (cleanToken === SECRET_PREMIUM_TOKEN) {
      this.setPremium(true);
      return {
        success: true,
        message: 'অভিনন্দন! আপনার প্রিমিয়াম লাইফটাইম অ্যাক্টিভেশন সফল হয়েছে (Lifetime Pro Activated)!',
      };
    }
    return {
      success: false,
      message: 'ভুল অ্যাক্টিভেশন টোকেন! সঠিক টোকেন পেতে WhatsApp (01332756124)-এ যোগাযোগ করুন।',
    };
  },

  getDailyCount(): number {
    try {
      const today = getTodayString();
      const storedDate = localStorage.getItem(STORAGE_KEY_DATE);
      if (storedDate !== today) {
        // Reset count for new day
        localStorage.setItem(STORAGE_KEY_DATE, today);
        localStorage.setItem(STORAGE_KEY_COUNT, '0');
        return 0;
      }
      const count = parseInt(localStorage.getItem(STORAGE_KEY_COUNT) || '0', 10);
      return isNaN(count) ? 0 : count;
    } catch {
      return 0;
    }
  },

  getRemainingFreeUses(): number {
    if (this.isPremium()) {
      return Infinity;
    }
    const count = this.getDailyCount();
    return Math.max(0, FREE_DAILY_LIMIT - count);
  },

  canGenerate(): boolean {
    if (this.isPremium()) {
      return true;
    }
    return this.getRemainingFreeUses() > 0;
  },

  incrementUsage(): void {
    if (this.isPremium()) {
      return;
    }
    try {
      const current = this.getDailyCount();
      const today = getTodayString();
      localStorage.setItem(STORAGE_KEY_DATE, today);
      localStorage.setItem(STORAGE_KEY_COUNT, String(current + 1));
    } catch (e) {
      console.warn('Could not update daily count:', e);
    }
  },
};
