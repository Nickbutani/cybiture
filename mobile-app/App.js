import React, { useMemo, useState } from 'react';
import {
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

const colors = {
  ink: '#0F172A',
  text: '#334155',
  muted: '#64748B',
  faint: '#E5E7EB',
  surface: '#F8FAFC',
  blue: '#0F5FFF',
  blueDark: '#185FA5',
  blueSoft: '#E0F2FE',
  green: '#10B981',
  greenSoft: '#DCFCE7',
  amber: '#EF9F27',
  amberSoft: '#FEF3C7',
  navy: '#09111F',
  white: '#FFFFFF',
};

const leads = [
  {
    id: 'L-1042',
    name: 'Marcus Johnson',
    company: 'Johnson HVAC',
    source: 'Missed call',
    status: 'Needs review',
    value: '$1,850',
    time: '8 min ago',
    phone: '(555) 012-4421',
    message: 'No answer after 6 PM. Auto text sent and customer replied with job details.',
    nextStep: 'Confirm appointment window',
  },
  {
    id: 'L-1041',
    name: 'Sarah Patel',
    company: 'Bright Dental',
    source: 'Website form',
    status: 'Followed up',
    value: '$420',
    time: '21 min ago',
    phone: '(555) 019-3388',
    message: 'Form came in from pricing page. Qualification email and SMS sequence started.',
    nextStep: 'Wait for reply',
  },
  {
    id: 'L-1040',
    name: 'Jamie Lee',
    company: 'Lee Realty',
    source: 'AI chat',
    status: 'Booked',
    value: '$3,200',
    time: '42 min ago',
    phone: '(555) 018-9021',
    message: 'Chat answered pricing questions and booked a consultation for tomorrow.',
    nextStep: 'Prepare consult notes',
  },
  {
    id: 'L-1039',
    name: 'Ana Ruiz',
    company: 'Ruiz Roofing',
    source: 'Review request',
    status: 'Completed',
    value: '$0',
    time: '1 hr ago',
    phone: '(555) 013-7719',
    message: 'Review request sent after completed job. Customer clicked Google review link.',
    nextStep: 'Monitor review',
  },
];

const automations = [
  { name: 'Missed-call text-back', status: 'Live', runs: 18, tone: 'green' },
  { name: 'Website form follow-up', status: 'Live', runs: 11, tone: 'green' },
  { name: 'Review request sequence', status: 'Live', runs: 9, tone: 'green' },
  { name: 'Monthly lead report', status: 'Scheduled', runs: 1, tone: 'amber' },
];

const checklistSeed = [
  { label: 'Business profile reviewed', done: true },
  { label: 'Lead sources connected', done: true },
  { label: 'Missed-call message approved', done: true },
  { label: 'Review request template approved', done: false },
  { label: 'Launch test completed', done: false },
];

const tabs = [
  { key: 'home', label: 'Home' },
  { key: 'leads', label: 'Leads' },
  { key: 'automations', label: 'Automations' },
  { key: 'setup', label: 'Setup' },
  { key: 'support', label: 'Support' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedLead, setSelectedLead] = useState(null);
  const [checklist, setChecklist] = useState(checklistSeed);

  const completedCount = checklist.filter((item) => item.done).length;
  const screen = useMemo(() => {
    if (activeTab === 'leads') {
      return <LeadsScreen onLeadPress={setSelectedLead} />;
    }

    if (activeTab === 'automations') {
      return <AutomationsScreen />;
    }

    if (activeTab === 'setup') {
      return (
        <SetupScreen
          checklist={checklist}
          completedCount={completedCount}
          onToggle={(index) => {
            setChecklist((items) =>
              items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, done: !item.done } : item
              )
            );
          }}
        />
      );
    }

    if (activeTab === 'support') {
      return <SupportScreen />;
    }

    return (
      <HomeScreen
        completedCount={completedCount}
        onLeadPress={setSelectedLead}
        onViewLeads={() => setActiveTab('leads')}
        onViewSetup={() => setActiveTab('setup')}
      />
    );
  }, [activeTab, checklist, completedCount]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.app}>
        <Header />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {screen}
        </ScrollView>
        <TabBar activeTab={activeTab} onChange={setActiveTab} />
      </View>
      <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <Image source={require('./assets/cybiture-mark.png')} style={styles.logo} />
        <View>
          <Text style={styles.brandName}>Cybiture</Text>
          <Text style={styles.brandSub}>Client Console</Text>
        </View>
      </View>
      <View style={styles.livePill}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>Live</Text>
      </View>
    </View>
  );
}

