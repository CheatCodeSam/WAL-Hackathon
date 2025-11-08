"use client"
import { ConnectButton } from '@mysten/dapp-kit';
import { BsCast } from 'react-icons/bs';
import { RiCompassDiscoverLine } from 'react-icons/ri';
import { MdDashboard, MdMenu, MdClose } from 'react-icons/md';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const Navbar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navLinkClass = (path: string) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
      isActive(path)
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-700 hover:bg-gray-50'
    }`;

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-blue-600"
          >
            <BsCast className="text-2xl" />
            <span>FundSui</span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-2">
            <li>
              <Link href="/browse" className={navLinkClass('/browse')}>
                <RiCompassDiscoverLine className="text-xl" />
                <span>Explore</span>
              </Link>
            </li>
            <li>
              <Link href="/creator" className={navLinkClass('/creator')}>
                <MdDashboard className="text-xl" />
                <span>Dashboard</span>
              </Link>
            </li>
          </ul>

          {/* Right Side Actions - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <div className="p-1 rounded-lg">
              <ConnectButton />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <MdClose className="text-2xl" />
            ) : (
              <MdMenu className="text-2xl" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <ul className="flex flex-col gap-2">
              <li>
                <Link 
                  href="/browse" 
                  className={navLinkClass('/browse')}
                  onClick={closeMobileMenu}
                >
                  <RiCompassDiscoverLine className="text-xl" />
                  <span>Explore</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/creator" 
                  className={navLinkClass('/creator')}
                  onClick={closeMobileMenu}
                >
                  <MdDashboard className="text-xl" />
                  <span>Dashboard</span>
                </Link>
              </li>
            </ul>
            
            {/* Mobile Connect Button */}
            <div className="mt-4 pt-4 border-t">
              <ConnectButton />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
