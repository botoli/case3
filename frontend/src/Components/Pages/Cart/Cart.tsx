import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";
import { createOrder } from "../../../api/orders";
import styles from "./Cart.module.scss";

function Cart() {
  const { items, totalCount, totalSum, removeItem, updateQuantity, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const openLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.hash = "#login";
  };

  const handleCheckout = async () => {
    if (!isAuthenticated || items.length === 0) return;
    setOrderError(null);
    setOrderLoading(true);
    try {
      await createOrder(
        items.map(({ product, quantity }) => ({
          product_id: product.id,
          quantity,
        }))
      );
      setOrderSuccess(true);
      clearCart();
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : "Ошибка оформления заказа");
    } finally {
      setOrderLoading(false);
    }
  };

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon} aria-hidden>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h2 className={styles.emptyTitle}>Корзина пуста</h2>
          <p className={styles.emptyText}>Добавьте товары из каталога</p>
          <a href="#" className={styles.emptyCta} onClick={(e) => { e.preventDefault(); window.location.hash = ""; }}>В каталог</a>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <div className={styles.successIcon} aria-hidden>✓</div>
          <h2 className={styles.emptyTitle}>Заказ оформлен</h2>
          <p className={styles.emptyText}>Спасибо за заказ. Мы свяжемся с вами для подтверждения.</p>
          <a href="#" className={styles.emptyCta} onClick={(e) => { e.preventDefault(); window.location.hash = ""; }}>В каталог</a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Корзина</h1>
        <p className={styles.subtitle}>{totalCount} {totalCount === 1 ? "товар" : totalCount < 5 ? "товара" : "товаров"}</p>

        <ul className={styles.list}>
          {items.map(({ product, quantity }) => (
            <li key={product.id} className={styles.row}>
              <div className={styles.rowImage}>
                <img
                  src={product.thumbnail || product.images?.[0]}
                  alt=""
                  width={80}
                  height={80}
                />
              </div>
              <div className={styles.rowInfo}>
                <span className={styles.rowCategory}>{product.category}</span>
                <h3 className={styles.rowTitle}>{product.title}</h3>
                <span className={styles.rowPrice}>
                  {product.price.toLocaleString("ru-RU")} ₽
                </span>
              </div>
              <div className={styles.rowQty}>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  aria-label="Уменьшить"
                >
                  −
                </button>
                <span className={styles.qtyValue}>{quantity}</span>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  aria-label="Увеличить"
                >
                  +
                </button>
              </div>
              <div className={styles.rowTotal}>
                {(product.price * quantity).toLocaleString("ru-RU")} ₽
              </div>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeItem(product.id)}
                aria-label="Удалить"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.footer}>
          <div className={styles.footerTotal}>
            <span className={styles.footerLabel}>Итого</span>
            <span className={styles.footerSum}>{totalSum.toLocaleString("ru-RU")} ₽</span>
          </div>
          {!isAuthenticated ? (
            <div className={styles.authBlock}>
              <p className={styles.authHint}>Войдите, чтобы оформить заказ</p>
              <button type="button" className={styles.authBtn} onClick={openLogin}>
                Войти
              </button>
            </div>
          ) : (
            <>
              {orderError && <p className={styles.orderError}>{orderError}</p>}
              <button
                type="button"
                className={styles.checkoutBtn}
                onClick={handleCheckout}
                disabled={orderLoading}
              >
                {orderLoading ? "Оформление…" : "Оформить заказ"}
              </button>
            </>
          )}
          <a href="#" className={styles.backLink} onClick={(e) => { e.preventDefault(); window.location.hash = ""; }}>Продолжить покупки</a>
        </div>
      </div>
    </div>
  );
}

export default Cart;
