import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import styles from "./Header.module.scss";

export function Header() {
  const { totalCount } = useCart();
  const { isAuthenticated, user, logout } = useAuth();

  const openLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.hash = "#login";
  };

  return (
    <header className={styles.header}>
      <a href="#" className={styles.logo} onClick={(e) => { e.preventDefault(); window.location.hash = ""; }}>
        <span className={styles.logoText}>NovaNet</span>
        <span className={styles.logoDot} />
      </a>

      <nav className={styles.nav}>
        <a href="#" className={styles.navLink} onClick={(e) => { e.preventDefault(); window.location.hash = ""; }}>Каталог</a>
        <a href="#support" className={styles.navLink}>Поддержка</a>
      </nav>

      <div className={styles.headerActions}>
        {isAuthenticated ? (
          <>
            <span className={styles.userEmail} title={user?.email ?? ""}>
              {user?.email ?? ""}
            </span>
            <button type="button" className={styles.btnLogout} onClick={logout}>
              Выйти
            </button>
          </>
        ) : (
          <button type="button" className={styles.btnAuth} onClick={openLogin} aria-label="Войти">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Войти</span>
          </button>
        )}
        <a href="#cart" className={styles.btnCart} aria-label="Корзина">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span>Корзина</span>
          {totalCount > 0 && (
            <span className={styles.cartBadge}>{totalCount > 99 ? "99+" : totalCount}</span>
          )}
        </a>
      </div>
    </header>
  );
}
