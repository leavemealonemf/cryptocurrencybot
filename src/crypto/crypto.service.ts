import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const CRYPTO_API_ENDPOINTS = {
  coinListLatest:
    'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
  fiveCoins:
    'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=5',
};

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);

  constructor(private readonly configService: ConfigService) {}

  async getCryproCoinsList() {
    try {
      const { data } = await axios.get(CRYPTO_API_ENDPOINTS.coinListLatest, {
        headers: {
          'X-CMC_PRO_API_KEY': this.configService.get('COIN_MARKET_API_TOKEN'),
        },
      });

      return this.formattedCryproList(data);
    } catch (error) {
      this.logger.error(error);
      throw new Error('Cannot get cryto coins list!');
    }
  }

  async getCurrentCoinInfo(coin: string) {
    try {
      const { data } = await axios.get(CRYPTO_API_ENDPOINTS.fiveCoins, {
        headers: {
          'X-CMC_PRO_API_KEY': this.configService.get('COIN_MARKET_API_TOKEN'),
        },
      });

      for (const el of data.data) {
        if (el.symbol.toLowerCase() === coin) {
          return el;
        }
      }
    } catch (error) {
      this.logger.error(error);
      throw new Error('Cannot get current coin info!');
    }
  }

  private formattedCryproList(data: any) {
    const collection = [];
    for (const el of data.data) {
      const element =
        el.name + ' ' + Math.round(el.quote.USD.price) + '$' + '\n';
      collection.push(element);
    }

    const collectionString = collection.join();

    const result = collectionString.replace(/,/g, '');

    return result;
  }
}
