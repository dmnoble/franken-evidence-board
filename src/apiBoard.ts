// src/apiBoard.ts

import { State } from './types/index';

// The board state we store on the backend is just the "present" board State
export type BoardState = State;

interface CaseBoard {
  caseId: string;
  boardState: BoardState | null;
  updatedAt: string;
}

// Base URL: can be just http://localhost:3000 or the full .../api/v1
const RAW_API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

// Normalize so we end up with .../api/v1 exactly once
const withoutTrailingSlash = RAW_API_BASE_URL.replace(/\/$/, '');
const BASE_URL = withoutTrailingSlash.endsWith('/api/v1')
  ? withoutTrailingSlash
  : `${withoutTrailingSlash}/api/v1`;

// ---- HTTP helper ----

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status} for ${url}`);
  }

  return (await res.json()) as T;
}

// ---- Normalization ----

// Ensure we always return a State with { items: {...}, lines: [...] }
function normalizeBoardState(raw: BoardState | null | undefined): BoardState {
  const empty: BoardState = {
    items: {},
    lines: [],
  };

  if (!raw || typeof raw !== 'object') {
    return empty;
  }

  const anyRaw = raw as any;

  const items =
    anyRaw.items && typeof anyRaw.items === 'object' ? anyRaw.items : {};
  const lines = Array.isArray(anyRaw.lines) ? anyRaw.lines : [];

  return { items, lines };
}

// ---- Public API for the board component ----

export async function loadBoard(caseId: string): Promise<BoardState> {
  const data = await request<CaseBoard>(`/cases/${caseId}/board`);
  // data.boardState might be null the first time
  return normalizeBoardState(data.boardState);
}

export async function saveBoard(
  caseId: string,
  state: BoardState
): Promise<void> {
  // Save exactly what the board uses internally; server stores it as boardState
  await request<CaseBoard>(`/cases/${caseId}/board`, {
    method: 'PUT',
    body: JSON.stringify({ boardState: state }),
  });
}
