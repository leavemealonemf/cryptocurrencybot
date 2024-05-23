import { Injectable, Logger } from '@nestjs/common';
import { User, FavCoins as Fav } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

// USER LOGIC
// USER LOGIC
// USER LOGIC

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async createUser(tgId: number): Promise<User | null> {
    const user = await this.findUser(tgId);
    if (user) return null;
    return await this.databaseService.user
      .create({
        data: {
          telegramId: tgId,
        },
      })
      .catch((err) => {
        this.logger.error(`Не удалось создать пользователя`);
        this.logger.error(err);
        return null;
      });
  }

  async findUser(tgId: number): Promise<User> {
    return await this.databaseService.user
      .findFirst({
        where: { telegramId: tgId },
      })
      .catch(() => {
        this.logger.error(`Не удалось найти пользователя с tgId: ${tgId}`);
        return null;
      });
  }
}

// FAV COINS LOGIC
// FAV COINS LOGIC
// FAV COINS LOGIC

@Injectable()
export class FavCoins {
  private readonly logger = new Logger(FavCoins.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService,
  ) {}

  async getFavCoins(tgId: number): Promise<Fav[] | null> {
    const isUserExist = await this.userService.findUser(tgId);

    if (!isUserExist) return null;

    return await this.databaseService.favCoins.findMany({
      where: { userId: isUserExist.id },
    });
  }

  async addCoinToFav(
    coinTitle: string,
    coinSymbol: string,
    tgId: number,
  ): Promise<Fav | null> {
    const isUserExist = await this.userService.findUser(tgId);

    if (!isUserExist) return null;

    const isCoinAlreadyFav = await this.checkIsCoinAlreadyFav(
      coinSymbol.toLowerCase(),
    );

    if (isCoinAlreadyFav) return null;

    return await this.databaseService.favCoins.create({
      data: {
        coin: coinTitle,
        symbol: coinSymbol.toLowerCase(),
        userId: isUserExist.id,
      },
    });
  }

  private async checkIsCoinAlreadyFav(coinSymbol: string): Promise<boolean> {
    const coin = await this.databaseService.favCoins.findFirst({
      where: { symbol: coinSymbol },
    });

    if (!coin) return true;
    return false;
  }
}
