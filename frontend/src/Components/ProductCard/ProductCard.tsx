import styles from "./ProductCard.module.scss";
import { useCart } from "../../context/CartContext";
import type { Product } from "../../types/product";

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const { addItem, getQuantity } = useCart();
  const inStock = product.stock > 0;
  const inCart = getQuantity(product.id) > 0;

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <img
          className={styles.image}
          src={product.thumbnail || product.images?.[0]}
          alt={product.title}
          loading="lazy"
        />
        <div className={styles.imageOverlay} />
        {!inStock && <span className={styles.badgeOut}>Нет в наличии</span>}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.addBtn}
            disabled={!inStock}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (inStock) addItem(product);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {inCart ? "В корзине" : "В корзину"}
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <span className={styles.category}>{product.category}</span>
        <h3 className={styles.title}>{product.title}</h3>
        <div className={styles.footer}>
          <span className={styles.price}>{product.price.toLocaleString("ru-RU")} ₽</span>
          {product.rating > 0 && (
            <span className={styles.rating} aria-label={`Рейтинг: ${product.rating}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {product.rating}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
