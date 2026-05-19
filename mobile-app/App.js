import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getDemoWorkspace } from './lib/demoData';
import { hasSupabaseConfig, supabase } from './lib/supabase';

const colors = {
  ink: '#0F172A',
  text: '#334155',
  muted: '#64748B',
  faint: '#E5E7EB',
  surface: '#F4F7FB',
  surfaceStrong: '#EAF0F7',
  line: '#DDE6F0',
  blue: '#0F5FFF',
  blueDark: '#185FA5',
  blueSoft: '#E0F2FE',
  green: '#10B981',
  greenSoft: '#DCFCE7',
  amber: '#EF9F27',
  amberSoft: '#FEF3C7',
  redSoft: '#FEE2E2',
  red: '#B91C1C',
  navy: '#09111F',
  white: '#FFFFFF',
};

const cardShadow = {
  elevation: 4,
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 16 },
  shadowOpacity: 0.09,
  shadowRadius: 28,
};

const softShadow = {
  elevation: 2,
  shadowColor: '#185FA5',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
};

const tabs = [
  { key: 'home', label: 'Home' },
  { key: 'leads', label: 'Leads' },
  { key: 'approvals', label: 'Approve' },
  { key: 'setup', label: 'Setup' },
  { key: 'support', label: 'Support' },
];

const leadFilters = ['All', 'Needs review', 'Followed up', 'Booked', 'Completed'];

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(hasSupabaseConfig);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return <LoadingScreen label="Opening Cybiture..." />;
  }

  if (hasSupabaseConfig && !session) {
    return <AuthScreen />;
  }

  return <ClientConsole session={session} isDemo={!hasSupabaseConfig} />;
}

