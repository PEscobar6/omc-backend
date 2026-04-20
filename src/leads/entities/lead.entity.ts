import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from 'typeorm';

export enum LeadSource {
    INSTAGRAM = 'instagram',
    FACEBOOK = 'facebook',
    LANDING_PAGE = 'landing_page',
    REFERIDO = 'referido',
    OTRO = 'otro',
}

@Entity('leads')
export class Lead {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 255 })
    nombre!: string;

    @Column({ unique: true, length: 255 })
    email!: string;

    @Column({ length: 50, nullable: true })
    telefono!: string;

    @Column({
        type: 'enum',
        enum: LeadSource,
    })
    fuente!: LeadSource;

    @Column({ name: 'producto_interes', length: 255, nullable: true })
    productoInteres!: string;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        nullable: true,
    })
    presupuesto!: number;

    @Column({ default: true })
    status!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt!: Date;
}