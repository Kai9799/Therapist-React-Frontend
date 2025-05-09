export interface Plan {
    id: string;
    name: string;
    price: number | null;
    description: string;
    features: string[];
    cta: string;
    highlight: boolean;
    isTiered: boolean;
}