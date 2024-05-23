import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { CryptoModule } from 'src/crypto/crypto.module';
import { telegrafModuleAsyncOptions } from './config';
import { DatabaseModule } from 'src/database/database.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    CryptoModule,
    TelegrafModule.forRootAsync(telegrafModuleAsyncOptions()),
    DatabaseModule,
    UserModule,
  ],
  providers: [TelegramService],
})
export class TelegramModule {}
