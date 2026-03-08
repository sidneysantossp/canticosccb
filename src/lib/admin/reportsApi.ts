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

const normalizeReportType = (type?: string): Report['type'] => {
    switch (type) {
        case 'song':
            return 'song';
        case 'comment':
            return 'comment';
        case 'user':
        case 'composer':
            return 'user';
        default:
            return 'song';
    }
};

const normalizeReportStatus = (status?: string): Report['status'] => {
    switch (status) {
        case 'open':
        case 'pending':
            return 'open';
        case 'in_review':
        case 'reviewed':
            return 'in_review';
        case 'resolved':
            return 'resolved';
        case 'rejected':
        case 'dismissed':
            return 'rejected';
        default:
            return 'open';
    }
};

const normalizeReportPriority = (priority?: string): Report['priority'] => {
    switch (priority) {
        case 'low':
        case 'medium':
        case 'high':
            return priority;
        default:
            return 'medium';
    }
};

const mapReportRow = (row: any): Report => ({
    id: Number(row.id),
    type: normalizeReportType(row.type || row.tipo),
    title: row.title || row.titulo || row.target_title || `Denúncia #${row.id}`,
    reporter: row.reporter?.nome || row.reporter_name || row.reporter || row.denunciante || 'Anônimo',
    reporter_id: row.reporter_id || row.denunciante_id,
    reason: row.reason || row.motivo || '',
    status: normalizeReportStatus(row.status),
    priority: normalizeReportPriority(row.priority || row.prioridade),
    date: row.created_at || row.data || new Date().toISOString(),
    description: row.description || row.descricao,
    target_song_id: row.target_song_id || row.alvo_id,
    target_user_id: row.target_user_id,
});

export async function getReports(filters?: { status?: string; type?: string }) {
    let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
        const statuses =
            filters.status === 'open'
                ? ['open', 'pending']
                : filters.status === 'in_review'
                    ? ['in_review', 'reviewed']
                    : filters.status === 'rejected'
                        ? ['rejected', 'dismissed']
                        : [filters.status];
        query = query.in('status', statuses);
    }

    if (filters?.type && filters.type !== 'all') {
        const types = filters.type === 'user' ? ['user', 'composer'] : [filters.type];
        query = query.in('type', types);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching reports:', error);
        return [];
    }

    return (data || []).map(mapReportRow);
}

export async function getReportById(id: string | number) {
    const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .limit(1)
        .maybeSingle();

    if (error && error.code !== 'PGRST116') {
        throw error;
    }

    return data ? mapReportRow(data) : null;
}

export async function getOpenReportsCount() {
    const { count, error } = await supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .in('status', ['open', 'pending']);

    if (error) {
        console.error('Error fetching open reports count:', error);
        return 0;
    }

    return count || 0;
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
