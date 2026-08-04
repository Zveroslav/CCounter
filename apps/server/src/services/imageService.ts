import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export const generateAndSaveThumbnail = async (userId: string, imagePath: string): Promise<string> => {
  const thumbnailDir = path.join(__dirname, '../../../uploads/thumbnails', userId);
  
  // Ensure the directory exists
  if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true });
  }

  const fileName = `${Date.now()}.webp`;
  const thumbnailPath = path.join(thumbnailDir, fileName);

  await sharp(imagePath)
    .resize(120, 120, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 65 })
    .toFile(thumbnailPath);

  // Return relative path for saving in DB
  return `/uploads/thumbnails/${userId}/${fileName}`;
};
