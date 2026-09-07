export function hasAs(data: Record<string, unknown>, target: string): boolean {
  const as = data.as as unknown
  if (Array.isArray(as)) {
    return (as as unknown[]).includes(target)
  }
  return as === target
}
