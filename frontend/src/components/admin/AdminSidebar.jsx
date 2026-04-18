import { NavLink } from 'react-router-dom';
import { FiGrid, FiPackage, FiShoppingBag, FiUsers, FiPlusCircle } from 'react-icons/fi';

const links = [
  { to: '/admin', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/admin/products', label: 'Products', icon: FiPackage },
  { to: '/admin/products/new', label: 'Add Product', icon: FiPlusCircle },
  { to: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
];

export default function AdminSidebar() {
  return (
    <aside className="w-56 flex-shrink-0">
      <div className="card p-4 sticky top-20">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Admin Panel</p>
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="text-base" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
