export const demoProfile = {
  id: 'demo-client',
  business_name: 'Cybiture Demo Client',
  plan_name: 'Growth',
};

export const demoLeads = [
  {
    id: 'L-1042',
    contact_name: 'Marcus Johnson',
    business_name: 'Johnson HVAC',
    source: 'Missed call',
    status: 'Needs review',
    value_cents: 185000,
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    phone: '(555) 012-4421',
    message: 'No answer after 6 PM. Auto text sent and customer replied with job details.',
    next_step: 'Confirm appointment window',
  },
  {
    id: 'L-1041',
    contact_name: 'Sarah Patel',
    business_name: 'Bright Dental',
    source: 'Website form',
    status: 'Followed up',
    value_cents: 42000,
    created_at: new Date(Date.now() - 21 * 60 * 1000).toISOString(),
    phone: '(555) 019-3388',
    message: 'Form came in from pricing page. Qualification email and SMS sequence started.',
    next_step: 'Wait for reply',
  },
  {
    id: 'L-1040',
    contact_name: 'Jamie Lee',
    business_name: 'Lee Realty',
    source: 'AI chat',
    status: 'Booked',
    value_cents: 320000,
    created_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    phone: '(555) 018-9021',
    message: 'Chat answered pricing questions and booked a consultation for tomorrow.',
    next_step: 'Prepare consult notes',
  },
  {
    id: 'L-1039',
    contact_name: 'Ana Ruiz',
    business_name: 'Ruiz Roofing',
    source: 'Review request',
    status: 'Completed',
    value_cents: 0,
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    phone: '(555) 013-7719',
    message: 'Review request sent after completed job. Customer clicked Google review link.',
    next_step: 'Monitor review',
  },
];

export const demoAutomations = [
  { id: 'A-1', name: 'Missed-call text-back', status: 'Live', runs_this_week: 18, tone: 'green' },
  { id: 'A-2', name: 'Website form follow-up', status: 'Live', runs_this_week: 11, tone: 'green' },
  { id: 'A-3', name: 'Review request sequence', status: 'Live', runs_this_week: 9, tone: 'green' },
  { id: 'A-4', name: 'Monthly lead report', status: 'Scheduled', runs_this_week: 1, tone: 'amber' },
];

export const demoChecklist = [
  { id: 'S-1', label: 'Business profile reviewed', is_done: true },
  { id: 'S-2', label: 'Lead sources connected', is_done: true },
  { id: 'S-3', label: 'Missed-call message approved', is_done: true },
  { id: 'S-4', label: 'Review request template approved', is_done: false },
  { id: 'S-5', label: 'Launch test completed', is_done: false },
];

export const demoActivity = [
  {
    id: 'E-1',
    title: 'Text-back sent',
    detail: 'Marcus Johnson replied with job details.',
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'E-2',
    title: 'Review request delivered',
    detail: 'Ana Ruiz clicked the Google review link.',
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'E-3',
    title: 'Form follow-up started',
    detail: 'Bright Dental entered the Growth workflow.',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

export function getDemoWorkspace() {
  return {
    profile: demoProfile,
    leads: demoLeads,
    automations: demoAutomations,
    checklist: demoChecklist,
    activity: demoActivity,
  };
}
