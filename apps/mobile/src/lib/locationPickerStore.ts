import type { LocationPickerResult } from '../navigation/AppNavigator';

let pending: LocationPickerResult | null = null;

export function setLocationPickerResult(result: LocationPickerResult): void {
  pending = result;
}

export function consumeLocationPickerResult(): LocationPickerResult | null {
  const result = pending;
  pending = null;
  return result;
}
