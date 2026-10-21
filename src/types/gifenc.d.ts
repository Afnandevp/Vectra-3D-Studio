declare module 'gifenc' {
  export interface GIFEncoderOptions {
    auto?: boolean;
    initialCapacity?: number;
  }

  export interface WriteFrameOptions {
    palette?: number[][];
    transparent?: boolean;
    transparentIndex?: number;
    delay?: number;
    dispose?: number;
  }

  export interface QuantizeOptions {
    format?: 'rgb565' | 'rgba4444';
    oneBitAlpha?: boolean;
    clearAlpha?: boolean;
  }

  export function GIFEncoder(options?: GIFEncoderOptions): {
    writeFrame: (
      index: Uint8Array | number[],
      width: number,
      height: number,
      options?: WriteFrameOptions
    ) => void;
    finish: () => void;
    bytes: () => Uint8Array;
    bytesView: () => Uint8Array;
    reset: () => void;
  };

  export function quantize(
    rgba: Uint8Array | number[],
    maxColors?: number,
    options?: QuantizeOptions
  ): number[][];

  export function applyPalette(
    rgba: Uint8Array | number[],
    palette: number[][],
    format?: string
  ): Uint8Array;

  const defaultExport: {
    GIFEncoder: typeof GIFEncoder;
    quantize: typeof quantize;
    applyPalette: typeof applyPalette;
  };

  export default defaultExport;
}
