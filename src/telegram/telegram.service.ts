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
import { COINS_LIST, FAV_COINS_LIST } from 'src/crypto/helpers';
import { FavCoins, UserService } from 'src/user/user.service';

type Context = Scenes.SceneContext;

@Injectable()
@Update()
export class TelegramService extends Telegraf<Context> {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly cryptoService: CryptoService,
    private readonly userService: UserService,
    private readonly favcoinService: FavCoins,
  ) {
    const configService = new ConfigService();
    super(configService.get('TELEGRAM_BOT_TOKEN'));
  }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await this.userService.createUser(ctx.from.id).then((res) => {
      if (!res) {
        this.logger.log('User created early');
      } else {
        this.logger.log('User created now');
      }
    });

    return this.sendStartMessageContent(ctx);
  }

  @On('sticker')
  async onSticker(@Ctx() ctx: Context) {
    await ctx.reply('👍');
  }

  @Action(FAV_COINS_LIST)
  async addCoinToFav(@Ctx() ctx: Context) {
    const ctxCoinData: string = ctx.callbackQuery['data'];
    const coinSymbol = ctxCoinData.split('_')[1];

    const coin = await this.favcoinService.addCoinToFav(
      'unknown',
      coinSymbol,
      ctx.from.id,
    );

    if (!coin) {
      await ctx.reply('Не удалось добавить монету');
    }

    await ctx.editMessageText('Добавлено');
  }

  @Action('add-to-fav')
  async getCoinsToFavAdd(@Ctx() ctx: Context) {
    const currencyList =
      await this.cryptoService.getUnformattedCryproCoinsList();
    console.log(currencyList);
    for (const coin of currencyList.data) {
      await ctx.reply(
        coin.name,
        Markup.inlineKeyboard([
          [Markup.button.callback('Добавить', `fav_${coin.symbol}`)],
        ]),
      );
    }
  }

  @Action('coins')
  async getCurrencyCoinsFromEvent(@Ctx() ctx: Context) {
    const currentDate = this.getCurrentDateMSK(null);
    const currencyList = await this.cryptoService.getCryproCoinsList();
    await ctx.replyWithHTML(
      `<b>Стоимоить монет на ${currentDate} (МСК) 🕔</b>`,
    );
    await ctx.reply(
      currencyList.toString(),
      Markup.inlineKeyboard([[Markup.button.callback('В меню', 'menu')]]),
    );
  }

  @Action(COMMANDS_LIST.MENU)
  async showMenu(@Ctx() ctx: Context) {
    return this.sendStartMessageContent(ctx);
  }

  @Action(COMMANDS_LIST.FAV_COINS)
  async getUserFavCoins(@Ctx() ctx: Context) {
    const coins = await this.favcoinService.getFavCoins(ctx.from.id);
    if (!coins || !coins.length) {
      await ctx.replyWithHTML(
        '<b>В данный момент у Вас нет избранных монет, но все можно исправить!)</b>',
        Markup.inlineKeyboard([
          Markup.button.callback('Добавить', 'add-to-fav'),
          Markup.button.callback('Назад', 'menu'),
        ]),
      );
      await ctx.replyWithSticker(
        'CAACAgEAAxkBAAEMLwlmT2AK3_BsSdqVLYoX01SeF7556QAChQkAAr-MkARgo4FgVtZuBjUE',
      );
    }

    await ctx.replyWithHTML('<b>Избранные монеты: </b>');
    for (const el of coins) {
      const getCoinInfo = await this.cryptoService.getCurrentCoinInfo(
        el.symbol,
      );

      await ctx.replyWithHTML(`<b>${getCoinInfo.name}</b>`);
    }
    await ctx.replyWithHTML(
      '<b>По данным монетам Вы будете автоматически получать информацию каждые 12 часов! 🕔</b>',
      Markup.inlineKeyboard([Markup.button.callback('Назад', 'menu')]),
    );
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
    return this.sendTargetCoinsList(ctx);
  }

  @Command(COMMANDS_LIST.COINS)
  async getCurrencyCoins(@Ctx() ctx: Context) {
    const currentDate = this.getCurrentDateMSK(null);
    const currencyList = await this.cryptoService.getCryproCoinsList();
    await ctx.replyWithHTML(
      `<b>Стоимоить монет на ${currentDate} (МСК) 🕔</b>`,
    );
    await ctx.reply(
      currencyList.toString(),
      Markup.inlineKeyboard([[Markup.button.callback('В меню', 'menu')]]),
    );
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
        [
          Markup.button.callback('Все монеты', 'coins'),
          Markup.button.callback('Популярные монеты', 'target-coins'),
        ],
        [Markup.button.callback('Избранные монеты', 'fav-coins')],
      ]),
    );
  }

  private async sendTargetCoinsList(ctx: Context) {
    await ctx.replyWithHTML(
      `<b>Выбери монету по которой хочешь узнать подробную информацию🪙</b>`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('Bitcoin', 'btc'),
          Markup.button.callback('Ethereum', 'eth'),
          Markup.button.callback('Solana', 'sol'),
        ],
        [Markup.button.callback('В меню', 'menu')],
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
      Markup.inlineKeyboard([
        [
          Markup.button.callback('Назад', 'target-coins'),
          Markup.button.callback('В меню', 'menu'),
        ],
      ]),
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