function ClientConsole({ session, isDemo }) {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedLead, setSelectedLead] = useState(null);
  const [workspace, setWorkspace] = useState(getDemoWorkspace());
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isDemo || !session) {
      setWorkspace(getDemoWorkspace());
      setLoading(false);
      return;
    }

    loadWorkspace()
      .then((nextWorkspace) => {
        setWorkspace(nextWorkspace);
        setError('');
      })
      .catch((loadError) => {
        setError(loadError.message || 'Could not load client data.');
      })
      .finally(() => setLoading(false));
  }, [isDemo, session]);

  const completedCount = workspace.checklist.filter((item) => item.is_done).length;
  const pendingApprovals = workspace.approvals.filter((approval) => approval.status === 'Needs review').length;

  async function refreshWorkspace() {
    if (isDemo) {
      setWorkspace(getDemoWorkspace());
      return;
    }

    setLoading(true);
    try {
      setWorkspace(await loadWorkspace());
      setError('');
    } catch (refreshError) {
      setError(refreshError.message || 'Could not refresh client data.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleTask(task) {
    const nextDone = !task.is_done;
    setWorkspace((current) => ({
      ...current,
      checklist: current.checklist.map((item) =>
        item.id === task.id ? { ...item, is_done: nextDone } : item
      ),
    }));

    if (!isDemo) {
      const { error: updateError } = await supabase
        .from('setup_tasks')
        .update({ is_done: nextDone, updated_at: new Date().toISOString() })
        .eq('id', task.id);

      if (updateError) {
        Alert.alert('Update failed', updateError.message);
        refreshWorkspace();
      }
    }
  }

  async function markLeadStatus(lead, status) {
    setWorkspace((current) => ({
      ...current,
      leads: current.leads.map((item) => (item.id === lead.id ? { ...item, status } : item)),
    }));
    setSelectedLead(null);

    if (isDemo) {
      Alert.alert('Demo lead updated', `Lead marked as ${status}.`);
      return;
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', lead.id);

    if (updateError) {
      Alert.alert('Update failed', updateError.message);
      refreshWorkspace();
    }
  }

  async function updateApproval(approval, status) {
    setWorkspace((current) => ({
      ...current,
      approvals: current.approvals.map((item) =>
        item.id === approval.id ? { ...item, status } : item
      ),
    }));

    if (isDemo) {
      Alert.alert('Demo approval updated', `${approval.title} marked as ${status}.`);
      return;
    }

    const { error: updateError } = await supabase
      .from('approval_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', approval.id);

    if (updateError) {
      Alert.alert('Approval failed', updateError.message);
      refreshWorkspace();
    }
  }

  async function submitSupportRequest(requestBody) {
    if (!requestBody.trim()) {
      Alert.alert('Add a request', 'Write what the client needs changed first.');
      return;
    }

    if (isDemo) {
      Alert.alert('Demo request saved', 'In production this will be stored in Supabase.');
      return;
    }

    const { error: insertError } = await supabase.from('support_requests').insert({
      client_id: workspace.profile.id,
      request_body: requestBody.trim(),
    });

    if (insertError) {
      Alert.alert('Request failed', insertError.message);
      return;
    }

    Alert.alert('Request sent', 'Cybiture support has the request.');
  }

  const screen = useMemo(() => {
    if (loading) {
      return <InlineLoading />;
    }

    if (activeTab === 'leads') {
      return <LeadsScreen leads={workspace.leads} onLeadPress={setSelectedLead} />;
    }

    if (activeTab === 'approvals') {
      return <ApprovalsScreen approvals={workspace.approvals} onDecision={updateApproval} />;
    }

    if (activeTab === 'setup') {
      return (
        <SetupScreen
          checklist={workspace.checklist}
          completedCount={completedCount}
          onToggle={toggleTask}
        />
      );
    }

    if (activeTab === 'support') {
      return <SupportScreen onSubmit={submitSupportRequest} />;
    }

    return (
      <HomeScreen
        activity={workspace.activity}
        automations={workspace.automations}
        completedCount={completedCount}
        isDemo={isDemo}
        leads={workspace.leads}
        onLeadPress={setSelectedLead}
        onViewApprovals={() => setActiveTab('approvals')}
        onViewLeads={() => setActiveTab('leads')}
        onViewSetup={() => setActiveTab('setup')}
        pendingApprovals={pendingApprovals}
        profile={workspace.profile}
      />
    );
  }, [activeTab, workspace, completedCount, pendingApprovals, loading, isDemo]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.app}>
        <Header
          isDemo={isDemo}
          profile={workspace.profile}
          onSignOut={hasSupabaseConfig ? () => supabase.auth.signOut() : null}
        />
        {error ? <ErrorBanner message={error} onRetry={refreshWorkspace} /> : null}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {screen}
        </ScrollView>
        <TabBar activeTab={activeTab} onChange={setActiveTab} />
      </View>
      <LeadModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onMarkStatus={markLeadStatus}
      />
    </SafeAreaView>
  );
}

async function loadWorkspace() {
  const { data: profile, error: profileError } = await supabase
    .from('client_profiles')
    .select('*')
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    throw new Error('No client profile found for this login yet.');
  }

  const [leadsResult, automationsResult, checklistResult, activityResult, approvalsResult] =
    await Promise.all([
    supabase
      .from('leads')
      .select('*')
      .eq('client_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('automations')
      .select('*')
      .eq('client_id', profile.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('setup_tasks')
      .select('*')
      .eq('client_id', profile.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('activity_events')
      .select('*')
      .eq('client_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('approval_requests')
      .select('*')
      .eq('client_id', profile.id)
      .order('created_at', { ascending: false }),
  ]);

  const firstError =
    leadsResult.error ||
    automationsResult.error ||
    checklistResult.error ||
    activityResult.error ||
    (isMissingTableError(approvalsResult.error) ? null : approvalsResult.error);

  if (firstError) {
    throw firstError;
  }

  return {
    profile,
    leads: leadsResult.data || [],
    automations: automationsResult.data || [],
    checklist: checklistResult.data || [],
    activity: activityResult.data || [],
    approvals: isMissingTableError(approvalsResult.error) ? [] : approvalsResult.data || [],
  };
}

function isMissingTableError(error) {
  return error?.code === 'PGRST205' || error?.code === '42P01';
}

function AuthScreen() {
  const [mode, setMode] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('Missing details', 'Enter an email and password.');
      return;
    }

    setLoading(true);
    const result =
      mode === 'sign-up'
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { business_name: businessName || 'New Cybiture Client' } },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (result.error) {
      Alert.alert('Authentication failed', result.error.message);
      return;
    }

    if (mode === 'sign-up') {
      Alert.alert('Account created', 'Check your email if Supabase asks you to confirm.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.authWrap}>
        <Image source={require('./assets/cybiture-mark.png')} style={styles.authLogo} />
        <Text style={styles.authTitle}>Cybiture Client Console</Text>
        <Text style={styles.authCopy}>
          Sign in to review leads, track automations, approve setup tasks, and contact support.
        </Text>

        <View style={styles.authCard}>
          <View style={styles.authToggle}>
            <Pressable
              style={[styles.authToggleButton, mode === 'sign-in' && styles.authToggleActive]}
              onPress={() => setMode('sign-in')}
            >
              <Text style={[styles.authToggleText, mode === 'sign-in' && styles.authToggleTextActive]}>
                Sign in
              </Text>
            </Pressable>
            <Pressable
              style={[styles.authToggleButton, mode === 'sign-up' && styles.authToggleActive]}
              onPress={() => setMode('sign-up')}
            >
              <Text style={[styles.authToggleText, mode === 'sign-up' && styles.authToggleTextActive]}>
                Create
              </Text>
            </Pressable>
          </View>

          {mode === 'sign-up' ? (
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Business name"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          ) : null}
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <TextInput
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <Pressable style={styles.primaryButtonWide} onPress={handleAuth} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === 'sign-up' ? 'Create client account' : 'Sign in'}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ isDemo, profile, onSignOut }) {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <Image source={require('./assets/cybiture-mark.png')} style={styles.logo} />
        <View>
          <Text style={styles.brandName}>Cybiture</Text>
          <Text style={styles.brandSub}>{profile?.business_name || 'Client Console'}</Text>
        </View>
      </View>
      {onSignOut ? (
        <Pressable style={styles.signOutButton} onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      ) : (
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{isDemo ? 'Demo' : 'Live'}</Text>
        </View>
      )}
    </View>
  );
}

function HomeScreen({
  activity,
  automations,
  completedCount,
  isDemo,
  leads,
  onViewApprovals,
  onLeadPress,
  onViewLeads,
  onViewSetup,
  pendingApprovals,
  profile,
}) {
  const newestLead = leads[0];
  const reviews = activity.filter((event) => event.title.toLowerCase().includes('review')).length;
  const protectedCount = leads.filter((lead) => lead.status !== 'Completed').length;

  return (
    <View>
      {isDemo ? <DemoNotice /> : null}
      <DashboardHeader
        businessName={profile?.business_name || 'Client Console'}
        planName={profile?.plan_name || 'Growth'}
      />
      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <View style={styles.heroTop}>
          <Text style={styles.kicker}>Automation health</Text>
          <Text style={styles.heroStatus}>Live system</Text>
        </View>
        <View style={styles.healthRow}>
          <View style={styles.healthRing}>
            <Text style={styles.healthValue}>98</Text>
            <Text style={styles.healthUnit}>%</Text>
          </View>
          <View style={styles.healthCopy}>
            <Text style={styles.heroTitle}>Follow-up is covered.</Text>
            <Text style={styles.heroCopy}>
              Missed calls, forms, chats, and reviews are being watched in the background.
            </Text>
          </View>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroSignalRow}>
          <HeroSignal label="Response" value="3m" />
          <HeroSignal label="Protected" value={`${protectedCount} leads`} />
          <HeroSignal label="Review" value={`${pendingApprovals} open`} />
        </View>
        <View style={styles.heroActions}>
          <Pressable style={styles.primaryButton} onPress={onViewLeads}>
            <Text style={styles.primaryButtonText}>Review leads</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onViewApprovals}>
            <Text style={styles.secondaryButtonText}>Approvals</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.quickGrid}>
        <QuickTile
          label="Approvals"
          value={String(pendingApprovals)}
          helper="ready for review"
          tone="amber"
          onPress={onViewApprovals}
        />
        <QuickTile
          label="Lead inbox"
          value={String(leads.length)}
          helper="latest opportunities"
          tone="blue"
          onPress={onViewLeads}
        />
        <QuickTile
          label="Setup"
          value={`${completedCount}/5`}
          helper="launch checklist"
          tone="green"
          onPress={onViewSetup}
        />
      </View>

      <View style={styles.statGrid}>
        <StatCard label="New leads" value={String(leads.length)} helper="latest pipeline" />
        <StatCard label="Avg reply" value="3m" helper="vs hours" />
        <StatCard label="Approvals" value={String(pendingApprovals)} helper="need review" />
        <StatCard label="Setup" value={`${completedCount}/5`} helper="tasks done" />
      </View>

      <SectionHeader title="Needs attention" action="View all" onPress={onViewLeads} />
      {newestLead ? (
        <LeadCard lead={newestLead} onPress={() => onLeadPress(newestLead)} featured />
      ) : (
        <EmptyCard title="No leads yet" copy="New leads will appear here once sources are connected." />
      )}

      <SectionHeader title="Review required" action="Open" onPress={onViewApprovals} />
      {pendingApprovals ? (
        <View style={styles.approvalCallout}>
          <Text style={styles.cardTitle}>{pendingApprovals} item needs approval</Text>
          <Text style={styles.emptyText}>
            Approve client-facing messages and workflow changes before they go live.
          </Text>
        </View>
      ) : (
        <EmptyCard title="Nothing waiting" copy="All client-facing automation changes are approved." />
      )}

      <SectionHeader title="Automation activity" />
      <View style={styles.timeline}>
        {activity.length ? (
          activity.map((event) => (
            <TimelineItem
              key={event.id}
              title={event.title}
              detail={event.detail}
              time={formatTime(event.created_at)}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No activity yet.</Text>
        )}
      </View>
    </View>
  );
}

function DashboardHeader({ businessName, planName }) {
  return (
    <View style={styles.dashboardHeader}>
      <View style={styles.dashboardCopy}>
        <Text style={styles.screenLabel}>Today</Text>
        <Text style={styles.dashboardTitle}>{businessName}</Text>
        <Text style={styles.dashboardSubtitle}>{planName} client portal</Text>
      </View>
      <View style={styles.profileBadge}>
        <Text style={styles.profileBadgeText}>CY</Text>
      </View>
    </View>
  );
}

function ScreenHeader({ label, title, metric, copy }) {
  return (
    <View style={styles.screenHeaderCard}>
      <View style={styles.screenHeaderTop}>
        <Text style={styles.screenLabel}>{label}</Text>
        <View style={styles.metricPill}>
          <Text style={styles.metricPillText}>{metric}</Text>
        </View>
      </View>
      <Text style={styles.screenTitle}>{title}</Text>
      <Text style={styles.screenCopy}>{copy}</Text>
    </View>
  );
}

function MiniMetric({ label, value, tone }) {
  return (
    <View style={styles.miniMetric}>
      <View style={[styles.miniDot, styles[`quickAccent${capitalize(tone)}`]]} />
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function SupportOption({ title, copy }) {
  return (
    <View style={styles.supportOption}>
      <View style={styles.supportOptionIcon}>
        <Text style={styles.supportOptionIconText}>+</Text>
      </View>
      <View style={styles.supportOptionCopy}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardMeta}>{copy}</Text>
      </View>
    </View>
  );
}

function HeroSignal({ label, value }) {
  return (
    <View style={styles.heroSignal}>
      <Text style={styles.heroSignalValue}>{value}</Text>
      <Text style={styles.heroSignalLabel}>{label}</Text>
    </View>
  );
}

function QuickTile({ label, value, helper, tone, onPress }) {
  return (
    <Pressable style={styles.quickTile} onPress={onPress}>
      <View style={[styles.quickAccent, styles[`quickAccent${capitalize(tone)}`]]} />
      <Text style={styles.quickValue}>{value}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickHelper}>{helper}</Text>
    </Pressable>
  );
}

function LeadsScreen({ leads, onLeadPress }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const filtered = leads.filter((lead) =>
    `${lead.contact_name} ${lead.business_name} ${lead.source}`.toLowerCase().includes(query.toLowerCase()) &&
    (filter === 'All' || lead.status === filter)
  );
  const reviewCount = leads.filter((lead) => lead.status === 'Needs review').length;

  return (
    <View>
      <ScreenHeader
        label="Leads"
        title="Lead inbox"
        metric={`${filtered.length}/${leads.length}`}
        copy="Review new opportunities, see what Cybiture already sent, and decide what needs a human touch."
      />
      <View style={styles.inboxSummary}>
        <MiniMetric label="Needs review" value={String(reviewCount)} tone="amber" />
        <MiniMetric label="Booked" value={String(leads.filter((lead) => lead.status === 'Booked').length)} tone="green" />
        <MiniMetric label="Avg reply" value="3m" tone="blue" />
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search leads, company, or source"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        {leadFilters.map((item) => (
          <Pressable
            key={item}
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.list}>
        {filtered.length ? (
          filtered.map((lead) => <LeadCard key={lead.id} lead={lead} onPress={() => onLeadPress(lead)} />)
        ) : (
          <EmptyCard title="No matching leads" copy="Try searching by contact, company, or source." />
        )}
      </View>
    </View>
  );
}

function ApprovalsScreen({ approvals, onDecision }) {
  const pending = approvals.filter((approval) => approval.status === 'Needs review');
  const resolved = approvals.filter((approval) => approval.status !== 'Needs review');

  return (
    <View>
      <ScreenHeader
        label="Human loop"
        title="Approvals"
        metric={String(pending.length)}
        copy="Review messages, timing changes, and workflows before Cybiture turns them live."
      />
      <View style={styles.list}>
        {[...pending, ...resolved].length ? (
          [...pending, ...resolved].map((approval) => (
            <ApprovalCard key={approval.id} approval={approval} onDecision={onDecision} />
          ))
        ) : (
          <EmptyCard title="No approvals yet" copy="Message and workflow approvals will appear here." />
        )}
      </View>
    </View>
  );
}

function ApprovalCard({ approval, onDecision }) {
  const needsReview = approval.status === 'Needs review';

  return (
    <View style={[styles.approvalCard, needsReview && styles.approvalCardActive]}>
      <View style={[styles.approvalRail, needsReview ? styles.approvalRailActive : styles.approvalRailDone]} />
      <View style={styles.approvalTop}>
        <View style={styles.leadTitleWrap}>
          <Text style={styles.cardTitle}>{approval.title}</Text>
          <Text style={styles.cardMeta}>{approval.category} · {formatTime(approval.created_at)}</Text>
        </View>
        <StatusPill label={approval.status} tone={needsReview ? 'amber' : 'green'} />
      </View>
      <Text style={styles.approvalBody}>{approval.body}</Text>
      {needsReview ? (
        <View style={styles.actionRow}>
          <Pressable style={styles.approveButton} onPress={() => onDecision(approval, 'Approved')}>
            <Text style={styles.approveButtonText}>Approve</Text>
          </Pressable>
          <Pressable style={styles.requestButton} onPress={() => onDecision(approval, 'Changes requested')}>
            <Text style={styles.requestButtonText}>Request edits</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function AutomationsScreen({ automations }) {
  return (
    <View>
      <Text style={styles.screenTitle}>Automations</Text>
      <Text style={styles.screenCopy}>
        Each workflow shows whether it is live, scheduled, or waiting for approval.
      </Text>
      <View style={styles.list}>
        {automations.length ? (
          automations.map((automation) => (
            <View key={automation.id} style={styles.automationCard}>
              <View style={styles.automationTop}>
                <View>
                  <Text style={styles.cardTitle}>{automation.name}</Text>
                  <Text style={styles.cardMeta}>{automation.runs_this_week} runs this week</Text>
                </View>
                <StatusPill label={automation.status} tone={automation.tone} />
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min((automation.runs_this_week || 0) * 5, 92)}%` },
                  ]}
                />
              </View>
            </View>
          ))
        ) : (
          <EmptyCard title="No automations yet" copy="Live client workflows will appear here." />
        )}
      </View>
    </View>
  );
}

function SetupScreen({ checklist, completedCount, onToggle }) {
  const total = Math.max(checklist.length, 1);
  const progressWidth = `${Math.round((completedCount / total) * 100)}%`;

  return (
    <View>
      <ScreenHeader
        label="Onboarding"
        title="Client setup"
        metric={`${completedCount}/${total}`}
        copy="Use this checklist during onboarding so the client knows exactly what is ready and what needs approval."
      />
      <View style={styles.setupSummary}>
        <Text style={styles.setupNumber}>{completedCount}/{total}</Text>
        <View style={styles.setupTextWrap}>
          <Text style={styles.cardTitleDark}>Launch readiness</Text>
          <Text style={styles.cardMetaDark}>Finish the remaining tasks before going live.</Text>
          <View style={styles.setupProgressTrack}>
            <View style={[styles.setupProgressFill, { width: progressWidth }]} />
          </View>
        </View>
      </View>
      <View style={styles.list}>
        {checklist.map((item) => (
          <Pressable key={item.id} style={styles.checkRow} onPress={() => onToggle(item)}>
            <View style={[styles.checkCircle, item.is_done && styles.checkCircleDone]}>
              <Text style={[styles.checkMark, item.is_done && styles.checkMarkDone]}>
                {item.is_done ? '✓' : ''}
              </Text>
            </View>
            <Text style={[styles.checkLabel, item.is_done && styles.checkLabelDone]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function SupportScreen({ onSubmit }) {
  const [requestBody, setRequestBody] = useState('');

  return (
    <View>
      <ScreenHeader
        label="Help desk"
        title="Support"
        metric="24h"
        copy="A simple place for clients to contact Cybiture, request changes, or schedule an optimization call."
      />
      <View style={styles.supportOptions}>
        <SupportOption title="Request change" copy="Update message timing, routing, or review links." />
        <SupportOption title="Book review" copy="Schedule an optimization call with Cybiture." />
      </View>
      <View style={styles.supportCard}>
        <Text style={styles.supportTitle}>Need a workflow change?</Text>
        <Text style={styles.supportCopy}>
          Send the request here and Cybiture can update messages, follow-up timing, review links, or lead routing.
        </Text>
        <TextInput
          multiline
          value={requestBody}
          onChangeText={setRequestBody}
          placeholder="Example: change missed-call text to mention weekend appointments."
          placeholderTextColor={colors.muted}
          style={styles.supportInput}
        />
        <Pressable
          style={styles.primaryButtonWide}
          onPress={() => {
            onSubmit(requestBody);
            setRequestBody('');
          }}
        >
          <Text style={styles.primaryButtonText}>Send request</Text>
        </Pressable>
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.cardTitle}>Cybiture support</Text>
        <Text style={styles.cardMeta}>getsupport@cybiture.com</Text>
        <Text style={styles.cardMeta}>cal.com/cybiture</Text>
      </View>
    </View>
  );
}

function LoadingScreen({ label }) {
  return (
    <SafeAreaView style={styles.centerScreen}>
      <ActivityIndicator color={colors.blue} size="large" />
      <Text style={styles.loadingText}>{label}</Text>
    </SafeAreaView>
  );
}

function InlineLoading() {
  return (
    <View style={styles.inlineLoading}>
      <ActivityIndicator color={colors.blue} />
      <Text style={styles.loadingText}>Loading client data...</Text>
    </View>
  );
}

function DemoNotice() {
  return (
    <View style={styles.demoNotice}>
      <Text style={styles.demoTitle}>Demo mode</Text>
      <Text style={styles.demoCopy}>
        Add Supabase keys in `.env` to switch this app to real client login and live data.
      </Text>
    </View>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{message}</Text>
      <Pressable onPress={onRetry}>
        <Text style={styles.errorAction}>Retry</Text>
      </Pressable>
    </View>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statHelper}>{helper}</Text>
    </View>
  );
}

function SectionHeader({ title, action, onPress }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onPress}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function LeadCard({ lead, onPress, featured = false }) {
  return (
    <Pressable style={[styles.leadCard, featured && styles.leadCardFeatured]} onPress={onPress}>
      <View style={styles.leadAccent} />
      <View style={styles.leadTop}>
        <View style={styles.leadTitleWrap}>
          <Text style={styles.cardTitle}>{lead.contact_name}</Text>
          <Text style={styles.cardMeta}>{lead.business_name || 'New lead'}</Text>
        </View>
        <StatusPill label={lead.status} tone={lead.status === 'Needs review' ? 'amber' : 'green'} />
      </View>
      <Text style={styles.leadMessage}>{lead.message || 'No message yet.'}</Text>
      <View style={styles.leadFooter}>
        <Text style={styles.sourcePill}>{lead.source}</Text>
        <Text style={styles.cardMeta}>{formatTime(lead.created_at)}</Text>
        <Text style={styles.leadValue}>{formatMoney(lead.value_cents)}</Text>
      </View>
    </Pressable>
  );
}

function TimelineItem({ title, detail, time }) {
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineDot} />
      <View style={styles.timelineContent}>
        <View style={styles.timelineTop}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardMeta}>{time}</Text>
        </View>
        <Text style={styles.timelineDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function EmptyCard({ title, copy }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.emptyText}>{copy}</Text>
    </View>
  );
}

function StatusPill({ label, tone }) {
  const active = tone === 'green';
  return (
    <View style={[styles.statusPill, active ? styles.statusGreen : styles.statusAmber]}>
      <Text style={[styles.statusText, active ? styles.statusTextGreen : styles.statusTextAmber]}>
        {label}
      </Text>
    </View>
  );
}

function TabBar({ activeTab, onChange }) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tabButton, active && styles.tabButtonActive]}
            onPress={() => onChange(tab.key)}
          >
            <View style={[styles.tabDot, active && styles.tabDotActive]} />
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function LeadModal({ lead, onClose, onMarkStatus }) {
  if (!lead) {
    return null;
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <View style={styles.leadTop}>
            <View style={styles.leadTitleWrap}>
              <Text style={styles.modalTitle}>{lead.contact_name}</Text>
              <Text style={styles.cardMeta}>{lead.business_name || 'New lead'}</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <ModalRow label="Phone" value={lead.phone || 'Not provided'} />
          <ModalRow label="Source" value={lead.source} />
          <ModalRow label="Status" value={lead.status} />
          <View style={styles.noteBox}>
            <Text style={styles.modalLabel}>Automation note</Text>
            <Text style={styles.noteText}>{lead.message || 'No automation note yet.'}</Text>
          </View>
          <View style={styles.noteBox}>
            <Text style={styles.modalLabel}>Next step</Text>
            <Text style={styles.noteText}>{lead.next_step || 'Review when ready.'}</Text>
          </View>
          <View style={styles.modalActions}>
            <Pressable
              style={styles.primaryButtonWide}
              onPress={() => onMarkStatus(lead, 'Followed up')}
            >
              <Text style={styles.primaryButtonText}>Mark reviewed</Text>
            </Pressable>
            <Pressable
              style={styles.bookedButton}
              onPress={() => onMarkStatus(lead, 'Booked')}
            >
              <Text style={styles.bookedButtonText}>Mark booked</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ModalRow({ label, value }) {
  return (
    <View style={styles.modalRow}>
      <Text style={styles.modalLabel}>{label}</Text>
      <Text style={styles.modalValue}>{value}</Text>
    </View>
  );
}

function formatMoney(valueCents = 0) {
  if (!valueCents) {
    return '$0';
  }

  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(valueCents / 100);
}

function formatTime(timestamp) {
  if (!timestamp) {
    return 'Just now';
  }

  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr`;
  }

  return `${Math.round(diffHours / 24)} day`;
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  app: { flex: 1, backgroundColor: colors.surface },
  centerScreen: {
    alignItems: 'center',
    backgroundColor: colors.white,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 12,
  },
  inlineLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 420,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  brand: { alignItems: 'center', flexDirection: 'row', gap: 10, flex: 1 },
  logo: {
    backgroundColor: colors.white,
    borderRadius: 14,
    height: 38,
    resizeMode: 'contain',
    width: 46,
  },
  brandName: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandSub: { color: colors.muted, fontSize: 12, marginTop: 1 },
  livePill: {
    alignItems: 'center',
    backgroundColor: colors.greenSoft,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  liveDot: { backgroundColor: colors.green, borderRadius: 99, height: 8, width: 8 },
  liveText: { color: '#047857', fontSize: 12, fontWeight: '800' },
  signOutButton: {
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signOutText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { padding: 18, paddingBottom: 114 },
  dashboardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 2,
  },
  dashboardCopy: {
    flex: 1,
    paddingRight: 12,
  },
  screenLabel: {
    color: colors.blueDark,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dashboardTitle: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.9,
    lineHeight: 34,
  },
  dashboardSubtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 5,
  },
  screenHeaderCard: {
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 26,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
    ...softShadow,
  },
  screenHeaderTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  profileBadge: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderColor: 'rgba(15, 95, 255, 0.12)',
    borderRadius: 22,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    width: 50,
    ...cardShadow,
  },
  profileBadgeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  authWrap: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22,
  },
  authLogo: {
    alignSelf: 'center',
    height: 58,
    resizeMode: 'contain',
    width: 86,
  },
  authTitle: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 39,
    marginTop: 20,
    textAlign: 'center',
  },
  authCopy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
    textAlign: 'center',
  },
  authCard: {
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 26,
    padding: 18,
    ...cardShadow,
  },
  authToggle: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
    padding: 5,
  },
  authToggleButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 11,
  },
  authToggleActive: { backgroundColor: colors.white },
  authToggleText: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  authToggleTextActive: { color: colors.ink },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  filterBar: {
    gap: 8,
    paddingBottom: 14,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: colors.blueSoft,
    borderColor: '#BFDBFE',
  },
  filterText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  filterTextActive: {
    color: colors.blueDark,
  },
  metricPill: {
    backgroundColor: colors.blueSoft,
    borderColor: '#BFDBFE',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  metricPillText: {
    color: colors.blueDark,
    fontSize: 12,
    fontWeight: '800',
  },
  inboxSummary: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  miniMetric: {
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    padding: 12,
    ...softShadow,
  },
  miniDot: {
    borderRadius: 999,
    height: 5,
    marginBottom: 9,
    width: 24,
  },
  miniValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  miniLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  demoNotice: {
    backgroundColor: colors.blueSoft,
    borderColor: '#BFDBFE',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  demoTitle: { color: colors.blueDark, fontSize: 13, fontWeight: '800' },
  demoCopy: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: 4 },
  errorBanner: {
    alignItems: 'center',
    backgroundColor: colors.redSoft,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  errorText: { color: colors.red, flex: 1, fontSize: 13, fontWeight: '700' },
  errorAction: { color: colors.red, fontSize: 13, fontWeight: '800' },
  heroCard: {
    backgroundColor: colors.navy,
    borderRadius: 30,
    overflow: 'hidden',
    padding: 24,
    ...cardShadow,
  },
  heroGlow: {
    backgroundColor: '#0F5FFF',
    borderRadius: 999,
    height: 160,
    opacity: 0.18,
    position: 'absolute',
    right: -48,
    top: -58,
    width: 160,
  },
  healthRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  healthRing: {
    alignItems: 'center',
    backgroundColor: 'rgba(224, 242, 254, 0.1)',
    borderColor: '#35D29A',
    borderRadius: 999,
    borderWidth: 8,
    height: 104,
    justifyContent: 'center',
    width: 104,
  },
  healthValue: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
    lineHeight: 32,
  },
  healthUnit: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '800',
  },
  healthCopy: {
    flex: 1,
  },
  heroDivider: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    height: 1,
    marginTop: 20,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  kicker: { color: '#A7F3D0', fontSize: 13, fontWeight: '800' },
  heroStatus: { color: '#BFD7FF', fontSize: 13, fontWeight: '700' },
  heroTitle: {
    color: colors.white,
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  heroCopy: { color: '#CBD5E1', fontSize: 15, lineHeight: 23, marginTop: 12 },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  heroSignalRow: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    padding: 10,
  },
  heroSignal: {
    flex: 1,
  },
  heroSignalValue: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  heroSignalLabel: {
    color: '#93A4BC',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  primaryButtonWide: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  primaryButtonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#172033',
    borderColor: '#263244',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  secondaryButtonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  quickTile: {
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
    padding: 14,
    ...softShadow,
  },
  quickAccent: {
    borderRadius: 99,
    height: 5,
    marginBottom: 12,
    width: 34,
  },
  quickAccentBlue: { backgroundColor: colors.blue },
  quickAccentAmber: { backgroundColor: colors.amber },
  quickAccentGreen: { backgroundColor: colors.green },
  quickValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  quickLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  quickHelper: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  statCard: {
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 20,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    padding: 16,
    ...softShadow,
  },
  statValue: { color: colors.ink, fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  statLabel: { color: colors.text, fontSize: 13, fontWeight: '800', marginTop: 3 },
  statHelper: { color: colors.muted, fontSize: 12, marginTop: 5 },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 28,
  },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  sectionAction: { color: colors.blue, fontSize: 13, fontWeight: '800' },
  list: { gap: 12 },
  leadCard: {
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 18,
    ...softShadow,
  },
  leadCardFeatured: { backgroundColor: '#F8FBFF', borderColor: '#BFDBFE' },
  leadAccent: {
    backgroundColor: colors.blue,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },
  leadTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  leadTitleWrap: { flex: 1 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  cardTitleDark: { color: colors.white, fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  cardMeta: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  cardMetaDark: { color: '#CBD5E1', fontSize: 13, lineHeight: 19, marginTop: 3 },
  leadMessage: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: 12 },
  leadFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  sourcePill: {
    backgroundColor: colors.blueSoft,
    borderRadius: 999,
    color: colors.blueDark,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  leadValue: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  statusGreen: { backgroundColor: colors.greenSoft },
  statusAmber: { backgroundColor: colors.amberSoft },
  statusText: { fontSize: 11, fontWeight: '800' },
  statusTextGreen: { color: '#047857' },
  statusTextAmber: { color: '#92400E' },
  timeline: {
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    ...softShadow,
  },
  approvalCallout: {
    backgroundColor: colors.amberSoft,
    borderColor: '#FCD34D',
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  timelineItem: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  timelineDot: { backgroundColor: colors.green, borderRadius: 99, height: 10, marginTop: 5, width: 10 },
  timelineContent: { flex: 1 },
  timelineTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  timelineDetail: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  screenTitle: { color: colors.ink, fontSize: 31, fontWeight: '800', letterSpacing: -0.7 },
  screenCopy: { color: colors.muted, fontSize: 15, lineHeight: 23, marginBottom: 18, marginTop: 8 },
  automationCard: {
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    ...softShadow,
  },
  approvalCard: {
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 18,
    ...softShadow,
  },
  approvalCardActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  approvalTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  approvalRail: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },
  approvalRailActive: {
    backgroundColor: colors.amber,
  },
  approvalRailDone: {
    backgroundColor: colors.green,
  },
  approvalBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  approveButton: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderRadius: 14,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  approveButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  requestButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#FCD34D',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  requestButtonText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '800',
  },
  automationTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  progressTrack: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    height: 9,
    marginTop: 18,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: colors.blue, borderRadius: 999, height: 9 },
  setupSummary: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 24,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
    padding: 20,
    ...cardShadow,
  },
  setupNumber: { color: colors.white, fontSize: 34, fontWeight: '800', letterSpacing: -0.4 },
  setupTextWrap: { flex: 1 },
  setupProgressTrack: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    height: 8,
    marginTop: 12,
    overflow: 'hidden',
  },
  setupProgressFill: {
    backgroundColor: '#35D29A',
    borderRadius: 999,
    height: 8,
  },
  checkRow: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    ...softShadow,
  },
  checkCircle: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: 99,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  checkCircleDone: { backgroundColor: colors.greenSoft, borderColor: '#A7F3D0' },
  checkMark: { color: colors.muted, fontSize: 15, fontWeight: '800' },
  checkMarkDone: { color: '#047857' },
  checkLabel: { color: colors.ink, flex: 1, fontSize: 15, fontWeight: '700' },
  checkLabelDone: { color: colors.text },
  supportCard: {
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    ...softShadow,
  },
  supportOptions: {
    gap: 10,
    marginBottom: 14,
  },
  supportOption: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    ...softShadow,
  },
  supportOptionIcon: {
    alignItems: 'center',
    backgroundColor: colors.blueSoft,
    borderRadius: 16,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  supportOptionIconText: {
    color: colors.blueDark,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 24,
  },
  supportOptionCopy: {
    flex: 1,
  },
  supportTitle: { color: colors.ink, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  supportCopy: { color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 8 },
  supportInput: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
    marginTop: 16,
    minHeight: 112,
    padding: 14,
    textAlignVertical: 'top',
  },
  contactCard: {
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 14,
    padding: 18,
    ...softShadow,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    ...softShadow,
  },
  emptyText: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 6 },
  tabBar: {
    backgroundColor: colors.white,
    bottom: 0,
    flexDirection: 'row',
    gap: 6,
    left: 12,
    paddingBottom: 12,
    paddingHorizontal: 8,
    paddingTop: 10,
    position: 'absolute',
    right: 12,
    borderColor: colors.faint,
    borderRadius: 24,
    borderWidth: 1,
    ...cardShadow,
  },
  tabButton: { alignItems: 'center', borderRadius: 14, flex: 1, paddingHorizontal: 5, paddingVertical: 11 },
  tabButtonActive: { backgroundColor: colors.blueSoft },
  tabDot: {
    backgroundColor: 'transparent',
    borderRadius: 99,
    height: 4,
    marginBottom: 5,
    width: 18,
  },
  tabDotActive: {
    backgroundColor: colors.blue,
  },
  tabText: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  tabTextActive: { color: colors.blueDark },
  modalBackdrop: { backgroundColor: 'rgba(15, 23, 42, 0.35)', flex: 1, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 22,
    paddingBottom: 34,
  },
  modalHandle: {
    alignSelf: 'center',
    backgroundColor: colors.faint,
    borderRadius: 99,
    height: 5,
    marginBottom: 18,
    width: 46,
  },
  modalTitle: { color: colors.ink, fontSize: 25, fontWeight: '800', letterSpacing: -0.4 },
  closeButton: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  closeText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  modalRow: {
    borderBottomColor: colors.faint,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  modalLabel: { color: colors.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  modalValue: { color: colors.ink, flexShrink: 1, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  noteBox: { backgroundColor: colors.surface, borderRadius: 18, marginTop: 14, padding: 16 },
  noteText: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: 8 },
  modalActions: {
    gap: 10,
    marginTop: 16,
  },
  bookedButton: {
    alignItems: 'center',
    backgroundColor: colors.greenSoft,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  bookedButtonText: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '800',
  },
});
