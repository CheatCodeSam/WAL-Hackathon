"use client"
import { ConnectButton } from '@mysten/dapp-kit';
import { BsCast } from 'react-icons/bs';
import { RiCompassDiscoverLine } from 'react-icons/ri';
import { MdDashboard } from 'react-icons/md';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navLinkClass = (path: string) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
      isActive(path)
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-700 hover:bg-gray-50'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-blue-600"
            >
              <BsCast className="text-2xl" />
              <span>FundSui</span>
            </Link>

            <ul className="flex items-center gap-2">
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
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <div className="p-1 rounded-lg">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
