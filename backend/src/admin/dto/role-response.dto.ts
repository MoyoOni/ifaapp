export class RoleResponseDto {
  id!: string;
  name!: string;
  description?: string;
  permissions!: string[];
  isActive!: boolean;
  createdAt!: Date;
  updatedAt?: Date;
}
