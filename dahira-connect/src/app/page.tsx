'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Contribution, Dahira, Member } from '@/types';

type User = { id: string; email?: string };

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dahiraName, setDahiraName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [amount, setAmount] = useState(5000);
  const [selectedDahiraId, setSelectedDahiraId] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);
  const [dahiras, setDahiras] = useState<Dahira[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email ?? '' });
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!user) return;
    void fetchData(user.id);
  }, [user]);

  const fetchData = async (userId: string) => {
    const { data: dahiraData } = await supabase.from('dahiras').select('*').eq('created_by', userId).order('created_at');
    const dahiraList = (dahiraData ?? []) as Dahira[];
    setDahiras(dahiraList);
    if (!selectedDahiraId && dahiraList[0]) setSelectedDahiraId(dahiraList[0].id);

    const ids = dahiraList.map((d) => d.id);
    if (ids.length === 0) return;

    const { data: memberData } = await supabase.from('members').select('*').in('dahira_id', ids).order('created_at');
    const memberList = (memberData ?? []) as Member[];
    setMembers(memberList);

    const memberIds = memberList.map((m) => m.id);
    if (memberIds.length === 0) return;

    const { data: contributionData } = await supabase.from('contributions').select('*').in('member_id', memberIds);
    setContributions((contributionData ?? []) as Contribution[]);
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert('Signup successful. Check your email to verify account.');
    setLoading(false);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    if (data.user) setUser({ id: data.user.id, email: data.user.email ?? '' });
    setLoading(false);
  };

  const createDahira = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !dahiraName.trim()) return;
    const { error } = await supabase.from('dahiras').insert({ name: dahiraName, created_by: user.id });
    if (error) return alert(error.message);
    setDahiraName('');
    await fetchData(user.id);
  };

  const addMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDahiraId || !memberName.trim()) return;
    const { error } = await supabase.from('members').insert({ dahira_id: selectedDahiraId, full_name: memberName });
    if (error) return alert(error.message);
    setMemberName('');
    await fetchData(user!.id);
  };

  const markContribution = async (memberId: string, paid: boolean) => {
    const month = new Date().toISOString().slice(0, 7);
    const existing = contributions.find((c) => c.member_id === memberId && c.month === month);

    if (existing) {
      await supabase.from('contributions').update({ paid, amount }).eq('id', existing.id);
    } else {
      await supabase.from('contributions').insert({ member_id: memberId, month, paid, amount });
    }

    await fetchData(user!.id);
  };

  const selectedMembers = members.filter((m) => m.dahira_id === selectedDahiraId);
  const thisMonth = new Date().toISOString().slice(0, 7);

  const stats = useMemo(() => {
    const monthContrib = contributions.filter((c) => c.month === thisMonth);
    const paidMemberIds = new Set(monthContrib.filter((c) => c.paid).map((c) => c.member_id));
    const totalContributions = monthContrib.filter((c) => c.paid).reduce((sum, c) => sum + c.amount, 0);

    return {
      totalMembers: selectedMembers.length,
      totalContributions,
      unpaidMembers: selectedMembers.filter((m) => !paidMemberIds.has(m.id)).length
    };
  }, [contributions, selectedMembers, thisMonth]);

  if (!user) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="mb-6 text-3xl font-bold">Dahira Connect</h1>
        <div className="space-y-4 rounded-xl bg-white p-6 shadow">
          <form onSubmit={handleSignup} className="space-y-3">
            <h2 className="text-lg font-semibold">Sign up</h2>
            <input className="w-full rounded border p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="w-full rounded border p-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="w-full rounded bg-indigo-600 p-2 text-white" disabled={loading}>Create account</button>
          </form>
          <form onSubmit={handleLogin} className="space-y-3">
            <h2 className="text-lg font-semibold">Login</h2>
            <button className="w-full rounded bg-slate-900 p-2 text-white" disabled={loading}>Login with email</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dahira Connect</h1>
        <button onClick={() => supabase.auth.signOut().then(() => setUser(null))} className="rounded bg-slate-900 px-4 py-2 text-white">Sign out</button>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Card label="Total members" value={String(stats.totalMembers)} />
        <Card label="Total contributions" value={`${stats.totalContributions} XOF`} />
        <Card label="Unpaid members" value={String(stats.unpaidMembers)} />
      </section>

      <section className="mb-6 grid gap-4 rounded-xl bg-white p-4 shadow md:grid-cols-2">
        <form onSubmit={createDahira} className="space-y-2">
          <h2 className="font-semibold">Create a dahira</h2>
          <input className="w-full rounded border p-2" value={dahiraName} onChange={(e) => setDahiraName(e.target.value)} placeholder="Dahira name" />
          <button className="rounded bg-indigo-600 px-3 py-2 text-white">Create</button>
        </form>

        <div className="space-y-2">
          <h2 className="font-semibold">Select dahira</h2>
          <select className="w-full rounded border p-2" value={selectedDahiraId} onChange={(e) => setSelectedDahiraId(e.target.value)}>
            <option value="">Choose one</option>
            {dahiras.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow">
        <form onSubmit={addMember} className="mb-4 flex gap-2">
          <input className="flex-1 rounded border p-2" value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="Member full name" />
          <button className="rounded bg-indigo-600 px-3 py-2 text-white">Add member</button>
        </form>

        <div className="space-y-2">
          {selectedMembers.map((m) => {
            const current = contributions.find((c) => c.member_id === m.id && c.month === thisMonth);
            return (
              <div key={m.id} className="flex items-center justify-between rounded border p-3">
                <span>{m.full_name}</span>
                <div className="flex items-center gap-2">
                  <input type="number" className="w-24 rounded border p-1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                  <button onClick={() => markContribution(m.id, true)} className="rounded bg-emerald-600 px-2 py-1 text-white">Paid</button>
                  <button onClick={() => markContribution(m.id, false)} className="rounded bg-rose-600 px-2 py-1 text-white">Unpaid</button>
                  <span className="text-sm">{current?.paid ? '✅' : '❌'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
