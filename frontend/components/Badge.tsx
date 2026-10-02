export default function Badge({ status }: { status: string }) {
  const s = status.toLowerCase();
  
  let colorClass = "bg-slate-100 text-slate-700 border-slate-200"; // default muted
  
  if (s === 'pending') {
    colorClass = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (s === 'accepted' || s === 'active') {
    colorClass = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (s === 'returned') {
    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (s === 'rejected' || s === 'cancelled') {
    colorClass = "bg-rose-50 text-rose-700 border-rose-200";
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase ${colorClass}`}>
      {status}
    </span>
  );
}
