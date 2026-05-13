export function ease(x: number): number {
  return 1 - Math.sqrt(1 - Math.pow(x, 2))
}