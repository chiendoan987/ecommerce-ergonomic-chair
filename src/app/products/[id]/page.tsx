import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProductByIdOrSlugFromDb as getProductById,
  getRelatedProductsFromDb as getRelatedProducts,
} from "@/lib/server/product.repository";
import { formatPrice } from "@/lib/utils/format";
import { ProductDetailClient } from "./product-detail-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: "Không tìm thấy sản phẩm | ErgoChair",
      description: "Sản phẩm bạn đang tìm kiếm không tồn tại trên hệ thống ErgoChair.",
    };
  }

  const title = `${product.name} - ${product.category} | ErgoChair`;
  const description = `${product.description} Giá: ${formatPrice(product.price)}. Bảo hành chính hãng ${product.warranty}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: product.image,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.image],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const related = await getRelatedProducts(product.id, 4);

  return <ProductDetailClient initialProduct={product} initialRelated={related} />;
}
