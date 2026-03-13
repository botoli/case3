import { useEffect, useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Layout } from "./Components/Layout/Layout";
import Hero from "./Components/Pages/Hero/Hero";
import Cart from "./Components/Pages/Cart/Cart";
import "./App.css";

function AppContent() {
  const [page, setPage] = useState<"home" | "cart">(() =>
    typeof window !== "undefined" && window.location.hash === "#cart"
      ? "cart"
      : "home"
  );

  useEffect(() => {
    const onHash = () =>
      setPage(window.location.hash === "#cart" ? "cart" : "home");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <Layout>
      {page === "cart" ? <Cart /> : <Hero />}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
