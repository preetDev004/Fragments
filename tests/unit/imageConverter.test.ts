import { convertImage } from '../../src/utils/converter';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

// Mock sharp
jest.mock('sharp');

describe('Image Conversion Functions', () => {
  describe('convertImage with real files', () => {
    // You'll need to provide test images in your test fixtures directory
    const fixturesDir = path.join(__dirname, '../fixtures');

    beforeEach(() => {
      // Restore the original implementation for these tests
      jest.resetAllMocks();
      ((sharp as unknown) as jest.Mock).mockImplementation((...args) => jest.requireActual('sharp')(...args));
    });

    test('converts PNG to JPEG', async () => {
      // Read a test PNG file
      const pngBuffer = await fs.readFile(path.join(fixturesDir, 'test-image.png'));

      // Convert to JPEG
      const jpegBuffer = await convertImage(pngBuffer, 'image/png', 'image/jpeg');

      // Basic validation - JPEG files start with specific bytes
      expect(jpegBuffer[0]).toBe(0xff);
      expect(jpegBuffer[1]).toBe(0xd8);
      expect(jpegBuffer[2]).toBe(0xff);
    });

    test('converts JPEG to WEBP', async () => {
      // Read a test JPEG file
      const jpegBuffer = await fs.readFile(path.join(fixturesDir, 'test-image.jpeg'));

      // Convert to WEBP
      const webpBuffer = await convertImage(jpegBuffer, 'image/jpeg', 'image/webp');

      // Basic validation - WEBP files typically start with "RIFF" and contain "WEBP"
      expect(webpBuffer.subarray(0, 4).toString()).toBe('RIFF');
      expect(webpBuffer.subarray(8, 12).toString()).toBe('WEBP');
    });

    test('converts image to PNG', async () => {
      // Read a test JPEG file
      const jpegBuffer = await fs.readFile(path.join(fixturesDir, 'test-image.jpeg'));

      // Convert to PNG
      const pngBuffer = await convertImage(jpegBuffer, 'image/jpeg', 'image/png');

      // Basic validation - PNG files start with specific bytes
      expect(pngBuffer[0]).toBe(0x89);
      expect(pngBuffer[1]).toBe(0x50); // P
      expect(pngBuffer[2]).toBe(0x4e); // N
      expect(pngBuffer[3]).toBe(0x47); // G
    });

    test('converts image to GIF', async () => {
      // Read a test JPEG file
      const jpegBuffer = await fs.readFile(path.join(fixturesDir, 'test-image.jpeg'));

      // Convert to GIF
      const gifBuffer = await convertImage(jpegBuffer, 'image/jpeg', 'image/gif');

      // Basic validation - GIF files start with "GIF"
      expect(gifBuffer[0]).toBe(0x47); // G
      expect(gifBuffer[1]).toBe(0x49); // I
      expect(gifBuffer[2]).toBe(0x46); // F
    });

    test('converts image to AVIF', async () => {
      // Read a test JPEG file
      const jpegBuffer = await fs.readFile(path.join(fixturesDir, 'test-image.jpeg'));

      // Convert to AVIF
      const avifBuffer = await convertImage(jpegBuffer, 'image/jpeg', 'image/avif');

      // Basic validation - Simply check that we get a buffer back
      // AVIF validation is more complex, so we just ensure we got some data
      expect(Buffer.isBuffer(avifBuffer)).toBe(true);
      expect(avifBuffer.length).toBeGreaterThan(0);
    });

  });

  describe('convertImage with mocked Sharp', () => {
    beforeEach(() => {
      jest.resetAllMocks();

      // Mock implementation of sharp
      const mockSharpInstance = {
        jpeg: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        gif: jest.fn().mockReturnThis(),
        avif: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock converted image')),
      };

      ((sharp as unknown) as jest.Mock).mockImplementation(() => mockSharpInstance);
    });

    test('throws error for unsupported format', async () => {
      const buffer = Buffer.from('test image data');

      await expect(convertImage(buffer, 'image/png', 'image/unsupported')).rejects.toThrow(
        'Unsupported target image format: image/unsupported'
      );
    });

    test('handles sharp errors gracefully', async () => {
      const mockSharpError = new Error('Sharp processing failed');

      // Mock sharp to throw an error
      ((sharp as unknown) as jest.Mock).mockImplementation(() => {
        throw mockSharpError;
      });

      const buffer = Buffer.from('test image data');

      await expect(convertImage(buffer, 'image/png', 'image/jpeg')).rejects.toThrow();
    });

    test('handles AVIF specific errors', async () => {
      const mockAvifError = new Error('AVIF decoding error');

      // First call throws, second call succeeds (for fallback)
      (sharp as unknown as jest.Mock)
        .mockImplementationOnce(() => {
          throw mockAvifError;
        })
        .mockImplementationOnce(() => ({
          jpeg: jest.fn().mockReturnThis(),
          toBuffer: jest.fn().mockResolvedValue(Buffer.from('fallback converted image')),
        }));

      const buffer = Buffer.from('test avif data');

      await expect(convertImage(buffer, 'image/avif', 'image/jpeg')).rejects.toThrow(
        'AVIF decoding error'
      );
    });
  });
});
