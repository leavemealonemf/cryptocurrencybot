import { ConfigService } from '@nestjs/config';
import { TelegrafModuleAsyncOptions } from 'nestjs-telegraf';

export const telegrafModuleAsyncOptions = (): TelegrafModuleAsyncOptions => ({
  useFactory: async (configService: ConfigService) => options(configService),
  inject: [ConfigService],
});

const options = (configService: ConfigService) => {
  return {
    token: configService.get<string>('TELEGRAM_BOT_TOKEN'),
  };
};
