export function formatPrice(price: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(price)}đ`;
}

export function formatDate(dateString: string): string {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}
