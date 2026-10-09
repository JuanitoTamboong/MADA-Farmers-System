export const EXPENSE_CATEGORIES = [
  'Seeds',
  'Fertilizer',
  'Pesticides',
  'Labor',
  'Fuel / Equipment',
  'Transportation',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const DEFAULT_EXPENSE_CATEGORY: ExpenseCategory = 'Seeds';

export interface ExpensePayload {
  category: ExpenseCategory;
  amount: string;
  note?: string;
  spentAt?: string;
}
