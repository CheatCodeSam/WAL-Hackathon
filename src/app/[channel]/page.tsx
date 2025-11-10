import Link from "next/link";
import { BsCast } from "react-icons/bs";
import { IoEllipsisHorizontal, IoShareSocialOutline } from "react-icons/io5";
import { RiUserFollowLine, RiUserUnfollowLine } from "react-icons/ri";
import { api } from "~/trpc/react";

interface PageProps {
	params: Promise<{
		channel: string;
	}>;
}

export default async function Channel({ params }: PageProps) {
	const { channel: suiAddress } = await params;

	return <div className="min-h-screen bg-gray-50">{suiAddress}, Hello</div>;
}
