/**
 * useLockerSystem Hook
 * Manages locker system state with Supabase real-time subscriptions
 * All authorization is enforced server-side via RLS policies
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Locker, 
  LogEntry, 
  DbLocker, 
  DbLogEntry, 
  dbLockerToLocker, 
  dbLogToLogEntry,
  SystemSettings 
} from '@/types';
import { useAuth, UserProfile } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useLockerSystem = () => {
  const { profile } = useAuth();
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [examMode, setExamMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    if (!profile) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch lockers
        const { data: lockersData, error: lockersError } = await supabase
          .from('lockers')
          .select('*')
          .order('id');
        
        if (lockersError) throw lockersError;
        setLockers((lockersData as DbLocker[]).map(dbLockerToLocker));

        // Fetch activity logs
        const { data: logsData, error: logsError } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (logsError) throw logsError;
        setLogs((logsData as DbLogEntry[]).map(dbLogToLogEntry));

        // Fetch exam mode setting
        const { data: settingsData, error: settingsError } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'exam_mode')
          .single();
        
        if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
        if (settingsData) {
          const settings = settingsData.value as SystemSettings['exam_mode'];
          setExamMode(settings?.enabled ?? false);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!profile) return;

    // Subscribe to lockers changes
    const lockersChannel = supabase
      .channel('lockers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lockers' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLockers(prev => [...prev, dbLockerToLocker(payload.new as DbLocker)]);
          } else if (payload.eventType === 'UPDATE') {
            setLockers(prev => 
              prev.map(l => l.id === payload.new.id ? dbLockerToLocker(payload.new as DbLocker) : l)
            );
          } else if (payload.eventType === 'DELETE') {
            setLockers(prev => prev.filter(l => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to settings changes
    const settingsChannel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'system_settings', filter: 'key=eq.exam_mode' },
        (payload) => {
          const settings = payload.new.value as SystemSettings['exam_mode'];
          setExamMode(settings?.enabled ?? false);
        }
      )
      .subscribe();

    // Subscribe to activity logs
    const logsChannel = supabase
      .channel('logs-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => {
          setLogs(prev => [dbLogToLogEntry(payload.new as DbLogEntry), ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(lockersChannel);
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [profile]);

  // Add activity log entry
  const addLog = useCallback(async (action: string, details: string, user: UserProfile) => {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action,
        details,
      });
    
    if (error) {
      console.error('Error adding log:', error);
    }
  }, []);

  // Lock a specific locker (teacher only - enforced by RLS)
  const lockLocker = useCallback(async (lockerId: string) => {
    if (!profile) return;
    
    const { error } = await supabase
      .from('lockers')
      .update({ 
        status: 'locked',
        locked_by: profile.id,
        locked_at: new Date().toISOString()
      })
      .eq('id', lockerId);
    
    if (error) {
      toast.error('Failed to lock locker', { description: 'Permission denied' });
      console.error('Error locking locker:', error);
      return;
    }

    await addLog('LOCKER_LOCK', `Locked locker ${lockerId}`, profile);
  }, [profile, addLog]);

  // Unlock a specific locker (teacher only - enforced by RLS)
  const unlockLocker = useCallback(async (lockerId: string) => {
    if (!profile) return;
    
    const { error } = await supabase
      .from('lockers')
      .update({ 
        status: 'unlocked',
        locked_by: null,
        locked_at: null
      })
      .eq('id', lockerId);
    
    if (error) {
      toast.error('Failed to unlock locker', { description: 'Permission denied' });
      console.error('Error unlocking locker:', error);
      return;
    }

    await addLog('LOCKER_UNLOCK', `Unlocked locker ${lockerId}`, profile);
  }, [profile, addLog]);

  // Toggle locker status (for students with their own locker)
  const toggleLocker = useCallback(async (lockerId: string) => {
    if (!profile) return;
    
    const locker = lockers.find(l => l.id === lockerId);
    if (!locker) return;

    const newStatus = locker.status === 'locked' ? 'unlocked' : 'locked';
    
    const { error } = await supabase
      .from('lockers')
      .update({ 
        status: newStatus,
        locked_by: newStatus === 'locked' ? profile.id : null,
        locked_at: newStatus === 'locked' ? new Date().toISOString() : null
      })
      .eq('id', lockerId);
    
    if (error) {
      toast.error(`Failed to ${newStatus === 'locked' ? 'lock' : 'unlock'} locker`);
      console.error('Error toggling locker:', error);
      return;
    }

    await addLog(
      newStatus === 'locked' ? 'LOCKER_LOCK' : 'LOCKER_UNLOCK',
      `${newStatus === 'locked' ? 'Locked' : 'Unlocked'} locker ${lockerId}`,
      profile
    );
  }, [profile, lockers, addLog]);

  // Lock all lockers (teacher only - enforced by RLS)
  const lockAllLockers = useCallback(async () => {
    if (!profile) return;
    
    const { error } = await supabase
      .from('lockers')
      .update({ 
        status: 'locked',
        locked_by: profile.id,
        locked_at: new Date().toISOString()
      })
      .neq('status', 'locked');
    
    if (error) {
      toast.error('Failed to lock all lockers', { description: 'Permission denied' });
      console.error('Error locking all lockers:', error);
      return;
    }

    await addLog('LOCK_ALL', 'Emergency: Locked all lockers', profile);
    toast.success('All Lockers Locked', { description: 'Emergency lockdown completed' });
  }, [profile, addLog]);

  // Toggle exam mode (teacher only - enforced by RLS)
  const toggleExamMode = useCallback(async () => {
    if (!profile) return;
    
    const newMode = !examMode;
    
    const { error } = await supabase
      .from('system_settings')
      .update({ 
        value: { enabled: newMode },
        updated_by: profile.id,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'exam_mode');
    
    if (error) {
      toast.error('Failed to toggle exam mode', { description: 'Permission denied' });
      console.error('Error toggling exam mode:', error);
      return;
    }

    await addLog(
      newMode ? 'EXAM_MODE_ON' : 'EXAM_MODE_OFF',
      `${newMode ? 'Enabled' : 'Disabled'} exam mode`,
      profile
    );
  }, [profile, examMode, addLog]);

  // Add a new locker (teacher only)
  const addLocker = useCallback(async (locker: Omit<Locker, 'status'> & { location: string }) => {
    if (!profile) return;
    
    const { error } = await supabase
      .from('lockers')
      .insert({
        id: locker.id,
        student_id: locker.studentId,
        student_name: locker.studentName,
        status: 'locked',
        location: locker.location,
      });
    
    if (error) {
      toast.error('Failed to add locker', { description: error.message });
      console.error('Error adding locker:', error);
      return false;
    }

    await addLog('LOCKER_ADD', `Added locker ${locker.id} at ${locker.location}`, profile);
    return true;
  }, [profile, addLog]);

  // Update a locker (teacher only)
  const updateLocker = useCallback(async (lockerId: string, updates: Partial<Locker>) => {
    if (!profile) return;
    
    const dbUpdates: Partial<DbLocker> = {};
    if (updates.studentId !== undefined) dbUpdates.student_id = updates.studentId;
    if (updates.studentName !== undefined) dbUpdates.student_name = updates.studentName;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    
    const { error } = await supabase
      .from('lockers')
      .update(dbUpdates)
      .eq('id', lockerId);
    
    if (error) {
      toast.error('Failed to update locker', { description: error.message });
      console.error('Error updating locker:', error);
      return false;
    }

    await addLog('LOCKER_UPDATE', `Updated locker ${lockerId}`, profile);
    return true;
  }, [profile, addLog]);

  // Delete a locker (teacher only)
  const deleteLocker = useCallback(async (lockerId: string) => {
    if (!profile) return;
    
    const { error } = await supabase
      .from('lockers')
      .delete()
      .eq('id', lockerId);
    
    if (error) {
      toast.error('Failed to delete locker', { description: error.message });
      console.error('Error deleting locker:', error);
      return false;
    }

    await addLog('LOCKER_DELETE', `Deleted locker ${lockerId}`, profile);
    return true;
  }, [profile, addLog]);

  return {
    lockers,
    logs,
    examMode,
    isLoading,
    lockLocker,
    unlockLocker,
    toggleLocker,
    lockAllLockers,
    toggleExamMode,
    addLocker,
    updateLocker,
    deleteLocker,
    addLog,
  };
};
