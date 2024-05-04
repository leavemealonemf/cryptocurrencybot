import { Injectable } from '@nestjs/common';
import { Markup, Scenes, Telegraf } from 'telegraf';
import { Update, Ctx, Start, On, Hears } from 'nestjs-telegraf';
import { CryptoService } from 'src/crypto/crypto.service';
import { ConfigService } from '@nestjs/config';
import { toZonedTime, format } from 'date-fns-tz';

type Context = Scenes.SceneContext;

@Injectable()
@Update()
export class TelegramService extends Telegraf<Context> {
  constructor(private readonly cryptoService: CryptoService) {
    const configService = new ConfigService();
    super(configService.get('TELEGRAM_BOT_TOKEN'));
  }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await ctx.replyWithSticker(
      'CAACAgIAAxkBAAEMDMNmNiCGLBfRf-Wtr6oP9whrq4d5ZAACVwEAAhAabSKlKzxU-3o0qjQE',
    );
    await ctx.reply(
      `Рад тебя видеть, ${ctx.from.username}!👋🏻`,
      Markup.keyboard([['Монеты', 'Крупные монеты', 'FAQ']]).resize(),
    );
  }

  @On('sticker')
  async onSticker(@Ctx() ctx: Context) {
    await ctx.reply('👍');
  }

  @Hears('Крупные монеты')
  async getBigCoinsKeyboardList(@Ctx() ctx: Context) {
    await ctx.replyWithHTML(
      `<b>Выбери монету по которой хочешь узнать подробную информацию🪙</b>`,
      Markup.keyboard([['Bitcoin', 'Ethereum', 'Solana'], ['В меню']]).resize(),
    );
  }

  @Hears('В меню')
  async backToMainKeyboardMenu(@Ctx() ctx: Context) {
    await ctx.replyWithHTML(
      '<b>Меню</b>',
      Markup.keyboard([['Монеты', 'Крупные монеты', 'FAQ']]).resize(),
    );
  }

  @Hears('Bitcoin')
  async getBtcInfo(@Ctx() ctx: Context) {
    const coinInfo = await this.cryptoService.getCurrentCoinInfo('Bitcoin');

    if (!coinInfo) {
      await ctx.replyWithHTML('<b>По данной монете нет информации 😞</b>');
    }

    this.currentCoinInfoPresent(coinInfo, ctx);
  }

  @Hears('Ethereum')
  async getEthInfo(@Ctx() ctx: Context) {
    const coinInfo = await this.cryptoService.getCurrentCoinInfo('Ethereum');

    if (!coinInfo) {
      await ctx.replyWithHTML('<b>По данной монете нет информации 😞</b>');
    }

    this.currentCoinInfoPresent(coinInfo, ctx);
  }

  @Hears('Solana')
  async getSolInfo(@Ctx() ctx: Context) {
    const coinInfo = await this.cryptoService.getCurrentCoinInfo('Solana');

    if (!coinInfo) {
      await ctx.replyWithHTML('<b>По данной монете нет информации 😞</b>');
    }

    this.currentCoinInfoPresent(coinInfo, ctx);
  }

  @Hears('Монеты')
  async getCurrencyCoins(@Ctx() ctx: Context) {
    const currentDate = this.getCurrentDateMSK(null);
    const currencyList = await this.cryptoService.getCryproCoinsList();
    await ctx.replyWithHTML(`<b>Стоимоить монет на ${currentDate}</b>`);
    await ctx.reply(currencyList.toString());
  }

  @Hears('FAQ')
  async getFAQ(@Ctx() ctx: Context) {
    await ctx.replyWithHTML(
      '<b>Я простой телеграм бот, который держит тебя в курсе цен на монеты</b>💰',
    );
  }

  @Hears('/currency')
  async getCurrency(@Ctx() ctx: Context) {
    const currencyList = await this.cryptoService.getCryproCoinsList();
    await ctx.reply(currencyList.toString());
  }

  private async currentCoinInfoPresent(coin, ctx: Context) {
    const dateCoinUpd = this.getCurrentDateMSK(coin.last_updated);
    const startCoinDate = this.getCurrentDateMSK(coin.date_added);

    await ctx.replyWithHTML(
      `<b>Название: ${coin.name} / ${coin.symbol} 🪙</b>
<b>Цена в USD (точная): ${coin.quote.USD.price}💲</b>,
<b>Цена в USD (округленная): ${Math.round(coin.quote.USD.price)}💲</b>,
<b>Дата последнего обновления монеты: ${dateCoinUpd} 🕔</b>,
<b>Дата старта монеты: ${startCoinDate} 🕔</b>`,
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
