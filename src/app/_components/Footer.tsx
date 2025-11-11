import Link from "next/link";
import { BsCast } from "react-icons/bs";
import { FaDiscord, FaGithub, FaTwitter } from "react-icons/fa";

const Footer = () => {
	return (
		<footer className="border-t bg-white">
			<div className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-4">
					{/* Brand Section */}
					<div className="col-span-1 md:col-span-1">
						<Link
							className="mb-4 flex items-center gap-2 font-bold text-blue-600 text-xl"
							href="/"
						>
							<BsCast className="text-2xl" />
							<span>FundSui</span>
						</Link>
						<p className="text-gray-600 text-sm">
							Decentralized podcast platform powered by Sui blockchain.
						</p>
					</div>

					{/* Quick Links */}
					<div>
						<h3 className="mb-4 font-semibold">Platform</h3>
						<ul className="space-y-2 text-gray-600">
							<li>
								<Link className="hover:text-blue-600" href="/browse">
									Explore
								</Link>
							</li>
							<li>
								<Link className="hover:text-blue-600" href="/creator/dashboard">
									Creator Dashboard
								</Link>
							</li>
							<li>
								<Link className="hover:text-blue-600" href="/about">
									About Us
								</Link>
							</li>
						</ul>
					</div>

					{/* Resources */}
					<div>
						<h3 className="mb-4 font-semibold">Resources</h3>
						<ul className="space-y-2 text-gray-600">
							<li>
								<a className="hover:text-blue-600" href="#">
									Documentation
								</a>
							</li>
							<li>
								<a className="hover:text-blue-600" href="#">
									Help Center
								</a>
							</li>
							<li>
								<a className="hover:text-blue-600" href="#">
									Terms of Service
								</a>
							</li>
							<li>
								<a className="hover:text-blue-600" href="#">
									Privacy Policy
								</a>
							</li>
						</ul>
					</div>

					{/* Social Links */}
					<div>
						<h3 className="mb-4 font-semibold">Connect</h3>
						<div className="flex gap-4">
							<a
								className="text-gray-600 hover:text-blue-600"
								href="https://twitter.com"
								rel="noopener noreferrer"
								target="_blank"
							>
								<FaTwitter className="text-xl" />
							</a>
							<a
								className="text-gray-600 hover:text-blue-600"
								href="https://discord.com"
								rel="noopener noreferrer"
								target="_blank"
							>
								<FaDiscord className="text-xl" />
							</a>
							<a
								className="text-gray-600 hover:text-blue-600"
								href="https://github.com"
								rel="noopener noreferrer"
								target="_blank"
							>
								<FaGithub className="text-xl" />
							</a>
						</div>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="mt-8 border-t pt-8 text-center text-gray-600 text-sm">
					<p>&copy; {new Date().getFullYear()} FundSui. All rights reserved.</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
