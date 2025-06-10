"use client"

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { ClockIcon } from "lucide-react";

interface TrialNotificationProps {
  variant?: "subtle";
}

export default function TrialNotification({ variant }: TrialNotificationProps) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrial = async () => {
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("users")
        .select("trial_active, trial_start_date")
        .eq("id", session.user.id)
        .single();
      if (!error && data?.trial_active && data?.trial_start_date) {
        const start = new Date(data.trial_start_date);
        const now = new Date();
        const diff = Math.max(0, 7 - Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        setDaysLeft(diff > 0 ? diff : 0);
      }
      setLoading(false);
    };
    fetchTrial();
  }, []);

  if (loading || daysLeft === null) return null;
  if (daysLeft <= 0) return null;

  if (variant === "subtle") {
    return (
      <div className="flex flex-col items-center text-center bg-white/70 border border-gray-200 rounded px-4 py-2 shadow-sm" style={{maxWidth: 320}}>
        <div className="flex flex-col items-center justify-center mb-1">
          <ClockIcon className="h-5 w-5 text-[#4B6EF5] mb-0.5" />
          <span className="text-base font-semibold text-gray-900">Free Trial Active</span>
        </div>
        <span className="inline-block px-3 py-0.5 rounded-full bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white font-semibold text-sm mb-1">
          {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
        </span>
        <span className="text-gray-700 text-xs">Enjoy all Pro features during your trial period.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex flex-col items-center justify-center mb-2">
        <ClockIcon className="h-6 w-6 text-[#4B6EF5] mb-1" />
        <span className="text-lg font-bold text-gray-900">Free Trial Active</span>
      </div>
      <span className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white font-semibold text-base mb-1">
        {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
      </span>
      <span className="text-gray-700 text-sm">Enjoy all Pro features during your trial period.</span>
    </div>
  );
} 