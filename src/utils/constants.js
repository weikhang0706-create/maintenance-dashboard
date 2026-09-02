export const PROPERTY_TYPES = ['Homestay', 'Co-living'];

export const PROPERTY_TYPE_COLORS = {
  Homestay: 'bg-indigo-100 text-indigo-700',
  'Co-living': 'bg-teal-100 text-teal-700',
};

export const CATEGORIES = ['Plumbing', 'Electrical', 'Air Con', 'Appliance', 'Structural', 'Painting', 'Leaking', 'Other'];

export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const STATUSES = ['Open', 'Assigned', 'In Progress', 'Done', 'Cancelled'];

// Days from today for auto due-date suggestion
export const PRIORITY_DUE_DAYS = {
  Urgent: 0,
  High: 2,
  Medium: 5,
  Low: 14,
};

// Condo list — update these with your actual properties
export const CONDO_LIST = [
  'Block A',
  'Block B',
  'Block C',
  'Common Area',
  'Roof / External',
];

export const STAFF_ROLES = ['Technician', 'Electrician', 'Plumber', 'HVAC Specialist', 'Cleaner', 'Supervisor', 'Other'];

// Fallback used only when staff master list hasn't loaded yet
export const STAFF_LIST = [
  'Ahmad Razif',
  'Siti Norehan',
  'Rajan Kumar',
  'Lim Wei Liang',
  'Norzahra Binti Aziz',
];

export const INVOICE_STATUSES = ['Unbilled', 'Invoiced', 'Paid', 'Charged'];

export const INVOICE_STATUS_COLORS = {
  Unbilled: 'bg-gray-100 text-gray-500',
  Invoiced: 'bg-blue-100 text-blue-700',
  Paid: 'bg-green-100 text-green-700',
  Charged: 'bg-purple-100 text-purple-700',
};

export const STATUS_COLORS = {
  Open: 'bg-blue-100 text-blue-800',
  Assigned: 'bg-purple-100 text-purple-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  Done: 'bg-green-100 text-green-800',
  Cancelled: 'bg-gray-100 text-gray-500',
};

export const PRIORITY_COLORS = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Urgent: 'bg-red-100 text-red-700',
};
