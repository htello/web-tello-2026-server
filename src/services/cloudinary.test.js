import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('cloudinary', () => ({
  v2: {
    uploader: { destroy: vi.fn() },
  },
}));

const cloudinary = (await import('cloudinary')).v2;

describe('Cloudinary deletion service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });
  });

  it('should delete an image using its public id', async () => {
    const { deleteCloudinaryImage } = await import('./cloudinary.js');

    await deleteCloudinaryImage('portfolio-antonio-tello/pintura/obra-1');

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
      'portfolio-antonio-tello/pintura/obra-1',
      { resource_type: 'image' },
    );
  });

  it('should derive the public id from a Cloudinary URL', async () => {
    const { deleteCloudinaryImage, extractPublicId } = await import('./cloudinary.js');
    const imageUrl = 'https://res.cloudinary.com/demo/image/upload/w_300/v123/portfolio/obra.jpg';

    expect(extractPublicId(imageUrl)).toBe('portfolio/obra');
    await deleteCloudinaryImage(null, imageUrl);

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('portfolio/obra', { resource_type: 'image' });
  });

  it('should ignore external URLs without a public id', async () => {
    const { deleteCloudinaryImage } = await import('./cloudinary.js');

    await deleteCloudinaryImage(null, 'https://example.com/obra.jpg');

    expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
  });

  it('should ignore Cloudinary URLs without an upload path', async () => {
    const { extractPublicId } = await import('./cloudinary.js');

    expect(extractPublicId('https://res.cloudinary.com/demo/image.jpg')).toBeNull();
  });

  it('should extract a public id from a URL without a version segment', async () => {
    const { extractPublicId } = await import('./cloudinary.js');

    expect(extractPublicId('https://res.cloudinary.com/demo/image/upload/portfolio/obra.jpg'))
      .toBe('portfolio/obra');
  });

  it('should return null when the Cloudinary path has no public id', async () => {
    const { extractPublicId } = await import('./cloudinary.js');

    expect(extractPublicId('https://res.cloudinary.com/demo/image/upload/')).toBeNull();
  });

  it('should treat a missing Cloudinary image as an idempotent deletion', async () => {
    cloudinary.uploader.destroy.mockResolvedValue({ result: 'not found' });
    const { deleteCloudinaryImage } = await import('./cloudinary.js');

    await expect(deleteCloudinaryImage('portfolio/missing')).resolves.toBeUndefined();
  });

  it('should reject when Cloudinary returns an unexpected result', async () => {
    cloudinary.uploader.destroy.mockResolvedValue({ result: 'error' });
    const { deleteCloudinaryImage } = await import('./cloudinary.js');

    await expect(deleteCloudinaryImage('portfolio/error')).rejects.toThrow(
      'Cloudinary no eliminó la imagen',
    );
  });
});
