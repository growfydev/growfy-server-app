import { PartialType } from '@nestjs/mapped-types';
import { CreateStorageDto } from './create-dropbox.dto';

export class UpdateStorageDto extends PartialType(CreateStorageDto) {}
