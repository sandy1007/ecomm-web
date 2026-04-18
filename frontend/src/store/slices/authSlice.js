import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';
import bugsnagManager from '../../utils/bugsnag.jsx';

const storedUser = localStorage.getItem('user');

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

export const logout = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout');
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser ? JSON.parse(storedUser) : null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const handleAuth = (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      const { _id, name, email, role } = action.payload.user;
      bugsnagManager.setUser(_id, name, email);
      bugsnagManager.leaveBreadcrumb('Login Successful', { userId: _id, role }, 'user');
    };

    builder
      .addCase(register.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(register.fulfilled, handleAuth)
      .addCase(register.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(login.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled, handleAuth)
      .addCase(login.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
        bugsnagManager.leaveBreadcrumb('Login Failed', { reason: a.payload }, 'error');
      })

      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        localStorage.removeItem('user');
        bugsnagManager.leaveBreadcrumb('User Logged Out', {}, 'user');
        bugsnagManager.setUser(null);
        toast.success('Logged out');
      })

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

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