function HomeScreen({ completedCount, onLeadPress, onViewLeads, onViewSetup }) {
  return (
    <View>
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <Text style={styles.kicker}>Today</Text>
          <Text style={styles.heroStatus}>4 automations active</Text>
        </View>
        <Text style={styles.heroTitle}>Lead follow-up is running.</Text>
        <Text style={styles.heroCopy}>
          Cybiture is replying to missed calls, website forms, chats, and review
          requests in the background.
        </Text>
        <View style={styles.heroActions}>
          <Pressable style={styles.primaryButton} onPress={onViewLeads}>
            <Text style={styles.primaryButtonText}>Review leads</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onViewSetup}>
            <Text style={styles.secondaryButtonText}>Setup status</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statGrid}>
        <StatCard label="New leads" value="12" helper="+4 today" />
        <StatCard label="Avg reply" value="3m" helper="vs hours" />
        <StatCard label="Reviews" value="47" helper="+8 this month" />
        <StatCard label="Setup" value={`${completedCount}/5`} helper="tasks done" />
      </View>

      <SectionHeader title="Needs attention" action="View all" onPress={onViewLeads} />
      <LeadCard lead={leads[0]} onPress={() => onLeadPress(leads[0])} featured />

      <SectionHeader title="Automation activity" />
      <View style={styles.timeline}>
        <TimelineItem title="Text-back sent" detail="Marcus Johnson replied with job details." time="8 min" />
        <TimelineItem title="Review request delivered" detail="Ana Ruiz clicked the Google review link." time="1 hr" />
        <TimelineItem title="Form follow-up started" detail="Bright Dental entered the Growth workflow." time="2 hr" />
      </View>
    </View>
  );
}

