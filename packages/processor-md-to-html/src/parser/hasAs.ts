export function hasAs(data: Record<string, unknown>, target: string): boolean {
  const as = data.as as string | string[]
  if (Array.isArray(as)) {
    return as.includes(target)
  }
  return as === target
}
