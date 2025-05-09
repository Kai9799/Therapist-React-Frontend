export interface Product {
  id: string;
  priceId: string;
  name: string;
  description?: string;
  mode: 'subscription';
}

export const products: Product[] = [
  {
    id: 'prod_S3iQMLAPDdjrnI',
    priceId: 'price_1R9azkCpV9qVbHgQydaJnohw',
    name: 'TheraPlan.io - Business Plan ( 20 Users )',
    mode: 'subscription'
  },
  {
    id: 'prod_S3iPaScUAmWuUd',
    priceId: 'price_1R9ayuCpV9qVbHgQmd8Ojie8',
    name: 'TheraPlan.io - Practice Plan ( 10 Users )',
    mode: 'subscription'
  },
  {
    id: 'prod_S3iOrLQ0KuVLzQ',
    priceId: 'price_1R9ay9CpV9qVbHgQw04miuz9',
    name: 'TheraPlan.io - Growth Plan ( 5 users )',
    description: 'For small, agile teams ready to scale.',
    mode: 'subscription'
  },
  {
    id: 'prod_S19LDin0711Uhr',
    priceId: 'price_1R772wCpV9qVbHgQih30ukI2',
    name: 'TheraPlan.io - Pro Plan',
    description: 'Everything unlocked — unlimited tools, clients, and content generation. Built for busy therapists who want simplicity and speed.',
    mode: 'subscription'
  },
  {
    id: 'prod_S19KNLuPscwMBR',
    priceId: 'price_1R7723CpV9qVbHgQ7SeDVfiu',
    name: 'TheraPlan.io - Basic',
    description: 'For solo therapists who need the essentials to run efficient sessions and generate helpful client resources.',
    mode: 'subscription'
  }
];

export const getProduct = (priceId: string) => {
  return products.find(product => product.priceId === priceId);
};

export const getProductByName = (name: string) => {
  return products.find(product => product.name === name);
};