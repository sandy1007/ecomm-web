import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiYoutube } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <h3 className="text-white font-semibold mb-3 uppercase text-xs tracking-wider">About</h3>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-white">About Us</Link></li>
            <li><Link to="/" className="hover:text-white">Careers</Link></li>
            <li><Link to="/" className="hover:text-white">Press</Link></li>
            <li><Link to="/" className="hover:text-white">Blog</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3 uppercase text-xs tracking-wider">Help</h3>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-white">Payments</Link></li>
            <li><Link to="/" className="hover:text-white">Shipping</Link></li>
            <li><Link to="/" className="hover:text-white">Returns</Link></li>
            <li><Link to="/" className="hover:text-white">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3 uppercase text-xs tracking-wider">Policy</h3>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-white">Return Policy</Link></li>
            <li><Link to="/" className="hover:text-white">Terms of Use</Link></li>
            <li><Link to="/" className="hover:text-white">Privacy</Link></li>
            <li><Link to="/" className="hover:text-white">Cookie Policy</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3 uppercase text-xs tracking-wider">Social</h3>
          <div className="flex gap-4 mt-1">
            <FiFacebook className="text-xl hover:text-white cursor-pointer" />
            <FiTwitter className="text-xl hover:text-white cursor-pointer" />
            <FiInstagram className="text-xl hover:text-white cursor-pointer" />
            <FiYoutube className="text-xl hover:text-white cursor-pointer" />
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2">Get the ShopKart App</p>
            <div className="flex gap-2">
              <div className="bg-gray-700 rounded px-2 py-1 text-xs">App Store</div>
              <div className="bg-gray-700 rounded px-2 py-1 text-xs">Google Play</div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-700 text-center py-4 text-xs text-gray-500">
        © {new Date().getFullYear()} ShopKart. All rights reserved.
      </div>
    </footer>
  );
}
