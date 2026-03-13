import { useEffect, useState } from "react";
import { Header } from "../Header/Header";
import { LoginModal } from "../LoginModal/LoginModal";
import styles from "./Layout.module.scss";

export function Layout({ children }: { children: React.ReactNode }) {
  const [hash, setHash] = useState(() =>
    typeof window !== "undefined" ? window.location.hash : ""
  );

  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const closeLogin = () => {
    window.location.hash = "";
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.bgShape} aria-hidden="true" />
      <div className={styles.noise} aria-hidden="true" />
      <Header />
      <div className={styles.content}>{children}</div>
      {hash === "#login" && (
        <LoginModal onClose={closeLogin} onSuccess={closeLogin} />
      )}
    </div>
  );
}
