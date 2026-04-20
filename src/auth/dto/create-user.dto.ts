import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({ example: 'John Doe', minLength: 1, maxLength: 100 })
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name!: string;

    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    @MaxLength(255)
    email!: string;

    @ApiProperty({ example: 'Password1!', minLength: 6, maxLength: 50, description: 'Must contain uppercase, lowercase and a number or special character' })
    @IsString()
    @MinLength(6)
    @MaxLength(50)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'The password must have a Uppercase, lowercase letter and a number'
    })
    password!: string;
}
