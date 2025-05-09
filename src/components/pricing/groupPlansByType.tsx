import { Plan } from "../../types/Plan";

export default function groupPlansByType(products: any[]): { individual: Plan[]; company: Plan[] } {
    const categorized: { individual: Plan[]; company: Plan[] } = { individual: [], company: [] };

    products.forEach((product) => {
        product.prices.forEach((price: any) => {
            try {
                const features: string[] = JSON.parse(price.metadata.features);
                const firstTierUnitAmount = price.tiers?.[0]?.unit_amount ?? null;

                const plan: Plan = {
                    id: price.id,
                    name: price.metadata.name,
                    price: price.unit_amount
                        ? price.unit_amount / 100
                        : firstTierUnitAmount
                            ? firstTierUnitAmount / 100
                            : null,
                    description: product.description || '',
                    features,
                    cta: price.metadata.cta,
                    highlight: price.metadata.highlight === 'true',
                    isTiered: !price.unit_amount && price.tiers?.length > 0,
                };


                if (product.name.toLowerCase().includes('organization') || product.name.toLowerCase().includes('business')) {
                    categorized.company.push(plan);
                } else {
                    categorized.individual.push(plan);
                }
            } catch (e) {
                console.error(`Error parsing plan metadata for price ID ${price.id}`, e);
            }
        });
    });

    return categorized;
}
