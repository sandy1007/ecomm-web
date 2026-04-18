import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchProducts = createAsyncThunk('products/fetchProducts', async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/products?${query}`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch products');
  }
});

export const fetchProductById = createAsyncThunk('products/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/products/${id}`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Product not found');
  }
});

export const fetchCategories = createAsyncThunk('products/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/products/categories');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch categories');
  }
});

export const fetchReviews = createAsyncThunk('products/fetchReviews', async (productId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/products/${productId}/reviews`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch reviews');
  }
});

export const submitReview = createAsyncThunk('products/submitReview', async ({ productId, ...data }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/products/${productId}/reviews`, data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to submit review');
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    currentProduct: null,
    categories: [],
    reviews: [],
    pagination: { page: 1, pages: 1, total: 0 },
    loading: false,
    productLoading: false,
    error: null,
  },
  reducers: {
    clearCurrentProduct(state) { state.currentProduct = null; state.reviews = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchProducts.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.products;
        s.pagination = { page: a.payload.page, pages: a.payload.pages, total: a.payload.total };
      })
      .addCase(fetchProducts.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchProductById.pending, (s) => { s.productLoading = true; })
      .addCase(fetchProductById.fulfilled, (s, a) => { s.productLoading = false; s.currentProduct = a.payload; })
      .addCase(fetchProductById.rejected, (s, a) => { s.productLoading = false; s.error = a.payload; })

      .addCase(fetchCategories.fulfilled, (s, a) => { s.categories = a.payload; })

      .addCase(fetchReviews.fulfilled, (s, a) => { s.reviews = a.payload; })

      .addCase(submitReview.fulfilled, (s, a) => { s.reviews = [a.payload, ...s.reviews]; });
  },
});

export const { clearCurrentProduct } = productSlice.actions;
export default productSlice.reducer;
