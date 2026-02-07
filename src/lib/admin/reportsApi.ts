import { supabase } from '../supabase-auth';

export interface Report {
    id: number;
    type: 'song' | 'user' | 'comment';
    title: string;
    reporter?: string; // Nome do reporter (join)
    reporter_id?: number;
    reason: string;
    status: 'open' | 'in_review' | 'resolved' | 'rejected';
    priority: 'low' | 'medium' | 'high';
    date: string; // created_at
    description?: string;
    target_song_id?: number;
    target_user_id?: number;
}

export async function getReports(filters?: { status?: string; type?: string }) {
    let query = supabase
        .from('reports')
        .select(`
      *,
      reporter:usuarios!reporter_id(nome)
    `)
        .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
    }

    if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching reports:', error);
        return [];
    }

    return data.map((r: any) => ({
        ...r,
        date: r.created_at,
        reporter: r.reporter?.nome || 'Anônimo'
    }));
}

export async function updateReportStatus(id: number, status: string) {
    const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', id);

    if (error) throw error;
}

export async function createReport(report: Partial<Report>) {
    const { error } = await supabase
        .from('reports')
        .insert(report);

    if (error) throw error;
}
