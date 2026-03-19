import { computed, Injectable, signal } from '@angular/core';

import { SessionUser } from '../../models/session-user';

const SESSION_TOKEN_KEY = 'employeehub.session.token';
const SESSION_USER_KEY = 'employeehub.session.user';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly tokenState = signal<string | null>(localStorage.getItem(SESSION_TOKEN_KEY));
  private readonly userState = signal<SessionUser | null>(this.readUser());

  readonly token = this.tokenState.asReadonly();
  readonly currentUser = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.tokenState()));

  setSession(token: string, user: SessionUser): void {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    this.tokenState.set(token);
    this.userState.set(user);
  }

  clearSession(): void {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    this.tokenState.set(null);
    this.userState.set(null);
  }

  private readUser(): SessionUser | null {
    const rawUser = localStorage.getItem(SESSION_USER_KEY);
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as SessionUser;
    } catch {
      localStorage.removeItem(SESSION_USER_KEY);
      return null;
    }
  }
}
