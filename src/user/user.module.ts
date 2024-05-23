import { Module } from '@nestjs/common';
import { FavCoins, UserService } from './user.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [UserService, FavCoins],
  exports: [UserService, FavCoins],
})
export class UserModule {}
