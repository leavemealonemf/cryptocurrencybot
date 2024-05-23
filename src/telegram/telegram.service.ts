import { Injectable, Logger } from '@nestjs/common';
import { Markup, Scenes, Telegraf } from 'telegraf';
import {
  Update,
  Ctx,
  Start,
  On,
  Hears,
  Command,
  Action,
} from 'nestjs-telegraf';
import { CryptoService } from 'src/crypto/crypto.service';
import { ConfigService } from '@nestjs/config';
import { toZonedTime, format } from 'date-fns-tz';
import { COMMANDS_LIST } from './helpers';
import { COINS_LIST } from 'src/crypto/helpers';

type Context = Scenes.SceneContext;

@Injectable()
@Update()
export class TelegramService extends Telegraf<Context> {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly cryptoService: CryptoService) {
    const configService = new ConfigService();
    super(configService.get('TELEGRAM_BOT_TOKEN'));
  }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    return this.sendStartMessageContent(ctx);
  }

  @On('sticker')
  async onSticker(@Ctx() ctx: Context) {
    await ctx.reply('👍');
  }

  @Action('coins')
  async getCurrencyCoinsFromEvent(@Ctx() ctx: Context) {
    const currentDate = this.getCurrentDateMSK(null);
    const currencyList = await this.cryptoService.getCryproCoinsList();
    await ctx.replyWithHTML(
      `<b>Стоимоить монет на ${currentDate} (МСК) 🕔</b>`,
    );
    await ctx.reply(currencyList.toString());
  }

  @Action(COMMANDS_LIST.MENU)
  async showMenu(@Ctx() ctx: Context) {
    return this.sendStartMessageContent(ctx);
  }

  @Action(COINS_LIST)
  async getCurrentCointInfoIvent(@Ctx() ctx: Context) {
    const coinInfo = await this.cryptoService.getCurrentCoinInfo(
      ctx.callbackQuery['data'],
    );

    if (!coinInfo) {
      await ctx.replyWithHTML('<b>По данной монете нет информации 😞</b>');
    }

    this.currentCoinInfoPresent(coinInfo, ctx);
  }

  @Action('target-coins')
  async getTargetCoinsList(@Ctx() ctx: Context) {
    await ctx.replyWithHTML(
      `<b>Выбери монету по которой хочешь узнать подробную информацию🪙</b>`,
      Markup.inlineKeyboard([
        Markup.button.callback('Bitcoin', 'btc'),
        Markup.button.callback('Ethereum', 'eth'),
        Markup.button.callback('Solana', 'sol'),
        Markup.button.callback('В меню', 'menu'),
      ]),
    );
  }

  @Command(COMMANDS_LIST.COINS)
  async getCurrencyCoins(@Ctx() ctx: Context) {
    const currentDate = this.getCurrentDateMSK(null);
    const currencyList = await this.cryptoService.getCryproCoinsList();
    await ctx.replyWithHTML(
      `<b>Стоимоить монет на ${currentDate} (МСК) 🕔</b>`,
    );
    await ctx.reply(currencyList.toString());
  }

  @Hears('FAQ')
  async getFAQ(@Ctx() ctx: Context) {
    await ctx.replyWithHTML(
      '<b>Я простой телеграм бот, который держит тебя в курсе цен на монеты</b>💰',
    );
  }

  private async sendStartMessageContent(ctx: Context) {
    await ctx.replyWithSticker(
      'CAACAgIAAxkBAAEMDMNmNiCGLBfRf-Wtr6oP9whrq4d5ZAACVwEAAhAabSKlKzxU-3o0qjQE',
    );
    await ctx.reply(
      `Рад тебя видеть, ${ctx.from.username}!👋🏻`,
      Markup.inlineKeyboard([
        Markup.button.callback('Все монеты', 'coins'),
        Markup.button.callback('Конкретные монеты', 'target-coins'),
      ]),
    );
  }

  private async currentCoinInfoPresent(coin, ctx: Context) {
    const dateCoinUpd = this.getCurrentDateMSK(coin.last_updated);
    const startCoinDate = this.getCurrentDateMSK(coin.date_added);

    await ctx.replyWithHTML(
      `<b>Название: ${coin.name} / ${coin.symbol} 🪙</b>
<b>Цена в USD (точная): ${coin.quote.USD.price}💲</b>,
<b>Цена в USD (округленная): ${Math.round(coin.quote.USD.price)}💲</b>,
<b>Дата последнего обновления монеты: ${dateCoinUpd} (МСК) 🕔</b>,
<b>Дата старта монеты: ${startCoinDate} (МСК) 🕔</b>`,
    );
  }

  private getCurrentDateMSK(time: string | null | undefined): string {
    let date: Date;

    if (!time) {
      date = new Date();
    } else {
      date = new Date(time);
    }

    const timeZone = 'Europe/Moscow';
    const zonedDate = toZonedTime(date, timeZone);

    const pattern = 'dd.MM.yyyy HH:mm:ss';
    const output = format(zonedDate, pattern, { timeZone: timeZone });

    return output;
  }
}
