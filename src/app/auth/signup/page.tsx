'use client';

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { useNetworkVariable } from '~/app/networkConfig';

export default function SignupPage() {
  const account = useCurrentAccount();
  const fundsuiPackageId = useNetworkVariable('fundsuiPackageId');
  const userRegistryId = useNetworkVariable('fundsuiUserRegistry');

  const suiClient = useSuiClient();
  const { mutateAsync } = useSignAndExecuteTransaction();

  const [status, setStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: { username: '' },
    onSubmit: async ({ value }) => {
      if (!account) {
        setStatus('Connect your wallet to continue.');
        return;
      }
      if (!value.username.trim()) {
        setStatus('Please enter a username.');
        return;
      }
      try {
        setIsSubmitting(true);
        setStatus('Creating your user on-chain...');

        const tx = new Transaction();
        tx.moveCall({
          target: `${fundsuiPackageId}::user::new`,
          arguments: [
            tx.object(userRegistryId),
            tx.pure.string(value.username.trim()),
          ],
        });

        await mutateAsync(
          { transaction: tx },
          {
            onSuccess: async (res) => {
              const finalized = await suiClient.waitForTransaction({
                digest: res.digest,
                options: { showEffects: true },
              });
              if (finalized.effects?.status.status === 'success') {
                setStatus('Signup complete! Your user has been created.');
              } else {
                setStatus('Transaction finalized but not successful.');
              }
            },
          }
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // Surface common Move aborts more nicely
        if (msg.includes('user already exists')) {
          setStatus('A user already exists for this address.');
        } else {
          setStatus(`Failed to create user: ${msg}`);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-6 font-bold text-3xl">Sign up</h1>
      <p className="mb-4 text-gray-600">
        Create your Fundsui profile by choosing a username. This will create an
        on-chain user object tied to your wallet address.
      </p>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="username">
          {(field) => (
            <div>
              <label
                className="mb-2 block font-medium text-sm"
                htmlFor={field.name}
              >
                Username
              </label>
              <input
                id={field.name}
                name={field.name}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. satoshi"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                autoComplete="off"
              />
            </div>
          )}
        </form.Field>

        {status && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            {status}
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting || !account}
        >
          {isSubmitting
            ? 'Creating...'
            : account
            ? 'Create account'
            : 'Connect wallet to continue'}
        </button>
      </form>
    </div>
  );
}
