const demoForm = document.querySelector("#demo-lead-form");
const demoRows = document.querySelector("#demo-lead-rows");
const demoTimeline = document.querySelector("#demo-timeline");
const demoStatus = document.querySelector("#demo-current-status");
const demoUpdated = document.querySelector("#demo-last-updated");
const customerMessage = document.querySelector("#demo-customer-message");
const ownerMessage = document.querySelector("#demo-owner-message");
const followupMessage = document.querySelector("#demo-followup-message");
const reviewMessage = document.querySelector("#demo-review-message");
const leadName = document.querySelector("#demo-lead-name");
const leadDetail = document.querySelector("#demo-lead-detail");
const leadScore = document.querySelector("#demo-lead-score");

const fields = {
  name: document.querySelector("#demo-name"),
  phone: document.querySelector("#demo-phone"),
  email: document.querySelector("#demo-email"),
  service: document.querySelector("#demo-service"),
  source: document.querySelector("#demo-source"),
};

const metrics = {
  leads: document.querySelector("#demo-leads-count"),
  replies: document.querySelector("#demo-replies-count"),
  alerts: document.querySelector("#demo-alerts-count"),
  reviews: document.querySelector("#demo-reviews-count"),
};

const scenarios = {
  hvac: {
    name: "Marcus Reed",
    phone: "(214) 555-0184",
    email: "marcus@example.com",
    service: "AC repair quote",
    source: "Missed call",
  },
  dental: {
    name: "Sarah Patel",
    phone: "(469) 555-0136",
    email: "sarah@example.com",
    service: "New patient cleaning",
    source: "Website form",
  },
  realtor: {
    name: "Jamie Lewis",
    phone: "(972) 555-0169",
    email: "jamie@example.com",
    service: "Home valuation request",
    source: "Website chat",
  },
};

let demoState = {
  leads: [],
  activeLeadId: null,
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getTime = () =>
  new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

const getFirstName = (name) => name.trim().split(/\s+/)[0] || "there";

const getActiveLead = () => demoState.leads.find((lead) => lead.id === demoState.activeLeadId) || demoState.leads[0];

const getScore = (lead) => {
  let score = lead.source === "Missed call" ? 94 : 86;
  if (lead.followups > 0) score += 2;
  if (lead.booked) score += 3;
  if (lead.reviewSent) score += 1;
  return Math.min(score, 99);
};

const updateCount = (element, value) => {
  if (!element) return;
  element.textContent = String(value);
};

const createLead = () => {
  const source = fields.source.value;
  return {
    id: Date.now(),
    name: fields.name.value.trim() || "New Lead",
    phone: fields.phone.value.trim() || "(555) 000-0000",
    email: fields.email.value.trim() || "lead@example.com",
    service: fields.service.value.trim() || "Service request",
    source,
    status: "Auto-replied",
    followups: 0,
    booked: false,
    reviewSent: false,
    createdAt: getTime(),
    priority: source === "Missed call" ? "High priority" : "New lead",
  };
};

const buildTimeline = (lead) => {
  const events = [
    {
      label: "Lead captured",
      detail: `${lead.source} received at ${lead.createdAt}`,
      done: true,
    },
    {
      label: "Customer auto-reply sent",
      detail: `Text sent to ${getFirstName(lead.name)} within 60 seconds`,
      done: true,
    },
    {
      label: "Owner alert sent",
      detail: `${lead.name} added to the lead tracker`,
      done: true,
    },
  ];

  if (lead.followups > 0) {
    events.push({
      label: "Follow-up sent",
      detail: `${lead.followups} extra follow-up${lead.followups > 1 ? "s" : ""} queued`,
      done: true,
    });
  }

  if (lead.booked) {
    events.push({
      label: "Appointment marked booked",
      detail: "The lead is ready for the job calendar",
      done: true,
    });
  }

  if (lead.reviewSent) {
    events.push({
      label: "Review request sent",
      detail: "Review request prepared after job completion",
      done: true,
    });
  }

  return events;
};

const render = () => {
  const lead = getActiveLead();
  if (!lead) return;

  const totalFollowups = demoState.leads.reduce((sum, item) => sum + item.followups, 0);
  const totalReviews = demoState.leads.filter((item) => item.reviewSent).length;

  updateCount(metrics.leads, demoState.leads.length);
  updateCount(metrics.replies, demoState.leads.length + totalFollowups);
  updateCount(metrics.alerts, demoState.leads.length);
  updateCount(metrics.reviews, totalReviews);

  demoStatus.textContent = lead.status;
  demoUpdated.textContent = `Updated ${getTime()}`;
  leadName.textContent = lead.name;
  leadDetail.textContent = `${lead.service} from ${lead.source.toLowerCase()}`;
  leadScore.textContent = getScore(lead);

  demoRows.innerHTML = demoState.leads
    .map(
      (item) => `
        <tr class="${item.id === lead.id ? "is-active" : ""}">
          <td><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.phone)}</span></td>
          <td>${escapeHtml(item.service)}</td>
          <td>${escapeHtml(item.source)}</td>
          <td><mark>${escapeHtml(item.status)}</mark></td>
        </tr>
      `,
    )
    .join("");

  demoTimeline.innerHTML = buildTimeline(lead)
    .map(
      (event) => `
        <li class="${event.done ? "is-done" : ""}">
          <strong>${escapeHtml(event.label)}</strong>
          <span>${escapeHtml(event.detail)}</span>
        </li>
      `,
    )
    .join("");

  const firstName = getFirstName(lead.name);
  customerMessage.textContent = `Hi ${firstName}, thanks for reaching out. We received your request about ${lead.service}. Want to grab a time here? https://cal.com/cybiture`;
  ownerMessage.textContent = `New ${lead.priority}: ${lead.name} needs help with ${lead.service}. Source: ${lead.source}. Phone: ${lead.phone}.`;
  followupMessage.textContent = lead.reviewSent
    ? `Thanks again, ${firstName}. If everything went well, would you mind leaving a quick review?`
    : `Hi ${firstName}, just checking in on your ${lead.service} request. Do you still want help with this?`;
  reviewMessage.textContent = lead.reviewSent
    ? `Review request sent: "Thanks for choosing us, ${firstName}. Could you share your experience on Google?"`
    : `After the job is complete, Cybiture can send a review request automatically and track whether it was sent.`;
};

const addLead = () => {
  const lead = createLead();
  demoState.leads = [lead, ...demoState.leads].slice(0, 5);
  demoState.activeLeadId = lead.id;
  render();
};

document.querySelectorAll("[data-scenario]").forEach((button) => {
  button.addEventListener("click", () => {
    const scenario = scenarios[button.dataset.scenario];
    if (!scenario) return;

    Object.entries(scenario).forEach(([key, value]) => {
      fields[key].value = value;
    });
  });
});

document.querySelectorAll("[data-demo-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const lead = getActiveLead();
    if (!lead) return;

    const action = button.dataset.demoAction;

    if (action === "followup") {
      lead.followups += 1;
      lead.status = "Follow-up sent";
    }

    if (action === "booked") {
      lead.booked = true;
      lead.status = "Booked";
    }

    if (action === "review") {
      lead.reviewSent = true;
      lead.status = "Review requested";
    }

    if (action === "reset") {
      demoState = { leads: [], activeLeadId: null };
      Object.entries(scenarios.hvac).forEach(([key, value]) => {
        fields[key].value = value;
      });
      addLead();
      return;
    }

    render();
  });
});

if (demoForm) {
  demoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addLead();
  });

  addLead();
}
