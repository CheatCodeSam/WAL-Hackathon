const Footer = () => {
	return (
		<footer className="border-t bg-white">
			<div className="container mx-auto px-4 py-8">
				<div className=" text-center text-gray-600 text-sm">
					<p>&copy; {new Date().getFullYear()} FundSui. All rights reserved.</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
