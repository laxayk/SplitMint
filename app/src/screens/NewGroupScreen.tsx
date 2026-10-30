import React, { useState } from 'react';
import { api } from '../api';
import { ErrorBox, Field, PrimaryButton, Screen, Title } from '../components/ui';

export default function NewGroupScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!name.trim()) return setError('Give the group a name');
    if (!/^[A-Za-z]{3}$/.test(currency)) return setError('Currency is a 3-letter code like INR');
    setBusy(true);
    try {
      await api('/api/groups', { method: 'POST', body: JSON.stringify({ name: name.trim(), currency: currency.toUpperCase() }) });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the group');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Title>New group</Title>
      {error ? <ErrorBox message={error} /> : null}
      <Field label="Name" value={name} onChange={setName} placeholder="Goa trip" />
      <Field label="Currency (fixed for this group)" value={currency} onChange={setCurrency} placeholder="INR" />
      <PrimaryButton title="Create group" onPress={create} loading={busy} />
    </Screen>
  );
}
