"use client";
import { ConnectButton } from "@mysten/dapp-kit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BsCast } from "react-icons/bs";
import { MdClose, MdDashboard, MdMenu } from "react-icons/md";
import { RiCompassDiscoverLine } from "react-icons/ri";

const Navbar = () => {
	const pathname = usePathname();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const isActive = (path: string) => {
		return pathname === path;
	};

	const navLinkClass = (path: string) =>
		`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
			isActive(path)
				? "bg-blue-50 text-blue-600"
				: "text-gray-700 hover:bg-gray-50"
		}`;

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
	};

	return (
		<nav className="sticky top-0 z-50 border-b bg-white">
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<Link
						className="flex items-center gap-2 font-bold text-blue-600 text-xl"
						href="/"
					>
						<BsCast className="text-2xl" />
						<span>FundSui</span>
					</Link>

					{/* Desktop Navigation */}
					<ul className="hidden items-center gap-2 md:flex">
						<li>
							<Link className={navLinkClass("/browse")} href="/browse">
								<RiCompassDiscoverLine className="text-xl" />
								<span>Explore</span>
							</Link>
						</li>
						<li>
							<Link className={navLinkClass("/creator")} href="/creator">
								<MdDashboard className="text-xl" />
								<span>Dashboard</span>
							</Link>
						</li>
					</ul>

					{/* Right Side Actions - Desktop */}
					<div className="hidden items-center gap-4 md:flex">
						<div className="rounded-lg p-1">
							<ConnectButton />
						</div>
					</div>

					{/* Mobile Menu Button */}
					<button
						aria-label="Toggle menu"
						className="rounded-lg p-2 transition-colors hover:bg-gray-100 md:hidden"
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
					<div className="border-t py-4 md:hidden">
						<ul className="flex flex-col gap-2">
							<li>
								<Link
									className={navLinkClass("/browse")}
									href="/browse"
									onClick={closeMobileMenu}
								>
									<RiCompassDiscoverLine className="text-xl" />
									<span>Explore</span>
								</Link>
							</li>
							<li>
								<Link
									className={navLinkClass("/creator")}
									href="/creator"
									onClick={closeMobileMenu}
								>
									<MdDashboard className="text-xl" />
									<span>Dashboard</span>
								</Link>
							</li>
						</ul>

						{/* Mobile Connect Button */}
						<div className="mt-4 border-t pt-4">
							<ConnectButton />
						</div>
					</div>
				)}
			</div>
		</nav>
	);
};

export default Navbar;
