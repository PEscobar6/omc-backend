import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ValidRoles } from '../interfaces/valid-roles.interface';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 100 })
    name!: string;

    @Column({ unique: true, length: 255 })
    email!: string;

    @Column({ select: false })
    password!: string;

    @Column({
        type: 'enum',
        enum: ValidRoles,
        default: ValidRoles.USER,
    })
    role!: ValidRoles;

    @Column({ default: true })
    isActive!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}