-- Optional sample rows for a live client.
-- Replace CLIENT_PROFILE_ID with the id from public.client_profiles.

insert into public.leads
  (client_id, contact_name, business_name, phone, source, status, value_cents, message, next_step)
values
  ('CLIENT_PROFILE_ID', 'Marcus Johnson', 'Johnson HVAC', '(555) 012-4421', 'Missed call', 'Needs review', 185000, 'No answer after 6 PM. Auto text sent and customer replied with job details.', 'Confirm appointment window'),
  ('CLIENT_PROFILE_ID', 'Sarah Patel', 'Bright Dental', '(555) 019-3388', 'Website form', 'Followed up', 42000, 'Form came in from pricing page. Qualification email and SMS sequence started.', 'Wait for reply'),
  ('CLIENT_PROFILE_ID', 'Jamie Lee', 'Lee Realty', '(555) 018-9021', 'AI chat', 'Booked', 320000, 'Chat answered pricing questions and booked a consultation for tomorrow.', 'Prepare consult notes');

insert into public.activity_events
  (client_id, title, detail)
values
  ('CLIENT_PROFILE_ID', 'Text-back sent', 'Marcus Johnson replied with job details.'),
  ('CLIENT_PROFILE_ID', 'Review request delivered', 'Customer clicked the Google review link.'),
  ('CLIENT_PROFILE_ID', 'Form follow-up started', 'Bright Dental entered the Growth workflow.');

