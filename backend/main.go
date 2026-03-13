package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/lib/pq"
	_ "github.com/lib/pq"
)

// ---------- СТРУКТУРЫ ----------
type Product struct {
    ID          int      `json:"id"`
    Title       string   `json:"title"`
    Description string   `json:"description"`
    Category    string   `json:"category"`
    Price       float64  `json:"price"`
    Rating      float64  `json:"rating"`
    Stock       int      `json:"stock"`
    Brand       string   `json:"brand"`
    Thumbnail   string   `json:"thumbnail"`
    Images      []string `json:"images"`
}

type CartItem struct {
    ID        int     `json:"id"`
    ProductID int     `json:"product_id"`
    Quantity  int     `json:"quantity"`
    SessionID string  `json:"session_id"` // для гостей
    AddedAt   string  `json:"added_at"`
    Product   *Product `json:"product,omitempty"` // для расширенного ответа
}

type CartResponse struct {
    Items    []CartItem `json:"items"`
    Total    float64    `json:"total"`
    Count    int        `json:"count"`
}

type Order struct {
    ID         int        `json:"id"`
    SessionID  string     `json:"session_id"`
    Items      []CartItem `json:"items"`
    Total      float64    `json:"total"`
    Status     string     `json:"status"` // "new", "paid", "shipped"
    CustomerName string   `json:"customer_name"`
    CustomerEmail string  `json:"customer_email"`
    CustomerPhone string  `json:"customer_phone"`
    CreatedAt  string     `json:"created_at"`
}

var db *sql.DB

func main() {
    connStr := "postgres://myuser:root@localhost:5432/myapi?sslmode=disable"
    
    var err error
    db, err = sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal("Ошибка подключения:", err)
    }
    defer db.Close()
    
    createTables()
    
    r := mux.NewRouter()
    
    // Товары
    r.HandleFunc("/products", getProducts).Methods("GET")
    r.HandleFunc("/products/{id}", getProduct).Methods("GET")
    r.HandleFunc("/products", createProduct).Methods("POST")
    r.HandleFunc("/products/{id}", updateProduct).Methods("PUT")
    r.HandleFunc("/products/{id}", deleteProduct).Methods("DELETE")
    
    // Корзина
    r.HandleFunc("/cart", getCart).Methods("GET")
    r.HandleFunc("/cart/add", addToCart).Methods("POST")
    r.HandleFunc("/cart/update/{id}", updateCartItem).Methods("PUT")
    r.HandleFunc("/cart/remove/{id}", removeFromCart).Methods("DELETE")
    r.HandleFunc("/cart/clear", clearCart).Methods("DELETE")
    
    // Заказы
    r.HandleFunc("/orders", createOrder).Methods("POST")
    r.HandleFunc("/orders/{session_id}", getOrders).Methods("GET")
    
    log.Println("🚀 Сервер запущен на localhost:3000")
    log.Fatal(http.ListenAndServe(":3000", r))
}

func createTables() {
    // Таблица товаров
    productTable := `
    CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        price DECIMAL(10,2),
        rating DECIMAL(3,1),
        stock INTEGER,
        brand TEXT,
        thumbnail TEXT,
        images TEXT[]
    );`
    
    _, err := db.Exec(productTable)
    if err != nil {
        log.Fatal("Ошибка создания таблицы products:", err)
    }
    
    // Таблица корзины
    cartTable := `
    CREATE TABLE IF NOT EXISTS cart (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        session_id TEXT NOT NULL,
        added_at TIMESTAMP DEFAULT NOW()
    );`
    
    _, err = db.Exec(cartTable)
    if err != nil {
        log.Fatal("Ошибка создания таблицы cart:", err)
    }
    
    // Таблица заказов
    orderTable := `
    CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        total DECIMAL(10,2),
        status TEXT DEFAULT 'new',
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    );`
    
    _, err = db.Exec(orderTable)
    if err != nil {
        log.Fatal("Ошибка создания таблицы orders:", err)
    }
    
    // Таблица товаров в заказе
    orderItemsTable := `
    CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER,
        price DECIMAL(10,2),
        product_name TEXT,
        product_data JSONB
    );`
    
    _, err = db.Exec(orderItemsTable)
    if err != nil {
        log.Fatal("Ошибка создания таблицы order_items:", err)
    }
    
    log.Println("✅ Все таблицы созданы")
}

