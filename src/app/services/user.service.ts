// Angular UserService
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import type { User, Role } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = 'http://localhost:8889/api';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`).pipe(catchError(this.handleError));
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.baseUrl}/roles`).pipe(catchError(this.handleError));
  }

  createUser(userData: {
    username: string;
    password: string;
    roleId: number;
    fullName?: string;
    email?: string;
  }): Observable<User> {
    const userToCreate = {
      username: userData.username,
      password: userData.password, // 👈 send plain password
      roleId: userData.roleId,
      fullName: userData.fullName ?? '',
      email: userData.email ?? '',
    };
    return this.http.post<User>(`${this.baseUrl}/users`, userToCreate).pipe(catchError(this.handleError));
  }

  updateUserRole(userId: number, roleId: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/users/${userId}/role`, { roleId }).pipe(catchError(this.handleError));
  }

  updateUser(userId: number, userData: { username: string; email?: string; password?: string }): Observable<any> {
    const payload: any = { username: userData.username, email: userData.email ?? '' };
    if (userData.password) payload.password = userData.password; // 👈 send plain password
    return this.http.put<any>(`${this.baseUrl}/users/${userId}`, payload).pipe(catchError(this.handleError));
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/users/${userId}`).pipe(catchError(this.handleError));
  }

  searchUsers(query: string): Observable<User[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<User[]>(`${this.baseUrl}/users/search`, { params }).pipe(catchError(this.handleError));
  }

  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${userId}`).pipe(catchError(this.handleError));
  }

  // Add the missing method
  checkUserCanBeDeleted(userId: number): Observable<{ canDelete: boolean; reason?: string }> {
    return this.http.get<{ canDelete: boolean; reason?: string }>(`${this.baseUrl}/users/${userId}/can-delete`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('HTTP Error:', error);
    return throwError(() => error);
  }
}