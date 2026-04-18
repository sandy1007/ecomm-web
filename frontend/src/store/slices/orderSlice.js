import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const createOrder = createAsyncThunk('orders/createOrder', async (orderData, { rejectWithValue }) => {
  try {
    const res = await api.post('/orders', orderData);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to place order');
  }
});

export const fetchMyOrders = createAsyncThunk('orders/fetchMyOrders', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/orders');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch orders');
  }
});

export const fetchOrderById = createAsyncThunk('orders/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Order not found');
  }
});

export const cancelOrder = createAsyncThunk('orders/cancelOrder', async (id, { rejectWithValue }) => {
  try {
    const res = await api.put(`/orders/${id}/cancel`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to cancel order');
  }
});

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    currentOrder: null,
    loading: false,
    placing: false,
    error: null,
  },
  reducers: {
    clearCurrentOrder(state) { state.currentOrder = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (s) => { s.placing = true; s.error = null; })
      .addCase(createOrder.fulfilled, (s, a) => {
        s.placing = false;
        s.currentOrder = a.payload;
        toast.success('Order placed successfully!');
      })
      .addCase(createOrder.rejected, (s, a) => {
        s.placing = false;
        s.error = a.payload;
        toast.error(a.payload);
      })

      .addCase(fetchMyOrders.pending, (s) => { s.loading = true; })
      .addCase(fetchMyOrders.fulfilled, (s, a) => { s.loading = false; s.orders = a.payload; })
      .addCase(fetchMyOrders.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchOrderById.fulfilled, (s, a) => { s.currentOrder = a.payload; })

      .addCase(cancelOrder.fulfilled, (s, a) => {
        s.orders = s.orders.map((o) => (o._id === a.payload._id ? a.payload : o));
        toast.success('Order cancelled');
      })
      .addCase(cancelOrder.rejected, (_, a) => toast.error(a.payload));
  },
});

export const { clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
