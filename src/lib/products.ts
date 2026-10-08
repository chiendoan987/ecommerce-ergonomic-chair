import { formatPrice } from "./utils/format";
import type { Product } from "./types/product";
import { getProducts, getProductById } from "./services/product.service";

export { formatPrice, getProducts, getProductById };
export type { Product };