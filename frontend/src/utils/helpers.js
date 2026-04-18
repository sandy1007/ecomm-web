export const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

export const getDiscountPercent = (price, discountPrice) => {
  if (!discountPrice || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
};

export const truncate = (str, n) => (str.length > n ? str.slice(0, n) + '...' : str);

export const getOrderStatusColor = (status) => {
  const map = {
    processing: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
};

export const renderStars = (rating) => {
  return Array.from({ length: 5 }, (_, i) => (i < Math.round(rating) ? '★' : '☆')).join('');
};
