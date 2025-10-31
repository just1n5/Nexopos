import { Injectable, BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'products');
  private readonly maxFileSizeMB = 5;
  private readonly allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  constructor() {
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  async uploadProductImage(file: Express.Multer.File): Promise<string> {
    // Validar tipo de archivo
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de archivo no permitido. Solo se aceptan imágenes JPEG, PNG y WebP'
      );
    }

    // Validar tamaño
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > this.maxFileSizeMB) {
      throw new BadRequestException(
        `La imagen es muy grande. Tamaño máximo: ${this.maxFileSizeMB}MB`
      );
    }

    // Generar nombre único
    const filename = `${uuidv4()}.webp`;
    const filepath = join(this.uploadDir, filename);

    try {
      // Optimizar y convertir a WebP
      await sharp(file.buffer)
        .resize(800, 800, {
          fit: 'inside', // Mantener aspect ratio
          withoutEnlargement: true // No agrandar imágenes pequeñas
        })
        .webp({
          quality: 85, // Buena calidad con compresión
          effort: 4 // Balance entre velocidad y compresión
        })
        .toFile(filepath);

      // Retornar URL relativa
      return `/uploads/products/${filename}`;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new BadRequestException('Error al procesar la imagen');
    }
  }

  async deleteProductImage(imageUrl: string): Promise<void> {
    if (!imageUrl || !imageUrl.startsWith('/uploads/products/')) {
      return;
    }

    const filename = imageUrl.split('/').pop();
    if (!filename) return;

    const filepath = join(this.uploadDir, filename);

    try {
      await fs.unlink(filepath);
    } catch (error) {
      console.warn('Error deleting image file:', error);
      // No lanzar error si el archivo no existe
    }
  }

  async getImagePath(imageUrl: string): Promise<string> {
    if (!imageUrl || !imageUrl.startsWith('/uploads/products/')) {
      throw new BadRequestException('URL de imagen inválida');
    }

    const filename = imageUrl.split('/').pop();
    if (!filename) {
      throw new BadRequestException('Nombre de archivo inválido');
    }

    return join(this.uploadDir, filename);
  }
}
