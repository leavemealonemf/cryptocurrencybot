import { Injectable } from '@nestjs/common';
import { Markup, Scenes, Telegraf } from 'telegraf';
import { Update, Ctx, Start, Help, On, Hears } from 'nestjs-telegraf';
import { CryptoService } from 'src/crypto/crypto.service';
import { ConfigService } from '@nestjs/config';

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
    const date = new Date();

    const currencyList = await this.cryptoService.getCryproCoinsList();
    await ctx.replyWithHTML(
      `<b>Стоимоить монет на ${date.getDay()}.${date.getMonth()}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}</b>`,
    );
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
    const dateCoinUpd = new Date(coin.last_updated);
    const startCoinDate = new Date(coin.date_added);

    await ctx.replyWithHTML(
      `<b>Название: ${coin.name} / ${coin.symbol} 🪙</b>
<b>Цена в USD (точная): ${coin.quote.USD.price}💲</b>,
<b>Цена в USD (округленная): ${Math.round(coin.quote.USD.price)}💲</b>,
<b>Дата последнего обновления монеты: ${dateCoinUpd.getFullYear()}.${dateCoinUpd.getMonth()}.${dateCoinUpd.getDay()}🕔</b>,
<b>Дата старта монеты: ${startCoinDate.getFullYear()}.${startCoinDate.getMonth()}.${startCoinDate.getDay()}🕔</b>`,
    );
  }
}
