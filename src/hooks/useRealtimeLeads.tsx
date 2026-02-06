import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

interface NewLeadNotification {
  id: string;
  lead: Lead;
  timestamp: Date;
  read: boolean;
}

export function useRealtimeLeads() {
  const { user, isAdmin, isVendedor } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NewLeadNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    if (!user || (!isAdmin && !isVendedor)) return;

    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          const newLead = payload.new as Lead;
          
          // Para vendedor, só notifica se o lead for atribuído a ele
          if (isVendedor && !isAdmin && newLead.vendedor_id !== user.id) {
            return;
          }

          const notification: NewLeadNotification = {
            id: crypto.randomUUID(),
            lead: newLead,
            timestamp: new Date(),
            read: false,
          };

          setNotifications(prev => [notification, ...prev].slice(0, 50));

          toast({
            title: "🔔 Novo Lead!",
            description: `${newLead.nome_completo} acabou de se cadastrar.`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          const updatedLead = payload.new as Lead;
          const oldLead = payload.old as Lead;

          // Notificar vendedor quando um lead é atribuído a ele
          if (isVendedor && !isAdmin && 
              updatedLead.vendedor_id === user.id && 
              oldLead.vendedor_id !== user.id) {
            toast({
              title: "📋 Lead atribuído a você!",
              description: `${updatedLead.nome_completo} foi atribuído a você.`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, isVendedor, toast]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}
