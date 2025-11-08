function assertEnvVar(varName: string, value: string | undefined): string {
    if (!value) {
        throw new Error(`Missing environment variable: ${varName}`);
    }
    return value;
}

export const config = {
    packageId: assertEnvVar('VITE_PACKAGE_ID', "Package Id"),
} as const;
