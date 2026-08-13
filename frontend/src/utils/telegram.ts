import type {} from '@/@types/telegram';

export function getTelegramInitData(): string {
  if (window.Telegram?.WebApp?.initData) return window.Telegram.WebApp.initData;
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const search = new URLSearchParams(location.search);
  const authDate = Math.floor(Date.now() / 1000);
  return (
    hash.get('tgWebAppInitData') ??
    search.get('tgWebAppInitData') ??
    search.get('initData') ??
    `user=%7B%22id%22%3A100000001%2C%22first_name%22%3A%22User%22%7D&hash=mock_dev_hash&auth_date=${authDate}`
  );
}

export const getTelegramUser = () => window.Telegram?.WebApp?.initDataUnsafe?.user;
