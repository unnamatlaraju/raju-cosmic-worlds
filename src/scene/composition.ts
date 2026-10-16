/** Shared visual proportions for the camera and its semantic destination target. */
export function getComposition(width: number, height: number) {
  const portrait = width < 680 || (width < 1000 && height > width * 0.95)
  if (portrait) {
    const compact = height < 740
    return {
      portrait,
      x: 0.58, y: compact ? 0.235 : 0.275,
      radius: Math.min(width * 0.225, height * 0.13) / height,
      arrivalX: 0.54, arrivalY: compact ? 0.28 : 0.31,
      arrivalRadius: Math.min(width * 0.44, height * 0.26) / height,
    }
  }
  return {
    portrait,
    x: width < 1150 ? 0.765 : 0.745, y: 0.47,
    radius: Math.min(height * 0.205, width * 0.125) / height,
    arrivalX: 0.62, arrivalY: 0.43,
    arrivalRadius: Math.min(height * 0.46, width * 0.31) / height,
  }
}
