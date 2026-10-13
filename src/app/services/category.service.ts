import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor() { }

  getAll(): Observable<Category[]> {
    // Dummy categories
    const categories: Category[] = [
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Clothing' },
      { id: 3, name: 'Books' }
    ];
    return of(categories);
  }
}
