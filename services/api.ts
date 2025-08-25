// services/api.ts
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getLanHostFromExpo(): string | null {
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants.manifest as any)?.debuggerHost;
  if (!hostUri || typeof hostUri !== 'string') return null;
  return hostUri.split(':')[0];
}

function resolveBaseUrl() {
  if (!__DEV__) return 'https://<your-prod-host>';

  if (Platform.OS === 'ios') {
    const host = getLanHostFromExpo();
    if (host) {
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:8000';
      }
      return `http://${host}:8000`;
    }
    return 'http://localhost:8000';
  }

  return 'http://10.0.2.2:8000';
}

const BASE_URL =
  (Constants.expoConfig as any)?.extra?.apiBaseUrl || resolveBaseUrl();

type FetchGongsuOptions = { token?: string };

export async function fetchGongsu(question: string, opts: FetchGongsuOptions = {}) {
  const res = await fetch(`${BASE_URL}/gongsu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || 'Network/Server error'}`);
  }

  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

/** ====== 이름/생년월일/출생시 기반 점사 API ====== */

export type CalendarType = 'solar' | 'lunar';

export interface FortuneRequest {
  name: string;
  birthDate: string;   // 'YYYY-MM-DD'
  birthTime: string;   // 'HH:mm' (24시간)
  timezone?: string;   // e.g. 'Asia/Seoul'
  calendarType?: CalendarType;
  isLeapMonth?: boolean;
  concern?: string;    // ← 고민(선택)
}

export interface FortuneResponse {
  zodiac: string;               // 띠
  earthlyBranchHour: string;    // 출생시 지지 (자/축/…)
  summary: string;              // 한 줄 요약
  sections: {
    overview: string;
    love: string;
    career: string;
    health: string;
  };
  recommendations: string[];    // 행동 제안
}

export async function analyzeFortune(payload: FortuneRequest): Promise<FortuneResponse> {
  const res = await fetch(`${BASE_URL}/fortune/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`점사 실패 (${res.status}): ${text || 'Network/Server error'}`);
  }
  return res.json();
}
