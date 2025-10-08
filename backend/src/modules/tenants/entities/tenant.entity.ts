import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum BusinessType {
  TIENDA = 'Tienda',
  SUPERMERCADO = 'Supermercado',
  MINIMERCADO = 'Minimercado',
  FARMACIA = 'Farmacia',
  DROGUERIA = 'Droguería',
  RESTAURANTE = 'Restaurante',
  CAFETERIA = 'Cafetería',
  PANADERIA = 'Panadería',
  FERRETERIA = 'Ferretería',
  PAPELERIA = 'Papelería',
  BOUTIQUE = 'Boutique',
  SKATESHOP = 'Skateshop',
  DEPORTES = 'Artículos Deportivos',
  TECNOLOGIA = 'Tecnología y Electrónica',
  MASCOTAS = 'Tienda de Mascotas',
  BELLEZA = 'Belleza y Cosméticos',
  LICORES = 'Licores',
  VARIEDADES = 'Miscelánea/Variedades',
  OTRO = 'Otro',
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  businessName: string;

  @Column({ unique: true, length: 50 })
  nit: string; // NIT o documento tributario

  @Column({
    type: 'enum',
    enum: BusinessType,
    default: BusinessType.TIENDA,
  })
  businessType: BusinessType;

  @Column({ type: 'text' })
  address: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 100 })
  email: string;

  @Column({ length: 20 })
  betaKeyUsed: string; // Clave beta que se usó para registrar

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 1 })
  maxAdmins: number; // Límite de admins (1 en beta)

  @Column({ type: 'int', default: 1 })
  maxManagers: number; // Límite de managers (1 en beta)

  @Column({ type: 'int', default: 2 })
  maxCashiers: number; // Límite de cajeros (2 en beta)

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
