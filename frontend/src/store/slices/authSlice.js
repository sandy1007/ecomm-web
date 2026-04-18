import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const login = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/profile');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await api.put('/auth/profile', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Update failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken || null,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Logged out');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const handleAuth = (state, action) => {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    };

    builder
      .addCase(register.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(register.fulfilled, handleAuth)
      .addCase(register.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(login.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled, handleAuth)
      .addCase(login.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchProfile.fulfilled, (s, a) => {
        s.user = a.payload;
        localStorage.setItem('user', JSON.stringify(a.payload));
      })

      .addCase(updateProfile.fulfilled, (s, a) => {
        s.user = a.payload;
        localStorage.setItem('user', JSON.stringify(a.payload));
        toast.success('Profile updated');
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