function LeadsScreen({ onLeadPress }) {
  const [query, setQuery] = useState('');
  const filtered = leads.filter((lead) =>
    `${lead.name} ${lead.company} ${lead.source}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View>
      <Text style={styles.screenTitle}>Lead inbox</Text>
      <Text style={styles.screenCopy}>
        Review new opportunities, see what Cybiture already sent, and decide what needs a human touch.
      </Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search leads, company, or source"
        placeholderTextColor={colors.muted}
        style={styles.search}
      />
      <View style={styles.list}>
        {filtered.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onPress={() => onLeadPress(lead)} />
        ))}
      </View>
    </View>
  );
}

function AutomationsScreen() {
  return (
    <View>
      <Text style={styles.screenTitle}>Automations</Text>
      <Text style={styles.screenCopy}>
        Each workflow shows whether it is live, scheduled, or waiting for approval.
      </Text>
      <View style={styles.list}>
        {automations.map((automation) => (
          <View key={automation.name} style={styles.automationCard}>
            <View style={styles.automationTop}>
              <View>
                <Text style={styles.cardTitle}>{automation.name}</Text>
                <Text style={styles.cardMeta}>{automation.runs} runs this week</Text>
              </View>
              <StatusPill label={automation.status} tone={automation.tone} />
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(automation.runs * 5, 92)}%` }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function SetupScreen({ checklist, completedCount, onToggle }) {
  return (
    <View>
      <Text style={styles.screenTitle}>Client setup</Text>
      <Text style={styles.screenCopy}>
        Use this checklist during onboarding so the client knows exactly what is ready and what needs approval.
      </Text>
      <View style={styles.setupSummary}>
        <Text style={styles.setupNumber}>{completedCount}/5</Text>
        <View style={styles.setupTextWrap}>
          <Text style={styles.cardTitle}>Launch readiness</Text>
          <Text style={styles.cardMeta}>Finish the remaining tasks before going live.</Text>
        </View>
      </View>
      <View style={styles.list}>
        {checklist.map((item, index) => (
          <Pressable key={item.label} style={styles.checkRow} onPress={() => onToggle(index)}>
            <View style={[styles.checkCircle, item.done && styles.checkCircleDone]}>
              <Text style={[styles.checkMark, item.done && styles.checkMarkDone]}>
                {item.done ? '✓' : ''}
              </Text>
            </View>
            <Text style={[styles.checkLabel, item.done && styles.checkLabelDone]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function SupportScreen() {
  return (
    <View>
      <Text style={styles.screenTitle}>Support</Text>
      <Text style={styles.screenCopy}>
        A simple place for future clients to contact Cybiture, request changes, or schedule an optimization call.
      </Text>
      <View style={styles.supportCard}>
        <Text style={styles.supportTitle}>Need a workflow change?</Text>
        <Text style={styles.supportCopy}>
          Send the request here and Cybiture can update messages, follow-up timing, review links, or lead routing.
        </Text>
        <TextInput
          multiline
          placeholder="Example: change missed-call text to mention weekend appointments."
          placeholderTextColor={colors.muted}
          style={styles.supportInput}
        />
        <Pressable style={styles.primaryButton}>
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
      <View style={styles.leadTop}>
        <View>
          <Text style={styles.cardTitle}>{lead.name}</Text>
          <Text style={styles.cardMeta}>{lead.company}</Text>
        </View>
        <StatusPill label={lead.status} tone={lead.status === 'Needs review' ? 'amber' : 'green'} />
      </View>
      <Text style={styles.leadMessage}>{lead.message}</Text>
      <View style={styles.leadFooter}>
        <Text style={styles.sourcePill}>{lead.source}</Text>
        <Text style={styles.cardMeta}>{lead.time}</Text>
        <Text style={styles.leadValue}>{lead.value}</Text>
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
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function LeadModal({ lead, onClose }) {
  if (!lead) {
    return null;
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <View style={styles.leadTop}>
            <View>
              <Text style={styles.modalTitle}>{lead.name}</Text>
              <Text style={styles.cardMeta}>{lead.company} - {lead.id}</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Phone</Text>
            <Text style={styles.modalValue}>{lead.phone}</Text>
          </View>
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Source</Text>
            <Text style={styles.modalValue}>{lead.source}</Text>
          </View>
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Status</Text>
            <Text style={styles.modalValue}>{lead.status}</Text>
          </View>
          <View style={styles.noteBox}>
            <Text style={styles.modalLabel}>Automation note</Text>
            <Text style={styles.noteText}>{lead.message}</Text>
          </View>
          <View style={styles.noteBox}>
            <Text style={styles.modalLabel}>Next step</Text>
            <Text style={styles.noteText}>{lead.nextStep}</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={onClose}>
            <Text style={styles.primaryButtonText}>Mark reviewed</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  app: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomColor: colors.faint,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  logo: {
    height: 34,
    resizeMode: 'contain',
    width: 42,
  },
  brandName: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  brandSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 1,
  },
  livePill: {
    alignItems: 'center',
    backgroundColor: colors.greenSoft,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  liveDot: {
    backgroundColor: colors.green,
    borderRadius: 99,
    height: 8,
    width: 8,
  },
  liveText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 104,
  },
  heroCard: {
    backgroundColor: colors.navy,
    borderRadius: 28,
    overflow: 'hidden',
    padding: 24,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  kicker: {
    color: '#A7F3D0',
    fontSize: 13,
    fontWeight: '700',
  },
  heroStatus: {
    color: '#BFD7FF',
    fontSize: 13,
    fontWeight: '600',
  },
  heroTitle: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.9,
    lineHeight: 39,
  },
  heroCopy: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
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
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
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
  secondaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: 20,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    padding: 16,
  },
  statValue: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  statLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  statHelper: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 5,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionAction: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '800',
  },
  leadCard: {
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  leadCardFeatured: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FBFF',
  },
  leadTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  leadMessage: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
  },
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
  leadValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusGreen: {
    backgroundColor: colors.greenSoft,
  },
  statusAmber: {
    backgroundColor: colors.amberSoft,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextGreen: {
    color: '#047857',
  },
  statusTextAmber: {
    color: '#92400E',
  },
  timeline: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
  },
  timelineDot: {
    backgroundColor: colors.green,
    borderRadius: 99,
    height: 10,
    marginTop: 5,
    width: 10,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  screenTitle: {
    color: colors.ink,
    fontSize: 31,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  screenCopy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 8,
    marginBottom: 18,
  },
  search: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  list: {
    gap: 12,
  },
  automationCard: {
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  automationTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTrack: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    height: 9,
    marginTop: 18,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.blue,
    borderRadius: 999,
    height: 9,
  },
  setupSummary: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 24,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
    padding: 20,
  },
  setupNumber: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  setupTextWrap: {
    flex: 1,
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
  checkCircleDone: {
    backgroundColor: colors.greenSoft,
    borderColor: '#A7F3D0',
  },
  checkMark: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '800',
  },
  checkMarkDone: {
    color: '#047857',
  },
  checkLabel: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  checkLabelDone: {
    color: colors.text,
  },
  supportCard: {
    backgroundColor: colors.white,
    borderColor: colors.faint,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  supportTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  supportCopy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
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
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 14,
    padding: 18,
  },
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.faint,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    gap: 6,
    left: 0,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    position: 'absolute',
    right: 0,
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    paddingHorizontal: 5,
    paddingVertical: 11,
  },
  tabButtonActive: {
    backgroundColor: colors.blueSoft,
  },
  tabText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  tabTextActive: {
    color: colors.blueDark,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
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
  modalTitle: {
    color: colors.ink,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  closeButton: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  closeText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  modalRow: {
    borderBottomColor: colors.faint,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  modalLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  modalValue: {
    color: colors.ink,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  noteBox: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginTop: 14,
    padding: 16,
  },
  noteText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
});
