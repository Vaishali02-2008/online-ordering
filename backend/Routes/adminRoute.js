

const express = require("express");
const router = express.Router();

const supabase = require("../utils/supabaseClient");
const adminMiddleware = require("../Middleware/adminMiddleware");

// Apply admin authentication to all routes below
router.use(adminMiddleware);

// GET all orders
router.get("/orders", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, orders: data });
  } catch (error) {
    console.error("Get orders error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
});

// UPDATE order status
router.patch("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status"
      });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Order status updated",
      order: data
    });
  } catch (error) {
    console.error("Update order error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update order status"
    });
  }
});

// ADD a product
router.post("/products", async (req, res) => {
  try {
    const { name, description, price, image_url, stock } = req.body;

    if (
      !name ||
      price === undefined ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      !Number.isInteger(Number(stock)) ||
      Number(stock) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a product name, valid price, and non-negative stock"
      });
    }

    const { data, error } = await supabase
      .from("products")
      .insert([{
        name,
        description,
        price: Number(price),
        image_url,
        stock: Number(stock)
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: data
    });
  } catch (error) {
    console.error("Add product error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to add product"
    });
  }
});

// UPDATE a product
router.put("/products/:id", async (req, res) => {
  try {
    const { name, description, price, image_url, stock } = req.body;

    const updates = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (image_url !== undefined) updates.image_url = image_url;

    if (price !== undefined) {
      if (!Number.isFinite(Number(price)) || Number(price) < 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a non-negative number"
        });
      }
      updates.price = Number(price);
    }

    if (stock !== undefined) {
      if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
        return res.status(400).json({
          success: false,
          message: "Stock must be a non-negative integer"
        });
      }
      updates.stock = Number(stock);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update"
      });
    }

    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Product updated successfully",
      product: data
    });
  } catch (error) {
    console.error("Update product error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update product"
    });
  }
});

// DELETE a product
router.delete("/products/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .delete()
      .eq("id", req.params.id)
      .select("id")
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Product deleted successfully",
      productId: data.id
    });
  } catch (error) {
    console.error("Delete product error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete product"
    });
  }
});

module.exports = router;