// ---------- PRODUCTS (как у тебя) ----------
func getProducts(w http.ResponseWriter, r *http.Request) {
    rows, err := db.Query(`
        SELECT id, title, description, category, price, rating, 
               stock, brand, thumbnail, images 
        FROM products
    `)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var products []Product
    for rows.Next() {
        var p Product
        err := rows.Scan(
            &p.ID, &p.Title, &p.Description, &p.Category, &p.Price,
            &p.Rating, &p.Stock, &p.Brand, &p.Thumbnail,
            pq.Array(&p.Images),
        )
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        products = append(products, p)
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(products)
}

func getProduct(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    id, _ := strconv.Atoi(vars["id"])
    
    var p Product
    err := db.QueryRow(`
        SELECT id, title, description, category, price, rating, 
               stock, brand, thumbnail, images 
        FROM products WHERE id = $1
    `, id).Scan(
        &p.ID, &p.Title, &p.Description, &p.Category, &p.Price,
        &p.Rating, &p.Stock, &p.Brand, &p.Thumbnail,
        pq.Array(&p.Images),
    )
    
    if err != nil {
        http.Error(w, "Товар не найден", http.StatusNotFound)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(p)
}

func createProduct(w http.ResponseWriter, r *http.Request) {
    var p Product
    err := json.NewDecoder(r.Body).Decode(&p)
    if err != nil {
        http.Error(w, "Неверный JSON", http.StatusBadRequest)
        return
    }
    
    var id int
    err = db.QueryRow(`
        INSERT INTO products (
            title, description, category, price, rating, 
            stock, brand, thumbnail, images
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
    `, p.Title, p.Description, p.Category, p.Price, p.Rating,
        p.Stock, p.Brand, p.Thumbnail, pq.Array(p.Images),
    ).Scan(&id)
    
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    p.ID = id
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(p)
}

func updateProduct(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    id, _ := strconv.Atoi(vars["id"])
    
    var p Product
    err := json.NewDecoder(r.Body).Decode(&p)
    if err != nil {
        http.Error(w, "Неверный JSON", http.StatusBadRequest)
        return
    }
    
    _, err = db.Exec(`
        UPDATE products SET 
            title = $1, description = $2, category = $3, 
            price = $4, rating = $5, stock = $6, 
            brand = $7, thumbnail = $8, images = $9
        WHERE id = $10
    `, p.Title, p.Description, p.Category, p.Price, p.Rating,
        p.Stock, p.Brand, p.Thumbnail, pq.Array(p.Images), id)
    
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    p.ID = id
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(p)
}

func deleteProduct(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    id, _ := strconv.Atoi(vars["id"])
    
    _, err := db.Exec("DELETE FROM products WHERE id = $1", id)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    w.WriteHeader(http.StatusNoContent)
}

// ---------- CART ----------
func getCart(w http.ResponseWriter, r *http.Request) {
    sessionID := r.URL.Query().Get("session_id")
    if sessionID == "" {
        http.Error(w, "session_id обязателен", http.StatusBadRequest)
        return
    }
    
    rows, err := db.Query(`
        SELECT c.id, c.product_id, c.quantity, c.session_id, 
               to_char(c.added_at, 'YYYY-MM-DD HH24:MI:SS'),
               p.id, p.title, p.price, p.thumbnail
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.session_id = $1
        ORDER BY c.added_at DESC
    `, sessionID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var items []CartItem
    var total float64
    var count int
    
    for rows.Next() {
        var item CartItem
        var p Product
        var addedAt string
        
        err := rows.Scan(
            &item.ID, &item.ProductID, &item.Quantity, &item.SessionID, &addedAt,
            &p.ID, &p.Title, &p.Price, &p.Thumbnail,
        )
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        
        item.AddedAt = addedAt
        item.Product = &p
        items = append(items, item)
        total += p.Price * float64(item.Quantity)
        count += item.Quantity
    }
    
    response := CartResponse{
        Items: items,
        Total: total,
        Count: count,
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}

func addToCart(w http.ResponseWriter, r *http.Request) {
    var req struct {
        ProductID int    `json:"product_id"`
        Quantity  int    `json:"quantity"`
        SessionID string `json:"session_id"`
    }
    
    err := json.NewDecoder(r.Body).Decode(&req)
    if err != nil || req.ProductID == 0 || req.Quantity < 1 || req.SessionID == "" {
        http.Error(w, "Неверные данные", http.StatusBadRequest)
        return
    }
    
    // Проверяем, есть ли товар
    var stock int
    err = db.QueryRow("SELECT stock FROM products WHERE id = $1", req.ProductID).Scan(&stock)
    if err != nil {
        http.Error(w, "Товар не найден", http.StatusNotFound)
        return
    }
    
    // Проверяем, есть ли уже такой товар в корзине
    var existingID int
    var existingQuantity int
    err = db.QueryRow(`
        SELECT id, quantity FROM cart 
        WHERE product_id = $1 AND session_id = $2
    `, req.ProductID, req.SessionID).Scan(&existingID, &existingQuantity)
    
    if err == nil {
        // Товар уже есть - обновляем количество
        newQuantity := existingQuantity + req.Quantity
        if newQuantity > stock {
            newQuantity = stock
        }
        
        _, err = db.Exec(`
            UPDATE cart SET quantity = $1, added_at = NOW()
            WHERE id = $2
        `, newQuantity, existingID)
    } else {
        // Новый товар
        _, err = db.Exec(`
            INSERT INTO cart (product_id, quantity, session_id)
            VALUES ($1, $2, $3)
        `, req.ProductID, req.Quantity, req.SessionID)
    }
    
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"message": "Товар добавлен в корзину"})
}

func updateCartItem(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    itemID, _ := strconv.Atoi(vars["id"])
    
    var req struct {
        Quantity int `json:"quantity"`
    }
    
    err := json.NewDecoder(r.Body).Decode(&req)
    if err != nil || req.Quantity < 1 {
        http.Error(w, "Неверные данные", http.StatusBadRequest)
        return
    }
    
    // Проверяем остаток
    var productID int
    var stock int
    err = db.QueryRow(`
        SELECT c.product_id, p.stock
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.id = $1
    `, itemID).Scan(&productID, &stock)
    
    if err != nil {
        http.Error(w, "Элемент не найден", http.StatusNotFound)
        return
    }
    
    if req.Quantity > stock {
        req.Quantity = stock
    }
    
    _, err = db.Exec("UPDATE cart SET quantity = $1 WHERE id = $2", req.Quantity, itemID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"message": "Количество обновлено"})
}

func removeFromCart(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    itemID, _ := strconv.Atoi(vars["id"])
    
    _, err := db.Exec("DELETE FROM cart WHERE id = $1", itemID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    w.WriteHeader(http.StatusNoContent)
}

func clearCart(w http.ResponseWriter, r *http.Request) {
    sessionID := r.URL.Query().Get("session_id")
    if sessionID == "" {
        http.Error(w, "session_id обязателен", http.StatusBadRequest)
        return
    }
    
    _, err := db.Exec("DELETE FROM cart WHERE session_id = $1", sessionID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    w.WriteHeader(http.StatusNoContent)
}

// ---------- ORDERS ----------
func createOrder(w http.ResponseWriter, r *http.Request) {
    var req struct {
        SessionID     string `json:"session_id"`
        CustomerName  string `json:"customer_name"`
        CustomerEmail string `json:"customer_email"`
        CustomerPhone string `json:"customer_phone"`
    }
    
    err := json.NewDecoder(r.Body).Decode(&req)
    if err != nil || req.SessionID == "" {
        http.Error(w, "Неверные данные", http.StatusBadRequest)
        return
    }
    
    // Получаем товары из корзины
    rows, err := db.Query(`
        SELECT c.product_id, c.quantity, p.title, p.price, p.stock
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.session_id = $1
    `, req.SessionID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var items []CartItem
    var total float64
    
    for rows.Next() {
        var item CartItem
        var productName string
        var price float64
        var stock int
        
        err := rows.Scan(&item.ProductID, &item.Quantity, &productName, &price, &stock)
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        
        if item.Quantity > stock {
            http.Error(w, "Недостаточно товара: "+productName, http.StatusBadRequest)
            return
        }
        
        items = append(items, item)
        total += price * float64(item.Quantity)
    }
    
    if len(items) == 0 {
        http.Error(w, "Корзина пуста", http.StatusBadRequest)
        return
    }
    
    // Создаем заказ
    var orderID int
    err = db.QueryRow(`
        INSERT INTO orders (session_id, total, customer_name, customer_email, customer_phone)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `, req.SessionID, total, req.CustomerName, req.CustomerEmail, req.CustomerPhone).Scan(&orderID)
    
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    // Добавляем товары в заказ и обновляем остатки
    for _, item := range items {
        // Получаем данные товара
        var product Product
        err = db.QueryRow(`
            SELECT title, price, description, category, brand, thumbnail
            FROM products WHERE id = $1
        `, item.ProductID).Scan(
            &product.Title, &product.Price, &product.Description,
            &product.Category, &product.Brand, &product.Thumbnail,
        )
        
        if err != nil {
            continue
        }
        
        // Сохраняем в order_items
        productData, _ := json.Marshal(product)
        _, _ = db.Exec(`
            INSERT INTO order_items (order_id, product_id, quantity, price, product_name, product_data)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, orderID, item.ProductID, item.Quantity, product.Price, product.Title, productData)
        
        // Обновляем остаток
        _, _ = db.Exec(`
            UPDATE products SET stock = stock - $1 WHERE id = $2
        `, item.Quantity, item.ProductID)
    }
    
    // Очищаем корзину
    db.Exec("DELETE FROM cart WHERE session_id = $1", req.SessionID)
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "order_id": orderID,
        "total":    total,
        "status":   "new",
    })
}

func getOrders(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    sessionID := vars["session_id"]
    
    rows, err := db.Query(`
        SELECT id, total, status, customer_name, customer_email, 
               to_char(created_at, 'YYYY-MM-DD HH24:MI:SS')
        FROM orders
        WHERE session_id = $1
        ORDER BY created_at DESC
    `, sessionID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var orders []Order
    for rows.Next() {
        var o Order
        var createdAt string
        err := rows.Scan(&o.ID, &o.Total, &o.Status, &o.CustomerName, &o.CustomerEmail, &createdAt)
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        o.CreatedAt = createdAt
        o.SessionID = sessionID
        orders = append(orders, o)
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(orders)
}