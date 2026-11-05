import axios from 'axios';
import { SafeguardingAlertService } from './safeguarding-alert.service';

jest.mock('axios');

// docs/safeguarding SAFE-04
describe('SafeguardingAlertService', () => {
  const config = (vals: Record<string, string>) => ({ get: (k: string) => vals[k] });
  beforeEach(() => jest.clearAllMocks());

  it('does nothing until Telegram is set up', async () => {
    const s = new SafeguardingAlertService(config({}) as never);
    expect(s.isConfigured).toBe(false);
    await s.urgentCase('SG-0001');
    await expect(s.test()).resolves.toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('sends only the case reference and a link, never personal details', async () => {
    (axios.post as jest.Mock).mockResolvedValue({});
    const s = new SafeguardingAlertService(config({ SAFEGUARDING_TELEGRAM_BOT_TOKEN: '1:abc', SAFEGUARDING_TELEGRAM_CHAT_ID: '42', FRONTEND_URL: 'https://iluase.com' }) as never);
    await s.urgentCase('SG-0007');
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.telegram.org/bot1:abc/sendMessage',
      { chat_id: '42', text: 'Urgent safeguarding case SG-0007. Open https://iluase.com/admin (Safeguarding Cases) now.' },
      { timeout: 10000 }
    );
  });

  it('never throws when Telegram is unreachable', async () => {
    (axios.post as jest.Mock).mockRejectedValue(new Error('network'));
    const s = new SafeguardingAlertService(config({ SAFEGUARDING_TELEGRAM_BOT_TOKEN: '1:abc', SAFEGUARDING_TELEGRAM_CHAT_ID: '42' }) as never);
    await expect(s.test()).resolves.toBe(false);
  });
});
