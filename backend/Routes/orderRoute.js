

const express = require("express");
const router = express.Router();
const supabase = require("../utils/supabaseClient");

// Verify user login
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Please log in first"
      });
    }

    const token = authHeader.split(" ")[1];
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        error: "Invalid or expired token"
      });
    }

    req.user = data.user;
    req.token = token;
    next();
  } catch (error) {
    res.status(500).json({
      error: "Authentication failed"
    });
  }
}

// Create a Supabase client using the user's token
function getUserSupabase(token) {
  const { createClient } = require("@supabase/supabase-js");

  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}

// GET: Fetch logged-in user's orders
router.get("/", authenticateUser, async (req, res) => {
  try {
    const userSupabase = getUserSupabase(req.token);

    const { data, error } = await userSupabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch orders"
    });
  }
});

// POST: Place a new order
router.post("/", authenticateUser, async (req, res) => {
  try {
    const {
      items,
      delivery_address,
      payment_method
    } = req.body;

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      typeof delivery_address !== "string" ||
      !delivery_address.trim() ||
      delivery_address.length > 1000 ||
      payment_method !== "Cash on Delivery"
    ) {
      return res.status(400).json({
        error: "Provide valid items, delivery address and Cash on Delivery"
      });
    }

    // Validate products and quantities
    const quantities = new Map();

    for (const item of items) {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity);

      if (
        !Number.isSafeInteger(productId) ||
        productId <= 0 ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          error: "Invalid product ID or quantity"
        });
      }

      quantities.set(
        productId,
        (quantities.get(productId) || 0) + quantity
      );
    }

    const userSupabase = getUserSupabase(req.token);
    const productIds = [...quantities.keys()];

    const { data: products, error: productError } =
      await userSupabase
        .from("products")
        .select("id, name, price, stock")
        .in("id", productIds);

    if (productError) {
      return res.status(500).json({
        error: productError.message
      });
    }

    if (!products || products.length !== productIds.length) {
      return res.status(400).json({
        error: "One or more products do not exist"
      });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const product of products) {
      const quantity = quantities.get(product.id);

      if (quantity > product.stock) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}`
        });
      }

      const price = Number(product.price);
      subtotal += price * quantity;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        unit_price: price,
        quantity
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    const delivery_charge = subtotal >= 1000 ? 0 : 50;
    const total = Number((subtotal + delivery_charge).toFixed(2));

    // Create order
    const { data: order, error: orderError } =
      await userSupabase
        .from("orders")
        .insert({
          user_id: req.user.id,
          delivery_address: delivery_address.trim(),
          payment_method: "Cash on Delivery",
          subtotal,
          delivery_charge,
          total
        })
        .select()
        .single();

    if (orderError) {
      return res.status(500).json({
        error: orderError.message
      });
    }

    // Save order items
    const itemsToInsert = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await userSupabase
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      return res.status(500).json({
        error: "Order was created but order items could not be saved",
        order_id: order.id
      });
    }

    res.status(201).json({
      message: "Order placed successfully",
      order: {
        ...order,
        order_items: itemsToInsert
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to place order"
    });
  }
});

module.exports = router;
