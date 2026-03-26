import { useEffect, useMemo, useState } from "react";
import ProductCard from "../../ProductCard/ProductCard";
import type { Product } from "../../../types/product";
import styles from "./Hero.module.scss";

export type { Product };

type ProductsResponse = Product[] | { products: Product[] };

const ALL_CATEGORIES = "all";

function Hero() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);

  useEffect(() => {
    fetch("https://cluster.novextask.ru/products")
      .then((response) => {
        if (!response.ok) throw new Error("Ошибка сети");
        return response.json() as Promise<ProductsResponse>;
      })
      .then((data) => {
        const fetchedProducts = Array.isArray(data) ? data : data.products;
        setProducts(fetchedProducts || []);
      })
      .catch(() => setError("Не удалось загрузить каталог."))
      .finally(() => setIsLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (categoryFilter === ALL_CATEGORIES) return products;
    return products.filter((p) => p.category === categoryFilter);
  }, [products, categoryFilter]);

  const getCategoryCount = (cat: string) => {
    if (cat === ALL_CATEGORIES) return products.length;
    return products.filter((p) => p.category === cat).length;
  };

  return (
    <main className={styles.heroRoot}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroLabel}>Сетевое оборудование</p>
          <h1 className={styles.heroTitle}>
            Инфраструктура, на которую можно положиться
          </h1>
          <p className={styles.heroDesc}>Роутеры, коммутаторы и оптические решения для бизнеса и дата-центров.</p>
          <a href="#catalog" className={styles.heroCta}>Смотреть каталог</a>
        </div>
        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.heroCard} />
          <div className={styles.heroLine} />
        </div>
      </section>

      <section id="catalog" className={styles.catalog}>
        <div className={styles.catalogTop}>
          <div className={styles.catalogHead}>
            <h2 className={styles.catalogTitle}>Каталог</h2>
            <span className={styles.catalogCount}>
              {!isLoading && !error ? filteredProducts.length : "—"} товаров
            </span>
          </div>

          {!isLoading && !error && products.length > 0 && categories.length > 0 && (
            <div className={styles.filters} role="tablist" aria-label="Фильтр по категориям">
              <button
                type="button"
                role="tab"
                aria-selected={categoryFilter === ALL_CATEGORIES}
                className={styles.filterBtn}
                data-active={categoryFilter === ALL_CATEGORIES}
                onClick={() => setCategoryFilter(ALL_CATEGORIES)}
              >
                Все
                <span className={styles.filterCount}>{getCategoryCount(ALL_CATEGORIES)}</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={categoryFilter === cat}
                  className={styles.filterBtn}
                  data-active={categoryFilter === cat}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                  <span className={styles.filterCount}>{getCategoryCount(cat)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading && <div className={styles.state}>Загрузка...</div>}
        {error && <div className={styles.state}>{error}</div>}

        {!isLoading && !error && filteredProducts.length > 0 && (
          <div className={styles.productGrid}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!isLoading && !error && products.length > 0 && filteredProducts.length === 0 && (
          <div className={styles.state}>В этой категории пока нет товаров</div>
        )}

        {!isLoading && !error && products.length === 0 && (
          <div className={styles.state}>Нет товаров</div>
        )}
      </section>
    </main>
  );
}

export default Hero;
