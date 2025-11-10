"use client";

import CreatorSettingsForm from "./CreatorSettingsForm";

export default function Account() {
    const handleSubmit = async (values: {
        bio: string;
        coverPhoto: string;
        price: number;
        maxDuration: number;
    }) => {
        console.log("Form values:", values);
        // TODO: Call your API or tRPC mutation here
    };

    return (
        <div className="container mx-auto py-8">
            <CreatorSettingsForm
                initialValues={{
                    bio: "",
                    coverPhoto: "",
                    price: 0,
                    maxDuration: 30,
                }}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
