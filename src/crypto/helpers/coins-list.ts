export const COINS_LIST = ['btc', 'eth', 'sol'];
export const FAV_COINS_LIST = COINS_LIST.map(
  (coin) => 'fav_' + coin.toUpperCase(),
);
