export type Category = 
  | 'Süt ve Kahvaltılık' 
  | 'Et ve Tavuk' 
  | 'Meyve ve Sebze' 
  | 'İçecekler' 
  | 'Atıştırmalık' 
  | 'Temizlik' 
  | 'Diğer';

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: Category;
  expiryDate: string; // ISO String YYYY-MM-DD
  quantity: number;
  image?: string; // Base64 data URI
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  totalProducts: number;
  totalQuantity: number;
  expiredCount: number;
  criticalCount: number; // Expiring in <= 3 days
  warningCount: number; // Expiring in <= 7 days
}

export enum SortOption {
  ExpiryAsc = 'expiry_asc',
  ExpiryDesc = 'expiry_desc',
  NameAsc = 'name_asc',
  QuantityDesc = 'quantity_desc',
}