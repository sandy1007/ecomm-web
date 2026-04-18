import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/cart');
    return res.data.items;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addToCart = createAsyncThunk('cart/addToCart', async ({ productId, quantity = 1 }, { rejectWithValue }) => {
  try {
    const res = await api.post('/cart', { productId, quantity });
    return res.data.items;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add to cart');
  }
});

export const updateCartItem = createAsyncThunk('cart/updateCartItem', async ({ productId, quantity }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/cart/${productId}`, { quantity });
    return res.data.items;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update cart');
  }
});

export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (productId, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/cart/${productId}`);
    return res.data.items;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to remove from cart');
  }
});

export const clearCart = createAsyncThunk('cart/clearCart', async (_, { rejectWithValue }) => {
  try {
    await api.delete('/cart');
    return [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to clear cart');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], loading: false, error: null },
  reducers: {
    resetCart(state) { state.items = []; },
  },
  extraReducers: (builder) => {
    const setItems = (state, action) => {
      state.loading = false;
      state.items = action.payload;
    };

    builder
      .addCase(fetchCart.pending, (s) => { s.loading = true; })
      .addCase(fetchCart.fulfilled, setItems)
      .addCase(fetchCart.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(addToCart.fulfilled, (s, a) => {
        setItems(s, a);
        toast.success('Added to cart');
      })
      .addCase(addToCart.rejected, (s, a) => { toast.error(a.payload); })

      .addCase(updateCartItem.fulfilled, setItems)
      .addCase(removeFromCart.fulfilled, (s, a) => {
        setItems(s, a);
        toast.success('Removed from cart');
      })
      .addCase(clearCart.fulfilled, setItems);
  },
});

export const { resetCart } = cartSlice.actions;

export const selectCartItemCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, item) => {
    const price = item.product?.discountPrice > 0 ? item.product.discountPrice : item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

export default cartSlice.reducer;
