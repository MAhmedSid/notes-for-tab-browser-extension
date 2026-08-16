const NOTE_WIDTH = 220;
const NOTE_HEIGHT = 180;
const OFFSET_STEP = 30;

export function getDefaultPosition(existingCount: number): { x: number; y: number } {
  return {
    x: 50 + (existingCount % 5) * OFFSET_STEP,
    y: 50 + (existingCount % 5) * OFFSET_STEP,
  };
}

export function getDefaultSize(): { width: number; height: number } {
  return { width: NOTE_WIDTH, height: NOTE_HEIGHT };
}
