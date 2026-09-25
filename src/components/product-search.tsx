"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

type ProductSearchProps = {
  className?: string;
  inputId?: string;
  onSearch?: (keyword: string) => void;
};

export function ProductSearch({ className = "", inputId = "product-search-input", onSearch }: ProductSearchProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("search") ?? "");

  useEffect(() => {
    setValue(searchParams.get("search") ?? "");
  }, [searchParams]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = value.trim();
    if (onSearch) {
      onSearch(keyword);
      return;
    }
    const params = new URLSearchParams(pathname === "/products" ? searchParams.toString() : "");
    if (keyword) params.set("search", keyword);
    else params.delete("search");
    const query = params.toString();
    router.push(`/products${query ? `?${query}` : ""}`, { scroll: false });
  };

  return <form className={`product-search ${className}`.trim()} onSubmit={handleSubmit} role="search">
    <label className="sr-only" htmlFor={inputId}>Tìm kiếm sản phẩm</label>
    <input id={inputId} type="search" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Tìm kiếm sản phẩm..." aria-label="Tìm kiếm sản phẩm" />
    <button type="submit" aria-label="Tìm kiếm"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg></button>
  </form>;
}
