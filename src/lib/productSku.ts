export function formatProductSkuDisplay(sku: string | null | undefined, prefix?: string | null) {
  const code = (sku ?? '').trim();
  if (!code) return '-';

  const skuPrefix = (prefix ?? '').trim();
  return skuPrefix ? `${skuPrefix}${code}` : code;
}
