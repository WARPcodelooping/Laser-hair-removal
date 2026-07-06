/**
 * Согласие на обработку персональных данных.
 * Отказ — приложение закрывается.
 */
import { useState } from 'react';
import { apiPost } from '../api/http';
import { closeApp } from '../services/telegram';

export default function Consent({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);

  const agree = async () => {
    setBusy(true);
    await apiPost('/consent');
    onDone();
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-8 pt-20">
      <div className="anim relative mx-auto flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-soft/60" />
        <span className="absolute -inset-3 rounded-full border border-soft/30" />
        <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-dark shadow-btn">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </span>
      </div>

      <h1 className="anim d1 mt-8 text-center font-display text-[30px] font-semibold leading-[1.15]">
        Согласие на обработку персональных данных
      </h1>
      <p className="anim d2 mt-4 text-center text-sm leading-relaxed text-accent-dark/85">
        Для записи на процедуры нам нужно сохранить ваше имя, номер телефона и
        данные Telegram-профиля. Мы используем их только для ведения записи и
        напоминаний о визитах — и никому не передаём.
      </p>

      <div className="anim d3 mt-auto flex flex-col gap-3">
        <button className="btn-primary" disabled={busy} onClick={agree}>
          {busy ? 'Секунду…' : 'Согласен(на)'}
        </button>
        <button className="btn-outline" onClick={closeApp}>
          Не согласен(на)
        </button>
      </div>
    </div>
  );
}
